import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { SafeAreaBottomBar, SafeAreaInset, SafeAreaScreen, SafeAreaSpacer } from './SafeAreaInset'

const css = cssOf('components/safe-area-inset/SafeAreaInset.css')

describe('SafeAreaInset', () => {
  it('pads exactly the chosen edges with the environment inset', () => {
    render(<SafeAreaInset data-testid="box">x</SafeAreaInset>)
    const box = screen.getByTestId('box')
    expect(box).toHaveAttribute('data-pad-top')
    expect(box).toHaveAttribute('data-pad-bottom')
    expect(box).not.toHaveAttribute('data-pad-left')
    expect(box).not.toHaveAttribute('data-pad-right')
    expect(css).toMatch(/\[data-pad-top\]\s*\{[^}]*env\(safe-area-inset-top/)
    expect(css).toMatch(/\[data-pad-bottom\]\s*\{[^}]*env\(safe-area-inset-bottom/)
  })

  it('pads the right side for the start edge in right-to-left', () => {
    render(
      <I18nProvider locale="ar-EG">
        <SafeAreaInset edges={['start']} data-testid="box">
          x
        </SafeAreaInset>
      </I18nProvider>,
    )
    expect(screen.getByTestId('box')).toHaveAttribute('data-pad-right')
    expect(screen.getByTestId('box')).not.toHaveAttribute('data-pad-left')
  })

  it('pads all four edges in the full-screen view and sizes spacers by the inset', () => {
    const { container } = render(
      <>
        <SafeAreaScreen data-testid="screen">x</SafeAreaScreen>
        <SafeAreaSpacer position="bottom" />
      </>,
    )
    const box = screen.getByTestId('screen')
    for (const s of ['top', 'bottom', 'left', 'right']) expect(box).toHaveAttribute(`data-pad-${s}`)
    expect(container.querySelector('.ty-safe-area-spacer')).toHaveAttribute('aria-hidden', 'true')
    expect(css).toMatch(/spacer\[data-position='bottom'\]\s*\{[^}]*env\(safe-area-inset-bottom/)
  })

  it('falls back to zero when insets are unsupported (layout unchanged)', () => {
    const envs = [...css.matchAll(/env\(safe-area-inset-[a-z]+(,\s*0px)?\)/g)]
    expect(envs.length).toBeGreaterThan(0)
    expect(envs.every((m) => m[1])).toBe(true)
  })

  it('scrolls a focused input under the bottom bar into view and reserves scroll padding', async () => {
    const scrollBy = vi.fn()
    window.scrollBy = scrollBy as typeof window.scrollBy
    render(
      <>
        <input aria-label="Note" />
        <SafeAreaBottomBar data-testid="bar">
          <button type="button">Save</button>
        </SafeAreaBottomBar>
      </>,
    )
    const bar = screen.getByTestId('bar')
    const input = screen.getByRole('textbox', { name: 'Note' })
    bar.getBoundingClientRect = () => ({ top: 700, bottom: 760 }) as DOMRect
    input.getBoundingClientRect = () => ({ top: 710, bottom: 750 }) as DOMRect
    await userEvent.click(input)
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ top: 58 }))
    expect(document.documentElement.style.getPropertyValue('--ty-safe-bottom-bar-size')).toMatch(/px$/)
    expect(css).toMatch(/scroll-padding-block-end:\s*calc\(var\(--ty-safe-bottom-bar-size/)
  })

  it('is opaque under reduced transparency and bordered in forced colours', () => {
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/backdrop-filter:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <SafeAreaInset edges={['top', 'start']}>
              <p>Content</p>
            </SafeAreaInset>
            <SafeAreaSpacer position="top" />
          </ThemeScope>
        ))}
        <SafeAreaBottomBar>
          <button type="button">Save</button>
        </SafeAreaBottomBar>
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
