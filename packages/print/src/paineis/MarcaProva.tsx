import { ROTULOS_PROVA, type EstadoProva, type MarcaProva as FormaMarca } from '@datatechsolutions/tympan-tokens'
import type { ReactNode } from 'react'
import { usePrint } from '../contexto.tsx'
import { tracar } from '../rough.ts'
import { cx } from '../util.ts'

export interface MarcaProvaProps {
  estado: EstadoProva
  /** Large mark (the verdict of a chapter). */
  grande?: boolean
  /** Shape override; defaults to the style's `marcaProva`. */
  forma?: FormaMarca
  className?: string
}

/** Line style of each state, so no state depends on colour alone. */
const TRACO: Record<EstadoProva, 'solido' | 'duplo' | 'ondulado' | 'fino' | 'tracejado' | 'pontilhado'> = {
  sustentada: 'solido',
  refutada: 'duplo',
  'nao-da-para-afirmar': 'ondulado',
  pendente: 'fino',
  'sem-dado': 'tracejado',
  'nao-testada': 'pontilhado',
}

const dash = (t: (typeof TRACO)[EstadoProva]) => (t === 'tracejado' ? '5 3' : t === 'pontilhado' ? '0.5 3' : undefined)

/** Icon beside the word (pill and label shapes): filled, crossed, half, ring, dashed ring, dotted ring. */
function Icone({ estado }: { estado: EstadoProva }) {
  const s = { stroke: 'currentColor', strokeWidth: 1.4, fill: 'none' }
  let corpo: ReactNode
  switch (estado) {
    case 'sustentada':
      corpo = <circle cx={6} cy={6} r={4.6} fill="currentColor" />
      break
    case 'refutada':
      corpo = (
        <g style={{ ...s, strokeWidth: 1.8 }} strokeLinecap="round">
          <line x1={2.2} y1={2.2} x2={9.8} y2={9.8} />
          <line x1={9.8} y1={2.2} x2={2.2} y2={9.8} />
        </g>
      )
      break
    case 'nao-da-para-afirmar':
      corpo = (
        <>
          <circle cx={6} cy={6} r={4.4} style={s} />
          <path d="M6 1.6 A4.4 4.4 0 0 0 6 10.4 Z" fill="currentColor" />
        </>
      )
      break
    case 'pendente':
      corpo = (
        <g style={s} strokeLinecap="round">
          <circle cx={6} cy={6} r={4.4} />
          <path d="M6 3.4 V6 L7.8 7.2" />
        </g>
      )
      break
    case 'sem-dado':
      corpo = <circle cx={6} cy={6} r={4.4} style={s} strokeDasharray="2.2 1.6" />
      break
    case 'nao-testada':
      corpo = <line x1={2} y1={6} x2={10} y2={6} style={{ ...s, strokeWidth: 1.6 }} strokeLinecap="round" />
      break
  }
  return (
    <svg className="ty-print-prova-icone" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      {corpo}
    </svg>
  )
}

