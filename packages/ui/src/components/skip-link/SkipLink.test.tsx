import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { SkipLink } from './SkipLink'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

function Page({ label }: { label?: string }) {
  return (
    <>
      <SkipLink label={label} />
      <header>
        <nav aria-label="Main">
          <a href="/a">Overview</a>
        </nav>
      </header>
      <main id="main-content">
        <h1>Catalogue</h1>
        <button type="button">After main</button>
      </main>
    </>
  )
}

describe('SkipLink', () => {
  it('is the first Tab stop and becomes visible when focused', async () => {
    render(<Page />)
    await userEvent.tab()
    const link = screen.getByRole('link', { name: 'Skip to main content' })
    expect(link).toHaveFocus()
    expect(cssOf('components/skip-link/SkipLink.css')).toMatch(/\.fk-skip-link:focus[^{]*\{[^}]*clip-path:\s*none/)
  })

  it('moves focus to the target on Enter and continues from there', async () => {
    render(<Page />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    const main = document.getElementById('main-content')!
    expect(main).toHaveFocus()
    expect(main).toHaveAttribute('tabindex', '-1')
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'After main' })).toHaveFocus()
  })

  it('stays in the accessibility tree while hidden', () => {
    render(<Page />)
    const link = screen.getByRole('link', { name: 'Skip to main content' })
    expect(link).toBeInTheDocument()
    const css = cssOf('components/skip-link/SkipLink.css')
    expect(css).not.toMatch(/display:\s*none/)
    expect(css).toMatch(/\.fk-skip-link\s*\{[^}]*clip-path:\s*inset\(50%\)/)
  })

  it('scrolls the target clear of the sticky top bar', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    render(<Page />)
    await userEvent.click(screen.getByRole('link', { name: 'Skip to main content' }))
    expect(scroll).toHaveBeenCalledWith({ block: 'start' })
    expect(cssOf('base.css')).toMatch(/scroll-padding-top:\s*var\(--fk-layout-scroll-padding\)/)
  })

  it('uses the given label', () => {
    render(<Page label="Ir para o conteúdo" />)
    expect(screen.getByRole('link', { name: 'Ir para o conteúdo' })).toBeInTheDocument()
  })

  it('has a 44 px focused height and forced-colours rules', () => {
    const css = cssOf('components/skip-link/SkipLink.css')
    expect(css).toMatch(/min-block-size:\s*var\(--fk-control-target\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/LinkText/)
  })

  it('has no axe violations', async () => {
    const { container } = render(<Page />)
    await expectNoAxeViolations(container)
  })
})

describe('SkipLink in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<><SkipLink targetId="rtl-main" label="انتقل إلى المحتوى" /><main id="rtl-main">محتوى</main></>)
    expect(rtlDom.screen.getByRole('link', { name: 'انتقل إلى المحتوى' })).toHaveAttribute('href', '#rtl-main')
    await axeRtl(container)
  })
})
