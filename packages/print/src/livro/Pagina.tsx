import type { ReactNode } from 'react'
import { papelEscuro } from '@datatechsolutions/tympan-tokens'
import { FundoEscuroProvider, useDupla, usePrint } from '../contexto.tsx'
import { cx } from '../util.ts'
import { Ornamento } from './Ornamento.tsx'
import { Textura } from './Textura.tsx'

export interface PaginaProps {
  lado: 'par' | 'impar'
  /** normal; capa (no running head, full bleed); prancha (a plate: bleed, no running head). */
  variante?: 'normal' | 'capa' | 'prancha'
  /** Running head; defaults to the part (even) or the chapter (odd) of the spread. */
  cabeco?: string
  /** Show the folio (page number). */
  folio?: boolean
  /** Folio text; defaults to the spread's number for this side. */
  numero?: string
  className?: string
  children?: ReactNode
}

/**
 * One 170 × 240 mm page. The type area is a six-column grid (panels span
 * columns with `largura`), with the inner margin wider than the outer one.
 */
export function Pagina({ lado, variante = 'normal', cabeco, folio = true, numero, className, children }: PaginaProps) {
  const dupla = useDupla()
  const { estilo } = usePrint()
  const semCabeco = variante !== 'normal'
  const textoCabeco = semCabeco ? undefined : (cabeco ?? (lado === 'par' ? dupla?.parte : dupla?.capitulo))
  const textoFolio = numero ?? (dupla ? dupla.folios[lado === 'par' ? 0 : 1] : '')
  const mostrarFolio = folio && variante !== 'capa' && Boolean(textoFolio)
  return (
    <section
      className={cx('ty-print-pagina', className)}
      data-lado={lado}
      data-variante={variante}
      aria-label={textoFolio ? `Página ${textoFolio}` : lado === 'par' ? 'Página par' : 'Página ímpar'}
    >
      <Textura lado={lado} />
      {variante === 'normal' ? <Ornamento lado={lado} /> : null}
      {textoCabeco ? <p className="ty-print-cabeco">{textoCabeco}</p> : null}
      <div className="ty-print-mancha">
        {variante === 'capa' ? <FundoEscuroProvider value={!papelEscuro(estilo)}>{children}</FundoEscuroProvider> : children}
      </div>
      {mostrarFolio ? <p className="ty-print-folio">{textoFolio}</p> : null}
    </section>
  )
}
