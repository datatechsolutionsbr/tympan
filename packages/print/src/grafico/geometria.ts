// Pure chart geometry, in millimetres. Every position and length comes from
// the data through a linear scale; renderers only decide how a mark is drawn
// (crisp, rough, washed, pictorial), never where it goes or how long it is.
import type { LinhaPar, SpecBarras, SpecContagem, SpecHalteres, SpecSerie } from './tipos.ts'

/** A row with one value (single series) or two (a, b). */
export interface LinhaGenerica {
  rotulo: string
  nota?: string
  destaque?: boolean
  marca?: string
  local?: boolean
  valores: Array<{ serie: 'a' | 'b'; valor: number }>
}

export function linhasDe(spec: { linhas?: LinhaPar[]; barras?: Array<{ rotulo: string; valor: number; destaque?: boolean; nota?: string }>; grupos?: Array<{ rotulo: string; valor: number; destaque?: boolean; nota?: string }> }): LinhaGenerica[] {
  if (spec.linhas?.length) return spec.linhas.map((l) => ({ rotulo: l.rotulo, nota: l.nota, destaque: l.destaque, marca: l.marca, local: l.local, valores: [{ serie: 'a', valor: l.a }, { serie: 'b', valor: l.b }] }))
  const unicos = spec.barras ?? spec.grupos ?? []
  return unicos.map((b) => ({ rotulo: b.rotulo, nota: b.nota, destaque: b.destaque, valores: [{ serie: 'b', valor: b.valor }] }))
}

/** Label text size in the figure (mm, about 7 pt). */
export const TEXTO = 2.45
export const TEXTO_PEQUENO = 2.1

const r3 = (n: number) => {
  const v = Math.round(n * 1000) / 1000
  return Object.is(v, -0) ? 0 : v
}

export type Escala = (v: number) => number

export function escalaLinear([d0, d1]: [number, number], [r0, r1]: [number, number]): Escala {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)
  return (v: number) => r3(r0 + (v - d0) * k)
}

/** "Nice" tick values (steps of 1, 2, 2.5 or 5 times a power of ten) covering the domain. */
export function marcasEixo([d0, d1]: [number, number], alvo = 5): number[] {
  const range = d1 - d0
  if (!(range > 0)) return [d0]
  const raw = range / Math.max(1, alvo)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const passo = (norm < 1.5 ? 1 : norm < 2.25 ? 2 : norm < 3.5 ? 2.5 : norm < 7.5 ? 5 : 10) * mag
  const out: number[] = []
  const first = Math.ceil(d0 / passo - 1e-9) * passo
  for (let v = first; v <= d1 + passo * 1e-9; v += passo) out.push(r3(v))
  return out
}

/** Width estimate of a label (mm) for layout; generous so labels do not collide. */
export function larguraTexto(texto: string, tamanho = TEXTO): number {
  let w = 0
  for (const ch of texto) w += /[0-9]/.test(ch) ? 0.62 : /[\s.,:;·'’()|!]/.test(ch) ? 0.3 : /[A-ZÁÉÍÓÚÂÊÔÃÕÇMW]/.test(ch) ? 0.68 : 0.52
  return r3(w * tamanho)
}

/** Wraps a note into lines of at most `largura` mm. */
export function quebrar(texto: string, largura: number, tamanho = TEXTO): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean)
  const linhas: string[] = []
  let atual = ''
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p
    if (atual && larguraTexto(tentativa, tamanho) > largura) {
      linhas.push(atual)
      atual = p
    } else atual = tentativa
  }
  if (atual) linhas.push(atual)
  return linhas
}

const fmtNum = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
export const numeroBr = (v: number) => fmtNum.format(Object.is(v, -0) ? 0 : v)

export interface Eixo {
  y: number
  topo: number
  x0: number
  x1: number
  marcas: Array<{ v: number; x: number; texto: string }>
  /** Range frame (Tufte): the axis drawn only across the data. */
  amplitude: [number, number]
}

export interface AnotacaoPosta {
  linha: number
  linhas: string[]
  /** Right edge of the text block (end-aligned) or, in numbered mode, its start. */
  x: number
  y: number
  /** Leader line from the row down to the note (null in numbered mode: the text starts at `x`). */
  guia: { x: number; y1: number; y2: number } | null
}

