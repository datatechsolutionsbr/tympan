import type { ReactNode } from 'react'
import { useLarguraDisponivel, usePrint } from '../contexto.tsx'
import { TabelaDados, type TabelaDadosProps } from '../paineis/Metodo.tsx'
import { comColchetes } from '../paineis/comum.tsx'
import { semente } from '../rough.ts'
import { cx, useIdSeguro } from '../util.ts'
import {
  layoutBarras,
  layoutContagem,
  layoutHalteres,
  layoutSerie,
  linhasDe,
  larguraTexto,
  numeroBr,
  TEXTO,
  type AnotacaoPosta,
  type Eixo,
} from './geometria.ts'
import { PINCEIS, unidadeIsotype, type CorDado, type CtxPincel, type Pincel } from './pinceis.tsx'
import type { GraficoSpec, RenderizadorGrafico, SpecBarras, SpecContagem, SpecEsquema, SpecHalteres, SpecSerie } from './tipos.ts'

export interface GraficoMetodoProps {
  spec: GraficoSpec
  /** Renderer; defaults to the style's `grafico`. */
  renderizador?: RenderizadorGrafico
  /** The finding in one sentence: the figure's accessible name (and the EPUB alt text). */
  alt?: string
  /** Visible data table under the figure; without it, an equivalent table is generated for assistive technology. */
  tabela?: TabelaDadosProps
  /** The figure uses numbers from the local backfill lake, not published: tagged "lake local, não publicado". */
  local?: boolean
  /** Figure width in mm (default: the panel's inner width, or 128). */
  largura?: number
  className?: string
}

interface Ctx extends CtxPincel {
  p: Pincel
}

const n = (v: number) => Math.round(v * 1000) / 1000

/** Colours of a row: series colours when nothing is highlighted, highlight against context otherwise. */
function coresLinha(destaque: boolean, algumDestaque: boolean): { a: CorDado; b: CorDado; conector: CorDado; texto: 'destaque' | 'tinta' } {
  if (!algumDestaque) return { a: 'destaque-2', b: 'destaque', conector: 'contexto', texto: 'tinta' }
  if (destaque) return { a: 'destaque', b: 'destaque', conector: 'destaque', texto: 'destaque' }
  return { a: 'tinta', b: 'tinta', conector: 'contexto', texto: 'tinta' }
}

function Chamada({ x, y, texto }: { x: number; y: number; texto: string }) {
  return (
    <g className="ty-print-g-chamada" transform={`translate(${n(x)} ${n(y)})`}>
      <circle r={1.45} />
      <text y={0.72} textAnchor="middle">
        {texto}
      </text>
    </g>
  )
}

function Rotulos({ y, rotulo, nota, local }: { y: number; rotulo: string; nota?: string; local?: boolean }) {
  const extra = local ? (nota ? `${nota} · lake local` : 'lake local') : nota
  return (
    <>
      <text className="ty-print-g-rotulo" x={0} y={n(y)}>
        {rotulo}
      </text>
      {extra ? (
        <text className="ty-print-g-nota" x={0} y={n(y + TEXTO * 1.15)} data-local={local ? '' : undefined}>
          {extra}
        </text>
      ) : null}
    </>
  )
}

function EixoX({ c, eixo, unidade, naoZero }: { c: Ctx; eixo: Eixo; unidade?: string; naoZero?: boolean }) {
  return (
    <g className="ty-print-g-eixo">
      {eixo.marcas.map((m) => (
        <g key={m.v}>
          <g className="ty-print-grade">{c.p.linha(c, { chave: `grade-${m.v}`, x1: m.x, y1: eixo.topo, x2: m.x, y2: eixo.y, cor: 'linha', largura: 0.12, tipo: 'grade' })}</g>
          <text className="ty-print-g-eixo-texto" x={m.x} y={n(eixo.y + 2.7)} textAnchor="middle">
            {m.texto}
          </text>
        </g>
      ))}
      <g className="ty-print-eixo-cheio">{c.p.linha(c, { chave: 'eixo', x1: eixo.x0, y1: eixo.y, x2: eixo.x1, y2: eixo.y, cor: 'tinta-2', largura: 0.2, tipo: 'eixo' })}</g>
      <g className="ty-print-eixo-amplitude">
        <line x1={eixo.amplitude[0]} x2={eixo.amplitude[1]} y1={eixo.y} y2={eixo.y} style={{ stroke: 'var(--ty-print-tinta-2)', strokeWidth: 0.2 }} />
      </g>
      {unidade ? (
        <text className="ty-print-g-unidade" x={eixo.x1} y={n(eixo.y + 5.6)} textAnchor="end">
          {unidade}
        </text>
      ) : null}
      {naoZero ? (
        <text className="ty-print-g-aviso" x={eixo.x0} y={n(eixo.y + 5.6)}>
          o eixo não começa no zero
        </text>
      ) : null}
    </g>
  )
}

