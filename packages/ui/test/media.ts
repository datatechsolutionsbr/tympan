// Controllable matchMedia for jsdom: tests set the viewport width and user
// preferences, and components that read media queries re-render.
import { act } from '@testing-library/react'

interface MediaState {
  width: number
  reducedMotion: boolean
  reducedTransparency: boolean
  coarsePointer: boolean
  dark: boolean
}

const defaults: MediaState = {
  width: 1440,
  reducedMotion: false,
  reducedTransparency: false,
  coarsePointer: false,
  dark: false,
}

let state: MediaState = { ...defaults }
const lists = new Set<{ query: string; mql: MediaQueryList & { _set(m: boolean): void } }>()

function evaluateClause(clause: string): boolean {
  const c = clause.trim().replace(/^\(|\)$/g, '').trim()
  if (!c) return true
  const [rawKey, rawVal = ''] = c.split(':').map((s) => s.trim())
  const key = rawKey ?? ''
  const val = rawVal
  switch (key) {
    case 'min-width':
      return state.width >= parseFloat(val)
    case 'max-width':
      return state.width <= parseFloat(val)
    case 'prefers-reduced-motion':
      return val === 'reduce' ? state.reducedMotion : !state.reducedMotion
    case 'prefers-reduced-transparency':
      return val === 'reduce' ? state.reducedTransparency : !state.reducedTransparency
    case 'pointer':
      return val === 'coarse' ? state.coarsePointer : !state.coarsePointer
    case 'prefers-color-scheme':
      return val === 'dark' ? state.dark : !state.dark
    case 'forced-colors':
      return val !== 'active'
    default:
      return false
  }
}

export function evaluate(query: string): boolean {
  return query.split(',').some((part) =>
    part.split(/\band\b/).every((clause) => evaluateClause(clause.replace(/^\s*(only\s+)?screen\s*/, ''))),
  )
}

export function installMediaQueryMock(): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => {
      const listeners = new Set<(e: MediaQueryListEvent) => void>()
      let matches = evaluate(query)
      const mql = {
        get matches() {
          return matches
        },
        media: query,
        onchange: null,
        addEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.add(l),
        removeEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.delete(l),
        addListener: (l: (e: MediaQueryListEvent) => void) => listeners.add(l),
        removeListener: (l: (e: MediaQueryListEvent) => void) => listeners.delete(l),
        dispatchEvent: () => true,
        _set(m: boolean) {
          if (m === matches) return
          matches = m
          for (const l of listeners) l({ matches: m, media: query } as MediaQueryListEvent)
        },
      }
      lists.add({ query, mql: mql as unknown as MediaQueryList & { _set(m: boolean): void } })
      return mql
    },
  })
}

function notify() {
  for (const { query, mql } of lists) mql._set(evaluate(query))
}

/** Changes simulated media features and notifies live MediaQueryLists. */
export function setMedia(patch: Partial<MediaState>): void {
  state = { ...state, ...patch }
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: state.width })
  act(() => notify())
}

export function setViewportWidth(width: number): void {
  setMedia({ width })
}

export function resetMediaQueries(): void {
  state = { ...defaults }
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: state.width })
  lists.clear()
}
