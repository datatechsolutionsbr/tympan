import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setMedia } from '../../../test/media'
import { cancelHaptic, HapticsPreference, playHaptic, useHaptics } from './haptics'

function installVibrate(impl?: (p: unknown) => boolean) {
  const fn = vi.fn(impl ?? (() => true))
  Object.defineProperty(navigator, 'vibrate', { configurable: true, writable: true, value: fn })
  return fn
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'vibrate')
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

  it('imports and runs without a navigator-level API (server-like)', async () => {
    const mod = await import('./haptics')
    expect(mod.hapticsSupported()).toBe(false)
  })
})
