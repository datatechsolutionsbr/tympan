// Two vocabularies live here (spec: wave-2/chart.md).
//
// 1. The *input description* hosts and agents send. Its field names are the
//    host contract fixed by the spec, so they are declared once, as small
//    pieces composed into `ChartSpec`.
// 2. The *drawing model* (`Plot`) the component actually works on: plain
//    numbers per track, resolved paint, placed pins and a resolved value span.
//    Only `toPlot()` (plot.ts) crosses from one to the other.

/* ---------------------------------------------------------------- input -- */

/** Kinds that join the readings of a track with a path. */
type PathKind = 'line' | 'area'
/** Kinds that stand a block on the floor for every reading. */
type BlockKind = 'bar' | 'histogram'

export type ChartKind = PathKind | BlockKind

/** One declared series: name, optional paint token, optional dashed stroke. */
export interface ChartSeries {
  name: string
  /** A chart or categorical token name: `chart-3`, `categorical-5`. */
  colorToken?: string
  /** Estimates or projections. */
  dashed?: boolean
}

/** One row: the category plus one cell per series name. */
export type ChartRow = { x: string | number } & Record<string, string | number | null | undefined>

type CaptionPart = {
  title: string
  subtitle?: string
  /** Finding sentence under the title (design direction §5). */
  finding?: string
}

type AxisPart = {
  xAxis: { key: string; label?: string }
  yAxis: { label?: string; unit?: string; domain?: [number, number] }
}

type ContentPart = {
  series: ChartSeries[]
  data: ChartRow[]
  annotations?: Array<{ x: string | number; label: string }>
}

/** The declarative description a Chart renders. */
export type ChartSpec = { type: ChartKind } & CaptionPart & AxisPart & ContentPart

export type ChartView = 'chart' | 'table'

/* -------------------------------------------------------- drawing model -- */

/** A reading: a finite number, or `null` for a gap. */
export type Reading = number | null

/** Marker outline, cycled per track so colour never carries identity alone. */
export type Glyph = 'dot' | 'box' | 'wedge' | 'rhomb'

/** How the tracks are drawn, decided once from the kind. */
export type Stroke = { mode: 'path'; fill: boolean } | { mode: 'block'; flush: boolean }

export interface Track {
  /** Series name as declared (also its column header). */
  label: string
  /** CSS colour expression, always a design token. */
  hue: string
  /** Dash pattern for projections, else undefined. */
  dash?: string
  glyph: Glyph
  readings: Reading[]
}

/** A reference line at a category, only when the category exists. */
export interface Pin {
  slot: number
  text: string
}

export interface Plot {
  kind: ChartKind
  stroke: Stroke
  /** Category labels, one per row, in data order. */
  stops: string[]
  tracks: Track[]
  pins: Pin[]
  /** Resolved value span [low, high]. */
  span: [number, number]
  unit?: string
  /** Header of the category column in the table view. */
  stopsHeader?: string
}
