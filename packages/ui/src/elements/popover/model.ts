// Anchored placement for `<ty-popover>`: where a panel of a known size goes
// next to a trigger rectangle so it stays inside the viewport. Pure
// geometry in CSS pixels (what getBoundingClientRect reports and
// position:fixed consumes), so the rules are unit-tested without layout.
// Mirrors components/placement.rs on the Astrlabe side: preferred side,
// flip on collision, viewport clamp, arrow offset.

/** An axis-aligned rectangle in viewport pixels. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** A width and height in pixels. */
export interface Size {
  width: number
  height: number
}

/** The physical side of the trigger the panel sits on. */
export type Side = 'top' | 'bottom' | 'left' | 'right'

/** Alignment along the chosen side. */
export type Align = 'start' | 'center' | 'end'

export interface Placed {
  x: number
  y: number
  /** The side actually used — the preferred one or its opposite after a flip. */
  side: Side
  /** Distance from the panel's left (vertical sides) or top (horizontal sides) edge to the arrow's centre. */
  arrow: number
}

/** Pixels kept between the panel and every viewport edge (the spec's 16 px gutter; RAC's containerPadding). */
export const VIEWPORT_MARGIN = 16
/** Least distance between the arrow's centre and a panel corner, so it never sits on the rounding. */
export const ARROW_INSET = 14

/** Spacing scale steps in px (the `offset` prop is a step index), as Popover.tsx maps them. */
export const SPACE_STEPS = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96]

/** The gap in px for an `offset` step; the arrow adds 6 px (Popover.tsx). */
export function offsetPx(step: number, showArrow: boolean): number {
  return (SPACE_STEPS[Math.trunc(step)] ?? 8) + (showArrow ? 6 : 0)
}

/** The logical `placement` as a physical side in the current reading direction. */
export function physicalSide(placement: string, rtl: boolean): Side {
  switch (placement) {
    case 'top':
      return 'top'
    case 'end':
      return rtl ? 'left' : 'right'
    case 'start':
      return rtl ? 'right' : 'left'
    default:
      return 'bottom'
  }
}

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
const VERTICAL = new Set<Side>(['top', 'bottom'])

/** Free space between the anchor and the viewport edge on `side`, after the margin. */
function space(anchor: Rect, viewport: Size, side: Side): number {
  switch (side) {
    case 'top':
      return anchor.y - VIEWPORT_MARGIN
    case 'bottom':
      return viewport.height - (anchor.y + anchor.height) - VIEWPORT_MARGIN
    case 'left':
      return anchor.x - VIEWPORT_MARGIN
    case 'right':
      return viewport.width - (anchor.x + anchor.width) - VIEWPORT_MARGIN
  }
}

/** The preferred side when the panel fits, the opposite when it has more room, else the preferred. */
export function resolveSide(anchor: Rect, panel: Size, viewport: Size, preferred: Side, offset: number): Side {
  const needed = offset + (VERTICAL.has(preferred) ? panel.height : panel.width)
  const preferredSpace = space(anchor, viewport, preferred)
  if (preferredSpace >= needed) return preferred
  const opposite = OPPOSITE[preferred]
  return space(anchor, viewport, opposite) > preferredSpace ? opposite : preferred
}

function crossStart(anchorStart: number, anchorLen: number, panelLen: number, align: Align): number {
  switch (align) {
    case 'start':
      return anchorStart
    case 'end':
      return anchorStart + anchorLen - panelLen
    default:
      return anchorStart + (anchorLen - panelLen) / 2
  }
}

/** Keep the panel `VIEWPORT_MARGIN` from the edges; a panel larger than the viewport pins to the leading margin. */
function clampAxis(start: number, panelLen: number, viewportLen: number): number {
  const max = viewportLen - VIEWPORT_MARGIN - panelLen
  return Math.min(Math.max(start, VIEWPORT_MARGIN), Math.max(max, VIEWPORT_MARGIN))
}

/** The arrow's centre along the panel edge facing the anchor, kept off the rounded corners. */
function arrowOffset(anchorCentre: number, panelLen: number): number {
  return Math.min(Math.max(anchorCentre, ARROW_INSET), Math.max(panelLen - ARROW_INSET, ARROW_INSET))
}

/** Place `panel` next to `anchor` inside `viewport` — see the module doc. */
export function place(anchor: Rect, panel: Size, viewport: Size, preferred: Side, align: Align, offset: number): Placed {
  const side = resolveSide(anchor, panel, viewport, preferred, offset)
  let rawX: number
  let rawY: number
  switch (side) {
    case 'top':
      rawX = crossStart(anchor.x, anchor.width, panel.width, align)
      rawY = anchor.y - offset - panel.height
      break
    case 'bottom':
      rawX = crossStart(anchor.x, anchor.width, panel.width, align)
      rawY = anchor.y + anchor.height + offset
      break
    case 'left':
      rawX = anchor.x - offset - panel.width
      rawY = crossStart(anchor.y, anchor.height, panel.height, align)
      break
    case 'right':
      rawX = anchor.x + anchor.width + offset
      rawY = crossStart(anchor.y, anchor.height, panel.height, align)
      break
  }
  const x = clampAxis(rawX, panel.width, viewport.width)
  const y = clampAxis(rawY, panel.height, viewport.height)
  const arrow = VERTICAL.has(side)
    ? arrowOffset(anchor.x + anchor.width / 2 - x, panel.width)
    : arrowOffset(anchor.y + anchor.height / 2 - y, panel.height)
  return { x, y, side, arrow }
}
