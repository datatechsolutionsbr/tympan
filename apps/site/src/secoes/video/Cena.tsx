// A short data scene (the fictional Vila Aurora air-quality study) drawn as a pure function of time, in the
// tokens of the theme around it: the frame model of a video renderer, with plain SVG and no video library.
// The same `t` always draws the same frame, so the scrubber can seek anywhere.
import { memo } from 'react'
import { useI18n } from '../../i18n/I18n'

export const DURACAO = 14 // seconds
const W = 1280
const H = 720

const ESTACOES = [
  { chave: 'video.estacaoCentro', valor: 12 },
  { chave: 'video.estacaoParque', valor: 6 },
  { chave: 'video.estacaoRibeira', valor: 19 },
  { chave: 'video.estacaoNorte', valor: 33 },
  { chave: 'video.estacaoPorto', valor: 41 },
] as const
const LIMITE = 25
const MAXIMO = 45

const clamp = (x: number) => Math.max(0, Math.min(1, x))
/** Progress of a segment [a, b] at time t, eased (cubic out). */
export function progresso(t: number, a: number, b: number): number {
  const p = clamp((t - a) / (b - a))
  return 1 - (1 - p) ** 3
}

export const Cena = memo(function Cena({ t }: { t: number }) {
  const { t: tr, n, dir } = useI18n()
  const rtl = dir === 'rtl'
  // Mirror x positions and anchors in right-to-left languages.
  const x = (v: number) => (rtl ? W - v : v)
  const ancora = (a: 'start' | 'end') => (rtl ? (a === 'start' ? 'end' : 'start') : a)

  const titulo = progresso(t, 0.2, 1.6)
  const eixo = progresso(t, 1.8, 2.6)
  const linha = progresso(t, 7, 8.4)
  const acima = progresso(t, 8.4, 9.4)
  const x0 = 360
  const largura = 780
  const topoBarras = 250
  const alturaBarra = 56
  const passo = 76
  const escala = (v: number) => (v / MAXIMO) * largura
  const vereditos = [
    { chave: 'video.veredito1', estado: 'var(--ty-success)', rotulo: 'prova.sustentada', a: 10 },
    { chave: 'video.veredito2', estado: 'var(--ty-danger)', rotulo: 'prova.refutada', a: 10.8 },
    { chave: 'video.veredito3', estado: 'var(--ty-warning)', rotulo: 'prova.nao-da-para-afirmar', a: 11.6 },
  ] as const
  const fimBarras = progresso(t, 9.6, 10.2)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ty-site-cena" role="img" aria-label={tr('video.cenaRotulo')} direction={rtl ? 'rtl' : 'ltr'}>
      <rect width={W} height={H} fill="var(--ty-bg)" />
      <g opacity={titulo} transform={`translate(0 ${(1 - titulo) * 16})`}>
        <text x={x(80)} y={96} textAnchor={ancora('start')} fill="var(--ty-ink-3)" style={{ font: '500 20px var(--ty-font-mono)', letterSpacing: '0.14em' }}>
          {tr('video.eyebrow').toLocaleUpperCase()}
        </text>
        <text x={x(80)} y={156} textAnchor={ancora('start')} fill="var(--ty-ink)" style={{ font: '600 52px var(--ty-font-serif)' }}>
          {tr('video.titulo')}
        </text>
        <text x={x(80)} y={200} textAnchor={ancora('start')} fill="var(--ty-ink-2)" style={{ font: '400 24px var(--ty-font-sans)' }}>
          {tr('video.subtitulo')}
        </text>
      </g>

      <g opacity={1 - fimBarras * 0.75}>
        <line x1={x(x0)} x2={x(x0)} y1={topoBarras - 16} y2={topoBarras + passo * ESTACOES.length - 8} stroke="var(--ty-line-strong)" strokeWidth={2} opacity={eixo} />
        {ESTACOES.map((e, i) => {
          const p = progresso(t, 2.4 + i * 0.5, 4.2 + i * 0.5)
          const w = escala(e.valor) * p
          const y = topoBarras + i * passo
          const passou = e.valor > LIMITE
          const cor = passou && acima > 0 ? 'var(--ty-danger)' : 'var(--ty-accent)'
          const fim = rtl ? x(x0) - w : x(x0)
          return (
            <g key={e.chave} opacity={clamp(p * 3)}>
              <text x={x(x0 - 20)} y={y + alturaBarra / 2 + 8} textAnchor={ancora('end')} fill="var(--ty-ink-2)" style={{ font: '500 22px var(--ty-font-sans)' }}>
                {tr(e.chave)}
              </text>
              <rect x={fim} y={y} width={w} height={alturaBarra} rx={6} fill={cor} opacity={passou ? 0.6 + 0.4 * acima : 0.9} />
              <text x={x(x0 + w + 14)} y={y + alturaBarra / 2 + 9} textAnchor={ancora('start')} fill="var(--ty-ink)" style={{ font: '600 24px var(--ty-font-mono)' }}>
                {n(Math.round(e.valor * p))}
              </text>
            </g>
          )
        })}
        {linha > 0 ? (
          <g>
            <line
              x1={x(x0 + escala(LIMITE))}
              x2={x(x0 + escala(LIMITE))}
              y1={topoBarras - 24}
              y2={topoBarras - 24 + (passo * ESTACOES.length + 16) * linha}
              stroke="var(--ty-ink)"
              strokeWidth={3}
              strokeDasharray="10 8"
            />
            <text x={x(x0 + escala(LIMITE) + 12)} y={topoBarras - 30} textAnchor={ancora('start')} fill="var(--ty-ink)" opacity={linha} style={{ font: '600 20px var(--ty-font-sans)' }}>
              {tr('video.limite', { n: LIMITE })}
            </text>
          </g>
        ) : null}
      </g>

      {vereditos.map((v, i) => {
        const p = progresso(t, v.a, v.a + 0.8)
        if (p <= 0) return null
        const y = 280 + i * 120
        const cx = x(140)
        return (
          <g key={v.chave} opacity={p} transform={`translate(${(rtl ? -1 : 1) * (1 - p) * 40} 0)`}>
            <rect x={rtl ? W - 140 - 1000 : 140} y={y} width={1000} height={96} rx={14} fill="var(--ty-surface-solid)" stroke="var(--ty-line)" strokeWidth={2} />
            <circle cx={rtl ? cx - 44 : cx + 44} cy={y + 48} r={14} fill={v.estado} />
            <text x={rtl ? cx - 80 : cx + 80} y={y + 44} textAnchor={ancora('start')} fill="var(--ty-ink)" style={{ font: '600 28px var(--ty-font-serif)' }}>
              {tr(v.chave)}
            </text>
            <text x={rtl ? cx - 80 : cx + 80} y={y + 76} textAnchor={ancora('start')} fill={v.estado} style={{ font: '600 20px var(--ty-font-sans)' }}>
              {tr(v.rotulo)}
            </text>
          </g>
        )
      })}

      <text x={x(80)} y={H - 36} textAnchor={ancora('start')} fill="var(--ty-ink-3)" style={{ font: '400 18px var(--ty-font-mono)' }}>
        {tr('video.fonte')}
      </text>
    </svg>
  )
})
