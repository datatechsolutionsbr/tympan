import { TyElement } from '../base.ts'
import { asciiDigits, isDigit, localeDigits, withLocaleDigits } from '../../internal/forms-b/digits.ts'
import { currencyFieldDefinition } from './definition.ts'

interface Separators {
  group: string
  decimal: string
}

const separatorsOf = (locale: string): Separators => {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5)
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  }
}

const symbolOf = (currency: string, locale: string): string => {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency
  } catch {
    return currency
  }
}

const currencyName = (currency: string, locale: string): string => {
  try {
    return new Intl.DisplayNames(locale, { type: 'currency' }).of(currency) ?? currency
  } catch {
    return currency
  }
}

/** Reading of typed text: integer digits, whether a decimal mark was typed, fraction digits. */
interface Reading {
  whole: string
  mark: boolean
  fraction: string
}

/** Keeps digits and the first locale decimal mark; drops extra fraction digits and leading zeros. */
const readTyped = (raw: string, decimal: string, decimals: number): Reading => {
  const out: Reading = { whole: '', mark: false, fraction: '' }
  for (const ch of asciiDigits(raw)) {
    if (ch >= '0' && ch <= '9') {
      if (!out.mark) out.whole += ch
      else if (out.fraction.length < decimals) out.fraction += ch
    } else if (ch === decimal && decimals > 0 && !out.mark) {
      out.mark = true
    }
  }
  out.whole = out.whole.replace(/^0+(?=\d)/, '')
  if (out.mark && !out.whole) out.whole = '0'
  return out
}

/** Canonical, machine-readable form of a reading ("1500000.5"). */
const canonicalOf = (r: Reading): string => (r.whole === '' && !r.mark ? '' : r.fraction ? `${r.whole}.${r.fraction}` : r.whole)

/** Parses a canonical value back into a reading. */
const readCanonical = (value: string, decimals: number): Reading => {
  const [whole = '', fraction = ''] = value.split('.')
  return { whole: whole.replace(/\D/g, ''), mark: value.includes('.') && decimals > 0, fraction: fraction.replace(/\D/g, '').slice(0, decimals) }
}

/** Groups the integer part with the locale separator and shows the locale's digits. */
const display = (r: Reading, sep: Separators, digits: string[]): string => {
  const grouped = r.whole.replace(/\B(?=(\d{3})+(?!\d))/g, sep.group)
  return withLocaleDigits(r.mark ? `${grouped}${sep.decimal}${r.fraction}` : grouped, digits)
}

/** Count of meaningful characters (digits and the decimal mark) before `pos`. */
const meaningfulBefore = (text: string, pos: number, decimal: string): number => {
  let n = 0
  for (const ch of text.slice(0, pos)) if (isDigit(ch) || ch === decimal) n++
  return n
}

/** Position in `text` just after the `count`-th meaningful character. */
const positionAfter = (text: string, count: number, decimal: string): number => {
  if (count <= 0) return 0
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (isDigit(ch) || ch === decimal) seen++
    if (seen === count) return i + 1
  }
  return text.length
}

/**
 * `<ty-currency-field>`. A native `<input>` inside, so typing, keyboard,
 * autofill and form participation are the platform's. The element parses the
 * typed text (digits and the first locale decimal mark; extra fraction
 * digits and leading zeros dropped), regroups the display on every edit
 * with the caret after the same digit, and reports the canonical value
 * ("1500000.5", "" when empty) as `ty-value-change`. The `value` attribute
 * is canonical too: it is mirrored in as grouped display text (a no-op
 * while the user types, so a trailing decimal mark and the caret survive
 * the controlled echo), and `default-value` seeds an uncontrolled field
 * (the value a form reset returns to). Changing `locale` re-formats the
 * display only, never the canonical value. The currency symbol is visual
 * (`aria-hidden`); a visually hidden note names the currency through the
 * `currency-label` template, joined into the description. While an input
 * method composes text, edits are ignored and the field is reformatted once
 * at `compositionend`.
 */
export class TyCurrencyFieldElement extends TyElement {
  static override definition = currencyFieldDefinition

  #defaultApplied = false
  #draft: Reading | null = null
  #reported: string | null = null
  #reportedDecimals: number | null = null
  #composing = false
  #formatLocale: string | null = null
  #sep: Separators | null = null
  #digits: string[] | null = null

  get field(): HTMLInputElement | null {
    return this.querySelector('input')
  }

