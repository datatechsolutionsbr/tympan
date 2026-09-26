// A small ICU MessageFormat subset, written for this library: plain
// arguments, number and date arguments, plural (with `=n` exact cases and
// `#`) and select. Anything it cannot parse makes `formatMessage` fall back
// to simple `{name}` substitution; it never throws.

export type MessageParams = Record<string, unknown>

type Part =
  | { k: 'text'; v: string }
  | { k: 'hash' }
  | { k: 'arg'; name: string; fmt?: 'number' | 'date' | 'time'; style?: string }
  | { k: 'choice'; name: string; mode: 'plural' | 'select' | 'selectordinal'; cases: Map<string, Part[]> }

class Cursor {
  i = 0
  constructor(readonly src: string) {}
  get done() {
    return this.i >= this.src.length
  }
  peek() {
    return this.src[this.i]
  }
  skipSpace() {
    while (!this.done && /\s/.test(this.src[this.i]!)) this.i++
  }
  word(): string {
    this.skipSpace()
    const start = this.i
    while (!this.done && !/[\s,{}]/.test(this.src[this.i]!)) this.i++
    if (start === this.i) throw new SyntaxError(`identifier expected at ${start}`)
    return this.src.slice(start, this.i)
  }
  expect(ch: string) {
    this.skipSpace()
    if (this.src[this.i] !== ch) throw new SyntaxError(`"${ch}" expected at ${this.i}`)
    this.i++
  }
}

function parseSequence(c: Cursor, inChoice: boolean): Part[] {
  const out: Part[] = []
  let text = ''
  const flush = () => {
    if (text) out.push({ k: 'text', v: text })
    text = ''
  }
  while (!c.done) {
    const ch = c.peek()!
    if (ch === '}') {
      if (!inChoice) throw new SyntaxError(`unbalanced "}" at ${c.i}`)
      break
    }
    if (ch === '{') {
      flush()
      out.push(parseArgument(c))
      continue
    }
    if (ch === '#' && inChoice) {
      flush()
      out.push({ k: 'hash' })
      c.i++
      continue
    }
    if (ch === "'") {
      // '' is a literal quote; '{…}' quotes syntax characters.
      const next = c.src[c.i + 1]
      if (next === "'") {
        text += "'"
        c.i += 2
        continue
      }
      if (next === '{' || next === '}' || next === '#') {
        const end = c.src.indexOf("'", c.i + 1)
        if (end > 0) {
          text += c.src.slice(c.i + 1, end)
          c.i = end + 1
          continue
        }
      }
    }
    text += ch
    c.i++
  }
  flush()
  return out
}

function parseArgument(c: Cursor): Part {
  c.expect('{')
  const name = c.word()
  c.skipSpace()
  if (c.peek() === '}') {
    c.i++
    return { k: 'arg', name }
  }
  c.expect(',')
  const kind = c.word()
  c.skipSpace()
  if (kind === 'number' || kind === 'date' || kind === 'time') {
    let style: string | undefined
    if (c.peek() === ',') {
      c.i++
      style = c.word()
    }
    c.expect('}')
    return { k: 'arg', name, fmt: kind, style }
  }
  if (kind !== 'plural' && kind !== 'select' && kind !== 'selectordinal') throw new SyntaxError(`unknown argument type "${kind}"`)
  c.expect(',')
  const cases = new Map<string, Part[]>()
  for (;;) {
    c.skipSpace()
    if (c.peek() === '}') {
      c.i++
      break
    }
    if (c.done) throw new SyntaxError('unterminated choice')
    const key = c.word()
    if (key.startsWith('offset:')) continue
    c.expect('{')
    cases.set(key, parseSequence(c, true))
    c.expect('}')
  }
  if (!cases.has('other')) throw new SyntaxError(`"${name}" needs an "other" case`)
  return { k: 'choice', name, mode: kind, cases }
}

const cache = new Map<string, Part[]>()

export function parseMessage(message: string): Part[] {
  let ast = cache.get(message)
  if (!ast) {
    const c = new Cursor(message)
    ast = parseSequence(c, false)
    if (!c.done) throw new SyntaxError(`unexpected "${c.peek()}" at ${c.i}`)
    cache.set(message, ast)
  }
  return ast
}

function asDate(value: unknown): Date | null {
  const d = value instanceof Date ? value : typeof value === 'string' || typeof value === 'number' ? new Date(value) : null
  return d && !Number.isNaN(d.getTime()) ? d : null
}

function render(parts: Part[], params: MessageParams, locale: string, hashValue: number | null): string {
  let out = ''
  for (const p of parts) {
    switch (p.k) {
      case 'text':
        out += p.v
        break
      case 'hash':
        out += hashValue === null ? '#' : new Intl.NumberFormat(locale).format(hashValue)
        break
      case 'arg': {
        const v = params[p.name]
        if (v === undefined) {
          out += `{${p.name}}`
        } else if (p.fmt === 'number' && typeof v === 'number') {
          const opts: Intl.NumberFormatOptions = p.style === 'percent' ? { style: 'percent' } : p.style === 'integer' ? { maximumFractionDigits: 0 } : {}
          out += new Intl.NumberFormat(locale, opts).format(v)
        } else if ((p.fmt === 'date' || p.fmt === 'time') && asDate(v)) {
          const style = (['short', 'medium', 'long', 'full'].includes(p.style ?? '') ? p.style : 'medium') as 'short' | 'medium' | 'long' | 'full'
          const opts: Intl.DateTimeFormatOptions = p.fmt === 'date' ? { dateStyle: style } : { timeStyle: style }
          out += new Intl.DateTimeFormat(locale, opts).format(asDate(v)!)
        } else {
          out += String(v)
        }
        break
      }
      case 'choice': {
        const v = params[p.name]
        let branch: Part[] | undefined
        let hash: number | null = hashValue
        if (p.mode === 'select') {
          branch = p.cases.get(String(v))
        } else {
          const n = Number(v)
          hash = n
          branch = p.cases.get(`=${n}`)
          if (!branch && Number.isFinite(n)) {
            const rules = new Intl.PluralRules(locale, { type: p.mode === 'selectordinal' ? 'ordinal' : 'cardinal' })
            branch = p.cases.get(rules.select(n))
          }
        }
        out += render(branch ?? p.cases.get('other')!, params, locale, hash)
        break
      }
    }
  }
  return out
}

/** Plain `{name}` substitution, the fallback for unparsable messages. */
export function substitute(message: string, params: MessageParams = {}): string {
  return message.replace(/\{\s*([\w.-]+)\s*\}/g, (whole, key: string) => (params[key] === undefined ? whole : String(params[key])))
}

/** Formats an ICU message; never throws. */
export function formatMessage(message: string, params: MessageParams = {}, locale = 'en'): string {
  try {
    return render(parseMessage(message), params, locale, null)
  } catch {
    return substitute(message, params)
  }
}
