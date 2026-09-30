import type { EstadoProva } from '@datatechsolutions/tympan-tokens'
import type { ReactNode } from 'react'
import { LogoDatatech } from '../brand/LogoDatatech.tsx'
import { cx, formatarNumero, useIdSeguro } from '../util.ts'
import { comColchetes, NumeroChamada } from './common.tsx'
import { MarcaProva } from './ProofMark.tsx'

// ---------------------------------------------------------------------------
// Capa
// ---------------------------------------------------------------------------

export interface CapaProps {
  /** primeira (front cover) or quarta (back cover). */
  face?: 'primeira' | 'quarta'
  eyebrow?: string
  titulo?: string
  subtitulo?: string
  autora?: string
  /** Back cover: the opening line. */
  chamada?: string
  paragrafos?: string[]
  /** Back cover: one number from the book, with its source. */
  destaque?: { eyebrow: string; texto: string; fonte: string }
  /** Values drawn as the cover graphic (e.g. the thresholds of a rule), on a log scale. */
  cortes?: number[]
  legendaGrafismo?: string
  /** Back cover seal lines. */
  selo?: string[]
  isbn?: string
  /** Print the publisher's mark (Datatech Solutions), small; off by default because content places LogoDatatech itself. */
  editora?: boolean
  className?: string
}

function Grafismo({ cortes, legenda }: { cortes: number[]; legenda?: string }) {
  const id = useIdSeguro('ty-print-graphic')
  const w = 120
  const h = 46
  const min = Math.min(...cortes)
  const max = Math.max(...cortes)
  const lo = Math.log10(min / 1.6)
  const hi = Math.log10(max * 1.15)
  const x = (v: number) => Math.round(((Math.log10(v) - lo) / (hi - lo)) * w * 1000) / 1000
  const primeiro = cortes[0] ?? min
  const ultimo = cortes[cortes.length - 1] ?? max
  return (
    <figure className="ty-print-graphic" aria-labelledby={legenda ? `${id}-l` : undefined}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={legenda ?? `${cortes.length} linhas de corte`}>
        {cortes.map((c, i) => (
          <line key={i} className="ty-print-graphic-line" x1={x(c)} x2={x(c)} y1={2} y2={h - 8} data-valor={c} />
        ))}
        <text className="ty-print-graphic-label" x={x(primeiro)} y={h - 2} textAnchor="middle">
          {formatarNumero(primeiro)}
        </text>
        <text className="ty-print-graphic-label" x={x(ultimo)} y={h - 2} textAnchor="end">
          {formatarNumero(ultimo)}
        </text>
      </svg>
      {legenda ? (
        <figcaption id={`${id}-l`}>
          {comColchetes(legenda)} <span className="ty-print-graphic-escala">(escala logarítmica)</span>
        </figcaption>
      ) : null}
    </figure>
  )
}