  /** The prop locale, else the document language, else the browser's; a bad tag falls back to en-US. */
  #locale(): string {
    const wanted = (this.props.locale as string | undefined) || document.documentElement.lang || (typeof navigator !== 'undefined' ? navigator.language : '') || 'en-US'
    try {
      new Intl.NumberFormat(wanted)
      return wanted
    } catch {
      return 'en-US'
    }
  }

  /** The separators and digits of the active locale, recomputed when it changes. */
  #format(): { sep: Separators; digits: string[] } {
    const locale = this.#locale()
    if (this.#formatLocale !== locale) {
      this.#formatLocale = locale
      this.#sep = separatorsOf(locale)
      this.#digits = localeDigits(locale)
    }
    return { sep: this.#sep!, digits: this.#digits! }
  }

  #decimals(): number {
    const raw = Number(this.props.decimals)
    return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 2
  }

  /** Canonical value in, as grouped display text, without disturbing the caret while typing. */
  #applyValue = () => {
    const field = this.field
    if (!field) return
    const { sep, digits } = this.#format()
    const decimals = this.#decimals()
    const value = this.getAttribute('value')
    if (value !== null) {
      // An echo of the last reported value keeps the draft: its trailing
      // decimal mark is display state the canonical value cannot carry.
      const keep = this.#draft !== null && value === this.#reported && decimals === this.#reportedDecimals
      const reading = keep ? this.#draft! : readCanonical(value, decimals)
      this.#draft = reading
      this.#reported = value
      this.#reportedDecimals = decimals
      const text = display(reading, sep, digits)
      if (field.value !== text) field.value = text
      return
    }
    if (this.#defaultApplied) return
    this.#defaultApplied = true
    const initial = this.getAttribute('default-value')
    if (initial === null) return
    const text = display(readCanonical(initial, decimals), sep, digits)
    field.defaultValue = text
    if (field.value === '') field.value = text
  }

  /** Parse, regroup, restore the caret and report the canonical value. */
  #reformat = () => {
    const field = this.field
    if (!field) return
    const { sep, digits } = this.#format()
    const decimals = this.#decimals()
    const raw = field.value
    const caret = field.selectionStart ?? raw.length
    let count = meaningfulBefore(raw, caret, sep.decimal)
    const reading = readTyped(raw, sep.decimal, decimals)
    // Leading zeros dropped before the caret shift it left.
    const typedWhole = raw.split(sep.decimal)[0]!.replace(/\D/g, '')
    const dropped = typedWhole.length - reading.whole.length
    if (dropped > 0) count = Math.max(0, count - dropped)
    const canonical = canonicalOf(reading)
    this.#draft = reading
    this.#reported = canonical
    this.#reportedDecimals = decimals
    const text = display(reading, sep, digits)
    if (field.value !== text) field.value = text
    const at = positionAfter(field.value, count, sep.decimal)
    if (field.selectionStart !== at || field.selectionEnd !== at) field.setSelectionRange(at, at)
    this.emit('ty-value-change', { value: canonical })
  }

  /** The currency symbol (visual) and the hidden note that names the currency. */
  #applyCurrency = () => {
    const currency = this.props.currency as string | undefined
    if (!currency) return
    const locale = this.#locale()
    const symbol = this.querySelector('.ty-currency-field__symbol')
    if (symbol) {
      const text = symbolOf(currency, locale)
      if (symbol.textContent !== text) symbol.textContent = text
    }
    const note = this.querySelector('.ty-currency-field__currency')
    if (note) {
      const text = String(this.props.currencyLabel).replaceAll('{currency}', currencyName(currency, locale))
      if (note.textContent !== text) note.textContent = text
    }
  }

  /** Numeric mobile keyboard for integers, decimal otherwise. */
  #applyInputMode = () => {
    const field = this.field
    if (!field) return
    const mode = this.#decimals() === 0 ? 'numeric' : 'decimal'
    if (field.getAttribute('inputmode') !== mode) field.setAttribute('inputmode', mode)
  }

  #onInput = (event: Event) => {
    if (event.target !== this.field || this.#composing) return
    this.#reformat()
  }

  #onCompositionStart = (event: Event) => {
    if (event.target === this.field) this.#composing = true
  }

  #onCompositionEnd = (event: Event) => {
    if (event.target !== this.field) return
    this.#composing = false
    this.#reformat()
  }

  protected override connected(): void {
    this.addEventListener('input', this.#onInput)
    this.addEventListener('compositionstart', this.#onCompositionStart)
    this.addEventListener('compositionend', this.#onCompositionEnd)
    this.#applyInputMode()
    this.#applyCurrency()
    this.#applyValue()
  }

  protected override disconnected(): void {
    this.removeEventListener('input', this.#onInput)
    this.removeEventListener('compositionstart', this.#onCompositionStart)
    this.removeEventListener('compositionend', this.#onCompositionEnd)
  }

  protected override changed(): void {
    if (!this.isConnected) return
    this.#applyInputMode()
    this.#applyCurrency()
    this.#applyValue()
  }
}
