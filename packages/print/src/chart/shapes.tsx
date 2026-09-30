// Signature shapes of the comparison chart (G1 of the style audit), chosen by
// the preset (`estrutura.forma`): the cut as the central axis (concretismo,
// cartao-postal), the folding bar (graficos-1900), the flow bands
// (fluxo-historico) and the cards (blocos-coloridos). Same rule as every method chart: one linear scale per
// figure turns each value into a length, height or thickness; the renderer
// only decides how the mark looks, so each shape works in all eight of them.
import type { ReactNode } from 'react'
import {
  TEXTO,
  TEXTO_PEQUENO,
  anotar,
  larguraTexto,
  linhasDe,
  marcasEixo,
  numeroBr,
  type LinhaGenerica,
} from './geometry.ts'
import { Anotacoes, Chamada, Legenda, Rotulos, coresLinha, larguraLegenda, type CtxGrafico } from './parts.tsx'
import { cssCor, type CorDado } from './brushes.tsx'
import type { SpecBarras } from './tipos.ts'

const n = (v: number) => {
  const r = Math.round(v * 1000) / 1000
  return Object.is(r, -0) ? 0 : r
}

export interface ResultadoForma {
  L: { largura: number; altura: number }
  corpo: ReactNode
  tabela: { colunas: Array<string | { rotulo: string; numerica?: boolean }>; linhas: Array<Array<string | number>> }
  eixo: { x0: number; x1: number; d0: number; d1: number } | null
}

function tabelaDe(spec: SpecBarras, linhas: LinhaGenerica[]): ResultadoForma['tabela'] {
  const pares = linhas.some((l) => l.valores.length > 1)
  return pares
    ? {
        colunas: ['Base', { rotulo: spec.rotuloA ?? 'a', numerica: true }, { rotulo: spec.rotuloB ?? 'b', numerica: true }],
        linhas: linhas.map((l) => [l.nota ? `${l.rotulo} (${l.nota})` : l.rotulo, l.valores[0]?.valor ?? '', l.valores[1]?.valor ?? '']),
      }
    : { colunas: ['Base', { rotulo: spec.unidade ?? 'valor', numerica: true }], linhas: linhas.map((l) => [l.rotulo, l.valores[0]?.valor ?? '']) }
}

function coresSerie(l: LinhaGenerica, algum: boolean, unico: boolean): Record<'a' | 'b', CorDado> {
  const cor = coresLinha(Boolean(l.destaque), algum)
  if (unico) return { a: cor.b, b: algum && !l.destaque ? 'contexto' : 'destaque' }
  return { a: algum && !l.destaque ? 'contexto' : cor.a, b: cor.b }
}

function chave(c: CtxGrafico, spec: SpecBarras, pares: boolean, algum: boolean): ReactNode {
  if (!pares) return null
  return (
    <Legenda
      c={c}
      y={2.4}
      itens={[
        { x: 0, texto: spec.rotuloA ?? 'a', cor: algum ? 'contexto' : 'destaque-2', tipo: 'barra-a' },
        { x: larguraLegenda(spec.rotuloA ?? 'a'), texto: spec.rotuloB ?? 'b', cor: algum ? 'tinta' : 'destaque', tipo: 'barra-b' },
      ]}
    />
  )
}

function colunaRotulos(linhas: LinhaGenerica[], largura: number) {
  const w = Math.max(12, ...linhas.map((l) => larguraTexto(l.rotulo, TEXTO * 1.04)), ...linhas.map((l) => (l.nota ? larguraTexto(l.nota, TEXTO_PEQUENO * 1.12) : 0)))
  return n(Math.min(w + 3, largura * 0.3))
}

