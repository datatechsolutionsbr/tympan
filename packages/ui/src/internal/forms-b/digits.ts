// Digits of any script. People type with the digits of their keyboard
// (Arabic-Indic, Devanagari, full-width…); fields read them as values and
// show values with the digits of the active locale.

const isDigit = (ch: string) => /^\p{Nd}$/u.test(ch)

/** Numeric value (0–9) of one decimal digit of any script, or -1. */
export function digitValue(ch: string): number {
  if (!isDigit(ch)) return -1
  const cp = ch.codePointAt(0)!
  let zero = cp
  // Decimal digits come in contiguous runs starting at zero; walk back to the run's start.
  while (isDigit(String.fromCodePoint(zero - 1))) zero -= 1
  return (cp - zero) % 10
}

/** Replaces every decimal digit, whatever its script, by its ASCII digit. */
export function asciiDigits(text: string): string {
  return text.replace(/\p{Nd}/gu, (ch) => String(digitValue(ch)))
}

/** The locale's ten digits, in order ("0123456789", "٠١٢٣٤٥٦٧٨٩", …). */
export function localeDigits(locale: string): string[] {
  const nf = new Intl.NumberFormat(locale, { useGrouping: false })
  return Array.from({ length: 10 }, (_, d) => nf.format(d))
}

/** Rewrites ASCII digits with the locale's digits. */
export function withLocaleDigits(text: string, digits: string[]): string {
  return text.replace(/[0-9]/g, (d) => digits[Number(d)]!)
}

export { isDigit }
