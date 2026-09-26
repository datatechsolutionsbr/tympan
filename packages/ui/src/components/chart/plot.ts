// Crosses from the input description to the drawing model (see types.ts).
import { spanOf, toNumber } from './chartMath'
import type { ChartKind, ChartRow, ChartSeries, ChartSpec, Glyph, Plot, Stroke, Track } from './types'

const GLYPH_CYCLE: readonly Glyph[] = ['dot', 'box', 'wedge', 'rhomb']
const DASH_CYCLE: readonly string[] = ['6 4', '2 3', '10 3 2 3', '4 4']
const PAINT = /^(?:--fk-)?(chart|categorical)-([1-8])$/

/** Drawing mode per kind: bars and histograms stand on the floor, histogram bins touch. */
const STROKES: Record<ChartKind, Stroke> = {
  line: { mode: 'path', fill: false },
  area: { mode: 'path', fill: true },
  bar: { mode: 'block', flush: false },
  histogram: { mode: 'block', flush: true },
}

/** Resolved token colour; unknown tokens fall back to the chart cycle. */
function hueFor(declared: ChartSeries, position: number): string {
  const hit = declared.colorToken ? PAINT.exec(declared.colorToken) : null
  return hit ? `var(--fk-${hit[1]}-${hit[2]})` : `var(--fk-chart-${(position % 8) + 1})`
}

/** Category text of a row: the declared key, falling back to `x`. */
export function stopLabel(row: ChartRow, key: string): string {
  const raw = row[key] ?? row.x
  return raw == null ? '' : String(raw)
}

export function toPlot(spec: ChartSpec): Plot {
  const stops = spec.data.map((row) => stopLabel(row, spec.xAxis.key))
  const tracks: Track[] = spec.series.map((declared, position) => ({
    label: declared.name,
    hue: hueFor(declared, position),
    dash: declared.dashed ? DASH_CYCLE[position % DASH_CYCLE.length] : undefined,
    glyph: GLYPH_CYCLE[position % GLYPH_CYCLE.length]!,
    readings: spec.data.map((row) => toNumber(row[declared.name])),
  }))
  const known = tracks.flatMap((t) => t.readings.filter((r): r is number => r !== null))
  const pins = (spec.annotations ?? []).flatMap((note) => {
    const slot = stops.indexOf(String(note.x))
    return slot < 0 ? [] : [{ slot, text: note.label }]
  })
  return {
    kind: spec.type,
    stroke: STROKES[spec.type],
    stops,
    tracks,
    pins,
    span: spanOf(known, spec.yAxis.domain, spec.type !== 'line'),
    unit: spec.yAxis.unit,
    stopsHeader: spec.xAxis.label,
  }
}
