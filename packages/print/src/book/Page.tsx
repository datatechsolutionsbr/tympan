import { Children, cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { contrastRatio, luminance, papelEscuro, parseColor, toGrey } from '@datatechsolutions/tympan-tokens'
import { FundoEscuroProvider, LadoProvider, MoldeProvider, useDupla, usePrint } from '../context.tsx'
import { cx } from '../utils.ts'
import { tx } from '../i18n.ts'
import { Area } from './Area.tsx'
import { Painel } from '../panels/Panel.tsx'
import { nomeArea, gradeDoMolde, linhasDoMolde, linhasUsadas, moldePorNome } from './templates.ts'
import { Ornamento } from './Ornament.tsx'
import { Textura } from './Texture.tsx'
import { Capa } from '../panels/Openers.tsx'
import { Marca, type MarcaEntrada } from '../brand/Marca.tsx'

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
  /**
   * Fill the type area (pages without a molde): each panel widens to close its row of six columns and rows of
   * panels share the free height. Default: the style's `estrutura.preencher` (on in dashboard).
   */
  preencher?: boolean
  /**
   * A mark in the running foot, on the inner side opposite the folio: `true` = the theme's `marcas.editora`, or a
   * mark object / element. Default: the theme's `folio.marca` ('editora' prints it on every normal page).
   * Height from the molde (`marcaRodape`, default 3.5 mm).
   */
  marca?: MarcaEntrada
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

export function Pagina({ lado, variante = 'normal', cabeco, folio = true, numero, molde, campo, preencher, marca, className, children }: PaginaProps) {
  const dupla = useDupla()
  const { estilo, pb, grafica } = usePrint()
  const semCabeco = variante !== 'normal' || estilo.folio?.cabeco === 'nenhum'
  const textoCabeco = semCabeco ? undefined : (cabeco ?? (lado === 'par' ? dupla?.parte : dupla?.capitulo))
  const numeroFolio = numero ?? (dupla ? dupla.folios[lado === 'par' ? 0 : 1] : '')
  const textoFolio = numeroFolio
  const mostrarFolio = folio && variante !== 'capa' && Boolean(textoFolio)
  const nomeMolde = molde ?? dupla?.molde
  const m = moldePorNome(nomeMolde)
  const grade = m ? gradeDoMolde(linhasUsadas(linhasDoMolde(m, lado, estilo), areasDosFilhos(children))) : null
  const estiloMancha: CSSProperties | undefined = grade ? { gridTemplateAreas: grade.areas, gridTemplateRows: grade.linhas } : undefined
  const enche = !grade && variante === 'normal' && (preencher ?? estilo.estrutura.preencher ?? false)
  const cheio = enche ? encherLinhas(children) : null
  if (cheio) children = cheio.filhos
  const marcaRodape = variante === 'normal' ? (marca ?? (estilo.folio?.marca === 'editora' ? true : estilo.folio?.marca === 'selo' ? estilo.marcas?.selo : undefined)) : undefined
  const cc = variante === 'capa' && campo ? coresCapa(campo, estilo, pb) : null
  // A custom cover plate (Cover with children) is anchored to the page box, not to the type area.
  const filhos = Children.toArray(children)
  const prancha = variante === 'capa' ? filhos.find((c) => isValidElement<{ children?: ReactNode }>(c) && c.type === Capa && c.props.children != null) : undefined
  if (prancha) children = filhos.filter((c) => c !== prancha)
  const corpo = variante === 'capa' ? <FundoEscuroProvider value={cc ? cc.escuro : !papelEscuro(estilo)}>{children}</FundoEscuroProvider> : children
  // The cover prints `--ty-print-tinta` as its field and `--ty-print-papel` as its type (base.css).
  const estiloPagina = cc ? ({ '--ty-print-tinta': cc.fundo, '--ty-print-papel': cc.texto } as CSSProperties) : undefined
  const pagina = (
    <section
      className={cx('ty-print-page', className)}
      data-lado={lado}
      data-variante={variante}
      data-molde={grade ? nomeMolde : undefined}
      data-respiro={m?.respiro ? '' : undefined}
      data-campo={cc ? '' : undefined}
      data-maximo={m?.maximo ?? (cheio ? 1.5 : undefined)}
      data-minimo={cheio ? 0.72 : undefined}
      style={estiloPagina}
      aria-label={textoFolio ? tx('pagina', { a: textoFolio }) : lado === 'par' ? tx('paginaPar') : tx('paginaImpar')}
    >
      <Textura lado={lado} />
      {variante !== 'prancha' && !prancha ? <Ornamento lado={lado} /> : null}
      {prancha ? <FundoEscuroProvider value={cc ? cc.escuro : !papelEscuro(estilo)}>{prancha}</FundoEscuroProvider> : null}
      {textoCabeco ? <p className="ty-print-running-head">{textoCabeco}</p> : null}
      <div className="ty-print-type-area" style={cheio ? { gridTemplateRows: cheio.linhas } : estiloMancha} data-preencher={cheio ? '' : undefined}>
        <LadoProvider value={lado}>{grade ? <MoldeProvider value={grade.info}>{corpo}</MoldeProvider> : corpo}</LadoProvider>
      </div>
      {marcaRodape ? (
        <div className="ty-print-running-mark" style={{ blockSize: `${m?.marcaRodape ?? 3.5}mm` }}>
          <Marca marca={marcaRodape} largura={30} altura={m?.marcaRodape ?? 3.5} />
        </div>
      ) : null}
      {mostrarFolio ? <p className="ty-print-folio">{`${estilo.folio?.prefixoFolio ?? ''}${textoFolio}`}</p> : null}
    </section>
  )
  if (!grafica) return pagina
  // Press output: the page on a sheet of trim + bleed (+ slug with crop marks when asked).
  return (
    <div className="ty-print-sheet" data-lado={lado}>
      {grafica.marcasCorte ? <MarcasCorte largura={estilo.pagina?.largura ?? 170} altura={estilo.pagina?.altura ?? 240} sangria={grafica.sangria} folga={grafica.folga} /> : null}
      {pagina}
    </div>
  )
}

/** Crop marks: two 5 mm hairlines at each trim corner, in the slug, starting 1 mm past the bleed. Registration black. */
function MarcasCorte({ largura, altura, sangria, folga }: { largura: number; altura: number; sangria: number; folga: number }) {
  const W = largura + 2 * folga
  const H = altura + 2 * folga
  const xs = [folga, folga + largura]
  const ys = [folga, folga + altura]
  const ini = sangria + 1
  const linhas: Array<[number, number, number, number]> = []
  for (const x of xs)
    for (const y of ys) {
      const dx = x === folga ? -1 : 1
      const dy = y === folga ? -1 : 1
      linhas.push([x + dx * ini, y, x + dx * (folga - 0.2), y], [x, y + dy * ini, x, y + dy * (folga - 0.2)])
    }
  return (
    <svg className="ty-print-crop-marks" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" data-marcas={linhas.length}>
      {linhas.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={0.1} />
      ))}
    </svg>
  )
}
/** Names of the Area children of a page (null when the page has none, e.g. hand-written pages without areas). */
function areasDosFilhos(children: ReactNode): Set<string> | null {
  const nomes = new Set<string>()
  Children.forEach(children, (c) => {
    if (isValidElement<{ nome?: string }>(c) && c.type === Area && c.props.nome) nomes.add(nomeArea(c.props.nome))
  })
  return nomes.size ? nomes : null
}

