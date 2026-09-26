import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Input, TextField as AriaTextField, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { FieldLine, joinIds } from '../../internal/forms-b/parts'
import { useMessages } from '../../internal/provider'

export type CurrencyFieldSize = 'small' | 'medium' | 'large' | 'display'

export interface CurrencyFieldProps {
  /** Canonical value: digits, optional dot and decimals, never grouped; "" when empty. */
  value: string
  onValueChange?: (value: string) => void
  label: string
  /** ISO 4217 code; omit for plain counts. */
  currency?: string
  decimals?: number
  locale?: string
  size?: CurrencyFieldSize
  hint?: ReactNode
  error?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  name?: string
  id?: string
  className?: string
}

interface Separators {
  group: string
  decimal: string
}

function separatorsOf(locale: string): Separators {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5)
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  }
}

function symbolOf(currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency
  } catch {
    return currency
  }
}

function currencyName(currency: string, locale: string): string {
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
function readTyped(raw: string, decimal: string, decimals: number): Reading {
  const out: Reading = { whole: '', mark: false, fraction: '' }
  for (const ch of raw) {
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
const canonicalOf = (r: Reading) => (r.whole === '' && !r.mark ? '' : r.fraction ? `${r.whole}.${r.fraction}` : r.whole)

/** Parses a canonical value back into a reading. */
function readCanonical(value: string, decimals: number): Reading {
  const [whole = '', fraction = ''] = value.split('.')
  return { whole: whole.replace(/\D/g, ''), mark: value.includes('.') && decimals > 0, fraction: fraction.replace(/\D/g, '').slice(0, decimals) }
}

/** Groups the integer part with the locale separator. */
function display(r: Reading, sep: Separators): string {
  const grouped = r.whole.replace(/\B(?=(\d{3})+(?!\d))/g, sep.group)
  return r.mark ? `${grouped}${sep.decimal}${r.fraction}` : grouped
}

/** Count of meaningful characters (digits and the decimal mark) before `pos`. */
function meaningfulBefore(text: string, pos: number, decimal: string): number {
  let n = 0
  for (const ch of text.slice(0, pos)) if ((ch >= '0' && ch <= '9') || ch === decimal) n++
  return n
}

/** Position in `text` just after the `count`-th meaningful character. */
function positionAfter(text: string, count: number, decimal: string): number {
  if (count <= 0) return 0
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if ((ch >= '0' && ch <= '9') || ch === decimal) seen++
    if (seen === count) return i + 1
  }
  return text.length
}

/**
 * Money or count entry with live grouping in the locale's separators; reports
 * a plain canonical number (spec: wave-2/currency-field.md).
 */
export function CurrencyField(props: CurrencyFieldProps) {
  const m = useMessages()
  const { locale: contextLocale } = useLocale()
  const locale = props.locale ?? contextLocale
  const decimals = Math.max(0, props.decimals ?? 2)
  const sep = useMemo(() => separatorsOf(locale), [locale])
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingCaret = useRef<number | null>(null)
  const lastReported = useRef<string | null>(null)
  const base = useId()

  // Local text keeps a trailing decimal mark the canonical value cannot carry.
  const [draft, setDraft] = useState<Reading>(() => readCanonical(props.value, decimals))
  const shown = props.value === lastReported.current ? draft : readCanonical(props.value, decimals)
  const text = display(shown, sep)

  useLayoutEffect(() => {
    const el = inputRef.current
    if (el && pendingCaret.current != null && document.activeElement === el) {
      const at = positionAfter(el.value, pendingCaret.current, sep.decimal)
      el.setSelectionRange(at, at)
    }
    pendingCaret.current = null
  })

  const onTyped = (raw: string) => {
    const el = inputRef.current
    const caret = el?.selectionStart ?? raw.length
    pendingCaret.current = meaningfulBefore(raw, caret, sep.decimal)
    const reading = readTyped(raw, sep.decimal, decimals)
    // Leading zeros dropped before the caret shift it left.
    const typedWhole = raw.split(sep.decimal)[0]!.replace(/\D/g, '')
    const dropped = typedWhole.length - reading.whole.length
    if (dropped > 0) pendingCaret.current = Math.max(0, pendingCaret.current - dropped)
    const canonical = canonicalOf(reading)
    setDraft(reading)
    lastReported.current = canonical
    props.onValueChange?.(canonical)
  }

  const ids = {
    label: `${base}-label`,
    hint: props.hint != null && !props.error ? `${base}-hint` : undefined,
    error: props.error ? `${base}-error` : undefined,
    currency: props.currency ? `${base}-currency` : undefined,
  }

  return (
    <div className={cx('fk-currency-field', props.className)} data-size={props.size ?? 'medium'} data-invalid={props.error ? true : undefined}>
      <AriaTextField
        value={text}
        onChange={onTyped}
        isDisabled={props.disabled}
        isReadOnly={props.readOnly}
        isRequired={props.required}
        isInvalid={!!props.error}
        name={props.name}
        id={props.id}
        aria-labelledby={ids.label}
        aria-describedby={joinIds(ids.hint, ids.currency, ids.error)}
        className="fk-currency-field__field"
      >
        <FieldLine kind="label" id={ids.label}>
          {props.label}
        </FieldLine>
        {ids.hint ? (
          <FieldLine kind="hint" id={ids.hint}>
            {props.hint}
          </FieldLine>
        ) : null}
        <div className="fk-currency-field__box">
          {props.currency ? (
            <span className="fk-currency-field__symbol" aria-hidden="true">
              {symbolOf(props.currency, locale)}
            </span>
          ) : null}
          <Input
            ref={inputRef}
            className="fk-currency-field__input"
            inputMode={decimals === 0 ? 'numeric' : 'decimal'}
            autoComplete="off"
            placeholder={props.placeholder}
          />
        </div>
        {ids.currency ? (
          <span id={ids.currency} className="fk-visually-hidden">
            {m.currencyField.currency(currencyName(props.currency!, locale))}
          </span>
        ) : null}
        {ids.error ? (
          <FieldLine kind="error" id={ids.error}>
            {props.error}
          </FieldLine>
        ) : null}
      </AriaTextField>
    </div>
  )
}
