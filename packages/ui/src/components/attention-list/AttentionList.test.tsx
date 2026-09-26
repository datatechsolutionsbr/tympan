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
  { id: 'tamm', proof: 'pending', title: 'TAMM', detail: 'Launch year without a source', action: { label: 'Verify', onPress: verify } },
  { id: 'boti', proof: 'refuted', title: 'Boti', detail: 'Stage refuted by the second coder', action: { label: 'Review', href: '/base/boti' } },
  { id: 'burokratt', proof: 'not_disclosed', title: 'Bürokratt', detail: 'Operator not informed' },
  { id: 'sp156', proof: 'none', title: 'SP156', detail: 'No proof yet' },
]

describe('AttentionList', () => {
  it('lists rows with state word, title and detail', () => {
    render(<AttentionList items={items.slice(0, 2)} label="What needs you" />)
    const list = screen.getByRole('list', { name: 'What needs you' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('pending')
    expect(rows[0]).toHaveTextContent('TAMM')
    expect(rows[0]).toHaveTextContent('Launch year without a source')
  })

  it('names each action with the row title and calls onPress', async () => {
    renderWithProvider(<AttentionList items={items} label="Attention" />, { navigate: vi.fn() })
    await userEvent.click(screen.getByRole('button', { name: 'Verify: TAMM' }))
    expect(verify).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Review: Boti' })).toHaveAttribute('href', '/base/boti')
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
    expect(css).toMatch(/\.fk-attention__row\s*\{[^}]*border-block-end:\s*1px solid var\(--fk-line\)/)
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
