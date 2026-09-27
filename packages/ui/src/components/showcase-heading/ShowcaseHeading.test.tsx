import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { Kicker, Lead, ShowcaseHeading } from './ShowcaseHeading'

const css = () => cssOf('components/showcase-heading/ShowcaseHeading.css')

describe('ShowcaseHeading', () => {
  it('level 2: exactly one h2 holds the title and the kicker stays outside it', () => {
    render(
      <ShowcaseHeading level={2} kicker="Public research" lead="Air quality, station by station.">
        Urban air quality
      </ShowcaseHeading>,
    )
    const headings = screen.getAllByRole('heading')
    expect(headings).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Urban air quality')
    expect(screen.getByText('Public research').closest('h2')).toBeNull()
  })

  it('limits the lead to the reading measure', () => {
    render(<ShowcaseHeading lead="A long lead paragraph that would run past the reading width.">Title</ShowcaseHeading>)
    expect(screen.getByText(/long lead/)).toHaveClass('ty-lead')
    expect(css()).toMatch(/\.ty-lead\s*\{[^}]*max-inline-size:\s*calc\(var\(--ty-measure-prose\)\s*\*\s*1ch\)/)
  })

  it('centres kicker, title and lead with align center', () => {
    const { container } = render(
      <ShowcaseHeading align="center" kicker="K" lead="L">
        T
      </ShowcaseHeading>,
    )
    const block = container.firstElementChild!
    expect(block).toHaveAttribute('data-align', 'center')
    expect(block.querySelectorAll('.ty-kicker, .ty-showcase-heading__title, .ty-lead')).toHaveLength(3)
    expect(css()).toMatch(/\.ty-showcase-heading\[data-align='center'\]\s*\{[^}]*text-align:\s*center/)
  })

  it('produces only the heading element without kicker and lead', () => {
    const { container } = render(<ShowcaseHeading id="t">Only a title</ShowcaseHeading>)
    expect(container.children).toHaveLength(1)
    expect(container.firstElementChild!.tagName).toBe('H1')
    expect(container.firstElementChild).toHaveAttribute('id', 't')
  })

  it('exports Kicker and Lead standalone; Lead accepts as', () => {
    render(
      <>
        <Kicker>Topic</Kicker>
        <Lead as="div">Body</Lead>
      </>,
    )
    expect(screen.getByText('Topic').tagName).toBe('P')
    expect(screen.getByText('Body').tagName).toBe('DIV')
  })

  it('steps the title down below 640 px and uses CanvasText in forced colours', () => {
    expect(mediaBlock(css(), /\(max-width:\s*639\.98px\)/)).toMatch(/--ty-font-size-h1\)/)
    expect(mediaBlock(css(), /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
    expect(css()).not.toMatch(/animation|--ty-cta/)
  })

  it('has no axe violations in light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <ShowcaseHeading level={2} kicker="Air study" lead="Evidence first.">
              Tympan
            </ShowcaseHeading>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