function colunaRotulos(linhas: Array<{ rotulo: string; nota?: string }>, largura: number): number {
  const w = Math.max(
    12,
    ...linhas.map((l) => larguraTexto(l.rotulo, TEXTO * 1.04)),
    ...linhas.map((l) => (l.nota ? larguraTexto(l.nota, TEXTO_PEQUENO * 1.12) : 0)),
  )
  return r3(Math.min(w + 3, largura * 0.34))
}

function reservaDireita(linhas: Array<{ marca?: string }>, maximo: number): number {
  const digitos = numeroBr(maximo).length
  const marca = linhas.some((l) => l.marca) ? 5.2 : 0
  return r3(1.9 + digitos * 0.56 * TEXTO + 1.6 + marca)
}

function anotar(
  anotacoes: SpecHalteres['anotacoes'],
  ancora: (linha: number) => { x: number; y: number } | null,
  largura: number,
  x0: number,
  yInicio: number,
): { postas: AnotacaoPosta[]; fim: number } {
  const postas: AnotacaoPosta[] = []
  let y = yInicio
  const lista = anotacoes ?? []
  // One note: end-aligned under the plot with a leader line from its row (editorial style).
  // Several: a numbered list under the plot (the numbers repeat the row callouts), no leaders.
  const numeradas = lista.length > 1
  for (const a of lista) {
    const alvo = ancora(a.linha)
    if (!alvo) continue
    const linhas = quebrar(a.texto, largura - (numeradas ? 5 : x0), TEXTO * 1.05)
    y += TEXTO * 1.5
    postas.push({ linha: a.linha, linhas, x: numeradas ? 4.6 : largura, y: r3(y), guia: numeradas ? null : { x: alvo.x, y1: r3(alvo.y), y2: r3(y - TEXTO * 1.05) } })
    y += (linhas.length - 1) * TEXTO * 1.4 + (numeradas ? 0.5 : 1)
  }
  return { postas, fim: r3(y) }
}

// ---------------------------------------------------------------------------
// Dumbbell
// ---------------------------------------------------------------------------

export interface LinhaHalteres {
  i: number
  y: number
  rotulo: string
  nota?: string
  destaque: boolean
  a: number
  b: number
  xa: number
  xb: number
  /** Value labels: position and anchor. */
  rotA: { x: number; ancora: 'start' | 'end' }
  rotB: { x: number; ancora: 'start' | 'end' }
  marca?: { texto: string; x: number }
  local: boolean
}

export interface LayoutHalteres {
  largura: number
  altura: number
  raio: number
  x: Escala
  linhas: LinhaHalteres[]
  eixo: Eixo
  legenda: { y: number; xa: number; xb: number }
  anotacoes: AnotacaoPosta[]
  referencias: Array<{ x: number; rotulo: string; valor: number }>
}

export function layoutHalteres(spec: SpecHalteres, largura: number): LayoutHalteres {
  const raio = 0.95
  const x0 = colunaRotulos(spec.linhas, largura)
  const x1 = r3(largura - reservaDireita(spec.linhas, spec.escala[1]))
  const x = escalaLinear(spec.escala, [x0, x1])
  const passo = 7.2
  const topo = 5.2
  const linhas: LinhaHalteres[] = spec.linhas.map((l, i) => {
    const y = r3(topo + 2.4 + i * passo)
    const xa = x(l.a)
    const xb = x(l.b)
    const aEsq = l.a <= l.b
    const off = raio + 0.9
    const rotA = aEsq ? { x: r3(xa - off), ancora: 'end' as const } : { x: r3(xa + off), ancora: 'start' as const }
    const rotB = aEsq ? { x: r3(xb + off), ancora: 'start' as const } : { x: r3(xb - off), ancora: 'end' as const }
    const direita = aEsq ? rotB.x + larguraTexto(numeroBr(l.b)) : rotA.x + larguraTexto(numeroBr(l.a))
    return {
      i,
      y,
      rotulo: l.rotulo,
      nota: l.nota,
      destaque: Boolean(l.destaque),
      a: l.a,
      b: l.b,
      xa,
      xb,
      rotA,
      rotB,
      marca: l.marca ? { texto: l.marca, x: r3(direita + 4.4) } : undefined,
      local: Boolean(l.local),
    }
  })
  const ultimo = linhas[linhas.length - 1]?.y ?? topo
  const yEixo = r3(ultimo + 3.4)
  const valores = spec.linhas.flatMap((l) => [l.a, l.b])
  const eixo: Eixo = {
    y: yEixo,
    topo,
    x0,
    x1,
    marcas: marcasEixo(spec.escala, Math.max(3, Math.floor((x1 - x0) / 17))).map((v) => ({ v, x: x(v), texto: numeroBr(v) })),
    amplitude: [x(Math.min(...valores)), x(Math.max(...valores))],
  }
  const primeira = linhas[0]
  const legenda = { y: r3((primeira?.y ?? topo) - 2.3), xa: primeira?.xa ?? x0, xb: primeira?.xb ?? x1 }
  const { postas, fim } = anotar(
    spec.anotacoes,
    (i) => {
      const l = linhas[i]
      return l ? { x: r3((l.xa + l.xb) / 2), y: l.y + raio + 0.6 } : null
    },
    largura,
    x0,
    yEixo + 3.2,
  )
  const referencias = (spec.referencias ?? []).map((r) => ({ x: x(r.valor), rotulo: r.rotulo, valor: r.valor }))
  return { largura, altura: r3(Math.max(fim, yEixo + 3.4) + (spec.eixoNaoComecaNoZero ? 3.2 : 0) + 1.2), raio, x, linhas, eixo, legenda, anotacoes: postas, referencias }
}

