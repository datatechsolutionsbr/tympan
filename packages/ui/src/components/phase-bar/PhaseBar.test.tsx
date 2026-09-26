import { I18nProvider } from 'react-aria-components'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { PhaseBar, shares, type PhaseSegment } from './PhaseBar'

const segments: PhaseSegment[] = [
  { id: 'p', label: 'proved', value: 512, tone: 'proved' },
  { id: 'w', label: 'pending', value: 145, tone: 'pending' },
  { id: 'r', label: 'refuted', value: 7, tone: 'refuted' },
  { id: 'n', label: 'not disclosed', value: 64, tone: 'not_disclosed' },
]

describe('PhaseBar', () => {
  it('names the image with every segment and count', () => {
    render(<PhaseBar segments={segments} label="State of proof" locale="en" />)
    expect(screen.getByRole('img', { name: 'State of proof: proved 512, pending 145, refuted 7, not disclosed 64' })).toBeInTheDocument()
  })

  it('computes shares by value', () => {
    expect(shares([3, 1])).toEqual([75, 25])
    const { container } = render(<PhaseBar segments={[{ id: 'a', label: 'a', value: 3, tone: 'accent' }, { id: 'b', label: 'b', value: 1, tone: 'neutral' }]} label="Split" />)
    expect((container.querySelector('.fk-phase-bar__segment') as HTMLElement).style.getPropertyValue('--fk-phase-share')).toBe('75%')
  })

  it('renders an empty track with zero total and still lists zeros', () => {
    const { container } = render(<PhaseBar segments={[{ id: 'a', label: 'proved', value: 0, tone: 'proved' }]} label="Empty" locale="en" />)
    expect(container.querySelectorAll('.fk-phase-bar__segment')).toHaveLength(0)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('keeps thin segments visible and uses textures, with borders when colours are forced', () => {
    const css = cssOf('components/phase-bar/PhaseBar.css')
    expect(css).toMatch(/min-inline-size:\s*2px/)
    expect(css).toMatch(/\[data-tone='pending'\]\s*\{[^}]*repeating-linear-gradient/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <PhaseBar segments={segments} label={`Proof ${scheme}`} caption="Two thirds of the claims already have an open source." />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('PhaseBar in right-to-left', () => {
  it('names the bar with the locale list style and passes axe', async () => {
    const { container } = render(
      <I18nProvider locale="ar-EG">
        <div dir="rtl" lang="ar">
          <PhaseBar segments={segments.slice(0, 2)} label="الإثبات" />
        </div>
      </I18nProvider>,
    )
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/٥١٢/)
    await expectNoAxeViolations(container)
  })
})
