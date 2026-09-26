import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { RouteProgress } from './RouteProgress'

const bar = (c: HTMLElement) => c.querySelector('.fk-route-progress__bar')

describe('RouteProgress', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('never appears for a navigation that settles before the delay', () => {
    const { container, rerender } = render(<RouteProgress pending delay={200} />)
    act(() => void vi.advanceTimersByTime(120))
    rerender(<RouteProgress pending={false} delay={200} />)
    act(() => void vi.advanceTimersByTime(1000))
    expect(bar(container)).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('appears for a long navigation and announces once', () => {
    const { container } = render(<RouteProgress pending delay={200} />)
    act(() => void vi.advanceTimersByTime(250))
    expect(bar(container)).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Loading page')
    act(() => void vi.advanceTimersByTime(5000))
    expect(screen.getAllByText('Loading page')).toHaveLength(1)
  })

  it('removes the bar after completion and leaves nothing focusable', () => {
    const { container, rerender } = render(<RouteProgress pending delay={0} />)
    act(() => void vi.advanceTimersByTime(10))
    rerender(<RouteProgress pending={false} delay={0} />)
    expect(bar(container)).toHaveAttribute('data-phase', 'finishing')
    act(() => void vi.advanceTimersByTime(300))
    expect(bar(container)).toBeNull()
    expect(container.querySelector('[tabindex],button,a')).toBeNull()
  })

  it('runs no animation under reduced motion; Highlight in forced colours', () => {
    const css = cssOf('components/route-progress/RouteProgress.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    vi.useRealTimers()
    const { container } = render(
      <>
        <ThemeScope scheme="light">
          <RouteProgress pending delay={0} label="Loading light" />
        </ThemeScope>
        <ThemeScope scheme="dark">
          <RouteProgress pending delay={0} label="Loading dark" />
        </ThemeScope>
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
