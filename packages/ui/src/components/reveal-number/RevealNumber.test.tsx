import { act, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { setMedia } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { RevealNumber } from './RevealNumber'

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void
const observers: Array<{ cb: Callback; threshold: unknown; disconnected: boolean }> = []

class FakeObserver {
  private rec: { cb: Callback; threshold: unknown; disconnected: boolean }
  constructor(cb: Callback, options?: { threshold?: unknown }) {
    this.rec = { cb, threshold: options?.threshold, disconnected: false }
    observers.push(this.rec)
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.rec.disconnected = true
  }
}

const run = (c: HTMLElement) => c.querySelector('.fk-reveal-number__run')!.textContent
const spoken = (c: HTMLElement) => c.querySelector('.fk-visually-hidden')!.textContent

function view(visible: boolean) {
  act(() => {
    for (const o of observers) if (!o.disconnected) o.cb([{ isIntersecting: visible }])
  })
}

beforeEach(() => {
  observers.length = 0
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('RevealNumber', () => {
  it('shows from while out of view and exposes only the final value', () => {
    const { container } = render(<RevealNumber to={94} durationMs={200} />)
    expect(run(container)).toBe('0')
    expect(spoken(container)).toBe('94')
    expect(container.querySelector('.fk-reveal-number__run')).toHaveAttribute('aria-hidden', 'true')
    expect(observers[0]!.threshold).toBe(0.5)
  })

  it('counts to the final value once it enters the view', () => {
    const { container } = render(<RevealNumber to={94} durationMs={200} />)
    view(true)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    const mid = Number(run(container))
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(94)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(run(container)).toBe('94')
  })

  it('shows the final value at once under reduced motion and requests no frame', () => {
    setMedia({ reducedMotion: true })
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    const { container } = render(<RevealNumber to={94} />)
    view(true)
    expect(run(container)).toBe('94')
    expect(raf).not.toHaveBeenCalled()
    expect(observers).toHaveLength(0)
    raf.mockRestore()
  })

  it('counts again on re-entry when once is false', () => {
    const { container } = render(<RevealNumber to={10} once={false} durationMs={100} />)
    view(true)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(run(container)).toBe('10')
    view(false)
    expect(run(container)).toBe('0')
    view(true)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(run(container)).toBe('10')
  })

  it('stays at the final value with once (observer disconnected)', () => {
    const { container } = render(<RevealNumber to={10} durationMs={200} />)
    view(true)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(observers[0]!.disconnected).toBe(true)
    expect(run(container)).toBe('10')
  })

  it('renders the final value on the server', () => {
    const html = renderToString(<RevealNumber to={94} format={(n) => `${Math.round(n)} cases`} />)
    expect(html).toContain('94 cases')
    expect(html).not.toMatch(/>0 cases</)
  })

  it('applies the formatter to every frame and reserves the final width', () => {
    const { container } = render(<RevealNumber from={0} to={1500} durationMs={100} format={(n) => `R$ ${n.toFixed(2)}`} />)
    expect(container.querySelector('.fk-reveal-number__ghost')).toHaveTextContent('R$ 1500.00')
    view(true)
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(run(container)).toMatch(/^R\$ \d+\.\d{2}$/)
  })

  it('has no axe violations', async () => {
    vi.useRealTimers()
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <p>
              <RevealNumber to={94} /> cases
            </p>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
