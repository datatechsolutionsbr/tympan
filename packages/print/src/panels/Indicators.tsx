// Dense indicator panels for "one page per territorial unit" books (Brasil Real municipal page, PLANO §12–13):
// an 8-column grid of themed blocks, each with indicator tiles. A tile prints the value in the number font, a
// percentile bar (filled to the national percentile in the block's colour, never a good/bad colour), the
// position written out ("acima de 72% dos municípios", or "maior que em 72% dos municípios" when higher is
// worse) and the rank in the UF with ties ("1º–3º de 15 em RR"); a sparkline is optional. SSR-safe, sizes in mm,
// colours from the theme (`cor.temas.<id>`, as --ty-print-tema-<id>).
import type { CSSProperties, ReactNode } from 'react'
import { usePrint } from '../context.tsx'
import { tx, useIdioma } from '../i18n.ts'
import { comColchetes } from './common.tsx'
import { cx, r3 } from '../utils.ts'

export interface Ranking {
  /** Position (1 = highest value). */
  posicao: number
  /** How many share the position (ties): 3 prints "1º–3º". */
  empates?: number
  total: number
  /** Where the rank is taken ("RR"). */
  onde: string
}

export interface BarraPercentilProps {
  /** National percentile (0–100) of the value. */
  percentil: number | null | undefined
  /** 'mais' (default): higher is more; 'menos': higher is worse, and the text says so. */
  polaridade?: 'mais' | 'menos'
  ranking?: Ranking
  className?: string
}

/** The rank written out, with ties ("1º–3º de 15 em RR"). */
export function textoRanking(r: Ranking): string {
  const a = r.posicao
  const b = r.posicao + (r.empates ?? 1) - 1
  const pos = a === b ? tx('ordinal', { n: a }) : `${tx('ordinal', { n: a })}–${tx('ordinal', { n: b })}`
  return tx('ranking.posicao', { a: pos, n: r.total, b: r.onde })
}

/** Thin bar filled to the percentile in the block colour, with the position and the rank in words. */
export function BarraPercentil({ percentil, polaridade = 'mais', ranking, className }: BarraPercentilProps) {
  const { pb } = usePrint()
  if (percentil == null || !Number.isFinite(percentil)) return null
  const p = Math.max(0, Math.min(100, Math.round(percentil)))
  const texto = tx(polaridade === 'menos' ? 'percentil.maiorPior' : 'percentil.acima', { n: p })
  const rk = ranking ? textoRanking(ranking) : ''
  return (
    <div className={cx('ty-print-percentile', className)} role="img" aria-label={rk ? `${texto}; ${rk}` : texto} data-percentil={p} data-polaridade={polaridade}>
      <div className="ty-print-percentile-bar">
        <span style={{ inlineSize: `${Math.max(p, 1)}%`, background: pb ? 'color-mix(in srgb, var(--ty-print-tinta) 60%, var(--ty-print-papel))' : 'var(--cor, var(--ty-print-tinta-2))' }} />
      </div>
      <p className="ty-print-percentile-text">{texto}</p>
      {rk ? <p className="ty-print-percentile-rank">{rk}</p> : null}
    </div>
  )
}

export interface SparklineProps {
  pontos: Array<{ ano: number; valor: number }>
  /** Width and height in mm (real measures: the line is never stretched). */
  largura?: number
  altura?: number
  cor?: string
  className?: string
}

/** A series as a line (years on x), last point marked; no axis. Needs three points or more. */
export function Sparkline({ pontos, largura = 24, altura = 4.2, cor = 'var(--cor, var(--ty-print-tinta))', className }: SparklineProps) {
  if (!pontos || pontos.length < 3) return null
  const xs = pontos.map((p) => p.ano)
  const ys = pontos.map((p) => p.valor)
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)]
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)]
  const X = (v: number) => r3(0.5 + ((largura - 1) * (v - x0)) / Math.max(1, x1 - x0))
  const Y = (v: number) => r3(altura - 0.5 - ((altura - 1) * (v - y0)) / (y1 - y0 || 1))
  const d = pontos.map((p, i) => `${i ? 'L' : 'M'}${X(p.ano)},${Y(p.valor)}`).join('')
  const u = pontos[pontos.length - 1]!
  return (
    <svg className={cx('ty-print-sparkline', className)} viewBox={`0 0 ${largura} ${altura}`} style={{ inlineSize: `${largura}mm`, blockSize: `${altura}mm`, maxInlineSize: '100%' }} role="img" aria-label={tx('serie', { a: x0, b: x1 })}>
      <title>{tx('serie', { a: x0, b: x1 })}</title>
      <path d={d} style={{ fill: 'none', stroke: cor, strokeWidth: 0.35, strokeLinejoin: 'round' }} />
      <circle cx={X(u.ano)} cy={Y(u.valor)} r={0.55} style={{ fill: cor }} />
    </svg>
  )
}

