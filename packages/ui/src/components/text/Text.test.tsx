import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { Code, Strong, Text } from './Text'

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

describe('Text', () => {
  it('renders a paragraph with body size by default', () => {
    render(<Text>Hello</Text>)
    const el = screen.getByText('Hello')
    expect(el.tagName).toBe('P')
    expect(el).toHaveAttribute('data-size', 'body')
  })

  it('creates no block element with as="span"', () => {
    const { container } = render(<Text as="span">Inline</Text>)
    expect(container.querySelector('p, div')).toBeNull()
    expect(screen.getByText('Inline').tagName).toBe('SPAN')
  })

  it('clamps to two lines while keeping the full text accessible', () => {
    const long = 'A very long sentence that would wrap over several lines in a narrow column of the catalogue.'
    render(<Text truncate={2}>{long}</Text>)
    const el = screen.getByText(long)
    expect(el).toHaveAttribute('data-truncate', 'clamp')
    expect(el).toHaveAttribute('title', long)
    expect(el.style.getPropertyValue('--fk-text-lines')).toBe('2')
    expect(cssOf('components/text/Text.css')).toMatch(/\[data-truncate='clamp'\][^}]*line-clamp:\s*var\(--fk-text-lines/)
  })

  it('wraps Strong in a strong element', () => {
    render(<Strong>Important</Strong>)
    expect(screen.getByText('Important').tagName).toBe('STRONG')
  })

  it('wraps Code in a code element in the mono family', () => {
    render(<Code>sha256:9f2c</Code>)
    expect(screen.getByText('sha256:9f2c').tagName).toBe('CODE')
    expect(cssOf('components/text/Text.css')).toMatch(/\.fk-code\s*\{[^}]*font-family:\s*var\(--fk-font-mono\)/)
  })

  it('muted tone meets 4.5:1 on the light and dark surfaces', () => {
    expect(cssOf('components/text/Text.css')).toMatch(/\[data-tone='muted'\]\s*\{[^}]*var\(--fk-ink-3\)/)
    expect(contrast('#526077', '#fcfdfd')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#94a3b8', '#141c2e')).toBeGreaterThanOrEqual(4.5)
  })

  it('never goes below 12 px and uses tabular figures when numeric', () => {
    render(<Text numeric size="meta">1234</Text>)
    expect(screen.getByText('1234')).toHaveAttribute('data-numeric')
    const css = cssOf('components/text/Text.css')
    expect(css).toMatch(/max\(12px, var\(--fk-font-size-meta\)\)/)
    expect(css).toMatch(/tabular-nums/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Text size="body-lg" measure="summary">
          Summary <Strong>bold</Strong> <Code>key</Code>
        </Text>
        <Text tone="muted" truncate>
          Muted
        </Text>
      </div>,
    )
    await expectNoAxeViolations(container)
  })
})
