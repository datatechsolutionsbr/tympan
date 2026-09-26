// Pure geometry for Chart: value extraction, domain, ticks and label thinning.
import type { ChartSpec } from './types'

/** A datum value as a number, or null when it is missing or not numeric. */
export function toNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Every numeric value of every declared series. */
export function collectValues(spec: Pick<ChartSpec, 'data' | 'series'>): number[] {
  const out: number[] = []
  for (const row of spec.data) {
    for (const s of spec.series) {
      const v = toNumber(row[s.name])
      if (v !== null) out.push(v)
    }
  }
  return out
}

/**
 * Value domain: an explicit domain wins; otherwise min..max with a 5 % margin
 * (bars and histograms keep zero as a floor when all values are positive);
 * a flat series gets a symmetric margin; no data gives [0, 1].
 */
export function valueDomain(spec: Pick<ChartSpec, 'data' | 'series' | 'yAxis' | 'type'>): [number, number] {
  const fixed = spec.yAxis.domain
  if (fixed && fixed.length === 2 && fixed[0] < fixed[1]) return [fixed[0], fixed[1]]
  const values = collectValues(spec)
  if (values.length === 0) return [0, 1]
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.1 || 1
    return [lo - pad, hi + pad]
  }
  const pad = (hi - lo) * 0.05
  const anchored = spec.type === 'bar' || spec.type === 'histogram' || spec.type === 'area'
  lo = anchored && lo >= 0 ? 0 : lo - pad
  hi = hi + pad
  return [lo, hi]
}

/** About `count` evenly spaced ticks on 1-2-5 steps covering the domain. */
export function niceTicks([lo, hi]: [number, number], count = 5): number[] {
  const span = hi - lo
  if (!(span > 0)) return [lo]
  const raw = span / Math.max(1, count - 1)
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= raw) ?? raw
  const first = Math.ceil(lo / step) * step
  const ticks: number[] = []
  for (let t = first; t <= hi + step * 1e-9; t += step) ticks.push(Number(t.toPrecision(12)))
  return ticks
}

/** Maps [d0, d1] to [r0, r1]. */
export function linear(domain: [number, number], range: [number, number]): (v: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  const k = (r1 - r0) / (d1 - d0 || 1)
  return (v) => r0 + (v - d0) * k
}

/** Indices of category labels to draw so neighbours never overlap. */
export function visibleLabelIndices(count: number, plotWidth: number, minGap = 56): number[] {
  if (count <= 0) return []
  const every = Math.max(1, Math.ceil((count * minGap) / Math.max(plotWidth, 1)))
  const keep: number[] = []
  for (let i = 0; i < count; i += every) keep.push(i)
  return keep
}

/** Runs of consecutive defined points; a missing value breaks the line. */
export function segments<T>(points: Array<T | null>): T[][] {
  const runs: T[][] = []
  let current: T[] = []
  for (const p of points) {
    if (p === null) {
      if (current.length) runs.push(current)
      current = []
    } else current.push(p)
  }
  if (current.length) runs.push(current)
  return runs
}
