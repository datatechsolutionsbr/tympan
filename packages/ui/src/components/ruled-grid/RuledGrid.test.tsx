import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { RuledGrid, RuledGridCell, RuledGridRow } from './RuledGrid'

const css = () => cssOf('components/ruled-grid/RuledGrid.css')

function TwoByThree({ marks = false }: { marks?: boolean }) {
  return (
    <RuledGrid marks={marks}>
      {[0, 1].map((r) => (
        <RuledGridRow key={r} columns={3}>
          {[0, 1, 2].map((c) => (
            <RuledGridCell key={c}>{`r${r}c${c}`}</RuledGridCell>
          ))}
        </RuledGridRow>
      ))}
    </RuledGrid>
  )
}

describe('RuledGrid', () => {
  it('separates rows and cells with rules and marks every intersection and corner', () => {
    const { container } = render(<TwoByThree marks />)
    expect(container.querySelectorAll('.ty-ruled-grid__row')).toHaveLength(2)
    const cells = container.querySelectorAll('.ty-ruled-grid__cell')
    for (const cell of cells) {
      const corners = [...cell.querySelectorAll('.ty-ruled-grid__mark')].map((m) => m.getAttribute('data-corner'))
      expect(corners).toEqual(['start-start', 'start-end', 'end-start', 'end-end'])
    }
    expect(container.querySelectorAll('.ty-ruled-grid__mark[aria-hidden="true"]')).toHaveLength(24)
    expect(css()).toMatch(/\.ty-ruled-grid__row \+ \.ty-ruled-grid__row\s*\{[^}]*border-block-start:\s*1px solid var\(--ty-line\)/)
    expect(css()).toMatch(/\.ty-ruled-grid__cell \+ \.ty-ruled-grid__cell\s*\{[^}]*border-inline-start:\s*1px solid var\(--ty-line\)/)
    expect(container.querySelector('.ty-ruled-grid__row')).toHaveStyle({ '--ty-ruled-columns': 'repeat(3, minmax(0, 1fr))' })
  })

  it('draws no marks unless asked', () => {
    const { container } = render(<TwoByThree />)
    expect(container.querySelector('.ty-ruled-grid__mark')).toBeNull()
  })

  it('collapses to one column on phones with horizontal rules between stacked cells', () => {
    const phone = mediaBlock(css(), /\(max-width:\s*639\.98px\)/)
    expect(phone).toMatch(/\.ty-ruled-grid__row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
    expect(phone).toMatch(/border-block-start:\s*1px solid/)
  })

  it('offers list semantics through as', () => {
    render(
      <RuledGrid>
        <RuledGridRow as="ul" columns={3}>
          <RuledGridCell as="li">A</RuledGridCell>
          <RuledGridCell as="li">B</RuledGridCell>
          <RuledGridCell as="li">C</RuledGridCell>
        </RuledGridRow>
      </RuledGrid>,
    )
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3)
  })

  it('keeps rules and drops marks in forced colours', () => {
    const forced = mediaBlock(css(), /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/border-color:\s*CanvasText/)
    expect(forced).toMatch(/\.ty-ruled-grid__mark\s*\{[^}]*display:\s*none/)
  })

  it('omits outer rules when outerRules is false', () => {
    const { container } = render(
      <RuledGrid outerRules={false}>
        <RuledGridRow>
          <RuledGridCell>x</RuledGridCell>
        </RuledGridRow>
      </RuledGrid>,
    )
    expect(container.firstElementChild).not.toHaveAttribute('data-outer')
  })

  it('has no axe violations in light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <TwoByThree marks />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
