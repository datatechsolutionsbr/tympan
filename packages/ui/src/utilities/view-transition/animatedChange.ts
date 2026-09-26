// Animated change (spec: wave-2/view-transition.md; names renamed in
// implementation, see the spec's note).
//
// `animateChange` hands a state or route change to the browser's native view
// transition when that is available, allowed by the person's motion setting
// and not refused by the caller; otherwise it applies the change at once.
// During a native run <html> carries `data-fk-change-style="<style>"`.
import { useMemo, useRef } from 'react'
import { prefersReducedMotion } from '../../internal/media'

export type ChangeStyle = 'fade' | 'slide'

export interface AnimateOptions {
  style?: ChangeStyle
  /** Apply at once, without animation. */
  instant?: boolean
}

export interface ChangeRun {
  /** Settles when the change (and any animation) is over. */
  done: Promise<void>
  /** Ends the animation early; the change itself still applies. */
  cancel: () => void
}

export const CHANGE_STYLE_ATTRIBUTE = 'data-fk-change-style'

type Change = () => void | Promise<void>
type NativeRun = { finished: PromiseLike<unknown>; skipTransition(): void }
type Starter = (this: Document, change: Change) => NativeRun

function nativeStarter(): Starter | null {
  if (typeof document === 'undefined') return null
  const candidate = (document as unknown as { startViewTransition?: unknown }).startViewTransition
  return typeof candidate === 'function' ? (candidate as Starter) : null
}

/** True where the browser offers native view transitions (false on the server). */
export function canAnimateChanges(): boolean {
  return nativeStarter() !== null
}

async function applyNow(change: Change): Promise<void> {
  await change()
}

const withoutAnimation = (change: Change): ChangeRun => {
  let done: Promise<void>
  try {
    const outcome = change()
    done = outcome instanceof Promise ? outcome.then(() => undefined) : Promise.resolve()
  } catch (reason) {
    done = Promise.reject(reason)
  }
  return { done, cancel: () => undefined }
}

/** Runs `change` inside a native view transition when allowed, else at once. */
export function animateChange(change: Change, options: AnimateOptions = {}): ChangeRun {
  const start = nativeStarter()
  if (!start || options.instant || prefersReducedMotion()) return withoutAnimation(change)

  const root = document.documentElement
  root.setAttribute(CHANGE_STYLE_ATTRIBUTE, options.style ?? 'fade')
  const clear = () => root.removeAttribute(CHANGE_STYLE_ATTRIBUTE)

  let native: NativeRun
  try {
    native = start.call(document, () => applyNow(change))
  } catch {
    clear()
    return withoutAnimation(change)
  }
  // Finished, failed or cut short: the flagged period ends either way.
  const done = Promise.resolve(native.finished).then(clear, clear)
  return {
    done,
    cancel() {
      clear()
      native.skipTransition()
    },
  }
}

/** Hook form: a stable `animateChange` and whether native transitions exist. */
export function useAnimatedChange(): { animateChange: typeof animateChange; available: boolean } {
  const fn = useRef(animateChange).current
  const available = canAnimateChanges()
  return useMemo(() => ({ animateChange: fn, available }), [fn, available])
}
