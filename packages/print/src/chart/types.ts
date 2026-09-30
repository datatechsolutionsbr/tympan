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
}

interface Base {
  titulo: string
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
  barras?: Array<{ rotulo: string; valor: number; destaque?: boolean; nota?: string }>
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

export type GraficoSpec = SpecHalteres | SpecBarras | SpecSerie | SpecContagem | SpecEsquema | SpecCorrelacao

export type { SpecDispersao, SpecSimpson, SpecMatrizCorrelacao, SpecAntesDepoisControle, SpecCorrelacao, PontoMunicipio, EixoDispersao, DestaqueMunicipio } from './correlationTypes.ts'

export type { RenderizadorGrafico }