// ---------------------------------------------------------------------------
// Bars (one or two per row)
// ---------------------------------------------------------------------------

export interface BarraPosta {
  serie: 'a' | 'b'
  valor: number
  x: number
  y: number
  w: number
  h: number
  rotulo: { x: number; y: number }
}

export interface LinhaBarras {
  i: number
  y: number
  rotulo: string
  nota?: string
  destaque: boolean
  local: boolean
  barras: BarraPosta[]
  marca?: { texto: string; x: number; y: number }
}

export interface LayoutBarras {
  largura: number
  altura: number
  x: Escala
  mmPorUnidade: number
  linhas: LinhaBarras[]
  eixo: Eixo
  legenda: { y: number; itens: Array<{ serie: 'a' | 'b'; x: number; texto: string }> } | null
  anotacoes: AnotacaoPosta[]
}

export function layoutBarras(spec: SpecBarras, largura: number): LayoutBarras {
  const linhasG = linhasDe(spec)
  const pares = linhasG.some((l) => l.valores.length > 1)
  const x0 = colunaRotulos(linhasG, largura)
  const x1 = r3(largura - reservaDireita(linhasG, spec.escala[1]))
  const x = escalaLinear(spec.escala, [x0, x1])
  const hb = pares ? 2.6 : 3.4
  const vao = 0.6
  const topo = pares ? 6 : 2.2
  let y = topo
  const linhas: LinhaBarras[] = linhasG.map((l, i) => {
    const yLinha = y
    const barras = l.valores.map((v, k) => {
      const yy = yLinha + k * (hb + vao)
      const xs = x(Math.min(0, v.valor))
      const w = r3(Math.abs(x(v.valor) - x(0)))
      return { serie: v.serie, valor: v.valor, x: xs, y: r3(yy), w, h: hb, rotulo: { x: r3(xs + w + 1.2), y: r3(yy + hb * 0.78) } }
    })
    const ult = barras[barras.length - 1]!
    const fim = ult.rotulo.x + larguraTexto(numeroBr(ult.valor))
    y += barras.length * hb + (barras.length - 1) * vao + (pares ? 2.8 : 2.4) + (l.nota && !pares ? 1.4 : 0)
    return {
      i,
      y: r3(yLinha),
      rotulo: l.rotulo,
      nota: l.nota,
      destaque: Boolean(l.destaque),
      local: Boolean(l.local),
      barras,
      marca: l.marca ? { texto: l.marca, x: r3(fim + 4.2), y: r3(ult.y + hb / 2) } : undefined,
    }
  })
  const yEixo = r3(y - (pares ? 2 : 1.4))
  const valores = linhasG.flatMap((l) => l.valores.map((v) => v.valor))
  const eixo: Eixo = {
    y: yEixo,
    topo: topo - 1,
    x0,
    x1,
    marcas: marcasEixo(spec.escala, Math.max(3, Math.floor((x1 - x0) / 17))).map((v) => ({ v, x: x(v), texto: numeroBr(v) })),
    amplitude: [x(Math.min(0, ...valores)), x(Math.max(...valores))],
  }
  const legenda = pares
    ? {
        y: 2.2,
        itens: [
          { serie: 'a' as const, x: x0, texto: spec.rotuloA ?? 'a' },
          { serie: 'b' as const, x: r3(x0 + larguraTexto(spec.rotuloA ?? 'a') + 9), texto: spec.rotuloB ?? 'b' },
        ],
      }
    : null
  const { postas, fim } = anotar(
    spec.anotacoes,
    (i) => {
      const l = linhas[i]
      const b = l?.barras[l.barras.length - 1]
      return b ? { x: r3(b.x + b.w * 0.5), y: b.y + b.h + 0.4 } : null
    },
    largura,
    x0,
    yEixo + 3.2,
  )
  const mmPorUnidade = r3((x1 - x0) / Math.max(1e-9, spec.escala[1] - spec.escala[0]))
  return { largura, altura: r3(Math.max(fim, yEixo + 3.4) + (spec.unidade ? 3 : 0) + 1.2), x, mmPorUnidade, linhas, eixo, legenda, anotacoes: postas }
}

