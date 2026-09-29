// Behaviour of <ty-brand-wordmark> (element-first; docs/design/single-source-components.md):
// ink text plus a gradient accent, an optional img-role label, and the size enum.
import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderElement } from '../../src/elements/anatomy'
import { defineTympanElement } from '../../src/elements/base'
import { brandWordmarkDefinition } from '../../src/elements/brand-wordmark/definition'
import { TyBrandWordmarkElement } from '../../src/elements/brand-wordmark/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'

defineTympanElement(TyBrandWordmarkElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('<ty-brand-wordmark>', () => {
  it('renders the plain part in ink and the accent part as a gradient segment', async () => {
    html('<ty-brand-wordmark text="North" accent="star"></ty-brand-wordmark>')
    const wordmark = document.body.querySelector('.ty-brand-wordmark')!
    expect(wordmark).toHaveAttribute('data-size', 'medium')
    expect(wordmark).not.toHaveAttribute('role')
    expect(wordmark.querySelector('.ty-brand-wordmark__text')).toHaveTextContent('North')
    expect(wordmark.querySelector('.ty-brand-wordmark__accent')).toHaveTextContent('star')
    // Without a label it is plain text: both parts read as the wordmark.
    expect(wordmark).toHaveTextContent('Northstar')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('label turns the wordmark into an img role named by it', async () => {
    html('<ty-brand-wordmark text="North" accent="star" label="Northstar"></ty-brand-wordmark>')
    const wordmark = screen.getByRole('img', { name: 'Northstar' })
    expect(wordmark).toHaveClass('ty-brand-wordmark')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('the size enum maps to the data-size steps', () => {
    html('<ty-brand-wordmark text="North" accent="star" size="small"></ty-brand-wordmark><ty-brand-wordmark text="North" accent="star" size="large"></ty-brand-wordmark>')
    const wordmarks = document.body.querySelectorAll('.ty-brand-wordmark')
    expect(wordmarks[0]).toHaveAttribute('data-size', 'small')
    expect(wordmarks[1]).toHaveAttribute('data-size', 'large')
  })

  it('renders only the parts that are set (accent-only, text-only)', () => {
    html('<ty-brand-wordmark accent="Solo"></ty-brand-wordmark><ty-brand-wordmark text="Plain"></ty-brand-wordmark>')
    const [accentOnly, textOnly] = document.body.querySelectorAll('.ty-brand-wordmark')
    expect(accentOnly!.querySelector('.ty-brand-wordmark__text')).toBeNull()
    expect(accentOnly!.querySelector('.ty-brand-wordmark__accent')).toHaveTextContent('Solo')
    expect(textOnly!.querySelector('.ty-brand-wordmark__text')).toHaveTextContent('Plain')
    expect(textOnly!.querySelector('.ty-brand-wordmark__accent')).toBeNull()
  })

  it('follows attribute changes from plain HTML (text, accent, label)', () => {
    const host = html('<ty-brand-wordmark text="North" accent="star"></ty-brand-wordmark>').querySelector('ty-brand-wordmark')!
    host.setAttribute('accent', 'light')
    expect(document.body.querySelector('.ty-brand-wordmark__accent')).toHaveTextContent('light')
    host.setAttribute('label', 'Northlight')
    expect(screen.getByRole('img', { name: 'Northlight' })).toHaveClass('ty-brand-wordmark')
  })

  it('markup in the text props stays inert (escaped, never parsed)', () => {
    html('<ty-brand-wordmark text=\'<b>not bold</b>\' accent="star"></ty-brand-wordmark>')
    expect(document.body.querySelector('.ty-brand-wordmark b')).toBeNull()
    expect(document.body.querySelector('.ty-brand-wordmark__text')).toHaveTextContent('<b>not bold</b>')
  })

  it('every example renders through the reference renderer', () => {
    for (const example of brandWordmarkDefinition.examples) {
      const markup = renderElement(brandWordmarkDefinition, example.props, example.slots, 'i')
      expect(markup).toContain('class="ty-brand-wordmark"')
    }
  })

  it('the stylesheet draws the ink text, the gradient-clipped accent and the forced-colours fallback', () => {
    const css = cssOf('components/brand-wordmark/BrandWordmark.css')
    expect(css).toContain('color: var(--ty-ink)')
    expect(css).toContain('background-clip: text')
    expect(css).toContain('var(--ty-info)')
    expect(css).toContain('var(--ty-brand-strong)')
    expect(css).toContain(".ty-brand-wordmark[data-size='small']")
    expect(css).toContain(".ty-brand-wordmark[data-size='large']")
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    expect(forced).toContain('CanvasText')
  })
})
