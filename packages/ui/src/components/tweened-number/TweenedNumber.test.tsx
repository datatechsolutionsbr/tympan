import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { setMedia } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { TweenedNumber } from './TweenedNumber'

const text = (c: HTMLElement) => c.querySelector('.fk-tweened-number')!.textContent

describe('TweenedNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'Date', 'performance'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

  it('shows the target on the first frame under reduced motion', () => {
    setMedia({ reducedMotion: true })
    const { container } = render(<TweenedNumber value={1234} />)
    expect(text(container)).toBe(new Intl.NumberFormat('en-US').format(1234))
  })

  it('jumps straight to a new value with duration 0', () => {
    const { container, rerender } = render(<TweenedNumber value={10} durationMs={0} />)
    expect(text(container)).toBe('10')
    rerender(<TweenedNumber value={20} durationMs={0} />)
    expect(text(container)).toBe('20')
  })

  it('lands exactly on the target once the duration has elapsed', () => {
    const { container, rerender } = render(<TweenedNumber value={0} durationMs={200} />)
    rerender(<TweenedNumber value={100} durationMs={200} />)
    advance(64)
    const mid = Number(text(container))
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(100)
    advance(400)
    expect(text(container)).toBe('100')
  })

  it('starts a new tween from the number on screen when interrupted', () => {
    const { container, rerender } = render(<TweenedNumber value={0} durationMs={1000} />)
    rerender(<TweenedNumber value={100} durationMs={1000} />)
    advance(160)
    const at = Number(text(container))
    expect(at).toBeGreaterThan(10)
    rerender(<TweenedNumber value={0} durationMs={1000} />)
    advance(32)
    const next = Number(text(container))
    expect(next).toBeLessThanOrEqual(at)
    expect(next).toBeGreaterThan(0)
    advance(2000)
    expect(text(container)).toBe('0')
  })

  it('formats every frame with the given formatter', () => {
    const money = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
    const { container, rerender } = render(<TweenedNumber value={0} durationMs={300} format={money} />)
    rerender(<TweenedNumber value={500} durationMs={300} format={money} />)
    for (let i = 0; i < 6; i++) {
      advance(40)
      expect(text(container)).toMatch(/^R\$\s?[\d.]+,\d{2}$/)
    }
  })

  it('does not update after unmount mid-tween', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender, unmount } = render(<TweenedNumber value={0} durationMs={500} />)
    rerender(<TweenedNumber value={80} durationMs={500} />)
    advance(50)
    unmount()
    advance(1000)
    expect(errors).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    errors.mockRestore()
  })

  it('is not a live region and has no axe violations', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <p>
              Total <TweenedNumber value={42} durationMs={0} />
            </p>
          </ThemeScope>
        ))}
      </>,
    )
    expect(container.querySelector('[aria-live]')).toBeNull()
    vi.useRealTimers()
    await expectNoAxeViolations(container)
  })
})
