import type { ReactNode } from 'react'
import {
  googleFontsUrl,
  fontesLocaisCss,
  paginaDoEstilo,
  papelEscuro,
  printThemeById,
  printStyleToCss,
  resolvePrintStyle,
  type PrintStyle,
  type PrintStyleId,
  type PrintStyleOverrides,
} from '@datatechsolutions/tympan-tokens'
import { EscopoLivroProvider, PrintContextoProvider } from '../context.tsx'
import { PRINT_CSS } from '../styles.generated.ts'
import { cx, hashCurto } from '../utils.ts'

export interface LivroPrintProps {
  /**
   * The book style: a preset object, a preset name (a deprecated id from PRINT_STYLE_ALIASES resolves to its
   * new style) or the id of a book theme registered with `registerPrintTheme`.
   */
  estilo: PrintStyle | PrintStyleId | (string & {})
  /** Editor overrides of any token (partial). */
  tokens?: PrintStyleOverrides
  /** Black and white print. */
  pb?: boolean
  /** Inject the component stylesheet (turn off when the host imports `@datatechsolutions/tympan-print/styles.css`). */
  incluirCss?: boolean
  /** Link the style's Google Fonts (turn off when the host loads fonts itself, e.g. embedded in an EPUB). */
  carregarFontes?: boolean
  /**
   * Where fonts come from: 'google' (link the style's Google Fonts; the default while `carregarFontes` is on),
   * 'locais' (only the theme's `fontesLocais` as @font-face: no network, deterministic PDF and EPUB; families
   * without a file fall back to the stack), or 'nenhuma' (the host loads them). Overrides `carregarFontes`.
   */
  fontes?: 'google' | 'locais' | 'nenhuma'
  /**
   * Print for the press: every page sits on a sheet with bleed (the page's background runs into it) and,
   * optionally, crop marks in the slug; `@page` grows to trim + 2 × (bleed + slug). `true` takes the theme's
   * `pagina.sangria` (default 3 mm) and `pagina.marcasCorte`. Off (default): the PDF is the trim size.
   */
  impressao?: boolean | { sangria?: number; marcasCorte?: boolean }
  lang?: string
  /**
   * Scope name of this book's custom properties and SVG ids. Defaults to a hash of the style, P&B and
   * overrides, so books in different styles in one HTML never share tokens. Set it when several books
   * in the same style are rendered separately and concatenated (their SVG ids then stay apart too).
   */
  escopo?: string
  className?: string
  children?: ReactNode
}

/** Slug around the bleed that carries the crop marks (mm). */
const MARGEM_MARCAS = 6

/**
 * Root of a printed book: sets the style (`data-ty-print-style`), injects the
 * preset's custom properties, the component CSS and `@page` (the theme's trim, 170 × 240 mm by default),
 * and provides the resolved style to every component below.
 */
export function LivroPrint({ estilo, tokens, pb = false, incluirCss = true, carregarFontes = true, fontes: modoFontes, impressao = false, lang = 'pt-BR', escopo: escopoProp, className, children }: LivroPrintProps) {
  const base = typeof estilo === 'string' ? printThemeById(estilo) : estilo
  const resolvido = resolvePrintStyle(base, { pb, overrides: tokens })
  const escopo = `tpb-${(escopoProp ?? hashCurto(JSON.stringify([pb, resolvido]))).replace(/[^a-zA-Z0-9_-]/g, '')}`
  const seletor = `[data-ty-print-livro="${escopo}"]`
  const pag = paginaDoEstilo(resolvido)
  const grafica = impressao ? { sangria: (typeof impressao === 'object' ? impressao.sangria : undefined) ?? pag.sangria, marcasCorte: (typeof impressao === 'object' ? impressao.marcasCorte : undefined) ?? pag.marcasCorte } : null
  const folga = grafica ? grafica.sangria + (grafica.marcasCorte ? MARGEM_MARCAS : 0) : 0
  const pagina = `@page { size: ${pag.largura + 2 * folga}mm ${pag.altura + 2 * folga}mm; margin: 0; }`
  const varsGrafica = grafica ? `${seletor} { --ty-print-sangria: ${grafica.sangria}mm; --ty-print-folga: ${folga}mm; }` : ''
  const modo = modoFontes ?? (carregarFontes ? 'google' : 'nenhuma')
  const faces = modo === 'locais' ? fontesLocaisCss(resolvido) : ''
  const css = `${faces}\n${incluirCss ? PRINT_CSS : ''}\n${printStyleToCss(base, { pb, overrides: tokens, seletor })}${pagina}\n${varsGrafica}`
  const fontes = modo === 'google' ? googleFontsUrl(resolvido) : null
  const e = resolvido.estrutura
  return (
    <div
      className={cx('ty-print-book', className)}
      lang={lang}
      data-ty-print-livro={escopo}
      data-ty-print-style={base.name}
      data-ty-print-pb={pb ? '' : undefined}
      data-ty-print-escuro={papelEscuro(resolvido) ? '' : undefined}
      data-ty-print-grafico={resolvido.grafico}
      data-ty-print-marca={resolvido.marcaProva}
      data-ty-print-painel={e.painel}
      data-ty-print-rotulo={e.rotulo}
      data-ty-print-notas={e.notas}
      data-ty-print-figura={e.figura}
      data-ty-print-textura={resolvido.papel.textura}
      data-ty-print-tremor={resolvido.traco.tremor > 0 ? '' : undefined}
      data-ty-print-caixa-alta={resolvido.caixaAlta ? '' : undefined}
      data-ty-print-moldura={e.moldura && e.moldura !== 'nenhuma' ? e.moldura : undefined}
      data-ty-print-cabeco={e.cabeco && e.cabeco !== 'texto' ? e.cabeco : undefined}
      data-ty-print-titulo={e.tituloEstilo && e.tituloEstilo !== 'normal' ? e.tituloEstilo : undefined}
      data-ty-print-fundo-painel={e.fundoPainel}
      data-ty-print-veredito={e.veredito}
      data-ty-print-costura={e.costura}
      data-ty-print-manchete={e.manchete}
      data-ty-print-rastro={e.rastro && e.rastro !== 'lista' ? e.rastro : undefined}
      data-ty-print-grafica={grafica ? '' : undefined}
      data-ty-print-folio={resolvido.folio?.folio === 'centro' ? 'centro' : undefined}
      data-ty-print-cabeco-pos={resolvido.folio?.cabeco === 'centro' ? 'centro' : undefined}
      data-ty-print-numeros-marcados={e.numerosMarcados ? '' : undefined}
    >
      {fontes ? <link rel="stylesheet" href={fontes} /> : null}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <EscopoLivroProvider value={escopo}>
        <PrintContextoProvider value={{ estilo: resolvido, pb, grafica: grafica ? { ...grafica, folga } : null }}>{children}</PrintContextoProvider>
      </EscopoLivroProvider>
    </div>
  )
}