export interface TileIndicadorProps {
  rotulo: string
  /** The value (null: "[sem dado]"). Numbers are formatted in the book's locale. */
  valor: number | string | null | undefined
  unidade?: string
  /** Unit before the value (currency: "R$"). */
  prefixo?: string
  /** Decimals (default: 0 from 100, 1 from 10, else 2). */
  casas?: number
  /** Print "+" on positive values (growth). */
  sinal?: boolean
  ano?: string | number
  percentil?: number | null
  polaridade?: 'mais' | 'menos'
  ranking?: Ranking
  serie?: SparklineProps['pontos']
  /** Width of the sparkline in mm (default 24). */
  larguraSerie?: number
  className?: string
}

/** One indicator: label, value in the number font with its unit, optional sparkline, percentile bar and year. */
export function TileIndicador({ rotulo, valor, unidade, prefixo, casas, sinal = false, ano, percentil, polaridade, ranking, serie, larguraSerie, className }: TileIndicadorProps) {
  const { num } = useIdioma()
  const texto =
    valor == null || (typeof valor === 'number' && !Number.isFinite(valor))
      ? `[${tx('semDado')}]`
      : typeof valor === 'number'
        ? `${sinal && valor > 0 ? '+' : ''}${num(valor, casas ?? (Math.abs(valor) >= 100 ? 0 : Math.abs(valor) >= 10 ? 1 : 2))}`
        : valor
  return (
    <div className={cx('ty-print-indicator', className)}>
      <p className="ty-print-indicator-label">{comColchetes(rotulo)}</p>
      <p className="ty-print-indicator-value">
        {prefixo ? <small className="ty-print-indicator-prefix">{prefixo}</small> : null}
        {comColchetes(texto)}
        {unidade ? <small>{unidade}</small> : null}
      </p>
      {serie ? <Sparkline pontos={serie} largura={larguraSerie} /> : null}
      {valor == null ? null : <BarraPercentil percentil={percentil} polaridade={polaridade} ranking={ranking} />}
      {ano !== undefined ? <p className="ty-print-indicator-year">{ano}</p> : null}
    </div>
  )
}

export interface BlocoTemaProps {
  /** Theme id: its colour comes from the style's `cor.temas[id]` (--ty-print-tema-<id>). */
  tema: string
  titulo: string
  /** Short tag printed in a box (P&B redundancy for the colour): "EC". */
  sigla?: string
  /** Columns of the 8-column grid this block spans (default 4). */
  span?: number
  /** Tile columns inside the block (default 2). */
  colunas?: number
  /** Text when the block has no indicator (the reason, honestly). */
  vazio?: string
  className?: string
  children?: ReactNode
}

/** A themed block: a rule and tag in the theme's colour, a title and a grid of tiles (or the reason it has none). */
export function BlocoTema({ tema, titulo, sigla, span = 4, colunas = 2, vazio, className, children }: BlocoTemaProps) {
  const { pb } = usePrint()
  const id = tema.replace(/[^a-z0-9-]/gi, '')
  const estilo = { '--cor': pb ? 'var(--ty-print-tinta)' : `var(--ty-print-tema-${id}, var(--ty-print-tinta-2))`, '--cols': colunas, gridColumn: `span ${Math.max(1, Math.min(8, span))}` } as CSSProperties
  const vazioBloco = !children || (Array.isArray(children) && children.length === 0)
  return (
    <section className={cx('ty-print-theme-block', className)} style={estilo} data-tema={id}>
      <h2 className="ty-print-theme-title">
        {sigla ? <span className="ty-print-theme-tag">{sigla}</span> : null}
        {comColchetes(titulo)}
      </h2>
      {vazioBloco ? <p className="ty-print-theme-empty">{vazio ?? tx('semIndicador')}</p> : <div className="ty-print-theme-tiles">{children}</div>}
    </section>
  )
}

export interface GradePainelProps {
  /** Columns of the grid (default 8). */
  colunas?: number
  className?: string
  children?: ReactNode
}

/** The dense panel grid: blocks of variable span packed in order (dense), filling the type area's width. */
export function GradePainel({ colunas = 8, className, children }: GradePainelProps) {
  return (
    <div className={cx('ty-print-panel-grid', className)} style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}>
      {children}
    </div>
  )
}
