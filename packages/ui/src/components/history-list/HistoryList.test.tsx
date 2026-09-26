import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { HistoryList, type HistoryEntry } from './HistoryList'

const entries: HistoryEntry[] = [
  { id: 'a', start: 'Ana · 23 Sep', summary: 'Coded the value', details: 'Detail A' },
  { id: 'b', start: 'Agent · 22 Sep', end: '2 changes', details: 'Detail B' },
  { id: 'c', start: 'System · 21 Sep', details: 'Detail C' },
]

const base = { loadingLabel: 'Loading the history', emptyLabel: 'No history yet' }

describe('HistoryList', () => {
  it('opens the second entry', async () => {
    render(<HistoryList items={entries} {...base} />)
    const second = screen.getByRole('button', { name: /Agent/ })
    await userEvent.click(second)
    expect(second).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Detail B')).toBeVisible()
  })

  it('closes the open entry in single mode', async () => {
    const onExpandedChange = vi.fn()
    render(<HistoryList items={entries} {...base} defaultExpandedIds={['a']} onExpandedChange={onExpandedChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Agent/ }))
    expect(screen.getByRole('button', { name: /Ana/ })).toHaveAttribute('aria-expanded', 'false')
    expect(onExpandedChange).toHaveBeenLastCalledWith(['b'])
  })

  it('keeps several entries open in multiple mode', async () => {
    render(<HistoryList items={entries} {...base} expansion="multiple" />)
    await userEvent.click(screen.getByRole('button', { name: /Ana/ }))
    await userEvent.click(screen.getByRole('button', { name: /Agent/ }))
    expect(screen.getByRole('button', { name: /Ana/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Agent/ })).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders an entry without details as a static header', () => {
    render(<HistoryList items={[{ id: 'x', start: 'Frozen edition' }]} {...base} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Frozen edition')).toBeInTheDocument()
  })

  it('shows a status and no entries while loading', () => {
    const { container } = render(<HistoryList items={entries} {...base} loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading the history')
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText(/Ana/)).toBeNull()
  })

  it('shows the empty label without items', () => {
    render(<HistoryList items={[]} {...base} />)
    expect(screen.getByText('No history yet')).toBeInTheDocument()
  })

  it('keeps 44 px headers and no transition under reduced motion', () => {
    const css = cssOf('components/history-list/HistoryList.css')
    expect(css).toMatch(/__header\s*\{[^}]*min-block-size:\s*var\(--fk-control-target\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <HistoryList items={entries.map((e) => ({ ...e, id: `${scheme}-${e.id}` }))} {...base} defaultExpandedIds={[`${scheme}-a`]} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
