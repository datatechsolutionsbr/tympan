// ViewTransition (spec: wave-2/view-transition.md).
//
// A change is "staged": either handed to the browser's own animated swap, or
// applied on the spot. Staging on the spot happens without browser support,
// under reduced motion, or when the caller opts out. While the browser swap
// runs, <html> carries a flag naming the style so transition CSS applies.
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

type Change = () => void | Promise<void>

/** The subset of the browser's transition object this module talks to. */
interface BrowserSwap {
  finished: PromiseLike<unknown>
  skipTransition(): void
}

type SwapEngine = (change: Change) => BrowserSwap

/** The browser's swap function bound to the document, or undefined (server, old browsers). */
function engine(): SwapEngine | undefined {
  const doc = typeof document === 'undefined' ? undefined : (document as Document & { startViewTransition?: SwapEngine })
  const native = doc?.startViewTransition
  if (typeof native !== 'function') return undefined
  return (change) => native.call(doc, change)
}

/** Feature detection, safe on the server. */
export function supportsViewTransitions(): boolean {
  return engine() !== undefined
}

const noop = () => {}

/** Applies the change now; the handle settles with the change (or its error). */
function onTheSpot(change: Change): ViewTransitionHandle {
  const settled = new Promise<void>((resolve, reject) => {
    try {
      Promise.resolve(change()).then(() => resolve(), reject)
    } catch (problem) {
      reject(problem)
    }
  })
  return { finished: settled, skip: noop }
}

/** Sets and removes the root flag; removal is idempotent. */
class RootFlag {
  private raised = false
  constructor(private readonly style: ViewTransitionKind) {}
  raise(): void {
    document.documentElement.setAttribute(VIEW_TRANSITION_MARKER, this.style)
    this.raised = true
  }
  lower = (): void => {
    if (!this.raised) return
    this.raised = false
    document.documentElement.removeAttribute(VIEW_TRANSITION_MARKER)
  }
}

/** Runs `update` inside a native view transition, or instantly. */
export function runWithTransition(update: Change, options: ViewTransitionOptions = {}): ViewTransitionHandle {
  const swap = engine()
  const animate = swap !== undefined && !options.skipAnimation && !prefersReducedMotion()
  if (!animate) return onTheSpot(update)

  const flag = new RootFlag(options.kind ?? 'fade')
  flag.raise()
  let running: BrowserSwap
  try {
    running = swap(update)
  } catch {
    flag.lower()
    return onTheSpot(update)
  }
  // Success or failure of the animation both end the flagged period.
  const done = new Promise<void>((resolve) => {
    Promise.resolve(running.finished).then(
      () => resolve(flag.lower()),
      () => resolve(flag.lower()),
    )
  })
  const cut = () => {
    try {
      running.skipTransition()
    } finally {
      flag.lower()
    }
  }
  return { finished: done, skip: cut }
}

/** Hook form with a stable function identity. */
export function useViewTransition(): { runWithTransition: typeof runWithTransition; isSupported: boolean } {
  const stable = useCallback((change: Change, opts?: ViewTransitionOptions) => runWithTransition(change, opts), [])
  const available = supportsViewTransitions()
  return useMemo(() => ({ runWithTransition: stable, isSupported: available }), [stable, available])
}
