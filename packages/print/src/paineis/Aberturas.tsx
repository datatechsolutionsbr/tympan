import type { EstadoProva } from '@datatechsolutions/tympan-tokens'
import type { ReactNode } from 'react'
import { LogoDatatech } from '../marca/LogoDatatech.tsx'
import { semente } from '../rough.ts'
import { cx, formatarNumero, useIdSeguro } from '../util.ts'
import { comColchetes, NumeroChamada } from './comum.tsx'
import { MarcaProva } from './MarcaProva.tsx'

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
  /** Values drawn as the cover graphic (e.g. the 17 FPM population cuts), on a log scale. */
  cortes?: number[]
  legendaGrafismo?: string
  /** Back cover seal lines. */
  selo?: string[]
  isbn?: string
  /** Print the publisher's mark (Datatech Solutions), small. */
  editora?: boolean
  className?: string
}

function Grafismo({ cortes, legenda }: { cortes: number[]; legenda?: string }) {
  const id = useIdSeguro('ty-print-grafismo')
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
    <figure className="ty-print-grafismo" aria-labelledby={legenda ? `${id}-l` : undefined}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={legenda ?? `${cortes.length} linhas de corte`}>
        {cortes.map((c, i) => (
          <line key={i} className="ty-print-grafismo-linha" x1={x(c)} x2={x(c)} y1={2} y2={h - 8} data-valor={c} />
        ))}
        <text className="ty-print-grafismo-rotulo" x={x(primeiro)} y={h - 2} textAnchor="middle">
          {formatarNumero(primeiro)}
        </text>
        <text className="ty-print-grafismo-rotulo" x={x(ultimo)} y={h - 2} textAnchor="end">
          {formatarNumero(ultimo)}
        </text>
      </svg>
      {legenda ? (
        <figcaption id={`${id}-l`}>
          {comColchetes(legenda)} <span className="ty-print-grafismo-escala">(escala logarítmica)</span>
        </figcaption>
      ) : null}
    </figure>
  )
}

