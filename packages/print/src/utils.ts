import { useId } from 'react'

/** A `useId` value usable in SVG `id` and `url(#…)` references (letters, digits, dashes). */
export function useIdSeguro(prefixo = 'ty-print'): string {
  const raw = useId()
  return `${prefixo}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/** Number in Brazilian Portuguese (thousands with a dot, decimals with a comma); strings pass through. */
export function formatarNumero(v: number | string): string {
  return typeof v === 'number' ? fmt.format(v) : v
}

/** Joins class names, skipping empty values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Rounds to 3 decimals (stable SVG coordinates). */
export function r3(n: number): number {
  return Math.round(n * 1000) / 1000
}
