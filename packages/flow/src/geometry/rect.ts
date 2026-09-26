import type { FlowNode, Point, Rect, Side, Size } from '../model/types'

/** Size assumed for a node that neither declares nor has a measured size. */
export const FALLBACK_NODE_SIZE: Readonly<Size> = Object.freeze({ width: 256, height: 96 })

/** Measured size, else declared size, else the fallback. */
export function sizeOf(node: Pick<FlowNode, 'size' | 'measured'>, fallback: Size = FALLBACK_NODE_SIZE): Size {
  const m = node.measured
  if (m && m.width > 0 && m.height > 0) return { width: m.width, height: m.height }
  const d = node.size
  if (d && d.width > 0 && d.height > 0) return { width: d.width, height: d.height }
  return { width: fallback.width, height: fallback.height }
}

/**
 * Absolute box of a node on the canvas. Positions of grouped nodes are
 * relative to their frame, so the frame chain is followed.
 */
export function absoluteRect(node: FlowNode, byId: ReadonlyMap<string, FlowNode>, fallback?: Size): Rect {
  let x = node.position.x
  let y = node.position.y
  let parent = node.parentId ? byId.get(node.parentId) : undefined
  const seen = new Set<string>([node.id])
  while (parent && !seen.has(parent.id)) {
    seen.add(parent.id)
    x += parent.position.x
    y += parent.position.y
    parent = parent.parentId ? byId.get(parent.parentId) : undefined
  }
  return { x, y, ...sizeOf(node, fallback) }
}

export function centreOf(r: Rect): Point {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}

/** Smallest box holding every rect, or null for none. */
export function enclosingRect(rects: readonly Rect[]): Rect | null {
  if (!rects.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const r of rects) {
    minX = Math.min(minX, r.x)
    minY = Math.min(minY, r.y)
    maxX = Math.max(maxX, r.x + r.width)
    maxY = Math.max(maxY, r.y + r.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function growRect(r: Rect, by: number): Rect {
  return { x: r.x - by, y: r.y - by, width: r.width + by * 2, height: r.height + by * 2 }
}

export function containsPoint(r: Rect, p: Point): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

/**
 * Point on a side of a box. `along` is 0..1 from the top (inline sides) or
 * from the start (block sides); 0.5 is the middle.
 */
export function pointOnSide(r: Rect, side: Side, along = 0.5): Point {
  const t = Math.min(1, Math.max(0, along))
  switch (side) {
    case 'start':
      return { x: r.x, y: r.y + r.height * t }
    case 'end':
      return { x: r.x + r.width, y: r.y + r.height * t }
    case 'top':
      return { x: r.x + r.width * t, y: r.y }
    case 'bottom':
      return { x: r.x + r.width * t, y: r.y + r.height }
  }
}

/**
 * Where the ray from the centre of `r` towards `towards` leaves the box, and
 * which side it crosses. Used by border-attached ("floating") connectors.
 */
export function exitPoint(r: Rect, towards: Point): { point: Point; side: Side } {
  const c = centreOf(r)
  const dx = towards.x - c.x
  const dy = towards.y - c.y
  if (dx === 0 && dy === 0) return { point: { x: r.x + r.width, y: c.y }, side: 'end' }
  const halfW = r.width / 2
  const halfH = r.height / 2
  // Scale factor at which the ray meets each pair of sides; the smaller wins.
  const tx = dx === 0 ? Infinity : halfW / Math.abs(dx)
  const ty = dy === 0 ? Infinity : halfH / Math.abs(dy)
  if (tx <= ty) {
    return { point: { x: c.x + dx * tx, y: c.y + dy * tx }, side: dx > 0 ? 'end' : 'start' }
  }
  return { point: { x: c.x + dx * ty, y: c.y + dy * ty }, side: dy > 0 ? 'bottom' : 'top' }
}
