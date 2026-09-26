import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookOpen, Database, House, ShieldCheck } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { setViewportWidth } from '../../../test/media'
import { renderWithProvider } from '../../../test/render'
import { messagesPtBR } from '../../internal/messages'
import { ThemeScope } from '../../internal/ThemeScope'
import { AppNavigation, buildFlyoutDestinations, buildFloatingActions, buildLauncherTiles, filterByPermission, type NavEntry } from './AppNavigation'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'
import { cssOf as cssOfRtl } from '../../../test/css'

const entries: NavEntry[] = [
  { id: 'home', label: 'Overview', href: '/', icon: <House /> },
  { id: 'a', label: 'Sources', href: '/a', icon: <BookOpen />, group: 'Collect' },
  { id: 'b', label: 'Verification', href: '/b', icon: <ShieldCheck />, group: 'Collect', count: 12 },
  { id: 'c', label: 'Base', href: '/c', icon: <Database />, group: 'Organise', permission: 'base:read', menu: [{ id: 'atlas', label: 'Atlas' }, { id: 'export', label: 'Export' }] },
]

const account = () => ({ name: 'Ana', onProfile: vi.fn(), onSignOut: vi.fn(), theme: 'light' as const, onThemeChange: vi.fn() })

describe('AppNavigation', () => {
  it('marks only the entry holding the pathname', () => {
    render(<AppNavigation entries={entries} pathname="/b/12" />)
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(nav).getByRole('link', { name: 'Verification, 12 pending' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Sources' })).not.toHaveAttribute('aria-current')
    expect(within(nav).getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
  })

  it('does not mark home for another path', () => {
    render(<AppNavigation entries={entries} pathname="/b" />)
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
  })

  it('removes entries the person lacks permission for, in every presentation', () => {
    render(<AppNavigation entries={entries} pathname="/" permissions={[]} />)
    expect(screen.queryByRole('link', { name: 'Base' })).toBeNull()
    expect(filterByPermission(entries, []).map((e) => e.id)).toEqual(['home', 'a', 'b'])
    expect(buildLauncherTiles(entries, []).some((t) => t.id === 'c')).toBe(false)
    expect(buildFlyoutDestinations(entries, []).some((t) => t.id === 'c')).toBe(false)
    expect(buildFloatingActions(entries, { permissions: [] }).some((t) => t.id === 'c')).toBe(false)
  })

  it('opens a modal drawer from a menu button at 800', async () => {
    setViewportWidth(800)
    render(<AppNavigation entries={entries} pathname="/" />)
    expect(screen.queryByRole('navigation')).toBeNull()
    const menu = screen.getByRole('button', { name: 'Open navigation' })
    await userEvent.click(menu)
    const dialog = screen.getByRole('dialog', { name: 'Primary navigation' })
    expect(within(dialog).getByRole('link', { name: 'Sources' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(menu).toHaveFocus())
  })

  it('shows icons only when collapsed, named by label, with a tooltip on focus', async () => {
    render(<AppNavigation entries={entries} pathname="/" collapsed onCollapsedChange={() => {}} />)
    const link = screen.getByRole('link', { name: 'Sources' })
    expect(link.querySelector('.fk-app-nav__label')).toBeNull()
    await userEvent.tab()
    await userEvent.tab()
    expect(link).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Sources')
    expect(screen.getByRole('button', { name: 'Expand navigation' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens an entry sub-menu from its chevron with Enter and moves with arrows', async () => {
    render(<AppNavigation entries={entries} pathname="/" />)
    const chevron = screen.getByRole('button', { name: 'More in Base' })
    chevron.focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Atlas' })).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Export' })).toHaveFocus()
  })

  it('calls onThemeChange from the account menu', async () => {
    const acc = account()
    render(<AppNavigation entries={entries} pathname="/" account={acc} />)
    await userEvent.click(screen.getByRole('button', { name: 'Account: Ana' }))
    const dark = await screen.findByRole('menuitemradio', { name: 'Dark' })
    await userEvent.click(dark)
    expect(acc.onThemeChange).toHaveBeenCalledWith('dark')
  })

  it('shows no English fallback with translated copy', async () => {
    renderWithProvider(<AppNavigation entries={entries.map((e) => ({ ...e, count: undefined }))} pathname="/" account={account()} onCollapsedChange={() => {}} />, {
      baseMessages: messagesPtBR,
    })
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recolher navegação' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mais em Base' })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Primary navigation|Collapse|Account/)
  })

  it('builds floating actions with the active entry and badge', () => {
    const actions = buildFloatingActions(entries, { pathname: '/b/1', account: { label: 'Account', onPress: () => {} } })
    expect(actions.find((a) => a.id === 'b')).toMatchObject({ active: true, badge: 12 })
    expect(actions.at(-1)?.id).toBe('account')
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <AppNavigation entries={entries} pathname="/a" account={account()} labels={{ landmark: `Primary ${scheme}` }} footer={<p>Demo data</p>} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('AppNavigation in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<AppNavigation entries={[{ id: 'o', label: 'نظرة عامة', href: '/o', icon: <span /> }, { id: 'v', label: 'التحقق', href: '/v', count: 12, icon: <span /> }]} pathname="/o" />, { navigate: () => {} })
    expect(rtlDom.screen.getByRole('link', { name: 'نظرة عامة' })).toHaveAttribute('aria-current', 'page')
    // The drawer sits at the inline start and slides in from the right in right-to-left.
    expect(cssOfRtl('components/app-navigation/AppNavigation.css')).toMatch(/animation-name:\s*fk-app-nav-slide-rtl/)
    await axeRtl(container)
  })
})
