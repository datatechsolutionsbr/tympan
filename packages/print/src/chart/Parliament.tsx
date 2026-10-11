// Hemiciclo: seats of a chamber by party, as a half-circle of dots (the
// parliament chart). Every seat is one dot; parties fill the arc left to
// right in the given order. Colours come from the style's qualitative palette
// (--ty-print-categorica-N) and in P&B each party alternates fill and outline
// on top of its grey; the legend always prints the party and its seat count,
// so state never rests on colour alone.
import { usePrint } from '../context.tsx'
import { comColchetes } from '../panels/common.tsx'
import { TabelaDados } from '../panels/Method.tsx'
import { cx, r3 } from '../utils.ts'

export interface Bancada {
  sigla: string
  assentos: number
  /** Colour override (else the style's categorical colour in order). */
  cor?: string
}

export interface HemicicloProps {
  titulo?: string
  alt: string
  bancadas: Bancada[]
  /** Width in mm (default 80). */
  largura?: number
  /** Rows of seats (default: chosen from the total). */
  fileiras?: number
  /** Majority line (e.g. 257 of 513): a tick at the seat that reaches it. */
  maioria?: number
  className?: string
}

export interface Assento {
  x: number
  y: number
  fileira: number
  angulo: number
}

/** Seat positions of a half-circle with `total` seats in `fileiras` rows (unit radius 1, centre 0,0, y up). */
export function layoutHemiciclo(total: number, fileiras?: number): Assento[] {
  const R = fileiras ?? Math.max(1, Math.min(16, Math.round(Math.sqrt(total / 4))))
  const r0 = R === 1 ? 1 : 0.4
  const raios = Array.from({ length: R }, (_, i) => (R === 1 ? 1 : r0 + ((1 - r0) * i) / (R - 1)))
  const soma = raios.reduce((a, b) => a + b, 0)
  const cotas = raios.map((r) => (total * r) / soma)
  const n = cotas.map(Math.floor)
  let falta = total - n.reduce((a, b) => a + b, 0)
  const ordem = cotas.map((c, i) => [c - Math.floor(c), i] as const).sort((a, b) => b[0] - a[0] || b[1] - a[1])
  for (const [, i] of ordem) if (falta-- > 0) n[i]! += 1
  const out: Assento[] = []
  raios.forEach((r, i) => {
    const k = n[i]!
    for (let j = 0; j < k; j++) {
      const a = k === 1 ? Math.PI / 2 : Math.PI - (Math.PI * j) / (k - 1)
      out.push({ x: r * Math.cos(a), y: r * Math.sin(a), fileira: i, angulo: a })
    }
  })
  // Fill left to right: by angle (descending), outer rows first at equal angle.
  return out.sort((p, q) => q.angulo - p.angulo || q.fileira - p.fileira)
}

/** Parliament chart: one dot per seat, parties in order around the arc, with the seat count in the legend. */
export function Hemiciclo({ titulo, alt, bancadas, largura = 80, fileiras, maioria, className }: HemicicloProps) {
  const { pb } = usePrint()
  const total = bancadas.reduce((t, b) => t + b.assentos, 0)
  const assentos = layoutHemiciclo(total, fileiras)
  const R = fileiras ?? Math.max(1, Math.min(16, Math.round(Math.sqrt(total / 4))))
  const W = largura
  const raio = W / 2 - 1
  const passo = R > 1 ? (raio * 0.6) / (R - 1) : raio * 0.2
  const rp = r3(Math.min(passo * 0.42, (Math.PI * raio) / Math.max(1, assentos.filter((a) => a.fileira === R - 1).length) * 0.42))
  const H = r3(raio + rp + 1)
  const cor = (i: number, b: Bancada) => (b.cor && !pb ? b.cor : `var(--ty-print-categorica-${(i % 8) + 1})`)
  let k = 0
  const pontos = bancadas.flatMap((b, i) =>
    Array.from({ length: b.assentos }, () => {
      const a = assentos[k++]!
      return { a, b, i, n: k }
    }),
  )
  const corte = maioria && maioria <= total ? assentos[maioria - 1] : undefined
  return (
    <figure className={cx('ty-print-figure', 'ty-print-parliament', className)} data-assentos={total}>
      {titulo ? (
        <figcaption className="ty-print-figure-head">
          <span className="ty-print-figure-title">{comColchetes(titulo)}</span>
        </figcaption>
      ) : null}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={alt} style={{ maxInlineSize: `${W}mm`, aspectRatio: `${W} / ${H}` }}>
        <title>{alt}</title>
        <desc>{bancadas.map((b) => `${b.sigla}: ${b.assentos}`).join('; ')}</desc>
        {pontos.map(({ a, b, i, n }) => {
          const vazado = pb && i % 2 === 1
          return (
            <circle
              key={n}
              data-sigla={b.sigla}
              cx={r3(W / 2 + a.x * raio)}
              cy={r3(H - 1 - a.y * raio)}
              r={rp}
              style={vazado ? { fill: 'var(--ty-print-papel)', stroke: cor(i, b), strokeWidth: r3(rp * 0.45) } : { fill: cor(i, b) }}
            />
          )
        })}
        {corte ? <line className="ty-print-parliament-majority" x1={W / 2} y1={r3(H - 1)} x2={r3(W / 2 + corte.x * (raio + rp))} y2={r3(H - 1 - corte.y * (raio + rp))} style={{ stroke: 'var(--ty-print-tinta)', strokeWidth: 0.2, strokeDasharray: '0.6 0.4' }} /> : null}
        <text className="ty-print-parliament-total" x={W / 2} y={r3(H - 2)} textAnchor="middle">
          {total}
        </text>
      </svg>
      <ul className="ty-print-map-legend" data-escala="categorica">
        {bancadas.map((b, i) => (
          <li key={b.sigla}>
            <svg viewBox="0 0 6 6" aria-hidden="true" focusable="false">
              <circle cx={3} cy={3} r={pb && i % 2 === 1 ? 2.2 : 2.8} style={pb && i % 2 === 1 ? { fill: 'none', stroke: cor(i, b), strokeWidth: 1.2 } : { fill: cor(i, b) }} />
            </svg>
            {b.sigla} {b.assentos}
          </li>
        ))}
      </ul>
      <div className="ty-print-sr">
        <TabelaDados titulo={titulo ? `Dados: ${titulo}` : 'Assentos por partido'} colunas={['Partido', { rotulo: 'Assentos', numerica: true }]} linhas={bancadas.map((b) => [b.sigla, b.assentos])} />
      </div>
    </figure>
  )
}
