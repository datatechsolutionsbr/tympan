// Two vocabularies live here (spec: wave-2/chart.md).
//
// 1. The *figure* hosts and agents send (`ChartFigure`), with its own names;
//    the mapping from the spec's names is in docs (chart.md, "Renamed in
//    implementation").
// 2. The *drawing model* (`Plot`) the component actually works on: plain
//    numbers per track, resolved paint, placed pins and a resolved value span.
//    Only `toPlot()` (plot.ts) crosses from one to the other.

/* ---------------------------------------------------------------- input -- */

/**
 * Figure forms (spec names in brackets): `trend` [line], `band` [area],
 * `columns` [bar], `bins` [histogram].
 */
export type ChartForm = 'trend' | 'band' | 'columns' | 'bins'

/** One measured layer. `field` is both its label and the record key read. */
export interface ChartLayer {
  field: string
  /** Paint token name: `chart-3`, `categorical-5`. */
  tone?: string
  /** Estimates or projections: drawn with a dash pattern. */
  projected?: boolean
}

/** One record: the category field plus one value per layer field. */
export type ChartRecord = Record<string, string | number | null | undefined>

/** A labelled rule at one category. */
export interface ChartNote {
  at: string | number
  text: string
}

/** The declarative figure a Chart draws (renamed from the spec's chart description). */
export interface ChartFigure {
  form: ChartForm
  /** Visible name of the figure. */
  heading: string
  /** Secondary line under the heading. */
  aside?: string
  /** Reading sentence under the heading (design direction §5). */
  reading?: string
  /** The category dimension: which record field, and its caption. */
  across: { field: string; caption?: string }
  /** The value dimension: caption, unit and optional fixed bounds [low, high]. */
  up?: { caption?: string; unit?: string; bounds?: [number, number] }
  layers: ChartLayer[]
  records: ChartRecord[]
  notes?: ChartNote[]
}

/** Which face of the figure is shown. */
export type ChartFace = 'drawing' | 'table'

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
  kind: ChartForm
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
