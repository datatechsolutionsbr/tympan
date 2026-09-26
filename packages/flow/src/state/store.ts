// A minimal external store (subscribe / getState / setState) and a selector
// hook with memoised selection, so components re-render only for their slice.

import { useCallback, useRef, useSyncExternalStore } from 'react'

export interface Store<S> {
  getState(): S
  setState(next: Partial<S> | ((prev: S) => Partial<S>)): void
  subscribe(listener: () => void): () => void
}

export function createStore<S extends object>(initial: S): Store<S> {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    getState: () => state,
    setState(next) {
      const patch = typeof next === 'function' ? next(state) : next
      let changed = false
      for (const k of Object.keys(patch) as Array<keyof S>) {
        if (!Object.is(state[k], patch[k])) {
          changed = true
          break
        }
      }
      if (!changed) return
      state = { ...state, ...patch }
      for (const l of [...listeners]) l()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/** Shallow equality for arrays and plain records (selector results). */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (const k of ka) if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false
  return true
}

/** Subscribes to `selector(state)`; re-renders only when the selection changes under `isEqual`. */
export function useStoreSelector<S, T>(store: Store<S>, selector: (s: S) => T, isEqual: (a: T, b: T) => boolean = Object.is): T {
  const memo = useRef<{ state: S; selector: (s: S) => T; value: T } | null>(null)
  const select = useCallback(() => {
    const state = store.getState()
    const prev = memo.current
    if (prev && prev.state === state && prev.selector === selector) return prev.value
    const value = selector(state)
    if (prev && isEqual(prev.value, value)) {
      memo.current = { state, selector, value: prev.value }
      return prev.value
    }
    memo.current = { state, selector, value }
    return value
    // selector identity is allowed to change each render; the state check keeps it cheap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, selector])
  return useSyncExternalStore(store.subscribe, select, select)
}
