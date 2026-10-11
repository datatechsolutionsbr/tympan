// Page ornaments of some styles (PrintEstrutura.moldura): drawn in the page
// margins or as a page frame, never inside the type area, so they cannot
// cover data. Inline SVG in page millimetres (the theme's trim, 170 × 240 by default), deterministic
// (shapes vary by a seeded hash, not by chance). The odd page mirrors the
// even one, so ornaments sit in the outer margin of both.
import type { ReactNode } from 'react'
import type { Moldura } from '@datatechsolutions/tympan-tokens'
import { usePrint } from '../context.tsx'
import { semente } from '../rough.ts'

const n = (v: number) => Math.round(v * 100) / 100
// Styles without ornament colours fall back to their highlight colours (still never data: margins only).
const RESERVA = ['var(--ty-print-marca-texto)', 'var(--ty-print-destaque-2)', 'var(--ty-print-destaque)', 'var(--ty-print-tinta-3)']
const orn = (i: 1 | 2 | 3 | 4) => `var(--ty-print-ornamento-${i}, ${RESERVA[i - 1]})`
const TINTA = 'var(--ty-print-tinta)'

function aleatorio(chave: string) {
  let s = semente(chave)
  return () => {
    s = (Math.imul(s, 48271) % 2147483647) >>> 0
    return (s % 100000) / 100000
  }
}

/** Ornaments of the outer margin, in local coordinates 0..14 mm wide. */
function margem(moldura: Moldura, lado: 'par' | 'impar', H: number): ReactNode {
  // Vertical layout follows the page height: the column runs from 16 mm to H − 14 mm (226 on 240).
  const fim = H - 14
  const ky = (y: number) => n((y * H) / 240)
  const r = aleatorio(`${moldura}-${lado}`)
  switch (moldura) {
    case 'azulejo': {
      const out: ReactNode[] = []
      const t = 11
      for (let k = 0, y = 17; y + t <= fim; k++, y += t) {
        const v = semente(`az-${lado}-${k}`) % 6
        const cor = k % 7 === 3 ? orn(3) : orn(2)
        let forma: ReactNode
        if (v === 0) forma = <path d={`M 1 ${y} A ${t / 2} ${t / 2} 0 0 1 1 ${y + t} Z`} fill={cor} />
        else if (v === 1) forma = <path d={`M ${1 + t} ${y} A ${t / 2} ${t / 2} 0 0 0 ${1 + t} ${y + t} Z`} fill={cor} />
        else if (v === 2) forma = <rect x={1 + t * 0.35} y={y + t * 0.35} width={t * 0.3} height={t * 0.3} fill={cor} />
        else if (v === 3) forma = <path d={`M 1 ${y} L ${1 + t / 2} ${y} A ${t / 2} ${t / 2} 0 0 1 1 ${y + t / 2} Z`} fill={cor} />
        else if (v === 4) forma = <circle cx={1 + t / 2} cy={y + t / 2} r={t * 0.22} fill={cor} />
        else forma = <path d={`M 1 ${y + t} L ${1 + t} ${y + t} A ${t / 2} ${t / 2} 0 0 0 1 ${y + t} Z`} fill={cor} />
        out.push(
          <g key={k}>
            <rect x={1} y={y} width={t} height={t} fill={orn(1)} />
            {forma}
          </g>,
        )
      }
      return out
    }
    case 'ondas': {
      const out: ReactNode[] = []
      for (let i = 0; i < 4; i++) {
        const x = 2.2 + i * 2.6
        let d = `M ${x} 16`
        for (let y = 16; y < fim; y += 6) d += ` q ${i % 2 ? -1.6 : 1.6} 3 0 6`
        out.push(<path key={i} d={d} fill="none" stroke={orn(((i % 4) + 1) as 1 | 2 | 3 | 4)} strokeWidth={1.3} strokeLinecap="round" />)
      }
      return out
    }
    case 'ramos': {
      const out: ReactNode[] = []
      let d = 'M 6.5 18'
      for (let y = 18, k = 0; y < fim; y += 15, k++) d += ` q ${k % 2 ? -5 : 5} 7.5 0 15`
      out.push(<path key="v" d={d} fill="none" stroke={orn(1)} strokeWidth={0.6} />)
      for (let y = 24, k = 0; y < fim - 2; y += 7.5, k++) {
        const lado = k % 2 ? -1 : 1
        out.push(<ellipse key={k} cx={n(6.5 + lado * 2.6)} cy={y} rx={2} ry={0.8} transform={`rotate(${lado * -30} ${n(6.5 + lado * 2.6)} ${y})`} fill={k % 3 === 0 ? orn(2) : orn(1)} />)
      }
      return out
    }
    case 'recortes': {
      const quad = (x0: number, y0: number, w: number, h: number, cor: string, k: string) => {
        const j = () => (r() - 0.5) * 1.6
        return <polygon key={k} points={`${n(x0 + j())},${n(y0 + j())} ${n(x0 + w + j())},${n(y0 + j() * 2)} ${n(x0 + w + j())},${n(y0 + h + j())} ${n(x0 + j())},${n(y0 + h + j() * 2)}`} fill={cor} />
      }
      return [quad(1.5, ky(22), 7, ky(92), orn(1), 'a'), quad(4.5, ky(58), 6.5, ky(30), orn(2), 'b'), quad(1.5, ky(150), 7, ky(60), orn(2), 'c'), quad(2.5, ky(172), 4.5, ky(30), orn(1), 'd')]
    }
    case 'reticula': {
      const out: ReactNode[] = []
      for (let y = 17; y <= fim; y += 1.8) for (let x = 1.6; x <= 12.4; x += 1.8) out.push(<circle key={`${x}-${y}`} cx={n(x)} cy={n(y)} r={0.5} fill={orn(1)} />)
      return out
    }
    case 'memphis': {
      let z = 'M 3 24'
      for (let y = 24, k = 0; y < 84; y += 5, k++) z += ` L ${k % 2 ? 3 : 11} ${y + 5}`
      const confete: ReactNode[] = []
      for (let k = 0; k < 14; k++) {
        const x = 1.5 + r() * 11
        const y = fim - 44 + r() * 44
        const a = r() * 180
        confete.push(<line key={k} x1={n(x)} y1={n(y)} x2={n(x + Math.cos((a * Math.PI) / 180) * 1.6)} y2={n(y + Math.sin((a * Math.PI) / 180) * 1.6)} stroke={orn((((k % 3) + 2) as 2 | 3 | 4))} strokeWidth={0.4} strokeLinecap="round" />)
      }
      return [
        <path key="z" d={z} fill="none" stroke={orn(1)} strokeWidth={0.7} strokeLinejoin="miter" />,
        <polygon key="t" points={`2,${ky(100)} 12,${ky(108)} 3,${ky(116)}`} fill={orn(2)} stroke={orn(1)} strokeWidth={0.4} />,
        <circle key="c" cx={7} cy={ky(140)} r={4} fill={orn(4)} />,
        <rect key="q" x={3.5} y={ky(158)} width={7} height={7} transform={`rotate(18 7 ${n(ky(158) + 3.5)})`} fill={orn(3)} opacity={0.75} />,
        ...confete,
      ]
    }
    default:
      return null
  }
}

