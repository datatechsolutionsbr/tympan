import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { DeltaIndicator } from './DeltaIndicator'

const box = (c: HTMLElement) => c.querySelector('.fk-delta') as HTMLElement

describe('DeltaIndicator', () => {
  it('shows a signed percentage, an up glyph and the word "up"', () => {
    const { container } = render(<DeltaIndicator value={12.34} />)
    const el = box(container)
    expect(el).toHaveAttribute('data-trend', 'up')
    expect(el).toHaveTextContent('+12.3%')
    expect(el.textContent).toMatch(/^up /)
    expect(el.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows a negative number with a true minus sign and a down glyph', () => {
    const { container } = render(<DeltaIndicator value={-3} unit="number" />)
    expect(box(container)).toHaveAttribute('data-trend', 'down')
    expect(screen.getByText('−3')).toBeInTheDocument()
  })

  it('renders nothing for zero with hideWhenZero and no value', () => {
    const { container } = render(<DeltaIndicator value={0} hideWhenZero showValue={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for null', () => {
    const { container } = render(<DeltaIndicator value={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('uses the error tone for a rise when lower is better, and neutral for zero', () => {
    const { container, rerender } = render(<DeltaIndicator value={4} polarity="lower-is-better" />)
    expect(box(container)).toHaveAttribute('data-sentiment', 'negative')
    rerender(<DeltaIndicator value={0} />)
    expect(box(container)).toHaveAttribute('data-sentiment', 'neutral')
    expect(box(container)).toHaveTextContent('no change')
  })

  it('accepts a custom formatter', () => {
    render(<DeltaIndicator value={2} format={(v) => `${v} pts`} />)
    expect(screen.getByText('2 pts')).toBeInTheDocument()
  })

  it('keeps a pill border in forced colours and never goes below 12 px', () => {
    const css = cssOf('components/delta-indicator/DeltaIndicator.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/\.fk-delta\[data-appearance='pill'\]\s*\{[^}]*border:\s*1px solid CanvasText/)
    expect(css).toMatch(/font-size:\s*var\(--fk-font-size-meta\)/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <DeltaIndicator value={10.5} appearance="pill" />
            <DeltaIndicator value={-2} unit="number" size="medium" />
            <DeltaIndicator value={0} polarity="neutral" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