/** Front or back cover, printed on the ink colour (inverted). */
export function Capa({ face = 'primeira', eyebrow, titulo, subtitulo, autora, chamada, paragrafos, destaque, cortes, legendaGrafismo, selo, isbn, editora = false, className }: CapaProps) {
  return (
    <div className={cx('ty-print-chapa', className)} data-face={face}>
      {eyebrow ? <p className="ty-print-chapa-eyebrow">{comColchetes(eyebrow)}</p> : null}
      {titulo ? <h1 className="ty-print-chapa-title">{comColchetes(titulo)}</h1> : null}
      {subtitulo ? <p className="ty-print-chapa-subtitle">{comColchetes(subtitulo)}</p> : null}
      {chamada ? <p className="ty-print-chapa-kicker">{comColchetes(chamada)}</p> : null}
      {paragrafos?.map((p, i) => (
        <p key={i} className="ty-print-chapa-text">
          {comColchetes(p)}
        </p>
      ))}
      {destaque ? (
        <div className="ty-print-chapa-highlight">
          <p className="ty-print-sobretitle">{comColchetes(destaque.eyebrow)}</p>
          <p className="ty-print-chapa-highlight-text">{comColchetes(destaque.texto)}</p>
          <p className="ty-print-chapa-highlight-source">{comColchetes(destaque.fonte)}</p>
        </div>
      ) : null}
      {cortes?.length ? <Grafismo cortes={cortes} legenda={legendaGrafismo} /> : null}
      {autora ? <p className="ty-print-chapa-author">{comColchetes(autora)}</p> : null}
      {selo?.length ? (
        <ul className="ty-print-chapa-badge">
          {selo.map((s, i) => (
            <li key={i}>{comColchetes(s)}</li>
          ))}
        </ul>
      ) : null}
      <div className="ty-print-chapa-foot">
        {editora ? <LogoDatatech largura={face === 'primeira' ? 22 : 26} /> : null}
        {isbn ? <p className="ty-print-chapa-isbn">ISBN {comColchetes(isbn)}</p> : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AberturaParte
// ---------------------------------------------------------------------------

export interface AberturaParteProps {
  /** Part number in Roman numerals. */
  numero: string
  titulo: string
  pergunta: string
  /** All parts of the book; the current one is highlighted. */
  partes?: Array<{ numero: string; titulo: string }>
  /** Chapters in this part. */
  nestaParte?: Array<{ cap: string; titulo: string }>
  ondeIssoVolta?: string
  className?: string
}

export function AberturaParte({ numero, titulo, pergunta, partes, nestaParte, ondeIssoVolta, className }: AberturaParteProps) {
  return (
    <header className={cx('ty-print-ofootner', className)}>
      <p className="ty-print-ofootner-number">
        Parte <span className="ty-print-ofootner-roman">{numero}</span>
      </p>
      <h1 className="ty-print-ofootner-title">{comColchetes(titulo)}</h1>
      <p className="ty-print-ofootner-question">{comColchetes(pergunta)}</p>
      {partes?.length ? (
        <ol className="ty-print-ofootner-parts" aria-label="Partes do book">
          {partes.map((p) => (
            <li key={p.numero} data-atual={p.numero === numero ? '' : undefined} aria-current={p.numero === numero ? 'true' : undefined}>
              <span className="ty-print-ofootner-roman">{p.numero}</span> {comColchetes(p.titulo)}
            </li>
          ))}
        </ol>
      ) : null}
      {nestaParte?.length ? (
        <div className="ty-print-ofootner-chapters">
          <p className="ty-print-sobretitle">Nesta parte</p>
          <ol>
            {nestaParte.map((c, i) => (
              <li key={i}>
                <span className="ty-print-ofootner-chap">{comColchetes(c.cap)}</span> {comColchetes(c.titulo)}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {ondeIssoVolta ? (
        <p className="ty-print-ofootner-back">
          <span className="ty-print-margin-title">Onde isso volta</span> {comColchetes(ondeIssoVolta)}
        </p>
      ) : null}
    </header>
  )
}

// ---------------------------------------------------------------------------
// ComoLer
// ---------------------------------------------------------------------------

export interface ComoLerProps {
  /** Which part of the reading guide: panel letters, proof states or numbered chart callouts. */
  secao?: 'letras' | 'estados'
  titulo?: string
  letras?: Array<{ letra: string; titulo: string; texto: string; miniatura?: string }>
  estados?: Array<{ estado: EstadoProva; texto: string }>
  /** Numbered callouts for the chart beside ("como ler o gráfico ao lado"). */
  itens?: ReactNode[]
  /** Closing rule of thumb. */
  regra?: string
  className?: string
}

/** Reading guide: what each panel letter means, what each proof state means, or the chart's numbered callouts. */
export function ComoLer({ secao, titulo, letras, estados, itens, regra, className }: ComoLerProps) {
  return (
    <div className={cx('ty-print-how-to-read', className)} data-secao={secao}>
      {titulo ? <p className="ty-print-block-title">{comColchetes(titulo)}</p> : null}
      {letras?.length ? (
        <dl className="ty-print-how-to-read-letters">
          {letras.map((l) => (
            <div key={l.letra}>
              <dt>
                <span className="ty-print-letter">{l.letra}</span> {comColchetes(l.titulo)}
              </dt>
              <dd>
                {comColchetes(l.texto)}
                {l.miniatura ? <span className="ty-print-thumbnail">{comColchetes(l.miniatura)}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {estados?.length ? (
        <dl className="ty-print-how-to-read-states">
          {estados.map((e) => (
            <div key={e.estado}>
              <dt>
                <MarcaProva estado={e.estado} />
              </dt>
              <dd>{comColchetes(e.texto)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {itens?.length ? (
        <ol className="ty-print-kickers">
          {itens.map((it, i) => (
            <li key={i}>
              <NumeroChamada>{i + 1}</NumeroChamada>
              <span>{typeof it === 'string' ? comColchetes(it) : it}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {regra ? <p className="ty-print-rule">{comColchetes(regra)}</p> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LinhaDoTempo
// ---------------------------------------------------------------------------

export type StatusLei = 'medida-neste-volume' | 'pendente' | 'outro-volume' | 'quando-o-dado-chegar' | 'em-espera' | 'a-confirmar'

const STATUS: Record<StatusLei, string> = {
  'medida-neste-volume': 'medida neste volume',
  pendente: 'veredito pendente, medição marcada',
  'outro-volume': 'medida em outro volume',
  'quando-o-dado-chegar': 'quando o dado chegar',
  'em-espera': 'em espera',
  'a-confirmar': 'a confirmar',
}

export interface LinhaDoTempoProps {
  titulo?: string
  de: number
  ate: number
  /** What the timeline shows, for assistive technology. */
  alt?: string
  volumes?: Array<{ volume: string; titulo: string; de: number; ate: number }>
  eventos: Array<{ ano: number; norma: string; fio?: string | null; onde: string; status: StatusLei }>
  herdadas?: string
  nota?: string
  className?: string
}

function MarcaStatus({ status }: { status: StatusLei }) {
  const s = { stroke: 'currentColor', strokeWidth: 1.3, fill: 'none' }
  const formas: Record<StatusLei, ReactNode> = {
    'medida-neste-volume': <circle cx={5} cy={5} r={4} fill="currentColor" />,
    pendente: (
      <g style={s}>
        <circle cx={5} cy={5} r={3.8} />
        <path d="M5 2.8 V5 L6.6 6" />
      </g>
    ),
    'outro-volume': <rect x={1.2} y={1.2} width={7.6} height={7.6} style={s} />,
    'quando-o-dado-chegar': <circle cx={5} cy={5} r={3.8} style={s} strokeDasharray="1.8 1.4" />,
    'em-espera': <circle cx={5} cy={5} r={3.8} style={s} />,
    'a-confirmar': (
      <text x={5} y={8.4} textAnchor="middle" fontSize={9} fill="currentColor">
        ?
      </text>
    ),
  }
  return (
    <svg className="ty-print-status" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      {formas[status]}
    </svg>
  )
}

/** Timeline of laws, grouped by year, with where each one is measured. */
export function LinhaDoTempo({ titulo, de, ate, alt, volumes, eventos, herdadas, nota, className }: LinhaDoTempoProps) {
  const anos = [...new Set(eventos.filter((e) => e.ano >= de && e.ano <= ate).map((e) => e.ano))].sort((a, b) => a - b)
  return (
    <section className={cx('ty-print-line-time', className)} aria-label={alt ?? titulo ?? `Linha do tempo, ${de} a ${ate}`}>
      {titulo ? <p className="ty-print-block-title">{comColchetes(titulo)}</p> : null}
      {volumes?.length ? (
        <ol className="ty-print-line-time-volumes">
          {volumes.map((v) => (
            <li key={v.volume} style={{ flexGrow: Math.max(1, v.ate - v.de + 1) }}>
              <span className="ty-print-line-time-vol">Vol. {v.volume}</span> {comColchetes(v.titulo)}{' '}
              <span className="ty-print-line-time-years">
                {v.de}–{v.ate}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      <ol className="ty-print-line-time-years-list">
        {anos.map((ano) => (
          <li key={ano}>
            <span className="ty-print-line-time-year">{ano}</span>
            <ul>
              {eventos
                .filter((e) => e.ano === ano)
                .map((e, i) => (
                  <li key={i} data-status={e.status}>
                    <MarcaStatus status={e.status} />
                    <span className="ty-print-line-time-norm">{comColchetes(e.norma)}</span>
                    <span className="ty-print-line-time-where">
                      {e.fio ? `Parte ${e.fio} · ` : ''}
                      {comColchetes(e.onde)} <span className="ty-print-sr">({STATUS[e.status]})</span>
                    </span>
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ol>
      <ul className="ty-print-line-time-legend" aria-label="Legenda">
        {(Object.keys(STATUS) as StatusLei[])
          .filter((s) => eventos.some((e) => e.status === s))
          .map((s) => (
            <li key={s}>
              <MarcaStatus status={s} /> {STATUS[s]}
            </li>
          ))}
      </ul>
      {herdadas ? <p className="ty-print-line-time-note">{comColchetes(herdadas)}</p> : null}
      {nota ? <p className="ty-print-line-time-note">{comColchetes(nota)}</p> : null}
    </section>
  )
}
