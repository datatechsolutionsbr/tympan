// ICU MessageFormat bridge and pseudo-localization for the copy catalogue.
//
// Every key of `Messages` accepts an ICU string. Keys whose default is a
// function receive their arguments positionally as {0}, {1}, … so a host can
// write, for example:
//   pagination.range: '{0}–{1} de {2, number}'
//   rail.count: '{0, plural, one {# pendente} other {# pendentes}}'
import { formatMessage } from '../utilities/i18n-adapter/icu'
import type { MessageOverrides, Messages } from './messages'

export interface IcuCatalogue {
  [key: string]: string | IcuCatalogue
}

type Tree = Record<string, unknown>
const isTree = (v: unknown): v is Tree => !!v && typeof v === 'object' && !Array.isArray(v)

/** Compiles ICU strings (shaped like the catalogue) into catalogue overrides for `locale`. */
export function compileIcuMessages(icu: IcuCatalogue, base: Messages, locale: string): MessageOverrides {
  const walk = (source: IcuCatalogue, reference: unknown): Tree => {
    const out: Tree = {}
    for (const [key, value] of Object.entries(source)) {
      const ref = isTree(reference) ? reference[key] : undefined
      if (typeof value === 'string') {
        out[key] =
          typeof ref === 'function'
            ? (...args: unknown[]) => formatMessage(value, Object.fromEntries(args.map((a, i) => [String(i), a])), locale)
            : formatMessage(value, {}, locale)
      } else out[key] = walk(value, ref)
    }
    return out
  }
  return walk(icu, base) as MessageOverrides
}

const ACCENTED: Record<string, string> = {
  a: 'à', b: 'ƀ', c: 'ç', d: 'ď', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'î', j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ',
  n: 'ñ', o: 'ö', p: 'þ', q: 'ǫ', r: 'ŕ', s: 'š', t: 'ţ', u: 'û', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Å', B: 'Ɓ', C: 'Ç', D: 'Đ', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Î', J: 'Ĵ', K: 'Ķ', L: 'Ļ', M: 'Ṁ',
  N: 'Ñ', O: 'Ö', P: 'Þ', Q: 'Ǫ', R: 'Ŕ', S: 'Š', T: 'Ţ', U: 'Û', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž',
}

/** One pseudo-localized string: accented, about 40 % longer, bracketed so clipping shows. */
export function pseudoString(text: string): string {
  if (!text) return text
  const accented = [...text].map((ch) => ACCENTED[ch] ?? ch).join('')
  const letters = [...text].filter((ch) => /\p{L}/u.test(ch)).length
  return `⟦${accented}${'~'.repeat(Math.ceil(letters * 0.4))}⟧`
}

/** Pseudo-localizes a whole catalogue (strings and the output of message functions). */
export function pseudoLocalize(messages: Messages): Messages {
  const walk = (node: unknown): unknown => {
    if (typeof node === 'string') return pseudoString(node)
    if (typeof node === 'function') return (...args: unknown[]) => pseudoString(String((node as (...a: unknown[]) => unknown)(...args)))
    if (isTree(node)) return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v)]))
    return node
  }
  return walk(messages) as Messages
}
