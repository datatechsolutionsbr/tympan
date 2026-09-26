import type { ReactNode } from 'react'
import { cx } from '../util.ts'
import { comColchetes } from './comum.tsx'
import { larguraColunas } from './Painel.tsx'

export type VarianteTexto = 'corpo' | 'lead' | 'citacao' | 'frase' | 'meta' | 'codigo' | 'display'

export interface TextoProps {
  eyebrow?: string
  titulo?: string
  /** Heading level of the title: 1 chapter, 2 spread, 3 section. */
  nivel?: number
  /** corpo (body), lead (opening paragraph), citacao (quotation), frase (rule of thumb), meta (small print), codigo (SQL), display (large). */
  variante?: VarianteTexto
  paragrafos?: string[]
  lista?: { ordenada?: boolean; itens: string[] }
  /** Columns of the six-column page grid. */
  largura?: number
  className?: string
  children?: ReactNode
}

/** Running text: eyebrow, title and paragraphs or a list. `[brackets]` print as placeholders. */
export function Texto({ eyebrow, titulo, nivel = 2, variante = 'corpo', paragrafos, lista, largura, className, children }: TextoProps) {
  const H = (`h${Math.min(4, Math.max(1, nivel))}` as 'h1' | 'h2' | 'h3' | 'h4')
  const Lista = lista?.ordenada ? 'ol' : 'ul'
  return (
    <div className={cx('ty-print-texto', className)} data-variante={variante} data-nivel={nivel} style={larguraColunas(largura)}>
      {eyebrow ? <p className="ty-print-sobretitulo">{comColchetes(eyebrow)}</p> : null}
      {titulo ? <H className="ty-print-titulo">{comColchetes(titulo)}</H> : null}
      {variante === 'codigo'
        ? paragrafos?.map((p, i) => (
            <pre key={i} className="ty-print-codigo">
              <code>{p}</code>
            </pre>
          ))
        : variante === 'citacao'
          ? paragrafos?.length
            ? (
                <blockquote className="ty-print-citacao">
                  {paragrafos.map((p, i) => (
                    <p key={i}>{comColchetes(p)}</p>
                  ))}
                </blockquote>
              )
            : null
          : paragrafos?.map((p, i) => <p key={i}>{comColchetes(p)}</p>)}
      {lista ? (
        <Lista className="ty-print-lista">
          {lista.itens.map((it, i) => (
            <li key={i}>{comColchetes(it)}</li>
          ))}
        </Lista>
      ) : null}
      {children}
    </div>
  )
}

export interface MargemProps {
  titulo: string
  texto: string
  className?: string
}

/** Margin note ("onde isso volta", "caixa de ferramentas"): in the outer margin for styles with margin notes, a small aside otherwise. */
export function Margem({ titulo, texto, className }: MargemProps) {
  return (
    <aside className={cx('ty-print-margem', className)}>
      <p className="ty-print-margem-titulo">{comColchetes(titulo)}</p>
      <p>{comColchetes(texto)}</p>
    </aside>
  )
}

export interface AnotacaoProps {
  /** Number of the chart callout the note explains ("1", "2"). */
  alvo?: string
  texto: string
  className?: string
}

/** Editorial note, drawn the style's way (hand lettering, italic, sidenote in the margin). */
export function Anotacao({ alvo, texto, className }: AnotacaoProps) {
  return (
    <aside className={cx('ty-print-anotacao', className)}>
      {alvo ? (
        <span className="ty-print-chamada" aria-label={`chamada ${alvo}`}>
          {alvo}
        </span>
      ) : null}
      <span className="ty-print-anotacao-texto">{comColchetes(texto)}</span>
    </aside>
  )
}