/** Hand-drawn or ruled ellipse, underline or stamp frame, stretched over the word. */
function Contorno({ forma, estado, tremor, chave }: { forma: FormaMarca; estado: EstadoProva; tremor: number; chave: string }) {
  const t = TRACO[estado]
  const w = t === 'solido' || t === 'duplo' ? 1.5 : 1.1
  const style = { fill: 'none', stroke: 'currentColor', strokeWidth: w }
  const paths: string[] = []
  if (forma === 'circulo') {
    if (tremor > 0) {
      const o = { roughness: Math.min(1.4, 0.6 + tremor * 0.5), bowing: 1, strokeWidth: 1, curveStepCount: 12, disableMultiStroke: t !== 'duplo' }
      for (const p of tracar({ k: 'elipse', cx: 50, cy: 20, w: 96, h: 36 }, chave, o)) paths.push(p.d)
    } else {
      paths.push('M50 2 A48 18 0 1 1 49.9 2 Z')
      if (t === 'duplo') paths.push('M50 5 A45 15 0 1 1 49.9 5 Z')
    }
    return (
      <svg className="ty-print-prova-contorno" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {paths.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" style={style} strokeDasharray={dash(t)} strokeLinecap="round" />
        ))}
      </svg>
    )
  }
  if (forma === 'sublinhado') {
    const y = 34
    if (t === 'ondulado') {
      let d = `M2 ${y}`
      for (let x = 2; x < 98; x += 6) d += ` Q${x + 1.5} ${y - 3} ${x + 3} ${y} T${x + 6} ${y}`
      paths.push(d)
    } else if (tremor > 0) {
      for (const p of tracar({ k: 'linha', x1: 2, y1: y, x2: 98, y2: y - 1 }, chave, { roughness: 0.8 + tremor * 0.3, bowing: 1.5, strokeWidth: 1, disableMultiStroke: true })) paths.push(p.d)
      if (t === 'duplo') for (const p of tracar({ k: 'linha', x1: 4, y1: y + 4, x2: 96, y2: y + 3 }, `${chave}-2`, { roughness: 0.8, bowing: 1.5, strokeWidth: 1, disableMultiStroke: true })) paths.push(p.d)
    } else {
      paths.push(`M2 ${y} H98`)
      if (t === 'duplo') paths.push(`M2 ${y + 4} H98`)
    }
    return (
      <svg className="ty-print-prova-contorno ty-print-prova-contorno--baixo" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {paths.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" style={style} strokeDasharray={dash(t)} strokeLinecap="round" />
        ))}
      </svg>
    )
  }
  // carimbo with tremor: a rough, slightly doubled stamp frame
  const o = { roughness: 0.5 + tremor * 0.35, bowing: 0.4, strokeWidth: 1, maxRandomnessOffset: 1.2, disableMultiStroke: t !== 'duplo' && t !== 'solido' }
  for (const p of tracar({ k: 'retangulo', x: 1.5, y: 3, w: 97, h: 34 }, chave, o)) paths.push(p.d)
  if (t === 'duplo') for (const p of tracar({ k: 'retangulo', x: 4, y: 6.5, w: 92, h: 27 }, `${chave}-2`, o)) paths.push(p.d)
  return (
    <svg className="ty-print-prova-contorno" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {paths.map((d, i) => (
        <path key={i} d={d} vectorEffect="non-scaling-stroke" style={{ ...style, strokeWidth: w * 1.3 }} strokeDasharray={dash(t)} strokeLinecap="round" />
      ))}
    </svg>
  )
}

/**
 * Proof-state mark. The word is always printed; shape (pill, stamp, circle,
 * underline, bar or label) follows the style, and each state also differs by
 * line (solid, double, wavy, thin, dashed, dotted) and icon, so it reads in
 * black and white.
 */
export function MarcaProva({ estado, grande = false, forma, className }: MarcaProvaProps) {
  const { estilo } = usePrint()
  const f = forma ?? estilo.marcaProva
  const tremor = estilo.traco.tremor
  const comContorno = f === 'circulo' || f === 'sublinhado' || (f === 'carimbo' && tremor > 0)
  const comIcone = f === 'pilula' || f === 'etiqueta'
  return (
    <span
      className={cx('ty-print-prova', className)}
      data-estado={estado}
      data-forma={f}
      data-traco={TRACO[estado]}
      data-grande={grande ? '' : undefined}
      data-mao={tremor > 0 ? '' : undefined}
    >
      {comIcone ? <Icone estado={estado} /> : null}
      <span className="ty-print-prova-texto">{ROTULOS_PROVA[estado]}</span>
      {comContorno ? <Contorno forma={f} estado={estado} tremor={tremor} chave={`prova-${estado}-${grande ? 'g' : 'p'}`} /> : null}
    </span>
  )
}
