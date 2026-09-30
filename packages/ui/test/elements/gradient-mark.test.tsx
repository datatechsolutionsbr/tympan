// Behaviour of <ty-gradient-mark> (element-first; docs/design/single-source-components.md):
// a named or decorative gradient badge, the size enum, and the per-instance
// gradient/radius overrides applied as custom properties on upgrade.
import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderElement } from '../../src/elements/anatomy'
import { defineTympanElement } from '../../src/elements/base'
import { gradientMarkDefinition } from '../../src/elements/gradient-mark/definition'
import { TyGradientMarkElement } from '../../src/elements/gradient-mark/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'

defineTympanElement(TyGradientMarkElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('<ty-gradient-mark>', () => {
  it('named by label: an img role, the glyph hidden from assistive tech', async () => {
    html('<ty-gradient-mark label="Northstar">N</ty-gradient-mark>')
    const mark = screen.getByRole('img', { name: 'Northstar' })
    expect(mark).toHaveClass('ty-gradient-mark')
    expect(mark).toHaveAttribute('data-size', 'medium')
    const glyph = mark.querySelector('.ty-gradient-mark__glyph')!
    expect(glyph).toHaveTextContent('N')
    expect(glyph).toHaveAttribute('aria-hidden', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('decorative without a label: hidden, no img role', async () => {
    html('<ty-gradient-mark>◆</ty-gradient-mark>')
    expect(document.body.querySelector('.ty-gradient-mark')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('the size enum maps to the data-size steps', () => {
    html('<ty-gradient-mark label="Northstar" size="small">N</ty-gradient-mark><ty-gradient-mark label="Northstar" size="large">N</ty-gradient-mark>')
    const marks = document.body.querySelectorAll('.ty-gradient-mark')
    expect(marks[0]).toHaveAttribute('data-size', 'small')
    expect(marks[1]).toHaveAttribute('data-size', 'large')
  })

  it('renders no glyph part when the slot is empty', () => {
    html('<ty-gradient-mark label="Northstar"></ty-gradient-mark>')
    expect(screen.getByRole('img', { name: 'Northstar' }).querySelector('.ty-gradient-mark__glyph')).toBeNull()
  })

  it('a custom gradient and radius become custom properties on upgrade; removing them restores the token default', () => {
    html('<ty-gradient-mark label="Pulse" gradient="linear-gradient(135deg, #e11d48, #7c3aed)" radius="50%">P</ty-gradient-mark>')
    const mark = document.body.querySelector('.ty-gradient-mark') as HTMLElement
    expect(mark.style.getPropertyValue('--ty-gradient-mark-gradient')).toBe('linear-gradient(135deg, #e11d48, #7c3aed)')
    expect(mark.style.getPropertyValue('--ty-gradient-mark-radius')).toBe('50%')
    const host = document.body.querySelector('ty-gradient-mark')!
    host.removeAttribute('gradient')
    host.removeAttribute('radius')
    expect(mark.style.getPropertyValue('--ty-gradient-mark-gradient')).toBe('')
    expect(mark.style.getPropertyValue('--ty-gradient-mark-radius')).toBe('')
  })

  it('follows attribute changes from plain HTML (label, size)', () => {
    const host = html('<ty-gradient-mark label="Northstar">N</ty-gradient-mark>').querySelector('ty-gradient-mark')!
    host.setAttribute('size', 'large')
    expect(screen.getByRole('img', { name: 'Northstar' })).toHaveAttribute('data-size', 'large')
    host.removeAttribute('label')
    expect(screen.queryByRole('img')).toBeNull()
    expect(document.body.querySelector('.ty-gradient-mark')).toHaveAttribute('aria-hidden', 'true')
  })

  it('every example renders through the reference renderer', () => {
    for (const example of gradientMarkDefinition.examples) {
      const markup = renderElement(gradientMarkDefinition, example.props, example.slots, 'i')
      expect(markup).toContain('class="ty-gradient-mark"')
    }
  })

  it('the stylesheet draws the token gradient, the size steps and the forced-colours fallback', () => {
    const css = cssOf('components/gradient-mark/GradientMark.css')
    expect(css).toContain('var(--ty-info)')
    expect(css).toContain('var(--ty-brand)')
    expect(css).toContain('var(--ty-brand-strong)')
    expect(css).toContain(".ty-gradient-mark[data-size='small']")
    expect(css).toContain(".ty-gradient-mark[data-size='large']")
    expect(css).toContain('.ty-gradient-mark__glyph')
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    expect(forced).toContain('CanvasText')
  })
})
