import type { ElementDefinition } from '../definition.ts'

/**
 * `<ty-markdown-view>`: the MarkdownView's single source (spec:
 * wave-2/markdown-view.md).
 *
 * Self-rendering: the whole subtree is data-driven — parsed from the `text`
 * Markdown source on upgrade and on every attribute change — so the
 * declarative anatomy cannot express it (no parsing, no repetition), and the
 * wrappers render an empty host. The element shares the parser with the
 * React MarkdownView (`components/markdown-view/parse.ts`): one grammar, one
 * data tree, and no HTML string anywhere — the tree is built with
 * `createElement` and text nodes only, so markup in the source can only ever
 * reach the page as text. Links exist solely for absolute http(s) URLs (any
 * other scheme renders as literal text), open in a new tab with
 * `rel="noopener noreferrer"`, and carry the external icon and the hidden
 * new-tab hint, as `<ty-link>` renders them. Examples stay empty: parity
 * rendering does not apply to a self-rendering element.
 */
export const markdownViewDefinition = {
  tag: 'ty-markdown-view',
  name: 'TyMarkdownView',
  kind: 'self-rendering',
  doc: 'Safely renders a small, product-relevant subset of Markdown written by people or produced by models, without ever interpreting raw HTML: paragraphs, lists, headings (real `h2`–`h6`, offset by `headingBase`), fenced code blocks, and inline code, strong, emphasis and http(s) links; everything else is literal text. Static — links are the only focusable content, plus a code block that overflows (a labelled scroll region).',
  props: {
    text: { type: 'string', attribute: 'text', doc: 'Markdown source (the supported subset; anything else renders as literal text). Empty renders nothing.' },
    headingBase: { type: 'number', default: 3, attribute: 'heading-base', doc: 'Level used for a Markdown level-1 heading (2 to 6); deeper levels follow, capped at 6.' },
    density: { type: 'enum', values: ['regular', 'compact'], default: 'regular', attribute: 'density', doc: 'Spacing between blocks.' },
    codeBlockLabel: { type: 'string', default: 'Code block', attribute: 'code-block-label', doc: 'Accessible name of a code block that overflows (a scroll region) when it has no language tag; translate through this attribute.' },
    codeBlockLanguageLabel: { type: 'string', default: 'Code block, {language}', attribute: 'code-block-language-label', doc: 'Accessible name of an overflowing code block with a language tag; `{language}` is replaced by the tag.' },
    newTabLabel: { type: 'string', default: '(opens in a new tab)', attribute: 'new-tab-label', doc: 'Screen-reader hint appended to every link (all links open in a new tab); translate through this attribute.' },
  },
  events: [],
  examples: [],
} as const satisfies ElementDefinition
