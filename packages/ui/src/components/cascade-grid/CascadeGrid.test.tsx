import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setMedia } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { DecorativeMotion } from '../../utilities/motion-foundation/motion'
import { CascadeGrid, cascadeDelays } from './CascadeGrid'

const items = (n: number) => Array.from({ length: n }, (_, i) => <p key={`i${i}`}>Item {i + 1}</p>)
const css = cssOf('components/cascade-grid/CascadeGrid.css')

describe('CascadeGrid', () => {
  it('renders a plain grid by default', () => {
    const { container } = render(
      <CascadeGrid cascade role="list" aria-label="Features">
        {items(3)}
      </CascadeGrid>,
    )
    const plain = render(
      <div className="fk-cascade-grid" role="list" aria-label="Features">
        {items(3)}
      </div>,
    )
    expect(container.firstElementChild!.isEqualNode(plain.container.firstElementChild)).toBe(true)
    expect(container.querySelector('[data-entering]')).toBeNull()
  })

  it('starts entrances in document order when both switches are on', () => {
    const { container } = render(
      <DecorativeMotion enabled>
        <CascadeGrid cascade>{items(4)}</CascadeGrid>
      </DecorativeMotion>,
    )
    const cells = [...container.querySelectorAll<HTMLElement>('.fk-cascade-grid__cell')]
    expect(cells.every((c) => c.hasAttribute('data-entering'))).toBe(true)
    const delays = cells.map((c) => parseFloat(c.style.getPropertyValue('--fk-cascade-delay')))
    expect(delays).toEqual([...delays].sort((a, b) => a - b))
    expect(delays[0]).toBe(0)
    expect(delays[3]).toBeGreaterThan(delays[1]!)
  })

  it('starts the last of twenty items within maxTotalMs', () => {
    expect(cascadeDelays(20, 90, 240).at(-1)).toBeLessThanOrEqual(240)
    const { container } = render(
      <DecorativeMotion enabled>
        <CascadeGrid cascade maxTotalMs={240}>
          {items(20)}
        </CascadeGrid>
      </DecorativeMotion>,
    )
    const last = [...container.querySelectorAll<HTMLElement>('.fk-cascade-grid__cell')].at(-1)!
    expect(parseFloat(last.style.getPropertyValue('--fk-cascade-delay'))).toBeLessThanOrEqual(240)
  })

  it('runs no animation under reduced motion', () => {
    setMedia({ reducedMotion: true })
    const { container } = render(
      <DecorativeMotion enabled>
        <CascadeGrid cascade>{items(3)}</CascadeGrid>
      </DecorativeMotion>,
    )
    expect(container.querySelector('[data-entering]')).toBeNull()
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
  })

  it('shows children added after mount without animation', () => {
    const { container, rerender } = render(
      <DecorativeMotion enabled>
        <CascadeGrid cascade>{items(2)}</CascadeGrid>
      </DecorativeMotion>,
    )
    rerender(
      <DecorativeMotion enabled>
        <CascadeGrid cascade>{items(3)}</CascadeGrid>
      </DecorativeMotion>,
    )
    const cells = container.querySelectorAll('.fk-cascade-grid__cell')
    expect(cells).toHaveLength(3)
    expect(cells[2]).not.toHaveAttribute('data-entering')
  })

  it('lets Tab reach a child during the cascade', async () => {
    render(
      <DecorativeMotion enabled>
        <CascadeGrid cascade>
          <button type="button">Open</button>
          <p>Other</p>
        </CascadeGrid>
      </DecorativeMotion>,
    )
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
  })

  it('renders visible items on the server and uses opacity and translate only', () => {
    const html = renderToString(
      <DecorativeMotion enabled>
        <CascadeGrid cascade>{items(2)}</CascadeGrid>
      </DecorativeMotion>,
    )
    expect(html).not.toMatch(/data-entering/)
    expect(css).not.toMatch(/scale|spring/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <DecorativeMotion enabled>
              <CascadeGrid cascade role="list" aria-label={`Grid ${scheme}`}>
                <div role="listitem">One</div>
                <div role="listitem">Two</div>
              </CascadeGrid>
            </DecorativeMotion>
          </ThemeScope>
        ))}
      </>,
    )
    // Wrappers are role="none", so list semantics pass straight through them.
    await expectNoAxeViolations(container)
  })
})
