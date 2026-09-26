import { createElement, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Link } from '../link/Link'
import { readBlocks, type Block, type Inline } from './parse'

export interface MarkdownViewProps {
  text: string
  /** Level of a Markdown level-1 heading; deeper levels follow, capped at 6. */
  headingBase?: 2 | 3 | 4 | 5 | 6
  density?: 'regular' | 'compact'
  className?: string
}

function drawInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.kind) {
      case 'text':
        return node.value
      case 'code':
        return (
          <code key={i} className="fk-markdown__code-span">
            {node.value}
          </code>
        )
      case 'strong':
        return <strong key={i}>{drawInline(node.children)}</strong>
      case 'em':
        return <em key={i}>{drawInline(node.children)}</em>
      case 'link':
        return (
          <Link key={i} href={node.href} external>
            {drawInline(node.children)}
          </Link>
        )
    }
  })
}

/** Code block: a scroll region that becomes focusable (and labelled) only when it overflows. */
function CodeBlock({ language, value }: { language?: string; value: string }) {
  const label = useMessages().markdown.codeBlock(language)
  const preRef = useRef<HTMLPreElement>(null)
  const [overflows, setOverflows] = useState(false)
  useLayoutEffect(() => {
    const pre = preRef.current
    if (pre) setOverflows(pre.scrollWidth > pre.clientWidth)
  }, [value])
  return (
    <div className="fk-markdown__code-block">
      {language ? (
        <span className="fk-markdown__language" aria-hidden="true">
          {language}
        </span>
      ) : null}
      <pre ref={preRef} dir="ltr" className="fk-markdown__pre" data-language={language} {...(overflows ? { tabIndex: 0, role: 'region', 'aria-label': label } : {})}>
        <code>{value}</code>
      </pre>
    </div>
  )
}

function drawBlock(block: Block, key: number, base: number): ReactNode {
  if (block.kind === 'heading') {
    const level = Math.min(6, base + block.depth - 1)
    return createElement(`h${level}`, { key, className: 'fk-markdown__heading', 'data-depth': block.depth, dir: 'auto' }, drawInline(block.content))
  }
  if (block.kind === 'list') {
    return createElement(
      block.ordered ? 'ol' : 'ul',
      { key, className: 'fk-markdown__list' },
      block.items.map((item, i) => (
        <li key={i} dir="auto">
          {drawInline(item)}
        </li>
      )),
    )
  }
  if (block.kind === 'code') return <CodeBlock key={key} language={block.language} value={block.value} />
  return (
    <p key={key} className="fk-markdown__paragraph" dir="auto">
      {drawInline(block.content)}
    </p>
  )
}

/** Safe renderer for a small Markdown subset (spec: wave-2/markdown-view.md). */
export function MarkdownView({ text, headingBase = 3, density = 'regular', className }: MarkdownViewProps) {
  const blocks = useMemo(() => readBlocks(text), [text])
  if (blocks.length === 0) return null
  return (
    <div className={cx('fk-markdown', className)} data-density={density}>
      {blocks.map((block, i) => drawBlock(block, i, headingBase))}
    </div>
  )
}
