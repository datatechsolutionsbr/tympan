// Correlation charts: dispersão (scatter of municipalities), simpson (overall
// line × one line per group), matriz-correlacao and antes-depois-controle.
// As in the other method charts, every position comes from the data through
// a scale in mm; the style's renderer only decides how a mark looks. The
// coefficient printed on the chart is recomputed from the points it draws, and
// a published coefficient that disagrees is flagged on the figure.
import type { ReactNode } from 'react'
import { tracar } from '../rough.ts'
import {
  correlacaoDentro,
  dominioAuto,
  escalaEixo,
  fmtCoef,
  fmtCompacto,
  hexbin,
  marcasLog,
  media,
  minimosQuadrados,
  pearson,
  quantil,
  spearman,
  verticesHex,
  type EscalaEixo,
  type Hexagono,
} from './estatistica.ts'
import { TEXTO, TEXTO_PEQUENO, larguraTexto, marcasEixo, numeroBr, quebrar } from './geometria.ts'
import { cssCor, type CorDado, type CtxPincel, type Pincel } from './pinceis.tsx'
import type { EixoDispersao, PontoMunicipio, SpecAntesDepoisControle, SpecDispersao, SpecMatrizCorrelacao, SpecSimpson } from './tiposCorrelacao.ts'

export interface CtxCorrelacao extends CtxPincel {
  p: Pincel
}

export interface ResultadoCorrelacao {
  L: { largura: number; altura: number }
  corpo: ReactNode
  tabela: { colunas: Array<string | { rotulo: string; numerica?: boolean }>; linhas: Array<Array<string | number>> } | null
  eixo: { x0: number; x1: number; d0: number; d1: number } | null
  /** The finding in one sentence, written from the recomputed coefficients. */
  achado: string
}

const n3 = (v: number) => {
  const r = Math.round(v * 1000) / 1000
  return Object.is(r, -0) ? 0 : r
}
/** Paper-coloured halo behind labels drawn over the cloud. */
const HALO = { paintOrder: 'stroke', stroke: 'var(--ty-print-papel)', strokeWidth: 0.6, strokeLinejoin: 'round' } as const
/** Tolerance between a published coefficient (3 decimals) and the one recomputed from the points. */
export const TOLERANCIA_COEFICIENTE = 0.0006

/**
 * Colour of the finding (trend line, named points, group lines): the style's highlight, unless it is almost
 * the ink (pencil styles such as caderno, where the red is the second highlight); then the second highlight.
 */
export function corAchado(c: CtxCorrelacao): CorDado {
  const { destaque, tinta, destaque2 } = c.estilo.cor
  return distanciaCor(destaque, tinta) < 60 && distanciaCor(destaque2, tinta) >= 60 ? 'destaque-2' : 'destaque'
}

function rgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const v = parseInt(m[1]!, 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function distanciaCor(a: string, b: string) {
  const x = rgb(a)
  const y = rgb(b)
  if (!x || !y) return 255
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}

function filtroCamada(c: CtxCorrelacao): string | undefined {
  const f = c.p.nome === 'gravura' ? 'prensa' : c.p.nome === 'riso' ? 'tinta' : c.p.nome === 'aquarela' ? 'aguada' : null
  return f ? `url(#${c.id}-f-${f})` : undefined
}

// ---------------------------------------------------------------------------
// Marks
// ---------------------------------------------------------------------------

/** A light mark for dense clouds (thousands of points): one element per point, the renderer's shape. */
function marcaLeve(c: CtxCorrelacao, i: number, cx: number, cy: number, r: number, cor: CorDado): ReactNode {
  const cs = cssCor(cor)
  switch (c.p.nome) {
    case 'prancheta':
      return <path key={i} data-i={i} d={`M${n3(cx - r)} ${cy}h${n3(2 * r)}M${cx} ${n3(cy - r)}v${n3(2 * r)}`} style={{ stroke: cs, strokeWidth: n3(Math.max(0.1, r * 0.42)) }} />
    case 'isotype':
      return <rect key={i} data-i={i} x={n3(cx - r * 0.88)} y={n3(cy - r * 0.88)} width={n3(r * 1.76)} height={n3(r * 1.76)} style={{ fill: cs }} />
    case 'pontos':
      return <circle key={i} data-i={i} cx={cx} cy={cy} r={r} style={{ fill: 'none', stroke: cs, strokeWidth: n3(Math.max(0.08, r * 0.34)) }} />
    default:
      return <circle key={i} data-i={i} cx={cx} cy={cy} r={r} style={{ fill: cs }} />
  }
}

/** A hexagonal bin: darker (limpo, mão, gravura, riso, aquarela, prancheta) or larger (pontos, isotype) with more points. */
function marcaHex(c: CtxCorrelacao, k: number, h: Hexagono, raio: number, fracao: number, cor: CorDado): ReactNode {
  const cs = cssCor(cor)
  const op = n3(0.14 + 0.86 * Math.sqrt(fracao))
  const lado = Math.sqrt(fracao)
  const attrs = { 'data-n': h.n, 'data-cx': h.cx, 'data-cy': h.cy, className: 'ty-print-hex' }
  if (c.p.nome === 'pontos') return <circle key={k} {...attrs} cx={h.cx} cy={h.cy} r={n3(Math.max(0.22, raio * 0.9 * lado))} style={{ fill: cs }} />
  if (c.p.nome === 'isotype') {
    const s = Math.max(0.4, raio * 1.6 * lado)
    return <rect key={k} {...attrs} x={n3(h.cx - s / 2)} y={n3(h.cy - s / 2)} width={n3(s)} height={n3(s)} style={{ fill: cs }} />
  }
  const pts = verticesHex(raio * 0.97)
  const d = `M${pts.map(([x, y]) => `${n3(h.cx + x)} ${n3(h.cy + y)}`).join('L')}Z`
  if (c.p.nome === 'prancheta') return <path key={k} {...attrs} d={d} style={{ fill: cs, fillOpacity: n3(op * 0.55), stroke: cs, strokeWidth: 0.1 }} />
  if (c.p.nome === 'mao') {
    // Hand contour, traced at 10× and scaled down so the tremble stays a fraction of the hexagon.
    const S = 10 / raio
    const tr = tracar({ k: 'poligono', pts: verticesHex(10 * 0.97) }, `hex-${k}`, { roughness: 0.6, maxRandomnessOffset: 0.6, bowing: 0.5, strokeWidth: n3(0.12 * S), stroke: cs })
    return (
      <g key={k} {...attrs}>
        <path d={d} style={{ fill: cs, fillOpacity: op }} />
        <g transform={`translate(${h.cx} ${h.cy}) scale(${n3(1 / S)})`}>
          {tr.map((t, j) => (
            <path key={j} d={t.d} style={{ stroke: t.stroke, strokeWidth: t.strokeWidth, fill: 'none', strokeOpacity: n3(Math.min(1, op + 0.2)) }} />
          ))}
        </g>
      </g>
    )
  }
  return <path key={k} {...attrs} d={d} style={{ fill: cs, fillOpacity: op }} />
}

// ---------------------------------------------------------------------------
// Axes
// ---------------------------------------------------------------------------

interface Area {
  x0: number
  x1: number
  y0: number
  y1: number
}

const alvoX = (x0: number, x1: number) => Math.max(3, Math.floor((x1 - x0) / 18))
const alvoY = (y0: number, y1: number) => Math.max(3, Math.floor((y1 - y0) / 11))

function fecharNaMarca(d: [number, number], alvo: number): [number, number] {
  let dom = d
  for (let k = 0; k < 2; k++) {
    const m = marcasEixo(dom, alvo)
    if (m.length < 2) return dom
    const passo = m[1]! - m[0]!
    dom = [m[0]! > dom[0] + 1e-9 ? n3(m[0]! - passo) : dom[0], m[m.length - 1]! < dom[1] - 1e-9 ? n3(m[m.length - 1]! + passo) : dom[1]]
  }
  return dom
}

function marcasDe(e: EscalaEixo, alvo: number): number[] {
  return e.log ? marcasLog(e.dominio) : marcasEixo(e.dominio, alvo)
}

function tituloEixo(e: EixoDispersao) {
  return e.unidade ? `${e.rotulo} (${e.unidade})` : e.rotulo
}

function Eixos({ c, sx, sy, area, ex, ey, W, H, zero, amplitude }: { c: CtxCorrelacao; sx: EscalaEixo; sy: EscalaEixo; area: Area; ex: EixoDispersao; ey: EixoDispersao; W: number; H: number; zero?: { x: number; rotulo: string; largura: number }; amplitude?: { x: [number, number]; y: [number, number] } }) {
  const { x0, x1, y0, y1 } = area
  // With a zero strip, the y labels sit left of it, so strip points never cover them.
  const xRotY = n3(x0 - 1.2 - (zero?.largura ?? 0))
  const mx = marcasDe(sx, alvoX(x0, x1))
  const my = marcasDe(sy, alvoY(y0, y1))
  return (
    <g className="ty-print-g-eixo">
      {my.map((v) => (
        <g key={`y${v}`}>
          <g className="ty-print-grade">{c.p.linha(c, { chave: `gy-${v}`, x1: x0, y1: sy(v), x2: x1, y2: sy(v), cor: 'linha', largura: 0.12, tipo: 'grade' })}</g>
          <text className="ty-print-g-eixo-texto" x={xRotY} y={n3(sy(v) + 0.7)} textAnchor="end">
            {fmtCompacto(v)}
          </text>
        </g>
      ))}
      {amplitude ? (
        // Range frame (Tufte): shown only by styles with figure 'amplitude', which hide the full axes and grid.
        <g className="ty-print-eixo-amplitude">
          <line x1={amplitude.x[0]} x2={amplitude.x[1]} y1={y1} y2={y1} style={{ stroke: 'var(--ty-print-tinta-2)', strokeWidth: 0.2 }} />
          <line x1={x0} x2={x0} y1={amplitude.y[0]} y2={amplitude.y[1]} style={{ stroke: 'var(--ty-print-tinta-2)', strokeWidth: 0.2 }} />
        </g>
      ) : null}
      {mx.map((v) => (
        <g key={`x${v}`}>
          <g className="ty-print-grade">{c.p.linha(c, { chave: `gx-${v}`, x1: sx(v), y1: y0, x2: sx(v), y2: y1, cor: 'linha', largura: 0.12, tipo: 'grade' })}</g>
          {(() => {
            // The end ticks are aligned to the figure's edge instead of spilling out of it.
            const w = larguraTexto(fmtCompacto(v), TEXTO_PEQUENO) * 1.15
            const X = sx(v)
            const [x, ancora] = X + w / 2 > W ? [W, 'end' as const] : [X, 'middle' as const]
            return (
              <text className="ty-print-g-eixo-texto" x={x} y={n3(y1 + 2.9)} textAnchor={ancora}>
                {fmtCompacto(v)}
              </text>
            )
          })()}
        </g>
      ))}
      <g className="ty-print-eixo-cheio">{c.p.linha(c, { chave: 'eixo-x', x1: x0, y1: y1, x2: x1, y2: y1, cor: 'tinta-2', largura: 0.2, tipo: 'eixo' })}</g>
      <g className="ty-print-eixo-cheio">{c.p.linha(c, { chave: 'eixo-y', x1: x0, y1: y0, x2: x0, y2: y1, cor: 'tinta-2', largura: 0.2, tipo: 'eixo' })}</g>
      {zero ? (
        <g className="ty-print-g-zero">
          {c.p.linha(c, { chave: 'eixo-zero', x1: n3(zero.x - 1.6), y1: y1, x2: n3(zero.x + 1.6), y2: y1, cor: 'tinta-2', largura: 0.2, tipo: 'eixo' })}
          {/* axis break between the zero strip and the log axis */}
          <path d={`M${n3(x0 - 2.1)} ${n3(y1 + 0.9)}l0.8 -1.8M${n3(x0 - 1.2)} ${n3(y1 + 0.9)}l0.8 -1.8`} style={{ stroke: 'var(--ty-print-tinta-2)', strokeWidth: 0.2, fill: 'none' }} />
          <text className="ty-print-g-eixo-texto" x={zero.x} y={n3(y1 + 2.9)} textAnchor="middle">
            {zero.rotulo}
          </text>
        </g>
      ) : null}
      <text className="ty-print-g-unidade" x={0} y={n3(y0 - 2.4)} style={{ fontWeight: 600, fill: 'var(--ty-print-tinta-2)' }}>
        {tituloEixo(ey)}
        {ey.log ? ' · escala log' : ''}
      </text>
      <text className="ty-print-g-unidade" x={W} y={n3(H - 1)} textAnchor="end" style={{ fontWeight: 600, fill: 'var(--ty-print-tinta-2)' }}>
        {tituloEixo(ex)}
        {ex.log ? ' · escala log' : ''}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Key (legend) in one or more rows
// ---------------------------------------------------------------------------

type AmostraLegenda =
  | { tipo: 'linha'; cor: CorDado; tracejada?: boolean; largura: number }
  | { tipo: 'ponto'; cor: CorDado; cheio: boolean }
  | { tipo: 'hex'; cor: CorDado; fracao: number }
  | { tipo: 'nada' }

function Legenda({ c, itens, largura, y }: { c: CtxCorrelacao; itens: Array<{ amostra: AmostraLegenda; texto: string; cor?: CorDado }>; largura: number; y: number }): { el: ReactNode; fim: number } {
  let x = 0
  let yy = y
  const out: ReactNode[] = []
  itens.forEach((it, k) => {
    const wAm = it.amostra.tipo === 'nada' ? 0 : it.amostra.tipo === 'linha' ? 5 : 2.6
    const w = wAm + larguraTexto(it.texto, 2.2) + 3.2
    if (x > 0 && x + w > largura) {
      x = 0
      yy += TEXTO * 1.3
    }
    const a = it.amostra
    out.push(
      <g key={k} className="ty-print-g-legenda-item">
        {a.tipo === 'linha' ? (
          <g strokeDasharray={a.tracejada ? '1.1 0.6' : undefined}>{c.p.linha(c, { chave: `leg-${k}`, x1: n3(x), y1: n3(yy - 0.8), x2: n3(x + 4.2), y2: n3(yy - 0.8), cor: a.cor, largura: a.largura, tipo: 'serie' })}</g>
        ) : a.tipo === 'ponto' ? (
          <g transform={`translate(${n3(x + 1.1)} ${n3(yy - 0.8)})`}>{c.p.ponto(c, { chave: `leg-${k}`, r: 0.85, cor: a.cor, cheio: a.cheio })}</g>
        ) : a.tipo === 'hex' ? (
          marcaHex(c, 10000 + k, { cx: n3(x + 1.1), cy: n3(yy - 0.8), n: 0, indices: [] }, 1.1, a.fracao, a.cor)
        ) : null}
        <text x={n3(x + wAm + (wAm ? 0.8 : 0))} y={yy} style={{ fontSize: 2.2, fill: it.cor ? cssCor(it.cor) : 'var(--ty-print-tinta-2)', fontWeight: it.cor ? 700 : 400 }}>
          {it.texto}
        </text>
      </g>,
    )
    x += w
  })
  return { el: <g className="ty-print-g-legenda">{out}</g>, fim: yy }
}

// ---------------------------------------------------------------------------
// Shared scatter geometry
// ---------------------------------------------------------------------------

interface Plotado {
  i: number
  p: PontoMunicipio
  X: number
  Y: number
  tx: number
  ty: number
  zero: boolean
}

interface Geometria {
  W: number
  H: number
  area: Area
  sx: EscalaEixo
  sy: EscalaEixo
  plotados: Plotado[]
  fora: number
  zero?: { x: number; rotulo: string; largura: number }
}

function geometria(pontos: PontoMunicipio[], ex: EixoDispersao, ey: EixoDispersao, largura: number, altura: number | undefined, topo: number, rotuloZeroX?: string): Geometria {
  const W = largura
  const H = n3(altura ?? Math.round(largura * 0.7))
  const comZero = Boolean(ex.log && rotuloZeroX)
  const finitos = pontos.map((p, i) => ({ p, i })).filter(({ p }) => Number.isFinite(p.x) && Number.isFinite(p.y))
  const y0 = n3(topo + 6.2)
  const y1 = n3(H - 7.2)
  let domX = ex.dominio ?? dominioAuto(finitos.map(({ p }) => p.x), ex.log)
  let domY = ey.dominio ?? dominioAuto(finitos.map(({ p }) => p.y), ey.log)
  // An automatic linear domain ends on a tick, so the frame never stops at an unlabelled value.
  if (!ey.dominio && !ey.log) domY = fecharNaMarca(domY, alvoY(y0, y1))
  const sy0 = escalaEixo(domY, [0, 1], ey.log)
  const my = marcasDe(sy0, alvoY(y0, y1))
  const wTick = Math.max(...my.map((v) => larguraTexto(fmtCompacto(v), TEXTO_PEQUENO)), 3)
  const faixaZero = comZero ? Math.max(9, larguraTexto(rotuloZeroX!, TEXTO_PEQUENO) + 3) : 0
  const x0 = n3(wTick + 2.2 + faixaZero)
  const x1 = n3(W - 1.5)
  if (!ex.dominio && !ex.log) domX = fecharNaMarca(domX, alvoX(x0, x1))
  const sx = escalaEixo(domX, [x0, x1], ex.log)
  const sy = escalaEixo(domY, [y1, y0], ey.log)
  const zeroX = n3(x0 - faixaZero / 2 - 0.8)
  const eps = 1e-9
  const dentroX = (v: number) => v >= Math.min(...domX) * (1 - eps) - eps && v <= Math.max(...domX) * (1 + eps) + eps
  const dentroY = (v: number) => v >= Math.min(...domY) * (1 - eps) - eps && v <= Math.max(...domY) * (1 + eps) + eps
  const plotados: Plotado[] = []
  let fora = 0
  for (const { p, i } of finitos) {
    const zero = comZero && p.x <= 0
    if ((ey.log && p.y <= 0) || (ex.log && p.x <= 0 && !zero) || !dentroY(p.y) || (!zero && !dentroX(p.x))) {
      fora++
      continue
    }
    plotados.push({ i, p, X: zero ? zeroX : sx(p.x), Y: sy(p.y), tx: zero ? NaN : sx.t(p.x), ty: sy.t(p.y), zero })
  }
  fora += pontos.length - finitos.length
  return { W, H, area: { x0, x1, y0, y1 }, sx, sy, plotados, fora, zero: comZero ? { x: zeroX, rotulo: rotuloZeroX!, largura: faixaZero } : undefined }
}

/** Segment of y = a + b·t (t-space) between t0 and t1, clipped to the y domain; null if it never crosses the plot. */
function segmento(a: number, b: number, t0: number, t1: number, sy: EscalaEixo): [number, number, number, number] | null {
  const lo = Math.min(sy.t0, sy.t1)
  const hi = Math.max(sy.t0, sy.t1)
  let ta = t0
  let tb = t1
  if (b !== 0) {
    const tLo = (lo - a) / b
    const tHi = (hi - a) / b
    const [e0, e1] = tLo < tHi ? [tLo, tHi] : [tHi, tLo]
    ta = Math.max(ta, e0)
    tb = Math.min(tb, e1)
    if (ta >= tb) return null
  } else if (a < lo || a > hi) return null
  return [ta, a + b * ta, tb, a + b * tb]
}

function confere(declarado: number | undefined, calculado: number | null) {
  if (declarado === undefined || calculado === null) return true
  return Math.abs(calculado - declarado) <= TOLERANCIA_COEFICIENTE
}

function Aviso({ x, y, texto }: { x: number; y: number; texto: string }) {
  return (
    <text className="ty-print-g-aviso" x={x} y={y} data-aviso="coeficiente" style={{ fill: 'var(--ty-print-destaque)' }}>
      {texto}
    </text>
  )
}

/**
 * Where to write a line's label: above or below either end, whichever box covers the fewest points
 * (clamped inside the plot). Deterministic: ties keep the first candidate.
 */
function lugarRotulo(X1: number, Y1: number, X2: number, Y2: number, w: number, pts: Plotado[], area: Area): { x: number; y: number } {
  const h = TEXTO * 1.1
  // The line's height across the label's span: the label clears the whole span, not just the end point.
  const yLinha = (x: number) => (X2 === X1 ? Y1 : Y1 + ((Y2 - Y1) * (x - X1)) / (X2 - X1))
  const acima = (x: number) => Math.min(yLinha(x), yLinha(x + w)) - 1.8
  const abaixo = (x: number) => Math.max(yLinha(x), yLinha(x + w)) + h + 1.2
  const prender = (x: number, y: number) => ({ x: n3(Math.min(area.x1 - w, Math.max(area.x0 + 1, x))), y: n3(Math.min(area.y1 - 1, Math.max(area.y0 + h, y))) })
  const xa = Math.min(area.x1 - w, Math.max(area.x0 + 1, X1))
  const xb = Math.min(area.x1 - w, Math.max(area.x0 + 1, X2 - w))
  // Line ends first; the two top corners of the plot as fallbacks (small penalty).
  const cands = [prender(xa, acima(xa)), prender(xb, acima(xb)), prender(xb, abaixo(xb)), prender(xa, abaixo(xa)), prender(area.x1 - w, area.y0 + h), prender(area.x0 + 1, area.y0 + h)]
  let melhor = cands[0]!
  let menor = Infinity
  for (const [ic, c] of cands.entries()) {
    let k = ic >= 4 ? 3 : 0
    for (const p of pts) if (p.X >= c.x - 0.5 && p.X <= c.x + w + 0.5 && p.Y >= c.y - h - 0.5 && p.Y <= c.y + 0.8) k++
    // A label the line runs through is unreadable: heavy penalty.
    const l0 = Math.max(c.x, Math.min(X1, X2))
    const l1 = Math.min(c.x + w, Math.max(X1, X2))
    if (l0 <= l1) {
      const ya = yLinha(l0)
      const yb = yLinha(l1)
      if (Math.max(ya, yb) >= c.y - h - 0.3 && Math.min(ya, yb) <= c.y + 0.6) k += 10000
    }
    if (k < menor) {
      menor = k
      melhor = c
    }
  }
  return melhor
}

function amplitudeDe(pts: Plotado[]): { x: [number, number]; y: [number, number] } | undefined {
  const q = pts.filter((p) => !p.zero)
  if (!q.length) return undefined
  const xs = q.map((p) => p.X)
  const ys = q.map((p) => p.Y)
  return { x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)] }
}

function nomeDe(p: PontoMunicipio) {
  return p.municipio ? (p.uf ? `${p.municipio}/${p.uf}` : p.municipio) : String(p.ibge ?? '')
}

/** Greedy label placement: right of the point, else left; nudged vertically off earlier labels. */
function rotularDestaques(alvos: Array<{ X: number; Y: number; texto: string }>, area: Area) {
  const postos: Array<{ x: number; y: number; w: number; ancora: 'start' | 'end' }> = []
  const h = TEXTO * 1.05
  return alvos.map((a) => {
    const w = larguraTexto(a.texto, TEXTO) * 1.08
    const direita = a.X + 1.5 + w <= area.x1
    let y = n3(Math.min(area.y1 - 0.6, Math.max(area.y0 + h, a.Y + 0.8)))
    const caixa = (yy: number) => ({ x: direita ? a.X + 1.5 : a.X - 1.5 - w, y: yy - h, w, h })
    const colide = (yy: number) => postos.some((p) => {
      const b = caixa(yy)
      const px = p.ancora === 'start' ? p.x : p.x - p.w
      return b.x < px + p.w && b.x + b.w > px && b.y < p.y && b.y + b.h > p.y - h
    })
    for (let k = 1; k <= 6 && colide(y); k++) y = n3(a.Y + 0.8 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * h)
    const posto = { x: n3(direita ? a.X + 1.5 : a.X - 1.5), y, w, ancora: (direita ? 'start' : 'end') as 'start' | 'end' }
    postos.push(posto)
    return posto
  })
}

/**
 * A chart whose points were not loaded (the content JSON points at `dados` and no loader filled `pontos`):
 * an honest empty frame that says so, instead of a crash or an empty axis that looks like "no correlation".
 */
function semDados(titulo: string, dados: string | undefined, largura: number): ResultadoCorrelacao {
  const texto = dados ? `dados não carregados: ${dados}` : 'sem pontos'
  return {
    L: { largura, altura: 14 },
    corpo: (
      <>
        <rect x={0.2} y={0.2} width={n3(largura - 0.4)} height={13.6} style={{ fill: 'none', stroke: 'var(--ty-print-linha)', strokeWidth: 0.2 }} strokeDasharray="1 0.6" />
        <text className="ty-print-g-aviso" x={n3(largura / 2)} y={7.6} textAnchor="middle" data-aviso="sem-dados">
          {texto}
        </text>
      </>
    ),
    tabela: null,
    eixo: null,
    achado: `${titulo}: ${texto}.`,
  }
}

// ---------------------------------------------------------------------------
// dispersao
// ---------------------------------------------------------------------------

export function Dispersao({ c, spec, largura }: { c: CtxCorrelacao; spec: SpecDispersao; largura: number }): ResultadoCorrelacao {
  if (!spec.pontos?.length) return semDados(spec.titulo, spec.dados, largura)
  const metodo = spec.metodo ?? 'pearson'
  const sym = metodo === 'spearman' ? 'ρ' : 'r'
  const nTotal = spec.pontos.length
  const modo = spec.densidade && spec.densidade !== 'auto' ? spec.densidade : nTotal > 1500 && !spec.tamanhoPorPopulacao ? 'hexbin' : 'pontos'
  const temCapitais = Boolean(spec.destacarCapitais && spec.pontos.some((p) => p.capital))
  // Key first, to know where the plot starts.
  const chaves: Array<{ amostra: AmostraLegenda; texto: string; cor?: CorDado }> = []
  const achadoCor = corAchado(c)
  const G0 = geometria(spec.pontos, spec.x, spec.y, largura, spec.altura, 0, spec.rotuloZeroX)
  const semZero = G0.plotados.filter((q) => !q.zero)
  const tx = semZero.map((q) => q.tx)
  const ty = semZero.map((q) => q.ty)
  const validos = spec.pontos.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  const coef = metodo === 'spearman' ? spearman(validos.map((p) => p.x), validos.map((p) => p.y)) : pearson(tx, ty)
  const rPearson = pearson(tx, ty)
  const rSpearman = spearman(validos.map((p) => p.x), validos.map((p) => p.y))
  const reta = spec.tendencia === false ? null : minimosQuadrados(tx, ty)
  const nCoef = metodo === 'spearman' ? validos.length : semZero.length
  if (reta) chaves.push({ amostra: { tipo: 'linha', cor: achadoCor, largura: 0.55 }, texto: `reta de mínimos quadrados${spec.x.log || spec.y.log ? ' (em log)' : ''}` })
  let hexes: Hexagono[] = []
  const raioHex = n3(Math.max(1.1, largura / 85))
  if (modo === 'hexbin') chaves.push({ amostra: { tipo: 'hex', cor: 'tinta-2', fracao: 0.08 }, texto: 'poucos' }, { amostra: { tipo: 'hex', cor: 'tinta-2', fracao: 1 }, texto: 'muitos municípios por hexágono' })
  if (spec.tamanhoPorPopulacao) chaves.push({ amostra: { tipo: 'ponto', cor: 'tinta-2', cheio: true }, texto: 'área do ponto = população' })
  if (temCapitais) chaves.push({ amostra: { tipo: 'ponto', cor: 'tinta', cheio: false }, texto: 'capital' })
  const cab = Legenda({ c, itens: chaves, largura, y: 2.4 })
  const G = geometria(spec.pontos, spec.x, spec.y, largura, spec.altura, cab.fim, spec.rotuloZeroX)
  const { W, H, area, sx, sy, plotados } = G
  if (modo === 'hexbin') hexes = hexbin(plotados.map((q) => ({ x: q.X, y: q.Y })), raioHex)
  const nMax = Math.max(1, ...hexes.map((h) => h.n))
  const ok = confere(spec.coeficiente, coef)

  // Cloud
  const popMax = Math.max(1, ...plotados.map((q) => q.p.pop ?? 0))
  const rBase = nTotal > 1500 ? 0.34 : nTotal > 400 ? 0.5 : 0.62
  const raio = (q: Plotado) => (spec.tamanhoPorPopulacao && q.p.pop ? n3(Math.min(3.4, Math.max(0.28, 3.4 * Math.sqrt(q.p.pop / popMax)))) : rBase)
  const ordem = spec.tamanhoPorPopulacao ? [...plotados].sort((a, b) => raio(b) - raio(a) || a.i - b.i) : plotados
  const opac = nTotal > 3000 ? 0.24 : nTotal > 1500 ? 0.32 : nTotal > 400 ? 0.5 : 0.72
  const nuvem =
    modo === 'hexbin' ? (
      <g className="ty-print-g-nuvem" data-modo="hexbin" data-raio={raioHex} filter={filtroCamada(c)}>
        {hexes.map((h, k) => marcaHex(c, k, h, raioHex, h.n / nMax, 'tinta-2'))}
      </g>
    ) : nTotal <= 600 && !spec.tamanhoPorPopulacao ? (
      <g className="ty-print-g-nuvem" data-modo="pontos" style={{ opacity: opac }}>
        {ordem.map((q) => (
          <g key={q.i} className="ty-print-ponto" data-i={q.i} data-valor-x={q.p.x} data-valor-y={q.p.y} data-cx={q.X} data-cy={q.Y} transform={`translate(${q.X} ${q.Y})`}>
            {c.p.ponto(c, { chave: `d-${q.i}`, r: raio(q), cor: 'tinta-2', cheio: true })}
          </g>
        ))}
      </g>
    ) : (
      <g className="ty-print-g-nuvem" data-modo="pontos" style={{ opacity: spec.tamanhoPorPopulacao ? 0.42 : opac }} filter={filtroCamada(c)}>
        {ordem.map((q) => marcaLeve(c, q.i, q.X, q.Y, raio(q), 'tinta-2'))}
      </g>
    )

  // Line and coefficient label
  let linha: ReactNode = null
  let rotuloCoef: ReactNode = null
  const textoCoef = `${spec.rotuloCoeficiente ? `${spec.rotuloCoeficiente}: ` : ''}${sym} = ${coef === null ? '—' : fmtCoef(coef)}`
  if (reta && tx.length >= 2) {
    const seg = segmento(reta.a, reta.b, Math.min(...tx), Math.max(...tx), sy)
    if (seg) {
      const [ta, ya, tb, yb] = seg
      const X1 = sx.deT(ta)
      const Y1 = sy.deT(ya)
      const X2 = sx.deT(tb)
      const Y2 = sy.deT(yb)
      linha = (
        <g className="ty-print-g-tendencia" data-a={n3(reta.a)} data-b={reta.b} data-x1={X1} data-y1={Y1} data-x2={X2} data-y2={Y2}>
          {c.p.linha(c, { chave: 'tendencia', x1: X1, y1: Y1, x2: X2, y2: Y2, cor: achadoCor, largura: 0.55, tipo: 'serie' })}
        </g>
      )
      // Written at an end of the line, where the label covers the fewest points.
      const w = larguraTexto(textoCoef, TEXTO * 1.1) * 1.08
      const lugar = lugarRotulo(X1, Y1, X2, Y2, w, plotados, area)
      rotuloCoef = (
        <text className="ty-print-g-valor ty-print-g-coef" x={lugar.x} y={lugar.y} data-coef={coef === null ? '' : n3(coef)} style={{ ...HALO, fill: cssCor(achadoCor), fontSize: n3(TEXTO * 1.1) }}>
          {textoCoef}
        </text>
      )
    }
  }
  if (!rotuloCoef)
    rotuloCoef = (
      <text className="ty-print-g-valor ty-print-g-coef" x={n3(area.x1)} y={n3(area.y0 + TEXTO)} textAnchor="end" data-coef={coef === null ? '' : n3(coef)} style={{ ...HALO, fill: cssCor(achadoCor) }}>
        {textoCoef}
      </text>
    )

  // Capitals and named municipalities
  const capitais = temCapitais ? plotados.filter((q) => q.p.capital) : []
  const alvos = (spec.destaques ?? [])
    .map((d) => {
      const q = plotados.find((q) => (d.ibge !== undefined ? q.p.ibge === d.ibge : q.p.municipio?.toLowerCase() === d.municipio?.toLowerCase()))
      return q ? { q, texto: d.rotulo ?? nomeDe(q.p) } : null
    })
    .filter((a): a is { q: Plotado; texto: string } => a !== null)
  const postos = rotularDestaques(alvos.map((a) => ({ X: a.q.X, Y: a.q.Y, texto: a.texto })), area)
  const faltando = (spec.destaques ?? []).length - alvos.length

  const corpo = (
    <>
      {cab.el}
      <Eixos c={c} sx={sx} sy={sy} area={area} ex={spec.x} ey={spec.y} W={W} H={H} zero={G.zero} amplitude={amplitudeDe(plotados)} />
      <g className="ty-print-g-area" data-x0={area.x0} data-x1={area.x1} data-y0={area.y0} data-y1={area.y1} data-dx0={sx.dominio[0]} data-dx1={sx.dominio[1]} data-dy0={sy.dominio[0]} data-dy1={sy.dominio[1]} data-logx={spec.x.log ? '' : undefined} data-logy={spec.y.log ? '' : undefined} />
      {nuvem}
      {capitais.map((q) => (
        <g key={`cap-${q.i}`} className="ty-print-g-capital" data-i={q.i} transform={`translate(${q.X} ${q.Y})`}>
          {c.p.ponto(c, { chave: `cap-${q.i}`, r: 0.95, cor: 'tinta', cheio: false })}
        </g>
      ))}
      {linha}
      {alvos.map((a, k) => (
        <g key={`dst-${k}`} className="ty-print-g-destaque" data-i={a.q.i} data-cx={a.q.X} data-cy={a.q.Y}>
          <g transform={`translate(${a.q.X} ${a.q.Y})`}>{c.p.ponto(c, { chave: `dst-${a.q.i}`, r: 0.95, cor: achadoCor, cheio: true })}</g>
          <text className="ty-print-g-rotulo" x={postos[k]!.x} y={postos[k]!.y} textAnchor={postos[k]!.ancora} style={{ ...HALO, fontSize: TEXTO }}>
            {a.texto}
          </text>
        </g>
      ))}
      {rotuloCoef}
      <text className="ty-print-g-chave" x={W} y={2.4} textAnchor="end">
        {`n = ${numeroBr(nCoef)} municípios`}
      </text>
      {!ok ? <Aviso x={area.x0 + 1} y={n3(area.y0 + TEXTO)} texto={`coeficiente publicado ${fmtCoef(spec.coeficiente!)} ≠ ${fmtCoef(coef!)} calculado dos pontos`} /> : null}
      {G.fora > 0 ? (
        <text className="ty-print-g-aviso" x={W} y={n3(H - 3.6)} textAnchor="end">
          {`${numeroBr(G.fora)} fora dos eixos`}
        </text>
      ) : null}
      {faltando > 0 ? (
        <text className="ty-print-g-aviso" x={0} y={n3(H - 1)}>
          {`${faltando} destaque(s) sem ponto`}
        </text>
      ) : null}
    </>
  )
  const linhas: Array<Array<string | number>> = [
    ['Municípios no gráfico', numeroBr(plotados.length)],
    [`r de Pearson${spec.x.log || spec.y.log ? ' (em log)' : ''}`, rPearson === null ? '—' : fmtCoef(rPearson)],
    ['ρ de Spearman', rSpearman === null ? '—' : fmtCoef(rSpearman)],
  ]
  if (reta) linhas.push([`Reta: y = a + b·x${spec.x.log || spec.y.log ? ' (em log)' : ''}`, `a = ${numeroBr(n3(reta.a))}; b = ${fmtCompactoCoef(reta.b)}`])
  if (spec.coeficiente !== undefined) linhas.push(['Coeficiente publicado', `${fmtCoef(spec.coeficiente)}${ok ? ' (confere)' : ' (não confere)'}`])
  for (const a of alvos) linhas.push([a.texto, `x = ${numeroBr(a.q.p.x)}; y = ${numeroBr(a.q.p.y)}`])
  const achado = `${spec.y.rotulo} × ${spec.x.rotulo}: ${sym === 'ρ' ? 'ρ de Spearman' : 'r'} = ${coef === null ? '—' : fmtCoef(coef)} em ${numeroBr(nCoef)} municípios.`
  return {
    L: { largura: W, altura: H },
    corpo,
    tabela: { colunas: ['Medida', { rotulo: 'Valor', numerica: true }], linhas },
    eixo: { x0: area.x0, x1: area.x1, d0: sx.dominio[0], d1: sx.dominio[1] },
    achado,
  }
}

function fmtCompactoCoef(v: number) {
  const a = Math.abs(v)
  if (a !== 0 && (a < 0.001 || a >= 1e5)) return v.toExponential(3).replace('.', ',')
  return numeroBr(n3(v))
}

// ---------------------------------------------------------------------------
// simpson
// ---------------------------------------------------------------------------

export function Simpson({ c, spec, largura }: { c: CtxCorrelacao; spec: SpecSimpson; largura: number }): ResultadoCorrelacao {
  if (!spec.pontos?.length) return semDados(spec.titulo, spec.dados, largura)
  const geral = spec.rotuloGeral ?? 'todos'
  const dentro = spec.rotuloDentro ?? 'dentro dos grupos'
  const nomeGrupo = spec.rotuloGrupo ?? 'grupo'
  const minimo = spec.minimoPorGrupo ?? 10
  const destaques = new Set(spec.destaquesGrupo ?? [])
  // Coefficients (t-space of the axes) from the points drawn.
  const G0 = geometria(spec.pontos, spec.x, spec.y, largura, spec.altura, 0)
  const base = G0.plotados.filter((q) => q.p.grupo !== undefined)
  const tx = base.map((q) => q.tx)
  const ty = base.map((q) => q.ty)
  const g = base.map((q) => q.p.grupo!)
  const rGeral = pearson(tx, ty)
  const rDentro = correlacaoDentro(tx, ty, g)
  const nomes = [...new Set(g)].sort()
  const porGrupo = nomes.map((nome) => {
    const idx = base.map((q, i) => (q.p.grupo === nome ? i : -1)).filter((i) => i >= 0)
    const gx = idx.map((i) => tx[i]!)
    const gy = idx.map((i) => ty[i]!)
    const ordenado = [...gx].sort((a, b) => a - b)
    return { nome, n: idx.length, r: pearson(gx, gy), reta: idx.length >= minimo ? minimosQuadrados(gx, gy) : null, mx: media(gx), my: media(gy), t0: quantil(ordenado, 0.1), t1: quantil(ordenado, 0.9) }
  })
  const rEntre = pearson(porGrupo.map((q) => q.mx), porGrupo.map((q) => q.my))
  const retaGeral = minimosQuadrados(tx, ty)
  const inverte = rGeral !== null && rDentro !== null && Math.sign(rGeral) !== Math.sign(rDentro) && Math.abs(rDentro) >= 0.0005
  const ok = confere(spec.coeficienteGeral, rGeral) && confere(spec.coeficienteDentro, rDentro) && confere(spec.coeficienteEntre, rEntre)

  const achadoCor = corAchado(c)
  const chaves: Array<{ amostra: AmostraLegenda; texto: string; cor?: CorDado }> = [
    { amostra: { tipo: 'linha', cor: 'tinta', largura: 0.75 }, texto: `${geral}: r = ${rGeral === null ? '—' : fmtCoef(rGeral)}`, cor: 'tinta' },
    { amostra: { tipo: 'linha', cor: achadoCor, largura: 0.4, tracejada: true }, texto: `${dentro}: r = ${rDentro === null ? '—' : fmtCoef(rDentro)}`, cor: achadoCor },
  ]
  if (spec.medias) chaves.push({ amostra: { tipo: 'ponto', cor: 'tinta', cheio: false }, texto: `média de cada ${nomeGrupo}: r = ${rEntre === null ? '—' : fmtCoef(rEntre)}` })
  const cab = Legenda({ c, itens: chaves, largura, y: 2.4 })
  const G = geometria(spec.pontos, spec.x, spec.y, largura, spec.altura, cab.fim)
  const { W, H, area, sx, sy, plotados } = G
  const nTotal = plotados.length
  const r = nTotal > 1500 ? 0.34 : nTotal > 400 ? 0.48 : 0.6
  const opac = nTotal > 3000 ? 0.5 : nTotal > 1500 ? 0.6 : 0.75

  const linhaGrupo = (q: (typeof porGrupo)[number], k: number) => {
    if (!q.reta) return null
    const seg = segmento(q.reta.a, q.reta.b, q.t0, q.t1, sy)
    if (!seg) return null
    const [ta, ya, tb, yb] = seg
    const d = destaques.has(q.nome)
    const X1 = sx.deT(ta)
    const Y1 = sy.deT(ya)
    const X2 = sx.deT(tb)
    const Y2 = sy.deT(yb)
    return (
      <g key={`lg-${k}`} className="ty-print-g-reta-grupo" data-grupo={q.nome} data-a={q.reta.a} data-b={q.reta.b} data-x1={X1} data-y1={Y1} data-x2={X2} data-y2={Y2} data-destaque={d ? '' : undefined} strokeDasharray={d ? undefined : '1.1 0.6'} style={d ? undefined : { opacity: 0.7 }}>
        {c.p.linha(c, { chave: `lg-${q.nome}`, x1: X1, y1: Y1, x2: X2, y2: Y2, cor: achadoCor, largura: d ? 0.55 : 0.28, tipo: 'serie' })}
        {d ? (
          <text className="ty-print-g-rotulo" x={n3(Math.min(area.x1 - larguraTexto(`${q.nome} +0,00`), X2 + 0.8))} y={n3(Y2 + 0.8)} style={{ ...HALO, fill: cssCor(achadoCor), fontSize: TEXTO }}>
            {`${q.nome} ${q.r === null ? '' : fmtCoef(q.r, 2)}`}
          </text>
        ) : null}
      </g>
    )
  }
  let geralEl: ReactNode = null
  if (retaGeral) {
    const seg = segmento(retaGeral.a, retaGeral.b, Math.min(...tx), Math.max(...tx), sy)
    if (seg) {
      const [ta, ya, tb, yb] = seg
      const X1 = sx.deT(ta)
      const Y1 = sy.deT(ya)
      const X2 = sx.deT(tb)
      const Y2 = sy.deT(yb)
      geralEl = (
        <g className="ty-print-g-tendencia" data-a={retaGeral.a} data-b={retaGeral.b} data-x1={X1} data-y1={Y1} data-x2={X2} data-y2={Y2}>
          {c.p.linha(c, { chave: 'geral', x1: X1, y1: Y1, x2: X2, y2: Y2, cor: 'tinta', largura: 0.75, tipo: 'serie' })}
          {(() => {
            const texto = `${geral}: r = ${rGeral === null ? '—' : fmtCoef(rGeral)}`
            const lugar = lugarRotulo(X1, Y1, X2, Y2, larguraTexto(texto, TEXTO * 1.05) * 1.08, plotados, area)
            return (
              <text className="ty-print-g-valor ty-print-g-coef" x={lugar.x} y={lugar.y} data-coef={rGeral === null ? '' : n3(rGeral)} style={HALO}>
                {texto}
              </text>
            )
          })()}
        </g>
      )
    }
  }
  const corpo = (
    <>
      {cab.el}
      <Eixos c={c} sx={sx} sy={sy} area={area} ex={spec.x} ey={spec.y} W={W} H={H} amplitude={amplitudeDe(plotados)} />
      <g className="ty-print-g-area" data-x0={area.x0} data-x1={area.x1} data-y0={area.y0} data-y1={area.y1} data-dx0={sx.dominio[0]} data-dx1={sx.dominio[1]} data-dy0={sy.dominio[0]} data-dy1={sy.dominio[1]} data-r-geral={rGeral ?? ''} data-r-dentro={rDentro ?? ''} data-r-entre={rEntre ?? ''} />
      <g className="ty-print-g-nuvem" data-modo="pontos" style={{ opacity: opac }} filter={filtroCamada(c)}>
        {plotados.filter((q) => !destaques.has(q.p.grupo ?? '')).map((q) => marcaLeve(c, q.i, q.X, q.Y, r, 'contexto'))}
      </g>
      {destaques.size ? (
        <g className="ty-print-g-nuvem-destaque" style={{ opacity: Math.min(1, opac + 0.3) }} filter={filtroCamada(c)}>
          {plotados.filter((q) => destaques.has(q.p.grupo ?? '')).map((q) => marcaLeve(c, q.i, q.X, q.Y, r, achadoCor))}
        </g>
      ) : null}
      <g className="ty-print-g-retas-grupo">{porGrupo.filter((q) => !destaques.has(q.nome)).map(linhaGrupo)}</g>
      {spec.medias ? (
        <g className="ty-print-g-medias">
          {porGrupo.map((q, k) => {
            const X = sx.deT(q.mx)
            const Y = sy.deT(q.my)
            return (
              <g key={k} className="ty-print-g-media" data-grupo={q.nome} data-cx={X} data-cy={Y} transform={`translate(${X} ${Y})`}>
                {c.p.ponto(c, { chave: `m-${q.nome}`, r: 0.75, cor: 'tinta', cheio: false })}
              </g>
            )
          })}
        </g>
      ) : null}
      {geralEl}
      <g className="ty-print-g-retas-grupo-destaque">{porGrupo.filter((q) => destaques.has(q.nome)).map(linhaGrupo)}</g>
      <text className="ty-print-g-chave" x={W} y={n3(cab.fim + 2.6)} textAnchor="end">
        {`n = ${numeroBr(base.length)} municípios · ${porGrupo.filter((q) => q.reta).length} retas por ${nomeGrupo}${inverte ? ' · o sinal se inverte' : ''}`}
      </text>
      {!ok ? <Aviso x={area.x0 + 1} y={n3(area.y0 + TEXTO)} texto="coeficiente publicado ≠ calculado dos pontos" /> : null}
    </>
  )
  const linhas: Array<Array<string | number>> = [
    [geral, numeroBr(base.length), rGeral === null ? '—' : fmtCoef(rGeral), '', ''],
    [dentro, numeroBr(base.length), rDentro === null ? '—' : fmtCoef(rDentro), '', ''],
    [`Médias por ${nomeGrupo} (entre)`, numeroBr(porGrupo.length), rEntre === null ? '—' : fmtCoef(rEntre), '', ''],
    ...porGrupo.map((q) => [q.nome, numeroBr(q.n), q.r === null ? '—' : fmtCoef(q.r), fmtCompacto(spec.x.log ? Math.exp(q.mx) : q.mx), fmtCompacto(spec.y.log ? Math.exp(q.my) : q.my)]),
  ]
  const achado = `${spec.y.rotulo} × ${spec.x.rotulo}: r = ${rGeral === null ? '—' : fmtCoef(rGeral)} em ${geral}, mas ${rDentro === null ? '—' : fmtCoef(rDentro)} ${dentro}${inverte ? ': o sinal se inverte (paradoxo de Simpson)' : ''}.`
  return {
    L: { largura: W, altura: H },
    corpo,
    tabela: { colunas: [nomeGrupo, { rotulo: 'n', numerica: true }, { rotulo: 'r', numerica: true }, { rotulo: `média de ${spec.x.rotulo}`, numerica: true }, { rotulo: `média de ${spec.y.rotulo}`, numerica: true }], linhas },
    eixo: { x0: area.x0, x1: area.x1, d0: sx.dominio[0], d1: sx.dominio[1] },
    achado,
  }
}

// ---------------------------------------------------------------------------
// matriz-correlacao
// ---------------------------------------------------------------------------

/** Ink strength of a cell: 0 at r = 0 (neutral grey only), 1 at |r| = 1. */
export function intensidadeCelula(r: number) {
  return n3(Math.min(1, Math.abs(r)))
}

function celula(c: CtxCorrelacao, k: string, x: number, y: number, w: number, h: number, r: number): ReactNode {
  const cor: CorDado = r >= 0 ? 'destaque' : 'destaque-2'
  const a = intensidadeCelula(r)
  const cs = cssCor(cor)
  const fundo = <rect x={x} y={y} width={w} height={h} style={{ fill: 'var(--ty-print-contexto)', fillOpacity: 0.28 }} />
  if (c.p.nome === 'pontos' || c.p.nome === 'isotype') {
    // area ∝ |r|
    const s = Math.sqrt(a)
    const hachuraN = r < 0 && a > 0.05 ? <rect x={x} y={y} width={w} height={h} style={{ fill: `url(#${c.id}-neg)` }} /> : null
    const forma =
      c.p.nome === 'pontos' ? (
        <circle cx={n3(x + w / 2)} cy={n3(y + h / 2)} r={n3((Math.min(w, h) / 2) * 0.92 * s)} style={{ fill: cs, fillOpacity: 0.85 }} />
      ) : (
        <rect x={n3(x + (w - w * 0.92 * s) / 2)} y={n3(y + (h - h * 0.92 * s) / 2)} width={n3(w * 0.92 * s)} height={n3(h * 0.92 * s)} style={{ fill: cs, fillOpacity: 0.85 }} />
      )
    return (
      <g data-intensidade={a}>
        {fundo}
        {forma}
        {hachuraN}
      </g>
    )
  }
  const filtro = filtroCamada(c)
  // Negative cells also carry a light hatch, so the sign survives grey printing (both poles turn dark).
  const hachura = r < 0 && a > 0.05 ? <rect x={x} y={y} width={w} height={h} style={{ fill: `url(#${c.id}-neg)` }} /> : null
  const tinta = (
    <>
      <rect x={x} y={y} width={w} height={h} filter={filtro} style={{ fill: cs, fillOpacity: a }} />
      {hachura}
    </>
  )
  if (c.p.nome === 'mao' || c.p.nome === 'prancheta') {
    const tr = c.p.nome === 'mao' ? tracar({ k: 'retangulo', x: 0, y: 0, w: 100, h: (100 * h) / w }, `cel-${k}`, { roughness: 0.8, maxRandomnessOffset: 1, bowing: 0.6, strokeWidth: n3((0.15 * 100) / w), stroke: 'var(--ty-print-tinta-3)' }) : null
    return (
      <g data-intensidade={a}>
        {fundo}
        {tinta}
        {tr ? (
          <g transform={`translate(${x} ${y}) scale(${n3(w / 100)})`}>
            {tr.map((t, j) => (
              <path key={j} d={t.d} style={{ stroke: t.stroke, strokeWidth: t.strokeWidth, fill: 'none' }} />
            ))}
          </g>
        ) : (
          <rect x={x} y={y} width={w} height={h} style={{ fill: 'none', stroke: 'var(--ty-print-tinta-3)', strokeWidth: 0.1 }} />
        )}
      </g>
    )
  }
  return (
    <g data-intensidade={a}>
      {fundo}
      {tinta}
    </g>
  )
}

export function MatrizCorrelacao({ c, spec, largura }: { c: CtxCorrelacao; spec: SpecMatrizCorrelacao; largura: number }): ResultadoCorrelacao {
  if (!spec.indicadores?.length || !spec.valores?.length) return semDados(spec.titulo, spec.dados, largura)
  const k = spec.indicadores.length
  const inferior = (spec.triangulo ?? 'inferior') === 'inferior'
  const linhasIdx = inferior ? Array.from({ length: k - 1 }, (_, i) => i + 1) : Array.from({ length: k }, (_, i) => i)
  const colunasIdx = inferior ? Array.from({ length: k - 1 }, (_, i) => i) : Array.from({ length: k }, (_, i) => i)
  const casas = spec.casas ?? 2
  const wRot = n3(Math.min(largura * 0.34, Math.max(...linhasIdx.map((i) => larguraTexto(spec.indicadores[i]!, TEXTO))) + 2))
  const x0 = wRot
  const cw = n3((largura - x0) / colunasIdx.length)
  const cabecas = colunasIdx.map((j) => quebrar(spec.indicadores[j]!, cw * 0.9, TEXTO_PEQUENO))
  const nCab = Math.max(...cabecas.map((l) => l.length))
  const y0 = n3(2 + nCab * TEXTO_PEQUENO * 1.2 + 1)
  const ch = n3(Math.min(cw * 0.62, 8.5))
  const destaque = new Set((spec.destaques ?? []).flatMap(([a, b]) => [`${a},${b}`, `${b},${a}`]))
  const celulas: ReactNode[] = []
  const rotulos: ReactNode[] = []
  linhasIdx.forEach((i, li) => {
    const y = n3(y0 + li * ch)
    rotulos.push(
      <text key={`r${i}`} className="ty-print-g-rotulo" x={n3(x0 - 1.2)} y={n3(y + ch / 2 + 0.85)} textAnchor="end">
        {spec.indicadores[i]}
      </text>,
    )
    colunasIdx.forEach((j, cj) => {
      if (inferior && j >= i) return
      const r = spec.valores[i]?.[j]
      if (r === undefined || !Number.isFinite(r)) return
      const x = n3(x0 + cj * cw)
      const forte = intensidadeCelula(r) >= 0.5 && c.p.nome !== 'pontos' && c.p.nome !== 'isotype'
      celulas.push(
        <g key={`c${i}-${j}`} className="ty-print-g-celula" data-linha={i} data-coluna={j} data-r={r} data-x={x} data-y={y} data-w={cw} data-h={ch}>
          {celula(c, `${i}-${j}`, n3(x + 0.25), n3(y + 0.25), n3(cw - 0.5), n3(ch - 0.5), r)}
          {destaque.has(`${i},${j}`) ? <rect x={n3(x + 0.1)} y={n3(y + 0.1)} width={n3(cw - 0.2)} height={n3(ch - 0.2)} style={{ fill: 'none', stroke: 'var(--ty-print-tinta)', strokeWidth: 0.4 }} /> : null}
          <text className="ty-print-g-valor" x={n3(x + cw / 2)} y={n3(y + ch / 2 + 0.85)} textAnchor="middle" style={forte ? { fill: 'var(--ty-print-papel)' } : c.p.nome === 'pontos' || c.p.nome === 'isotype' ? HALO : undefined}>
            {i === j ? '1' : fmtCoef(r, casas)}
          </text>
        </g>,
      )
    })
  })
  const cab = colunasIdx.map((j, cj) => (
    <text key={`h${j}`} className="ty-print-g-eixo-texto" x={n3(x0 + cj * cw + cw / 2)} y={n3(2 + (nCab - cabecas[cj]!.length) * TEXTO_PEQUENO * 1.2)} textAnchor="middle" style={{ fill: 'var(--ty-print-tinta-2)' }}>
      {cabecas[cj]!.map((l, t) => (
        <tspan key={t} x={n3(x0 + cj * cw + cw / 2)} dy={t === 0 ? 0 : n3(TEXTO_PEQUENO * 1.2)}>
          {l}
        </tspan>
      ))}
    </text>
  ))
  // Diverging key: −1 … 0 … +1
  const yK = n3(y0 + linhasIdx.length * ch + 3.2)
  const passos = 20
  const wK = Math.min(64, largura - x0)
  const xK = n3(x0)
  const chave = (
    <g className="ty-print-g-escala-divergente">
      {Array.from({ length: passos + 1 }, (_, s) => {
        const r = -1 + (2 * s) / passos
        const w = wK / (passos + 1)
        return <g key={s}>{celula(c, `k${s}`, n3(xK + s * w), yK, n3(w + 0.02), 2.4, r)}</g>
      })}
      {[-1, -0.5, 0, 0.5, 1].map((v) => (
        <text key={v} className="ty-print-g-eixo-texto" x={n3(xK + ((v + 1) / 2) * (wK - wK / (passos + 1)) + wK / (passos + 1) / 2)} y={n3(yK + 5)} textAnchor="middle">
          {v === 0 ? '0' : fmtCoef(v, 1)}
        </text>
      ))}
      <text className="ty-print-g-chave" x={xK} y={n3(yK + 8.2)}>
        {`${spec.metodo ?? 'r de Pearson'} · cinza = sem correlação · negativo = hachurado`}
      </text>
    </g>
  )
  const H = n3(yK + 9.8)
  // Strongest off-diagonal pair, for the finding.
  let melhor: [number, number, number] | null = null
  for (let i = 0; i < k; i++)
    for (let j = 0; j < i; j++) {
      const r = spec.valores[i]?.[j]
      if (r !== undefined && Number.isFinite(r) && (!melhor || Math.abs(r) > Math.abs(melhor[2]))) melhor = [i, j, r]
    }
  const achado = melhor
    ? `Correlações entre ${k} indicadores; a mais forte é ${spec.indicadores[melhor[0]]} × ${spec.indicadores[melhor[1]]} (r = ${fmtCoef(melhor[2], casas)}).`
    : `Correlações entre ${k} indicadores.`
  return {
    L: { largura, altura: H },
    corpo: (
      <>
        <defs>
          <pattern id={`${c.id}-neg`} width={1.2} height={1.2} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={1.2} style={{ stroke: 'var(--ty-print-papel)', strokeWidth: 0.28, strokeOpacity: 0.55 }} />
          </pattern>
        </defs>
        {cab}
        {rotulos}
        {celulas}
        {chave}
      </>
    ),
    tabela: {
      colunas: ['', ...spec.indicadores.map((t) => ({ rotulo: t, numerica: true }))],
      linhas: spec.indicadores.map((t, i) => [t, ...spec.indicadores.map((_, j) => (i === j ? '1' : spec.valores[i]?.[j] === undefined ? '—' : `${fmtCoef(spec.valores[i]![j]!, casas)}${spec.n?.[i]?.[j] ? ` (n = ${numeroBr(spec.n[i]![j]!)})` : ''}`))]),
    },
    eixo: null,
    achado,
  }
}

// ---------------------------------------------------------------------------
// antes-depois-controle
// ---------------------------------------------------------------------------

export function AntesDepoisControle({ c, spec, largura }: { c: CtxCorrelacao; spec: SpecAntesDepoisControle; largura: number }): ResultadoCorrelacao {
  const escala = spec.escala ?? [-1, 1]
  const colRot = n3(Math.min(largura * 0.36, Math.max(14, ...spec.linhas.map((l) => larguraTexto(l.rotulo, TEXTO * 1.04)), ...spec.linhas.map((l) => (l.nota ? larguraTexto(l.nota, TEXTO_PEQUENO * 1.12) : 0))) + 3))
  const x0 = n3(colRot + 6)
  const x1 = n3(largura - 8)
  const sx = escalaEixo(escala, [x0, x1])
  const cab = Legenda({
    c,
    itens: [
      { amostra: { tipo: 'ponto', cor: 'tinta', cheio: false }, texto: spec.rotuloBruto },
      { amostra: { tipo: 'ponto', cor: corAchado(c), cheio: true }, texto: spec.rotuloControlado },
    ],
    largura,
    y: 2.4,
  })
  const topo = n3(cab.fim + 3.4)
  const passo = 7.4
  const raio = 0.95
  const linhasL = spec.linhas.map((l, i) => {
    const y = n3(topo + 2.6 + i * passo)
    return { ...l, i, y, xa: sx(l.bruto), xb: sx(l.controlado), inverte: Math.sign(l.bruto) !== Math.sign(l.controlado) && l.controlado !== 0 && l.bruto !== 0 }
  })
  const yEixo = n3((linhasL[linhasL.length - 1]?.y ?? topo) + 3.6)
  const marcas = marcasEixo(escala, Math.max(3, Math.floor((x1 - x0) / 16)))
  const zeroDentro = escala[0] < 0 && escala[1] > 0
  const H = n3(yEixo + 7.4)
  const corpo = (
    <>
      {cab.el}
      <g className="ty-print-g-eixo">
        {marcas.map((v) => (
          <g key={v}>
            <g className="ty-print-grade">{c.p.linha(c, { chave: `g-${v}`, x1: sx(v), y1: topo, x2: sx(v), y2: yEixo, cor: 'linha', largura: 0.12, tipo: 'grade' })}</g>
            <text className="ty-print-g-eixo-texto" x={sx(v)} y={n3(yEixo + 2.7)} textAnchor="middle">
              {v === 0 ? '0' : fmtCoef(v, v % 1 === 0 ? 0 : String(v).split('.')[1]!.length)}
            </text>
          </g>
        ))}
        {c.p.linha(c, { chave: 'eixo', x1: x0, y1: yEixo, x2: x1, y2: yEixo, cor: 'tinta-2', largura: 0.2, tipo: 'eixo' })}
        {zeroDentro ? <g className="ty-print-g-zero">{c.p.linha(c, { chave: 'zero', x1: sx(0), y1: n3(topo - 1), x2: sx(0), y2: yEixo, cor: 'tinta', largura: 0.35, tipo: 'guia' })}</g> : null}
        <text className="ty-print-g-unidade" x={x1} y={n3(yEixo + 5.6)} textAnchor="end">
          {spec.medida ?? 'coeficiente de correlação'}
        </text>
        {zeroDentro ? (
          <text className="ty-print-g-nota" x={n3(sx(0) + 0.8)} y={n3(topo - 0.2)}>
            sem correlação
          </text>
        ) : null}
      </g>
      {linhasL.map((l) => {
        const esq = Math.min(l.xa, l.xb)
        const dir = Math.max(l.xa, l.xb)
        const paraDireita = l.xb >= l.xa
        const off = raio + 0.9
        const cor: CorDado = corAchado(c)
        return (
          <g key={l.i} className="ty-print-g-linha" data-linha={l.i} data-destaque={l.destaque ? '' : undefined}>
            <text className="ty-print-g-rotulo" x={0} y={n3(l.y + 0.9)}>
              {l.rotulo}
            </text>
            {l.nota ? (
              <text className="ty-print-g-nota" x={0} y={n3(l.y + 0.9 + TEXTO * 1.15)}>
                {l.nota}
              </text>
            ) : null}
            {dir - esq > 2 * raio + 0.6 ? (
              <g className="ty-print-conector">
                {c.p.linha(c, { chave: `con-${l.i}`, x1: n3(l.xa + (paraDireita ? raio : -raio)), y1: l.y, x2: n3(l.xb + (paraDireita ? -raio - 0.4 : raio + 0.4)), y2: l.y, cor, largura: l.destaque ? 0.6 : 0.4, tipo: 'conector' })}
                <path d={`M${n3(l.xb + (paraDireita ? -raio - 0.2 : raio + 0.2))} ${l.y}l${paraDireita ? -1.1 : 1.1} -0.75v1.5Z`} style={{ fill: cssCor(cor) }} />
              </g>
            ) : null}
            <g className="ty-print-ponto" data-linha={l.i} data-serie="bruto" data-valor={l.bruto} data-cx={l.xa} data-cy={l.y} transform={`translate(${l.xa} ${l.y})`}>
              {c.p.ponto(c, { chave: `a-${l.i}`, r: raio, cor: 'tinta', cheio: false })}
            </g>
            <g className="ty-print-ponto" data-linha={l.i} data-serie="controlado" data-valor={l.controlado} data-cx={l.xb} data-cy={l.y} transform={`translate(${l.xb} ${l.y})`}>
              {c.p.ponto(c, { chave: `b-${l.i}`, r: raio, cor, cheio: true })}
            </g>
            <text className="ty-print-g-valor-a" x={n3(l.xa + (paraDireita ? -off : off))} y={n3(l.y + 0.85)} textAnchor={paraDireita ? 'end' : 'start'} style={HALO}>
              {fmtCoef(l.bruto)}
            </text>
            <text className="ty-print-g-valor" x={n3(l.xb + (paraDireita ? off : -off))} y={n3(l.y + 0.85)} textAnchor={paraDireita ? 'start' : 'end'} style={{ ...HALO, fill: cssCor(cor) }}>
              {fmtCoef(l.controlado)}
            </text>
            {l.inverte ? (
              // Under the row, from the controlled point, so it never meets the zero line's label.
              <text className="ty-print-g-nota" x={l.xb} y={n3(l.y + raio + 2.4)} textAnchor={paraDireita ? 'start' : 'end'} style={{ ...HALO, fill: cssCor(cor) }}>
                o sinal se inverte
              </text>
            ) : null}
          </g>
        )
      })}
    </>
  )
  const achado = spec.linhas.map((l) => `${l.rotulo}: ${fmtCoef(l.bruto)} ${spec.rotuloBruto} → ${fmtCoef(l.controlado)} ${spec.rotuloControlado}`).join('; ') + '.'
  return {
    L: { largura, altura: H },
    corpo,
    tabela: {
      colunas: ['Correlação', { rotulo: spec.rotuloBruto, numerica: true }, { rotulo: spec.rotuloControlado, numerica: true }, { rotulo: 'diferença', numerica: true }],
      linhas: spec.linhas.map((l) => [l.nota ? `${l.rotulo} (${l.nota})` : l.rotulo, fmtCoef(l.bruto), fmtCoef(l.controlado), fmtCoef(n3(l.controlado - l.bruto))]),
    },
    eixo: { x0, x1, d0: escala[0], d1: escala[1] },
    achado,
  }
}

