import type { ReactNode } from 'react'
import { useAreaNome, useLado, usePrint } from '../contexto.tsx'
import { Emblema } from '../marca/Emblema.tsx'
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
  const { estilo } = usePrint()
  const recorte = estilo.estrutura.tituloEstilo === 'recorte' && nivel <= 2
  const Lista = lista?.ordenada ? 'ol' : 'ul'
  // The spread title on the left page carries the style's emblem, as in the studies.
  const area = useAreaNome()
  const lado = useLado()
  const comEmblema = Boolean(estilo.estrutura.emblema && titulo && nivel <= 2 && area === 'titulo' && lado === 'par')
  return (
    <div className={cx('ty-print-text', className)} data-variante={variante} data-nivel={nivel} data-emblema={comEmblema ? '' : undefined} style={larguraColunas(largura)}>
      {comEmblema ? <Emblema /> : null}
      {eyebrow ? <p className="ty-print-sobretitle">{comColchetes(eyebrow)}</p> : null}
      {titulo ? (
        <H className="ty-print-title">
          {recorte
            ? titulo.split(/\s+/).map((p, i) => (
                <span key={i} className="ty-print-word">
                  {comColchetes(p)}
                </span>
              ))
            : comColchetes(titulo)}
        </H>
      ) : null}
      {variante === 'codigo'
        ? paragrafos?.map((p, i) => (
            <pre key={i} className="ty-print-code">
              <code>{p}</code>
            </pre>
          ))
        : variante === 'citacao'
          ? paragrafos?.length
            ? (
                <blockquote className="ty-print-quote">
                  {paragrafos.map((p, i) => (
                    <p key={i}>{comColchetes(p)}</p>
                  ))}
                </blockquote>
              )
            : null
          : paragrafos?.map((p, i) => <p key={i}>{comColchetes(p)}</p>)}
      {lista ? (
        <Lista className="ty-print-list">
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
    <aside className={cx('ty-print-margin', className)}>
      <p className="ty-print-margin-title">{comColchetes(titulo)}</p>
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
    <aside className={cx('ty-print-annotetion', className)}>
      {alvo ? (
        <span className="ty-print-kicker" aria-label={`chamada ${alvo}`}>
          {alvo}
        </span>
      ) : null}
      <span className="ty-print-annotetion-text">{comColchetes(texto)}</span>
    </aside>
  )
}
