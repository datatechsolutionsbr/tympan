// `<ty-markdown-view>`: safe rendering of the Markdown subset (spec:
// wave-2/markdown-view.md). The element shares the parser with the React
// MarkdownView, so these tests pin the element's output: the tree it builds
// (never from an HTML string), the link safety rules and the scroll-region
// behaviour of overflowing code blocks.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { TyMarkdownViewElement } from '../../src/elements/markdown-view/element'
import { markdownViewDefinition } from '../../src/elements/markdown-view/definition'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'

defineTympanElement(TyMarkdownViewElement)

type Host = HTMLElement & { text: string; headingBase: number; density: string }

/** Renders `<ty-markdown-view>` with `source` as its `text` and returns the host. */
function view(source: string, attrs: Record<string, string> = {}): Host {
  const host = document.createElement('ty-markdown-view') as Host
  host.setAttribute('text', source)
  for (const [name, value] of Object.entries(attrs)) host.setAttribute(name, value)
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('<ty-markdown-view>', () => {
  it('is registered from its definition', () => {
    expect(customElements.get('ty-markdown-view')).toBe(TyMarkdownViewElement)
    expect(markdownViewDefinition.kind).toBe('self-rendering')
  })

  it('offsets a Markdown level-1 heading to headingBase (default 3)', async () => {
    view('# Title')
    const heading = screen.getByRole('heading', { level: 3, name: 'Title' })
    expect(heading).toHaveClass('ty-markdown__heading')
    expect(heading).toHaveAttribute('data-depth', '1')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('follows headingBase and caps deeper levels at 6', () => {
    view('# One\n\n## Two', { 'heading-base': '2' })
    expect(screen.getByRole('heading', { level: 2, name: 'One' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Two' })).toBeInTheDocument()
    document.body.replaceChildren()
    view('#### Deep', { 'heading-base': '5' })
    expect(screen.getByRole('heading', { level: 6, name: 'Deep' })).toBeInTheDocument()
  })

  it('joins "-" and "*" bullets into one unordered list', () => {
    const host = view('- a\n* b')
    expect(host.querySelectorAll('ul.ty-markdown__list')).toHaveLength(1)
    expect(screen.getByRole('list').querySelectorAll('li')).toHaveLength(2)
  })

  it('reads numbered items ("1)" and "2.") as an ordered list', () => {
    const host = view('1) x\n2) y')
    const list = host.querySelector('ol.ty-markdown__list')
    expect(list?.children).toHaveLength(2)
    expect(screen.getByRole('list')).toBe(list)
  })

  it('renders a fenced code block with its language tag as meta', () => {
    const host = view('```sql\nselect 1\n```')
    const pre = host.querySelector('pre.ty-markdown__pre')!
    expect(pre).toHaveAttribute('data-language', 'sql')
    expect(pre).toHaveAttribute('dir', 'ltr')
    expect(pre.querySelector('code')).toHaveTextContent('select 1')
    const tag = host.querySelector('.ty-markdown__language')!
    expect(tag).toHaveTextContent('sql')
    expect(tag).toHaveAttribute('aria-hidden', 'true')
    // Fits its content: not a scroll region, not focusable.
    expect(pre).not.toHaveAttribute('tabindex')
    expect(pre).not.toHaveAttribute('role')
  })

  it('lets an unclosed fence absorb the rest of the input as code', () => {
    const host = view('```\na\n\n# b')
    const pre = host.querySelector('pre.ty-markdown__pre')!
    expect(pre.querySelector('code')!.textContent).toBe('a\n\n# b')
    expect(host.querySelector('h3, p')).toBeNull()
  })

  it('creates no link for a non-http(s) URL — the source stays literal text', () => {
    for (const source of ['[x](javascript:alert(1))', '[x](data:text/html;base64,PGI+)', '[x](/relative/path)', '[x](file:///etc/passwd)']) {
      const host = view(source)
      expect(host.querySelector('a')).toBeNull()
      expect(host.textContent).toBe(source)
      document.body.replaceChildren()
    }
  })

  it('shows angle brackets and entities as literal text, never as markup', async () => {
    const host = view('<b>hi</b> &amp; <img src=x onerror=alert(1)>')
    expect(host.querySelector('b, img')).toBeNull()
    expect(host.textContent).toBe('<b>hi</b> &amp; <img src=x onerror=alert(1)>')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('renders strong, emphasis and code spans and keeps the surrounding text', () => {
    const host = view('**bold** and *em* and a `code` span')
    expect(host.querySelector('strong')).toHaveTextContent('bold')
    expect(host.querySelector('em')).toHaveTextContent('em')
    expect(host.querySelector('code.ty-markdown__code-span')).toHaveTextContent('code')
    expect(host.querySelector('p')!.textContent).toBe('bold and em and a code span')
  })

  it('opens an https link in a new tab with no opener, no referrer and a hidden hint', async () => {
    view('See [the protocol](https://example.org/p).')
    const link = screen.getByRole('link', { name: /the protocol/ })
    expect(link).toHaveClass('ty-link')
    expect(link).toHaveAttribute('href', 'https://example.org/p')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('noreferrer')
    const hint = link.querySelector('.ty-visually-hidden.ty-link__hint')!
    expect(hint.textContent).toBe(' (opens in a new tab)')
    expect(link.querySelector('svg.ty-link__external')).toHaveAttribute('aria-hidden', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('renders nothing for empty text', () => {
    const host = view('')
    expect(host).toBeEmptyDOMElement()
  })

  it('normalises CRLF line endings', () => {
    const host = view('# Title\r\n\r\n- item')
    expect(screen.getByRole('heading', { level: 3, name: 'Title' })).toBeInTheDocument()
    expect(host.querySelectorAll('ul li')).toHaveLength(1)
  })

  it('reflects density on the prose root and marks bidi-safe blocks', () => {
    const host = view('نص مع **تأكيد**.\n\n- بند', { density: 'compact' })
    expect(host.querySelector('.ty-markdown')).toHaveAttribute('data-density', 'compact')
    for (const block of host.querySelectorAll('p, li')) expect(block).toHaveAttribute('dir', 'auto')
  })

  it('re-renders when the text property changes', () => {
    const host = view('# Before')
    expect(screen.getByRole('heading', { name: 'Before' })).toBeInTheDocument()
    host.text = '## After'
    expect(screen.queryByRole('heading', { name: 'Before' })).toBeNull()
    expect(screen.getByRole('heading', { level: 4, name: 'After' })).toBeInTheDocument()
    host.text = ''
    expect(host).toBeEmptyDOMElement()
  })

  it('upgrades from plain HTML markup', () => {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = '<ty-markdown-view text="# From markup" heading-base="4"></ty-markdown-view>'
    document.body.append(wrapper)
    expect(screen.getByRole('heading', { level: 4, name: 'From markup' })).toBeInTheDocument()
  })

  it('an overflowing code block is a focusable, labelled scroll region', () => {
    const scrollWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollWidth')
    const clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')
    Object.defineProperty(Element.prototype, 'scrollWidth', { configurable: true, get: () => 400 })
    Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 100 })
    try {
      const host = view('```sql\nselect 1\n```')
      const pre = host.querySelector('pre.ty-markdown__pre')!
      expect(pre).toHaveAttribute('tabindex', '0')
      expect(pre).toHaveAttribute('role', 'region')
      expect(pre).toHaveAttribute('aria-label', 'Code block, sql')
    } finally {
      if (scrollWidth) Object.defineProperty(Element.prototype, 'scrollWidth', scrollWidth)
      if (clientWidth) Object.defineProperty(Element.prototype, 'clientWidth', clientWidth)
    }
  })

  it('translates the code block label and the new-tab hint through attributes', () => {
    const scrollWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollWidth')
    const clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')
    Object.defineProperty(Element.prototype, 'scrollWidth', { configurable: true, get: () => 400 })
    Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 100 })
    try {
      const host = view('```sql\nselect 1\n```\n\n[doc](https://example.org)', {
        'code-block-language-label': 'Bloco de código, {language}',
        'new-tab-label': '(abre em nova aba)',
      })
      expect(host.querySelector('pre.ty-markdown__pre')).toHaveAttribute('aria-label', 'Bloco de código, sql')
      expect(host.querySelector('.ty-link__hint')!.textContent).toBe(' (abre em nova aba)')
    } finally {
      if (scrollWidth) Object.defineProperty(Element.prototype, 'scrollWidth', scrollWidth)
      if (clientWidth) Object.defineProperty(Element.prototype, 'clientWidth', clientWidth)
    }
  })

  it('is operated with the keyboard: the link is the only tab stop', async () => {
    view('Text with [a link](https://example.org) inside.')
    await userEvent.tab()
    expect(screen.getByRole('link', { name: /a link/ })).toHaveFocus()
    await userEvent.tab()
    expect(document.body).toHaveFocus()
  })

  it('has no axe violations on a full document', async () => {
    view('# Result\n\nThe **stage** rule `v2` counts [cases](https://example.org).\n\n- one\n- two\n\n```json\n{"a": 1}\n```', { 'heading-base': '2' })
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('keeps link underlines and code block borders in forced colours; wraps long words', () => {
    const css = cssOf('components/markdown-view/MarkdownView.css')
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/\.ty-markdown__pre[^}]*border-color:\s*CanvasText/)
    expect(forced).toMatch(/\.ty-markdown \.ty-link[^}]*underline/)
    expect(css).toMatch(/overflow-wrap:\s*anywhere/)
    expect(css).toMatch(/max-inline-size:\s*calc\(var\(--ty-measure-prose\)/)
  })
})
