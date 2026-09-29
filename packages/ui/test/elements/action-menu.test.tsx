// Behaviour of <ty-action-menu> (spec: wave-1/action-menu.md): the APG Menu
// Button and Menu patterns — roving focus, keyboard, context invocation,
// viewport clamping and controlled visibility. Self-contained: registers
// only this element (the barrel index.ts does not list it yet).
import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { TyActionMenuElement } from '../../src/elements/action-menu/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'

defineTympanElement(TyActionMenuElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
  document.documentElement.removeAttribute('dir')
})

const nextFrame = () => act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))))

const ITEMS = JSON.stringify([
  { id: 'rename', label: 'Rename', shortcut: 'F2' },
  { id: 'duplicate', label: 'Duplicate' },
  { type: 'separator' },
  { id: 'delete', label: 'Delete', tone: 'danger' },
  { id: 'archive', label: 'Archive', disabled: true },
])

const SECTIONS = JSON.stringify([
  { type: 'section', id: 'move', title: 'Move to', items: [{ id: 'inbox', label: 'Inbox' }, { id: 'later', label: 'Later' }] },
  { type: 'separator' },
  { id: 'flag', label: 'Flag', icon: '⚑' },
])

/** The controlled contract: flip `open` when the element asks, recording every request. */
const controlled = (host: Element) => {
  const changes: Array<{ open: boolean }> = []
  host.addEventListener('ty-open-change', (event) => {
    const open = Boolean((event as CustomEvent).detail.open)
    changes.push({ open })
    ;(host as HTMLElement).toggleAttribute('open', open)
  })
  return changes
}

const actionsOf = (host: Element) => {
  const actions: string[] = []
  host.addEventListener('ty-action', (event) => actions.push(String((event as CustomEvent).detail.id)))
  return actions
}

