import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { LarguraProvider, useLarguraDisponivel, usePrint } from '../contexto.tsx'
import { cx } from '../util.ts'

export interface FigurasProps {
  /**
   * auto (default): side by side when the style says so (`estrutura.multiplos`; without it, The Economist's
   * pair with the bar on top and the column styles), stacked otherwise; lado: always side by side; pilha: always stacked.
   */
  arranjo?: 'auto' | 'lado' | 'pilha'
  /** Relative widths when side by side (default: each figure's number of rows, so bars keep one scale of thickness). */
  pesos?: number[]
  /** Headline of the figures ("O lado de cima está mais cheio"): printed only by styles that headline their charts (`estrutura.manchete`). */
  manchete?: string
  className?: string
  children?: ReactNode
}

const VAO = 5

/**
 * A group of figures that answer one question (the first cut, then the 17 cuts). The style decides whether
 * they stack or pair up; side by side, each figure is drawn at its share of the width, never shrunk after.
 */
export function Figuras({ arranjo = 'auto', pesos, manchete, className, children }: FigurasProps) {
  const { estilo } = usePrint()
  const total = useLarguraDisponivel() ?? 128
  const e = estilo.estrutura
  const titulo = manchete && e.manchete ? <Manchete texto={manchete} forma={e.manchete} /> : null
  // Dados BR: the figures' notes leave the drawing for a "Leia assim" column beside it.
  if (e.notasFigura === 'coluna') {
    const notas: Array<{ marca?: string; texto: string }> = []
    const semNotas = Children.toArray(children).map((f) => tirarNotas(f, notas))
    if (notas.length) {
      const larguraNotas = Math.round(((total - 5) / 3) * 10) / 10
      return (
        <div className={cx('ty-print-figuras-bloco', className)}>
          {titulo}
          <div className="ty-print-figuras-leia">
            <LarguraProvider value={Math.round((total - 5 - larguraNotas) * 10) / 10}>
              <Figuras arranjo={arranjo} pesos={pesos}>
                {semNotas}
              </Figuras>
            </LarguraProvider>
            <aside className="ty-print-leia-assim">
              <p className="ty-print-leia-assim-titulo">Leia assim</p>
              <ol>
                {notas.map((n, i) => (
                  <li key={i}>
                    <span className="ty-print-chamada">{n.marca ?? i + 1}</span>
                    <span>{n.texto}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      )
    }
  }
  const filhos = Children.toArray(children)
  if (titulo) {
    return (
      <div className={cx('ty-print-figuras-bloco', className)}>
        {titulo}
        <Figuras arranjo={arranjo} pesos={pesos}>
          {children}
        </Figuras>
      </div>
    )
  }
  const padrao = e.multiplos ? e.multiplos === 'lado-a-lado' : e.figura === 'barra-topo' || e.barras === 'vertical'
  const lado = arranjo === 'lado' || (arranjo === 'auto' && filhos.length > 1 && padrao)
  // Multiples on tinted cards (Le Corbusier, Bayer) lose the card's padding.
  const recuo = e.cabecaMultiplo === 'caixa-cor' ? 5.2 : 0
  if (!lado) {
    return (
      <div className={cx('ty-print-figuras', className)} data-arranjo="pilha" data-cabeca={e.cabecaMultiplo}>
        {recuo ? <LarguraProvider value={total - recuo}>{filhos}</LarguraProvider> : filhos}
      </div>
    )
  }
  const p = filhos.map((f, i) => pesos?.[i] ?? pesoDe(f))
  const soma = p.reduce((a, b) => a + b, 0) || 1
  const util = total - VAO * (filhos.length - 1)
  return (
    <div
      className={cx('ty-print-figuras', className)}
      data-arranjo="lado"
      data-cabeca={e.cabecaMultiplo}
      style={{ gridTemplateColumns: p.map((x) => `${Math.max(0.5, x)}fr`).join(' ') }}
    >
      {filhos.map((f, i) => (
        <div key={i} className="ty-print-figuras-item">
          {e.letraMultiplo ? <p className="ty-print-figuras-letra">{String.fromCharCode(65 + i)}</p> : null}
          <LarguraProvider value={Math.round(((util * (p[i] ?? 1)) / soma - recuo) * 10) / 10}>{f}</LarguraProvider>
        </div>
      ))}
    </div>
  )
}

/** A figure's share: its rows (spec.linhas, spec.barras or spec.grupos), at least 2. */
function pesoDe(f: ReactNode): number {
  if (!isValidElement<{ spec?: { linhas?: unknown[]; barras?: unknown[]; grupos?: unknown[] }; no?: { props?: { spec?: { linhas?: unknown[]; barras?: unknown[]; grupos?: unknown[] } } } }>(f)) return 1
  const spec = f.props.spec ?? f.props.no?.props?.spec
  const n = spec?.linhas?.length ?? spec?.barras?.length ?? spec?.grupos?.length ?? 2
  return Math.max(2, n)
}

function Manchete({ texto, forma }: { texto: string; forma: 'texto' | 'faixa' | 'diagonal' | 'lupa' }) {
  return (
    <p className="ty-print-manchete-grafico" data-forma={forma}>
      <span>{texto}</span>
    </p>
  )
}

interface Anotacao {
  linha: number
  texto: string
}
interface SpecComNotas {
  anotacoes?: Anotacao[]
  linhas?: Array<{ marca?: string }>
}

/** Moves a figure's annotations into `notas` (numbered by the row's callout) and returns the figure without them. */
function tirarNotas(f: ReactNode, notas: Array<{ marca?: string; texto: string }>): ReactNode {
  if (!isValidElement(f)) return f
  const el = f as ReactElement<{ spec?: SpecComNotas; no?: { tipo: string; props: { spec?: SpecComNotas } } }>
  const doNo = el.props.no
  const spec = el.props.spec ?? doNo?.props.spec
  if (!spec?.anotacoes?.length) return f
  for (const a of spec.anotacoes) notas.push({ marca: spec.linhas?.[a.linha]?.marca, texto: a.texto })
  const limpo = { ...spec, anotacoes: [] }
  return doNo ? cloneElement(el, { no: { ...doNo, props: { ...doNo.props, spec: limpo } } }) : cloneElement(el, { spec: limpo })
}