/** Bar drawn by the renderer at (x, y), growing right, or left (mirrored, so dot and icon grids grow away from the axis). */
function barra(c: CtxGrafico, o: { chave: string; x: number; y: number; w: number; h: number; cor: CorDado; hachura: boolean; valor: number; mm: number; esquerda?: boolean; linha: number; serie: 'a' | 'b'; attrs?: Record<string, string | number> }) {
  return (
    <g
      className="ty-print-bar"
      data-linha={o.linha}
      data-serie={o.serie}
      data-valor={o.valor}
      data-x={o.esquerda ? n(o.x - o.w) : o.x}
      data-w={o.w}
      data-y={o.y}
      data-h={o.h}
      {...o.attrs}
      transform={o.esquerda ? `translate(${o.x} ${o.y}) scale(-1 1)` : `translate(${o.x} ${o.y})`}
    >
      {c.p.barra(c, { chave: o.chave, w: o.w, h: o.h, cor: o.cor, enchimento: o.hachura ? 'hachura' : 'cheio', valor: o.valor, mmPorUnidade: o.mm })}
    </g>
  )
}

function notasEmbaixo(c: CtxGrafico, spec: SpecBarras, linhas: LinhaGenerica[], ancora: (i: number) => { x: number; y: number } | null, largura: number, x0: number, y: number) {
  const { postas, fim } = anotar(spec.anotacoes, ancora, largura, x0, y)
  return { el: <Anotacoes c={c} postas={postas} marcas={linhas.map((l) => l.marca)} />, fim }
}

/** Smallest tick value (steps of 1, 2, 2,5, 5 × 10^k) at or above v. */
function tetoRedondo(v: number) {
  const m = marcasEixo([0, v], 2)
  const passo = m.length > 1 ? m[1]! - m[0]! : v
  return Math.ceil(v / passo - 1e-9) * passo
}

/** Nice round unit near `alvo` (1, 2, 5 × 10^k). */
function unidadeRedonda(alvo: number) {
  const mag = 10 ** Math.floor(Math.log10(Math.max(1e-9, alvo)))
  for (const m of [1, 2, 5, 10]) if (m * mag >= alvo * 0.8) return m * mag
  return 10 * mag
}

// ---------------------------------------------------------------------------
// eixo-central: the cut is the axis (concretismo; with the dot renderer, cartao-postal)
// ---------------------------------------------------------------------------