/** Front or back cover, printed on the ink colour (inverted). */
export function Capa({ face = 'primeira', eyebrow, titulo, subtitulo, autora, chamada, paragrafos, destaque, cortes, legendaGrafismo, selo, isbn, editora = true, className }: CapaProps) {
  return (
    <div className={cx('ty-print-capa', className)} data-face={face}>
      {eyebrow ? <p className="ty-print-capa-eyebrow">{comColchetes(eyebrow)}</p> : null}
      {titulo ? <h1 className="ty-print-capa-titulo">{comColchetes(titulo)}</h1> : null}
      {subtitulo ? <p className="ty-print-capa-subtitulo">{comColchetes(subtitulo)}</p> : null}
      {chamada ? <p className="ty-print-capa-chamada">{comColchetes(chamada)}</p> : null}
      {paragrafos?.map((p, i) => (
        <p key={i} className="ty-print-capa-texto">
          {comColchetes(p)}
        </p>
      ))}
      {destaque ? (
        <div className="ty-print-capa-destaque">
          <p className="ty-print-sobretitulo">{comColchetes(destaque.eyebrow)}</p>
          <p className="ty-print-capa-destaque-texto">{comColchetes(destaque.texto)}</p>
          <p className="ty-print-capa-destaque-fonte">{comColchetes(destaque.fonte)}</p>
        </div>
      ) : null}
      {cortes?.length ? <Grafismo cortes={cortes} legenda={legendaGrafismo} /> : null}
      {autora ? <p className="ty-print-capa-autora">{comColchetes(autora)}</p> : null}
      {selo?.length ? (
        <ul className="ty-print-capa-selo">
          {selo.map((s, i) => (
            <li key={i}>{comColchetes(s)}</li>
          ))}
        </ul>
      ) : null}
      <div className="ty-print-capa-pe">
        {editora ? <LogoDatatech largura={face === 'primeira' ? 22 : 26} /> : null}
        {isbn ? <p className="ty-print-capa-isbn">ISBN {comColchetes(isbn)}</p> : null}
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
    <header className={cx('ty-print-abertura', className)}>
      <p className="ty-print-abertura-numero">
        Parte <span className="ty-print-abertura-romano">{numero}</span>
      </p>
      <h1 className="ty-print-abertura-titulo">{comColchetes(titulo)}</h1>
      <p className="ty-print-abertura-pergunta">{comColchetes(pergunta)}</p>
      {partes?.length ? (
        <ol className="ty-print-abertura-partes" aria-label="Partes do livro">
          {partes.map((p) => (
            <li key={p.numero} data-atual={p.numero === numero ? '' : undefined} aria-current={p.numero === numero ? 'true' : undefined}>
              <span className="ty-print-abertura-romano">{p.numero}</span> {comColchetes(p.titulo)}
            </li>
          ))}
        </ol>
      ) : null}
      {nestaParte?.length ? (
        <div className="ty-print-abertura-capitulos">
          <p className="ty-print-sobretitulo">Nesta parte</p>
          <ol>
            {nestaParte.map((c, i) => (
              <li key={i}>
                <span className="ty-print-abertura-cap">{comColchetes(c.cap)}</span> {comColchetes(c.titulo)}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {ondeIssoVolta ? (
        <p className="ty-print-abertura-volta">
          <span className="ty-print-margem-titulo">Onde isso volta</span> {comColchetes(ondeIssoVolta)}
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
    <div className={cx('ty-print-como-ler', className)} data-secao={secao}>
      {titulo ? <p className="ty-print-bloco-titulo">{comColchetes(titulo)}</p> : null}
      {letras?.length ? (
        <dl className="ty-print-como-ler-letras">
          {letras.map((l) => (
            <div key={l.letra}>
              <dt>
                <span className="ty-print-letra">{l.letra}</span> {comColchetes(l.titulo)}
              </dt>
              <dd>
                {comColchetes(l.texto)}
                {l.miniatura ? <span className="ty-print-miniatura">{comColchetes(l.miniatura)}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {estados?.length ? (
        <dl className="ty-print-como-ler-estados">
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
        <ol className="ty-print-chamadas">
          {itens.map((it, i) => (
            <li key={i}>
              <NumeroChamada>{i + 1}</NumeroChamada>
              <span>{typeof it === 'string' ? comColchetes(it) : it}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {regra ? <p className="ty-print-regra">{comColchetes(regra)}</p> : null}
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
    <section className={cx('ty-print-linha-tempo', className)} aria-label={alt ?? titulo ?? `Linha do tempo, ${de} a ${ate}`}>
      {titulo ? <p className="ty-print-bloco-titulo">{comColchetes(titulo)}</p> : null}
      {volumes?.length ? (
        <ol className="ty-print-linha-tempo-volumes">
          {volumes.map((v) => (
            <li key={v.volume} style={{ flexGrow: Math.max(1, v.ate - v.de + 1) }}>
              <span className="ty-print-linha-tempo-vol">Vol. {v.volume}</span> {comColchetes(v.titulo)}{' '}
              <span className="ty-print-linha-tempo-anos">
                {v.de}–{v.ate}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      <ol className="ty-print-linha-tempo-anos-lista">
        {anos.map((ano) => (
          <li key={ano}>
            <span className="ty-print-linha-tempo-ano">{ano}</span>
            <ul>
              {eventos
                .filter((e) => e.ano === ano)
                .map((e, i) => (
                  <li key={i} data-status={e.status}>
                    <MarcaStatus status={e.status} />
                    <span className="ty-print-linha-tempo-norma">{comColchetes(e.norma)}</span>
                    <span className="ty-print-linha-tempo-onde">
                      {e.fio ? `Parte ${e.fio} · ` : ''}
                      {comColchetes(e.onde)} <span className="ty-print-sr">({STATUS[e.status]})</span>
                    </span>
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ol>
      <ul className="ty-print-linha-tempo-legenda" aria-label="Legenda">
        {(Object.keys(STATUS) as StatusLei[])
          .filter((s) => eventos.some((e) => e.status === s))
          .map((s) => (
            <li key={s}>
              <MarcaStatus status={s} /> {STATUS[s]}
            </li>
          ))}
      </ul>
      {herdadas ? <p className="ty-print-linha-tempo-nota">{comColchetes(herdadas)}</p> : null}
      {nota ? <p className="ty-print-linha-tempo-nota">{comColchetes(nota)}</p> : null}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Mapa (schematic tile map)
// ---------------------------------------------------------------------------

/** Schematic tile grid of the 27 federative units (column, row). */
const LADRILHOS: Array<[string, number, number]> = [
  ['RR', 1, 0], ['AP', 3, 0],
  ['AC', 0, 1], ['AM', 1, 1], ['PA', 2, 1], ['MA', 3, 1], ['CE', 4, 1], ['RN', 5, 1],
  ['RO', 1, 2], ['MT', 2, 2], ['TO', 3, 2], ['PI', 4, 2], ['PE', 5, 2], ['PB', 6, 2],
  ['MS', 2, 3], ['GO', 3, 3], ['DF', 4, 3], ['BA', 5, 3], ['AL', 6, 3],
  ['PR', 2, 4], ['SP', 3, 4], ['MG', 4, 4], ['ES', 5, 4], ['SE', 6, 4],
  ['SC', 2, 5], ['RJ', 4, 5],
  ['RS', 2, 6],
]

export interface MapaProps {
  titulo: string
  /** What the map shows, for assistive technology. */
  alt: string
  /** Example data (schematic, deterministic): prints the "Dados de exemplo" tag. */
  exemplo?: boolean
  /** Classes of the legend, from low to high; tiles use as many shades as there are classes. */
  legenda?: string[]
  comoLer?: string
  naoMostra?: string
  /** Full-bleed plate. */
  sangria?: boolean
  className?: string
}

/**
 * Schematic tile map (one tile per federative unit, not the municipal mesh).
 * Classes print as fill patterns, so the map reads in black and white.
 */
export function Mapa({ titulo, alt, exemplo = false, legenda, comoLer, naoMostra, sangria = false, className }: MapaProps) {
  const id = useIdSeguro('ty-print-mapa')
  const classes = Math.max(2, Math.min(6, legenda?.length ?? 5))
  const t = 9
  const g = 0.8
  const w = 7 * (t + g)
  const h = 7 * (t + g)
  const classe = (uf: string) => (exemplo ? semente(`${titulo}|${uf}`) % classes : -1)
  return (
    <figure className={cx('ty-print-mapa', className)} data-sangria={sangria ? '' : undefined} data-exemplo={exemplo ? '' : undefined}>
      <figcaption className="ty-print-figura-cabeca">
        <span className="ty-print-figura-titulo">{comColchetes(titulo)}</span>
      </figcaption>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={alt} style={{ maxInlineSize: sangria ? '100%' : `${w * 1.2}mm` }}>
        <defs>
          {Array.from({ length: classes }, (_, k) => (
            <pattern key={k} id={`${id}-c${k}`} width={1.2} height={1.2} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width={1.2} height={1.2} style={{ fill: 'var(--ty-print-papel)' }} />
              <rect width={(1.2 * k) / Math.max(1, classes - 1)} height={1.2} style={{ fill: 'var(--ty-print-destaque)' }} />
            </pattern>
          ))}
        </defs>
        {LADRILHOS.map(([uf, c, r]) => {
          const k = classe(uf)
          return (
            <g key={uf} transform={`translate(${c * (t + g)} ${r * (t + g)})`} data-uf={uf} data-classe={k}>
              <rect width={t} height={t} className="ty-print-ladrilho" style={{ fill: k >= 0 ? `url(#${id}-c${k})` : 'var(--ty-print-papel)' }} />
              <text x={t / 2} y={t / 2 + 1.1} textAnchor="middle" className="ty-print-ladrilho-uf">
                {uf}
              </text>
            </g>
          )
        })}
      </svg>
      {legenda?.length ? (
        <ul className="ty-print-mapa-legenda">
          {legenda.map((l, k) => (
            <li key={k}>
              <svg viewBox="0 0 6 6" aria-hidden="true" focusable="false">
                <rect width={6} height={6} className="ty-print-ladrilho" style={{ fill: `url(#${id}-c${k})` }} />
              </svg>
              {comColchetes(l)}
            </li>
          ))}
        </ul>
      ) : null}
      {comoLer ? (
        <p className="ty-print-mapa-nota">
          <span className="ty-print-margem-titulo">Como ler</span> {comColchetes(comoLer)}
        </p>
      ) : null}
      {naoMostra ? (
        <p className="ty-print-mapa-nota">
          <span className="ty-print-margem-titulo">O que o mapa não mostra</span> {comColchetes(naoMostra)}
        </p>
      ) : null}
      {exemplo ? <p className="ty-print-selo-exemplo">Dados de exemplo</p> : null}
    </figure>
  )
}
