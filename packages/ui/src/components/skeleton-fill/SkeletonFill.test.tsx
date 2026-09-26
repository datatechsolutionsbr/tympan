import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { SkeletonBlock, skeletonFill } from './SkeletonFill'

const css = cssOf('components/skeleton-fill/SkeletonFill.css')

describe('SkeletonFill and SkeletonBlock', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<SkeletonBlock />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('stops the pulse under reduced motion and stays visible', () => {
    const reduced = mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/animation:\s*none/)
    expect(reduced).toMatch(/opacity:\s*0\.7/)
  })

  it('on-accent uses the on-accent fill token derived from accent-ink', () => {
    const { container } = render(<SkeletonBlock variant="on-accent" shape="pill" />)
    expect(container.firstElementChild).toHaveAttribute('data-ty-skeleton', 'on-accent')
    expect(css).toMatch(/--ty-skeleton-fill-on-accent:\s*color-mix\(in oklab,\s*var\(--ty-accent-ink\)/)
  })

  it('outlines the shape with GrayText under forced colours', () => {
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/outline:\s*1px solid GrayText/)
  })

  it('gives every placeholder the same hook, fill token and pulse period', () => {
    const a = skeletonFill()
    const b = skeletonFill('surface')
    expect(a).toEqual(b)
    expect(css).toMatch(/\[data-ty-skeleton\]\s*\{[^}]*background:\s*var\(--ty-skeleton-fill\)[^}]*animation:\s*ty-skeleton-fill-pulse var\(--ty-dur-pulse\)/)
    expect(skeletonFill('surface', false)).toHaveProperty('data-ty-skeleton-static')
  })

  it('maps spacing steps and lengths to sizes', () => {
    const { container } = render(<SkeletonBlock shape="block" width="60%" height={7} animated={false} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.getPropertyValue('--ty-skeleton-w')).toBe('60%')
    expect(el.style.getPropertyValue('--ty-skeleton-h')).toBe('var(--ty-space-7)')
    expect(el).toHaveAttribute('data-ty-skeleton-static')
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <SkeletonBlock />
            <SkeletonBlock shape="circle" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