export function EixoCentral({ c, spec, largura }: { c: CtxGrafico; spec: SpecBarras; largura: number }): ResultadoForma {
  const linhas = linhasDe(spec)
  const pares = linhas.some((l) => l.valores.length > 1)
  const algum = linhas.some((l) => l.destaque)
  const hachura = c.estilo.traco.hachura !== 'nenhuma'
  const wRot = colunaRotulos(linhas, largura)
  const maxA = Math.max(0, ...linhas.map((l) => (pares ? l.valores[0]?.valor ?? 0 : 0)))
  // The side below the cut ends on a round value just past its largest bar; both sides share one scale.
  const dl = maxA > 0 ? tetoRedondo(maxA) : 0
  const dr = spec.escala[1]
  const reservaE = pares ? larguraTexto(numeroBr(maxA)) + 2.2 : 0
  const reservaD = larguraTexto(numeroBr(dr)) + (linhas.some((l) => l.marca) ? 6 : 2.2)
  const xL = n(wRot + reservaE)
  const xR = n(largura - reservaD)
  const k = (xR - xL) / Math.max(1e-9, dl + dr)
  const xc = n(xL + dl * k)
  const topo = pares ? 9 : 4
  const h = 3.4
  const passo = 6.6
  const rows = linhas.map((l, i) => ({ l, y: n(topo + 1 + i * passo) }))
  const yFim = n((rows[rows.length - 1]?.y ?? topo) + h + 1.6)
  const marcas = [...(pares ? marcasEixo([0, dl], Math.max(2, Math.floor((dl * k) / 14))).filter((v) => v > 0).map((v) => ({ v, x: n(xc - v * k) })) : []), ...marcasEixo([0, dr], Math.max(3, Math.floor((dr * k) / 14))).map((v) => ({ v, x: n(xc + v * k) }))]
  const notas = notasEmbaixo(
    c,
    spec,
    linhas,
    (i) => {
      const r = rows[i]
      return r ? { x: xc, y: r.y + h } : null
    },
    largura,
    wRot,
    n(yFim + 4.4),
  )
  const altura = n(Math.max(yFim + 5.6, notas.fim + 1.2))
  const corpo = (
    <>
      {chave(c, spec, pares, algum)}
      {pares ? (
        <g className="ty-print-g-sides" style={{ fontSize: 2.2 }}>
          <text x={n(xc - 1)} y={n(topo - 0.6)} textAnchor="end" style={{ fill: cssCor('tinta-2'), fontSize: 2.2 }}>
            {`← ${spec.rotuloA ?? 'a'}`}
          </text>
          <text x={n(xc + 1)} y={n(topo - 0.6)} style={{ fill: cssCor('tinta-2'), fontSize: 2.2 }}>
            {`${spec.rotuloB ?? 'b'} →`}
          </text>
        </g>
      ) : null}
      <g className="ty-print-g-axis">
        {marcas.map((m) => (
          <text key={m.x} className="ty-print-g-axis-text" x={m.x} y={n(yFim + 2.6)} textAnchor="middle">
            {numeroBr(m.v)}
          </text>
        ))}
      </g>
      {rows.map(({ l, y }, i) => {
        const cor = coresSerie(l, algum, !pares)
        const a = pares ? l.valores[0]! : null
        const b = pares ? l.valores[1]! : l.valores[0]!
        const wa = a ? n(a.valor * k) : 0
        const wb = n(b.valor * k)
        const direita = n(xc + wb + 1)
        return (
          <g key={i} className="ty-print-g-line" data-linha={i} data-destaque={l.destaque ? '' : undefined}>
            <Rotulos y={n(y + 1.6)} rotulo={l.rotulo} nota={l.nota} local={l.local} />
            {a ? barra(c, { chave: `ec-${i}-a`, x: xc, y, w: wa, h, cor: cor.a, hachura: hachura && !algum, valor: a.valor, mm: k, esquerda: true, linha: i, serie: 'a' }) : null}
            {barra(c, { chave: `ec-${i}-b`, x: xc, y, w: wb, h, cor: cor.b, hachura: false, valor: b.valor, mm: k, linha: i, serie: 'b' })}
            {a ? (
              <text className="ty-print-g-value-a" x={n(xc - wa - 1)} y={n(y + h - 0.7)} textAnchor="end" data-cor={l.destaque ? 'destaque' : 'tinta'}>
                {numeroBr(a.valor)}
              </text>
            ) : null}
            <text className="ty-print-g-value" x={direita} y={n(y + h - 0.7)} data-cor={l.destaque ? 'destaque' : 'tinta'}>
              {numeroBr(b.valor)}
            </text>
            {l.marca ? <Chamada x={n(direita + larguraTexto(numeroBr(b.valor)) + 3)} y={n(y + h / 2)} texto={l.marca} /> : null}
          </g>
        )
      })}
      {/* The axis is the cut: drawn over the bars' roots. */}
      <g className="ty-print-g-cut">{c.p.linha(c, { chave: 'eixo-central', x1: xc, y1: n(topo), x2: xc, y2: yFim, cor: 'tinta', largura: 0.6, tipo: 'eixo' })}</g>
      {notas.el}
    </>
  )
  return { L: { largura, altura }, corpo, tabela: tabelaDe(spec, linhas), eixo: { x0: xc, x1: n(xc + dr * k), d0: 0, d1: dr } }
}

// ---------------------------------------------------------------------------
// ziguezague: a bar longer than one line folds back and forth (graficos-1900)
// ---------------------------------------------------------------------------

