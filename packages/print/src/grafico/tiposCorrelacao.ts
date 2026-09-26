// Specs of the correlation charts: a scatter of municipalities, the same
// scatter with the overall and within-group lines (Simpson's paradox), a
// correlation matrix and the raw × controlled coefficient.

/** One municipality in a scatter. `x`/`y` are the data; the rest identifies and sizes the point. */
export interface PontoMunicipio {
  x: number
  y: number
  /** IBGE code (7 digits). */
  ibge?: number
  municipio?: string
  uf?: string
  /** Group for Simpson's lines (UF, region…). */
  grupo?: string
  /** Population, for points sized by population (area ∝ population). */
  pop?: number | null
  capital?: boolean
}

export interface EixoDispersao {
  /** Axis title ("IDEB anos iniciais"). */
  rotulo: string
  /** Unit, printed after the title ("R$ por matrícula, 2024"). */
  unidade?: string
  /** Domain; defaults to nice bounds around the data (powers of ten on a log axis). */
  dominio?: [number, number]
  /** Logarithmic axis. The trend line and Pearson's r are computed on ln of a log axis. */
  log?: boolean
}

/** A municipality drawn and named on top of the cloud, found by IBGE code or by name. */
export interface DestaqueMunicipio {
  ibge?: number
  municipio?: string
  /** Label; defaults to "Município/UF". */
  rotulo?: string
}

interface BaseCorrelacao {
  titulo: string
  subtitulo?: string
  /** The finding in one sentence (accessible name). Without it, the chart writes one from the coefficients. */
  achado?: string
  /** Path of the data file the points came from (figuras/dados/<id>.json); provenance only, not read here. */
  dados?: string
  /** Columns of that file used as x, y or group (e.g. { y: 'y2' }); read by the loader that fills `pontos`, not here. */
  campos?: { x?: string; y?: string; grupo?: string }
  /** Plot height in mm (default: about two thirds of the width). */
  altura?: number
}

/** Scatter of municipalities with a least-squares line and the correlation written on it. */
export interface SpecDispersao extends BaseCorrelacao {
  tipo: 'dispersao'
  pontos: PontoMunicipio[]
  x: EixoDispersao
  y: EixoDispersao
  /** Coefficient written on the chart (default Pearson, in the chart's space). */
  metodo?: 'pearson' | 'spearman'
  /** Coefficient published with the data; the chart recomputes it and prints a warning if they differ. */
  coeficiente?: number
  /** Name of the set the coefficient refers to ("Brasil", "sem capitais"…). */
  rotuloCoeficiente?: string
  /** Draw the least-squares line (default true). */
  tendencia?: boolean
  /** Point area proportional to population. */
  tamanhoPorPopulacao?: boolean
  destaques?: DestaqueMunicipio[]
  /** Ring the state capitals (legend "capitais"). */
  destacarCapitais?: boolean
  /** Many points: 'hexbin' counts them in hexagons; 'pontos' draws each one translucent; 'auto' picks by n. */
  densidade?: 'auto' | 'pontos' | 'hexbin'
  /** On a log x axis, values ≤ 0 go to a strip left of the axis with this label ("sem área"). */
  rotuloZeroX?: string
}

/** The same scatter with the overall line and one line per group: the sign can flip (Simpson's paradox). */
export interface SpecSimpson extends BaseCorrelacao {
  tipo: 'simpson'
  pontos: PontoMunicipio[]
  x: EixoDispersao
  y: EixoDispersao
  /** Name of the whole set ("Brasil"). */
  rotuloGeral?: string
  /** Name of the within-group correlation ("dentro das UFs"). */
  rotuloDentro?: string
  /** What a group is ("UF", "região"). */
  rotuloGrupo?: string
  /** Groups drawn in the highlight colour, with their line labelled. */
  destaquesGrupo?: string[]
  /** Draw each group's mean (and the between-group r in the key). */
  medias?: boolean
  /** Groups with fewer points get no line (default 10). */
  minimoPorGrupo?: number
  /** Coefficients published with the data (overall, pooled within groups, between group means); checked against the points. */
  coeficienteGeral?: number
  coeficienteDentro?: number
  coeficienteEntre?: number
}

/** Matrix of correlation coefficients between indicators: diverging colour, grey at zero, the number in every cell. */
export interface SpecMatrizCorrelacao extends BaseCorrelacao {
  tipo: 'matriz-correlacao'
  indicadores: string[]
  /** valores[i][j] = r between indicator i and j (symmetric, 1 on the diagonal). */
  valores: number[][]
  /** Pairs behind each coefficient (for the table). */
  n?: number[][]
  /** 'inferior' (default): only the lower triangle, without the diagonal. */
  triangulo?: 'inferior' | 'completa'
  /** Method, for the key ("Pearson, pares completos"). */
  metodo?: string
  /** Decimals written in the cells (default 2). */
  casas?: number
  /** Cells to outline, as [row, column] of `valores`. */
  destaques?: Array<[number, number]>
}

/** Raw coefficient against the controlled one (e.g. 0,536 in the country → 0,236 within the UFs). */
export interface SpecAntesDepoisControle extends BaseCorrelacao {
  tipo: 'antes-depois-controle'
  linhas: Array<{ rotulo: string; nota?: string; bruto: number; controlado: number; destaque?: boolean }>
  /** Key of the hollow point ("sem controle"). */
  rotuloBruto: string
  /** Key of the filled point ("dentro das UFs"). */
  rotuloControlado: string
  /** Axis domain (default [−1, 1]). */
  escala?: [number, number]
  /** What the numbers are ("r de Pearson"). */
  medida?: string
}

export type SpecCorrelacao = SpecDispersao | SpecSimpson | SpecMatrizCorrelacao | SpecAntesDepoisControle
