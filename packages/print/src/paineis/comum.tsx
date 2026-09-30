import type { ReactNode } from 'react'
import { usePrint } from '../contexto.tsx'
import { tracar } from '../rough.ts'
import { cx } from '../util.ts'

/**
 * A hand-drawn frame for styles with tremor: rough.js path in a 100 × 100
 * box stretched over the element (non-scaling stroke keeps the line weight).
 * Deterministic: the seed comes from `chave`.
 */
export function BordaMao({ chave, grossa = false, dupla = false }: { chave: string; grossa?: boolean; dupla?: boolean }) {
  const { estilo } = usePrint()
  const t = estilo.traco.tremor
  if (t <= 0) return null
  const largura = (grossa ? 2.2 : 1.1) * Math.max(0.6, estilo.traco.largura / 0.3)
  const tracos = [
    ...tracar({ k: 'retangulo', x: 0.6, y: 0.6, w: 98.8, h: 98.8 }, chave, {
      roughness: Math.min(0.9, 0.35 + t * 0.35),
      maxRandomnessOffset: 0.7,
      bowing: 0.3,
      strokeWidth: 1,
      disableMultiStroke: !grossa,
    }),
    ...(dupla
      ? tracar({ k: 'retangulo', x: 1.4, y: 1.6, w: 97.2, h: 96.8 }, `${chave}-2`, { roughness: 0.5, maxRandomnessOffset: 0.5, bowing: 0.2, strokeWidth: 1, disableMultiStroke: true })
      : []),
  ]
  return (
    <svg className="ty-print-hand-border" aria-hidden="true" focusable="false" viewBox="0 0 100 100" preserveAspectRatio="none">
      {tracos.map((p, i) => (
        <path key={i} d={p.d} vectorEffect="non-scaling-stroke" style={{ fill: 'none', stroke: 'var(--ty-print-linha)', strokeWidth: largura }} strokeLinecap="round" />
      ))}
    </svg>
  )
}

/** Numbered callout marker ("1", "2"…), the same mark the chart draws beside a row. */
export function NumeroChamada({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('ty-print-kicker', className)} aria-hidden="true">
      {children}
    </span>
  )
}

/** Eyebrow line above a title. */
export function Sobretitulo({ children }: { children: ReactNode }) {
  return <p className="ty-print-sobretitle">{children}</p>
}

/** Placeholder text in [brackets] gets the placeholder style (mono, muted). */
export function comColchetes(texto: string): ReactNode {
  const partes = texto.split(/(\[[^\]]*\])/g)
  if (partes.length === 1) return texto
  return partes.map((p, i) =>
    /^\[[^\]]*\]$/.test(p) ? (
      <span key={i} className="ty-print-footndente">
        {p}
      </span>
    ) : (
      p
    ),
  )
}