// ---------------------------------------------------------------------------
// Columns (vertical bars: one group per row, bars side by side)
// ---------------------------------------------------------------------------

export interface ColunaPosta {
  serie: 'a' | 'b'
  valor: number
  /** Left edge and width of the column; `base` is the zero line, `h` the data length (upwards). */
  x: number
  w: number
  base: number
  h: number
  rotulo: { x: number; y: number }
}

export interface GrupoColunas {
  i: number
  /** Centre of the group, where the row label sits. */
  cx: number
  rotulo: string
  nota?: string
  destaque: boolean
  local: boolean
  colunas: ColunaPosta[]
  marca?: { texto: string; x: number; y: number }
}

export interface LayoutColunas {
  largura: number
  altura: number
  y: Escala
  mmPorUnidade: number
  area: { x0: number; x1: number; y0: number; y1: number }
  grupos: GrupoColunas[]
  marcasY: Array<{ v: number; y: number; texto: string }>
  legenda: { y: number; itens: Array<{ serie: 'a' | 'b'; x: number; y: number; texto: string }> } | null
  anotacoes: AnotacaoPosta[]
}

export function layoutColunas(spec: SpecBarras, largura: number, alturaPlot = 32): LayoutColunas {
  const linhasG = linhasDe(spec)
  const pares = linhasG.some((l) => l.valores.length > 1)
  const marcasYv = marcasEixo(spec.escala, 4)
  const x0 = r3(Math.max(...marcasYv.map((v) => larguraTexto(numeroBr(v), TEXTO_PEQUENO))) + 2.4)
  const x1 = r3(largura - 1)
  // The key goes on one line when it fits, on two otherwise.
  const xB = x0 + larguraTexto(spec.rotuloA ?? 'a') + 9
  const empilha = pares && xB + larguraTexto(spec.rotuloB ?? 'b') + 5 > largura
  const y0 = pares ? (empilha ? 11.5 : 8.5) : 5
  const y1 = r3(y0 + alturaPlot)
  const y = escalaLinear(spec.escala, [y1, y0])
  const n = Math.max(1, linhasG.length)
  const passo = (x1 - x0) / n
  const nb = pares ? 2 : 1
  const bw = r3(Math.min(7.5, (passo * 0.6) / nb))
  const grupos: GrupoColunas[] = linhasG.map((l, i) => {
    const cx = r3(x0 + passo * (i + 0.5))
    const inicio = cx - (bw * l.valores.length + 0.8 * (l.valores.length - 1)) / 2
    const colunas = l.valores.map((v, k) => {
      const xs = r3(inicio + k * (bw + 0.8))
      const topo = y(Math.max(0, v.valor))
      const base = y(Math.min(0, v.valor))
      const h = r3(Math.abs(base - topo))
      return { serie: v.serie, valor: v.valor, x: xs, w: bw, base: r3(y(0)), h, rotulo: { x: r3(xs + bw / 2), y: r3(topo - 1.1) } }
    })
    const temNota = Boolean(l.nota || l.local)
    return {
      i,
      cx,
      rotulo: l.rotulo,
      nota: l.nota,
      destaque: Boolean(l.destaque),
      local: Boolean(l.local),
      colunas,
      marca: l.marca ? { texto: l.marca, x: cx, y: r3(y1 + (temNota ? 9.2 : 6.6)) } : undefined,
    }
  })
  const legenda = pares
    ? {
        y: 2.4,
        itens: [
          { serie: 'a' as const, x: x0, y: 2.4, texto: spec.rotuloA ?? 'a' },
          { serie: 'b' as const, x: empilha ? x0 : r3(xB), y: empilha ? 5.6 : 2.4, texto: spec.rotuloB ?? 'b' },
        ],
      }
    : null
  const temMarca = grupos.some((g) => g.marca)
  const baseTexto = y1 + (grupos.some((g) => g.nota || g.local) ? 6.8 : 4.2) + (temMarca ? 3.2 : 0)
  const { postas, fim } = anotar(
    spec.anotacoes,
    (i) => {
      const g = grupos[i]
      const c = g?.colunas[g.colunas.length - 1]
      return c ? { x: r3(c.x + c.w / 2), y: y1 } : null
    },
    largura,
    x0,
    baseTexto,
  )
  const mmPorUnidade = r3((y1 - y0) / Math.max(1e-9, spec.escala[1] - spec.escala[0]))
  return {
    largura,
    altura: r3(Math.max(fim, baseTexto) + (spec.unidade ? 2.4 : 0) + 1.2),
    y,
    mmPorUnidade,
    area: { x0, x1, y0, y1 },
    grupos,
    marcasY: marcasYv.map((v) => ({ v, y: y(v), texto: numeroBr(v) })),
    legenda,
    anotacoes: postas,
  }
}

