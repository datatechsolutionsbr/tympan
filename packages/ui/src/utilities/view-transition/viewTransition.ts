// ViewTransition (spec: wave-2/view-transition.md). Uses the native View
// Transitions API when it is safe, applies the update instantly otherwise.
import { useCallback, useMemo } from 'react'
import { prefersReducedMotion } from '../../internal/media'

export type ViewTransitionKind = 'fade' | 'slide'

export interface ViewTransitionOptions {
  kind?: ViewTransitionKind
  skipAnimation?: boolean
}

export interface ViewTransitionHandle {
  finished: Promise<void>
  skip: () => void
}

/** Root attribute present only while a transition runs; transition CSS keys off it. */
export const VIEW_TRANSITION_MARKER = 'data-fk-view-transition'

interface NativeTransition {
  finished: Promise<unknown>
  skipTransition: () => void
}
type Starter = (cb: () => void | Promise<void>) => NativeTransition

function nativeStarter(): Starter | null {
  if (typeof document === 'undefined') return null
  const fn = (document as Document & { startViewTransition?: Starter }).startViewTransition
  return typeof fn === 'function' ? (cb) => fn.call(document, cb) : null
}

/** Feature detection, safe on the server. */
export function supportsViewTransitions(): boolean {
  return nativeStarter() !== null
}

function instant(update: () => void | Promise<void>): ViewTransitionHandle {
  let result: void | Promise<void>
  try {
    result = update()
  } catch (error) {
    return { finished: Promise.reject(error), skip: () => {} }
  }
  return { finished: Promise.resolve(result).then(() => undefined), skip: () => {} }
}

/** Runs `update` inside a native view transition, or instantly. */
export function runWithTransition(update: () => void | Promise<void>, options: ViewTransitionOptions = {}): ViewTransitionHandle {
  const start = nativeStarter()
  if (!start || options.skipAnimation || prefersReducedMotion()) return instant(update)

  const root = document.documentElement
  root.setAttribute(VIEW_TRANSITION_MARKER, options.kind ?? 'fade')
  const clear = () => root.removeAttribute(VIEW_TRANSITION_MARKER)

  let native: NativeTransition
  try {
    native = start(update)
  } catch {
    clear()
    return instant(update)
  }
  const finished = Promise.resolve(native.finished).then(
    () => clear(),
    () => clear(),
  )
  return {
    finished,
    skip: () => {
      try {
        native.skipTransition()
      } finally {
        clear()
      }
    },
  }
}

/** Hook form with a stable function identity. */
export function useViewTransition(): { runWithTransition: typeof runWithTransition; isSupported: boolean } {
  const run = useCallback((u: () => void | Promise<void>, o?: ViewTransitionOptions) => runWithTransition(u, o), [])
  const isSupported = supportsViewTransitions()
  return useMemo(() => ({ runWithTransition: run, isSupported }), [run, isSupported])
}
