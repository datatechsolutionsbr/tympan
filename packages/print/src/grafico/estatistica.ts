// Statistics and scales for the correlation charts (dispersão, Simpson,
// matriz, antes-depois-controle). Pure functions, no randomness: the same
// points always give the same coefficient, line, bins and ticks.

const r3 = (n: number) => {
  const v = Math.round(n * 1000) / 1000
  return Object.is(v, -0) ? 0 : v
}

export function media(v: readonly number[]): number {
  let s = 0
  for (const a of v) s += a
  return v.length ? s / v.length : NaN
}

/** Pearson's r; `null` with fewer than 3 points or no variance. */
export function pearson(x: readonly number[], y: readonly number[]): number | null {
  const n = Math.min(x.length, y.length)
  if (n < 3) return null
  const mx = media(x.slice(0, n))
  const my = media(y.slice(0, n))
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - mx
    const dy = y[i]! - my
    sxy += dx * dy
    sxx += dx * dx
    syy += dy * dy
  }
  if (sxx === 0 || syy === 0) return null
  return sxy / Math.sqrt(sxx * syy)
}

/** Mid-ranks (ties share the average rank), 1-based. */
export function postos(v: readonly number[]): number[] {
  const ordem = v.map((_, i) => i).sort((a, b) => v[a]! - v[b]! || a - b)
  const r = new Array<number>(v.length)
  let i = 0
  while (i < ordem.length) {
    let j = i
    while (j + 1 < ordem.length && v[ordem[j + 1]!] === v[ordem[i]!]) j++
    for (let k = i; k <= j; k++) r[ordem[k]!] = (i + j) / 2 + 1
    i = j + 1
  }
  return r
}

/** Spearman's ρ = Pearson on mid-ranks. */
export function spearman(x: readonly number[], y: readonly number[]): number | null {
  return pearson(postos(x), postos(y))
}

/** Least squares y = a + b·x. */
export function minimosQuadrados(x: readonly number[], y: readonly number[]): { a: number; b: number } | null {
  if (x.length < 2) return null
  const mx = media(x)
  const my = media(y)
  let sxy = 0
  let sxx = 0
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i]! - mx) * (y[i]! - my)
    sxx += (x[i]! - mx) ** 2
  }
  if (sxx === 0) return null
  const b = sxy / sxx
  return { a: my - b * mx, b }
}

/** Values minus their group mean (fixed effects by group). */
export function centrarPorGrupo(v: readonly number[], g: readonly string[]): number[] {
  const soma = new Map<string, number>()
  const cont = new Map<string, number>()
  v.forEach((a, i) => {
    soma.set(g[i]!, (soma.get(g[i]!) ?? 0) + a)
    cont.set(g[i]!, (cont.get(g[i]!) ?? 0) + 1)
  })
  return v.map((a, i) => a - soma.get(g[i]!)! / cont.get(g[i]!)!)
}

/** Pooled within-group correlation: Pearson of the group-centred values. */
export function correlacaoDentro(x: readonly number[], y: readonly number[], g: readonly string[]): number | null {
  return pearson(centrarPorGrupo(x, g), centrarPorGrupo(y, g))
}

export function quantil(ordenado: readonly number[], q: number): number {
  if (!ordenado.length) return NaN
  const p = (ordenado.length - 1) * q
  const i = Math.floor(p)
  const f = p - i
  return i + 1 < ordenado.length ? ordenado[i]! * (1 - f) + ordenado[i + 1]! * f : ordenado[i]!
}

// ---------------------------------------------------------------------------
// Scales (mm)
// ---------------------------------------------------------------------------

export interface EscalaEixo {
  (v: number): number
  log: boolean
  dominio: [number, number]
  faixa: [number, number]
  /** Value in the space where the line and the coefficient are computed (ln for log axes). */
  t: (v: number) => number
  /** Position (mm) of a value already in that space. */
  deT: (tv: number) => number
  /** Domain bounds in that space. */
  t0: number
  t1: number
}

export function escalaEixo(dominio: [number, number], faixa: [number, number], log = false): EscalaEixo {
  const t = log ? (v: number) => Math.log(v) : (v: number) => v
  const d0 = t(dominio[0])
  const d1 = t(dominio[1])
  const k = d1 === d0 ? 0 : (faixa[1] - faixa[0]) / (d1 - d0)
  const f = ((v: number) => r3(faixa[0] + (t(v) - d0) * k)) as EscalaEixo
  f.log = log
  f.dominio = dominio
  f.faixa = faixa
  f.t = t
  f.deT = (tv: number) => r3(faixa[0] + (tv - d0) * k)
  f.t0 = d0
  f.t1 = d1
  return f
}

