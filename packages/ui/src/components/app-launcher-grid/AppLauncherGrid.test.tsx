import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookOpen, Database, FileText, LogOut } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { AppLauncherGrid, type LauncherTile } from './AppLauncherGrid'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const tile = (id: string, extra: Partial<LauncherTile> = {}): LauncherTile => ({ id, label: id.toUpperCase(), href: `/${id}`, icon: <BookOpen />, ...extra })

describe('AppLauncherGrid', () => {
  it('orders tiles by `order`, unknown ids last', () => {
    render(<AppLauncherGrid pages={[tile('a'), tile('b'), tile('c')]} order={['c', 'a']} />)
    expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(['C', 'A', 'B'])
  })

  it('caps the corner count and keeps the full count in the name', () => {
    render(<AppLauncherGrid pages={[tile('sources', { label: 'Sources', count: 150 })]} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sources, 150 new' })).toBeInTheDocument()
  })

  it('shows the divider label before the action tiles', () => {
    const { container } = render(<AppLauncherGrid pages={[tile('a')]} actions={[{ id: 'out', label: 'Sign out', href: '#', icon: <LogOut />, onPress: () => {} }]} />)
    expect(screen.getByText('Actions')).toBeInTheDocument()
    const lists = container.querySelectorAll('ul')
    expect(lists[1]).toHaveTextContent('Sign out')
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('hands a focused page tile to onOpen on Enter', async () => {
    const onOpen = vi.fn()
    render(<AppLauncherGrid pages={[tile('base', { label: 'Base', icon: <Database /> })]} onOpen={onOpen} />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'base' }))
  })

  it('runs a tile onPress instead of onOpen', async () => {
    const onOpen = vi.fn()
    const onPress = vi.fn()
    render(<AppLauncherGrid pages={[tile('a', { onPress })]} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('link', { name: 'A' }))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('shows the initial and role in the profile tile, or a placeholder when not ready', () => {
    const pages = [tile('profile', { label: 'Profile' })]
    const person = { name: 'ana', roleLabel: 'Researcher' }
    const { rerender } = render(<AppLauncherGrid pages={pages} person={person} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('Researcher')).toBeInTheDocument()
    rerender(<AppLauncherGrid pages={pages} person={person} ready={false} />)
    expect(screen.queryByText('Researcher')).toBeNull()
    expect(screen.getByText('Loading the profile')).toBeInTheDocument()
  })

  it('lists shortcuts from the more button and from Shift+F10 on the tile', async () => {
    render(<AppLauncherGrid pages={[tile('refs', { label: 'References', icon: <FileText />, shortcuts: [{ label: 'Import .bib' }, { label: 'Export .bib' }] })]} />)
    await userEvent.click(screen.getByRole('button', { name: 'More for References' }))
    expect(await screen.findByRole('menuitem', { name: 'Import .bib' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    screen.getByRole('link', { name: 'References' }).focus()
    await userEvent.keyboard('{Shift>}{F10}{/Shift}')
    expect(await screen.findByRole('menuitem', { name: 'Export .bib' })).toBeInTheDocument()
  })

  it('fits two columns on narrow screens and has no press scale under reduced motion', () => {
    const css = cssOf('components/app-launcher-grid/AppLauncherGrid.css')
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/repeat\(2/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/scale:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <AppLauncherGrid
              pages={[tile(`a-${scheme}`, { count: 3, shortcuts: [{ label: 'New' }] }), tile(`profile`, { label: `Profile ${scheme}` })]}
              person={{ name: 'Ana', roleLabel: 'Researcher' }}
              actions={[{ id: 'out', label: `Sign out ${scheme}`, href: '#', icon: <LogOut /> }]}
            />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('AppLauncherGrid in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<AppLauncherGrid pages={[{ id: 'v', label: 'التحقق', href: '/v', count: 12, icon: <span /> }]} />, { locale: 'ar-EG', navigate: () => {} })
    expect(container.textContent).toMatch(/١٢/)
    await axeRtl(container)
  })
})
