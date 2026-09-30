import type { CSSProperties, ReactNode } from 'react'
import { LarguraProvider, useColunasDaArea, usePrint } from '../context.tsx'
import { cx, useIdSeguro } from '../utils.ts'
import { BordaMao } from './common.tsx'

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

/** Type area 138 mm, six columns with 5 mm gutters. */
const COLUNA = (138 - 5 * 5) / 6

/** Inner width of a panel in mm, from its span and frame (figures size themselves to it). */
export function larguraUtil(largura: number | undefined, moldura: string, variante: VariantePainel): number {
  const n = Math.max(1, Math.min(6, Math.round(largura ?? 6)))
  const bruto = COLUNA * n + 5 * (n - 1)
  const semMoldura = moldura === 'fio' || moldura === 'fio-grosso' || moldura === 'nenhum' || variante === 'pilha' || variante === 'filete' || variante === 'filete-forte'
  const recuo = semMoldura ? 0 : moldura === 'caixa-grossa' ? 9 : 7
  return Math.round((bruto - recuo) * 10) / 10
}

/** A lettered dashboard panel; its frame follows the style (rule, box, card, band, drafting board). */
export function Painel({ letra, titulo, eyebrow, largura: larguraPedida, variante = 'normal', nivel = 2, className, style, children }: PainelProps) {
  // Inside a molde area, the area's span is the panel's width (a `largura` wider than the area cannot apply).
  const daArea = useColunasDaArea()
  const largura = daArea ? Math.min(daArea, larguraPedida ?? daArea) : larguraPedida
  const H = `h${nivel}` as 'h2' | 'h3' | 'h4'
  const { estilo } = usePrint()
  const id = useIdSeguro('ty-print-panel')
  const moldura = estilo.estrutura.painel
  const mao = estilo.traco.tremor > 0 && (moldura === 'caixa' || moldura === 'caixa-grossa') && variante !== 'pilha' && variante !== 'filete' && variante !== 'filete-forte'
  const temCabeca = Boolean(letra || titulo)
  return (
    <section
      className={cx('ty-print-panel', className)}
      data-variante={variante}
      data-largura={largura ?? 6}
      aria-labelledby={temCabeca ? `${id}-t` : undefined}
      style={{ ...(daArea ? undefined : larguraColunas(largura)), ...style }}
    >
      {mao ? <BordaMao chave={`painel-${letra ?? ''}-${typeof titulo === 'string' ? titulo : ''}`} grossa={moldura === 'caixa-grossa'} dupla={moldura === 'caixa-grossa'} /> : null}
      {eyebrow ? <p className="ty-print-sobretitle">{eyebrow}</p> : null}
      {temCabeca ? (
        <H className="ty-print-panel-title" id={`${id}-t`}>
          {letra ? <span className="ty-print-letter">{letra}</span> : null}
          {titulo ? <span className="ty-print-panel-name">{titulo}</span> : null}
        </H>
      ) : null}
      <div className="ty-print-panel-body">
        <LarguraProvider value={larguraUtil(largura, moldura, variante)}>{children}</LarguraProvider>
      </div>
    </section>
  )
}
