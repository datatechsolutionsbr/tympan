// Callouts drawn inside the chart (G3 of the style audit): handwritten notes
// with an arrow and the value circled (caderno), speech balloons (divulgação,
// Holmes) and text with a leader line (FT). They sit in a band above the plot
// that the layout reserves, point at the value they explain, and are wrapped
// conservatively so they never leave the figure. The note is text; the data
// still come from the marks.
import type { ReactNode } from 'react'
import { tracar } from '../rough.ts'
import { FOLGA_ANOTACAO, TEXTO, larguraTexto, quebrar } from './geometria.ts'
import { cssCor, type CorDado, type CtxPincel, type Pincel } from './pinceis.tsx'

export type EstiloChamada = 'manuscritas' | 'baloes' | 'guia'

interface Ctx extends CtxPincel {
  p: Pincel
}

export interface AlvoChamada {
  /** Point the callout points at (top of the value it explains), in mm. */
  x: number
  y: number
  texto: string
  /** The value label under the arrow, circled in handwritten notes. */
  valor?: { x: number; y: number; texto: string }
}

const n3 = (v: number) => Math.round(v * 1000) / 1000
const TAM = TEXTO * 1.02
const ENTRELINHA = TAM * 1.3
/** Room between the notes and the plot for the arrow or the balloon's tail. */
const PONTA = 4.2

function larguraNota(largura: number) {
  return Math.min(largura * 0.48, 58)
}

export interface NotaPosta {
  x: number
  y: number
  w: number
  linhas: string[]
  alvo: AlvoChamada
}

/**
 * Places the notes in the band above the plot: each note centred over its target when it fits, pushed
 * sideways off the previous one, or dropped to a new tier. Returns the band height and the notes.
 */
export function posicionarChamadas(alvos: AlvoChamada[], largura: number, estilo: EstiloChamada): { altura: number; notas: NotaPosta[] } {
  const wMax = larguraNota(largura)
  const pad = estilo === 'baloes' ? 1.2 : 0
  const notas: NotaPosta[] = []
  const niveis: Array<{ fim: number; altura: number }> = []
  for (const a of [...alvos].sort((p, q) => p.x - q.x)) {
    const linhas = quebrar(a.texto, (wMax - 2 * pad) * FOLGA_ANOTACAO, TAM)
    const w = Math.min(wMax, Math.max(...linhas.map((l) => larguraTexto(l, TAM))) / FOLGA_ANOTACAO + 2 * pad)
    const h = linhas.length * ENTRELINHA + 2 * pad
    let x = Math.min(largura - w, Math.max(0, estilo === 'guia' ? a.x - w : a.x - w / 2))
    let nivel = niveis.findIndex((nv) => nv.fim + 1.5 <= x)
    if (nivel < 0 && niveis.length) {
      // No tier with room at this x: try right after the last note of the first tier, else open a new tier.
      const xr = niveis[0]!.fim + 1.5
      if (xr + w <= largura) {
        x = xr
        nivel = 0
      }
    }
    if (nivel < 0) {
      nivel = niveis.length
      niveis.push({ fim: 0, altura: 0 })
    }
    niveis[nivel]!.fim = x + w
    niveis[nivel]!.altura = Math.max(niveis[nivel]!.altura, h)
    notas.push({ x: n3(x), y: nivel, w: n3(w), linhas, alvo: a })
  }
  // Tier index → y (top of the note).
  const tops: number[] = []
  let y = 0
  for (const nv of niveis) {
    tops.push(y)
    y += nv.altura + 1.2
  }
  for (const nt of notas) nt.y = n3(tops[nt.y]!)
  return { altura: n3(notas.length ? y + PONTA : 0), notas }
}

/** Hand-drawn ellipse whose tremble is a fraction of its size (traced at 10×, scaled down). */
function elipse(c: Ctx, chave: string, cx: number, cy: number, rx: number, ry: number, cor: CorDado, largura: number): ReactNode {
  const mao = c.p.nome === 'mao' || c.p.nome === 'gravura' || c.p.nome === 'aquarela' || c.p.nome === 'pontos'
  if (!mao) return <ellipse cx={n3(cx)} cy={n3(cy)} rx={n3(rx)} ry={n3(ry)} style={{ fill: 'none', stroke: cssCor(cor), strokeWidth: largura }} />
  const S = 10 / Math.max(0.5, ry)
  const tr = tracar({ k: 'elipse', cx: 0, cy: 0, w: n3(2 * rx * S), h: n3(2 * ry * S) }, chave, { roughness: 0.9, maxRandomnessOffset: 1.2, bowing: 0.8, strokeWidth: n3(largura * S), stroke: cssCor(cor) })
  return (
    <g transform={`translate(${n3(cx)} ${n3(cy)}) scale(${n3(1 / S)})`}>
      {tr.map((t, k) => (
        <path key={k} d={t.d} style={{ stroke: t.stroke, strokeWidth: t.strokeWidth, fill: 'none' }} strokeLinecap="round" />
      ))}
    </g>
  )
}