/** Ornaments that frame the whole page (not mirrored). */
function pagina(moldura: Moldura, lado: 'par' | 'impar', W: number, H: number): ReactNode {
  switch (moldura) {
    case 'dupla':
      return (
        <>
          <rect x={4} y={4} width={W - 8} height={H - 8} fill="none" stroke={TINTA} strokeWidth={0.45} />
          <rect x={5.3} y={5.3} width={W - 10.6} height={H - 10.6} fill="none" stroke={TINTA} strokeWidth={0.2} />
        </>
      )
    case 'regua': {
      const seg: ReactNode[] = []
      for (let y = 4, k = 0; y < H - 4; y += 4, k++) {
        if (k % 2) continue
        const h = Math.min(4, H - 4 - y)
        seg.push(<rect key={`l${k}`} x={4} y={y} width={1.6} height={h} fill={orn(1)} />, <rect key={`r${k}`} x={W - 5.6} y={y} width={1.6} height={h} fill={orn(1)} />)
      }
      return (
        <>
          {seg}
          <rect x={4} y={4} width={W - 8} height={H - 8} fill="none" stroke={TINTA} strokeWidth={0.3} />
          <rect x={5.6} y={5.6} width={W - 11.2} height={H - 11.2} fill="none" stroke={TINTA} strokeWidth={0.3} />
        </>
      )
    }
    case 'ramos': {
      const x0 = lado === 'par' ? 12 : 16
      const x1 = lado === 'par' ? W - 16 : W - 12
      const y0 = 14
      const y1 = H - 11
      const R = 10
      const curl = (cx: number, cy: number, k: string) => (
        <g key={k} fill="none" stroke={orn(3)} strokeWidth={0.45}>
          <circle cx={cx} cy={cy} r={1.3} />
          <path d={`M ${cx - 1.3} ${cy} c -4 -2.4 -8 2.4 -12 0 M ${cx + 1.3} ${cy} c 4 -2.4 8 2.4 12 0`} />
        </g>
      )
      return (
        <>
          <path d={`M ${x0} ${y1} L ${x0} ${y0 + R} Q ${x0} ${y0} ${x0 + R} ${y0} L ${x1 - R} ${y0} Q ${x1} ${y0} ${x1} ${y0 + R} L ${x1} ${y1} Z`} fill="none" stroke={orn(3)} strokeWidth={0.4} />
          {curl((x0 + x1) / 2, 8, 'c1')}
          {curl((x0 + x1) / 2, H - 6, 'c2')}
        </>
      )
    }
    case 'diagonais':
      return lado === 'par' ? (
        <>
          <polygon points="0,0 96,0 81,15 0,15" fill={orn(1)} />
          <polygon points={`${W - 14},${H - 34} ${W - 9.5},${H - 35} ${W - 3},${H} ${W - 7.5},${H}`} fill={orn(1)} />
          <line x1={W - 52} y1={H} x2={W} y2={H - 13.5} stroke={orn(2)} strokeWidth={1.2} />
          <path d={`M ${W - 19} ${H} A 9 9 0 0 1 ${W - 1} ${H} Z`} fill={orn(1)} />
        </>
      ) : (
        <polygon points={`${W},0 ${W - 96},0 ${W - 81},15 ${W},15`} fill={orn(2)} />
      )
    case 'quartos':
      // diagrama-modernista: a quarter circle in the outer corner of each page (ochre at the foot, blue at the head).
      return lado === 'par' ? <path d={`M 0 ${H - 22} A 22 22 0 0 1 22 ${H} L 0 ${H} Z`} fill={orn(1)} /> : <path d={`M ${W - 20} 0 A 20 20 0 0 0 ${W} 20 L ${W} 0 Z`} fill={orn(2)} />
    case 'reticula':
      // Pop art: a burst at the foot of the even page, outside the type area.
      return lado === 'par' ? <polygon points={estrela(n(W * 0.447), H - 8, 7.5, 4, 12)} fill={orn(2)} stroke={TINTA} strokeWidth={0.35} /> : null
    case 'formas':
      return lado === 'par' ? (
        <g transform={`translate(${W - 46} 3)`}>
          <polygon points="0,10 5,0 10,10" fill={orn(1)} />
          <rect x={10} y={0} width={10} height={10} fill={orn(2)} />
          <circle cx={25} cy={5} r={5} fill={orn(3)} />
        </g>
      ) : null
    default:
      return null
  }
}

