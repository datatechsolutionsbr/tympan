import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { Separator } from './Separator'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

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
    const lines = container.querySelectorAll('.ty-separator__line')
    expect(lines).toHaveLength(2)
    lines.forEach((l) => expect(l).toHaveAttribute('aria-hidden', 'true'))
  })

  it('uses the fainter line token when soft', () => {
    const { container } = render(<Separator emphasis="soft" />)
    expect(container.firstElementChild).toHaveAttribute('data-emphasis', 'soft')
    expect(cssOf('components/separator/Separator.css')).toMatch(/\[data-emphasis='soft'\]\s*\{[^}]*--ty-line-soft/)
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

describe('Separator in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<Separator caption="أو" />)
    expect(rtlDom.screen.getByText('أو')).toBeInTheDocument()
    await axeRtl(container)
  })
})
