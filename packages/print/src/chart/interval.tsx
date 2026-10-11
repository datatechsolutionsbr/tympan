// Interval chart (dot and whisker): one row per estimate with its interval (e.g. a bootstrap 95% CI), rows in
// optional groups, an optional tick per sample/seed. Lengths from one linear scale; colours from the theme:
// marked rows in `destaque`, the rest in a constant series ink, colours by key when the spec gives them.
import type { ReactNode } from 'react'
import { usePrint } from '../context.tsx'
import { tx } from '../i18n.ts'
import type { CorDado, CtxPincel, Pincel } from './brushes.tsx'
import { coresCategorias } from './categoryColours.ts'
import { TEXTO, escalaLinear, larguraTexto, marcasEixo, numeroBr } from './geometry.ts'
import { numeroLocal } from '../i18n.ts'
import type { SpecIntervalo } from './types.ts'

type Ctx = CtxPincel & { p: Pincel }
const n = (v: number) => Math.round(v * 1000) / 1000

export function Intervalo({ c, spec, largura }: { c: Ctx; spec: SpecIntervalo; largura: number }) {
  const { pb } = usePrint()
  const grupos = spec.grupos ?? [{ titulo: undefined, nota: undefined, linhas: spec.linhas ?? [] }]
  const todas = grupos.flatMap((g) => g.linhas)
  const casas = spec.casas ?? 1
  const fmt = (v: number) => numeroLocal(v, casas, true)
  const esq = n(Math.min(largura * 0.35, Math.max(...todas.map((l) => larguraTexto(l.rotulo))) + 2.4))
  const dir = n(Math.max(0, ...todas.map((l) => (l.valor === undefined ? 0 : larguraTexto(fmt(l.valor))))) + 2.6)
  const x0 = esq
  const x1 = n(largura - dir)
  const x = escalaLinear(spec.escala, [x0, x1])
  const porChave = spec.cores ? coresCategorias(todas.map((l) => l.categoria ?? l.rotulo), c.estilo, pb, spec.cores) : null
  const ALT = 3.8
  const CAB = 4.4
  let y = 0.5
  const partes: ReactNode[] = []
  let k = 0
  grupos.forEach((g, gi) => {
    if (g.titulo) {
      partes.push(
        <text key={`h${gi}`} className="ty-print-g-group" x={0} y={n(y + 3.2)}>
          {g.titulo}
          {g.nota ? <tspan className="ty-print-g-note">{`  ${g.nota}`}</tspan> : null}
        </text>,
      )
      y += CAB
    }
    for (const l of g.linhas) {
      const cy = n(y + ALT / 2)
      const ch = porChave?.[k]
      const cor: CorDado = ch ? (ch.cor as CorDado) : l.destaque ? 'destaque' : 'tinta-2'
      const iv = l.intervalo
      const soAmostras = !iv
      partes.push(
        <g key={`r${gi}-${k}`} className="ty-print-g-line ty-print-interval" data-linha={k} data-destaque={l.destaque ? '' : undefined} data-lo={iv?.[0]} data-hi={iv?.[1]} data-valor={l.valor} data-amostras={soAmostras ? '' : undefined}>
          <text className="ty-print-g-label" x={n(x0 - 2)} y={n(cy + 0.9)} textAnchor="end" data-cor={l.destaque ? 'destaque' : 'tinta'}>
            {l.rotulo}
          </text>
          {iv ? (
            <>
              {c.p.linha(c, { chave: `ic-${k}`, x1: x(iv[0]), y1: cy, x2: x(iv[1]), y2: cy, cor, largura: 0.6, tipo: 'serie' })}
              {c.p.linha(c, { chave: `ic-${k}-l`, x1: x(iv[0]), y1: n(cy - 1), x2: x(iv[0]), y2: n(cy + 1), cor, largura: 0.35, tipo: 'guia' })}
              {c.p.linha(c, { chave: `ic-${k}-h`, x1: x(iv[1]), y1: n(cy - 1), x2: x(iv[1]), y2: n(cy + 1), cor, largura: 0.35, tipo: 'guia' })}
            </>
          ) : null}
          {(l.amostras ?? []).map((s, si) =>
            soAmostras ? (
              <g key={si} className="ty-print-interval-sample" transform={`translate(${x(s)} ${cy})`}>
                {c.p.ponto(c, { chave: `am-${k}-${si}`, r: 0.6, cor, cheio: false })}
              </g>
            ) : (
              <g key={si} className="ty-print-interval-sample">
                {c.p.linha(c, { chave: `am-${k}-${si}`, x1: x(s), y1: n(cy - 1.6), x2: x(s), y2: n(cy - 0.7), cor: 'tinta-3', largura: 0.25, tipo: 'guia' })}
              </g>
            ),
          )}
          {l.valor !== undefined ? <g transform={`translate(${x(l.valor)} ${cy})`}>{c.p.ponto(c, { chave: `pt-${k}`, r: l.destaque ? 1.15 : 0.95, cor, cheio: !(pb && !l.destaque && !ch) })}</g> : null}
          {l.valor !== undefined ? (
            <text className="ty-print-g-value" x={n(x1 + 1.5)} y={n(cy + 0.9)} data-cor={l.destaque ? 'destaque' : 'tinta'}>
              {fmt(l.valor)}
            </text>
          ) : null}
        </g>,
      )
      y += ALT
      k++
    }
    y += 1.4
  })
  const topo = 0.5
  const eixoY = n(y)
  const marcas = marcasEixo(spec.escala, Math.max(3, Math.floor((x1 - x0) / 17)))
  const H = n(eixoY + 4.2 + (spec.unidade ? 2.8 : 0))
  return {
    L: { largura, altura: H },
    corpo: (
      <>
        <g className="ty-print-g-axis">
          {marcas.map((v) => (
            <g key={v}>
              <g className="ty-print-grid">{c.p.linha(c, { chave: `g-${v}`, x1: x(v), y1: topo, x2: x(v), y2: eixoY, cor: 'linha', largura: 0.12, tipo: 'grade' })}</g>
              <text className="ty-print-g-axis-text" x={x(v)} y={n(eixoY + TEXTO + 0.3)} textAnchor="middle">
                {spec.casas !== undefined ? fmt(v) : numeroBr(v)}
              </text>
            </g>
          ))}
          {c.p.linha(c, { chave: 'eixo', x1: x0, y1: eixoY, x2: x1, y2: eixoY, cor: 'tinta-2', largura: 0.2, tipo: 'eixo' })}
          {spec.unidade ? (
            <text className="ty-print-g-unit" x={x1} y={n(eixoY + 5.6)} textAnchor="end">
              {spec.unidade}
            </text>
          ) : null}
        </g>
        {partes}
      </>
    ),
    tabela: {
      colunas: [tx('base'), { rotulo: spec.unidade ?? tx('valor'), numerica: true }, { rotulo: spec.rotuloIntervalo ?? 'IC', numerica: true }],
      linhas: todas.map((l) => [l.rotulo, l.valor === undefined ? '' : fmt(l.valor), l.intervalo ? `${fmt(l.intervalo[0])}–${fmt(l.intervalo[1])}` : (l.amostras ?? []).map(fmt).join('; ')]),
    },
    legendaCores: porChave && spec.legenda !== false ? porChave : undefined,
    eixo: { x0, x1, d0: spec.escala[0], d1: spec.escala[1] },
  }
}
