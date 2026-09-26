// Small touch tracker shared by the gesture components (SwipeRow,
// PullToRefresh, EdgeSwipeBack). It records where a single-finger touch
// began, locks it to one axis after a short slop, and reports deltas. Touch
// events only: gestures are enhancements for touch screens (WCAG 2.5.1), each
// component keeps a pointer- and keyboard-operable path of its own.

export type Axis = 'x' | 'y'

export interface TouchSample {
  clientX: number
  clientY: number
}

export interface Track {
  x0: number
  y0: number
  dx: number
  dy: number
  /** Null until the finger moved past the slop. */
  axis: Axis | null
}

/** Distance (CSS px) a finger must travel before the axis is decided. */
export const AXIS_SLOP = 8

export function firstTouch(list: { length: number; [index: number]: TouchSample } | undefined | null): TouchSample | null {
  return list && list.length > 0 ? list[0]! : null
}

export function beginTrack(t: TouchSample): Track {
  return { x0: t.clientX, y0: t.clientY, dx: 0, dy: 0, axis: null }
}

/** Updates deltas; decides the axis once, favouring vertical on ties (scrolling wins). */
export function advanceTrack(track: Track, t: TouchSample): Track {
  const dx = t.clientX - track.x0
  const dy = t.clientY - track.y0
  let axis = track.axis
  if (!axis && Math.hypot(dx, dy) >= AXIS_SLOP) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
  return { ...track, dx, dy, axis }
}

/** Diminishing resistance: 1:1 up to `soft`, then easing towards `cap`. */
export function resist(distance: number, soft: number, cap: number): number {
  if (distance <= soft) return Math.max(0, distance)
  const extra = distance - soft
  const room = Math.max(1, cap - soft)
  return soft + room * (1 - Math.exp(-extra / room))
}
