// A small Markdown reader for the subset of MarkdownView. It produces a plain
// data tree; nothing here builds HTML strings, so raw markup in the source can
// only ever reach the page as text.

export type Inline =
  | { kind: 'text'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'em'; children: Inline[] }
  | { kind: 'link'; href: string; children: Inline[] }

export type Block =
  | { kind: 'paragraph'; content: Inline[] }
  | { kind: 'heading'; depth: 1 | 2 | 3 | 4; content: Inline[] }
  | { kind: 'list'; ordered: boolean; items: Inline[][] }
  | { kind: 'code'; language?: string; value: string }

const FENCE = /^\s*```\s*([\w+#.-]*)\s*$/
const HEADING = /^(#{1,4})\s+(.+?)\s*#*\s*$/
const BULLET = /^\s*[-*]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/

/** Only absolute http and https addresses become links. */
export function isSafeHref(raw: string): boolean {
  try {
    const url = new URL(raw)
    return (url.protocol === 'http:' || url.protocol === 'https:') && /^https?:\/\//i.test(raw.trim())
  } catch {
    return false
  }
}

/** Inline scanner: code spans first (their content is literal), then emphasis and links. */
export function readInline(source: string): Inline[] {
  const out: Inline[] = []
  let text = ''
  const flush = () => {
    if (text) out.push({ kind: 'text', value: text })
    text = ''
  }
  let i = 0
  while (i < source.length) {
    const rest = source.slice(i)
    const ch = source[i]!

    if (ch === '`') {
      const end = source.indexOf('`', i + 1)
      if (end > i) {
        flush()
        out.push({ kind: 'code', value: source.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }

    if (rest.startsWith('**')) {
      const end = source.indexOf('**', i + 2)
      if (end > i + 2) {
        flush()
        out.push({ kind: 'strong', children: readInline(source.slice(i + 2, end)) })
        i = end + 2
        continue
      }
    }

    if ((ch === '*' || ch === '_') && source[i + 1] !== ch && source[i + 1] !== ' ') {
      const end = source.indexOf(ch, i + 1)
      if (end > i + 1 && source[end - 1] !== ' ') {
        flush()
        out.push({ kind: 'em', children: readInline(source.slice(i + 1, end)) })
        i = end + 1
        continue
      }
    }

    if (ch === '[') {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest)
      if (link) {
        flush()
        const [whole, label = '', href = ''] = link
        if (isSafeHref(href)) out.push({ kind: 'link', href, children: readInline(label) })
        else out.push({ kind: 'text', value: whole })
        i += whole.length
        continue
      }
    }

    text += ch
    i += 1
  }
  flush()
  return out
}

/** Splits the source into blocks. An unclosed fence takes the rest of the input as code. */
export function readBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const closeParagraph = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', content: readInline(paragraph.join(' ')) })
    paragraph = []
  }
  const closeList = () => {
    if (list) blocks.push({ kind: 'list', ordered: list.ordered, items: list.items.map(readInline) })
    list = null
  }
  const closeAll = () => {
    closeParagraph()
    closeList()
  }

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n]!
    const fence = FENCE.exec(line)
    if (fence) {
      closeAll()
      const body: string[] = []
      n += 1
      while (n < lines.length && !FENCE.test(lines[n]!)) body.push(lines[n++]!)
      blocks.push({ kind: 'code', language: fence[1] || undefined, value: body.join('\n') })
      continue
    }
    if (!line.trim()) {
      closeAll()
      continue
    }
    const heading = HEADING.exec(line)
    if (heading) {
      closeAll()
      blocks.push({ kind: 'heading', depth: heading[1]!.length as 1 | 2 | 3 | 4, content: readInline(heading[2]!) })
      continue
    }
    const bullet = BULLET.exec(line)
    const numbered = bullet ? null : NUMBERED.exec(line)
    const item = bullet ?? numbered
    if (item) {
      closeParagraph()
      const ordered = !!numbered
      if (list && list.ordered !== ordered) closeList()
      list ??= { ordered, items: [] }
      list.items.push(item[1]!)
      continue
    }
    closeList()
    paragraph.push(line.trim())
  }
  closeAll()
  return blocks
}
