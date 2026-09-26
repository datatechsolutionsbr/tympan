import { I18nProvider } from 'react-aria-components'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { ThemeScope } from '../../internal/ThemeScope'
import { StatStrip, type StatStripItem } from './StatStrip'

const items: StatStripItem[] = [
  { id: 'records', value: 94, label: 'records', href: '/base' },
  { id: 'proved', value: 512, label: 'proved claims', proof: 'proved' },
  { id: 'pending', value: 145, label: 'pending', detail: '12 assigned to you' },
]

describe('StatStrip', () => {
  it('is a labelled description list with a term and a value per item', () => {
    render(<StatStrip items={items} label="State of the research" />)
    const group = screen.getByRole('group', { name: 'State of the research' })
    expect(group.querySelectorAll('dt')).toHaveLength(3)
    expect(within(group).getByText('512')).toBeInTheDocument()
    expect(within(group).getByText('12 assigned to you')).toBeInTheDocument()
  })

  it('formats numbers for the locale', () => {
    render(<StatStrip items={[{ id: 'a', value: 1234, label: 'sources' }]} label="Stats" locale="pt-BR" />)
    expect(screen.getByText('1.234')).toBeInTheDocument()
  })

  it('links a value, named with value and label', () => {
    renderWithProvider(<StatStrip items={items} label="Stats" />, { navigate: vi.fn() })
    expect(screen.getByRole('link', { name: '94 records' })).toHaveAttribute('href', '/base')
  })

  it('shows the word of a proof state', () => {
    render(<StatStrip items={items} label="Stats" />)
    expect(screen.getByText('proved')).toBeInTheDocument()
  })

  it('uses hairlines (no cards), two columns on phones, system colours when forced', () => {
    const css = cssOf('components/stat-strip/StatStrip.css')
    expect(css).toMatch(/\.ty-stat-strip__item\s*\{[^}]*border-inline-start:\s*1px solid var\(--ty-line\)/)
    expect(css).not.toMatch(/box-shadow/)
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/repeat\(2/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = renderWithProvider(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <StatStrip items={items} label={`Stats ${scheme}`} />
          </ThemeScope>
        ))}
      </>,
      { navigate: vi.fn() },
    )
    await expectNoAxeViolations(container)
  })
})

describe('StatStrip in right-to-left', () => {
  it('uses the locale digits and passes axe under dir="rtl"', async () => {
    const { container } = render(
      <I18nProvider locale="ar-EG">
        <div dir="rtl" lang="ar">
          <StatStrip items={[{ id: 'a', value: 94, label: 'سجلات' }]} label="الحالة" />
        </div>
      </I18nProvider>,
    )
    expect(screen.getByText('٩٤')).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })
})
