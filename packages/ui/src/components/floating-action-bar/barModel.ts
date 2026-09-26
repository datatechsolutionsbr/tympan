// Pure rules of the action bar (wave-4/floating-action-bar.md): which edge it
// uses, how many slots fit, which items overflow, how chords are matched and
// how counts are shown. Kept free of React so every rule is unit-tested.

export type BarEdge = 'bottom' | 'start' | 'end' | 'top'
export type BarKind = 'destination' | 'contextual'

/** Geometry (px) shared with FloatingActionBar.css. */
export const BAR_GEOMETRY = {
  item: 44,
  gap: 4,
  padding: 6,
  margin: 12,
  separator: 9,
} as const

/** Items a tab bar shows before its "more" slot. */
export const TAB_BAR_SLOTS = 5

export interface Placed<T> {
  item: T
  kind: BarKind
}

export interface BarPlan<T> {
  shown: Placed<T>[]
  overflow: Placed<T>[]
}

/** Below 1024 px the bar always sits on the bottom edge. */
export function effectiveEdge(requested: BarEdge, wide: boolean): BarEdge {
  return wide ? requested : 'bottom'
}

export function isHorizontal(edge: BarEdge): boolean {
  return edge === 'bottom' || edge === 'top'
}

/** How many item slots fit along `length` px of the edge. */
export function slotsAlong(length: number): number {
  const { item, gap, padding, margin, separator } = BAR_GEOMETRY
  if (!Number.isFinite(length) || length <= 0) return Number.POSITIVE_INFINITY
  const usable = length - 2 * margin - 2 * padding - separator
  return Math.max(2, Math.floor((usable + gap) / (item + gap)))
}

/**
 * Splits the items into the ones on the bar and the ones in "more". When they
 * do not fit, one slot goes to "more"; trailing contextual items leave first,
 * then trailing destinations; an active item never leaves.
 */
export function planBar<T extends { active?: boolean }>(destinations: T[], contextual: T[], slots: number): BarPlan<T> {
  const everything: Placed<T>[] = [
    ...destinations.map((item) => ({ item, kind: 'destination' as const })),
    ...contextual.map((item) => ({ item, kind: 'contextual' as const })),
  ]
  if (everything.length <= slots) return { shown: everything, overflow: [] }
  const excess = everything.length - Math.max(1, slots - 1)
  const leaving = new Set<Placed<T>>()
  const candidates = [
    ...everything.filter((p) => p.kind === 'contextual').reverse(),
    ...everything.filter((p) => p.kind === 'destination').reverse(),
  ]
  for (const candidate of candidates) {
    if (leaving.size >= excess) break
    if (!candidate.item.active) leaving.add(candidate)
  }
  return {
    shown: everything.filter((p) => !leaving.has(p)),
    overflow: everything.filter((p) => leaving.has(p)),
  }
}

export interface Chord {
  alt: boolean
  ctrl: boolean
  meta: boolean
  shift: boolean
  key: string
}

/** Parses "Alt+Shift+D" (case-insensitive; Mod = Meta on Apple, Ctrl elsewhere is left to the host). */
export function parseChord(text: string): Chord {
  const parts = text.split('+').map((p) => p.trim().toLowerCase())
  const key = parts.pop() ?? ''
  const has = (name: string) => parts.includes(name)
  return { alt: has('alt') || has('option'), ctrl: has('ctrl') || has('control'), meta: has('meta') || has('cmd'), shift: has('shift'), key }
}

interface KeyLike {
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  key: string
  code?: string
}

/** Physical-key aware match: Alt on Apple keyboards changes `key`, so letters and digits also match on `code`. */
export function chordMatches(event: KeyLike, chord: Chord): boolean {
  if (event.altKey !== chord.alt || event.ctrlKey !== chord.ctrl || event.metaKey !== chord.meta || event.shiftKey !== chord.shift) return false
  if (event.key.toLowerCase() === chord.key) return true
  const code = event.code ?? ''
  return code === `Key${chord.key.toUpperCase()}` || code === `Digit${chord.key}`
}

/** `aria-keyshortcuts` form of a chord text ("Alt+Shift+D"). */
export function ariaShortcut(text: string): string {
  const c = parseChord(text)
  return [c.ctrl && 'Control', c.alt && 'Alt', c.meta && 'Meta', c.shift && 'Shift', c.key.length === 1 ? c.key.toUpperCase() : c.key]
    .filter(Boolean)
    .join('+')
}

type Step = 'next' | 'previous' | 'first' | 'last' | 'menu' | null

/** Maps a key to a roving step for the bar's orientation and reading direction. */
export function stepFor(key: string, edge: BarEdge, rtl: boolean): Step {
  if (key === 'Home') return 'first'
  if (key === 'End') return 'last'
  if (isHorizontal(edge)) {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (key === forward) return 'next'
    if (key === backward) return 'previous'
    return key === 'ArrowDown' ? 'menu' : null
  }
  if (key === 'ArrowDown') return 'next'
  if (key === 'ArrowUp') return 'previous'
  const opensMenu = (edge === 'start') !== rtl ? 'ArrowRight' : 'ArrowLeft'
  return key === opensMenu ? 'menu' : null
}

/** Wrapping index move. */
export function moveIndex(current: number, count: number, step: Exclude<Step, 'menu' | null>): number {
  if (count <= 0) return 0
  switch (step) {
    case 'first':
      return 0
    case 'last':
      return count - 1
    case 'next':
      return (current + 1) % count
    case 'previous':
      return (current - 1 + count) % count
  }
}