/** Domain padded to nice bounds around the data (linear) or to powers of ten (log). */
export function dominioAuto(valores: readonly number[], log = false): [number, number] {
  const v = log ? valores.filter((a) => a > 0) : [...valores]
  if (!v.length) return log ? [1, 10] : [0, 1]
  let lo = Infinity
  let hi = -Infinity
  for (const a of v) {
    if (a < lo) lo = a
    if (a > hi) hi = a
  }
  if (log) return [10 ** Math.floor(Math.log10(lo) + 1e-9), 10 ** Math.ceil(Math.log10(hi) - 1e-9)]
  if (lo === hi) return [lo - 1, hi + 1]
  const passo = passoBonito((hi - lo) / 5)
  return [r3(Math.floor(lo / passo + 1e-9) * passo), r3(Math.ceil(hi / passo - 1e-9) * passo)]
}

function passoBonito(raw: number): number {
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  return (norm < 1.5 ? 1 : norm < 2.25 ? 2 : norm < 3.5 ? 2.5 : norm < 7.5 ? 5 : 10) * mag
}

/** Ticks for a log axis: 1-2-5 per decade when there are few decades, powers of ten otherwise. */
export function marcasLog([d0, d1]: [number, number]): number[] {
  const e0 = Math.floor(Math.log10(d0) + 1e-9)
  const e1 = Math.ceil(Math.log10(d1) - 1e-9)
  const mult = e1 - e0 <= 2 ? [1, 2, 5] : e1 - e0 <= 4 ? [1, 3] : [1]
  const out: number[] = []
  for (let e = e0; e <= e1; e++)
    for (const m of mult) {
      const v = m * 10 ** e
      if (v >= d0 * (1 - 1e-9) && v <= d1 * (1 + 1e-9)) out.push(Number(v.toPrecision(12)))
    }
  return out
}

// ---------------------------------------------------------------------------
// Number formats (pt-BR)
// ---------------------------------------------------------------------------

const MENOS = '−'

/** A coefficient with explicit sign and 3 decimals: "+0,056", "−0,278". */
export function fmtCoef(v: number, casas = 3): string {
  const a = Math.abs(v).toFixed(casas).replace('.', ',')
  const zero = Number(Math.abs(v).toFixed(casas)) === 0
  return `${zero ? '' : v < 0 ? MENOS : '+'}${a}`
}

/** Short axis numbers: 1.500 · 12 mil · 3,5 mi · 2 bi. */
export function fmtCompacto(v: number): string {
  const s = v < 0 ? MENOS : ''
  const a = Math.abs(v)
  // One decimal whenever the value has one (12.500 → "12,5 mil"): a tick label never rounds its own value.
  const f = (n: number, suf: string) => `${s}${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n)}${suf}`
  if (a >= 1e9) return f(a / 1e9, ' bi')
  if (a >= 1e6) return f(a / 1e6, ' mi')
  if (a >= 1e4) return f(a / 1e3, ' mil')
  return `${s}${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: a < 1 ? 3 : a < 10 ? 2 : a < 100 ? 1 : 0 }).format(a)}`
}

// ---------------------------------------------------------------------------
// Hexagonal binning (pointy-top hexagons of circumradius `raio`, in mm)
// ---------------------------------------------------------------------------

export interface Hexagono {
  cx: number
  cy: number
  n: number
  /** Indices of the points inside, in input order. */
  indices: number[]
}

/**
 * Assigns each point to the nearest centre of a fixed hexagonal lattice anchored at (0,0) (exact Euclidean
 * nearest; ties go to the first candidate, so the result is deterministic).
 */
export function hexbin(pontos: ReadonlyArray<{ x: number; y: number }>, raio: number): Hexagono[] {
  const dx = raio * Math.sqrt(3)
  const dy = raio * 1.5
  const mapa = new Map<string, Hexagono>()
  pontos.forEach((p, i) => {
    const j0 = Math.floor(p.y / dy)
    let melhor: [number, number] = [0, 0]
    let dMin = Infinity
    for (let pj = j0 - 1; pj <= j0 + 2; pj++) {
      const off = (pj & 1) / 2
      const base = Math.round(p.x / dx - off)
      for (let pi = base - 1; pi <= base + 1; pi++) {
        const d = (p.x - (pi + off) * dx) ** 2 + (p.y - pj * dy) ** 2
        if (d < dMin - 1e-12) {
          dMin = d
          melhor = [pi, pj]
        }
      }
    }
    const [pi, pj] = melhor
    const chave = `${pi},${pj}`
    let h = mapa.get(chave)
    if (!h) {
      h = { cx: r3((pi + (pj & 1) / 2) * dx), cy: r3(pj * dy), n: 0, indices: [] }
      mapa.set(chave, h)
    }
    h.n++
    h.indices.push(i)
  })
  return [...mapa.values()].sort((a, b) => a.cy - b.cy || a.cx - b.cx)
}

/** Vertices of a pointy-top hexagon centred at the origin. */
export function verticesHex(raio: number): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k + Math.PI / 6
    out.push([r3(raio * Math.cos(a)), r3(raio * Math.sin(a))])
  }
  return out
}
