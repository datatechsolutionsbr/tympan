import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setMedia } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { brand, BrandLogo, BrandMark } from './BrandMark'

describe('BrandMark', () => {
  it('icon-only: the badge is an image named by the label', () => {
    render(<BrandMark showWordmark={false} label="Tympan home" />)
    expect(screen.getByRole('img', { name: 'Tympan home' })).toBeInTheDocument()
  })

  it('with the wordmark the product name is read once', () => {
    const { container } = render(<BrandMark />)
    expect(container.textContent).toBe('Tympan')
    expect(screen.queryByRole('img')).toBeNull()
    expect(container.querySelector('.ty-brand-mark__badge')).toHaveAttribute('aria-hidden', 'true')
  })

  it('image form picks the dark logo file on dark themes', () => {
    const { rerender } = render(<BrandLogo mode="dark" />)
    expect(screen.getByRole('img', { name: 'Tympan' })).toHaveAttribute('src', brand.logoFiles.logoDark)
    rerender(<BrandLogo mode="light" />)
    expect(screen.getByRole('img')).toHaveAttribute('src', brand.logoFiles.logo)
    rerender(<BrandLogo />)
    setMedia({ dark: true })
    expect(screen.getByRole('img')).toHaveAttribute('src', brand.logoFiles.logoDark)
  })

  it('scales badge and text together per size, with plain ink wordmark', () => {
    const css = cssOf('components/brand-mark/BrandMark.css')
    for (const size of ['small', 'large']) {
      expect(css).toMatch(new RegExp(`\\[data-size='${size}'\\]\\s*\\{[^}]*--ty-brand-mark-unit[^}]*--ty-brand-mark-type`))
    }
    expect(css).toMatch(/\.ty-brand-mark__word\s*\{[^}]*color:\s*var\(--ty-ink\)/)
    const { container } = render(<BrandMark size="small" />)
    expect(container.firstElementChild).toHaveAttribute('data-size', 'small')
  })

  it('outlines the badge under forced colours', () => {
    expect(mediaBlock(cssOf('components/brand-mark/BrandMark.css'), /\(forced-colors:\s*active\)/)).toMatch(/outline:\s*1px solid CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <BrandMark size="small" />
            <BrandMark showWordmark={false} />
            <BrandLogo mode={s} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
