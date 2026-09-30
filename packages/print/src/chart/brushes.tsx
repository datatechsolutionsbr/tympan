// Renderers ("pincéis"): how a mark is drawn in each style. The chart puts
// every mark inside a group translated to its data position (and, for bars,
// with its data length), so a renderer draws at the local origin and cannot
// move or resize the data. Hand-made renderers only tremble the contour
// (rough.js with a fixed seed), wash it, grain it or build it from icons.
import type { ReactNode } from 'react'
import type { PrintStyle, RenderizadorGrafico } from '@datatechsolutions/tympan-tokens'
import { tracar, type Tracado } from '../rough.ts'
import { ICONES, type FormaIcone } from './icones.ts'

export type CorDado = 'destaque' | 'destaque-2' | 'tinta' | 'tinta-2' | 'tinta-3' | 'contexto' | 'papel' | 'linha'
export const CORES_DADO: CorDado[] = ['destaque', 'destaque-2', 'tinta', 'tinta-2', 'contexto']
export const cssCor = (c: CorDado) => `var(--ty-print-${c})`

export type Enchimento = 'cheio' | 'hachura' | 'vazio'

export interface CtxPincel {
  /** Prefix for ids of patterns and filters inside this figure. */
  id: string
  estilo: PrintStyle
}

export interface PontoProps {
  chave: string
  r: number
  cor: CorDado
  cheio: boolean
}

export interface BarraProps {
  chave: string
  w: number
  h: number
  cor: CorDado
  enchimento: Enchimento
  /** Data behind the bar, for renderers that build it from units (icons, dots). */
  valor: number
  mmPorUnidade: number
}

export interface LinhaProps {
  chave: string
  x1: number
  y1: number
  x2: number
  y2: number
  cor: CorDado
  largura?: number
  tipo: 'conector' | 'eixo' | 'grade' | 'guia' | 'serie'
}

export interface IconeProps {
  chave: string
  w: number
  h: number
  fracao: number
  cor: CorDado
  enchimento: Enchimento
  forma: FormaIcone
}

export interface CaminhoProps {
  chave: string
  pontos: Array<{ x: number; y: number }>
  cor: CorDado
  largura: number
}

