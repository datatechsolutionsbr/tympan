import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setMedia } from '../../../test/media'
import { animateChange, canAnimateChanges, CHANGE_STYLE_ATTRIBUTE, useAnimatedChange } from './animatedChange'

function fakeNative(finished: Promise<unknown>) {
  const skipTransition = vi.fn()
  const start = vi.fn((cb: () => void) => {
    cb()
    return { finished, skipTransition }
  })
  Object.defineProperty(document, 'startViewTransition', { configurable: true, writable: true, value: start })
  return { start, skipTransition }
}

afterEach(() => {
  Reflect.deleteProperty(document, 'startViewTransition')
  document.documentElement.removeAttribute(CHANGE_STYLE_ATTRIBUTE)
})

describe('animateChange', () => {
  it('applies the change at once without native support', async () => {
    expect(canAnimateChanges()).toBe(false)
    const change = vi.fn()
    const run = animateChange(change)
    expect(change).toHaveBeenCalledTimes(1)
    await expect(run.done).resolves.toBeUndefined()
  })

  it('never uses the native API under reduced motion', async () => {
    const { start } = fakeNative(Promise.resolve())
    setMedia({ reducedMotion: true })
    const change = vi.fn()
    await animateChange(change).done
    expect(start).not.toHaveBeenCalled()
    expect(change).toHaveBeenCalledTimes(1)
  })

  it('flags the root while the transition runs and clears it after', async () => {
    let finish!: () => void
    fakeNative(new Promise<void>((r) => (finish = r)))
    const run = animateChange(() => {}, { style: 'slide' })
    expect(document.documentElement).toHaveAttribute(CHANGE_STYLE_ATTRIBUTE, 'slide')
    finish()
    await run.done
    expect(document.documentElement).not.toHaveAttribute(CHANGE_STYLE_ATTRIBUTE)
  })

  it('clears the flag on cancel and on rejection', async () => {
    const { skipTransition } = fakeNative(new Promise(() => {}))
    animateChange(() => {}).cancel()
    expect(skipTransition).toHaveBeenCalled()
    expect(document.documentElement).not.toHaveAttribute(CHANGE_STYLE_ATTRIBUTE)

    fakeNative(Promise.reject(new Error('aborted')))
    await animateChange(() => {}).done
    expect(document.documentElement).not.toHaveAttribute(CHANGE_STYLE_ATTRIBUTE)
  })

  it('honours instant', () => {
    const { start } = fakeNative(Promise.resolve())
    animateChange(() => {}, { instant: true })
    expect(start).not.toHaveBeenCalled()
  })

  it('gives a stable function from the hook', () => {
    const { result, rerender } = renderHook(() => useAnimatedChange())
    const first = result.current.animateChange
    rerender()
    expect(result.current.animateChange).toBe(first)
  })
})
