// Crosses from the input description to the drawing model (see types.ts).
import { spanOf, toNumber } from './chartMath'
import type { ChartFigure, ChartForm, ChartLayer, ChartRecord, Glyph, Plot, Stroke, Track } from './types'

const GLYPH_CYCLE: readonly Glyph[] = ['dot', 'box', 'wedge', 'rhomb']
const DASH_CYCLE: readonly string[] = ['6 4', '2 3', '10 3 2 3', '4 4']
const PAINT = /^(?:--ty-)?(chart|categorical)-([1-8])$/

/** Drawing mode per kind: bars and histograms stand on the floor, histogram bins touch. */
const STROKES: Record<ChartForm, Stroke> = {
  trend: { mode: 'path', fill: false },
  band: { mode: 'path', fill: true },
  columns: { mode: 'block', flush: false },
  bins: { mode: 'block', flush: true },
}

/** Resolved token colour; unknown tokens fall back to the chart cycle. */
function hueFor(layer: ChartLayer, position: number): string {
  const hit = layer.tone ? PAINT.exec(layer.tone) : null
  return hit ? `var(--ty-${hit[1]}-${hit[2]})` : `var(--ty-chart-${(position % 8) + 1})`
}

/** Category text of a record. */
export function stopLabel(record: ChartRecord, field: string): string {
  const raw = record[field]
  return raw == null ? '' : String(raw)
}

export function toPlot(figure: ChartFigure): Plot {
  const stops = figure.records.map((record) => stopLabel(record, figure.across.field))
  const tracks: Track[] = figure.layers.map((layer, position) => ({
    label: layer.field,
    hue: hueFor(layer, position),
    dash: layer.projected ? DASH_CYCLE[position % DASH_CYCLE.length] : undefined,
    glyph: GLYPH_CYCLE[position % GLYPH_CYCLE.length]!,
    readings: figure.records.map((record) => toNumber(record[layer.field])),
  }))
  const known = tracks.flatMap((t) => t.readings.filter((r): r is number => r !== null))
  const pins = (figure.notes ?? []).flatMap((note) => {
    const slot = stops.indexOf(String(note.at))
    return slot < 0 ? [] : [{ slot, text: note.text }]
  })
  return {
    kind: figure.form,
    stroke: STROKES[figure.form],
    stops,
    tracks,
    pins,
    span: spanOf(known, figure.up?.bounds, figure.form !== 'trend'),
    unit: figure.up?.unit,
    stopsHeader: figure.across.caption,
  }
}
