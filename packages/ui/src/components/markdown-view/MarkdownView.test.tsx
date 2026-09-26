import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { MarkdownView } from './MarkdownView'
import { readBlocks } from './parse'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('MarkdownView', () => {
  it('offsets a level-1 heading to the base level', () => {
    render(<MarkdownView text="# Title" headingBase={3} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Title' })).toBeInTheDocument()
  })

  it('caps deeper headings at level 6', () => {
    render(<MarkdownView text={'#### Deep'} headingBase={5} />)
    expect(screen.getByRole('heading', { level: 6, name: 'Deep' })).toBeInTheDocument()
  })

  it('joins "-" and "*" bullets into one unordered list', () => {
    const { container } = render(<MarkdownView text={'- a\n* b'} />)
    expect(container.querySelectorAll('ul')).toHaveLength(1)
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2)
  })

  it('reads "1)" items as an ordered list', () => {
    const { container } = render(<MarkdownView text={'1) x\n2) y'} />)
    expect(container.querySelector('ol')?.children).toHaveLength(2)
  })

  it('renders a fenced block with its language tag', () => {
    const { container } = render(<MarkdownView text={'```sql\nselect 1\n```'} />)
    expect(container.querySelector('pre code')).toHaveTextContent('select 1')
    expect(container.querySelector('pre')).toHaveAttribute('data-language', 'sql')
    expect(screen.getByText('sql')).toBeInTheDocument()
  })

  it('lets an unclosed fence absorb the rest of the input', () => {
    expect(readBlocks('```\na\n\n# b')).toEqual([{ kind: 'code', language: undefined, value: 'a\n\n# b' }])
  })

  it('creates no link for a javascript URL', () => {
    render(<MarkdownView text="[x](javascript:alert(1))" />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText(/\[x\]\(javascript:alert\(1\)/)).toBeInTheDocument()
  })

  it('shows angle brackets as text', () => {
    const { container } = render(<MarkdownView text="<b>hi</b>" />)
    expect(container.querySelector('b')).toBeNull()
    expect(container.textContent).toBe('<b>hi</b>')
  })

  it('renders strong, emphasis and code spans and keeps the surrounding text', () => {
    const { container } = render(<MarkdownView text={'**bold** and *em* and a `code` span'} />)
    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect(container.querySelector('em')).toHaveTextContent('em')
    expect(container.querySelector('code')).toHaveTextContent('code')
    expect(container.textContent).toBe('bold and em and a code span')
  })

  it('opens an https link in a new tab with no opener and a hidden suffix', () => {
    render(<MarkdownView text="See [the protocol](https://example.org/p)." />)
    const link = screen.getByRole('link', { name: /the protocol/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    expect(link).toHaveTextContent('opens in a new tab')
  })

  it('normalises CRLF and renders nothing for empty text', () => {
    expect(readBlocks('a\r\nb')).toEqual([{ kind: 'paragraph', content: [{ kind: 'text', value: 'a b' }] }])
    const { container } = render(<MarkdownView text="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('keeps link underlines and code borders in forced colours; wraps long words', () => {
    const css = cssOf('components/markdown-view/MarkdownView.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/underline/)
    expect(css).toMatch(/overflow-wrap:\s*anywhere/)
  })

  it('has no axe violations, light and dark', async () => {
    const text = '# Result\n\nThe **stage** rule `v2` counts [cases](https://example.org).\n\n- one\n- two\n\n```json\n{"a": 1}\n```'
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <MarkdownView text={text} headingBase={2} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('MarkdownView in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<MarkdownView text={'# عنوان\n\nفقرة مع **تأكيد**.\n\n- بند'} />)
    // Each block takes its direction from its own text (bidi-safe mixed documents).
    for (const el of container.querySelectorAll('p, li, h3')) expect(el).toHaveAttribute('dir', 'auto')
    await axeRtl(container)
  })
})
