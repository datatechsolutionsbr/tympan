import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { PageDots } from './PageDots'
import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'
import { useState as useRtlState } from 'react'

describe('PageDots', () => {
  it('renders one button per page with aria-current on the current one', () => {
    render(<PageDots count={5} currentIndex={2} onSelect={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
    expect(buttons[2]).toHaveAttribute('aria-current', 'true')
    expect(buttons[2]).toHaveAccessibleName('Page 3 of 5')
    expect(screen.getByRole('group', { name: 'Pages' })).toBeInTheDocument()
  })

  it('selects with Enter and moves with arrow keys', async () => {
    const onSelect = vi.fn()
    render(<PageDots count={5} currentIndex={2} onSelect={onSelect} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Page 3 of 5' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'Page 4 of 5' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(3)
  })

  it('is not focusable without onSelect and exposes the position as text', () => {
    const { container } = render(<PageDots count={5} currentIndex={2} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(container).toHaveTextContent('Page 3 of 5')
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(0)
  })

  it('shows a counter when the pages exceed maxDots', () => {
    const { container } = render(<PageDots count={12} currentIndex={0} maxDots={9} onSelect={() => {}} />)
    expect(container).toHaveTextContent('1 of 12')
    expect(container.querySelectorAll('.ty-page-dots__pip')).toHaveLength(0)
  })

  it('keeps a 44 px hit area at the small size on touch', () => {
    const { container } = render(<PageDots count={3} currentIndex={0} size="small" onSelect={() => {}} />)
    expect(container.firstElementChild).toHaveAttribute('data-size', 'small')
    const css = cssOf('components/page-dots/PageDots.css')
    expect(css).toMatch(/\.ty-page-dots__hit\s*\{[^}]*min-inline-size:\s*var\(--ty-control-target\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <PageDots count={4} currentIndex={1} onSelect={() => {}} label={`Slides ${scheme}`} />
            <PageDots count={4} currentIndex={1} appearance="pill" />
            <PageDots count={20} currentIndex={4} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('PageDots in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    function Host() {
      const [dot, setDot] = useRtlState(0)
      return <PageDots count={4} currentIndex={dot} onSelect={setDot} label="الشرائح" />
    }
    const { container } = renderRtl(<Host />)
    const dots = rtlDom.screen.getAllByRole('button')
    dots[0]!.focus()
    // In right-to-left, Left Arrow moves to the next dot.
    await rtlUser.keyboard('{ArrowLeft}')
    expect(dots[1]).toHaveFocus()
    await axeRtl(container)
  })
})
