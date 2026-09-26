import { I18nProvider } from 'react-aria-components'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { ThemeScope } from '../../internal/ThemeScope'
import { ActivityFeed, relativePhrase, type ActivityEntry } from './ActivityFeed'

const now = new Date('2026-09-26T12:00:00Z')
const entries: ActivityEntry[] = [
  { id: '1', actor: { kind: 'person', name: 'Natalia Mesquita' }, text: 'verified the launch year of TAMM', at: '2026-09-26T11:55:00Z', meta: 'ae-tamm-4-0' },
  { id: '2', actor: { kind: 'agent', name: 'stage-counter', agentKey: 'agt_7f' }, text: 'ran the stage count', at: '2026-09-26T09:00:00Z', meta: 'run 2026-09-26' },
  { id: '3', actor: { kind: 'system', name: 'freeze@2' }, text: 'froze edition 2026-09-20', at: '2026-09-20T03:00:00Z' },
]

describe('ActivityFeed', () => {
  it('renders an ordered list in the given order', () => {
    render(<ActivityFeed entries={entries} label="Recent activity" now={now} locale="en" />)
    const list = screen.getByRole('list', { name: 'Recent activity' })
    expect(list.tagName).toBe('OL')
    const items = within(list).getAllByRole('listitem')
    expect(items.map((i) => i.querySelector('.fk-activity__text')!.textContent)).toEqual([
      'verified the launch year of TAMM',
      'ran the stage count',
      'froze edition 2026-09-20',
    ])
  })

  it('shows the word "agent" for an agent', () => {
    render(<ActivityFeed entries={entries} label="Recent activity" now={now} locale="en" />)
    expect(within(screen.getAllByRole('listitem')[1]!).getByText('agent')).toBeInTheDocument()
  })

  it('shows a time element with the ISO date and a relative text', () => {
    render(<ActivityFeed entries={entries} label="Recent activity" now={now} locale="en" />)
    const time = screen.getAllByRole('listitem')[0]!.querySelector('time')!
    expect(time).toHaveAttribute('datetime', '2026-09-26T11:55:00.000Z')
    expect(time).toHaveTextContent('5 minutes ago')
    expect(time.getAttribute('title')).toMatch(/2026/)
  })

  it('puts the actor before the time in DOM order', () => {
    render(<ActivityFeed entries={entries} label="Recent activity" now={now} locale="en" />)
    const first = screen.getAllByRole('listitem')[0]!
    const name = within(first).getByText('Natalia Mesquita')
    expect(name.compareDocumentPosition(first.querySelector('time')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('picks the unit by magnitude and localises it', () => {
    expect(relativePhrase(new Date('2026-09-26T09:00:00Z'), now, 'en')).toBe('3 hours ago')
    expect(relativePhrase(new Date('2026-09-20T12:00:00Z'), now, 'pt-BR')).toBe('há 6 dias')
  })

  it('shows the empty sentence and wraps meta on phones', () => {
    render(<ActivityFeed entries={[]} label="Recent activity" />)
    expect(screen.getByText('No activity yet.')).toBeInTheDocument()
    expect(mediaBlock(cssOf('components/activity-feed/ActivityFeed.css'), /\(max-width:\s*639\.98px\)/)).toMatch(/flex-direction:\s*column/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = renderWithProvider(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <ActivityFeed entries={entries} label={`Activity ${scheme}`} now={now} moreHref="/trail" moreLabel="See trail" />
          </ThemeScope>
        ))}
      </>,
      { navigate: vi.fn() },
    )
    await expectNoAxeViolations(container)
  })
})

describe('ActivityFeed in right-to-left', () => {
  it('writes relative time in the locale and passes axe', async () => {
    const { container } = renderWithProvider(
      <I18nProvider locale="ar">
        <div dir="rtl" lang="ar">
          <ActivityFeed entries={entries} label="النشاط" now={now} />
        </div>
      </I18nProvider>,
      { navigate: vi.fn() },
    )
    expect(container.querySelector('time')!.textContent).toMatch(/دقائق|دقيقة/)
    await expectNoAxeViolations(container)
  })
})
