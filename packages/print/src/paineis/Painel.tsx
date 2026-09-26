import type { CSSProperties, ReactNode } from 'react'
import { usePrint } from '../contexto.tsx'
import { cx, useIdSeguro } from '../util.ts'
import { BordaMao } from './comum.tsx'

export type VariantePainel = 'normal' | 'filete' | 'filete-forte' | 'cidade' | 'teste' | 'bolso' | 'pilha'

export interface PainelProps {
  /** Panel letter (a, b, c′…), the same in every chapter. */
  letra?: string
  titulo?: ReactNode
  /** Line above the title. */
  eyebrow?: ReactNode
  /** Columns of the page's six-column grid (default: all six). */
  largura?: number
  /** normal; filete (top rule); filete-forte (heavy top rule); cidade ("in your city", dashed); teste (tests); bolso (small inset); pilha (stacked, no frame). */
  variante?: VariantePainel
  /** Heading level of the panel title (default 2, so a page can go from its h1 straight to panels). */
  nivel?: 2 | 3 | 4
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function larguraColunas(largura?: number): CSSProperties | undefined {
  if (!largura || largura >= 6) return undefined
  return { gridColumn: `span ${Math.max(1, Math.round(largura))}` }
}

/** A lettered dashboard panel; its frame follows the style (rule, box, card, band, drafting board). */
export function Painel({ letra, titulo, eyebrow, largura, variante = 'normal', nivel = 2, className, style, children }: PainelProps) {
  const H = `h${nivel}` as 'h2' | 'h3' | 'h4'
  const { estilo } = usePrint()
  const id = useIdSeguro('ty-print-painel')
  const moldura = estilo.estrutura.painel
  const mao = estilo.traco.tremor > 0 && (moldura === 'caixa' || moldura === 'caixa-grossa') && variante !== 'pilha'
  const temCabeca = Boolean(letra || titulo)
  return (
    <section
      className={cx('ty-print-painel', className)}
      data-variante={variante}
      data-largura={largura ?? 6}
      aria-labelledby={temCabeca ? `${id}-t` : undefined}
      style={{ ...larguraColunas(largura), ...style }}
    >
      {mao ? <BordaMao chave={`painel-${letra ?? ''}-${typeof titulo === 'string' ? titulo : ''}`} grossa={moldura === 'caixa-grossa'} dupla={moldura === 'caixa-grossa'} /> : null}
      {eyebrow ? <p className="ty-print-sobretitulo">{eyebrow}</p> : null}
      {temCabeca ? (
        <H className="ty-print-painel-titulo" id={`${id}-t`}>
          {letra ? <span className="ty-print-letra">{letra}</span> : null}
          {titulo ? <span className="ty-print-painel-nome">{titulo}</span> : null}
        </H>
      ) : null}
      <div className="ty-print-painel-corpo">{children}</div>
    </section>
  )
}
