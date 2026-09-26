import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { Separator } from './Separator'

describe('Separator', () => {
  it('is decorative by default', () => {
    const { container } = render(<Separator />)
    expect(screen.queryByRole('separator')).toBeNull()
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes the separator role when semantic', () => {
    render(<Separator semantic />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('reports vertical orientation', () => {
    render(<Separator semantic orientation="vertical" />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('keeps the caption readable and hides the lines', () => {
    const { container } = render(<Separator caption="or" />)
    const caption = screen.getByText('or')
    expect(caption.closest('[aria-hidden="true"]')).toBeNull()
    const lines = container.querySelectorAll('.fk-separator__line')
    expect(lines).toHaveLength(2)
    lines.forEach((l) => expect(l).toHaveAttribute('aria-hidden', 'true'))
  })

  it('uses the fainter line token when soft', () => {
    const { container } = render(<Separator emphasis="soft" />)
    expect(container.firstElementChild).toHaveAttribute('data-emphasis', 'soft')
    expect(cssOf('components/separator/Separator.css')).toMatch(/\[data-emphasis='soft'\]\s*\{[^}]*--fk-line-soft/)
  })

  it('stays visible in forced colours', () => {
    expect(mediaBlock(cssOf('components/separator/Separator.css'), /\(forced-colors:\s*active\)/)).toMatch(/background:\s*CanvasText/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Separator />
        <Separator semantic />
        <Separator caption="or" />
      </div>,
    )
    await expectNoAxeViolations(container)
  })
})
