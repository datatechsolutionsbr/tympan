// Arithmetic behind "align", "distribute" and "group" of SelectionArrange.
// Works on plain boxes keyed by id; callers map results back onto nodes.

import type { Point, Rect } from '../model/types'
import { enclosingRect } from './rect'

export type AlignEdge = 'left' | 'right' | 'top' | 'bottom' | 'centerHorizontal' | 'centerVertical'
export type DistributeAxis = 'horizontal' | 'vertical'

export interface Placed {
  id: string
  rect: Rect
}

/** New top-left corners after aligning the boxes along one edge or centre line. */
export function alignBoxes(boxes: readonly Placed[], edge: AlignEdge): Map<string, Point> {
  const moved = new Map<string, Point>()
  if (boxes.length < 2) return moved
  const lefts = boxes.map((b) => b.rect.x)
  const tops = boxes.map((b) => b.rect.y)
  const rights = boxes.map((b) => b.rect.x + b.rect.width)
  const bottoms = boxes.map((b) => b.rect.y + b.rect.height)
  const cxs = boxes.map((b) => b.rect.x + b.rect.width / 2)
  const cys = boxes.map((b) => b.rect.y + b.rect.height / 2)
  const midX = (Math.min(...cxs) + Math.max(...cxs)) / 2
  const midY = (Math.min(...cys) + Math.max(...cys)) / 2
  for (const { id, rect } of boxes) {
    let { x, y } = rect
    if (edge === 'left') x = Math.min(...lefts)
    if (edge === 'right') x = Math.max(...rights) - rect.width
    if (edge === 'top') y = Math.min(...tops)
    if (edge === 'bottom') y = Math.max(...bottoms) - rect.height
    // "Centre horizontally" lines centres up on a vertical line (shared x).
    if (edge === 'centerHorizontal') x = midX - rect.width / 2
    if (edge === 'centerVertical') y = midY - rect.height / 2
    moved.set(id, { x, y })
  }
  return moved
}

/**
 * Keeps the first and last box (by position on the axis) in place and gives
 * every neighbouring pair the same gap.
 */
export function distributeBoxes(boxes: readonly Placed[], axis: DistributeAxis): Map<string, Point> {
  const moved = new Map<string, Point>()
  if (boxes.length < 3) return moved
  const key = axis === 'horizontal' ? 'x' : 'y'
  const extent = axis === 'horizontal' ? 'width' : 'height'
  const sorted = [...boxes].sort((a, b) => a.rect[key] - b.rect[key])
  const first = sorted[0]!
  const last = sorted[sorted.length - 1]!
  const occupied = sorted.reduce((sum, b) => sum + b.rect[extent], 0)
  const span = last.rect[key] + last.rect[extent] - first.rect[key]
  const gap = (span - occupied) / (sorted.length - 1)
  let cursor = first.rect[key]
  for (const b of sorted) {
    moved.set(b.id, axis === 'horizontal' ? { x: cursor, y: b.rect.y } : { x: b.rect.x, y: cursor })
    cursor += b.rect[extent] + gap
  }
  return moved
}

/** Frame box for a group around `boxes`: padding on every side plus a header band on top. */
export function frameAround(boxes: readonly Placed[], padding: number, header: number): Rect | null {
  const bounds = enclosingRect(boxes.map((b) => b.rect))
  if (!bounds) return null
  return {
    x: bounds.x - padding,
    y: bounds.y - padding - header,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2 + header,
  }
}
