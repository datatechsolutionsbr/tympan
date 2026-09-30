import { Children, isValidElement, type CSSProperties, type ReactNode } from 'react'
import { papelEscuro } from '@datatechsolutions/tympan-tokens'
import { FundoEscuroProvider, LadoProvider, MoldeProvider, useDupla, usePrint } from '../contexto.tsx'
import { cx } from '../util.ts'
import { Area } from './Area.tsx'
import { gradeDoMolde, linhasDoMolde, linhasUsadas, moldePorNome } from './moldes.ts'
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
  /** Template of this page (defaults to the spread's `molde`); see livro/moldes.ts. */
  molde?: string
  className?: string
  children?: ReactNode
}

/**
 * One 170 × 240 mm page. The type area is a six-column grid: without a molde,
 * panels span columns with `largura` and flow down; with a molde, each `Area`
 * sits where the molde puts it and one row grows to the foot of the page.
 */
export function Pagina({ lado, variante = 'normal', cabeco, folio = true, numero, molde, className, children }: PaginaProps) {
  const dupla = useDupla()
  const { estilo } = usePrint()
  const semCabeco = variante !== 'normal'
  const textoCabeco = semCabeco ? undefined : (cabeco ?? (lado === 'par' ? dupla?.parte : dupla?.capitulo))
  const textoFolio = numero ?? (dupla ? dupla.folios[lado === 'par' ? 0 : 1] : '')
  const mostrarFolio = folio && variante !== 'capa' && Boolean(textoFolio)
  const nomeMolde = molde ?? dupla?.molde
  const m = moldePorNome(nomeMolde)
  const grade = m ? gradeDoMolde(linhasUsadas(linhasDoMolde(m, lado, estilo), areasDosFilhos(children))) : null
  const estiloMancha: CSSProperties | undefined = grade ? { gridTemplateAreas: grade.areas, gridTemplateRows: grade.linhas } : undefined
  const corpo = variante === 'capa' ? <FundoEscuroProvider value={!papelEscuro(estilo)}>{children}</FundoEscuroProvider> : children
  return (
    <section
      className={cx('ty-print-page', className)}
      data-lado={lado}
      data-variante={variante}
      data-molde={grade ? nomeMolde : undefined}
      data-respiro={m?.respiro ? '' : undefined}
      aria-label={textoFolio ? `Página ${textoFolio}` : lado === 'par' ? 'Página par' : 'Página ímpar'}
    >
      <Textura lado={lado} />
      {variante === 'normal' ? <Ornamento lado={lado} /> : null}
      {textoCabeco ? <p className="ty-print-running-head">{textoCabeco}</p> : null}
      <div className="ty-print-type-area" style={estiloMancha}>
        <LadoProvider value={lado}>{grade ? <MoldeProvider value={grade.info}>{corpo}</MoldeProvider> : corpo}</LadoProvider>
      </div>
      {mostrarFolio ? <p className="ty-print-folio">{textoFolio}</p> : null}
    </section>
  )
}

/** Names of the Area children of a page (null when the page has none, e.g. hand-written pages without areas). */
function areasDosFilhos(children: ReactNode): Set<string> | null {
  const nomes = new Set<string>()
  Children.forEach(children, (c) => {
    if (isValidElement<{ nome?: string }>(c) && c.type === Area && c.props.nome) nomes.add(c.props.nome)
  })
  return nomes.size ? nomes : null
}