export function Ziguezague({ c, spec, largura }: { c: CtxGrafico; spec: SpecBarras; largura: number }): ResultadoForma {
  const linhas = linhasDe(spec)
  const pares = linhas.some((l) => l.valores.length > 1)
  const algum = linhas.some((l) => l.destaque)
  const hachura = c.estilo.traco.hachura !== 'nenhuma'
  // A fixed label column (unless a label needs more), so figures of the same width share the ruler.
  const wRot = n(Math.max(colunaRotulos(linhas, largura), largura * 0.26))
  const D = spec.dobra && spec.dobra > 0 ? spec.dobra : spec.escala[1]
  const xL = n(wRot + 1.6)
  const xR = n(largura - 3.2)
  // Fixed room for the value and its callout after the last line: two figures with the same `dobra` and width
  // get exactly the same scale (the point of the folding bar is one ruler for all).
  const reservaFim = larguraTexto('0.000') + 6
  // One line = D units; the last line of the longest bar still leaves room for its value.
  const k = (xR - xL - reservaFim) / Math.max(1e-9, D)
  const xFim = n(xL + D * k)
  const h = 2
  const entre = 0.8
  let y = pares ? 7.6 : 4
  const blocos: ReactNode[] = []
  const ancoras: Array<{ x: number; y: number }> = []
  linhas.forEach((l, i) => {
    const cor = coresSerie(l, algum, !pares)
    const y0 = y
    const partes: ReactNode[] = []
    let yFimLinha = y
    l.valores.forEach((v) => {
      let resta = v.valor
      let j = 0
      let fimX = xL
      let fimY = y
      while (resta > 1e-9 || j === 0) {
        const u = Math.min(resta, D)
        const w = n(u * k)
        const paraDireita = j % 2 === 0
        const yy = n(y)
        partes.push(barra(c, { chave: `zz-${i}-${v.serie}-${j}`, x: paraDireita ? xL : xFim, y: yy, w, h, cor: cor[v.serie], hachura: v.serie === 'a' && pares && hachura, valor: u, mm: k, esquerda: !paraDireita, linha: i, serie: v.serie, attrs: { 'data-dobra': j, 'data-total': v.valor } }))
        if (u >= D - 1e-9 && resta - u > 1e-9) {
          // Full line: its worth written inside it, and the turn to the next line (decoration, outside the length).
          partes.push(
            <text key={`d-${i}-${v.serie}-${j}`} x={paraDireita ? n(xFim - 1) : n(xL + 1)} y={n(yy + h - 0.6)} textAnchor={paraDireita ? 'end' : 'start'} style={{ fontSize: 1.9, fill: 'var(--ty-print-papel)', fontWeight: 700 }}>
              {numeroBr(D)}
            </text>,
          )
          const xv = paraDireita ? xFim : xL
          const r = (h + entre) / 2
          partes.push(
            <path key={`t-${i}-${v.serie}-${j}`} d={`M${xv} ${n(yy + h / 2)}A${n(r)} ${n(r)} 0 0 ${paraDireita ? 1 : 0} ${xv} ${n(yy + h / 2 + 2 * r)}`} style={{ fill: 'none', stroke: cssCor(cor[v.serie]), strokeWidth: 0.35 }} />,
          )
        }
        fimX = paraDireita ? xL + w : xFim - w
        fimY = yy
        resta -= u
        j++
        if (resta > 1e-9) y += h + entre
      }
      const paraDireita = (j - 1) % 2 === 0
      partes.push(
        <text key={`v-${i}-${v.serie}`} className={v.serie === 'a' && pares ? 'ty-print-g-value-a' : 'ty-print-g-value'} x={n(paraDireita ? fimX + 1 : fimX - 1)} y={n(fimY + h - 0.5)} textAnchor={paraDireita ? 'start' : 'end'} data-cor={l.destaque ? 'destaque' : 'tinta'}>
          {numeroBr(v.valor)}
        </text>,
      )
      if (v.serie === (pares ? 'b' : v.serie) && l.marca) partes.push(<Chamada key={`m-${i}`} x={n((paraDireita ? fimX + 1 : fimX - 1) + (paraDireita ? larguraTexto(numeroBr(v.valor)) * 1.15 + 3 : -larguraTexto(numeroBr(v.valor)) * 1.15 - 3))} y={n(fimY + h / 2)} texto={l.marca} />)
      ancoras[i] = { x: n(fimX), y: n(fimY + h) }
      yFimLinha = y + h
      y += h + entre
    })
    blocos.push(
      <g key={i} className="ty-print-g-line" data-linha={i} data-destaque={l.destaque ? '' : undefined}>
        <Rotulos y={n(y0 + 2)} rotulo={l.rotulo} nota={l.nota} local={l.local} />
        {partes}
      </g>,
    )
    y = yFimLinha + 2.2
  })
  const notas = notasEmbaixo(c, spec, linhas, (i) => ancoras[i] ?? null, largura, wRot, n(y + 1.6))
  const altura = n(Math.max(y + 1.2, notas.fim + 1.2))
  const corpo = (
    <>
      {chave(c, spec, pares, algum)}
      <text className="ty-print-g-brace" x={largura} y={2.4} textAnchor="end">
        {`cada linha cheia = ${numeroBr(D)}`}
      </text>
      {blocos}
      {notas.el}
    </>
  )
  return { L: { largura, altura }, corpo, tabela: tabelaDe(spec, linhas), eixo: { x0: xL, x1: xFim, d0: 0, d1: D } }
}

