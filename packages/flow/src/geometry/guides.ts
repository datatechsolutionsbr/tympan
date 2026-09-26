import type { Rect } from '../model/types'

/** Guide lines found while a node is dragged, in canvas units. */
export interface GuidePositions {
  /** y of a horizontal guide, or null. */
  horizontal: number | null
  /** x of a vertical guide, or null. */
  vertical: number | null
}

export interface GuideMatch extends GuidePositions {
  /** Ids of the nodes each guide aligns with (for announcements). */
  horizontalWith: string | null
  verticalWith: string | null
}

export const NO_GUIDES: Readonly<GuidePositions> = Object.freeze({ horizontal: null, vertical: null })

/** Snap distance in canvas units within which two lines count as aligned. */
export const GUIDE_THRESHOLD = 6

const xLines = (r: Rect) => [r.x, r.x + r.width / 2, r.x + r.width]
const yLines = (r: Rect) => [r.y, r.y + r.height / 2, r.y + r.height]

/**
 * Compares the start, centre and end lines of `moving` with those of every
 * other box on each axis and keeps the closest match within the threshold.
 */
export function findGuides(moving: Rect, others: ReadonlyArray<{ id: string; rect: Rect }>, threshold = GUIDE_THRESHOLD): GuideMatch {
  let bestX = { gap: threshold + 1, at: null as number | null, id: null as string | null }
  let bestY = { gap: threshold + 1, at: null as number | null, id: null as string | null }
  const mx = xLines(moving)
  const my = yLines(moving)
  for (const { id, rect } of others) {
    for (const line of xLines(rect)) {
      for (const own of mx) {
        const gap = Math.abs(line - own)
        if (gap <= threshold && gap < bestX.gap) bestX = { gap, at: line, id }
      }
    }
    for (const line of yLines(rect)) {
      for (const own of my) {
        const gap = Math.abs(line - own)
        if (gap <= threshold && gap < bestY.gap) bestY = { gap, at: line, id }
      }
    }
  }
  return { vertical: bestX.at, horizontal: bestY.at, verticalWith: bestX.id, horizontalWith: bestY.id }
}
