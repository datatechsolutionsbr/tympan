import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { AmbientBackdrop } from './AmbientBackdrop'

const css = cssOf('components/ambient-backdrop/AmbientBackdrop.css')

describe('AmbientBackdrop', () => {
  it('is hidden from the accessibility tree and ignores clicks', async () => {
    const onClick = vi.fn()
    const { container } = render(
      <div onClick={onClick}>
        <AmbientBackdrop />
      </div>,
    )
    const root = container.querySelector('.ty-ambient')!
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root.querySelector('[tabindex],a,button')).toBeNull()
    expect(css).toMatch(/\.ty-ambient\s*\{[^}]*pointer-events:\s*none/)
    await userEvent.click(root)
    expect(onClick).toHaveBeenCalledTimes(1) // the event reaches the page behind, nothing inside handles it
  })

  it('is not displayed under reduced transparency, without backdrop blur, or in forced colours', () => {
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/display:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/display:\s*none/)
    expect(css).toMatch(/@supports not[^{]*backdrop-filter[^{]*\{\s*\.ty-ambient\s*\{\s*display:\s*none/)
  })

  it('never causes horizontal overflow (fixed, clipped)', () => {
    expect(css).toMatch(/\.ty-ambient\s*\{[^}]*position:\s*fixed[^}]*overflow:\s*hidden/)
  })

  it('reads the per-mode ambient tokens (dark intensities differ)', () => {
    expect(css).toMatch(/var\(--ty-ambient-1\)/)
    expect(css).toMatch(/var\(--ty-ambient-2\)/)
    const tokens = readFileSync(createRequire(import.meta.url).resolve('@datatechsolutions/tympan-tokens/tokens.css'), 'utf8')
    const values = [...tokens.matchAll(/--ty-ambient-1:\s*([^;]+);/g)].map((m) => m[1])
    expect(new Set(values).size).toBeGreaterThan(1)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        <ThemeScope scheme="light">
          <AmbientBackdrop />
        </ThemeScope>
        <ThemeScope scheme="dark">
          <AmbientBackdrop />
        </ThemeScope>
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
