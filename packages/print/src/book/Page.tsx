import { Children, isValidElement, type CSSProperties, type ReactNode } from 'react'
import { contrastRatio, luminance, papelEscuro, parseColor, toGrey } from '@datatechsolutions/tympan-tokens'
import { FundoEscuroProvider, LadoProvider, MoldeProvider, useDupla, usePrint } from '../context.tsx'
import { cx } from '../utils.ts'
import { Area } from './Area.tsx'
import { gradeDoMolde, linhasDoMolde, linhasUsadas, moldePorNome } from './templates.ts'
import { Ornamento } from './Ornament.tsx'
import { Textura } from './Texture.tsx'

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
  /** Template of this page (defaults to the spread's `molde`); see book/moldes.ts. */
  molde?: string
  /**
   * Cover pages: the volume's colour as the field (collection cover system, L6), with cream type. One-ink
   * styles (logo 'mono' on light paper) print the volume's colour as their single ink on the paper instead.
   */
  campo?: string
  className?: string
  children?: ReactNode
}

/**
 * One 170 × 240 mm page. The type area is a six-column grid: without a molde,
 * panels span columns with `largura` and flow down; with a molde, each `Area`
 * sits where the molde puts it and one row grows to the foot of the page.
 */
const CREME = '#fdf8f1'

/** Field and type colours of a cover page, and whether the field is dark (logos pick their version by it). */
function coresCapa(campo: string, estilo: ReturnType<typeof usePrint>['estilo'], pb: boolean) {
  const cinza = (c: string) => (pb ? toGrey(c) : c)
  const mono = estilo.logo === 'mono' && !papelEscuro(estilo)
  if (mono) return { fundo: estilo.cor.papel, texto: cinza(campo), escuro: false }
  const f = cinza(campo)
  const texto = [CREME, estilo.cor.papel, '#ffffff', estilo.cor.tinta].sort((a, b) => contrastRatio(parseColor(b), parseColor(f)) - contrastRatio(parseColor(a), parseColor(f)))[0]!
  return { fundo: f, texto, escuro: luminance(parseColor(f)) < 0.2 }
}

export function Pagina({ lado, variante = 'normal', cabeco, folio = true, numero, molde, campo, className, children }: PaginaProps) {
  const dupla = useDupla()
  const { estilo, pb } = usePrint()
  const semCabeco = variante !== 'normal'
  const textoCabeco = semCabeco ? undefined : (cabeco ?? (lado === 'par' ? dupla?.parte : dupla?.capitulo))
  const textoFolio = numero ?? (dupla ? dupla.folios[lado === 'par' ? 0 : 1] : '')
  const mostrarFolio = folio && variante !== 'capa' && Boolean(textoFolio)
  const nomeMolde = molde ?? dupla?.molde
  const m = moldePorNome(nomeMolde)
  const grade = m ? gradeDoMolde(linhasUsadas(linhasDoMolde(m, lado, estilo), areasDosFilhos(children))) : null
  const estiloMancha: CSSProperties | undefined = grade ? { gridTemplateAreas: grade.areas, gridTemplateRows: grade.linhas } : undefined
  const cc = variante === 'capa' && campo ? coresCapa(campo, estilo, pb) : null
  const corpo = variante === 'capa' ? <FundoEscuroProvider value={cc ? cc.escuro : !papelEscuro(estilo)}>{children}</FundoEscuroProvider> : children
  // The cover prints `--ty-print-tinta` as its field and `--ty-print-papel` as its type (base.css).
  const estiloPagina = cc ? ({ '--ty-print-tinta': cc.fundo, '--ty-print-papel': cc.texto } as CSSProperties) : undefined
  return (
    <section
      className={cx('ty-print-page', className)}
      data-lado={lado}
      data-variante={variante}
      data-molde={grade ? nomeMolde : undefined}
      data-respiro={m?.respiro ? '' : undefined}
      data-campo={cc ? '' : undefined}
      data-maximo={m?.maximo}
      style={estiloPagina}
      aria-label={textoFolio ? `Página ${textoFolio}` : lado === 'par' ? 'Página par' : 'Página ímpar'}
    >
      <Textura lado={lado} />
      {variante !== 'prancha' ? <Ornamento lado={lado} /> : null}
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