// ---------------------------------------------------------------------------
// Counting (Isotype)
// ---------------------------------------------------------------------------

export interface IconeCelula {
  x: number
  y: number
  /** Cell width and height (mm) and the drawn fraction of the icon (1 = whole, <1 = cut). */
  w: number
  h: number
  fracao: number
}

export interface GrupoIcones {
  serie: 'a' | 'b'
  valor: number
  celulas: IconeCelula[]
  rotulo: { x: number; y: number }
}

export interface LinhaContagem {
  i: number
  y: number
  rotulo: string
  nota?: string
  destaque: boolean
  grupos: GrupoIcones[]
  marca?: { texto: string; x: number; y: number }
}

export interface LayoutContagem {
  largura: number
  altura: number
  celula: number
  alturaIcone: number
  porLinha: number
  x0: number
  pares: boolean
  linhas: LinhaContagem[]
  anotacoes: AnotacaoPosta[]
}

export function layoutContagem(spec: SpecContagem, largura: number): LayoutContagem {
  const linhasG = linhasDe(spec)
  const pares = linhasG.some((l) => l.valores.length > 1)
  const x0 = r3(colunaRotulos(linhasG, largura) + (pares ? 7 : 0))
  const valores = linhasG.flatMap((l) => l.valores.map((v) => v.valor))
  const maxV = Math.max(spec.unidade, ...valores)
  const reserva = reservaDireita(linhasG, maxV)
  const util = largura - x0 - reserva
  const maxIcones = Math.ceil(maxV / spec.unidade - 1e-9)
  const celula = r3(Math.min(4.2, Math.max(2.3, util / maxIcones)))
  const porLinha = Math.max(1, Math.floor(util / celula))
  const alturaIcone = r3(Math.min(3.6, celula * 1.25))
  const passoLinha = alturaIcone + 0.7
  let y = 7.2
  const linhas: LinhaContagem[] = linhasG.map((l, i) => {
    const yLinha = y
    const grupos = l.valores.map((v, k) => {
      if (k > 0) y += 0.5
      const n = v.valor / spec.unidade
      const inteiros = Math.floor(n + 1e-9)
      const resto = r3(n - inteiros)
      const total = inteiros + (resto > 1e-6 ? 1 : 0)
      const celulas: IconeCelula[] = []
      for (let q = 0; q < total; q++) {
        const col = q % porLinha
        const lin = Math.floor(q / porLinha)
        celulas.push({ x: r3(x0 + col * celula), y: r3(y + lin * passoLinha), w: celula, h: alturaIcone, fracao: q < inteiros ? 1 : resto })
      }
      const linhasUsadas = Math.max(1, Math.ceil(total / porLinha))
      const ultima = celulas[celulas.length - 1]
      const fimX = ultima ? ultima.x + celula * Math.min(1, ultima.fracao < 1 ? ultima.fracao + 0.15 : 1) : x0
      const g: GrupoIcones = { serie: v.serie, valor: v.valor, celulas, rotulo: { x: r3(fimX + 1.3), y: r3(y + (linhasUsadas - 1) * passoLinha + alturaIcone * 0.82) } }
      y += linhasUsadas * passoLinha
      return g
    })
    y += 3.2
    const ult = grupos[grupos.length - 1]!
    const fim = ult.rotulo.x + larguraTexto(numeroBr(ult.valor))
    return {
      i,
      y: r3(yLinha),
      rotulo: l.rotulo,
      nota: l.nota,
      destaque: Boolean(l.destaque),
      grupos,
      marca: l.marca ? { texto: l.marca, x: r3(fim + 3.2), y: r3(ult.rotulo.y - alturaIcone * 0.32) } : undefined,
    }
  })
  const { postas, fim } = anotar(
    spec.anotacoes,
    (i) => {
      const l = linhas[i]
      const g = l?.grupos[l.grupos.length - 1]
      const c = g?.celulas[g.celulas.length - 1]
      return c ? { x: r3(c.x + c.w / 2), y: c.y + c.h + 0.3 } : null
    },
    largura,
    x0,
    y - 2.4,
  )
  return { largura, altura: r3(Math.max(fim, y - 1.6) + 1.2), celula, alturaIcone, porLinha, x0, pares, linhas, anotacoes: postas }
}

