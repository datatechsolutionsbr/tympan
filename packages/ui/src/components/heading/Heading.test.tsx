import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { Heading, Subheading } from './Heading'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('Heading', () => {
  it('renders an h1 with no props', () => {
    render(<Heading>Sources</Heading>)
    expect(screen.getByRole('heading', { level: 1, name: 'Sources' })).toBeInTheDocument()
  })

  it('renders an h3 with level 3', () => {
    render(<Heading level={3}>Members</Heading>)
    expect(screen.getByRole('heading', { level: 3 }).tagName).toBe('H3')
  })

  it('keeps the element level while using another visual step', () => {
    render(
      <Heading level={2} appearance="h1">
        Title
      </Heading>,
    )
    const h = screen.getByRole('heading', { name: 'Title' })
    expect(h.tagName).toBe('H2')
    expect(h).toHaveAttribute('data-appearance', 'h1')
  })

  it('renders the eyebrow outside the heading element', () => {
    render(<Heading eyebrow="Census">Overview</Heading>)
    const h = screen.getByRole('heading', { name: 'Overview' })
    expect(h).toHaveAccessibleName('Overview')
    expect(h).not.toHaveTextContent('Census')
    expect(screen.getByText('Census').closest('h1')).toBeNull()
  })

  it('renders an h2 from Subheading with no props', () => {
    render(<Subheading>Details</Subheading>)
    const h = screen.getByRole('heading', { level: 2 })
    expect(h).toHaveAttribute('data-appearance', 'h3')
  })

  it('exposes a stable id for aria-labelledby', () => {
    render(
      <section aria-labelledby="sec">
        <Heading id="sec" level={2}>
          Evidence
        </Heading>
      </section>,
    )
    expect(screen.getByRole('region', { name: 'Evidence' })).toBeInTheDocument()
  })

  it('composites skip no heading level', () => {
    const { container } = render(
      <div>
        <Heading>Page</Heading>
        <Subheading>Section</Subheading>
        <Heading level={3}>Subsection</Heading>
      </div>,
    )
    const levels = [...container.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]))
    for (let i = 1; i < levels.length; i++) expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1)
  })

  it('shrinks the h1 step below 640 px and uses CanvasText in forced colours', () => {
    const css = cssOf('components/heading/Heading.css')
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/--fk-font-size-h1-narrow/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <main>
        <Heading eyebrow="Project">Overview</Heading>
        <Subheading>Status</Subheading>
      </main>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('Heading in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<Heading eyebrow="تعداد">الفهرس</Heading>)
    expect(rtlDom.screen.getByRole('heading', { name: 'الفهرس' })).toBeInTheDocument()
    await axeRtl(container)
  })
})
