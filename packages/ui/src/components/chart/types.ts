// Two vocabularies live here (spec: wave-2/chart.md; spec names are mapped in
// its "Renamed in implementation" section):
//   figure        what hosts and agents send (ChartFigure);
//   drawing model what the component works on (Plot), built by toPlot().
// Shapes are composed from ambient descriptor tables and two helpers, so the
// allowed values and the required/optional split are each written once.

/** `R` required, `O` optional. */
type Shape<R, O = unknown> = R & { [K in keyof O]?: O[K] }
/** Low and high end of a numeric range. */
type Ends = [low: number, high: number]

declare const figureForms: readonly ['trend', 'band', 'columns', 'bins']
declare const figureFaces: readonly ['drawing', 'table']
declare const markerOutlines: readonly ['dot', 'box', 'wedge', 'rhomb']

/* ---------------------------------------------------------------- input -- */

/** `trend` [line], `band` [area], `columns` [bar], `bins` [histogram]. */
export type ChartForm = (typeof figureForms)[number]

/** Which face of the figure is shown. */
export type ChartFace = (typeof figureFaces)[number]

/** One record: the category field plus one value per layer field. */
export type ChartRecord = Record<string, string | number | null | undefined>

/**
 * One measured layer: `field` is its label and the record key read; `tone` a
 * paint token (`chart-3`, `categorical-5`); `projected` draws it dashed.
 */
export type ChartLayer = Shape<{ field: string }, { tone: string; projected: boolean }>

/** A labelled rule at one category. */
export type ChartNote = Shape<{ at: string | number; text: string }>

/** The category dimension (record field and caption). */
type Across = Shape<{ field: string }, { caption: string }>
/** The value dimension (caption, unit, fixed bounds). */
type Up = Shape<unknown, { caption: string; unit: string; bounds: Ends }>

/**
 * The declarative figure a Chart draws: `heading` names it, `aside` is the
 * secondary line, `reading` the finding sentence (design direction §5).
 */
export type ChartFigure = Shape<
  { form: ChartForm; heading: string; across: Across; layers: ChartLayer[]; records: ChartRecord[] },
  { aside: string; reading: string; up: Up; notes: ChartNote[] }
>

/* -------------------------------------------------------- drawing model -- */

/** A finite number, or `null` for a gap. */
export type Reading = number | null

/** Marker outline, cycled per track so colour never carries identity alone. */
export type Glyph = (typeof markerOutlines)[number]

/** How tracks are drawn, decided once from the form. */
export type Stroke = Shape<{ mode: 'path'; fill: boolean }> | Shape<{ mode: 'block'; flush: boolean }>

/** One drawn series: declared label, token colour, optional dash, readings. */
export type Track = Shape<{ label: string; hue: string; glyph: Glyph; readings: Reading[] }, { dash: string }>

/** A reference line at an existing category slot. */
export type Pin = Shape<{ slot: number; text: string }>

/** The resolved drawing: categories (`stops`), tracks, pins and value span. */
export type Plot = Shape<
  { kind: ChartForm; stroke: Stroke; stops: string[]; tracks: Track[]; pins: Pin[]; span: Ends },
  { unit: string; stopsHeader: string }
>
