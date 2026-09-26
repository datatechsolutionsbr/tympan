// Classing of a choropleth: given breaks, or quantiles of the values.
// Pure functions; the same values always give the same classes.
import { formatarNumero } from '../util.ts'

/**
 * Breaks at quantiles: `n` classes → `n − 1` ascending breaks. A value
 * belongs to class k when it is ≥ break k−1 and < break k (the last class
 * is open). Repeated breaks are kept, so the class count never changes.
 */
export function quantis(valores: number[], n: number): number[] {
  const v = valores.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (!v.length || n < 2) return []
  const out: number[] = []
  for (let i = 1; i < n; i++) {
    // Type 7 (linear interpolation between order statistics).
    const h = (v.length - 1) * (i / n)
    const lo = Math.floor(h)
    const a = v[lo] as number
    const b = v[Math.min(lo + 1, v.length - 1)] as number
    out.push(a + (h - lo) * (b - a))
  }
  return out
}

/** Class of a value against ascending breaks (0 … breaks.length). */
export function classeDe(valor: number, limites: number[]): number {
  let k = 0
  while (k < limites.length && valor >= (limites[k] as number)) k++
  return k
}

/** Legend labels for breaks: "menos de a", "a a menos de b", …, "b ou mais". */
export function rotulosLimites(limites: number[], unidade = ''): string[] {
  const u = unidade ? ` ${unidade}` : ''
  const f = (x: number) => formatarNumero(Math.round(x * 100) / 100)
  if (!limites.length) return ['todos']
  const out = [`menos de ${f(limites[0] as number)}${u}`]
  for (let i = 1; i < limites.length; i++) out.push(`${f(limites[i - 1] as number)} a menos de ${f(limites[i] as number)}${u}`)
  out.push(`${f(limites[limites.length - 1] as number)}${u} ou mais`)
  return out
}
