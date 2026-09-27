// Locale-aware formatting helpers (Intl only; no hand-built English strings).

/** Under one second: whole milliseconds ("340 ms"); otherwise seconds with one decimal ("2.5 s"). */
export function formatDuration(ms: number, locale?: string): string {
  if (!Number.isFinite(ms) || ms < 0) return ''
  if (ms < 1000) {
    return new Intl.NumberFormat(locale, { style: 'unit', unit: 'millisecond', unitDisplay: 'short', maximumFractionDigits: 0 }).format(Math.round(ms))
  }
  return new Intl.NumberFormat(locale, { style: 'unit', unit: 'second', unitDisplay: 'short', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ms / 1000)
}

const RELATIVE_STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
  ['year', Infinity],
]

/** "10 minutes ago" / "há 10 minutos", through Intl.RelativeTimeFormat. */
export function formatRelative(date: Date | string | number, locale?: string, now: Date = new Date()): string {
  const then = new Date(date)
  if (Number.isNaN(then.getTime())) return ''
  let value = (then.getTime() - now.getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit)
    value /= size
  }
  return rtf.format(Math.round(value), 'year')
}

export function formatDateTime(date: Date | string | number, locale?: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }): string {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(locale, options).format(d)
}

export function formatNumber(n: number, locale?: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(n)
}

/** Current document language, used as the default locale. */
export function documentLocale(): string | undefined {
  return typeof document !== 'undefined' ? document.documentElement.lang || undefined : undefined
}
