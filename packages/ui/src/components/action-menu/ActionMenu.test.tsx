import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Trash2 } from 'lucide-react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { Button } from '../button/Button'
import { ActionMenu, clampToViewport, type ActionMenuEntry } from './ActionMenu'

import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const items: ActionMenuEntry[] = [
  { id: 'open', label: 'Open' },
  { id: 'rename', label: 'Rename', shortcut: 'F2' },
  { type: 'separator' },
  { id: 'archive', label: 'Archive', disabled: true },
  { type: 'section', id: 'danger', title: 'Danger zone', items: [{ id: 'delete', label: 'Delete', tone: 'danger', icon: Trash2 }] },
]

describe('ActionMenu', () => {
  afterEach(() => vi.restoreAllMocks())

  it('opens with Enter and focuses the first enabled item', async () => {
    render(<ActionMenu label="Record actions" items={items} onAction={() => {}} trigger={<Button>Actions</Button>} />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    const menu = await screen.findByRole('menu', { name: 'Record actions' })
    expect(menu).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus()
  })

  it('opens on the last item with ArrowUp from the trigger', async () => {
    render(<ActionMenu label="Record actions" items={items} onAction={() => {}} trigger={<Button>Actions</Button>} />)
    screen.getByRole('button', { name: 'Actions' }).focus()
    await userEvent.keyboard('{ArrowUp}')
    await screen.findByRole('menu')
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
  })

  it('wraps from the last item to the first with ArrowDown', async () => {
    render(<ActionMenu label="Record actions" items={items} onAction={() => {}} trigger={<Button>Actions</Button>} />)
    screen.getByRole('button', { name: 'Actions' }).focus()
    await userEvent.keyboard('{ArrowUp}')
    await screen.findByRole('menu')
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus()
  })

  it('calls onAction once and closes when an item is activated', async () => {
    const onAction = vi.fn()
    render(<ActionMenu label="Record actions" items={items} onAction={onAction} trigger={<Button>Actions</Button>} />)
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }))
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledWith('rename')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('does not call onAction for a disabled item', async () => {
    const onAction = vi.fn()
    render(<ActionMenu label="Record actions" items={items} onAction={onAction} trigger={<Button>Actions</Button>} />)
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    const archive = await screen.findByRole('menuitem', { name: 'Archive' })
    expect(archive).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(archive)
    expect(onAction).not.toHaveBeenCalled()
  })

  it('uses a default icon-only trigger named from messages', () => {
    render(<ActionMenu label="Record actions" items={items} onAction={() => {}} />)
    expect(screen.getByRole('button', { name: 'More actions' })).toHaveAttribute('aria-haspopup', 'true')
  })

  it('keeps a context menu near the bottom-right corner inside the viewport', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 300, width: 200, height: 300, toJSON: () => ({}),
    } as DOMRect)
    render(<ActionMenu mode="context" label="Row actions" items={items} onAction={() => {}} open position={{ x: 1010, y: 760 }} trigger={<span>Row</span>} />)
    const menu = await screen.findByRole('menu')
    const popover = menu.closest('.fk-action-menu') as HTMLElement
    await waitFor(() => {
      const left = parseFloat(popover.style.left)
      const top = parseFloat(popover.style.top)
      expect(left + 200).toBeLessThanOrEqual(1024)
      expect(top + 300).toBeLessThanOrEqual(768)
      expect(left).toBeGreaterThanOrEqual(0)
    })
    expect(clampToViewport({ x: 1010, y: 760 }, 200, 300)).toEqual({ x: 816, y: 460 })
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<ActionMenu label="Record actions" items={items} onAction={() => {}} trigger={<Button>Actions</Button>} />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('menu')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes on an outside click', async () => {
    render(
      <>
        <ActionMenu label="Record actions" items={items} onAction={() => {}} trigger={<Button>Actions</Button>} />
        <button type="button">Elsewhere</button>
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    await screen.findByRole('menu')
    await userEvent.click(document.body)
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('opens a context menu with Shift+F10 on a focused row and returns focus on Escape', async () => {
    render(
      <ActionMenu
        mode="context"
        label="Row actions"
        items={items}
        onAction={() => {}}
        trigger={
          <div role="row" tabIndex={0} aria-label="Row one">
            Row one
          </div>
        }
      />,
    )
    const row = screen.getByRole('row', { name: 'Row one' })
    row.focus()
    await userEvent.keyboard('{Shift>}{F10}{/Shift}')
    expect(await screen.findByRole('menu', { name: 'Row actions' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await waitFor(() => expect(row).toHaveFocus())
  })

  it('opens a context menu from the ContextMenu key and from a right click', async () => {
    const onOpenChange = vi.fn()
    render(<ActionMenu mode="context" label="Row actions" items={items} onAction={() => {}} onOpenChange={onOpenChange} trigger={<div tabIndex={0}>Row</div>} />)
    const row = screen.getByText('Row')
    act(() => row.focus())
    fireEvent.keyDown(row, { key: 'ContextMenu' })
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    await screen.findByRole('menu')
    await userEvent.keyboard('{Escape}')
    fireEvent.contextMenu(row, { clientX: 20, clientY: 30 })
    expect(await screen.findByRole('menu')).toBeInTheDocument()
  })

  it('calls onAction and closes in context mode', async () => {
    const onAction = vi.fn()
    render(<ActionMenu mode="context" label="Row actions" items={items} onAction={onAction} trigger={<div tabIndex={0}>Row</div>} />)
    fireEvent.contextMenu(screen.getByText('Row'), { clientX: 20, clientY: 30 })
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Open' }))
    expect(onAction).toHaveBeenCalledWith('open')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('has 44 px rows on touch, reduced motion and forced colours rules', () => {
    const css = cssOf('components/action-menu/ActionMenu.css')
    expect(mediaBlock(css, /\(max-width:\s*1023\.98px\)/)).toMatch(/min-block-size:\s*var\(--fk-control-target\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/Highlight/)
    expect(forced).toMatch(/HighlightText/)
  })

  it('has no axe violations when open', async () => {
    render(<ActionMenu label="Record actions" items={items} onAction={() => {}} defaultOpen trigger={<Button>Actions</Button>} />)
    await screen.findByRole('menu')
    await expectNoAxeViolations(document.body)
  })
})

describe('ActionMenu in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    renderRtl(<ActionMenu label="إجراءات" trigger={<Button>المزيد</Button>} items={[{ id: 'open', label: 'فتح' }, { id: 'export', label: 'تصدير' }]} onAction={() => {}} />)
    await rtlUser.click(rtlDom.screen.getByRole('button', { name: 'المزيد' }))
    expect(await rtlDom.screen.findByRole('menu')).toBeInTheDocument()
    await axeRtl(document.body)
  })
})
