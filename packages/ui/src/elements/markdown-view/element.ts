import { TyElement } from '../base.ts'
import { markdownViewDefinition } from './definition.ts'
import { readBlocks, type Block, type Inline } from '../../components/markdown-view/parse.ts'

const SVG = 'http://www.w3.org/2000/svg'

function el(tag: string, className: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

/** The external-link glyph (lucide strokes, ISC, THIRD_PARTY_NOTICES), as `<ty-link>` renders it. */
function externalIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('class', 'ty-icon ty-mirror-rtl ty-link__external')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.setAttribute('width', '24')
  svg.setAttribute('height', '24')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  for (const d of ['M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6']) {
    const path = document.createElementNS(SVG, 'path')
    path.setAttribute('d', d)
    svg.append(path)
  }
  return svg
}

/** `headingBase` clamped to the spec range (2 to 6). */
function headingLevel(raw: unknown, depth: number): number {
  const n = Number(raw)
  const base = Number.isFinite(n) ? Math.min(6, Math.max(2, Math.floor(n))) : 3
  return Math.min(6, base + depth - 1)
}

/**
 * `<ty-markdown-view>`. Self-rendering: on connect and on every attribute
 * change the element parses `text` with the shared MarkdownView parser and
 * builds the whole subtree as elements and text nodes — never from an HTML
 * string, so source markup stays text. The output mirrors the React
 * MarkdownView node for node (`.ty-markdown` root with `data-density`,
 * real headings offset by `heading-base`, lists, sunken code blocks with
 * their language tag), and its links mirror an external `<ty-link>`
 * (`target="_blank"`, `rel="noopener noreferrer"`, the icon and the hidden
 * new-tab hint from `new-tab-label`). A code block becomes a focusable,
 * labelled scroll region only when it overflows.
 */
export class TyMarkdownViewElement extends TyElement {
  static override definition = markdownViewDefinition

  protected override connected(): void {
    this.#render()
  }

  protected override changed(): void {
    if (this.isConnected) this.#render()
  }

  #render(): void {
    const props = this.props
    const source = typeof props.text === 'string' ? props.text : ''
    const blocks = readBlocks(source)
    if (blocks.length === 0) {
      this.replaceChildren()
      return
    }
    const root = el('div', 'ty-markdown', { 'data-density': String(props.density) })
    for (const block of blocks) root.append(this.#block(block, props.headingBase))
    this.replaceChildren(root)
    this.#labelOverflowingCodeBlocks(root)
  }

  #block(block: Block, base: unknown): HTMLElement {
    if (block.kind === 'heading') {
      const heading = el(`h${headingLevel(base, block.depth)}`, 'ty-markdown__heading', {
        'data-depth': String(block.depth),
        dir: 'auto',
      })
      heading.append(...this.#inline(block.content))
      return heading
    }
    if (block.kind === 'list') {
      const list = el(block.ordered ? 'ol' : 'ul', 'ty-markdown__list')
      for (const item of block.items) {
        const li = document.createElement('li')
        li.setAttribute('dir', 'auto')
        li.append(...this.#inline(item))
        list.append(li)
      }
      return list
    }
    if (block.kind === 'code') return this.#codeBlock(block)
    const paragraph = el('p', 'ty-markdown__paragraph', { dir: 'auto' })
    paragraph.append(...this.#inline(block.content))
    return paragraph
  }

  /** Inline nodes as DOM: text stays text; only the parser's own elements are created. */
  #inline(nodes: Inline[]): Node[] {
    return nodes.map((node) => {
      switch (node.kind) {
        case 'text':
          return document.createTextNode(node.value)
        case 'code': {
          const code = el('code', 'ty-markdown__code-span')
          code.textContent = node.value
          return code
        }
        case 'strong': {
          const strong = document.createElement('strong')
          strong.append(...this.#inline(node.children))
          return strong
        }
        case 'em': {
          const em = document.createElement('em')
          em.append(...this.#inline(node.children))
          return em
        }
        case 'link':
          return this.#link(node)
      }
    })
  }

  /**
   * A safe link: the parser only produces absolute http(s) hrefs, and every
   * one opens in a new tab with no opener and no referrer, with the external
   * icon and the hidden hint — the external `<ty-link>` anatomy.
   */
  #link(node: { href: string; children: Inline[] }): HTMLElement {
    const link = el('a', 'ty-link', {
      href: node.href,
      target: '_blank',
      rel: 'noopener noreferrer',
      'data-emphasis': 'underlined',
    })
    link.append(...this.#inline(node.children))
    link.append(externalIcon())
    const hint = el('span', 'ty-visually-hidden ty-link__hint')
    hint.textContent = ` ${String(this.props.newTabLabel)}`
    link.append(hint)
    return link
  }

  /** A fenced code block: sunken surface, mono text, the language tag as meta. */
  #codeBlock(block: { language?: string; value: string }): HTMLElement {
    const wrap = el('div', 'ty-markdown__code-block')
    if (block.language) {
      const tag = el('span', 'ty-markdown__language', { 'aria-hidden': 'true' })
      tag.textContent = block.language
      wrap.append(tag)
    }
    const pre = el('pre', 'ty-markdown__pre', { dir: 'ltr' })
    if (block.language) pre.setAttribute('data-language', block.language)
    const code = document.createElement('code')
    code.textContent = block.value
    pre.append(code)
    wrap.append(pre)
    return wrap
  }

  /** A code block that scrolls is a focusable region with an accessible name; one that fits stays passive. */
  #labelOverflowingCodeBlocks(root: HTMLElement): void {
    const props = this.props
    for (const pre of root.querySelectorAll('pre.ty-markdown__pre')) {
      if (pre.scrollWidth <= pre.clientWidth) continue
      const language = pre.getAttribute('data-language')
      const label = language
        ? String(props.codeBlockLanguageLabel).replaceAll('{language}', language)
        : String(props.codeBlockLabel)
      pre.setAttribute('tabindex', '0')
      pre.setAttribute('role', 'region')
      pre.setAttribute('aria-label', label)
    }
  }
}
