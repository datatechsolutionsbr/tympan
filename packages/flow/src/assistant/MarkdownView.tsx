// MarkdownView: a small, safe reader for the Markdown a language model writes
// (paragraphs, headings, lists, fenced code, quotes, inline code, strong,
// emphasis, links). Output is React elements only: no HTML string is ever
// injected, and links are kept only for http(s), mailto and app-relative paths.

import { Fragment, type ReactNode } from 'react'

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'code'; lang: string; text: string }
  | { kind: 'quote'; text: string }

const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/))/i

/** Splits Markdown into blocks, line by line. */
export function markdownBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) blocks.push({ kind: 'paragraph', text: para.join(' ') })
    para = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const fence = /^\s*```(\w*)\s*$/.exec(line)
    if (fence) {
      flush()
      const body: string[] = []
      i++
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i]!)) body.push(lines[i++]!)
      blocks.push({ kind: 'code', lang: fence[1] ?? '', text: body.join('\n') })
      continue
    }
    if (!line.trim()) {
      flush()
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flush()
      blocks.push({ kind: 'heading', level: heading[1]!.length, text: heading[2]!.trim() })
      continue
    }
    const bullet = /^\s*(?:[-*+]|(\d+)[.)])\s+(.*)$/.exec(line)
    if (bullet) {
      flush()
      const ordered = bullet[1] !== undefined
      const prev = blocks[blocks.length - 1]
      if (prev && prev.kind === 'list' && prev.ordered === ordered) prev.items.push(bullet[2]!)
      else blocks.push({ kind: 'list', ordered, items: [bullet[2]!] })
      continue
    }
    const quote = /^\s*>\s?(.*)$/.exec(line)
    if (quote) {
      flush()
      const prev = blocks[blocks.length - 1]
      if (prev && prev.kind === 'quote') prev.text += ` ${quote[1]}`
      else blocks.push({ kind: 'quote', text: quote[1] ?? '' })
      continue
    }
    para.push(line.trim())
  }
  flush()
  return blocks
}

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))/

/** Inline spans: code, strong, emphasis and safe links. */
export function renderInline(text: string, keyPrefix = 'i'): ReactNode[] {
  const out: ReactNode[] = []
  let rest = text
  let n = 0
  while (rest) {
    const m = INLINE.exec(rest)
    if (!m) {
      out.push(rest)
      break
    }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    const token = m[0]
    const key = `${keyPrefix}-${n++}`
    if (m[1]) out.push(<code key={key}>{token.slice(1, -1)}</code>)
    else if (m[2]) out.push(<strong key={key}>{renderInline(token.slice(2, -2), key)}</strong>)
    else if (m[3]) out.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>)
    else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)!
      const href = link[2]!
      out.push(
        SAFE_HREF.test(href) ? (
          <a key={key} href={href} {...(/^https?:/i.test(href) ? { target: '_blank', rel: 'noreferrer noopener' } : {})}>
            {renderInline(link[1]!, key)}
          </a>
        ) : (
          <Fragment key={key}>{link[1]}</Fragment>
        ),
      )
    }
    rest = rest.slice(m.index + token.length)
  }
  return out
}

export interface MarkdownViewProps {
  source: string
  /** Level of a top-level "#" heading; deeper headings follow, capped at 6. */
  baseHeadingLevel?: 2 | 3 | 4
  className?: string
}

export function MarkdownView({ source, baseHeadingLevel = 3, className }: MarkdownViewProps) {
  const blocks = markdownBlocks(source)
  return (
    <div className={['fk-flow-markdown', className].filter(Boolean).join(' ')}>
      {blocks.map((b, i) => {
        const key = `b${i}`
        switch (b.kind) {
          case 'heading': {
            const level = Math.min(6, baseHeadingLevel + b.level - 1)
            const H = `h${level}` as 'h2'
            return (
              <H key={key} className="fk-flow-markdown__heading">
                {renderInline(b.text, key)}
              </H>
            )
          }
          case 'list': {
            const L = b.ordered ? 'ol' : 'ul'
            return (
              <L key={key} className="fk-flow-markdown__list">
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </L>
            )
          }
          case 'code':
            return (
              <pre key={key} className="fk-flow-markdown__code" tabIndex={0} data-lang={b.lang || undefined}>
                <code>{b.text}</code>
              </pre>
            )
          case 'quote':
            return (
              <blockquote key={key} className="fk-flow-markdown__quote">
                {renderInline(b.text, key)}
              </blockquote>
            )
          default:
            return (
              <p key={key} className="fk-flow-markdown__paragraph">
                {renderInline(b.text, key)}
              </p>
            )
        }
      })}
    </div>
  )
}
