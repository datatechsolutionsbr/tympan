import { prefersReducedMotion } from './media'

export type HapticStrength = 'none' | 'light' | 'medium'

const pattern: Record<Exclude<HapticStrength, 'none'>, number> = { light: 8, medium: 16 }

/**
 * Minimal Haptics utility (wave 2 specifies the full one): asks the device for
 * a short vibration where the Vibration API exists. Silent everywhere else and
 * under reduced motion.
 */
export function requestHaptic(strength: HapticStrength): void {
  if (strength === 'none' || typeof navigator === 'undefined') return
  const vibrate = (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate
  if (typeof vibrate !== 'function' || prefersReducedMotion()) return
  try {
    vibrate.call(navigator, pattern[strength])
  } catch {
    /* unsupported */
  }
}
