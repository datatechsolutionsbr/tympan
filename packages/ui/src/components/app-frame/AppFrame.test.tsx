import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { lazy, useState, type ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { AppFrame, FrameNavLabel, type AppFrameProps } from './AppFrame'

function Nav() {
  return (
    <ul>
      <li>
        <a href="/overview" aria-label="Overview">
          <FrameNavLabel>Overview</FrameNavLabel>
        </a>
      </li>
      <li>
        <a href="/sources">
          <FrameNavLabel>Sources</FrameNavLabel>
        </a>
      </li>
    </ul>
  )
}

function Frame(props: Partial<AppFrameProps>) {
  const [navOpen, setNavOpen] = useState(false)
  return (
    <AppFrame navigation={<Nav />} topBar={<span>Census</span>} navOpen={navOpen} onNavOpenChange={setNavOpen} {...props}>
      {props.children ?? <h1>Catalogue</h1>}
    </AppFrame>
  )
}

describe('AppFrame', () => {
  it('has one navigation, banner and main landmark, main carries mainId', () => {
    render(<Frame mainId="content" />)
    expect(screen.getAllByRole('navigation')).toHaveLength(1)
    expect(screen.getAllByRole('banner')).toHaveLength(1)
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'content')
  })

  it('focuses the skip link first', async () => {
    render(<Frame />)
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus()
  })

  it('hides the navigation behind a menu button at 800 px and opens it as a modal drawer', async () => {
    setViewportWidth(800)
    render(<Frame />)
    expect(screen.queryByRole('navigation')).toBeNull()
    const button = screen.getByRole('button', { name: 'Open navigation' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(button)
    const dialog = await screen.findByRole('dialog', { name: 'Main' })
    expect(within(dialog).getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(button).toHaveFocus())
  })

  it('caps the content width per mode', () => {
    const { container, rerender } = render(<Frame width="data" />)
    expect(container.querySelector('.fk-app-frame')).toHaveAttribute('data-width', 'data')
    rerender(<Frame width="reading" />)
    expect(container.querySelector('.fk-app-frame')).toHaveAttribute('data-width', 'reading')
    const css = cssOf('components/app-frame/AppFrame.css')
    expect(css).toMatch(/\.fk-app-frame__content\s*\{[^}]*max-inline-size:\s*var\(--fk-layout-reading\)/)
    expect(css).toMatch(/\[data-width='data'\] \.fk-app-frame__content\s*\{[^}]*max-inline-size:\s*var\(--fk-layout-data\)/)
  })

  it('places the aside as a column at 1440 px, an overlay at 1100 px and a bottom sheet at 800 px', () => {
    const aside = <p>Evidence body</p>
    const { container, unmount } = render(<Frame aside={aside} asideLabel="Evidence" asideOpen />)
    expect(screen.getByRole('complementary', { name: 'Evidence' })).toBeInTheDocument()
    expect(container.querySelector('.fk-app-frame')).toHaveAttribute('data-aside', 'column')
    unmount()

    setViewportWidth(1100)
    const second = render(<Frame aside={aside} asideLabel="Evidence" asideOpen />)
    expect(screen.getByRole('dialog', { name: 'Evidence' })).toBeInTheDocument()
    expect(document.querySelector('.fk-app-frame__aside-modal')).toHaveAttribute('data-placement', 'end')
    second.unmount()

    setViewportWidth(800)
    render(<Frame aside={aside} asideLabel="Evidence" asideOpen />)
    expect(screen.getByRole('dialog', { name: 'Evidence' })).toBeInTheDocument()
    expect(document.querySelector('.fk-app-frame__aside-modal')).toHaveAttribute('data-placement', 'bottom')
  })

  it('shows the loading fallback with loadingLabel while a lazy route loads', async () => {
    let resolve!: (m: { default: () => ReactElement }) => void
    const Lazy = lazy(() => new Promise<{ default: () => ReactElement }>((r) => (resolve = r)))
    render(
      <Frame loadingLabel="Loading the catalogue">
        <Lazy />
      </Frame>,
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Loading the catalogue')
    await act(async () => resolve({ default: () => <h1>Ready</h1> }))
    expect(await screen.findByRole('heading', { name: 'Ready' })).toBeInTheDocument()
  })

  it('keeps an accessible name on every rail item when collapsed', () => {
    render(<Frame navCollapsed onNavCollapsedChange={() => {}} />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: 'Overview' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Sources' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand navigation' })).toHaveAttribute('aria-expanded', 'false')
    expect(document.querySelector('.fk-app-frame')).toHaveAttribute('data-nav', 'rail')
  })

  it('declares reduced motion and forced colours rules', () => {
    const css = cssOf('components/app-frame/AppFrame.css')
    expect(css).toMatch(/prefers-reduced-motion: reduce/)
    expect(css).toMatch(/forced-colors: active[\s\S]*CanvasText/)
  })

  it('has no axe violations', async () => {
    const { container } = render(<Frame aside={<p>Evidence body</p>} asideLabel="Evidence" asideOpen ambient />)
    await expectNoAxeViolations(container)
  })
})
