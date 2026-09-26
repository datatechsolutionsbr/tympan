// Locale-bound number and plural helpers for the shipped catalogues. Each
// catalogue formats its own numbers (digits, grouping) and picks plural forms
// with Intl.PluralRules instead of string concatenation.

export interface CountWords {
  one: string
  other: string
  /** Optional CLDR categories for languages that have them. */
  zero?: string
  two?: string
  few?: string
  many?: string
}

export function speaker(language: string) {
  const rules = new Intl.PluralRules(language)
  const numbers = new Intl.NumberFormat(language)
  return {
    /** Formats a number in the catalogue's language. */
    n: (value: number) => numbers.format(value),
    /** The word for `count`, by CLDR plural category. */
    word: (count: number, words: CountWords) => words[rules.select(count) as keyof CountWords] ?? words.other,
  }
}