// ---------------------------------------------------------------------------
// fluxo: bands whose thickness is the value, splitting at the cut (fluxo-historico)
// ---------------------------------------------------------------------------

export function Fluxo({ c, spec, largura }: { c: CtxGrafico; spec: SpecBarras; largura: number }): ResultadoForma {
  const linhas = linhasDe(spec)
  const pares = linhas.some((l) => l.valores.length > 1)
  const algum = linhas.some((l) => l.destaque)
  const hachura = c.estilo.traco.hachura !== 'nenhuma'
  const wRot = colunaRotulos(linhas, largura)
  const temMarca = linhas.some((l) => l.marca)
  const xL = n(wRot + (temMarca ? 5 : 1.6))
  const xR = n(largura - larguraTexto(numeroBr(spec.escala[1])) - 2.4)
  const xc = n(xL + (xR - xL) * 0.42)
  const T = 9
  const k = 6 / Math.max(1e-9, spec.escala[1])
  const gap = 1.6
  const u = unidadeRedonda(spec.escala[1] / 3)
  let y = pares ? 10 : 6
  const topoFluxo = y
  const rows = linhas.map((l, i) => {
    const vA = pares ? l.valores[0]!.valor : 0
    const vB = pares ? l.valores[1]!.valor : l.valores[0]!.valor
    const tb = n(vB * k)
    const ta = n(vA * k)
    const top = y
    y = n(y + Math.max(tb + ta + gap, 5.2) + 2.2)
    return { l, i, vA, vB, ta, tb, top }
  })
  const fimFluxo = n(y - 2.4)
  const notas = notasEmbaixo(
    c,
    spec,
    linhas,
    (i) => {
      const r = rows[i]
      return r ? { x: xR, y: r.top + r.tb + r.ta + gap } : null
    },
    largura,
    wRot,
    n(fimFluxo + 3.6),
  )
  const altura = n(Math.max(fimFluxo + 2.4, notas.fim + 1.2))
  const corpo = (
    <>
      {chave(c, spec, pares, algum)}
      <g className="ty-print-g-brace-esfootssura">
        <text className="ty-print-g-brace" x={n(largura - 3.4)} y={n(2.4 + (pares ? 3.6 : 0))} textAnchor="end">
          {`espessura de ${numeroBr(u)}`}
        </text>
        <rect x={n(largura - 2.2)} y={n(2.4 + (pares ? 3.6 : 0) - u * k)} width={1.6} height={n(u * k)} style={{ fill: 'var(--ty-print-tinta)' }} data-valor={u} data-h={n(u * k)} />
      </g>
      {rows.map(({ l, i, vA, vB, ta, tb, top }) => {
        const cor = coresSerie(l, algum, !pares)
        const yA = n(top + tb)
        const a2 = n(yA + gap)
        return (
          <g key={i} className="ty-print-g-line" data-linha={i} data-destaque={l.destaque ? '' : undefined}>
            <Rotulos y={n(top + (tb + ta) / 2 + 0.6)} rotulo={l.rotulo} nota={l.nota} local={l.local} />
            {l.marca ? <Chamada x={n(xL - 2.6)} y={n(top + (tb + ta) / 2)} texto={l.marca} /> : null}
            {barra(c, { chave: `fx-${i}-b`, x: xL, y: n(top), w: n(xR - xL), h: tb, cor: cor.b, hachura: false, valor: vB, mm: k, linha: i, serie: 'b', attrs: { 'data-espessura': tb } })}
            {pares && ta > 0 ? (
              <>
                {barra(c, { chave: `fx-${i}-a1`, x: xL, y: yA, w: n(xc - xL), h: ta, cor: cor.a, hachura: hachura && !algum, valor: vA, mm: k, linha: i, serie: 'a', attrs: { 'data-espessura': ta } })}
                {/* the split after the cut: the band bends down by a fixed gap, keeping its thickness */}
                <path
                  d={`M${xc} ${yA}C${n(xc + T / 2)} ${yA} ${n(xc + T / 2)} ${a2} ${n(xc + T)} ${a2}V${n(a2 + ta)}C${n(xc + T / 2)} ${n(a2 + ta)} ${n(xc + T / 2)} ${n(yA + ta)} ${xc} ${n(yA + ta)}Z`}
                  style={{ fill: cssCor(cor.a) }}
                />
                {barra(c, { chave: `fx-${i}-a2`, x: n(xc + T), y: a2, w: n(xR - xc - T), h: ta, cor: cor.a, hachura: hachura && !algum, valor: vA, mm: k, linha: i, serie: 'a', attrs: { 'data-espessura': ta, 'data-parte': 'depois' } })}
                <text className="ty-print-g-value-a" x={n(xR + 1)} y={n(a2 + ta / 2 + 0.8)} data-cor={l.destaque ? 'destaque' : 'tinta'}>
                  {numeroBr(vA)}
                </text>
              </>
            ) : null}
            <text className="ty-print-g-value" x={n(xR + 1)} y={n(top + tb / 2 + 0.8)} data-cor={l.destaque ? 'destaque' : 'tinta'}>
              {numeroBr(vB)}
            </text>
          </g>
        )
      })}
      <g className="ty-print-g-cut" strokeDasharray="0.7 0.6">
        {c.p.linha(c, { chave: 'corte', x1: xc, y1: n(topoFluxo - 2.2), x2: xc, y2: fimFluxo, cor: 'tinta-2', largura: 0.2, tipo: 'guia' })}
      </g>
      <text className="ty-print-g-note" x={n(xc + 0.8)} y={n(topoFluxo - 1)}>
        corte
      </text>
      {notas.el}
    </>
  )
  return { L: { largura, altura }, corpo, tabela: tabelaDe(spec, linhas), eixo: null }
}

