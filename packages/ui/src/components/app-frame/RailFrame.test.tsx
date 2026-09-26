import { I18nProvider } from 'react-aria-components'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookOpen, CheckSquare, Home } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { FloatingActionBar } from '../floating-action-bar/FloatingActionBar'
import { AppFrame, type AppFrameProps } from './AppFrame'
import { RailContextButton, RailNavItem, RailNavSection } from './RailNav'

function Navigation() {
  return (
    <>
      <RailNavSection>
        <RailNavItem label="Overview" icon={Home} href="/overview" current />
      </RailNavSection>
      <RailNavSection label="Collect">
        <RailNavItem label="Sources" icon={BookOpen} href="/sources" />
        <RailNavItem label="Verification" icon={CheckSquare} href="/verify" count={12} />
      </RailNavSection>
    </>
  )
}

const dock = (
  <FloatingActionBar
    anchor="container"
    edge="bottom"
    narrowVariant="tabbar"
    destinations={[
      { id: 'o', label: 'Overview', icon: Home, href: '/overview', active: true },
      { id: 's', label: 'Sources', icon: BookOpen, href: '/sources' },
    ]}
  />
)

function Shell(props: Partial<AppFrameProps>) {
  const [navOpen, setNavOpen] = useState(false)
  return (
    <AppFrame
      brand={<span>Fakhir</span>}
      context={<RailContextButton scope="EACH/USP" name="Census of government AI" />}
      account={<span>Natalia</span>}
      navigation={<Navigation />}
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      {...props}
    >
      {props.children ?? <h1>Overview</h1>}
    </AppFrame>
  )
}

describe('AppFrame rail layout', () => {
  it('is the default without a top bar: a navigation landmark, one main, no banner', () => {
    const { container } = render(<Shell />)
    expect(container.querySelector('.fk-app-frame')).toHaveAttribute('data-layout', 'rail')
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.queryByRole('banner')).toBeNull()
  })

  it('keeps DOM order skip link, rail, main', async () => {
    render(<Shell />)
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav.compareDocumentPosition(screen.getByRole('main')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('marks the active item and names counts in words', () => {
    render(<Shell />)
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
    const verify = screen.getByRole('link', { name: 'Verification, 12 pending' })
    expect(verify).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('list', { name: 'Collect' })).toBeInTheDocument()
  })

  it('draws the active item with accent-soft fill and a 3 px inset bar', () => {
    const css = cssOf('components/app-frame/AppFrameRail.css')
    expect(css).toMatch(/\.fk-rail-item\[data-current\]\s*\{[^}]*background:\s*var\(--fk-accent-soft\)/)
    expect(css).toMatch(/\.fk-rail-item\[data-current\]::before\s*\{[^}]*inline-size:\s*3px/)
    expect(css).toMatch(/--fk-rail-width:\s*248px/)
  })

  it('reserves bottom space for the dock and adds a skip link to it', () => {
    render(<Shell dock={dock} />)
    expect(screen.getByRole('link', { name: 'Skip to the action bar' })).toHaveAttribute('href', '#fk-action-bar')
    expect(screen.getByRole('navigation', { name: 'Actions' })).toHaveAttribute('id', 'fk-action-bar')
    const css = cssOf('components/app-frame/AppFrameRail.css')
    expect(css).toMatch(/\.fk-app-frame__sheet\s*\{[^}]*padding-block-end:\s*calc\(var\(--fk-sheet-pad\) \+ var\(--fk-action-bar-inset-bottom, 0px\)\)/)
    expect(css).toMatch(/\.fk-app-frame__sheet\s*\{[^}]*border-radius:\s*var\(--fk-radius-sheet\)/)
    expect(css).toMatch(/\.fk-app-frame__sheet\s*\{[^}]*overflow-y:\s*auto/)
  })

  it('below 768 px hides the rail until the tab bar opens it in a modal drawer', async () => {
    setViewportWidth(375)
    render(<Shell dock={dock} />)
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull()
    const bar = screen.getByRole('navigation', { name: 'Actions' })
    expect(bar).toHaveAttribute('data-variant', 'tabbar')
    await userEvent.click(within(bar).getByRole('button', { name: 'More' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'All sections' }))
    const dialog = await screen.findByRole('dialog', { name: 'Main' })
    expect(within(dialog).getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('below 768 px without a dock offers a menu control', async () => {
    setViewportWidth(375)
    render(<Shell />)
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(await screen.findByRole('dialog', { name: 'Main' })).toBeInTheDocument()
  })

  it('keeps the wave-1 top bar layout when a top bar is given', () => {
    render(<AppFrame navigation={<Navigation />} topBar={<span>Census</span>}>content</AppFrame>)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('is full bleed below 768 px and opaque under reduced transparency', () => {
    const css = cssOf('components/app-frame/AppFrameRail.css')
    expect(mediaBlock(css, /\(max-width:\s*767\.98px\)/)).toMatch(/border-radius:\s*0/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/backdrop-filter:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    for (const scheme of ['light', 'dark'] as const) {
      const { container, unmount } = render(
        <ThemeScope scheme={scheme}>
          <Shell dock={dock} />
        </ThemeScope>,
      )
      await expectNoAxeViolations(container)
      unmount()
    }
  })
})

describe('AppFrame rail layout in right-to-left', () => {
  it('renders the shell under dir="rtl" with the inset bar on the inline start, and passes axe', async () => {
    const { container } = render(
      <I18nProvider locale="he">
        <div dir="rtl" lang="he">
          <Shell dock={dock} />
        </div>
      </I18nProvider>,
    )
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(cssOf('components/app-frame/AppFrameRail.css')).toMatch(/\.fk-rail-item\[data-current\]::before\s*\{[^}]*inset-inline-start:\s*0/)
    await expectNoAxeViolations(container)
  })
})
