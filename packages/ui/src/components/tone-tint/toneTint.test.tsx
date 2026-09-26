import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { checkToneUsage, isToneName, resolveTint, tintStyle, toneNames } from './toneTint'

const css = cssOf('components/tone-tint/ToneTint.css')

describe('ToneTint resolver', () => {
  it('references only --ty-tint-success-* properties and no literal colour', () => {
    const t = resolveTint('success')
    for (const value of Object.values(t)) {
      expect(value).toMatch(/^var\(--ty-tint-success-(rgb|soft|ring)\)$/)
      expect(value).not.toMatch(/#|rgb\(|oklch\(|hsl\(/)
    }
  })

  it('returns the neutral set for an unknown tone, or the fallback when given', () => {
    expect(resolveTint('violet')).toEqual(resolveTint('neutral'))
    expect(resolveTint(undefined)).toEqual(resolveTint('neutral'))
    expect(resolveTint('nope', 'accent').soft).toBe('var(--ty-tint-accent-soft)')
  })

  it('validates host input with isToneName', () => {
    expect(isToneName('categorical-8')).toBe(true)
    expect(isToneName('categorical-9')).toBe(false)
    expect(isToneName(3)).toBe(false)
    expect(toneNames).toHaveLength(13)
  })

  it('defines all three tokens for every tone, on the themed selectors (both themes)', () => {
    const tokenBlock = css.slice(css.indexOf('@layer tympan.tokens'), css.indexOf('@layer tympan.components'))
    expect(tokenBlock).toMatch(/\[data-ty-mode\]/)
    expect(tokenBlock).toMatch(/\[data-ty-theme\]/)
    for (const tone of toneNames) {
      for (const part of ['rgb', 'soft', 'ring']) expect(tokenBlock).toContain(`--ty-tint-${tone}-${part}:`)
    }
    expect(tokenBlock).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('flags a categorical tone used on a table cell', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(checkToneUsage('categorical-2', 'table-cell')).toMatch(/categorical/)
    expect(checkToneUsage('categorical-2', 'map')).toBeNull()
    expect(checkToneUsage('success', 'table-cell')).toBeNull()
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('uses the opaque surface under reduced transparency and ignores the tint in forced colours', () => {
    const reduced = mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)
    expect(reduced).toMatch(/background-color:\s*var\(--ty-surface-solid\)/)
    expect(reduced).toMatch(/background-image:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/background-image:\s*none/)
  })

  it('applies a tint through one inline custom property and stays accessible', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <div data-ty-tinted="" style={tintStyle('pending')}>
              <p>Pending review, 3 claims</p>
            </div>
          </ThemeScope>
        ))}
      </>,
    )
    const el = container.querySelector('[data-ty-tinted]') as HTMLElement
    expect(el.style.getPropertyValue('--ty-surface-tint')).toBe('var(--ty-tint-pending-soft)')
    await expectNoAxeViolations(container)
  })
})
