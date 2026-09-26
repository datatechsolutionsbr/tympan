import { I18nProvider } from 'react-aria-components'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookOpen, CheckSquare, FileText, Home, Map, Network, Settings, User, Users } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setMedia, setViewportWidth } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { planBar, slotsAlong, stepFor } from './barModel'
import { FloatingActionBar, type ActionBarItem } from './FloatingActionBar'

const five: ActionBarItem[] = [
  { id: 'overview', label: 'Overview', icon: Home, href: '/overview', active: true },
  { id: 'sources', label: 'Sources', icon: BookOpen, href: '/sources' },
  { id: 'base', label: 'Base', icon: FileText, href: '/base' },
  { id: 'atlas', label: 'Atlas', icon: Map, href: '/atlas' },
  { id: 'verify', label: 'Verification', icon: CheckSquare, href: '/verify', count: 12 },
]

const nextFrame = () => act(() => new Promise((r) => requestAnimationFrame(() => r(null))))

describe('FloatingActionBar', () => {
  it('is one tab stop and Right Arrow moves through the items, wrapping at the end', async () => {
    render(<FloatingActionBar destinations={five} edge="bottom" />)
    await userEvent.tab()
    const overview = screen.getByRole('link', { name: 'Overview' })
    expect(overview).toHaveFocus()
    expect(screen.getAllByRole('link').filter((l) => l.tabIndex === 0)).toHaveLength(1)
    for (const name of ['Sources', 'Base', 'Atlas', 'Verification, 12 pending']) {
      await userEvent.keyboard('{ArrowRight}')
      expect(screen.getByRole('link', { name })).toHaveFocus()
    }
    await userEvent.keyboard('{ArrowRight}')
    expect(overview).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('link', { name: /Verification/ })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(overview).toHaveFocus()
  })

  it('uses Up and Down on a vertical bar and marks the active destination', async () => {
    render(<FloatingActionBar destinations={five} edge="start" />)
    expect(screen.getByRole('navigation')).toHaveAttribute('data-orientation', 'vertical')
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-orientation', 'vertical')
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('link', { name: 'Sources' })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(screen.getByRole('link', { name: /Verification/ })).toHaveFocus()
  })

  it('moves focus to the active item with the focus shortcut and returns it on Escape', async () => {
    render(
      <>
        <button type="button">In the page</button>
        <FloatingActionBar destinations={five} edge="bottom" />
      </>,
    )
    const page = screen.getByRole('button', { name: 'In the page' })
    page.focus()
    await userEvent.keyboard('{Alt>}{Shift>}d{/Shift}{/Alt}')
    await nextFrame()
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(page).toHaveFocus()
  })

  it('forwards focus from the landmark (skip-link target) to the active item', () => {
    render(<FloatingActionBar destinations={five} edge="bottom" id="dock" />)
    act(() => document.getElementById('dock')!.focus())
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveFocus()
  })

  const withMenu: ActionBarItem[] = [
    five[0]!,
    {
      id: 'account',
      label: 'Account',
      icon: User,
      onPress: vi.fn(),
      menu: [
        { id: 'profile', label: 'Profile', href: '/me' },
        { id: 'leave', label: 'Leave project', tone: 'danger', confirm: { title: 'Leave the project?', confirmLabel: 'Leave' } },
      ],
    },
  ]

  it('opens an item menu with Down Arrow, first entry focused, and Escape returns to the item', async () => {
    render(<FloatingActionBar destinations={[withMenu[0]!]} contextual={[withMenu[1]!]} edge="bottom" />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    const account = screen.getByRole('button', { name: 'Account' })
    expect(account).toHaveFocus()
    expect(account).toHaveAttribute('aria-haspopup', 'menu')
    await userEvent.keyboard('{ArrowDown}')
    const menu = await screen.findByRole('menu', { name: 'Account' })
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Profile' })).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    await waitFor(() => expect(account).toHaveFocus())
  })

  it('opens the menu with Shift+F10 and with the chevron (which is not a tab stop)', async () => {
    render(<FloatingActionBar destinations={[withMenu[0]!]} contextual={[withMenu[1]!]} edge="bottom" />)
    const chevron = screen.getByRole('button', { name: 'Open the menu of Account' })
    expect(chevron).toHaveAttribute('tabindex', '-1')
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}{Shift>}{F10}{/Shift}')
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    await userEvent.click(chevron)
    expect(await screen.findByRole('menu')).toBeInTheDocument()
  })

  it('asks for confirmation before running a destructive entry', async () => {
    const onMenuAction = vi.fn()
    render(<FloatingActionBar destinations={[withMenu[0]!]} contextual={[withMenu[1]!]} edge="bottom" onMenuAction={onMenuAction} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open the menu of Account' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Leave project' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Leave the project?' })
    expect(onMenuAction).not.toHaveBeenCalled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Leave' }))
    await waitFor(() => expect(onMenuAction).toHaveBeenCalledWith('account', 'leave'))
  })

  it('uses a host confirmation service when given', async () => {
    const onMenuAction = vi.fn()
    const requestConfirm = vi.fn().mockResolvedValue(false)
    render(
      <FloatingActionBar destinations={[withMenu[0]!]} contextual={[withMenu[1]!]} edge="bottom" onMenuAction={onMenuAction} requestConfirm={requestConfirm} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open the menu of Account' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Leave project' }))
    await waitFor(() => expect(requestConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Leave the project?' })))
    expect(onMenuAction).not.toHaveBeenCalled()
  })

  it('moves overflowing items into "more", in order, keeping the active item in the bar', async () => {
    setViewportWidth(375)
    const ten: ActionBarItem[] = Array.from({ length: 8 }, (_, i) => ({ id: `d${i}`, label: `Destination ${i}`, icon: FileText, href: `/d${i}`, active: i === 7 }))
    const extra: ActionBarItem[] = [
      { id: 'c0', label: 'Team', icon: Users },
      { id: 'c1', label: 'Settings', icon: Settings },
    ]
    render(<FloatingActionBar destinations={ten} contextual={extra} edge="start" />)
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('data-edge', 'bottom')
    expect(screen.getByRole('link', { name: 'Destination 7' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    const items = within(await screen.findByRole('menu', { name: 'More' })).getAllByRole('menuitem')
    const names = items.map((i) => i.textContent)
    expect(names.at(-2)).toBe('Team')
    expect(names.at(-1)).toBe('Settings')
    expect(names).not.toContain('Destination 7')
    expect(names.indexOf('Destination 5')).toBeLessThan(names.indexOf('Destination 6'))
  })

  it('stays visible with focus inside and never hides under reduced motion', async () => {
    const { unmount } = render(<FloatingActionBar destinations={five} edge="bottom" autoHide hideAfter={20} />)
    await userEvent.tab()
    await act(() => new Promise((r) => setTimeout(r, 60)))
    expect(screen.getByRole('navigation')).not.toHaveAttribute('data-hidden')
    unmount()
    setMedia({ reducedMotion: true })
    render(<FloatingActionBar destinations={five} edge="bottom" autoHide hideAfter={20} />)
    await act(() => new Promise((r) => setTimeout(r, 60)))
    expect(screen.getByRole('navigation')).not.toHaveAttribute('data-hidden')
  })

  it('hides after inactivity (inert) and the shortcut reveals it', async () => {
    render(<FloatingActionBar destinations={five} edge="bottom" autoHide hideAfter={20} />)
    await waitFor(() => expect(screen.getByRole('navigation', { hidden: true })).toHaveAttribute('data-hidden'))
    expect(screen.getByRole('navigation', { hidden: true })).toHaveAttribute('inert')
    await userEvent.keyboard('{Alt>}{Shift>}d{/Shift}{/Alt}')
    await nextFrame()
    expect(screen.getByRole('navigation')).not.toHaveAttribute('data-hidden')
  })

  it('caps a large count and keeps the full number in the name', () => {
    render(<FloatingActionBar destinations={[{ id: 'v', label: 'Verification', icon: CheckSquare, href: '/v', count: 120 }]} edge="bottom" />)
    const link = screen.getByRole('link', { name: 'Verification, 120 pending' })
    expect(link).toHaveTextContent('99+')
  })

  it('sits at the bottom below 1024 px and publishes its inset on the root', () => {
    setViewportWidth(900)
    const { unmount } = render(<FloatingActionBar destinations={five} edge="start" />)
    expect(screen.getByRole('navigation')).toHaveAttribute('data-edge', 'bottom')
    expect(document.documentElement.style.getPropertyValue('--ty-action-bar-inset-bottom')).toMatch(/^\d+px$/)
    unmount()
    expect(document.documentElement.style.getPropertyValue('--ty-action-bar-inset-bottom')).toBe('')
  })

  it('becomes a tab bar below 768 px when asked, with captions', () => {
    setViewportWidth(375)
    render(<FloatingActionBar destinations={five} narrowVariant="tabbar" />)
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('data-variant', 'tabbar')
    expect(within(nav).getAllByRole('link')).toHaveLength(5)
    expect(within(nav).getByText('Atlas')).toBeInTheDocument()
    const css = cssOf('components/floating-action-bar/FloatingActionBar.css')
    expect(css).toMatch(/\[data-variant='tabbar'\]\s*\{[^}]*env\(safe-area-inset-bottom/)
  })

  it('shows a placeholder while loading, hidden from assistive technology except a busy status', () => {
    render(<FloatingActionBar destinations={[]} />)
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Loading actions')
    expect(nav.querySelector('.ty-action-bar__ghosts')).toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes contextual toggles with aria-pressed and divides contextual groups', () => {
    const tools: ActionBarItem[] = [
      { id: 'select', label: 'Select', icon: Home, onPress: () => {}, pressed: true, group: 'mode' },
      { id: 'pan', label: 'Pan', icon: Map, onPress: () => {}, pressed: false, group: 'mode' },
      { id: 'fit', label: 'Fit', icon: Network, onPress: () => {}, group: 'view' },
      { id: 'find', label: 'Find', icon: BookOpen, onPress: () => {}, group: 'find' },
    ]
    const { container } = render(<FloatingActionBar destinations={five.slice(0, 1)} contextual={tools} edge="bottom" />)
    expect(screen.getByRole('button', { name: 'Select' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Pan' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Fit' })).not.toHaveAttribute('aria-pressed')
    expect(screen.getByRole('button', { name: 'Select' })).not.toHaveAttribute('aria-current')
    // One separator before the contextual run, then one per group change (mode | view | find).
    expect(container.querySelectorAll('.ty-action-bar__separator')).toHaveLength(3)
  })

  it('exposes item shortcuts with aria-keyshortcuts', () => {
    render(<FloatingActionBar destinations={[{ ...five[0]!, shortcut: 'Alt+1' }]} edge="bottom" />)
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-keyshortcuts', 'Alt+1')
  })

  it('keeps 44 px items, instant transitions under reduced motion and system colours when forced', () => {
    const css = cssOf('components/floating-action-bar/FloatingActionBar.css')
    expect(css).toMatch(/--ty-bar-item:\s*var\(--ty-control-target\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/backdrop-filter:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark, with a separator and a menu item', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <FloatingActionBar id={`bar-${scheme}`} label={`Actions ${scheme}`} destinations={five} contextual={[withMenu[1]!, { id: 'graph', label: 'Graph', icon: Network }]} edge="bottom" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('bar model', () => {
  it('computes slots along an edge', () => {
    expect(slotsAlong(375)).toBe(6)
    expect(slotsAlong(0)).toBe(Number.POSITIVE_INFINITY)
  })

  it('moves contextual items out first, then destinations, never the active one', () => {
    type T = { id: string; active?: boolean }
    const d: T[] = [{ id: 'a' }, { id: 'b', active: true }, { id: 'c' }]
    const c: T[] = [{ id: 'x' }, { id: 'y' }]
    const plan = planBar(d, c, 3)
    expect(plan.shown.map((p) => p.item.id)).toEqual(['a', 'b'])
    expect(plan.overflow.map((p) => p.item.id)).toEqual(['c', 'x', 'y'])
  })

  it('maps keys by orientation and direction', () => {
    expect(stepFor('ArrowRight', 'bottom', false)).toBe('next')
    expect(stepFor('ArrowRight', 'bottom', true)).toBe('previous')
    expect(stepFor('ArrowDown', 'bottom', false)).toBe('menu')
    expect(stepFor('ArrowRight', 'start', false)).toBe('menu')
    expect(stepFor('ArrowLeft', 'end', false)).toBe('menu')
  })
})

describe('FloatingActionBar in right-to-left', () => {
  it('reverses the arrow keys of a horizontal bar and passes axe', async () => {
    const { container } = render(
      <I18nProvider locale="ar">
        <div dir="rtl" lang="ar">
          <FloatingActionBar destinations={five} edge="bottom" />
        </div>
      </I18nProvider>,
    )
    await userEvent.tab()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('link', { name: 'Sources' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveFocus()
    expect(cssOf('components/floating-action-bar/FloatingActionBar.css')).toMatch(/translate:\s*calc\(-50% \* var\(--ty-inline-sign\)\) 0/)
    await expectNoAxeViolations(container)
  })

  it('formats counts with the locale digits and joins the name with the locale list style', () => {
    render(
      <I18nProvider locale="ar-EG">
        <FloatingActionBar destinations={[{ id: 'v', label: 'Verification', icon: CheckSquare, href: '/v', count: 7 }]} edge="bottom" />
      </I18nProvider>,
    )
    expect(screen.getByRole('link')).toHaveTextContent('٧')
  })
})
