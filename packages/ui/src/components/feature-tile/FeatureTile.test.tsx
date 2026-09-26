import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BadgeCheck, Bot, Map } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { FeatureTile, FeatureTileGrid } from './FeatureTile'

const css = () => cssOf('components/feature-tile/FeatureTile.css')

describe('FeatureTile', () => {
  it('gives every icon badge the same accent tokens', () => {
    const { container } = render(
      <FeatureTileGrid>
        <FeatureTile icon={BadgeCheck} title="Proof" description="Every value is proved." />
        <FeatureTile icon={Bot} title="Agents" description="Agents code, people verify." />
        <FeatureTile icon={Map} title="Atlas" description="Cases on a map." />
      </FeatureTileGrid>,
    )
    const badges = container.querySelectorAll('.ty-feature-tile__badge')
    expect(badges).toHaveLength(3)
    badges.forEach((b) => {
      expect(b).toHaveAttribute('aria-hidden', 'true')
      expect(b.getAttribute('style')).toBeNull()
    })
    expect(css()).toMatch(/\.ty-feature-tile__badge\s*\{[^}]*background:\s*var\(--ty-accent-soft\);[^}]*color:\s*var\(--ty-accent\)/)
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3)
  })

  it('with href has one tab stop per tile named by its title', async () => {
    render(
      <FeatureTileGrid>
        <FeatureTile icon={BadgeCheck} title="Proof" description="d" href="#/proof" />
        <FeatureTile icon={Bot} title="Agents" description="d" href="#/agents" />
      </FeatureTileGrid>,
    )
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Proof' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Agents' })).toHaveFocus()
    expect(css()).toMatch(/\.ty-feature-tile__link::after\s*\{[^}]*inset:\s*0/)
  })

  it('is not focusable without href', async () => {
    render(
      <>
        <FeatureTile icon={Map} title="Atlas" description="d" />
        <button type="button">after</button>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  it('outlines the badge in forced colours and lays out 1, 2, 3 columns', () => {
    expect(mediaBlock(css(), /\(forced-colors:\s*active\)/)).toMatch(/\.ty-feature-tile__badge\s*\{[^}]*border:\s*1px solid CanvasText/)
    expect(mediaBlock(css(), /\(min-width:\s*640px\)/)).toMatch(/repeat\(2,/)
    expect(mediaBlock(css(), /\(min-width:\s*1024px\)/)).toMatch(/repeat\(3,/)
    expect(css()).not.toMatch(/(?<!text-)transform|translate|animation|--ty-cta/)
  })

  it('has no axe violations in light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <FeatureTileGrid>
              <FeatureTile icon={BadgeCheck} title={`Proof ${s}`} description="d" href="#/p" />
              <FeatureTile icon={Bot} title={`Agents ${s}`} description="d" surface="raised" />
            </FeatureTileGrid>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
