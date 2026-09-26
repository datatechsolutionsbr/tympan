import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setMedia } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { HighlightStat } from './HighlightStat'

/** Text a screen reader reaches: content outside aria-hidden subtrees. */
function readable(el: Element): string {
  if (el.getAttribute('aria-hidden') === 'true') return ''
  return [...el.childNodes].map((n) => (n.nodeType === Node.TEXT_NODE ? n.textContent : n instanceof Element ? readable(n) : '')).join(' ')
}

describe('HighlightStat', () => {
  it('is a group named by the label; the value is read once', () => {
    render(<HighlightStat value={94} label="cases" reveal />)
    const group = screen.getByRole('group', { name: 'cases' })
    expect(group).toHaveAccessibleDescription('94')
    expect(readable(group).match(/94/g)).toHaveLength(1)
  })

  it('shows the final value at once with reveal under reduced motion', () => {
    setMedia({ reducedMotion: true })
    const { container } = render(<HighlightStat value={94} label="cases" reveal />)
    expect(container.querySelector('.ty-reveal-number__run')).toHaveTextContent('94')
  })

  it('has the source link as its only tab stop', async () => {
    render(
      <>
        <HighlightStat value={1234} label="assertions" source={{ text: 'Edition 2026-09-20', href: '#/editions' }} />
        <button type="button">after</button>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Edition 2026-09-20' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
    expect(screen.getByRole('group', { name: 'assertions' })).toHaveAccessibleDescription(/Edition 2026-09-20/)
  })

  it('draws no card with surface none, a raised card otherwise', () => {
    const { container } = render(
      <>
        <HighlightStat value="12" label="countries" />
        <HighlightStat value={3} label="editions" surface="raised" />
      </>,
    )
    const [plain, raised] = container.querySelectorAll('.ty-highlight-stat')
    expect(plain).toHaveAttribute('data-surface', 'none')
    expect(raised).toHaveAttribute('data-surface', 'raised')
    const css = cssOf('components/highlight-stat/HighlightStat.css')
    expect(css).not.toMatch(/\.ty-highlight-stat\s*\{[^}]*(border|box-shadow)/)
    expect(css).not.toMatch(/--ty-cta|animation|transition|transform/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('formats numbers with the locale by default and a custom formatter when given', () => {
    render(
      <>
        <HighlightStat value={1234} label="a" />
        <HighlightStat value={0.25} label="b" format={(n) => `${n * 100}%`} />
      </>,
    )
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('has no axe violations in light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <HighlightStat value={94} label={`cases ${s}`} surface="raised" source={{ text: 'Edition', href: '#/e' }} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
