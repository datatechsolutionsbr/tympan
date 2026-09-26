import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Landmark } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { TickerCard, type TickerEntry } from './TickerCard'

const entries: TickerEntry[] = [
  { id: 'ee', name: 'Estonia', qualifier: '2026', value: '0.81', change: { value: '+0.04', direction: 'up', sentiment: 'positive' } },
  { id: 'uk', name: 'United Kingdom of Great Britain and Northern Ireland', qualifier: '2026', value: '0.77', change: { value: '+0.02', direction: 'up', sentiment: 'negative' } },
  { id: 'br', name: 'Brazil', value: '0.64', change: { value: '0.00', direction: 'flat' } },
]

describe('TickerCard', () => {
  it('renders the entries in the given order', () => {
    render(<TickerCard title="TAU index" entries={entries} />)
    const rows = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(rows.map((r) => r.querySelector('.ty-ticker-card__name')!.textContent)).toEqual(['Estonia', entries[1]!.name, 'Brazil'])
  })

  it('keeps direction and sentiment apart: an upward arrow with the negative tone and word', () => {
    const { container } = render(<TickerCard title="TAU index" entries={entries} />)
    const mark = container.querySelectorAll('.ty-delta')[1]!
    expect(mark).toHaveAttribute('data-trend', 'up')
    expect(mark).toHaveAttribute('data-sentiment', 'negative')
    expect(mark).toHaveTextContent('up')
  })

  it('keeps the full name as the accessible name of a truncated row, in reading order', () => {
    render(<TickerCard title="TAU index" entries={entries} onEntryPress={() => {}} />)
    const row = screen.getByRole('button', { name: /United Kingdom of Great Britain and Northern Ireland/ })
    expect(row.textContent).toMatch(/Northern Ireland, 2026, value 0\.77, change up \+0\.02/)
    expect(cssOf('components/ticker-card/TickerCard.css')).toMatch(/\.ty-ticker-card__name\s*\{[^}]*text-overflow:\s*ellipsis/)
  })

  it('shows the empty line without entries', () => {
    render(<TickerCard title="TAU index" entries={[]} />)
    expect(screen.getByText('No entries to show.')).toBeInTheDocument()
  })

  it('calls onEntryPress with the id on Enter', async () => {
    const onEntryPress = vi.fn()
    render(<TickerCard title="TAU index" entries={entries} onEntryPress={onEntryPress} />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(onEntryPress).toHaveBeenCalledWith('ee')
  })

  it('limits the rows, shows skeleton rows while loading, keeps arrows in forced colours', () => {
    const { rerender } = render(<TickerCard title="T" entries={entries} maxEntries={2} seeAll={{ label: 'See all', href: '#/all' }} asOf="As of 20 Sep" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'See all' })).toBeInTheDocument()
    rerender(<TickerCard title="T" entries={entries} loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading entries')
    expect(mediaBlock(cssOf('components/delta-indicator/DeltaIndicator.css'), /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <TickerCard title={`TAU ${s}`} icon={Landmark} entries={entries} asOf="As of 20 Sep" seeAll={{ label: 'See all', href: '#/all' }} />
            <TickerCard title={`Pressable ${s}`} entries={entries} onEntryPress={() => {}} />
            <TickerCard title={`Empty ${s}`} entries={[]} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
