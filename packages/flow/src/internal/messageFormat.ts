// A small ICU MessageFormat subset for label templates, so hosts can pass the
// same strings they keep in ICU catalogues:
//   {name}                                  argument
//   {count, number}                         Intl.NumberFormat
//   {count, plural, =0 {none} one {# item} other {# items}}
//   {kind, select, agent {agent} other {step}}
// `#` inside a plural branch is the formatted number. Apostrophe quoting is not
// supported (not needed by the library's own strings).

export type MessageValues = Record<string, string | number | boolean | null | undefined>

interface Cursor {
  s: string
  i: number
}

function readUntilBalanced(c: Cursor): string {
  // c.i is just after an opening brace; returns the content up to its match.
  let depth = 1
  const start = c.i
  while (c.i < c.s.length) {
    const ch = c.s[c.i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        const body = c.s.slice(start, c.i)
        c.i++
        return body
      }
    }
    c.i++
  }
  return c.s.slice(start)
}

function parseBranches(text: string): Map<string, string> {
  const branches = new Map<string, string>()
  const c: Cursor = { s: text, i: 0 }
  while (c.i < text.length) {
    while (c.i < text.length && /\s/.test(text[c.i]!)) c.i++
    let key = ''
    while (c.i < text.length && text[c.i] !== '{' && !/\s/.test(text[c.i]!)) key += text[c.i++]
    while (c.i < text.length && /\s/.test(text[c.i]!)) c.i++
    if (text[c.i] !== '{') break
    c.i++
    branches.set(key, readUntilBalanced(c))
  }
  return branches
}

function render(template: string, values: MessageValues, locale: string | undefined, hash: string | null): string {
  let out = ''
  const c: Cursor = { s: template, i: 0 }
  while (c.i < template.length) {
    const ch = template[c.i]!
    if (ch === '#' && hash !== null) {
      out += hash
      c.i++
      continue
    }
    if (ch !== '{') {
      out += ch
      c.i++
      continue
    }
    c.i++
    const body = readUntilBalanced(c)
    const firstComma = body.indexOf(',')
    const name = (firstComma < 0 ? body : body.slice(0, firstComma)).trim()
    const value = values[name]
    if (firstComma < 0) {
      out += value === undefined || value === null ? `{${name}}` : String(value)
      continue
    }
    const rest = body.slice(firstComma + 1)
    const secondComma = rest.indexOf(',')
    const type = (secondComma < 0 ? rest : rest.slice(0, secondComma)).trim()
    const arg = secondComma < 0 ? '' : rest.slice(secondComma + 1)
    if (type === 'number') {
      out += typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : String(value ?? '')
    } else if (type === 'plural') {
      const n = typeof value === 'number' ? value : Number(value)
      const branches = parseBranches(arg)
      const exact = branches.get(`=${n}`)
      const category = new Intl.PluralRules(locale).select(n)
      const chosen = exact ?? branches.get(category) ?? branches.get('other') ?? ''
      out += render(chosen, values, locale, new Intl.NumberFormat(locale).format(n))
    } else if (type === 'select') {
      const branches = parseBranches(arg)
      out += render(branches.get(String(value)) ?? branches.get('other') ?? '', values, locale, hash)
    } else {
      out += String(value ?? '')
    }
  }
  return out
}

/** Formats an ICU-subset template with values in `locale`. */
export function formatMessage(template: string, values: MessageValues = {}, locale?: string): string {
  return render(template, values, locale, null)
}