function Anotacoes({ c, postas, marcas }: { c: Ctx; postas: AnotacaoPosta[]; marcas: Array<string | undefined> }) {
  const h = TEXTO * 1.4
  return (
    <g className="ty-print-g-anotacoes">
      {postas.map((a, k) => (
        <g key={k} className="ty-print-g-anotacao" data-linha={a.linha}>
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

function Legenda({ c, y, itens }: { c: Ctx; y: number; itens: Array<{ x: number; texto: string; cor: CorDado; tipo: 'ponto-vazio' | 'ponto' | 'barra-a' | 'barra-b' }> }) {
  const hachura = c.estilo.traco.hachura !== 'nenhuma'
  return (
    <g className="ty-print-g-legenda">
      {itens.map((it, k) => (
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
      ))}
    </g>
  )
}

function larguraLegenda(t: string) {
  return t.length * TEXTO * 0.5 + 10
}

// ---------------------------------------------------------------------------

function Halteres({ c, spec, largura }: { c: Ctx; spec: SpecHalteres; largura: number }) {
  const L = layoutHalteres(spec, largura)
  const algum = spec.linhas.some((l) => l.destaque)
  const leg = [
    { x: 0, texto: spec.rotuloA, cor: (algum ? 'tinta' : 'destaque-2') as CorDado, tipo: 'ponto-vazio' as const },
    { x: larguraLegenda(spec.rotuloA), texto: spec.rotuloB, cor: (algum ? 'tinta' : 'destaque') as CorDado, tipo: 'ponto' as const },
  ]
  return {
    L,
    corpo: (
      <>
        <Legenda c={c} y={2.4} itens={leg} />
        <EixoX c={c} eixo={L.eixo} unidade={spec.unidade} naoZero={spec.eixoNaoComecaNoZero} />
        {L.referencias.map((r, k) => (
          <g key={k} className="ty-print-g-referencia">
            <line x1={r.x} x2={r.x} y1={L.eixo.topo} y2={L.eixo.y} style={{ stroke: 'var(--ty-print-tinta-3)', strokeWidth: 0.2 }} strokeDasharray="0.8 0.6" />
            <text x={n(r.x + 0.8)} y={n(L.eixo.topo + 1.6)}>
              {r.rotulo}
            </text>
          </g>
        ))}
        {L.linhas.map((l) => {
          const cor = coresLinha(l.destaque, algum)
          const r = L.raio
          const esq = Math.min(l.xa, l.xb)
          const dir = Math.max(l.xa, l.xb)
          return (
            <g key={l.i} className="ty-print-g-linha" data-linha={l.i} data-destaque={l.destaque ? '' : undefined}>
              <Rotulos y={l.y + 0.9} rotulo={l.rotulo} nota={l.nota} local={l.local} />
              {dir - esq > 2 * r ? (
                <g className="ty-print-conector" strokeDasharray={l.local ? '1 0.7' : undefined}>
                  {c.p.linha(c, { chave: `con-${l.i}`, x1: n(esq + r), y1: l.y, x2: n(dir - r), y2: l.y, cor: cor.conector, largura: l.destaque ? 0.7 : 0.45, tipo: 'conector' })}
                </g>
              ) : null}
              <g className="ty-print-ponto" data-linha={l.i} data-serie="a" data-valor={l.a} data-cx={l.xa} data-cy={l.y} transform={`translate(${l.xa} ${l.y})`}>
                {c.p.ponto(c, { chave: `a-${l.i}`, r, cor: cor.a, cheio: false })}
              </g>
              <g className="ty-print-ponto" data-linha={l.i} data-serie="b" data-valor={l.b} data-cx={l.xb} data-cy={l.y} transform={`translate(${l.xb} ${l.y})`}>
                {c.p.ponto(c, { chave: `b-${l.i}`, r, cor: cor.b, cheio: true })}
              </g>
              <text className="ty-print-g-valor-a" x={l.rotA.x} y={n(l.y + 0.85)} textAnchor={l.rotA.ancora} data-cor={cor.texto}>
                {numeroBr(l.a)}
              </text>
              <text className="ty-print-g-valor" x={l.rotB.x} y={n(l.y + 0.85)} textAnchor={l.rotB.ancora} data-cor={cor.texto}>
                {numeroBr(l.b)}
              </text>
              {l.marca ? <Chamada x={l.marca.x} y={l.y} texto={l.marca.texto} /> : null}
            </g>
          )
        })}
        <Anotacoes c={c} postas={L.anotacoes} marcas={spec.linhas.map((l) => l.marca)} />
      </>
    ),
    tabela: {
      colunas: ['Base', { rotulo: spec.rotuloA, numerica: true }, { rotulo: spec.rotuloB, numerica: true }],
      linhas: spec.linhas.map((l) => [l.nota ? `${l.rotulo} (${l.nota})` : l.rotulo, l.a, l.b]),
    },
    eixo: { x0: L.eixo.x0, x1: L.eixo.x1, d0: spec.escala[0], d1: spec.escala[1] },
  }
}

function Barras({ c, spec, largura }: { c: Ctx; spec: SpecBarras; largura: number }) {
  const L = layoutBarras(spec, largura)
  const linhasG = linhasDe(spec)
  const algum = linhasG.some((l) => l.destaque)
  const hachura = c.estilo.traco.hachura !== 'nenhuma'
  const unico = !L.legenda
  const u = c.p.nome === 'isotype' ? unidadeIsotype(L.mmPorUnidade) : 0
  return {
    L,
    corpo: (
      <>
        {L.legenda ? (
          <Legenda
            c={c}
            y={L.legenda.y}
            itens={L.legenda.itens.map((it) => ({ x: it.x - L.eixo.x0 + 0, texto: it.texto, cor: (algum ? (it.serie === 'a' ? 'contexto' : 'tinta') : it.serie === 'a' ? 'destaque-2' : 'destaque') as CorDado, tipo: it.serie === 'a' ? ('barra-a' as const) : ('barra-b' as const) }))}
          />
        ) : null}
        {u ? (
          <text className="ty-print-g-chave" x={largura} y={2.4} textAnchor="end">
            1 ícone = {numeroBr(u)}
          </text>
        ) : null}
        <EixoX c={c} eixo={L.eixo} unidade={spec.unidade} />
        {L.linhas.map((l) => {
          const cor = coresLinha(l.destaque, algum)
          return (
            <g key={l.i} className="ty-print-g-linha" data-linha={l.i} data-destaque={l.destaque ? '' : undefined}>
              <Rotulos y={l.y + (unico ? 2.8 : 2.4)} rotulo={l.rotulo} nota={l.nota} local={l.local} />
              {l.barras.map((b) => {
                const corB: CorDado = unico ? (algum && !l.destaque ? 'contexto' : 'destaque') : b.serie === 'a' ? (algum && !l.destaque ? 'contexto' : cor.a) : cor.b
                return (
                  <g key={b.serie}>
                    <g className="ty-print-barra" data-linha={l.i} data-serie={b.serie} data-valor={b.valor} data-x={b.x} data-w={b.w} transform={`translate(${b.x} ${b.y})`}>
                      {c.p.barra(c, { chave: `bar-${l.i}-${b.serie}`, w: b.w, h: b.h, cor: corB, enchimento: b.serie === 'a' && hachura ? 'hachura' : 'cheio', valor: b.valor, mmPorUnidade: L.mmPorUnidade })}
                    </g>
                    <text className={b.serie === 'a' && !unico ? 'ty-print-g-valor-a' : 'ty-print-g-valor'} x={b.rotulo.x} y={b.rotulo.y} data-cor={l.destaque ? 'destaque' : 'tinta'}>
                      {numeroBr(b.valor)}
                    </text>
                  </g>
                )
              })}
              {l.marca ? <Chamada x={l.marca.x} y={l.marca.y} texto={l.marca.texto} /> : null}
            </g>
          )
        })}
        <Anotacoes c={c} postas={L.anotacoes} marcas={linhasG.map((l) => l.marca)} />
      </>
    ),
    tabela: unico
      ? { colunas: ['Base', { rotulo: spec.unidade ?? 'valor', numerica: true }], linhas: linhasG.map((l) => [l.rotulo, l.valores[0]?.valor ?? '']) }
      : {
          colunas: ['Base', { rotulo: spec.rotuloA ?? 'a', numerica: true }, { rotulo: spec.rotuloB ?? 'b', numerica: true }],
          linhas: linhasG.map((l) => [l.nota ? `${l.rotulo} (${l.nota})` : l.rotulo, l.valores[0]?.valor ?? '', l.valores[1]?.valor ?? '']),
        },
    eixo: { x0: L.eixo.x0, x1: L.eixo.x1, d0: spec.escala[0], d1: spec.escala[1] },
  }
}

function Contagem({ c, spec, largura }: { c: Ctx; spec: SpecContagem; largura: number }) {
  const L = layoutContagem(spec, largura)
  const linhasG = linhasDe(spec)
  const algum = linhasG.some((l) => l.destaque)
  const forma = spec.icone ?? 'casa'
  const chave = `1 ícone = ${numeroBr(spec.unidade)}${spec.rotuloUnidade ? ` ${spec.rotuloUnidade}` : ''}; o último ícone é cortado na fração`
  return {
    L,
    corpo: (
      <>
        <text className="ty-print-g-chave" x={0} y={2.4}>
          {chave}
        </text>
        {L.pares ? (
          <text className="ty-print-g-chave" x={largura} y={2.4} textAnchor="end">
            {`contorno: ${spec.rotuloA ?? 'a'} · cheio: ${spec.rotuloB ?? 'b'}`}
          </text>
        ) : null}
        {L.linhas.map((l) => {
          const cor = coresLinha(l.destaque, algum)
          return (
            <g key={l.i} className="ty-print-g-linha" data-linha={l.i}>
              <Rotulos y={l.y + 2.6} rotulo={l.rotulo} nota={l.nota} />
              {l.grupos.map((g) => {
                const corG: CorDado = L.pares ? (g.serie === 'a' ? cor.a : cor.b) : algum && !l.destaque ? 'contexto' : 'destaque'
                return (
                  <g key={g.serie} className="ty-print-grupo" data-serie={g.serie} data-valor={g.valor}>
                    {g.celulas.map((cel, k) => (
                      <g key={k} className="ty-print-icone" data-fracao={cel.fracao} transform={`translate(${cel.x} ${cel.y})`}>
                        {c.p.icone(c, { chave: `ic-${l.i}-${g.serie}-${k}`, w: cel.w, h: cel.h, fracao: cel.fracao, cor: corG, enchimento: g.serie === 'a' && L.pares ? 'hachura' : 'cheio', forma })}
                      </g>
                    ))}
                    <text className={g.serie === 'a' && L.pares ? 'ty-print-g-valor-a' : 'ty-print-g-valor'} x={g.rotulo.x} y={g.rotulo.y} data-cor={l.destaque ? 'destaque' : 'tinta'}>
                      {numeroBr(g.valor)}
                    </text>
                  </g>
                )
              })}
              {l.marca ? <Chamada x={l.marca.x} y={l.marca.y} texto={l.marca.texto} /> : null}
            </g>
          )
        })}
        <Anotacoes c={c} postas={L.anotacoes} marcas={linhasG.map((l) => l.marca)} />
      </>
    ),
    tabela: L.pares
      ? {
          colunas: ['Base', { rotulo: spec.rotuloA ?? 'a', numerica: true }, { rotulo: spec.rotuloB ?? 'b', numerica: true }],
          linhas: linhasG.map((l) => [l.rotulo, l.valores[0]?.valor ?? '', l.valores[1]?.valor ?? '']),
        }
      : { colunas: ['Base', { rotulo: spec.rotuloUnidade ?? 'valor', numerica: true }], linhas: linhasG.map((l) => [l.rotulo, l.valores[0]?.valor ?? '']) },
    eixo: null,
  }
}

function Serie({ c, spec, largura }: { c: Ctx; spec: SpecSerie; largura: number }) {
  const L = layoutSerie(spec, largura)
  const { x0, x1, y0, y1 } = L.area
  return {
    L,
    corpo: (
      <>
        {L.faixas.map((f, k) => (
          <g key={k} className="ty-print-g-faixa">
            <rect x={f.x0} y={y0} width={n(f.x1 - f.x0)} height={n(y1 - y0)} style={{ fill: 'var(--ty-print-marca-texto)' }} />
            <text x={n(f.x0 + 0.8)} y={n(y1 - 1.2)}>
              {f.rotulo}
            </text>
          </g>
        ))}
        <g className="ty-print-g-eixo">
          {L.marcasY.map((m) => (
            <g key={m.v}>
              <g className="ty-print-grade">{c.p.linha(c, { chave: `gy-${m.v}`, x1: x0, y1: m.y, x2: x1, y2: m.y, cor: 'linha', largura: 0.12, tipo: 'grade' })}</g>
              <text className="ty-print-g-eixo-texto" x={n(x0 - 1.2)} y={n(m.y + 0.7)} textAnchor="end">
                {m.texto}
              </text>
            </g>
          ))}
          {L.marcasX.map((m) => (
            <text key={m.v} className="ty-print-g-eixo-texto" x={m.x} y={n(y1 + 3)} textAnchor="middle">
              {m.texto}
            </text>
          ))}
          {c.p.linha(c, { chave: 'eixo-x', x1: x0, y1: y1, x2: x1, y2: y1, cor: 'tinta-2', largura: 0.2, tipo: 'eixo' })}
          {spec.unidade ? (
            <text className="ty-print-g-unidade" x={x0} y={n(y0 - (L.faixas.length ? 4.6 : 1.2))}>
              {spec.unidade}
            </text>
          ) : null}
        </g>
        {L.eventos.map((e, k) => (
          <g key={k} className="ty-print-g-evento">
            {c.p.linha(c, { chave: `ev-${k}`, x1: e.x, y1: y0, x2: e.x, y2: y1, cor: 'destaque', largura: 0.3, tipo: 'guia' })}
            <text x={n(e.x + 0.9)} y={n(y0 + 2.6)}>
              {e.rotulo}
            </text>
            {e.nota ? (
              <text className="ty-print-g-nota" x={n(e.x + 0.9)} y={n(y0 + 5.2)}>
                {e.nota}
              </text>
            ) : null}
          </g>
        ))}
        {spec.interpolar && L.pontos.length > 1 ? c.p.caminho(c, { chave: 'serie', pontos: L.pontos, cor: 'destaque', largura: 0.5 }) : null}
        {L.pontos.map((p) => (
          <g key={p.i}>
            <g className="ty-print-ponto" data-linha={p.i} data-serie="b" data-valor={p.vy} data-cx={p.x} data-cy={p.y} transform={`translate(${p.x} ${p.y})`}>
              {c.p.ponto(c, { chave: `p-${p.i}`, r: 1, cor: 'destaque', cheio: true })}
            </g>
            <text className="ty-print-g-valor" x={n(p.x + 1.4)} y={n(p.y - 1.6)} data-cor="tinta">
              {p.rotulo ?? numeroBr(p.vy)}
            </text>
            {p.chamada !== undefined ? <Chamada x={n(p.x + 1.4 + larguraTexto(p.rotulo ?? numeroBr(p.vy)) + 2.4)} y={n(p.y - 2.4)} texto={String(p.chamada)} /> : null}
          </g>
        ))}
        <Anotacoes c={c} postas={L.anotacoes} marcas={spec.pontos.map((p) => (p.chamada !== undefined ? String(p.chamada) : undefined))} />
      </>
    ),
    tabela: { colunas: ['Base', { rotulo: spec.unidade ?? 'valor', numerica: true }], linhas: spec.pontos.map((p) => [String(p.x), p.y]) },
    eixo: { x0, x1, d0: spec.eixoX[0], d1: spec.eixoX[1] },
  }
}

/** Deterministic pseudo-random sequence (0..1) from a key. */
function aleatorio(chave: string) {
  let s = semente(chave)
  return () => {
    s = (Math.imul(s, 48271) % 2147483647) >>> 0
    return (s % 100000) / 100000
  }
}

function Esquema({ c, spec, largura }: { c: Ctx; spec: SpecEsquema; largura: number }) {
  const r = spec.rotulos ?? []
  const W = largura
  const H = 54
  const x0 = 6
  const x1 = W - 4
  const y0 = 6
  const y1 = H - 8
  const xc = n((x0 + x1) / 2)
  const rnd = aleatorio(`${spec.nome}|${spec.titulo}`)
  const partes: ReactNode[] = []
  const eixos = (
    <g className="ty-print-g-eixo" key="eixos">
      {c.p.linha(c, { chave: 'ex', x1: x0, y1: y1, x2: x1, y2: y1, cor: 'tinta-2', largura: 0.25, tipo: 'eixo' })}
      {c.p.linha(c, { chave: 'ey', x1: x0, y1: y0, x2: x0, y2: y1, cor: 'tinta-2', largura: 0.25, tipo: 'eixo' })}
    </g>
  )
  if (spec.nome === 'descontinuidade') {
    const jan = (x1 - x0) * 0.13
    const base = (x: number) => y1 - 8 - ((x - x0) / (x1 - x0)) * 18 - (x > xc ? 9 : 0)
    partes.push(<rect key="jan" x={n(xc - jan)} y={y0} width={n(2 * jan)} height={n(y1 - y0)} style={{ fill: 'var(--ty-print-marca-texto)' }} />)
    partes.push(eixos)
    for (let i = 0; i < 30; i++) {
      const x = x0 + 2 + ((x1 - x0 - 4) * (i + rnd() * 0.6)) / 30
      const y = base(x) + (rnd() - 0.5) * 7
      partes.push(
        <g key={`p${i}`} transform={`translate(${n(x)} ${n(y)})`}>
          {c.p.ponto(c, { chave: `d${i}`, r: 0.55, cor: 'contexto', cheio: true })}
        </g>,
      )
    }
    partes.push(<g key="fl">{c.p.linha(c, { chave: 'fl', x1: x0 + 1, y1: base(x0 + 1), x2: xc, y2: base(xc - 0.01), cor: 'destaque', largura: 0.5, tipo: 'serie' })}</g>)
    partes.push(<g key="fr">{c.p.linha(c, { chave: 'fr', x1: xc, y1: base(xc + 0.01), x2: x1 - 1, y2: base(x1 - 1), cor: 'destaque', largura: 0.5, tipo: 'serie' })}</g>)
    partes.push(<g key="corte">{c.p.linha(c, { chave: 'corte', x1: xc, y1: y0 - 1, x2: xc, y2: y1, cor: 'tinta', largura: 0.3, tipo: 'guia' })}</g>)
    const ya = base(xc - 0.01)
    const yb = base(xc + 0.01)
    partes.push(
      <g key="salto" className="ty-print-g-salto">
        {c.p.linha(c, { chave: 'salto', x1: xc + 1.4, y1: ya, x2: xc + 1.4, y2: yb, cor: 'destaque', largura: 0.35, tipo: 'guia' })}
      </g>,
    )
    if (r[0]) partes.push(<text key="r0" className="ty-print-g-anotacao-texto" x={n(xc + 3)} y={n((ya + yb) / 2 + 0.8)}>{r[0]}</text>)
    if (r[1]) partes.push(<text key="r1" className="ty-print-g-nota" x={n(xc + 1)} y={n(y0 - 1.6)}>{r[1]}</text>)
    if (r[2]) partes.push(<text key="r2" className="ty-print-g-nota" x={n(xc - jan + 0.8)} y={n(y1 - 1.4)}>{r[2]}</text>)
    if (r[3]) partes.push(<text key="r3" className="ty-print-g-eixo-texto" x={x1} y={n(y1 + 3.6)} textAnchor="end">{r[3]}</text>)
    if (r[4]) partes.push(<text key="r4" className="ty-print-g-eixo-texto" x={n(x0 + 1)} y={n(y0 - 1.6)}>{r[4]}</text>)
  } else if (spec.nome === 'densidade-no-corte') {
    partes.push(eixos)
    const nb = 16
    const bw = (x1 - x0 - 2) / nb
    for (let i = 0; i < nb; i++) {
      const bx = x0 + 1 + i * bw
      const centro = bx + bw / 2
      let h = 26 - Math.abs(centro - xc) * 0.25 + (rnd() - 0.5) * 3
      if (centro > xc && centro < xc + bw) h += 12
      if (centro < xc && centro > xc - bw) h -= 7
      partes.push(
        <g key={`b${i}`} transform={`translate(${n(bx + 0.3)} ${n(y1 - h)})`}>
          {c.p.barra(c, { chave: `h${i}`, w: n(bw - 0.6), h: n(h), cor: centro > xc && centro < xc + bw ? 'destaque' : 'contexto', enchimento: 'cheio', valor: h, mmPorUnidade: 1 })}
        </g>,
      )
    }
    partes.push(<g key="corte">{c.p.linha(c, { chave: 'corte', x1: xc, y1: y0 - 1, x2: xc, y2: y1, cor: 'tinta', largura: 0.3, tipo: 'guia' })}</g>)
    if (r[0]) partes.push(<text key="r0" className="ty-print-g-anotacao-texto" x={n(xc + bw + 1.2)} y={n(y0 + 2)}>{r[0]}</text>)
    if (r[1]) partes.push(<text key="r1" className="ty-print-g-eixo-texto" x={x1} y={n(y1 + 3.6)} textAnchor="end">{r[1]}</text>)
  } else {
    partes.push(eixos)
    const k = Math.max(3, r.length || 6)
    for (let i = 0; i < k; i++) {
      const x = x0 + ((x1 - x0) * (i + 0.5)) / k
      partes.push(<g key={`c${i}`}>{c.p.linha(c, { chave: `c${i}`, x1: x, y1: y0, x2: x, y2: y1, cor: i === 0 ? 'destaque' : 'tinta-2', largura: 0.3, tipo: 'guia' })}</g>)
      if (r[i]) partes.push(<text key={`t${i}`} className="ty-print-g-eixo-texto" x={n(x)} y={n(y1 + 3.6)} textAnchor="middle">{r[i]}</text>)
    }
  }
  partes.push(
    <text key="aviso" className="ty-print-g-aviso" x={x1} y={n(H - 1)} textAnchor="end">
      esquema ilustrativo, sem dados reais
    </text>,
  )
  return { L: { largura: W, altura: H }, corpo: <>{partes}</>, tabela: null, eixo: null }
}

/**
 * The method chart. Positions and lengths come from the data (linear
 * scales in mm); the style's renderer only draws the marks (crisp, rough,
 * washed, grained, pictorial). Every figure has an accessible name that
 * states the finding and a data table (visible, or for assistive technology).
 */
export function GraficoMetodo({ spec, renderizador, alt, tabela, local = false, largura: larguraProp, className }: GraficoMetodoProps) {
  const { estilo } = usePrint()
  const disponivel = useLarguraDisponivel()
  const largura = larguraProp ?? Math.min(132, disponivel ?? 128)
  const id = useIdSeguro('ty-print-g')
  const nome = renderizador ?? estilo.grafico
  const p = PINCEIS[nome]
  const c: Ctx = { id, estilo, p }
  const r =
    spec.tipo === 'halteres'
      ? Halteres({ c, spec, largura })
      : spec.tipo === 'barras'
        ? Barras({ c, spec, largura })
        : spec.tipo === 'contagem'
          ? Contagem({ c, spec, largura })
          : spec.tipo === 'serie'
            ? Serie({ c, spec, largura })
            : Esquema({ c, spec, largura })
  const W = r.L.largura
  const H = r.L.altura
  const nomeAcessivel = alt ?? spec.achado ?? spec.titulo
  return (
    <figure className={cx('ty-print-figura', className)} data-tipo={spec.tipo} data-renderizador={nome} data-local={local ? '' : undefined}>
      <figcaption className="ty-print-figura-cabeca">
        <span className="ty-print-figura-titulo">{comColchetes(spec.titulo)}</span>
        {spec.subtitulo ? <span className="ty-print-figura-subtitulo">{comColchetes(spec.subtitulo)}</span> : null}
        {local ? <span className="ty-print-selo-local">lake local, não publicado</span> : null}
      </figcaption>
      <svg
        className="ty-print-grafico"
        role="img"
        aria-label={nomeAcessivel}
        viewBox={`0 0 ${W} ${H}`}
        style={{ inlineSize: `${W}mm`, aspectRatio: `${W} / ${H}` }}
        data-x0={r.eixo?.x0}
        data-x1={r.eixo?.x1}
        data-d0={r.eixo?.d0}
        data-d1={r.eixo?.d1}
      >
        <defs>{p.defs(c)}</defs>
        {r.corpo}
      </svg>
      {tabela ? (
        <TabelaDados {...tabela} />
      ) : r.tabela ? (
        <div className="ty-print-sr">
          <TabelaDados titulo={`Dados: ${spec.titulo}`} colunas={r.tabela.colunas} linhas={r.tabela.linhas as Array<Array<string | number>>} />
        </div>
      ) : null}
    </figure>
  )
}
