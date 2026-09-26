import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { GroupedDisclosureList } from './GroupedDisclosureList'

type Rec = { id: string; name: string }
const groups = [
  { key: 'A', header: 'Proved', items: [{ id: 'a1', name: 'TAMM' }] as Rec[] },
  { key: 'B', header: 'Pending', items: [{ id: 'b1', name: 'Boti' }] as Rec[] },
]
const item = (r: Rec) => <a href={`#/${r.id}`}>{r.name}</a>

describe('GroupedDisclosureList', () => {
  it('shows every group expanded by default', () => {
    render(<GroupedDisclosureList groups={groups} renderItem={item} getItemKey={(r) => r.id} />)
    expect(screen.getByRole('button', { name: 'Proved' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Pending' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'TAMM' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Boti' })).toBeVisible()
  })

  it('removes collapsed items from the accessibility tree and reports the key', async () => {
    const onCollapsedChange = vi.fn()
    render(<GroupedDisclosureList groups={groups} renderItem={item} getItemKey={(r) => r.id} onCollapsedChange={onCollapsedChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Proved' }))
    expect(screen.queryByRole('link', { name: 'TAMM' })).toBeNull()
    expect(onCollapsedChange).toHaveBeenLastCalledWith(['A'])
  })

  it('tabs from a collapsed header to the next header', async () => {
    render(<GroupedDisclosureList groups={groups} renderItem={item} getItemKey={(r) => r.id} defaultCollapsedKeys={['A']} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Proved' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Pending' })).toHaveFocus()
  })

  it('wraps each header button in a heading of the given level', () => {
    render(<GroupedDisclosureList groups={groups} renderItem={item} getItemKey={(r) => r.id} headingLevel={4} />)
    const headings = screen.getAllByRole('heading', { level: 4 })
    expect(headings).toHaveLength(2)
    expect(headings[0]).toContainElement(screen.getByRole('button', { name: 'Proved' }))
  })

  it('moves between headers with the arrow keys, Home and End', async () => {
    render(<GroupedDisclosureList groups={groups} renderItem={item} getItemKey={(r) => r.id} />)
    screen.getByRole('button', { name: 'Proved' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Pending' })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('button', { name: 'Proved' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('button', { name: 'Pending' })).toHaveFocus()
  })

  it('honours controlled collapsed keys', () => {
    render(<GroupedDisclosureList groups={groups} renderItem={item} getItemKey={(r) => r.id} collapsedKeys={['B']} />)
    expect(screen.getByRole('button', { name: 'Pending' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('runs no transition under reduced motion', () => {
    const reduced = mediaBlock(cssOf('components/grouped-disclosure-list/GroupedDisclosureList.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/transition:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <GroupedDisclosureList groups={groups.map((g) => ({ ...g, key: `${scheme}-${g.key}` }))} renderItem={item} getItemKey={(r) => r.id} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
