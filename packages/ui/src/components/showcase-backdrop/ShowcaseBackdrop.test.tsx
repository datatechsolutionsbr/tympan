import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { AccentBand, ShowcaseBackdrop } from './ShowcaseBackdrop'

const css = () => cssOf('components/showcase-backdrop/ShowcaseBackdrop.css')

describe('ShowcaseBackdrop and AccentBand', () => {
  it('are absent from the accessibility tree', () => {
    const { container } = render(
      <section aria-label="Hero" style={{ position: 'relative' }}>
        <ShowcaseBackdrop />
        <AccentBand />
        <p>Content</p>
      </section>,
    )
    expect(container.querySelector('.ty-showcase-backdrop')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.ty-accent-band')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('region', { name: 'Hero' })).toHaveTextContent(/^Content$/)
  })

  it('clips its glows so the document never scrolls sideways', () => {
    expect(css()).toMatch(/\.ty-showcase-backdrop\s*\{[^}]*overflow:\s*hidden/)
    expect(css()).toMatch(/\.ty-showcase-backdrop\s*\{[^}]*inset:\s*0/)
  })

  it('draws no glow under reduced transparency; the band turns solid', () => {
    const reduced = mediaBlock(css(), /\(prefers-reduced-transparency:\s*reduce\)/)
    expect(reduced).toMatch(/\.ty-showcase-backdrop\s*\{[^}]*display:\s*none/)
    expect(reduced).toMatch(/\.ty-accent-band\s*\{[^}]*background:\s*var\(--ty-accent\)/)
  })

  it('hides both parts in forced colours', () => {
    expect(mediaBlock(css(), /\(forced-colors:\s*active\)/)).toMatch(/\.ty-showcase-backdrop,\s*\.ty-accent-band\s*\{[^}]*display:\s*none/)
  })

  it('lets clicks through to what lies beneath', async () => {
    expect(css()).toMatch(/\.ty-showcase-backdrop\s*\{[^}]*pointer-events:\s*none/)
    expect(css()).toMatch(/\.ty-accent-band\s*\{[^}]*pointer-events:\s*none/)
    const onClick = vi.fn()
    render(
      <div style={{ position: 'relative' }}>
        <ShowcaseBackdrop />
        <button type="button" onClick={onClick}>
          Enter
        </button>
      </div>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Enter' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('uses only the ambient hues and the accent, never the CTA gradient, and never animates', () => {
    const text = css()
    expect(text).not.toMatch(/--ty-cta|animation|transition/)
    const colours = [...text.matchAll(/var\((--ty-[a-z0-9-]+)\)/g)].map((m) => m[1]).filter((n) => !/^--ty-(glow|space|ruled)/.test(n!))
    expect(new Set(colours)).toEqual(new Set(['--ty-ambient-1', '--ty-ambient-2', '--ty-accent', '--ty-accent-soft']))
  })

  it('exposes placement, intensity and edge as data attributes', () => {
    const { container } = render(
      <>
        <ShowcaseBackdrop placement="top" intensity="faint" />
        <AccentBand edge="bottom" />
      </>,
    )
    expect(container.querySelector('.ty-showcase-backdrop')).toHaveAttribute('data-placement', 'top')
    expect(container.querySelector('.ty-showcase-backdrop')).toHaveAttribute('data-intensity', 'faint')
    expect(container.querySelector('.ty-accent-band')).toHaveAttribute('data-edge', 'bottom')
  })

  it('has no axe violations in light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <div style={{ position: 'relative' }}>
              <ShowcaseBackdrop />
              <AccentBand />
              <p>Hero</p>
            </div>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
