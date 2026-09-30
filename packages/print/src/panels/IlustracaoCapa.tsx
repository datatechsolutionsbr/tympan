// Cover illustrations of the collection's cover system (board L6 of the Brasil Real collection artefact):
// one schematic image per volume, drawn tone on tone in the cover ink with the style's own renderer (rough
// pencil in the caderno, woodcut in the cordel, crisp lines elsewhere). Illustration, not data: no axis, no
// value, and an accessible name that says so.
import type { ReactNode } from 'react'
import { usePrint } from '../context.tsx'
import { PINCEIS, type CtxPincel, type Pincel } from '../chart/brushes.tsx'
import { useIdSeguro } from '../utils.ts'

export type MotivoCapa = 'estudo-de-evento' | 'moeda' | 'escada' | 'virada' | 'aperto' | 'pacto'

export const DESCRICAO_MOTIVO: Record<MotivoCapa, string> = {
  'estudo-de-evento': 'Esquema de estudo de evento: pontos com intervalo antes e depois da linha vertical da data da lei. Ilustração, não é dado.',
  moeda: 'A inflação que para: uma linha que oscila e se estabiliza. Ilustração, não é dado.',
  escada: 'Uma escada que sobe. Ilustração, não é dado.',
  virada: 'Uma curva que sobe até um pico e desce. Ilustração, não é dado.',
  aperto: 'Faixas que se estreitam no meio: o meio espremido. Ilustração, não é dado.',
  pacto: 'Uma grade de círculos cheios, vazios e pequenos: quem ganha e quem perde. Ilustração, não é dado.',
}

interface Ctx extends CtxPincel {
  p: Pincel
}

const W = 200
const H = 170

function corpo(c: Ctx, motivo: MotivoCapa): ReactNode[] {
  const out: ReactNode[] = []
  const linha = (k: string, x1: number, y1: number, x2: number, y2: number, largura = 1.5, tipo: 'guia' | 'serie' | 'eixo' = 'serie') =>
    out.push(<g key={k}>{c.p.linha(c, { chave: k, x1, y1, x2, y2, cor: 'linha', largura, tipo })}</g>)
  const ponto = (k: string, x: number, y: number, r: number, cheio = true) =>
    out.push(
      <g key={k} transform={`translate(${x} ${y})`}>
        {c.p.ponto(c, { chave: k, r, cor: 'linha', cheio })}
      </g>,
    )
  if (motivo === 'estudo-de-evento') {
    out.push(<g key="base" opacity={0.5} strokeDasharray="3 3">{c.p.linha(c, { chave: 'base', x1: 8, y1: 90, x2: 196, y2: 90, cor: 'linha', largura: 1, tipo: 'guia' })}</g>)
    linha('lei', 90, 10, 90, 162, 1.8, 'guia')
    const pts: Array<[number, number, number]> = [[20, 92, 14], [40, 88, 12], [60, 91, 12], [80, 89, 10], [100, 78, 12], [120, 64, 12], [140, 55, 13], [160, 47, 14], [180, 42, 15]]
    pts.forEach(([x, y, e], i) => {
      out.push(<g key={`e${i}`} opacity={0.65}>{c.p.linha(c, { chave: `e${i}`, x1: x, y1: y - e, x2: x, y2: y + e, cor: 'linha', largura: 1, tipo: 'guia' })}</g>)
      ponto(`p${i}`, x, y, 4.2)
    })
  } else if (motivo === 'moeda') {
    out.push(<g key="anel" opacity={0.35}><circle cx={140} cy={86} r={50} fill="none" stroke="var(--ty-print-linha)" strokeWidth={1.5} /></g>)
    out.push(<g key="l">{c.p.caminho(c, { chave: 'l', pontos: [[8, 120], [14, 58], [20, 112], [26, 36], [32, 104], [38, 26], [44, 98], [50, 48], [56, 106], [62, 70], [68, 92], [74, 86], [196, 86]].map(([x, y]) => ({ x: x!, y: y! })), cor: 'linha', largura: 2.2 })}</g>)
  } else if (motivo === 'escada') {
    const xs = [10, 40, 70, 100, 130, 160, 196]
    for (let i = 0; i < 6; i++) {
      const y = 160 - i * 25
      out.push(<rect key={`r${i}`} x={xs[i]} y={y} width={xs[i + 1]! - xs[i]!} height={164 - y} fill="var(--ty-print-linha)" fillOpacity={0.06 + i * 0.03} />)
      linha(`h${i}`, xs[i]!, y, xs[i + 1]!, y, 2.2)
      if (i < 5) linha(`v${i}`, xs[i + 1]!, y, xs[i + 1]!, y - 25, 2.2)
      ponto(`p${i}`, (xs[i]! + xs[i + 1]!) / 2, y - 8, 4.5)
    }
  } else if (motivo === 'virada') {
    out.push(<path key="a" d="M8 150 C60 132 92 42 120 40 S172 116 196 136 L196 164 L8 164 Z" fill="var(--ty-print-linha)" fillOpacity={0.14} />)
    out.push(<g key="c">{c.p.caminho(c, { chave: 'c', pontos: [[8, 150], [60, 128], [95, 60], [120, 40], [150, 70], [172, 116], [196, 136]].map(([x, y]) => ({ x: x!, y: y! })), cor: 'linha', largura: 2.2 })}</g>)
    linha('pico', 120, 40, 120, 164, 1, 'guia')
    ponto('p', 120, 40, 5)
  } else if (motivo === 'aperto') {
    const ws = [176, 156, 126, 90, 44, 90, 126, 156, 176]
    ws.forEach((w, i) => out.push(<rect key={i} x={100 - w / 2} y={10 + i * 17.5} width={w} height={11} rx={2} fill="var(--ty-print-linha)" fillOpacity={i === 4 ? 0.9 : 0.46 - Math.abs(4 - i) * 0.03 - 0.12} />))
  } else {
    for (let j = 0; j < 7; j++)
      for (let i = 0; i < 9; i++) {
        const x = (j % 2 ? 28 : 18) + i * 20.5
        const y = 18 + j * 22
        const v = (i * 7 + j * 3) % 5
        if (v < 2) ponto(`g${j}-${i}`, x, y, 7)
        else if (v < 4) ponto(`o${j}-${i}`, x, y, 6.3, false)
        else ponto(`s${j}-${i}`, x, y, 3)
      }
  }
  return out
}

/** The volume's cover image (L6), in the style's renderer and the cover ink. */
export function IlustracaoCapa({ motivo }: { motivo: MotivoCapa }) {
  const { estilo } = usePrint()
  const id = useIdSeguro('ty-print-capa-arte')
  // Pictorial and dotted renderers would turn the points into icons or dot fields: the cover keeps them plain.
  const nome = estilo.grafico === 'isotype' || estilo.grafico === 'pontos' || estilo.grafico === 'riso' ? 'limpo' : estilo.grafico
  const c: Ctx = { id, estilo, p: PINCEIS[nome] }
  return (
    <svg className="ty-print-capa-ilustracao" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={DESCRICAO_MOTIVO[motivo]}>
      <defs>{c.p.defs(c)}</defs>
      {corpo(c, motivo)}
    </svg>
  )
}