export interface Pincel {
  nome: RenderizadorGrafico
  defs(c: CtxPincel): ReactNode
  ponto(c: CtxPincel, p: PontoProps): ReactNode
  barra(c: CtxPincel, b: BarraProps): ReactNode
  linha(c: CtxPincel, l: LinhaProps): ReactNode
  icone(c: CtxPincel, i: IconeProps): ReactNode
  caminho(c: CtxPincel, s: CaminhoProps): ReactNode
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

const traco = (c: CtxPincel, fator = 1) => Math.round(c.estilo.traco.largura * fator * 1000) / 1000
const hachuraId = (c: CtxPincel, cor: CorDado) => `${c.id}-h-${cor}`
const filtroId = (c: CtxPincel, nome: string) => `${c.id}-f-${nome}`

function padroesHachura(c: CtxPincel): ReactNode {
  const tipo = c.estilo.traco.hachura
  const sw = Math.max(0.16, traco(c, 0.7))
  return CORES_DADO.map((cor) => {
    const stroke = { stroke: cssCor(cor), strokeWidth: sw }
    let corpo: ReactNode
    let tam = 1.1
    if (tipo === 'cruzada') {
      corpo = (
        <>
          <line x1={0} y1={0} x2={0} y2={tam} style={stroke} />
          <line x1={0} y1={tam / 2} x2={tam} y2={tam / 2} style={stroke} />
        </>
      )
    } else if (tipo === 'pontilhada') {
      tam = 0.95
      corpo = <circle cx={tam / 2} cy={tam / 2} r={0.3} style={{ fill: cssCor(cor) }} />
    } else if (tipo === 'goiva') {
      tam = 1.3
      corpo = <line x1={0} y1={0} x2={0} y2={tam} style={{ ...stroke, strokeWidth: 0.55 }} />
    } else {
      corpo = <line x1={0} y1={0} x2={0} y2={tam} style={stroke} />
    }
    return (
      <pattern key={cor} id={hachuraId(c, cor)} width={tam} height={tam} patternUnits="userSpaceOnUse" patternTransform={tipo === 'pontilhada' ? 'rotate(22)' : 'rotate(45)'}>
        {corpo}
      </pattern>
    )
  })
}

function enchimentoCss(c: CtxPincel, cor: CorDado, e: Enchimento): string {
  if (e === 'cheio') return cssCor(cor)
  if (e === 'hachura') return `url(#${hachuraId(c, cor)})`
  return 'none'
}

function Caminhos({ tracos, estilo, filtro }: { tracos: Tracado[]; estilo?: (t: Tracado) => Record<string, string | number>; filtro?: string }) {
  return (
    <g filter={filtro ? `url(#${filtro})` : undefined}>
      {tracos.map((t, k) => (
        <path
          key={k}
          d={t.d}
          style={estilo ? estilo(t) : { stroke: t.stroke, strokeWidth: t.strokeWidth, fill: t.fill ?? 'none' }}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  )
}

function icone(_c: CtxPincel, i: IconeProps, contorno = 0.22, filtro?: string): ReactNode {
  const def = ICONES[i.forma]
  const s = Math.min(i.w * 0.86, i.h / def.proporcao)
  const hIcone = s * def.proporcao
  const ox = (i.w - s) / 2
  const oy = i.h - hIcone
  const cheio = i.enchimento !== 'hachura' && i.enchimento !== 'vazio'
  const style = cheio
    ? { fill: cssCor(i.cor), stroke: 'none' }
    : { fill: 'none', stroke: cssCor(i.cor), strokeWidth: contorno / (s / 10), vectorEffect: undefined }
  const desenho = (
    <g transform={`translate(${r(ox)} ${r(oy)}) scale(${r(s / 10)})`} filter={filtro ? `url(#${filtro})` : undefined}>
      <path d={def.d} style={style} />
    </g>
  )
  if (i.fracao >= 0.999) return desenho
  // A cut icon: the visible part is the fraction of the cell width.
  return (
    <svg x={0} y={0} width={r(ox + s * i.fracao)} height={r(i.h)} overflow="hidden">
      {desenho}
    </svg>
  )
}

const r = (n: number) => Math.round(n * 1000) / 1000

/**
 * Hand-drawn circle of radius `r` mm whose tremble is a fixed fraction of the
 * radius. rough.js offsets are absolute (in user units), so a 1 mm point drawn
 * directly turns into a scribble that covers labels; here the contour is traced
 * at a radius of 10 units and scaled down, and the fill is a plain circle of
 * exactly `r` (the mark never grows past its radius, so labels stay clear).
 */
export function circuloMao(
  c: CtxPincel,
  p: PontoProps,
  o: { stroke: string; fill?: string; fillOpacity?: number; largura: number; tremor?: number; filtro?: string; escala?: number },
): ReactNode {
  const raio = Math.max(0.15, p.r * (o.escala ?? 1))
  const S = 10 / raio
  const t = Math.min(1, o.tremor ?? c.estilo.traco.tremor)
  const tracos = tracar({ k: 'elipse', cx: 0, cy: 0, w: 20, h: 20 }, p.chave, {
    roughness: 0.35 + 0.35 * t,
    maxRandomnessOffset: 0.5,
    bowing: 0.4,
    strokeWidth: r(o.largura * S),
    curveStepCount: 11,
    stroke: o.stroke,
  })
  return (
    <g filter={o.filtro ? `url(#${o.filtro})` : undefined}>
      {o.fill ? <circle cx={0} cy={0} r={r(raio)} style={{ fill: o.fill, fillOpacity: o.fillOpacity }} /> : null}
      <g transform={`scale(${r(1 / S)})`}>
        <Caminhos tracos={tracos} />
      </g>
    </g>
  )
}

// ---------------------------------------------------------------------------
// limpo: ruled, crisp (jornal, dashboard, minimo-de-tinta, suico, semanario…)
// ---------------------------------------------------------------------------

const limpo: Pincel = {
  nome: 'limpo',
  defs: (c) => padroesHachura(c),
  ponto: (c, p) => (
    <circle
      cx={0}
      cy={0}
      r={p.r}
      style={p.cheio ? { fill: cssCor(p.cor) } : { fill: 'var(--ty-print-papel)', stroke: cssCor(p.cor), strokeWidth: Math.max(0.22, traco(c)) }}
    />
  ),
  barra: (c, b) => (
    <rect
      x={0}
      y={0}
      width={b.w}
      height={b.h}
      style={
        c.estilo.estrutura.contornoBarra
          ? { fill: enchimentoCss(c, b.cor, b.enchimento), stroke: 'var(--ty-print-tinta)', strokeWidth: Math.max(0.25, traco(c, 0.9)) }
          : {
              fill: enchimentoCss(c, b.cor, b.enchimento),
              stroke: b.enchimento === 'cheio' ? 'none' : cssCor(b.cor),
              strokeWidth: b.enchimento === 'cheio' ? 0 : Math.max(0.18, traco(c, 0.8)),
            }
      }
    />
  ),
  linha: (c, l) => (
    <line
      x1={l.x1}
      y1={l.y1}
      x2={l.x2}
      y2={l.y2}
      style={{ stroke: cssCor(l.cor), strokeWidth: l.largura ?? traco(c) }}
      strokeLinecap={l.tipo === 'serie' ? 'round' : 'butt'}
    />
  ),
  icone: (c, i) => icone(c, i),
  caminho: (_c, s) => (
    <polyline
      points={s.pontos.map((p) => `${p.x},${p.y}`).join(' ')}
      style={{ fill: 'none', stroke: cssCor(s.cor), strokeWidth: s.largura }}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ),
}

// ---------------------------------------------------------------------------
// mao: rough.js contours (graficos-1900, caderno)
// ---------------------------------------------------------------------------

function opcoesMao(c: CtxPincel, extra: Record<string, unknown> = {}) {
  const t = c.estilo.traco.tremor
  return {
    roughness: Math.max(0.2, t),
    maxRandomnessOffset: 0.25 + 0.25 * t,
    bowing: 0.6 + t * 0.4,
    strokeWidth: Math.max(0.18, traco(c)),
    hachureGap: 0.75,
    fillWeight: Math.max(0.12, traco(c, 0.55)),
    curveStepCount: 9,
    ...extra,
  }
}

const mao: Pincel = {
  nome: 'mao',
  defs: (c) => padroesHachura(c),
  ponto: (c, p) => circuloMao(c, p, { stroke: cssCor(p.cor), fill: p.cheio ? cssCor(p.cor) : 'var(--ty-print-papel)', largura: Math.max(0.2, traco(c)) }),
  barra: (c, b) => {
    const cruzada = c.estilo.traco.hachura === 'cruzada'
    const fillStyle = b.enchimento === 'hachura' ? 'hachure' : cruzada ? 'cross-hatch' : 'solid'
    return (
      <Caminhos
        tracos={tracar({ k: 'retangulo', x: 0, y: 0, w: b.w, h: b.h }, b.chave, {
          ...opcoesMao(c),
          stroke: 'var(--ty-print-tinta)',
          fill: b.enchimento === 'vazio' ? undefined : cssCor(b.cor),
          fillStyle,
          hachureAngle: b.enchimento === 'hachura' ? -41 : -48,
          hachureGap: b.enchimento === 'hachura' ? 0.85 : 0.62,
        })}
      />
    )
  },
  linha: (c, l) =>
    l.tipo === 'grade' ? (
      limpo.linha(c, l)
    ) : (
      <Caminhos
        tracos={tracar({ k: 'linha', x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 }, l.chave, {
          ...opcoesMao(c),
          stroke: cssCor(l.cor),
          strokeWidth: l.largura ?? Math.max(0.18, traco(c)),
        })}
      />
    ),
  icone: (c, i) => icone(c, i),
  caminho: (c, s) => (
    <Caminhos
      tracos={tracar({ k: 'curva', pts: s.pontos.map((p) => [p.x, p.y] as [number, number]) }, s.chave, {
        ...opcoesMao(c),
        stroke: cssCor(s.cor),
        strokeWidth: s.largura,
      })}
    />
  ),
}

// ---------------------------------------------------------------------------
// gravura: woodcut (cordel)
// ---------------------------------------------------------------------------

function filtrosGravura(c: CtxPincel): ReactNode {
  return (
    <>
      <filter id={filtroId(c, 'madeira')} x="-2%" y="-10%" width="104%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.18 5" numOctaves={2} seed={7} result="n" />
        <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -7 0 0 0 5.4" result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" />
      </filter>
      <filter id={filtroId(c, 'prensa')} x="-2%" y="-10%" width="104%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.4 1.6" numOctaves={2} seed={12} result="n" />
        <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -6 0 0 0 4.7" result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" />
      </filter>
    </>
  )
}

const gravura: Pincel = {
  nome: 'gravura',
  defs: (c) => (
    <>
      {padroesHachura(c)}
      {filtrosGravura(c)}
    </>
  ),
  ponto: (c, p) =>
    circuloMao(c, p, { stroke: cssCor(p.cor), fill: p.cheio ? cssCor(p.cor) : 'var(--ty-print-papel)', largura: Math.max(0.2, traco(c, 0.9)), tremor: 0.8, filtro: filtroId(c, 'prensa'), escala: 1.1 }),
  barra: (c, b) => (
    <g>
      <Caminhos
        filtro={filtroId(c, b.enchimento === 'cheio' ? 'madeira' : 'prensa')}
        tracos={tracar({ k: 'retangulo', x: 0, y: 0, w: b.w, h: b.h }, b.chave, {
          ...opcoesMao(c, { maxRandomnessOffset: 0.3 }),
          strokeWidth: traco(c, 1.1),
          stroke: 'var(--ty-print-tinta)',
          fill: b.enchimento === 'vazio' ? undefined : cssCor(b.cor),
          fillStyle: b.enchimento === 'hachura' ? 'hachure' : 'solid',
          hachureAngle: -45,
          hachureGap: 0.62,
          fillWeight: 0.32,
        })}
      />
    </g>
  ),
  linha: (c, l) =>
    l.tipo === 'grade' ? null : (
      <Caminhos
        filtro={l.tipo === 'eixo' ? undefined : filtroId(c, 'prensa')}
        tracos={tracar({ k: 'linha', x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 }, l.chave, {
          ...opcoesMao(c),
          stroke: cssCor(l.cor),
          strokeWidth: (l.largura ?? traco(c)) * 1.2,
        })}
      />
    ),
  icone: (c, i) => icone(c, i, 0.3, filtroId(c, 'prensa')),
  caminho: (c, s) => mao.caminho(c, s),
}

// ---------------------------------------------------------------------------
// riso: two-ink risograph, grain and half-tone
// ---------------------------------------------------------------------------

const riso: Pincel = {
  nome: 'riso',
  defs: (c) => (
    <>
      {CORES_DADO.map((cor) => (
        <pattern key={cor} id={hachuraId(c, cor)} width={0.95} height={0.95} patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
          <circle cx={0.475} cy={0.475} r={0.31} style={{ fill: cssCor(cor) }} />
        </pattern>
      ))}
      <filter id={filtroId(c, 'tinta')} x="-2%" y="-5%" width="104%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves={1} seed={9} result="n" />
        <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -6 0 0 0 4.5" result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" />
      </filter>
    </>
  ),
  ponto: (c, p) => (
    <g filter={`url(#${filtroId(c, 'tinta')})`}>
      <circle cx={0} cy={0} r={p.r * 1.1} style={p.cheio ? { fill: cssCor(p.cor) } : { fill: `url(#${hachuraId(c, p.cor)})`, stroke: cssCor(p.cor), strokeWidth: 0.3 }} />
    </g>
  ),
  barra: (c, b) => (
    <g filter={`url(#${filtroId(c, 'tinta')})`}>
      <rect x={0} y={0} width={b.w} height={b.h} style={{ fill: b.enchimento === 'vazio' ? 'none' : enchimentoCss(c, b.cor, b.enchimento === 'hachura' ? 'hachura' : 'cheio') }} />
    </g>
  ),
  linha: (c, l) => limpo.linha(c, l),
  icone: (c, i) => icone(c, i, 0.26, filtroId(c, 'tinta')),
  caminho: (c, s) => <g filter={`url(#${filtroId(c, 'tinta')})`}>{limpo.caminho(c, s)}</g>,
}

// ---------------------------------------------------------------------------
// prancheta: technical drawing (cotas, hatch, thin line)
// ---------------------------------------------------------------------------

const prancheta: Pincel = {
  nome: 'prancheta',
  defs: (c) => padroesHachura(c),
  ponto: (c, p) => (
    <g style={{ stroke: cssCor(p.cor), strokeWidth: traco(c) }}>
      <circle cx={0} cy={0} r={p.r} style={{ fill: p.cheio ? cssCor(p.cor) : 'none', fillOpacity: p.cheio ? 0.35 : 0 }} />
      <circle cx={0} cy={0} r={0.25} style={{ fill: cssCor(p.cor), stroke: 'none' }} />
      <line x1={-p.r - 0.7} y1={0} x2={-p.r - 0.2} y2={0} />
      <line x1={p.r + 0.2} y1={0} x2={p.r + 0.7} y2={0} />
    </g>
  ),
  barra: (c, b) => {
    const sw = traco(c)
    return (
      <g>
        <rect
          x={0}
          y={0}
          width={b.w}
          height={b.h}
          style={{
            fill: b.enchimento === 'hachura' ? `url(#${hachuraId(c, b.cor)})` : cssCor(b.cor),
            fillOpacity: b.enchimento === 'hachura' ? 1 : b.enchimento === 'vazio' ? 0 : 0.2,
            stroke: cssCor(b.cor),
            strokeWidth: sw,
          }}
        />
        {/* dimension line (cota) above the bar, with oblique ticks at both ends */}
        <g style={{ stroke: cssCor(b.cor), strokeWidth: sw * 0.8 }}>
          <line x1={0} y1={-0.7} x2={b.w} y2={-0.7} />
          <line x1={-0.35} y1={-0.35} x2={0.35} y2={-1.05} />
          <line x1={b.w - 0.35} y1={-0.35} x2={b.w + 0.35} y2={-1.05} />
        </g>
      </g>
    )
  },
  linha: (c, l) => (
    <line
      x1={l.x1}
      y1={l.y1}
      x2={l.x2}
      y2={l.y2}
      style={{ stroke: cssCor(l.cor), strokeWidth: l.largura ?? traco(c) }}
      strokeDasharray={l.tipo === 'grade' ? '1.4 0.5 0.2 0.5' : undefined}
    />
  ),
  icone: (c, i) => icone(c, { ...i, enchimento: 'vazio' }, 0.25),
  caminho: (c, s) => limpo.caminho(c, s),
}

// ---------------------------------------------------------------------------
// aquarela: washes with a pigment rim, thin pen contour
// ---------------------------------------------------------------------------

const aquarela: Pincel = {
  nome: 'aquarela',
  defs: (c) => (
    <>
      {padroesHachura(c)}
      <filter id={filtroId(c, 'aguada')} x="-15%" y="-25%" width="130%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves={3} seed={5} result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale={1.1} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.27" numOctaves={2} seed={8} result="n" />
        <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.3 0 0 0 -0.05" result="nm" />
        <feComposite in="d" in2="nm" operator="in" result="manchado" />
        <feMorphology in="d" operator="erode" radius={0.3} result="e" />
        <feComposite in="d" in2="e" operator="out" result="anel" />
        <feColorMatrix in="anel" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0" result="borda" />
        <feMerge>
          <feMergeNode in="manchado" />
          <feMergeNode in="borda" />
        </feMerge>
      </filter>
    </>
  ),
  ponto: (c, p) => (
    <g>
      <circle cx={0} cy={0} r={p.r * 1.35} filter={`url(#${filtroId(c, 'aguada')})`} style={{ fill: cssCor(p.cor), fillOpacity: p.cheio ? 0.85 : 0.35 }} />
      {circuloMao(c, p, { stroke: 'var(--ty-print-tinta)', largura: Math.max(0.15, traco(c, 0.7)), tremor: 0.6 })}
    </g>
  ),
  barra: (c, b) => (
    <g>
      {b.enchimento === 'vazio' ? null : (
        <rect x={0} y={0} width={b.w} height={b.h} filter={`url(#${filtroId(c, 'aguada')})`} style={{ fill: cssCor(b.cor), fillOpacity: b.enchimento === 'hachura' ? 0.55 : 0.82 }} />
      )}
      <Caminhos
        tracos={tracar({ k: 'retangulo', x: 0, y: 0, w: b.w, h: b.h }, b.chave, {
          ...opcoesMao(c, { maxRandomnessOffset: 0.15, roughness: 0.5, disableMultiStroke: true }),
          stroke: 'var(--ty-print-tinta)',
          strokeWidth: traco(c, 0.8),
        })}
      />
    </g>
  ),
  linha: (c, l) => (l.tipo === 'grade' ? <g strokeDasharray="0.8 0.8">{limpo.linha(c, l)}</g> : mao.linha(c, l)),
  icone: (c, i) => icone(c, i, 0.22, filtroId(c, 'aguada')),
  caminho: (c, s) => mao.caminho(c, s),
}

// ---------------------------------------------------------------------------
// pontos: one dot per unit (cartao-postal)
// ---------------------------------------------------------------------------

/** Dot grid for a bar: columns of `k` dots, each column worth exactly k units, so length stays true to the data. */
export function gradePontos(valor: number, w: number, h: number, mmPorUnidade: number) {
  const k = Math.max(1, Math.min(10, Math.round(Math.sqrt(h / Math.max(1e-6, mmPorUnidade)))))
  const passoX = k * mmPorUnidade
  const passoY = h / k
  const n = Math.round(valor)
  const pontos: Array<{ x: number; y: number }> = []
  for (let i = 0; i < n; i++) {
    const col = Math.floor(i / k)
    const lin = i % k
    pontos.push({ x: r(col * passoX + passoX / 2), y: r(lin * passoY + passoY / 2) })
  }
  const raio = r(Math.max(0.12, Math.min(passoX, passoY) * 0.36))
  void w
  return { pontos, raio, k }
}

const pontos: Pincel = {
  nome: 'pontos',
  defs: (c) => padroesHachura(c),
  ponto: (c, p) => (
    <g>
      <circle cx={0} cy={0} r={p.r * 0.55} style={{ fill: p.cheio ? cssCor(p.cor) : 'none', stroke: cssCor(p.cor), strokeWidth: 0.2 }} />
      {circuloMao(c, p, { stroke: cssCor(p.cor), largura: 0.2, tremor: 0.9, escala: 1.1 })}
    </g>
  ),
  barra: (_c, b) => {
    // Small values in a coarse scale: one dot per unit would crowd; the grid keeps k units per column.
    const { pontos: ps, raio } = gradePontos(b.valor, b.w, b.h, b.mmPorUnidade)
    const cheio = b.enchimento !== 'hachura'
    return (
      <g style={cheio ? { fill: cssCor(b.cor) } : { fill: 'none', stroke: cssCor(b.cor), strokeWidth: Math.max(0.08, raio * 0.45) }}>
        {ps.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={cheio ? raio : raio * 0.8} />
        ))}
      </g>
    )
  },
  linha: (c, l) =>
    l.tipo === 'conector' || l.tipo === 'guia' ? (
      <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} style={{ stroke: cssCor(l.cor), strokeWidth: 0.34 }} strokeDasharray="0.01 0.8" strokeLinecap="round" />
    ) : (
      mao.linha(c, l)
    ),
  icone: (_c, i) => {
    const raio = Math.min(i.w, i.h) * 0.3
    return (
      <circle
        cx={i.w / 2}
        cy={i.h - raio - 0.2}
        r={raio * Math.sqrt(Math.max(0, Math.min(1, i.fracao)))}
        style={i.enchimento === 'hachura' ? { fill: 'none', stroke: cssCor(i.cor), strokeWidth: 0.2 } : { fill: cssCor(i.cor) }}
      />
    )
  },
  caminho: (c, s) => mao.caminho(c, s),
}

// ---------------------------------------------------------------------------
// isotype: pictograms, one icon = a fixed quantity
// ---------------------------------------------------------------------------

/** Units per icon for a bar drawn as icons: a round number that keeps icons at least ~2.4 mm wide. */
export function unidadeIsotype(mmPorUnidade: number): number {
  const minimo = 2.4 / Math.max(1e-6, mmPorUnidade)
  for (const u of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000]) if (u >= minimo) return u
  return 10 ** Math.ceil(Math.log10(minimo))
}

