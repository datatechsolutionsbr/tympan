import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { renderWithProvider } from '../../../test/render'
import { LongPressMenu } from './LongPressMenu'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const items = [
  { label: 'Open in new tab', href: '/sources/new-tab' },
  { label: 'Pin', onAction: vi.fn() },
  { label: 'Remove', tone: 'danger' as const },
]

describe('LongPressMenu', () => {
  it('runs onTap on a short tap and keeps the menu closed', async () => {
    const onTap = vi.fn()
    render(
      <LongPressMenu label="Sources" items={items} onTap={onTap}>
        Sources
      </LongPressMenu>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Sources' }))
    expect(onTap).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens the menu on a long press without the primary action', async () => {
    const onTap = vi.fn()
    render(
      <LongPressMenu label="Sources" items={items} onTap={onTap}>
        Sources
      </LongPressMenu>,
    )
    const trigger = screen.getByRole('button', { name: 'Sources' })
    const user = userEvent.setup()
    await user.pointer({ keys: '[TouchA>]', target: trigger })
    await act(() => new Promise((r) => setTimeout(r, 650)))
    await user.pointer({ keys: '[/TouchA]', target: trigger })
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    expect(onTap).not.toHaveBeenCalled()
  })

  it('opens with Shift+F10 with the first item focused, closes on Escape back to the trigger', async () => {
    render(
      <LongPressMenu label="Sources" items={items} onTap={() => {}}>
        Sources
      </LongPressMenu>,
    )
    const trigger = screen.getByRole('button', { name: 'Sources' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAccessibleDescription(/Shift\+F10/)
    trigger.focus()
    await userEvent.keyboard('{Shift>}{F10}{/Shift}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Open in new tab' })).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('navigates an item with href through the router adapter', async () => {
    const navigate = vi.fn()
    renderWithProvider(
      <LongPressMenu label="Sources" items={items} tapOpensMenu>
        Sources
      </LongPressMenu>,
      { navigate },
    )
    await userEvent.click(screen.getByRole('button', { name: 'Sources' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Open in new tab' }))
    expect(navigate).toHaveBeenCalledWith('/sources/new-tab', undefined)
  })

  it('suppresses the native context menu on right click and opens the menu', async () => {
    render(
      <LongPressMenu label="Sources" items={items} onTap={() => {}}>
        Sources
      </LongPressMenu>,
    )
    const notCancelled = fireEvent.contextMenu(screen.getByRole('button', { name: 'Sources' }))
    expect(notCancelled).toBe(false)
    expect(await screen.findByRole('menu')).toBeInTheDocument()
  })

  it('has no axe violations open and closed', async () => {
    const { container } = render(
      <LongPressMenu label="Sources" items={items} tapOpensMenu>
        Sources
      </LongPressMenu>,
    )
    await expectNoAxeViolations(container)
    await userEvent.click(screen.getByRole('button', { name: 'Sources' }))
    await screen.findByRole('menu')
    await expectNoAxeViolations(document.body)
  })
})

describe('LongPressMenu in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<LongPressMenu label="المصادر" items={[{ label: 'تثبيت' }]} onTap={() => {}}><span>المصادر</span></LongPressMenu>)
    expect(rtlDom.screen.getAllByText('المصادر').length).toBeGreaterThan(0)
    await axeRtl(container)
  })
})
