import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetUserGestureForTests } from '../../internal/haptics'
import { setMedia } from '../../../test/media'
import { cancelHaptic, HapticsPreference, playHaptic, useHaptics } from './haptics'

function installVibrate(impl?: (p: unknown) => boolean) {
  const fn = vi.fn(impl ?? (() => true))
  Object.defineProperty(navigator, 'vibrate', { configurable: true, writable: true, value: fn })
  return fn
}

/** A first press on the page (opens the user-gesture gate). */
function press() {
  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
}

beforeEach(() => press())

afterEach(() => {
  Reflect.deleteProperty(navigator, 'vibrate')
  Reflect.deleteProperty(navigator, 'userActivation')
  resetUserGestureForTests()
})

describe('Haptics', () => {
  it('returns false without vibration support and never throws', () => {
    Reflect.deleteProperty(navigator, 'vibrate')
    expect(() => playHaptic('tap')).not.toThrow()
    expect(playHaptic('tap')).toBe(false)
  })

  it('requests the platform vibration once for success', () => {
    const vibrate = installVibrate()
    expect(playHaptic('success')).toBe(true)
    expect(vibrate).toHaveBeenCalledTimes(1)
  })

  it('cancel stops any running vibration', () => {
    const vibrate = installVibrate()
    cancelHaptic()
    expect(vibrate).toHaveBeenCalledWith(0)
  })

  it('swallows platform errors', () => {
    installVibrate(() => {
      throw new Error('blocked')
    })
    expect(playHaptic('impact')).toBe(false)
  })

  it('plays only outcome patterns under reduced motion', () => {
    const vibrate = installVibrate()
    setMedia({ reducedMotion: true })
    expect(playHaptic('tap')).toBe(false)
    expect(playHaptic('error')).toBe(true)
    expect(vibrate).toHaveBeenCalledTimes(1)
  })

  it('honours the host preference through the hook', () => {
    const vibrate = installVibrate()
    const { result } = renderHook(() => useHaptics(), {
      wrapper: ({ children }) => <HapticsPreference enabled={false}>{children}</HapticsPreference>,
    })
    expect(result.current.isSupported).toBe(true)
    expect(result.current.play('tap')).toBe(false)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('never vibrates (nor cancels) before a user gesture', () => {
    resetUserGestureForTests()
    const vibrate = installVibrate()
    expect(playHaptic('success')).toBe(false)
    cancelHaptic()
    expect(vibrate).not.toHaveBeenCalled()
    press()
    expect(playHaptic('success')).toBe(true)
    expect(vibrate).toHaveBeenCalledTimes(1)
  })

  it('follows the User Activation API where it exists', () => {
    resetUserGestureForTests()
    const vibrate = installVibrate()
    const activation = { hasBeenActive: false }
    Object.defineProperty(navigator, 'userActivation', { configurable: true, value: activation })
    expect(playHaptic('tap')).toBe(false)
    activation.hasBeenActive = true
    expect(playHaptic('tap')).toBe(true)
    expect(vibrate).toHaveBeenCalledTimes(1)
  })

  it('imports and runs without a navigator-level API (server-like)', async () => {
    const mod = await import('./haptics')
    expect(mod.hapticsSupported()).toBe(false)
  })
})
