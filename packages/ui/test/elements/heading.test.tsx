// Behaviour of <ty-heading> (spec: wave-1/heading.md): the document level
// and the visual step are independent, the eyebrow stays outside the
// heading element, and the heading carries a stable id for aria-labelledby.
import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { TyHeadingElement } from '../../src/elements/heading/element'
import { TySectionHeadingElement } from '../../src/elements/section-heading/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'

defineTympanElement(TyHeadingElement)
defineTympanElement(TySectionHeadingElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('<ty-heading>', () => {
  it('with no props produces an h1 with the h1 visual step', async () => {
    html('<ty-heading>Sources</ty-heading>')
    const heading = screen.getByRole('heading', { level: 1, name: 'Sources' })
    expect(heading.tagName).toBe('H1')
    expect(heading).toHaveClass('ty-heading')
    expect(heading).toHaveAttribute('data-appearance', 'h1')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('level 3 produces an h3 with the h3 step derived', () => {
    html('<ty-heading level="3">Field mapping</ty-heading>')
    const heading = screen.getByRole('heading', { level: 3, name: 'Field mapping' })
    expect(heading).toHaveAttribute('data-appearance', 'h3')
  })

  it('level 2 with appearance h1 is an h2 using the h1 visual step', () => {
    html('<ty-heading level="2" appearance="h1">Workspace</ty-heading>')
    const heading = screen.getByRole('heading', { level: 2, name: 'Workspace' })
    expect(heading.tagName).toBe('H2')
    expect(heading).toHaveAttribute('data-appearance', 'h1')
  })

  it('the eyebrow renders outside the heading element; the heading text alone is the accessible name', () => {
    html('<ty-heading level="2" eyebrow="Datasets">Revenue by state</ty-heading>')
    const heading = screen.getByRole('heading', { level: 2, name: 'Revenue by state' })
    const eyebrow = document.querySelector('.ty-heading__eyebrow')!
    expect(eyebrow).toHaveTextContent('Datasets')
    expect(heading.contains(eyebrow)).toBe(false)
    // The eyebrow precedes the heading, both inside the group wrapper.
    expect(eyebrow.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(eyebrow.parentElement).toHaveClass('ty-heading-group')
    expect(heading.parentElement).toHaveClass('ty-heading-group')
  })

  it('the Subheading convenience (level 2, appearance h3) produces an h2 with the h3 step', () => {
    html('<ty-heading level="2" appearance="h3">Recent runs</ty-heading>')
    const heading = screen.getByRole('heading', { level: 2, name: 'Recent runs' })
    expect(heading.tagName).toBe('H2')
    expect(heading).toHaveAttribute('data-appearance', 'h3')
  })

  it('a page composed from library composites skips no heading level', () => {
    html(`
      <ty-heading>Sources</ty-heading>
      <ty-section-heading title="Members"></ty-section-heading>
      <ty-section-heading title="API keys" level="3"></ty-section-heading>
    `)
    const levels = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => Number(h.tagName[1]))
    expect(levels).toEqual([1, 2, 3])
    for (let i = 1; i < levels.length; i++) expect(levels[i]!).toBeLessThanOrEqual(levels[i - 1]! + 1)
  })

  it('the heading id is stable: heading-id wins, the instance id generates one otherwise', () => {
    html('<ty-heading data-ty-instance="demo">Sources</ty-heading><ty-heading heading-id="custom-id">Other</ty-heading>')
    expect(screen.getByRole('heading', { name: 'Sources' })).toHaveAttribute('id', 'demo-heading')
    expect(screen.getByRole('heading', { name: 'Other' })).toHaveAttribute('id', 'custom-id')
  })

  it('follows attribute changes from plain HTML (level, eyebrow)', () => {
    const host = html('<ty-heading>Sources</ty-heading>').querySelector('ty-heading')!
    expect(screen.getByRole('heading', { level: 1, name: 'Sources' })).toBeInTheDocument()
    host.setAttribute('level', '3')
    expect(screen.getByRole('heading', { level: 3, name: 'Sources' })).toHaveAttribute('data-appearance', 'h3')
    expect(host.querySelector('h1')).toBeNull()
    host.setAttribute('eyebrow', 'Datasets')
    expect(host.querySelector('.ty-heading__eyebrow')).toHaveTextContent('Datasets')
  })

  it('the stylesheet draws every visual step, the narrow h1 and the forced-colours fallback', () => {
    const css = cssOf('components/heading/Heading.css')
    for (const step of ['display', 'h1', 'h2', 'h3', 'label']) {
      expect(css).toContain(`.ty-heading[data-appearance='${step}']`)
    }
    expect(css).toContain('.ty-heading__eyebrow')
    const narrow = mediaBlock(css, /\(max-width:\s*639\.98px\)/)
    expect(narrow).toContain(".ty-heading[data-appearance='h1']")
    expect(narrow).toContain('--ty-font-size-h1-narrow')
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    expect(forced).toContain('CanvasText')
  })
})
