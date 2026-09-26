import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setMedia } from '../../../test/media'
import { runWithTransition, supportsViewTransitions, useViewTransition, VIEW_TRANSITION_MARKER } from './viewTransition'

function installNative(finished: Promise<unknown>) {
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
  document.documentElement.removeAttribute(VIEW_TRANSITION_MARKER)
})

describe('ViewTransition', () => {
  it('runs the update synchronously without native support', async () => {
    expect(supportsViewTransitions()).toBe(false)
    const update = vi.fn()
    const handle = runWithTransition(update)
    expect(update).toHaveBeenCalledTimes(1)
    await expect(handle.finished).resolves.toBeUndefined()
  })

  it('never calls the native API under reduced motion', async () => {
    const { start } = installNative(Promise.resolve())
    setMedia({ reducedMotion: true })
    const update = vi.fn()
    await runWithTransition(update).finished
    expect(start).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('sets the root marker during the transition and clears it after', async () => {
    let resolve!: () => void
    installNative(new Promise<void>((r) => (resolve = r)))
    const handle = runWithTransition(() => {}, { kind: 'slide' })
    expect(document.documentElement).toHaveAttribute(VIEW_TRANSITION_MARKER, 'slide')
    resolve()
    await handle.finished
    expect(document.documentElement).not.toHaveAttribute(VIEW_TRANSITION_MARKER)
  })

  it('clears the marker on skip and on rejection', async () => {
    const { skipTransition } = installNative(new Promise(() => {}))
    const handle = runWithTransition(() => {})
    handle.skip()
    expect(skipTransition).toHaveBeenCalled()
    expect(document.documentElement).not.toHaveAttribute(VIEW_TRANSITION_MARKER)

    installNative(Promise.reject(new Error('aborted')))
    const failing = runWithTransition(() => {})
    await failing.finished
    expect(document.documentElement).not.toHaveAttribute(VIEW_TRANSITION_MARKER)
  })

  it('honours skipAnimation', () => {
    const { start } = installNative(Promise.resolve())
    runWithTransition(() => {}, { skipAnimation: true })
    expect(start).not.toHaveBeenCalled()
  })

  it('returns a stable function from the hook', () => {
    const { result, rerender } = renderHook(() => useViewTransition())
    const first = result.current.runWithTransition
    rerender()
    expect(result.current.runWithTransition).toBe(first)
  })
})
