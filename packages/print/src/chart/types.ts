import type { RenderizadorGrafico } from '@datatechsolutions/tympan-tokens'
import type { SpecCorrelacao } from './correlationTypes.ts'

/** One compared pair: `a` (e.g. "logo fora da zona") against `b` (e.g. "logo dentro da zona"). */
export interface LinhaPar {
  rotulo: string
  /** Second line under the label (e.g. "edição 2026-09"). */
  nota?: string
  a: number
  b: number
  /** Draw this row in the highlight colour (the number the text points at). */
  destaque?: boolean
  /** Number of the callout that explains this row ("1", "2"…), drawn beside it. */
  marca?: string
  /** Number from the local backfill lake, not published: tagged "lake local" and drawn dashed. */
  local?: boolean
}

export interface AnotacaoGrafico {
  /** Index of the row (or point) the note explains. */
  linha: number
  texto: string
  /**
   * The same note as a short handwritten headline ("nos 17 cortes, 731 × 293"), for styles that write their
   * callouts inside the chart (caderno, balloons, FT's leader lines); the long `texto` stays for the others.
   */
  curta?: string
}

interface Base {
  /** Figure title; optional (a figure inside a titled Panel needs none). The accessible name stays required via `alt` or `achado`. */
  titulo?: string
  subtitulo?: string
  /** What the figure shows, in one sentence (GraficoMetodo's `alt` takes precedence). */
  achado?: string
  anotacoes?: AnotacaoGrafico[]
}

/** Dumbbell chart: hollow point = `a`, filled point = `b`, on one linear axis. */
export interface SpecHalteres extends Base {
  tipo: 'halteres'
  escala: [number, number]
  linhas: LinhaPar[]
  rotuloA: string
  rotuloB: string
  /** Unit of the axis (printed at its end). */
  unidade?: string
  /** Print the warning "o eixo não começa no zero". */
  eixoNaoComecaNoZero?: boolean
  /** Reference lines (e.g. "metade" at 50). */
  referencias?: Array<{ valor: number; rotulo: string }>
  /** Value labels: 'auto' (default: a label that would hit the row labels goes above its point), 'dentro' (always above), 'fora' (always beside). */
  rotuloValor?: 'auto' | 'dentro' | 'fora'
}

/**
 * Horizontal bars from zero. Either one series (`barras`) or pairs (`linhas`,
 * with `a` drawn above `b` in each row and `rotuloA`/`rotuloB` in the key).
 */
export interface SpecBarras extends Base {
  tipo: 'barras'
  escala: [number, number]
  unidade?: string
  /** Folding bar (style shape 'ziguezague'): units per full line; default the top of `escala` (no fold). */
  dobra?: number
  /** `categoria`: key for `cores` / the theme's `cor.categorias` (default: the bar's label). */
  barras?: Array<{ rotulo: string; valor: number; destaque?: boolean; nota?: string; categoria?: string }>
  /** Colours by category key (official party colours…) for single-series bars; else the theme's `cor.categorias`. */
  cores?: Record<string, string | { cor: string; rotulo?: string }>
  /** Legend of the colours by key; default on when colours by key apply. */
  legenda?: boolean
  /**
   * Compact single-series bars: no axis, the value with its unit at the tip ("36,0%"), a fixed height per bar
   * (`alturaBarra`, mm, default 3.4) so a list of parties never grows past its box.
   */
  compacto?: boolean
  alturaBarra?: number
  /**
   * Orientation of single-series bars, over the style's shape: 'horizontal' draws the compact horizontal bars
   * (value with its unit at the tip, colours by key). Single-series bars with `cores` are horizontal unless
   * 'vertical' is asked.
   */
  orientacao?: 'horizontal' | 'vertical'
  /** Decimals of the values, fixed (compact bars). */
  casas?: number
  linhas?: LinhaPar[]
  rotuloA?: string
  rotuloB?: string
}

/** Values over a numeric x axis (years), with the law's date as an event and shaded periods. */
export interface SpecSerie extends Base {
  tipo: 'serie'
  /** y domain. */
  escala: [number, number]
  /** x domain. */
  eixoX: [number, number]
  unidade?: string
  /** Join the points with a line (false: only the years that have a number). */
  interpolar?: boolean
  pontos: Array<{ x: number; y: number; rotulo?: string; chamada?: number }>
  eventos?: Array<{ x: number; rotulo: string; nota?: string }>
  faixas?: Array<{ de: number; ate: number; rotulo: string }>
}

/**
 * Counting chart (Isotype): one icon = `unidade`; the last icon is cut to the
 * fraction. Either one series (`grupos`) or pairs (`linhas` with `rotuloA`/`rotuloB`).
 */
export interface SpecContagem extends Base {
  tipo: 'contagem'
  unidade: number
  grupos?: Array<{ rotulo: string; valor: number; destaque?: boolean; nota?: string }>
  linhas?: LinhaPar[]
  rotuloA?: string
  rotuloB?: string
  /** What one icon stands for, for the key ("dias"). */
  rotuloUnidade?: string
  icone?: 'casa' | 'pessoa' | 'quadrado'
}

/** Illustrative method diagram, with no real data (labelled as such). */
export interface SpecEsquema extends Base {
  tipo: 'esquema'
  nome: 'descontinuidade' | 'densidade-no-corte' | 'linhas-de-corte'
  /** Labels, in the order each diagram documents. */
  rotulos?: string[]
}

/** Dot and whisker: an estimate and its interval per row (e.g. bootstrap 95% CI), optional groups and per-sample ticks. */
export interface SpecIntervalo extends Base {
  tipo: 'intervalo'
  escala: [number, number]
  unidade?: string
  /** Decimals of the printed estimates and axis labels, fixed (trailing zeros kept: 51,0). Default 1. */
  casas?: number
  /** Legend of the colours by key (`cores`); default on when `cores` is given. */
  legenda?: boolean
  /**
   * Number printed for a samples-only row without `valor`: the samples' mean (default), their median, or none.
   * The derived number is printed at the row's end like an estimate (no dot is drawn for it).
   */
  resumoAmostras?: 'media' | 'mediana' | 'nenhum'
  /** Column name of the interval in the data table (default "IC"). */
  rotuloIntervalo?: string
  linhas?: LinhaIntervalo[]
  grupos?: Array<{ titulo?: string; nota?: string; linhas: LinhaIntervalo[] }>
  /** Colours by key (`categoria` or the label). */
  cores?: Record<string, string | { cor: string; rotulo?: string }>
}

export interface LinhaIntervalo {
  rotulo: string
  /** The estimate (a dot); optional in samples-only rows. */
  valor?: number
  /** The interval (whiskers); without it the row shows its samples as dots (samples-only mode). */
  intervalo?: [number, number]
  destaque?: boolean
  /** Per-sample (seed) values: small ticks over the row, or dots when the row has no interval. */
  amostras?: number[]
  categoria?: string
}

export type GraficoSpec = SpecHalteres | SpecBarras | SpecSerie | SpecContagem | SpecEsquema | SpecCorrelacao | SpecIntervalo

export type { SpecDispersao, SpecSimpson, SpecMatrizCorrelacao, SpecAntesDepoisControle, SpecCorrelacao, PontoMunicipio, EixoDispersao, DestaqueMunicipio } from './correlationTypes.ts'

export type { RenderizadorGrafico }