// ---------------------------------------------------------------------------
// Time series
// ---------------------------------------------------------------------------

export interface PontoSerie {
  i: number
  x: number
  y: number
  vx: number
  vy: number
  rotulo?: string
  chamada?: number
}

export interface LayoutSerie {
  largura: number
  altura: number
  x: Escala
  y: Escala
  area: { x0: number; x1: number; y0: number; y1: number }
  pontos: PontoSerie[]
  eventos: Array<{ x: number; rotulo: string; nota?: string }>
  faixas: Array<{ x0: number; x1: number; rotulo: string }>
  marcasX: Array<{ v: number; x: number; texto: string }>
  marcasY: Array<{ v: number; y: number; texto: string }>
  anotacoes: AnotacaoPosta[]
}

export function layoutSerie(spec: SpecSerie, largura: number, alturaPlot = 44): LayoutSerie {
  const marcasYv = marcasEixo(spec.escala, 4)
  const x0 = r3(Math.max(...marcasYv.map((v) => larguraTexto(numeroBr(v), TEXTO_PEQUENO))) + 2.4)
  const x1 = r3(largura - 10)
  const y0 = 5
  const y1 = r3(y0 + alturaPlot)
  const x = escalaLinear(spec.eixoX, [x0, x1])
  const y = escalaLinear(spec.escala, [y1, y0])
  const pontos = spec.pontos.map((p, i) => ({ i, x: x(p.x), y: y(p.y), vx: p.x, vy: p.y, rotulo: p.rotulo, chamada: p.chamada }))
  // Years: whole-number steps only.
  const anos = marcasEixo(spec.eixoX, Math.max(3, Math.floor((x1 - x0) / 16))).filter((v) => Number.isInteger(v))
  const { postas, fim } = anotar(
    spec.anotacoes,
    (i) => {
      const p = pontos[i]
      return p ? { x: p.x, y: p.y + 1 } : null
    },
    largura,
    x0,
    y1 + 5,
  )
  return {
    largura,
    altura: r3(Math.max(y1 + 6.4 + (spec.unidade ? 0 : 0), fim + 1.2)),
    x,
    y,
    area: { x0, x1, y0, y1 },
    pontos,
    eventos: (spec.eventos ?? []).map((e) => ({ x: x(e.x), rotulo: e.rotulo, nota: e.nota })),
    faixas: (spec.faixas ?? []).map((f) => ({ x0: x(f.de), x1: x(f.ate), rotulo: f.rotulo })),
    marcasX: anos.map((v) => ({ v, x: x(v), texto: String(v) })),
    marcasY: marcasYv.map((v) => ({ v, y: y(v), texto: numeroBr(v) })),
    anotacoes: postas,
  }
}
