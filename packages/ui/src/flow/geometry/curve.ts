import type { Point, Side } from '../model/types'

/** An end of a connector: where it touches the node and which way that side faces. */
export interface CurveEnd {
  point: Point
  side: Side
}

export interface CurveGeometry {
  /** SVG path data (one cubic segment). */
  d: string
  /** Point halfway along the curve parameter, for labels and controls. */
  mid: Point
  /** Unit direction of travel where the curve meets the target. */
  arrival: Point
}

const OUTWARD: Record<Side, Point> = {
  start: { x: -1, y: 0 },
  end: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * A single cubic segment that leaves `from` perpendicular to its side and
 * arrives at `to` perpendicular to its side. The handle length grows with the
 * distance between the ends, within bounds, so short hops stay tight and long
 * ones stay smooth.
 */
export function connectorCurve(from: CurveEnd, to: CurveEnd): CurveGeometry {
  const span = Math.hypot(to.point.x - from.point.x, to.point.y - from.point.y)
  const reach = Math.min(160, Math.max(24, span * 0.45))
  const a = OUTWARD[from.side]
  const b = OUTWARD[to.side]
  const c1 = { x: from.point.x + a.x * reach, y: from.point.y + a.y * reach }
  const c2 = { x: to.point.x + b.x * reach, y: to.point.y + b.y * reach }
  // Bernstein weights at t = 1/2 are 1/8, 3/8, 3/8, 1/8.
  const mid = {
    x: (from.point.x + 3 * c1.x + 3 * c2.x + to.point.x) / 8,
    y: (from.point.y + 3 * c1.y + 3 * c2.y + to.point.y) / 8,
  }
  const ax = to.point.x - c2.x
  const ay = to.point.y - c2.y
  const len = Math.hypot(ax, ay) || 1
  const d = `M${round(from.point.x)},${round(from.point.y)} C${round(c1.x)},${round(c1.y)} ${round(c2.x)},${round(c2.y)} ${round(to.point.x)},${round(to.point.y)}`
  return { d, mid, arrival: { x: ax / len, y: ay / len } }
}

/** Side a free pointer end should be treated as facing, given where the line comes from. */
export function facingSide(from: Point, to: Point): Side {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'start' : 'end'
  return dy >= 0 ? 'top' : 'bottom'
}
