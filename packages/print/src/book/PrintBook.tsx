import type { ReactNode } from 'react'
import {
  googleFontsUrl,
  papelEscuro,
  printPresetById,
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
  /** The book style: a preset object or its name (a deprecated id from PRINT_STYLE_ALIASES resolves to its new style). */
  estilo: PrintStyle | PrintStyleId
  /** Editor overrides of any token (partial). */
  tokens?: PrintStyleOverrides
  /** Black and white print. */
  pb?: boolean
  /** Inject the component stylesheet (turn off when the host imports `@datatechsolutions/tympan-print/styles.css`). */
  incluirCss?: boolean
  /** Link the style's Google Fonts (turn off when the host loads fonts itself, e.g. embedded in an EPUB). */
  carregarFontes?: boolean
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

/**
 * Root of a printed book: sets the style (`data-ty-print-style`), injects the
 * preset's custom properties, the component CSS and `@page` (170 × 240 mm),
 * and provides the resolved style to every component below.
 */
export function LivroPrint({ estilo, tokens, pb = false, incluirCss = true, carregarFontes = true, lang = 'pt-BR', escopo: escopoProp, className, children }: LivroPrintProps) {
  const base = typeof estilo === 'string' ? printPresetById(estilo) : estilo
  const resolvido = resolvePrintStyle(base, { pb, overrides: tokens })
  const escopo = `tpb-${(escopoProp ?? hashCurto(JSON.stringify([pb, resolvido]))).replace(/[^a-zA-Z0-9_-]/g, '')}`
  const seletor = `[data-ty-print-livro="${escopo}"]`
  const css = `${incluirCss ? PRINT_CSS : ''}\n${printStyleToCss(base, { pb, overrides: tokens, seletor })}`
  const fontes = carregarFontes ? googleFontsUrl(resolvido) : null
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
      data-ty-print-numeros-marcados={e.numerosMarcados ? '' : undefined}
    >
      {fontes ? <link rel="stylesheet" href={fontes} /> : null}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <EscopoLivroProvider value={escopo}>
        <PrintContextoProvider value={{ estilo: resolvido, pb }}>{children}</PrintContextoProvider>
      </EscopoLivroProvider>
    </div>
  )
}