describe('<ty-action-menu>', () => {
  it('is a quiet icon-only menu button while closed; the menu stays out of the tree', async () => {
    html(`<ty-action-menu label="Item actions" items='${ITEMS}'></ty-action-menu>`)
    const trigger = screen.getByRole('button', { name: 'More actions' })
    expect(trigger).toHaveClass('ty-button', 'ty-action-menu__trigger')
    expect(trigger).toHaveAttribute('data-variant', 'quiet')
    expect(trigger).toHaveAttribute('data-icon-only')
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger.querySelector('svg.ty-icon')).not.toBeNull()
    // The anatomy stays mounted, hidden.
    expect(document.body.querySelector('.ty-action-menu')).toHaveAttribute('hidden')
    expect(screen.queryByRole('menu')).toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('translates the built-in trigger through trigger-label', () => {
    html('<ty-action-menu label="Ações do item" trigger-label="Mais ações"></ty-action-menu>')
    expect(screen.getByRole('button', { name: 'Mais ações' })).toBeInTheDocument()
  })

  it('opens from the trigger with Enter: a named menu, the first enabled item focused (acceptance)', async () => {
    const host = html(`<ty-action-menu label="Item actions" items='${ITEMS}'></ty-action-menu>`).querySelector('ty-action-menu')!
    controlled(host)
    const trigger = screen.getByRole('button', { name: 'More actions' })
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    await nextFrame()
    const menu = screen.getByRole('menu', { name: 'Item actions' })
    expect(menu).toHaveClass('ty-action-menu__menu')
    expect(menu).toHaveAttribute('aria-orientation', 'vertical')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls', menu.id)
    const first = screen.getByRole('menuitem', { name: 'Rename' })
    expect(first).toHaveFocus()
    expect(first).toHaveAttribute('data-focused')
    expect(first).toHaveAttribute('data-focus-visible')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('moves with the arrow keys (wrapping, skipping disabled), Home, End and type-ahead (acceptance)', async () => {
    const host = html(`<ty-action-menu label="Item actions" items='${ITEMS}'></ty-action-menu>`).querySelector('ty-action-menu')!
    controlled(host)
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    await nextFrame()
    const rename = screen.getByRole('menuitem', { name: 'Rename' })
    const duplicate = screen.getByRole('menuitem', { name: 'Duplicate' })
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' })
    expect(rename).toHaveFocus()
    // End jumps to the last enabled item: Archive is disabled and skipped.
    await userEvent.keyboard('{End}')
    expect(deleteItem).toHaveFocus()
    // ArrowDown on the last item wraps to the first (acceptance).
    await userEvent.keyboard('{ArrowDown}')
    expect(rename).toHaveFocus()
    // Separators are not stops; disabled items are skipped both ways.
    await userEvent.keyboard('{ArrowDown}')
    expect(duplicate).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(deleteItem).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(duplicate).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(rename).toHaveFocus()
    // Type-ahead: the next enabled item starting with the character, wrapping.
    await userEvent.keyboard('d')
    expect(duplicate).toHaveFocus()
    await userEvent.keyboard('d')
    expect(deleteItem).toHaveFocus()
    await userEvent.keyboard('d')
    expect(duplicate).toHaveFocus()
    expect(rename).not.toHaveAttribute('data-focused')
  })

  it('ArrowUp from the trigger opens onto the last enabled item', async () => {
    const host = html(`<ty-action-menu label="Item actions" items='${ITEMS}'></ty-action-menu>`).querySelector('ty-action-menu')!
    controlled(host)
    const trigger = screen.getByRole('button', { name: 'More actions' })
    trigger.focus()
    await userEvent.keyboard('{ArrowUp}')
    await nextFrame()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
  })

  it('activating an item fires ty-action once and asks to close; the menu closes and focus returns (acceptance)', async () => {
    const host = html(`<ty-action-menu label="Item actions" items='${ITEMS}'></ty-action-menu>`).querySelector('ty-action-menu')!
    const changes = controlled(host)
    const actions = actionsOf(host)
    const trigger = screen.getByRole('button', { name: 'More actions' })
    await userEvent.click(trigger)
    await nextFrame()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }))
    expect(actions).toEqual(['duplicate'])
    expect(changes).toEqual([{ open: true }, { open: false }])
    expect(screen.queryByRole('menu')).toBeNull()
    await nextFrame()
    expect(trigger).toHaveFocus()
    // Keyboard activation reports exactly once too (Enter, Space).
    await userEvent.keyboard('{Enter}')
    await nextFrame()
    await userEvent.keyboard('{Enter}')
    expect(actions).toEqual(['duplicate', 'rename'])
    await nextFrame()
    await userEvent.keyboard('{Enter}')
    await nextFrame()
    await userEvent.keyboard(' ')
    expect(actions).toEqual(['duplicate', 'rename', 'rename'])
  })

  it('a disabled item is announced as disabled and never fires (acceptance)', async () => {
    const host = html(`<ty-action-menu label="Item actions" items='${ITEMS}'></ty-action-menu>`).querySelector('ty-action-menu')!
    const changes = controlled(host)
    const actions = actionsOf(host)
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    await nextFrame()
    const archive = screen.getByRole('menuitem', { name: 'Archive' })
    expect(archive).toHaveAttribute('aria-disabled', 'true')
    expect(archive).toHaveAttribute('data-disabled')
    await userEvent.click(archive)
    expect(actions).toEqual([])
    expect(changes).toEqual([{ open: true }])
    expect(screen.getByRole('menu', { name: 'Item actions' })).toBeInTheDocument()
  })

  it('composes sections, separators, icons, shortcut hints and the danger tone from the items JSON', async () => {
    const host = html(`<ty-action-menu label="Message actions" items='${SECTIONS}' open></ty-action-menu>`).querySelector('ty-action-menu')!
    const group = screen.getByRole('group', { name: 'Move to' })
    expect(group).toHaveClass('ty-action-menu__section')
    expect(group.querySelector('.ty-action-menu__section-title')).toHaveTextContent('Move to')
    expect(screen.getByRole('menuitem', { name: 'Inbox' }).closest('.ty-action-menu__section')).toBe(group)
    const separator = host.querySelector('.ty-action-menu__separator')!
    expect(separator).toHaveAttribute('role', 'separator')
    const flag = screen.getByRole('menuitem', { name: 'Flag' })
    expect(flag.querySelector('.ty-action-menu__icon')).toHaveAttribute('aria-hidden', 'true')
    host.setAttribute('items', ITEMS)
    const rename = screen.getByRole('menuitem', { name: 'Rename' })
    expect(rename.querySelector('.ty-action-menu__shortcut')).toHaveTextContent('F2')
    expect(rename.querySelector('.ty-action-menu__shortcut')!.localName).toBe('kbd')
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('data-tone', 'danger')
    expect(screen.queryByRole('menuitem', { name: 'Inbox' })).toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('renders an SVG icon from iconPath: single and " | "-separated paths, winning over the text glyph, kept inert as data', () => {
    const host = html('<ty-action-menu label="Item actions" open></ty-action-menu>').querySelector('ty-action-menu')!
    host.setAttribute(
      'items',
      JSON.stringify([
        { id: 'edit', label: 'Edit', icon: '✎', iconPath: 'M12 20h9' },
        { id: 'split', label: 'Split', iconPath: 'M18 6 6 18 | m6 6 12 12' },
        { id: 'plain', label: 'Plain' },
        { id: 'evil', label: 'Evil', iconPath: 'M1 1"><script>alert(1)</script>' },
      ]),
    )
    // iconPath wins over icon: the frame holds an SVG, never the glyph text.
    const editFrame = screen.getByRole('menuitem', { name: 'Edit' }).querySelector('.ty-action-menu__icon')!
    expect(editFrame).toHaveAttribute('aria-hidden', 'true')
    expect(editFrame.textContent).toBe('')
    const svg = editFrame.querySelector('svg.ty-icon')!
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('fill', 'none')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    const paths = svg.querySelectorAll('path')
    expect(paths).toHaveLength(1)
    expect(paths[0]).toHaveAttribute('d', 'M12 20h9')
    // " | " separates subpaths into one <path> child each.
    const splitPaths = screen.getByRole('menuitem', { name: 'Split' }).querySelectorAll('.ty-action-menu__icon svg path')
    expect(Array.from(splitPaths).map((path) => path.getAttribute('d'))).toEqual(['M18 6 6 18', 'm6 6 12 12'])
    // Neither icon field: no icon frame.
    expect(screen.getByRole('menuitem', { name: 'Plain' }).querySelector('.ty-action-menu__icon')).toBeNull()
    // Markup in iconPath is only ever an attribute string — the JSON stays inert data.
    const evil = screen.getByRole('menuitem', { name: 'Evil' })
    expect(evil.querySelector('script')).toBeNull()
    const evilPaths = evil.querySelectorAll('.ty-action-menu__icon svg path')
    expect(evilPaths).toHaveLength(1)
    expect(evilPaths[0]).toHaveAttribute('d', 'M1 1"><script>alert(1)</script>')
  })

  it('warns and renders an empty menu for invalid items JSON', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    html('<ty-action-menu label="Broken" items="[not json" open></ty-action-menu>')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('items'))
    expect(screen.getByRole('menu', { name: 'Broken' }).childElementCount).toBe(0)
    warn.mockRestore()
  })

  it('context mode: a secondary click on the target opens at the pointer (acceptance)', async () => {
    const host = html(
      `<ty-action-menu mode="context" label="File actions" items='${ITEMS}'><button slot="trigger" type="button">report.csv</button></ty-action-menu>`,
    ).querySelector('ty-action-menu')!
    const changes = controlled(host)
    const target = screen.getByRole('button', { name: 'report.csv' })
    // Trigger mode wiring still applies: the target is the menu's control.
    expect(target).toHaveAttribute('aria-haspopup', 'menu')
    fireEvent.contextMenu(target, { clientX: 100, clientY: 200 })
    expect(changes).toEqual([{ open: true }])
    await nextFrame()
    expect(screen.getByRole('menu', { name: 'File actions' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus()
    const surface = host.querySelector<HTMLElement>('.ty-action-menu')!
    expect(surface).toHaveAttribute('data-mode', 'context')
    expect(surface.style.position).toBe('fixed')
    expect(surface.style.left).toBe('100px')
    expect(surface.style.top).toBe('200px')
    // The built-in trigger button is trigger-mode only.
    expect(host.querySelector('.ty-action-menu__trigger')).toBeNull()
  })

  it('context mode: Shift+F10 and the ContextMenu key open from the focused target (acceptance)', async () => {
    const host = html(
      `<ty-action-menu mode="context" label="File actions" items='${ITEMS}'><button slot="trigger" type="button">report.csv</button></ty-action-menu>`,
    ).querySelector('ty-action-menu')!
    const changes = controlled(host)
    const target = screen.getByRole('button', { name: 'report.csv' })
    target.focus()
    await userEvent.keyboard('{Shift>}{F10}{/Shift}')
    expect(changes).toEqual([{ open: true }])
    await nextFrame()
    expect(screen.getByRole('menu', { name: 'File actions' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(changes.at(-1)).toEqual({ open: false })
    await nextFrame()
    expect(target).toHaveFocus()
    await userEvent.keyboard('{ContextMenu}')
    expect(changes.at(-1)).toEqual({ open: true })
    await nextFrame()
    expect(screen.getByRole('menu', { name: 'File actions' })).toBeInTheDocument()
  })

  it('context mode: the menu is clamped so it never overflows the viewport (acceptance)', async () => {
    const host = html(
      `<ty-action-menu mode="context" label="File actions" items='${ITEMS}' position="100000,100000"><button slot="trigger" type="button">report.csv</button></ty-action-menu>`,
    ).querySelector('ty-action-menu')!
    const surface = host.querySelector<HTMLElement>('.ty-action-menu')!
    // jsdom has no layout: give the surface a size so the clamp has teeth.
    Object.defineProperty(surface, 'offsetWidth', { configurable: true, value: 200 })
    Object.defineProperty(surface, 'offsetHeight', { configurable: true, value: 150 })
    host.setAttribute('open', '')
    await nextFrame()
    expect(surface.style.left).toBe(`${window.innerWidth - 200 - 8}px`)
    expect(surface.style.top).toBe(`${window.innerHeight - 150 - 8}px`)
  })

  it('Escape closes and returns focus to the origin; an outside press closes without stealing it (acceptance)', async () => {
    const host = html(`<ty-action-menu label="Item actions" items='${ITEMS}'></ty-action-menu>`).querySelector('ty-action-menu')!
    const changes = controlled(host)
    const trigger = screen.getByRole('button', { name: 'More actions' })
    await userEvent.click(trigger)
    await nextFrame()
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(changes.at(-1)).toEqual({ open: false })
    await nextFrame()
    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('menu')).toBeNull()
    // Open again, then press outside: the menu asks to close.
    await userEvent.click(trigger)
    await nextFrame()
    fireEvent.pointerDown(document.body)
    expect(changes.at(-1)).toEqual({ open: false })
    await nextFrame()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens on a long press of the target on touch; a short press or a move cancels it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const host = html(
        `<ty-action-menu mode="context" label="File actions" items='${ITEMS}'><button slot="trigger" type="button">report.csv</button></ty-action-menu>`,
      ).querySelector('ty-action-menu')!
      const changes = controlled(host)
      const target = screen.getByRole('button', { name: 'report.csv' })
      fireEvent.pointerDown(target, { pointerType: 'touch', clientX: 40, clientY: 60 })
      fireEvent.pointerUp(target, { pointerType: 'touch' })
      vi.advanceTimersByTime(600)
      expect(changes).toEqual([])
      fireEvent.pointerDown(target, { pointerType: 'touch', clientX: 40, clientY: 60 })
      fireEvent.pointerMove(target, { pointerType: 'touch', clientX: 44, clientY: 60 })
      vi.advanceTimersByTime(600)
      expect(changes).toEqual([])
      fireEvent.pointerDown(target, { pointerType: 'touch', clientX: 40, clientY: 60 })
      vi.advanceTimersByTime(600)
      expect(changes).toEqual([{ open: true }])
    } finally {
      vi.useRealTimers()
    }
  })

  it('stays controlled: the element never flips open itself', async () => {
    const host = html(`<ty-action-menu label="Item actions" items='${ITEMS}'></ty-action-menu>`).querySelector('ty-action-menu')!
    const asked: boolean[] = []
    host.addEventListener('ty-open-change', (event) => asked.push(Boolean((event as CustomEvent).detail.open)))
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    expect(asked).toEqual([true])
    expect(host).not.toHaveAttribute('open')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('touch rows are at least 44 px, the surface is an elevated card, motion respects reduced motion and forced colours keep focus visible', () => {
    const css = cssOf('components/action-menu/ActionMenu.css')
    // Surface: the card radius and the floating elevation (spec §surface).
    expect(css).toMatch(/\.ty-action-menu\s*\{[^}]*border-radius:\s*var\(--ty-radius-card\)/)
    expect(css).toMatch(/\.ty-action-menu\s*\{[^}]*box-shadow:\s*var\(--ty-shadow-floating\)/)
    // Touch layouts (below 1024 px): every row at least the control target (44 px).
    const touch = mediaBlock(css, /\(max-width:\s*1023\.98px\)/)
    expect(touch).toMatch(/\.ty-action-menu__item[^{]*\{[^}]*min-block-size:\s*var\(--ty-control-target\)/)
    // Opening uses the quick duration; reduced motion is instant.
    expect(css).toMatch(/\.ty-action-menu\[data-entering\][^{]*\{[^}]*animation:\s*ty-action-menu-in var\(--ty-dur-quick\)/)
    const reduced = mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/\.ty-action-menu\[data-entering\][^{{]*,\s*\.ty-action-menu\[data-exiting\][^{]*\{[^}]*animation:\s*none/)
    // Forced colours: the focused item is Highlight/HighlightText, separators stay visible.
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/\.ty-action-menu__item\[data-focused\][^{]*\{[^}]*background:\s*Highlight/)
    expect(forced).toMatch(/\.ty-action-menu__item\[data-focused\][^{]*\{[^}]*color:\s*HighlightText/)
    expect(forced).toMatch(/\.ty-action-menu__separator[^{]*\{[^}]*background:\s*CanvasText/)
  })

  it('works the same in right-to-left documents', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const host = html(
      `<ty-action-menu label="إجراءات العنصر" trigger-label="المزيد" items='${JSON.stringify([{ id: 'open', label: 'فتح' }, { id: 'share', label: 'مشاركة' }])}'></ty-action-menu>`,
    ).querySelector('ty-action-menu')!
    controlled(host)
    await userEvent.click(screen.getByRole('button', { name: 'المزيد' }))
    await nextFrame()
    expect(screen.getByRole('menu', { name: 'إجراءات العنصر' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'فتح' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'مشاركة' })).toHaveFocus()
    await expectNoAxeViolations(document.body, ['region'])
  })
})
