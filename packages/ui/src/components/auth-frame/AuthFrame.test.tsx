import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { BrandMark } from '../brand-mark/BrandMark'
import { AuthFrame } from './AuthFrame'

const panel = { mark: <BrandMark />, title: 'Evidence first', subtitle: 'Research workbench.', figures: [{ value: '94', label: 'cases' }] }
const form = (
  <form aria-label="Sign in">
    <h1>Sign in</h1>
    <label>
      E-mail <input />
    </label>
    <button type="submit">Enter</button>
  </form>
)
const css = cssOf('components/auth-frame/AuthFrame.css')

describe('AuthFrame', () => {
  it('shows two columns at 1440 px with the form inside main', () => {
    setViewportWidth(1440)
    const { container } = render(<AuthFrame brandPanel={panel}>{form}</AuthFrame>)
    expect(container.firstElementChild).toHaveAttribute('data-split')
    expect(screen.getByRole('complementary', { name: 'Evidence first' })).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('form', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('drops the brand side entirely at 375 px; the form fills the width minus 16 px gutters', () => {
    setViewportWidth(375)
    const { container } = render(<AuthFrame brandPanel={panel}>{form}</AuthFrame>)
    expect(screen.queryByRole('complementary')).toBeNull()
    expect(container.textContent).not.toContain('Evidence first')
    expect(css).toMatch(/\.fk-auth-frame__form-side\s*\{[^}]*padding:\s*var\(--fk-space-6\)\s+var\(--fk-space-4\)/)
    expect(css).toMatch(/\.fk-auth-frame__column\s*\{[^}]*inline-size:\s*100%/)
  })

  it('centres the surface without a brand panel', () => {
    const { container } = render(<AuthFrame>{form}</AuthFrame>)
    expect(container.firstElementChild).not.toHaveAttribute('data-split')
    expect(css).toMatch(/\.fk-auth-frame__form-side\s*\{[^}]*place-items:\s*center/)
  })

  it('narrow is narrower than regular', () => {
    const { container } = render(<AuthFrame width="narrow">{form}</AuthFrame>)
    expect(container.querySelector('.fk-auth-frame__column')).toHaveAttribute('data-width', 'narrow')
    const px = (sel: string) => Number(new RegExp(`${sel}\\s*\\{[^}]*max-inline-size:\\s*(\\d+)px`).exec(css)?.[1])
    expect(px("\\.fk-auth-frame__column\\[data-width='narrow'\\]")).toBeLessThan(px('\\.fk-auth-frame__column'))
  })

  it('puts the mark before the form surface in reading order', () => {
    const { container } = render(<AuthFrame mark={<BrandMark />}>{form}</AuthFrame>)
    const mark = container.querySelector('.fk-auth-frame__mark')!
    const sheet = container.querySelector('.fk-auth-frame__sheet')!
    expect(mark.compareDocumentPosition(sheet) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('scrolls when taller than the viewport, so every field stays reachable', () => {
    expect(css).toMatch(/\.fk-auth-frame__form-side\s*\{[^}]*overflow-y:\s*auto/)
    expect(css).toMatch(/min-block-size:\s*100dvh/)
    expect(css).not.toMatch(/\.fk-auth-frame[^{]*\{[^}]*overflow:\s*hidden/)
  })

  it('keeps a system border and becomes opaque when asked', () => {
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/border:\s*1px solid CanvasText/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/backdrop-filter:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    setViewportWidth(1440)
    const { container } = render(
      <>
        <ThemeScope scheme="light">
          <AuthFrame brandPanel={panel} mark={<BrandMark />} mainLabel="Sign in, light">
            <p>Light</p>
          </AuthFrame>
        </ThemeScope>
        <ThemeScope scheme="dark">
          <AuthFrame mainLabel="Sign in, dark">
            <p>Dark</p>
          </AuthFrame>
        </ThemeScope>
      </>,
    )
    await expectNoAxeViolations(container, ['landmark-no-duplicate-main', 'landmark-one-main', 'landmark-complementary-is-top-level', 'landmark-main-is-top-level', 'landmark-unique'])
  })
})
