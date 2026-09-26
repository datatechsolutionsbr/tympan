// Haptics (spec: wave-2/haptics.md). Named vibration patterns through the
// Vibration API; silent (returns false) wherever it is missing.
import { useCallback, useContext, useMemo, type ReactNode } from 'react'
import { gatedVibrate, HapticsEnabledContext } from '../../internal/haptics'
import { prefersReducedMotion } from '../../internal/media'

export type HapticPattern = 'tap' | 'impact' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

/** Durations in ms (vibrate, pause, vibrate …). All well under half a second. */
const TABLE: Record<HapticPattern, number | number[]> = {
  selection: 5,
  tap: 8,
  impact: 14,
  heavy: 24,
  success: [10, 40, 10],
  warning: [18, 60, 18],
  error: [24, 50, 24, 50, 24],
}

/** Patterns still played under reduced motion: they confirm an outcome. */
const OUTCOMES = new Set<HapticPattern>(['success', 'warning', 'error'])

type Vibrate = (pattern: number | number[]) => boolean

function vibrator(): Vibrate | null {
  if (typeof navigator === 'undefined') return null
  const fn = (navigator as Navigator & { vibrate?: Vibrate }).vibrate
  return typeof fn === 'function' ? (p) => (fn as (p: number | number[]) => boolean).call(navigator, p) : null
}

/** True when the platform exposes the Vibration API. */
export function hapticsSupported(): boolean {
  return vibrator() !== null
}

/**
 * Plays a named pattern. Call it from a user gesture; never throws.
 * `enabled: false` (the person's app preference) makes it a no-op.
 */
export function playHaptic(pattern: HapticPattern = 'tap', options: { enabled?: boolean } = {}): boolean {
  if (options.enabled === false) return false
  // Nothing vibrates before the page has had a user gesture.
  const run = gatedVibrate()
  if (!run) return false
  if (prefersReducedMotion() && !OUTCOMES.has(pattern)) return false
  try {
    return run(TABLE[pattern]) !== false
  } catch {
    return false
  }
}

/** Stops a running vibration. */
export function cancelHaptic(): void {
  try {
    gatedVibrate()?.(0)
  } catch {
    /* ignore */
  }
}

/** Host switch: pass the person's "haptics" preference. */
export function HapticsPreference({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <HapticsEnabledContext.Provider value={enabled}>{children}</HapticsEnabledContext.Provider>
}

export interface HapticsApi {
  play: (pattern?: HapticPattern) => boolean
  cancel: () => void
  isSupported: boolean
}

/** Hook form: honours the nearest `HapticsPreference` (or an explicit `enabled`). */
export function useHaptics(enabled?: boolean): HapticsApi {
  const fromHost = useContext(HapticsEnabledContext)
  const on = enabled ?? fromHost
  const play = useCallback((pattern?: HapticPattern) => playHaptic(pattern, { enabled: on }), [on])
  return useMemo(() => ({ play, cancel: cancelHaptic, isSupported: hapticsSupported() }), [play])
}
