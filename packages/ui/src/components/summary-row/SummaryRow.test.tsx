import { render, screen, within } from '@testing-library/react'
import { FileText } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { SummaryRow } from './SummaryRow'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('SummaryRow', () => {
  it('exposes metadata as a description list of terms and definitions', () => {
    const { container } = render(
      <SummaryRow
        title="Survey A"
        metadata={[
          { label: 'Status', value: 'open' },
          { label: 'Answers', value: 42 },
        ]}
      />,
    )
    const dl = container.querySelector('dl')!
    expect(within(dl).getAllByRole('term')).toHaveLength(2)
    expect(within(dl).getAllByRole('definition')).toHaveLength(2)
    expect(dl.textContent).toContain('Statusopen')
  })

  it('truncates the title visually but keeps the full text for screen readers', () => {
    const long = 'A very long title that does not fit on a single narrow line of the row'
    render(<SummaryRow title={long} />)
    const title = screen.getByText(long)
    expect(title).toHaveAttribute('title', long)
    expect(cssOf('components/summary-row/SummaryRow.css')).toMatch(/\.fk-summary-row__title,[^{]*\{[^}]*text-overflow:\s*ellipsis/)
  })

  it('renders no tile without an icon', () => {
    const { container, rerender } = render(<SummaryRow title="No icon" />)
    expect(container.querySelector('.fk-summary-row__tile')).toBeNull()
    rerender(<SummaryRow title="Icon" icon={<FileText />} iconTone="accent" />)
    const tile = container.querySelector('.fk-summary-row__tile')!
    expect(tile).toHaveAttribute('aria-hidden', 'true')
    expect(tile).toHaveAttribute('data-tone', 'accent')
  })

  it('renders the title as a heading of the requested level', () => {
    render(<SummaryRow title="Identification" titleLevel={3} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Identification' })).toBeInTheDocument()
  })

  it('keeps a tile border in forced colours and tabular numbers in values', () => {
    const css = cssOf('components/summary-row/SummaryRow.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
    expect(css).toMatch(/tabular-nums/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <SummaryRow title="Survey A" subtitle="Questionnaire" icon={<FileText />} metadata={[{ label: 'Answers', value: 42 }]} titleLevel={4} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('SummaryRow in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<SummaryRow title="تعداد المساعدات الحكومية" subtitle="المالك" />)
    expect(rtlDom.screen.getByText('تعداد المساعدات الحكومية')).toBeInTheDocument()
    await axeRtl(container)
  })
})
