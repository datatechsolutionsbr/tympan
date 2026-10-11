import { useId } from 'react'
import { useEscopoLivro } from './context.tsx'
import { numeroLocal } from './i18n.ts'

/** A `useId` value usable in SVG `id` and `url(#…)` references (letters, digits, dashes). */
export function useIdSeguro(prefixo = 'ty-print'): string {
  const raw = useId()
  const escopo = useEscopoLivro()
  return `${prefixo}-${escopo ? `${escopo}-` : ''}${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/** FNV-1a hash of a string in base 36 (stable scope names). */
export function hashCurto(chave: string): string {
  let h = 2166136261
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}


/** Number in the book's locale (pt-BR by default: thousands with a dot, decimals with a comma); strings pass through. */
export function formatarNumero(v: number | string): string {
  return typeof v === 'number' ? numeroLocal(v) : v
}

/** Joins class names, skipping empty values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Rounds to 3 decimals (stable SVG coordinates). */
export function r3(n: number): number {
  return Math.round(n * 1000) / 1000
}
