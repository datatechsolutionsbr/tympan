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
    expect(container.firstElementChild).toHaveAttribute('data-fk-skeleton', 'on-accent')
    expect(css).toMatch(/--fk-skeleton-fill-on-accent:\s*color-mix\(in oklab,\s*var\(--fk-accent-ink\)/)
  })

  it('outlines the shape with GrayText under forced colours', () => {
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/outline:\s*1px solid GrayText/)
  })

  it('gives every placeholder the same hook, fill token and pulse period', () => {
    const a = skeletonFill()
    const b = skeletonFill('surface')
    expect(a).toEqual(b)
    expect(css).toMatch(/\[data-fk-skeleton\]\s*\{[^}]*background:\s*var\(--fk-skeleton-fill\)[^}]*animation:\s*fk-skeleton-fill-pulse var\(--fk-dur-pulse\)/)
    expect(skeletonFill('surface', false)).toHaveProperty('data-fk-skeleton-static')
  })

  it('maps spacing steps and lengths to sizes', () => {
    const { container } = render(<SkeletonBlock shape="block" width="60%" height={7} animated={false} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.getPropertyValue('--fk-skeleton-w')).toBe('60%')
    expect(el.style.getPropertyValue('--fk-skeleton-h')).toBe('var(--fk-space-7)')
    expect(el).toHaveAttribute('data-fk-skeleton-static')
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
