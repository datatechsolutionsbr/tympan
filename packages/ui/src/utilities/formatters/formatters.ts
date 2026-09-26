// Formatters (spec: wave-2/formatters.md). Locale-aware money, percent, date
// and address formatting; missing or invalid input yields a placeholder word
// (never a dash, §2.13). Currency presentation always comes from Intl for the
// locale; nothing about symbols or separators is stored.
import { useMemo } from 'react'
import { useMessages } from '../../internal/provider'
import { useLocale } from '../i18n-adapter/I18nAdapter'

/** English default; hosts pass their own or use `useFormatters()` for the catalogue word. */
export const DEFAULT_PLACEHOLDER = 'not informed'

type Missing = null | undefined
const isMissingNumber = (v: number | Missing): v is Missing => v === null || v === undefined || !Number.isFinite(v)

export interface FormatOptions {
  placeholder?: string
}

export function formatMoney(value: number | Missing, currency: string, locale = 'en-US', options: FormatOptions = {}): string {
  if (isMissingNumber(value)) return options.placeholder ?? DEFAULT_PLACEHOLDER
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
  } catch {
    return options.placeholder ?? DEFAULT_PLACEHOLDER
  }
}

/** Input in percentage points: 12.5 means 12.5 %. */
export function formatPercent(
  value: number | Missing,
  locale = 'en-US',
  options: FormatOptions & { fractionDigits?: number; showSign?: boolean } = {},
): string {
  if (isMissingNumber(value)) return options.placeholder ?? DEFAULT_PLACEHOLDER
  const digits = options.fractionDigits ?? 2
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: options.showSign === false ? 'auto' : 'exceptZero',
  }).format(value / 100)
}

export type DateInput = string | Date | { value: string } | Missing

function toDate(input: DateInput): Date | null {
  if (input === null || input === undefined) return null
  const raw = input instanceof Date ? input : typeof input === 'object' ? input.value : input
  const date = raw instanceof Date ? raw : new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTime(input: DateInput, options: FormatOptions & { locale?: string; withTimeZone?: boolean; timeZone?: string } = {}): string {
  const date = toDate(input)
  if (!date) return options.placeholder ?? DEFAULT_PLACEHOLDER
  const parts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...(options.withTimeZone ? { timeZoneName: 'short' as const } : {}),
    ...(options.timeZone ? { timeZone: options.timeZone } : {}),
  }
  return new Intl.DateTimeFormat(options.locale ?? 'en-US', parts).format(date)
}

/* Country registry (records are specified in wave-4/country-profile-data.md). */

export interface CountryConfig {
  /** ISO 3166-1 alpha-2. */
  code: string
  names?: { en: string; local: string }
  locale: { default: string; dateStyle?: string }
  /** ISO 4217 code only; presentation derives from the locale. */
  currency: { code: string }
  /**
   * Address template: one entry per line, each either a string with `{field}`
   * placeholders and literal separators ("{street}, {number}") or an array of
   * field keys joined with ", ".
   */
  address?: { template: Array<string | string[]>; required?: string[]; postalCodePattern?: string }
  languages?: Array<{ tag: string; name: string; official: boolean }>
  tax?: { consumptionTaxName?: string; businessIdName?: string; personalIdName?: string }
  [extra: string]: unknown
}

const registry = new Map<string, CountryConfig>()

export function registerCountry(config: CountryConfig): void {
  if (!/^[A-Z]{2}$/.test(config.code ?? '')) throw new TypeError('registerCountry: "code" must be an ISO 3166-1 alpha-2 code.')
  if (!config.locale?.default) throw new TypeError(`registerCountry(${config.code}): "locale.default" is required.`)
  if (!/^[A-Z]{3}$/.test(config.currency?.code ?? '')) throw new TypeError(`registerCountry(${config.code}): "currency.code" must be ISO 4217.`)
  registry.set(config.code, config)
}

export function getCountry(code: string): CountryConfig | undefined {
  return registry.get(code.toUpperCase())
}

export function listCountries(): CountryConfig[] {
  return [...registry.values()]
}

/** Test helper: forget registered countries. */
export function resetCountries(): void {
  registry.clear()
}

type AddressFields = Record<string, string | null | undefined>

const filled = (v: string | null | undefined) => typeof v === 'string' && v.trim() !== ''

function renderLine(line: string | string[], fields: AddressFields): string {
  if (Array.isArray(line)) return line.map((k) => fields[k]).filter(filled).join(', ')
  // Split into literal/placeholder tokens, drop empty placeholders together
  // with the separator that would dangle next to them.
  const tokens = line.split(/(\{\w+\})/).filter((t) => t !== '')
  const values = tokens.map((t) => {
    const m = /^\{(\w+)\}$/.exec(t)
    return m ? { field: true, text: fields[m[1]!] ?? '' } : { field: false, text: t }
  })
  let out = ''
  let pendingSep = ''
  let seenValue = false
  let skipped = false
  for (const v of values) {
    if (!v.field) {
      // After an empty field, the separator already pending stands for both.
      if (!(skipped && pendingSep)) pendingSep += v.text
      continue
    }
    if (!filled(v.text)) {
      skipped = true
      continue
    }
    skipped = false
    out += (seenValue ? pendingSep : pendingSep.trimStart().replace(/^[,\-–/;·]+\s*/, '')) + v.text
    pendingSep = ''
    seenValue = true
  }
  return out.trim()
}

/** Fills the country's template; unknown countries join non-empty fields with commas. */
export function formatAddress(fields: AddressFields, countryCode: string, locale?: string): string {
  const template = getCountry(countryCode)?.address?.template
  // Unknown country: the filled parts in the given order, joined with the locale's list separator.
  if (!template) {
    const parts = Object.values(fields).filter(filled).map((v) => v!.trim())
    return locale ? new Intl.ListFormat(locale, { type: 'unit', style: 'short' }).format(parts) : parts.join(', ')
  }
  return template
    .map((line) => renderLine(line, fields))
    .filter((l) => l !== '')
    .join('\n')
}

export type StatusTone = 'positive' | 'pending' | 'negative' | 'neutral'

const TONE_WORDS: Record<Exclude<StatusTone, 'neutral'>, string[]> = {
  positive: ['approved', 'active', 'success', 'succeeded', 'completed', 'done', 'proved', 'published', 'verified', 'ok'],
  pending: ['pending', 'processing', 'running', 'queued', 'waiting', 'draft', 'in_review', 'review', 'scheduled'],
  negative: ['rejected', 'error', 'failed', 'failure', 'refuted', 'blocked', 'expired', 'invalid'],
}

/** Semantic tone for a status word; never a style class. */
export function toneForStatus(status: string | null | undefined): StatusTone {
  const s = (status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  for (const tone of ['positive', 'pending', 'negative'] as const) if (TONE_WORDS[tone].includes(s)) return tone
  return 'neutral'
}

/** Formatters bound to the adapter locale and the catalogue placeholder. */
export function useFormatters() {
  const locale = useLocale()
  const placeholder = useMessages().formatters.placeholder
  return useMemo(
    () => ({
      locale,
      placeholder,
      money: (value: number | Missing, currency: string) => formatMoney(value, currency, locale, { placeholder }),
      percent: (value: number | Missing, fractionDigits?: number) => formatPercent(value, locale, { placeholder, fractionDigits }),
      dateTime: (input: DateInput, withTimeZone?: boolean) => formatDateTime(input, { locale, withTimeZone, placeholder }),
      address: (fields: AddressFields, countryCode: string) => formatAddress(fields, countryCode, locale),
      toneForStatus,
    }),
    [locale, placeholder],
  )
}
