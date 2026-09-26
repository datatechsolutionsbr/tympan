import { useMemo } from 'react'
import { useLocale } from 'react-aria-components'

/**
 * Locale-aware joining and numbers for accessible names built from parts
 * ("Verification, 12 pending" in English, with the Arabic comma in Arabic):
 * Intl.ListFormat unit lists instead of hard-coded separators.
 */
export function useLocaleText() {
  const { locale } = useLocale()
  return useMemo(() => {
    const list = new Intl.ListFormat(locale, { type: 'unit', style: 'short' })
    const tight = new Intl.ListFormat(locale, { type: 'unit', style: 'narrow' })
    const number = new Intl.NumberFormat(locale)
    return {
      locale,
      /** "a, b" in the locale's unit-list style. */
      join: (...parts: string[]) => list.format(parts.filter(Boolean)),
      /** "a b" (value and its unit or label) in the locale's narrow style. */
      pair: (...parts: string[]) => tight.format(parts.filter(Boolean)),
      number: (n: number) => number.format(n),
    }
  }, [locale])
}
