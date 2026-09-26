import { createContext, useContext } from 'react'
import { prefersReducedMotion } from './media'

export type HapticStrength = 'none' | 'light' | 'medium'

const pattern: Record<Exclude<HapticStrength, 'none'>, number> = { light: 8, medium: 16 }

/* ------------------------------------------------------------------------ */
/* User-gesture gate                                                         */
/* ------------------------------------------------------------------------ */

// Browsers ignore (and warn about) navigator.vibrate before the page has had a
// user gesture, so nothing here calls it until one has happened. Where the
// User Activation API exists it decides; elsewhere a first pointer, touch or
// key press seen by this module opens the gate.
let gestureSeen = false
const GESTURES = ['pointerdown', 'touchstart', 'keydown', 'mousedown'] as const

function onGesture() {
  gestureSeen = true
  for (const type of GESTURES) window.removeEventListener(type, onGesture, true)
}

if (typeof window !== 'undefined') {
  for (const type of GESTURES) window.addEventListener(type, onGesture, { capture: true, passive: true })
}

/** True once the person has interacted with the page (sticky user activation). */
export function hasUserGesture(): boolean {
  if (typeof navigator === 'undefined') return false
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
  if (activation && typeof activation.hasBeenActive === 'boolean') return activation.hasBeenActive || gestureSeen
  return gestureSeen
}

/** Test hook: forget any gesture seen so far. */
export function resetUserGestureForTests(): void {
  gestureSeen = false
  if (typeof window !== 'undefined') for (const type of GESTURES) window.addEventListener(type, onGesture, { capture: true, passive: true })
}

/* ------------------------------------------------------------------------ */
/* The person's preference                                                   */
/* ------------------------------------------------------------------------ */

/** The person's "haptics" preference (HapticsPreference provides it; on by default). */
export const HapticsEnabledContext = createContext(true)

export function useHapticsEnabled(): boolean {
  return useContext(HapticsEnabledContext)
}

/* ------------------------------------------------------------------------ */

/** The Vibration API, or null. Only callable after a user gesture. */
export function gatedVibrate(): ((p: number | number[]) => boolean) | null {
  if (typeof navigator === 'undefined' || !hasUserGesture()) return null
  const fn = (navigator as { vibrate?: unknown }).vibrate
  return typeof fn === 'function' ? (p) => (fn as (p: number | number[]) => boolean).call(navigator, p) : null
}

/**
 * Short feedback vibration for components: silent without the Vibration API,
 * under reduced motion, when the person turned haptics off (`enabled: false`)
 * and before any user gesture.
 */
export function requestHaptic(strength: HapticStrength, options: { enabled?: boolean } = {}): void {
  if (strength === 'none' || options.enabled === false) return
  if (prefersReducedMotion()) return
  const vibrate = gatedVibrate()
  if (!vibrate) return
  try {
    vibrate(pattern[strength])
  } catch {
    /* unsupported */
  }
}