const isotype: Pincel = {
  nome: 'isotype',
  defs: (c) => padroesHachura(c),
  ponto: (c, p) => {
    const s = p.r * 2.6
    return (
      <g transform={`translate(${r(-s / 2)} ${r(-s / 2)})`}>
        {icone(c, { chave: p.chave, w: s, h: s, fracao: 1, cor: p.cor, enchimento: p.cheio ? 'cheio' : 'hachura', forma: 'casa' }, 0.28)}
      </g>
    )
  },
  barra: (c, b) => {
    const u = unidadeIsotype(b.mmPorUnidade)
    const cel = u * b.mmPorUnidade
    const n = b.valor / u
    const inteiros = Math.floor(n + 1e-9)
    const resto = n - inteiros
    const out: ReactNode[] = []
    for (let k = 0; k < inteiros + (resto > 1e-6 ? 1 : 0); k++) {
      out.push(
        <g key={k} transform={`translate(${r(k * cel)} 0)`}>
          {icone(c, { chave: `${b.chave}-${k}`, w: cel, h: b.h, fracao: k < inteiros ? 1 : resto, cor: b.cor, enchimento: b.enchimento, forma: 'casa' }, 0.28)}
        </g>,
      )
    }
    return <g>{out}</g>
  },
  linha: (c, l) => limpo.linha(c, l),
  icone: (c, i) => icone(c, i, 0.28),
  caminho: (c, s) => limpo.caminho(c, s),
}

export const PINCEIS: Record<RenderizadorGrafico, Pincel> = { limpo, mao, isotype, gravura, prancheta, aquarela, riso, pontos }
