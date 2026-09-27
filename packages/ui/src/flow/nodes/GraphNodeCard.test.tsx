import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Quote } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { ActorChip, ProofBadge } from '../../index'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { GraphNodeCard } from './GraphNodeCard'

describe('GraphNodeCard', () => {
  it('activates once on Enter when interactive', async () => {
    const onActivate = vi.fn()
    render(<GraphNodeCard kind="code" kindLabel="Compute" title="Sum" onActivate={onActivate} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Compute: Sum' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('renames on double-click and Enter', async () => {
    const onRename = vi.fn()
    render(<GraphNodeCard kind="code" title="Old" onActivate={() => {}} onRename={onRename} />)
    await userEvent.dblClick(screen.getByText('Old'))
    const field = screen.getByRole('textbox')
    await userEvent.clear(field)
    await userEvent.type(field, 'New{Enter}')
    expect(onRename).toHaveBeenCalledWith('New')
  })

  it('does not rename when the value is cleared or unchanged on blur', async () => {
    const onRename = vi.fn()
    render(<GraphNodeCard kind="code" title="Same" onActivate={() => {}} onRename={onRename} />)
    await userEvent.dblClick(screen.getByText('Same'))
    await userEvent.tab()
    await userEvent.dblClick(screen.getByText('Same'))
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.tab()
    expect(onRename).not.toHaveBeenCalled()
  })

  it('keeps keys typed while renaming away from canvas shortcuts', async () => {
    const shortcut = vi.fn()
    render(
      <div onKeyDown={shortcut}>
        <GraphNodeCard kind="code" title="T" onActivate={() => {}} onRename={() => {}} />
      </div>,
    )
    screen.getByRole('button').focus()
    await userEvent.keyboard('{F2}')
    shortcut.mockClear()
    await userEvent.keyboard('v')
    expect(shortcut).not.toHaveBeenCalled()
  })

  it('hides description and meta in compact density', () => {
    const { rerender } = render(<GraphNodeCard kind="code" title="T" description="desc" meta={<span>meta row</span>} />)
    expect(screen.getByText('desc')).toBeInTheDocument()
    expect(screen.getByText('meta row')).toBeInTheDocument()
    rerender(<GraphNodeCard kind="code" title="T" description="desc" meta={<span>meta row</span>} density="compact" />)
    expect(screen.queryByText('desc')).toBeNull()
    expect(screen.queryByText('meta row')).toBeNull()
  })

  it('explains a problem with an icon and text', () => {
    const { container } = render(<GraphNodeCard kind="agent" title="Gone" problem="Agent not found" />)
    expect(screen.getByText('Agent not found')).toBeInTheDocument()
    expect(container.querySelector('.ty-node-card__problem svg')).not.toBeNull()
    expect(container.querySelector('.ty-node-card')).toHaveAttribute('data-problem', 'true')
  })

  it('renders a proof badge in the meta row unchanged (provenance composition)', async () => {
    const { container } = render(
      <GraphNodeCard
        kind="assertion"
        kindLabel="assertion"
        title="air.pm25_days_above_limit"
        description="assertion"
        icon={Quote}
        proofState="proved"
        onActivate={() => {}}
        meta={
          <>
            <ProofBadge state="proved" size="compact" />
            <ActorChip kind="agent" name="coder" compact />
          </>
        }
      />,
    )
    expect(container.querySelector('.ty-node-card__meta .ty-proof-badge')).toHaveAttribute('data-state', 'proved')
    expect(container.querySelector('.ty-node-card')).toHaveAttribute('data-proof-state', 'proved')
    await expectNoAxeViolations(container)
  })

  it('uses a real sibling button for delete, named with the title', async () => {
    const onDelete = vi.fn()
    const onActivate = vi.fn()
    const { container } = render(<GraphNodeCard kind="code" title="Sum" onActivate={onActivate} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Sum' }))
    expect(onDelete).toHaveBeenCalled()
    expect(onActivate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Remove Sum' }).closest('.ty-node-card__activator')).toBeNull()
    await expectNoAxeViolations(container)
  })

  it('exposes state words in the description and is a named group when not interactive', () => {
    render(<GraphNodeCard kind="code" kindLabel="Compute" title="Sum" selected runState="failed" />)
    const group = screen.getByRole('group', { name: 'Compute: Sum' })
    expect(group).toHaveAccessibleDescription('selected, failed')
  })

  it('stops transitions under reduced motion and keeps state visible in forced colours', () => {
    const css = cssOf('flow/nodes/GraphNodeCard.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/Highlight/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency: reduce\)/)).toMatch(/surface-solid/)
  })
})