function ponta(x: number, y: number, dx: number, dy: number, cor: CorDado, largura: number) {
  // Arrowhead at (x, y) pointing along (dx, dy).
  const L = Math.hypot(dx, dy) || 1
  const ux = dx / L
  const uy = dy / L
  const a = 1.3
  const b = 0.7
  const p1 = [x - ux * a - uy * b, y - uy * a + ux * b]
  const p2 = [x - ux * a + uy * b, y - uy * a - ux * b]
  return <path d={`M${n3(p1[0]!)} ${n3(p1[1]!)}L${n3(x)} ${n3(y)}L${n3(p2[0]!)} ${n3(p2[1]!)}`} style={{ fill: 'none', stroke: cssCor(cor), strokeWidth: largura }} strokeLinecap="round" strokeLinejoin="round" />
}

/** Draws the notes placed by posicionarChamadas in the band that starts at `topo`. */
export function Chamadas({ c, estilo, notas, topo, cor }: { c: Ctx; estilo: EstiloChamada; notas: NotaPosta[]; topo: number; cor: CorDado }) {
  return (
    <g className="ty-print-g-chamadas" data-estilo={estilo}>
      {notas.map((nt, k) => {
        const pad = estilo === 'baloes' ? 1.2 : 0
        const x = nt.x
        const y = n3(topo + nt.y)
        const h = n3(nt.linhas.length * ENTRELINHA + 2 * pad)
        const alvo = nt.alvo
        const baseNota = n3(y + h)
        const xAncora = n3(Math.min(x + nt.w - 1, Math.max(x + 1, alvo.x)))
        const texto = (
          <text
            className={estilo === 'manuscritas' ? 'ty-print-g-anotacao-texto' : 'ty-print-g-chamada-texto'}
            x={estilo === 'guia' ? n3(x + nt.w) : estilo === 'baloes' ? n3(x + nt.w / 2) : x}
            y={n3(y + pad + TAM * 0.9)}
            textAnchor={estilo === 'guia' ? 'end' : estilo === 'baloes' ? 'middle' : 'start'}
            style={{ fontSize: TAM, fill: estilo === 'baloes' ? 'var(--ty-print-tinta)' : cssCor(cor), fontWeight: estilo === 'baloes' ? 700 : estilo === 'guia' ? 600 : 400 }}
          >
            {nt.linhas.map((l, i) => (
              <tspan key={i} x={estilo === 'guia' ? n3(x + nt.w) : estilo === 'baloes' ? n3(x + nt.w / 2) : x} dy={i === 0 ? 0 : ENTRELINHA}>
                {l}
              </tspan>
            ))}
          </text>
        )
        const destino = { x: alvo.x, y: n3(alvo.y - 0.6) }
        return (
          <g key={k} className="ty-print-g-chamada-nota" data-x={x} data-y={y} data-w={nt.w} data-h={h} data-alvo-x={alvo.x} data-alvo-y={alvo.y}>
            {estilo === 'baloes' ? (
              <>
                <path
                  d={`M${n3(x + 1.2)} ${y}H${n3(x + nt.w - 1.2)}Q${n3(x + nt.w)} ${y} ${n3(x + nt.w)} ${n3(y + 1.2)}V${n3(baseNota - 1.2)}Q${n3(x + nt.w)} ${baseNota} ${n3(x + nt.w - 1.2)} ${baseNota}H${n3(xAncora + 1.4)}L${destino.x} ${destino.y}L${n3(xAncora - 1.4)} ${baseNota}H${n3(x + 1.2)}Q${x} ${baseNota} ${x} ${n3(baseNota - 1.2)}V${n3(y + 1.2)}Q${x} ${y} ${n3(x + 1.2)} ${y}Z`}
                  style={{ fill: 'var(--ty-print-papel)', stroke: cssCor(cor), strokeWidth: 0.35 }}
                  strokeLinejoin="round"
                />
                {texto}
              </>
            ) : estilo === 'guia' ? (
              <>
                {texto}
                {c.p.linha(c, { chave: `guia-${k}`, x1: destino.x, y1: n3(baseNota + 0.6), x2: destino.x, y2: destino.y, cor, largura: 0.22, tipo: 'guia' })}
              </>
            ) : (
              <>
                {texto}
                {c.p.caminho(c, {
                  chave: `seta-${k}`,
                  pontos: [
                    { x: xAncora, y: n3(baseNota + 0.4) },
                    { x: n3((xAncora + destino.x) / 2 + (destino.x >= xAncora ? 2.4 : -2.4)), y: n3((baseNota + destino.y) / 2) },
                    { x: destino.x, y: n3(destino.y - 0.2) },
                  ],
                  cor,
                  largura: 0.3,
                })}
                {ponta(destino.x, n3(destino.y - 0.2), destino.x - ((xAncora + destino.x) / 2 + (destino.x >= xAncora ? 2.4 : -2.4)), destino.y - (baseNota + destino.y) / 2, cor, 0.3)}
                {alvo.valor ? elipse(c, `circ-${k}`, alvo.valor.x, n3(alvo.valor.y - TEXTO * 0.35), larguraTexto(alvo.valor.texto) / 2 + 1.4, TEXTO * 0.78, cor, 0.3) : null}
              </>
            )}
          </g>
        )
      })}
    </g>
  )
}
