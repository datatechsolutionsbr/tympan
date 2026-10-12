// Pieces shared by the method charts (GraficoMetodo and the style shapes in formas.tsx): series colours,
// numbered callouts, row labels, notes under the plot and the key.
import { contrastRatio, deltaE2000, parseColor, type PrintStyle } from '@datatechsolutions/tympan-tokens'
import { tx } from '../i18n.ts'
import type { AnotacaoPosta } from './geometry.ts'
import { TEXTO } from './geometry.ts'
import type { CorDado, CtxPincel, Pincel } from './brushes.tsx'

export interface CtxGrafico extends CtxPincel {
  p: Pincel
}
type Ctx = CtxGrafico

const n = (v: number) => Math.round(v * 1000) / 1000

/**
 * Colours of a row. The highlight colour means one thing only: the row(s) the author marked. Series keep
 * constant colours of their own, with or without a highlighted row: the first series in the context grey,
 * the second in the strong neutral `tinta-2` (readable on the paper and apart from the first); a marked row draws its second series (and its label) in `destaque`.
 */
export function coresLinha(destaque: boolean, _algumDestaque?: boolean): { a: CorDado; b: CorDado; conector: CorDado; texto: 'destaque' | 'tinta' } {
  return destaque ? { a: 'contexto', b: 'destaque', conector: 'destaque', texto: 'destaque' } : { a: 'contexto', b: 'tinta-2', conector: 'contexto', texto: 'tinta' }
}

/** Single series: a constant series ink; only a marked row is in the highlight colour. */
export function corUnica(destaque: boolean): CorDado {
  return destaque ? 'destaque' : 'tinta-2'
}

/**
 * The first series is hatched when the style asks for it, and also when its colour is too close to the second
 * series' (ΔE2000 < 10 or contrast under 2:1 between `contexto` and `tinta-2`): two series must never rely on a colour difference
 * the eye cannot see.
 */
export function hachuraSerieA(estilo: PrintStyle): boolean {
  if (estilo.traco.hachura !== 'nenhuma') return true
  const a = estilo.cor.contexto
  const b = estilo.cor.tinta2
  if (!a.startsWith('#') || !b.startsWith('#')) return false
  return deltaE2000(parseColor(a), parseColor(b)) < 10 || contrastRatio(parseColor(a), parseColor(b)) < 2
}

/** Legend colours of the two series (constant: they do not change when a row is highlighted). */
export const COR_SERIE = { a: 'contexto', b: 'tinta-2' } as const satisfies Record<'a' | 'b', CorDado>

export function Chamada({ x, y, texto }: { x: number; y: number; texto: string }) {
  return (
    <g className="ty-print-g-kicker" transform={`translate(${n(x)} ${n(y)})`}>
      <circle r={1.45} />
      <text y={0.72} textAnchor="middle">
        {texto}
      </text>
    </g>
  )
}

export function Rotulos({ y, rotulo, nota, local }: { y: number; rotulo: string; nota?: string; local?: boolean }) {
  const extra = local ? (nota ? `${nota} · ${tx('lakeLocalCurto')}` : tx('lakeLocalCurto')) : nota
  return (
    <>
      <text className="ty-print-g-label" x={0} y={n(y)}>
        {rotulo}
      </text>
      {extra ? (
        <text className="ty-print-g-note" x={0} y={n(y + TEXTO * 1.15)} data-local={local ? '' : undefined}>
          {extra}
        </text>
      ) : null}
    </>
  )
}

export function Anotacoes({ c, postas, marcas }: { c: Ctx; postas: AnotacaoPosta[]; marcas: Array<string | undefined> }) {
  const h = TEXTO * 1.4
  return (
    <g className="ty-print-g-annotetions">
      {postas.map((a, k) => (
        <g key={k} className="ty-print-g-annotetion" data-linha={a.linha}>
          {a.guia ? c.p.linha(c, { chave: `guia-${k}`, x1: a.guia.x, y1: a.guia.y1, x2: a.guia.x, y2: a.guia.y2, cor: 'destaque', largura: 0.18, tipo: 'guia' }) : <Chamada x={1.6} y={a.y - TEXTO * 0.32} texto={marcas[a.linha] ?? String(a.linha + 1)} />}
          <text x={a.x} y={a.y} textAnchor={a.guia ? 'end' : 'start'}>
            {a.linhas.map((l, i) => (
              <tspan key={i} x={a.x} dy={i === 0 ? 0 : h}>
                {l}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </g>
  )
}

export function Legenda({ c, y: yBase, itens }: { c: Ctx; y: number; itens: Array<{ x: number; y?: number; texto: string; cor: CorDado; tipo: 'ponto-vazio' | 'ponto' | 'barra-a' | 'barra-b' }> }) {
  const hachura = hachuraSerieA(c.estilo)
  return (
    <g className="ty-print-g-legend">
      {itens.map((it, k) => {
        const y = it.y ?? yBase
        return (
        <g key={k}>
          <g transform={`translate(${n(it.x + 1.2)} ${n(y - 0.8)})`}>
            {it.tipo === 'ponto' || it.tipo === 'ponto-vazio'
              ? c.p.ponto(c, { chave: `leg-${k}`, r: 0.95, cor: it.cor, cheio: it.tipo === 'ponto' })
              : <g transform="translate(-1.2 -1.2)">{c.p.barra(c, { chave: `leg-${k}`, w: 4, h: 2.4, cor: it.cor, enchimento: it.tipo === 'barra-a' && hachura ? 'hachura' : 'cheio', valor: 4, mmPorUnidade: 1 })}</g>}
          </g>
          <text x={n(it.x + (it.tipo.startsWith('barra') ? 4.6 : 3.2))} y={y}>
            {it.texto}
          </text>
        </g>
        )
      })}
    </g>
  )
}

export function larguraLegenda(t: string) {
  return t.length * TEXTO * 0.5 + 10
}