/**
 * Fill mode: panels in reading order are packed into rows of six columns (as the grid would place them), the
 * last panel of each row widens to the row's end, and every row of panels takes a share of the free height
 * (`minmax(max-content, 1fr)`); other blocks (titles, text) keep their height. Absolutely placed blocks (the
 * foot source line) are left out of the rows.
 */
function encherLinhas(children: ReactNode): { filhos: ReactNode[]; linhas: string } {
  const itens = Children.toArray(children)
  const linhas: string[] = []
  const saida: ReactNode[] = [...itens]
  let soma = 0
  let ultimo = -1
  const fechar = () => {
    if (ultimo >= 0) {
      const el = saida[ultimo] as ReactElement<{ largura?: number }>
      const w = Math.round(el.props.largura ?? 6)
      if (soma < 6) saida[ultimo] = cloneElement(el, { largura: w + (6 - soma) })
      linhas.push('painel')
    }
    soma = 0
    ultimo = -1
  }
  itens.forEach((c, i) => {
    if (isValidElement<{ largura?: number; rodape?: boolean }>(c) && c.props.rodape) return
    if (isValidElement<{ largura?: number }>(c) && c.type === Painel) {
      const w = Math.max(1, Math.min(6, Math.round(c.props.largura ?? 6)))
      if (soma + w > 6) fechar()
      soma += w
      ultimo = i
      if (soma === 6) fechar()
      return
    }
    fechar()
    linhas.push('max-content')
  })
  fechar()
  // Rows keep their content height (copyfitting grows sparse pages); the last row of panels takes what is left,
  // so the foot of the page is reached without opening gaps between rows.
  // Every row is at least as tall as its content (max-content: an 'auto' row is squeezed below its panels when
  // the page is too dense, and panels then overlap the next row). Only the last row of panels takes the rest.
  const ultimaPainel = linhas.lastIndexOf('painel')
  return { filhos: saida, linhas: linhas.map((_l, i) => (i === ultimaPainel ? 'minmax(max-content, 1fr)' : 'max-content')).join(' ') }
}