/** Points of a burst (star) with `k` spikes. */
function estrela(cx: number, cy: number, R: number, r: number, k: number): string {
  const out: string[] = []
  for (let i = 0; i < k * 2; i++) {
    const a = (Math.PI * i) / k - Math.PI / 2
    const raio = i % 2 ? r : R
    out.push(`${n(cx + raio * Math.cos(a))},${n(cy + raio * Math.sin(a))}`)
  }
  return out.join(' ')
}

/** The page ornament of the current style, if any. */
export function Ornamento({ lado }: { lado: 'par' | 'impar' }) {
  const { estilo } = usePrint()
  // Drawn in the theme's trim (not scaled from 170 × 240): margins keep their millimetres on any format.
  const W = estilo.pagina?.largura ?? 170
  const H = estilo.pagina?.altura ?? 240
  const moldura = estilo.estrutura.moldura ?? 'nenhuma'
  if (moldura === 'nenhuma') return null
  const m = margem(moldura, lado, H)
  const p = pagina(moldura, lado, W, H)
  if (!m && !p) return null
  return (
    <svg className="ty-print-ornament" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" data-moldura={moldura}>
      {p}
      {m ? <g transform={lado === 'par' ? undefined : `translate(${W} 0) scale(-1 1)`}>{m}</g> : null}
    </svg>
  )
}