// ---------------------------------------------------------------------------
// cartoes: one card per row, the numbers written large, mini columns on a shared scale (blocos-coloridos)
// ---------------------------------------------------------------------------

export function Cartoes({ c, spec, largura }: { c: CtxGrafico; spec: SpecBarras; largura: number }): ResultadoForma {
  const linhas = linhasDe(spec)
  const pares = linhas.some((l) => l.valores.length > 1)
  const algum = linhas.some((l) => l.destaque)
  const hachura = c.estilo.traco.hachura !== 'nenhuma'
  const marcasY = marcasEixo(spec.escala, 3)
  const wAx = n(Math.max(...marcasY.map((v) => larguraTexto(numeroBr(v), TEXTO_PEQUENO))) + 2)
  const vao = 1.6
  const nC = Math.max(1, linhas.length)
  const cw = n((largura - wAx - vao * (nC - 1)) / nC)
  const topo = pares ? 7 : 3
  const cabeca = 11.5
  const hPlot = 26
  const yTopoPlot = n(topo + cabeca + 3.2)
  const yBase = n(yTopoPlot + hPlot)
  const hCard = n(yBase - topo + 7)
  const k = hPlot / Math.max(1e-9, spec.escala[1] - spec.escala[0])
  const raio = Math.min(2.5, c.estilo.raio)
  const altura = n(topo + hCard + 1.2)
  const corpo = (
    <>
      {chave(c, spec, pares, algum)}
      <g className="ty-print-g-axis">
        {marcasY.map((v) => (
          <g key={v}>
            <text className="ty-print-g-axis-text" x={n(wAx - 1)} y={n(yBase - (v - spec.escala[0]) * k + 0.7)} textAnchor="end">
              {numeroBr(v)}
            </text>
          </g>
        ))}
      </g>
      {linhas.map((l, i) => {
        const x = n(wAx + i * (cw + vao))
        const cor = coresSerie(l, algum, !pares)
        const palavras = l.rotulo.split(/\s+/)
        const ultimo = palavras.length > 1 ? palavras.pop()! : ''
        const b = pares ? l.valores[1]! : l.valores[0]!
        const a = pares ? l.valores[0]! : null
        const grande = Math.min(5.2, (cw - 2) / Math.max(1, (numeroBr(b.valor).length + (a ? numeroBr(a.valor).length * 0.6 + 1.4 : 0)) * 0.62))
        const nb = a ? 2 : 1
        const bw = n(Math.min(5.5, (cw * 0.62) / nb))
        const inicio = n(x + cw / 2 - (bw * nb + 0.8 * (nb - 1)) / 2)
        return (
          <g key={i} className="ty-print-g-line ty-print-g-card" data-linha={i} data-destaque={l.destaque ? '' : undefined}>
            <rect x={x} y={topo} width={cw} height={hCard} rx={raio} style={{ fill: l.destaque ? 'var(--ty-print-marca-texto)' : 'var(--ty-print-contexto)', fillOpacity: l.destaque ? 1 : 0.22 }} />
            <text className="ty-print-g-note" x={n(x + 1.4)} y={n(topo + 3)} style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {palavras.join(' ')}
            </text>
            <text className="ty-print-g-label" x={n(x + 1.4)} y={n(topo + 6.2)} style={{ fontSize: 3.1 }}>
              {ultimo || l.rotulo}
            </text>
            <text x={n(x + 1.4)} y={n(topo + 11)} className="ty-print-g-value" style={{ fontSize: n(grande), fill: cssCor(cor.b) }}>
              {numeroBr(b.valor)}
              {a ? (
                <tspan style={{ fontSize: n(grande * 0.6), fill: cssCor(cor.a) }}>
                  {` × ${numeroBr(a.valor)}`}
                </tspan>
              ) : null}
            </text>
            {l.marca ? <Chamada x={n(x + cw - 2)} y={n(topo + 2.4)} texto={l.marca} /> : null}
            {c.p.linha(c, { chave: `base-${i}`, x1: n(x + 1), y1: yBase, x2: n(x + cw - 1), y2: yBase, cor: 'tinta-2', largura: 0.2, tipo: 'eixo' })}
            {(a ? [a, b] : [b]).map((v, j) => {
              const h = n((v.valor - spec.escala[0]) * k)
              const xs = n(inicio + j * (bw + 0.8))
              return (
                <g key={v.serie}>
                  <g className="ty-print-bar" data-linha={i} data-serie={v.serie} data-valor={v.valor} data-x={xs} data-base={yBase} data-h={h} transform={`translate(${xs} ${yBase}) rotate(-90)`}>
                    {c.p.barra(c, { chave: `ct-${i}-${v.serie}`, w: h, h: bw, cor: cor[v.serie], enchimento: v.serie === 'a' && pares && hachura && !algum ? 'hachura' : 'cheio', valor: v.valor, mmPorUnidade: k })}
                  </g>
                  <text className={v.serie === 'a' && pares ? 'ty-print-g-value-a' : 'ty-print-g-value'} x={n(xs + bw / 2)} y={n(yBase - h - 1)} textAnchor="middle" style={{ fontSize: 2.2 }}>
                    {numeroBr(v.valor)}
                  </text>
                </g>
              )
            })}
            {l.nota || l.local ? (
              <text className="ty-print-g-note" x={n(x + cw / 2)} y={n(yBase + 3.4)} textAnchor="middle" data-local={l.local ? '' : undefined}>
                {l.local ? (l.nota ? `${l.nota} · lake local` : 'lake local') : l.nota}
              </text>
            ) : null}
          </g>
        )
      })}
    </>
  )
  return { L: { largura, altura }, corpo, tabela: tabelaDe(spec, linhas), eixo: { x0: yBase, x1: yTopoPlot, d0: spec.escala[0], d1: spec.escala[1] } }
}
