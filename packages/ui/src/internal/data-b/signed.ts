// Signed figures for change indicators: always a sign except for zero, and a
// true minus sign (U+2212) so a negative change never reads as a hyphen.

export type ChangeUnit = 'percent' | 'number'

const MINUS = '−'

const cache = new Map<string, Intl.NumberFormat>()

function formatterFor(locale: string, unit: ChangeUnit): Intl.NumberFormat {
  const key = `${locale}|${unit}`
  let nf = cache.get(key)
  if (!nf) {
    nf =
      unit === 'percent'
        ? new Intl.NumberFormat(locale, { style: 'percent', signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : new Intl.NumberFormat(locale, { signDisplay: 'exceptZero', maximumFractionDigits: 2 })
    cache.set(key, nf)
  }
  return nf
}

/** `12.34` percent points → "+12.3%"; `-3` number → "−3". */
export function signedFigure(value: number, unit: ChangeUnit, locale: string): string {
  const input = unit === 'percent' ? value / 100 : value
  return formatterFor(locale, unit).format(input).replace(/-/g, MINUS)
}

/** Direction of a change: 1 up, -1 down, 0 flat. */
export function directionOf(value: number): -1 | 0 | 1 {
  if (value > 0) return 1
  if (value < 0) return -1
  return 0
}
