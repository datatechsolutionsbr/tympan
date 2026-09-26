import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { ThemeScope } from '../../internal/ThemeScope'
import { FeatureShowcaseCard, FeatureShowcaseMosaic } from './FeatureShowcaseCard'

const css = () => cssOf('components/feature-showcase-card/FeatureShowcaseCard.css')
const base = { media: <svg viewBox="0 0 4 3" />, kicker: 'Evidence', title: 'Every value has a source', description: 'Open the evidence panel.' }

describe('FeatureShowcaseCard', () => {
  it('with href has one tab stop named by the title, and navigates through the router', async () => {
    const navigate = vi.fn()
    renderWithProvider(
      <>
        <FeatureShowcaseCard {...base} href="/evidence" />
        <button type="button">after</button>
      </>,
      { navigate },
    )
    await userEvent.tab()
    const link = screen.getByRole('link')
    expect(link).toHaveFocus()
    expect(link).toHaveAccessibleName('Every value has a source')
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
    await userEvent.click(link)
    expect(navigate).toHaveBeenCalledWith('/evidence', undefined)
    expect(css()).toMatch(/\.ty-feature-showcase-card__link::after\s*\{[^}]*inset:\s*0/)
  })

  it('without href is an article labelled by its title, with no tab stop', async () => {
    render(
      <>
        <FeatureShowcaseCard {...base} />
        <button type="button">after</button>
      </>,
    )
    expect(screen.getByRole('article', { name: 'Every value has a source' })).toBeInTheDocument()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  it('exposes informative media as an image and hides decorative media', () => {
    const { container, rerender } = render(<FeatureShowcaseCard {...base} mediaAlt="Evidence panel capture" />)
    expect(screen.getByRole('img', { name: 'Evidence panel capture' })).toBeInTheDocument()
    rerender(<FeatureShowcaseCard {...base} />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(container.querySelector('.ty-feature-showcase-card__frame')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws edge fades, removed in forced colours', () => {
    const { container } = render(<FeatureShowcaseCard {...base} fade={['top', 'bottom']} />)
    expect(container.querySelectorAll('.ty-feature-showcase-card__fade')).toHaveLength(2)
    expect(mediaBlock(css(), /\(forced-colors:\s*active\)/)).toMatch(/\.ty-feature-showcase-card__fade\s*\{[^}]*display:\s*none/)
  })

  it('stacks full width below 1024 px; wide spans two of three columns above', () => {
    const { container } = render(
      <FeatureShowcaseMosaic>
        <FeatureShowcaseCard {...base} span="wide" />
        <FeatureShowcaseCard {...base} title="Second" span="wide" />
      </FeatureShowcaseMosaic>,
    )
    expect(container.querySelectorAll('[data-span="wide"]')).toHaveLength(2)
    expect(css()).toMatch(/\.ty-feature-mosaic\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
    const wide = mediaBlock(css(), /\(min-width:\s*1024px\)/)
    expect(wide).toMatch(/repeat\(3,/)
    expect(wide).toMatch(/\[data-span='wide'\]\s*\{[^}]*grid-column:\s*span 2/)
  })

  it('never lifts, scales or animates on hover and never uses the CTA gradient', () => {
    expect(css()).not.toMatch(/(?<!text-)transform|scale\(|translate|animation|--ty-cta/)
  })

  it('has no axe violations in light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <FeatureShowcaseCard {...base} href="#/x" mediaAlt="Capture" fade={['bottom']} />
            <FeatureShowcaseCard {...base} title={`Plain ${s}`} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
