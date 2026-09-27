import { I18nProvider } from 'react-aria-components'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { ThemeScope } from '../../internal/ThemeScope'
import { AttentionList, type AttentionItem } from './AttentionList'

const verify = vi.fn()
const items: AttentionItem[] = [
  { id: 'centro', proof: 'pending', title: 'Centro', detail: 'PM2.5 reading without a source', action: { label: 'Verify', onPress: verify } },
  { id: 'harbour', proof: 'refuted', title: 'Harbour', detail: 'NO₂ peak refuted by the second reading', action: { label: 'Review', href: '/base/harbour' } },
  { id: 'riverside', proof: 'not_disclosed', title: 'Riverside', detail: 'Calibration not informed' },
  { id: 'park', proof: 'none', title: 'Park', detail: 'No proof yet' },
]

describe('AttentionList', () => {
  it('lists rows with state word, title and detail', () => {
    render(<AttentionList items={items.slice(0, 2)} label="What needs you" />)
    const list = screen.getByRole('list', { name: 'What needs you' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('pending')
    expect(rows[0]).toHaveTextContent('Centro')
    expect(rows[0]).toHaveTextContent('PM2.5 reading without a source')
  })

  it('names each action with the row title and calls onPress', async () => {
    renderWithProvider(<AttentionList items={items} label="Attention" />, { navigate: vi.fn() })
    await userEvent.click(screen.getByRole('button', { name: 'Verify: Centro' }))
    expect(verify).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Review: Harbour' })).toHaveAttribute('href', '/base/harbour')
  })

  it('shows the empty text without rows', () => {
    render(<AttentionList items={[]} label="Attention" />)
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('Nothing needs you right now.')).toBeInTheDocument()
  })

  it('truncates to maxRows and shows the see-all link', () => {
    renderWithProvider(<AttentionList items={items} label="Attention" maxRows={2} seeAllHref="/verify" />, { navigate: vi.fn() })
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'See all' })).toHaveAttribute('href', '/verify')
  })

  it('stacks the action on phones and keeps rows as dividers', () => {
    const css = cssOf('components/attention-list/AttentionList.css')
    expect(css).toMatch(/\.ty-attention__row\s*\{[^}]*border-block-end:\s*1px solid var\(--ty-line\)/)
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = renderWithProvider(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <AttentionList items={items} label={`Attention ${scheme}`} seeAllHref="/verify" />
          </ThemeScope>
        ))}
      </>,
      { navigate: vi.fn() },
    )
    await expectNoAxeViolations(container)
  })
})

describe('AttentionList in right-to-left', () => {
  it('renders and passes axe under dir="rtl"', async () => {
    const { container } = renderWithProvider(
      <I18nProvider locale="ar">
        <div dir="rtl" lang="ar">
          <AttentionList items={items} label="ما يحتاجك" />
        </div>
      </I18nProvider>,
      { navigate: vi.fn() },
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    await expectNoAxeViolations(container)
  })
})
