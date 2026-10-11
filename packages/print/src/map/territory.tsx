// Maps for "one page per territorial unit" books: the unit with its neighbours
// (locator), and proportional circles over a recorte. Both draw only the
// geometries they use (never the whole mesh), read the style's data palette
// (destaque = the unit of interest in full ink, contexto = the rest in grey)
// and print no labels over the mesh; a callout, when asked, sits outside the
// drawing with a leader line to the margin.
import { geoCentroid } from 'd3-geo'
import type { ReactNode } from 'react'
import { useLarguraDisponivel, usePrint } from '../context.tsx'
import { comColchetes } from '../panels/common.tsx'
import { TabelaDados } from '../panels/Method.tsx'
import { cx, formatarNumero, r3 } from '../utils.ts'
import { alturaPara, bordas, caminho, municipios, municipiosPorCodigo, projecaoBrasil, ufDoMunicipio, ufsDoRecorte, vizinhanca, type Recorte } from './mesh.ts'

export interface MapaLocalizacaoProps {
  /** 7-digit IBGE code of the unit. */
  codigo: string
  /** The finding or the place in one sentence (accessible name). */
  alt: string
  titulo?: string
  /** Rings of neighbours around the unit (default 1: those that share a border). */
  aneis?: number
  /** Width in mm (default: the panel's). */
  largura?: number
  /** Maximum height in mm (the drawing narrows to fit). */
  altura?: number
  /** A callout outside the drawing, joined to the unit by a leader line that runs to the margin. */
  chamada?: { texto: string; lado?: 'inicio' | 'fim' }
  /** Draw UF borders that cross the neighbourhood (default true). */
  divisas?: boolean
  className?: string
}

/**
 * The unit (in the style's highlight ink) among its neighbours (in the context grey), framed by their bounding
 * box. No names over the mesh; the page title names the unit and the optional callout sits in the margin.
 */
export function MapaLocalizacao({ codigo, alt, titulo, aneis = 1, largura, altura, chamada, divisas = true, className }: MapaLocalizacaoProps) {
  const { pb } = usePrint()
  const disponivel = useLarguraDisponivel()
  const { vizinhos } = vizinhanca(codigo, aneis)
  const areas = municipiosPorCodigo([codigo, ...vizinhos])
  const foco = areas.find((a) => a.properties.code === codigo)!
  const reservaChamada = chamada ? 0.38 : 0
  const Wtot = r3(largura ?? disponivel ?? 60)
  const margem = 0.5
  let W = r3(Wtot * (1 - reservaChamada))
  let H = r3(alturaPara(areas, W - 2 * margem) + 2 * margem)
  if (altura && H > altura) {
    W = r3(Math.max(6, 2 * margem + ((W - 2 * margem) * (altura - 2 * margem)) / (H - 2 * margem)))
    H = r3(alturaPara(areas, W - 2 * margem) + 2 * margem)
  }
  const proj = projecaoBrasil(areas, W, H, margem)
  const path = caminho(proj)
  const [fx, fy] = (proj(geoCentroid(foco)) ?? path.centroid(foco)).map(r3) as [number, number]
  const ufs = new Set(areas.map((a) => ufDoMunicipio(a.properties.code)))
  const divisa = divisas && ufs.size > 1 ? path(bordas(ufs).internas) : null
  const inicio = chamada?.lado === 'inicio'
  const Wsvg = chamada ? Wtot : W
  const dx = chamada && inicio ? r3(Wtot - W) : 0
  const destaque = pb ? 'var(--ty-print-tinta)' : 'var(--ty-print-destaque)'
  const contexto = 'var(--ty-print-contexto-area, var(--ty-print-contexto))'
  const nomeFoco = foco.properties.name
  return (
    <figure className={cx('ty-print-map', 'ty-print-locator', className)} data-codigo={codigo} data-areas={areas.length} data-chamada={chamada ? (inicio ? 'inicio' : 'fim') : undefined}>
      {titulo ? (
        <figcaption className="ty-print-figure-head">
          <span className="ty-print-figure-title">{comColchetes(titulo)}</span>
        </figcaption>
      ) : null}
      <div className="ty-print-locator-box" style={{ maxInlineSize: `${Wsvg}mm` }}>
      <svg className="ty-print-map-svg" viewBox={`0 0 ${Wsvg} ${H}`} role="img" aria-label={alt} style={{ maxInlineSize: `${Wsvg}mm`, aspectRatio: `${Wsvg} / ${H}` }}>
        <title>{alt}</title>
        <desc>{`${nomeFoco} e ${vizinhos.length} municípios vizinhos (${aneis} anel${aneis > 1 ? 'is' : ''}).`}</desc>
        <g transform={dx ? `translate(${dx} 0)` : undefined}>
          <path className="ty-print-locator-context" d={areas.filter((a) => a !== foco).map((a) => path(a) ?? '').join('')} style={{ fill: contexto, stroke: 'var(--ty-print-papel)', strokeWidth: 0.25 }} />
          {divisa ? <path className="ty-print-locator-uf" d={divisa} style={{ fill: 'none', stroke: 'var(--ty-print-tinta-3)', strokeWidth: 0.3, strokeDasharray: '0.8 0.5' }} /> : null}
          <path className="ty-print-locator-focus" data-code={codigo} d={path(foco) ?? ''} style={{ fill: destaque, stroke: 'var(--ty-print-tinta)', strokeWidth: 0.3 }} />
        </g>
        {chamada ? (
          <g className="ty-print-callout">
            <circle cx={r3(fx + dx)} cy={fy} r={0.5} style={{ fill: 'var(--ty-print-tinta)' }} />
            <line x1={r3(fx + dx)} y1={fy} x2={inicio ? r3(Math.max(0, dx - 1)) : r3(W + 1)} y2={fy} style={{ stroke: 'var(--ty-print-tinta)', strokeWidth: 0.2 }} />
          </g>
        ) : null}
      </svg>
      {chamada ? (
        // The text sits in the reserved column beside the map, centred on the leader line (percentages of the
        // drawing, so it stays on the line at any rendered size), never over the mesh.
        <p
          className="ty-print-callout-text"
          style={{
            top: `${r3((fy / H) * 100)}%`,
            ...(inicio ? { insetInlineStart: 0, inlineSize: `${r3(((dx - 1.5) / Wsvg) * 100)}%`, textAlign: 'end' as const } : { insetInlineEnd: 0, inlineSize: `${r3(((Wsvg - W - 1.5) / Wsvg) * 100)}%`, textAlign: 'start' as const }),
          }}
        >
          {comColchetes(chamada.texto)}
        </p>
      ) : null}
      </div>
    </figure>
  )
}

export interface MapaSimbolosProps {
  titulo: string
  alt: string
  /** Values by 7-digit IBGE code (absolute counts: votes, people). Circle AREA is proportional to the value. */
  valores: Record<string, number | null>
  /** UFs or region to draw (default: Brazil). */
  recorte?: Recorte
  unidade?: string
  /** Radius in mm of the largest value (default 4). */
  raioMaximo?: number
  /** Values shown in the legend (default: max, max/4, max/16 rounded). */
  referencias?: number[]
  /** Codes drawn in the highlight ink (the rest in the context ink). */
  destaques?: string[]
  largura?: number
  altura?: number
  className?: string
}

const arredonda = (v: number) => {
  if (v <= 0) return 0
  const p = 10 ** Math.floor(Math.log10(v))
  return Math.round(v / p) * p
}

/**
 * Proportional circles (area ∝ value) at each municipality's centroid, over the recorte's outline. Largest
 * drawn first so small circles stay visible; the capital no longer vanishes as it does in a % choropleth.
 */
export function MapaSimbolos({ titulo, alt, valores, recorte, unidade, raioMaximo = 4, referencias, destaques, largura, altura, className }: MapaSimbolosProps) {
  const disponivel = useLarguraDisponivel()
  const { pb } = usePrint()
  const filtro = ufsDoRecorte(recorte)
  const areas = municipios().filter((f) => filtro.has(ufDoMunicipio(f.properties.code)))
  const margem = raioMaximo
  let W = r3(largura ?? disponivel ?? 110)
  let H = r3(alturaPara(areas, W - 2 * margem) + 2 * margem)
  if (altura && H > altura) {
    W = r3(2 * margem + ((W - 2 * margem) * (altura - 2 * margem)) / (H - 2 * margem))
    H = r3(alturaPara(areas, W - 2 * margem) + 2 * margem)
  }
  const proj = projecaoBrasil(areas, W, H, margem)
  const path = caminho(proj)
  const b = bordas(recorte ? filtro : undefined)
  const pontos = areas
    .map((a) => ({ a, v: valores[a.properties.code] }))
    .filter((x): x is { a: (typeof areas)[number]; v: number } => typeof x.v === 'number' && x.v > 0)
  const max = Math.max(0, ...pontos.map((p) => p.v))
  const raio = (v: number) => (max > 0 ? r3(raioMaximo * Math.sqrt(v / max)) : 0)
  const alvo = new Set(destaques ?? [])
  const ordenados = [...pontos].sort((x, y) => y.v - x.v || x.a.properties.code.localeCompare(y.a.properties.code))
  const refs = (referencias ?? [arredonda(max), arredonda(max / 4), arredonda(max / 16)]).map((v) => Math.min(v, max)).filter((v, i, all) => v > 0 && all.indexOf(v) === i)
  const tinta = (k: boolean) => (k && !pb ? 'var(--ty-print-destaque)' : k ? 'var(--ty-print-tinta)' : 'var(--ty-print-contexto-area, var(--ty-print-contexto))')
  const legH = raioMaximo * 2 + 4.5
  return (
    <figure className={cx('ty-print-map', 'ty-print-symbols', className)} data-pontos={pontos.length}>
      <figcaption className="ty-print-figure-head">
        <span className="ty-print-figure-title">{comColchetes(titulo)}</span>
      </figcaption>
      <svg className="ty-print-map-svg" viewBox={`0 0 ${W} ${r3(H + legH)}`} role="img" aria-label={alt} style={{ maxInlineSize: `${W}mm`, aspectRatio: `${W} / ${r3(H + legH)}` }}>
        <title>{alt}</title>
        <desc>{`Legenda: ${refs.map((v) => formatarNumero(v)).join(', ')}. Círculos proporcionais: ${pontos.length} municípios; a área do círculo é proporcional ao valor (máximo ${formatarNumero(max)}${unidade ? ` ${unidade}` : ''}).`}</desc>
        <path className="ty-print-map-borders" d={path(b.internas) ?? ''} style={{ fill: 'none', stroke: 'var(--ty-print-contexto-traco, var(--ty-print-linha))', strokeWidth: 0.2 }} />
        <path className="ty-print-map-outline" d={path(b.contorno) ?? ''} style={{ fill: 'none', stroke: 'var(--ty-print-tinta-3)', strokeWidth: 0.3 }} />
        {ordenados.map(({ a, v }) => {
          const [x, y] = proj(geoCentroid(a)) ?? path.centroid(a)
          const k = alvo.has(a.properties.code)
          return <circle key={a.properties.code} data-code={a.properties.code} cx={r3(x)} cy={r3(y)} r={raio(v)} style={{ fill: tinta(k), fillOpacity: k ? 0.9 : 0.75, stroke: 'var(--ty-print-papel)', strokeWidth: 0.15 }} />
        })}
        {/* Legend in the same drawing, so its circles use the same radius function AND the same scale. */}
        <g className="ty-print-symbols-legend" transform={`translate(0 ${H})`}>
        {(() => {
          // Reference circles side by side, bottom-aligned, each with its value centred under it (no overlap).
          let x = 0.5
          return refs.map((v, i) => {
            const r = raio(v)
            const larg = Math.max(2 * r, 9)
            const cx0 = r3(x + larg / 2)
            x += larg + 2
            return (
              <g key={v}>
                <circle cx={cx0} cy={r3(raioMaximo * 2 + 0.5 - r)} r={r} style={{ fill: 'none', stroke: 'var(--ty-print-tinta-2)', strokeWidth: 0.15 }} />
                <text className="ty-print-map-label" x={cx0} y={r3(legH - 0.6)} textAnchor="middle">
                  {`${formatarNumero(v)}${unidade && i === 0 ? ` ${unidade}` : ''}`}
                </text>
              </g>
            )
          })
        })()}
        </g>
      </svg>
      <div className="ty-print-sr">
        <TabelaDados titulo={`Dados: ${titulo}`} colunas={['Município', { rotulo: unidade ?? 'Valor', numerica: true }]} linhas={ordenados.slice(0, 20).map(({ a, v }) => [`${a.properties.name}/${ufDoMunicipio(a.properties.code)}`, formatarNumero(v)])} nota={pontos.length > 20 ? `Os 20 maiores de ${pontos.length}.` : undefined} />
      </div>
    </figure>
  )
}

export interface BandeiraProps {
  /** Image (SVG or PNG URL, data: URI works offline). Without it, an honest empty frame. */
  src?: string
  /** "Bandeira de Boa Vista". */
  alt: string
  /** Text of the empty frame (default "sem bandeira no acervo"). */
  semImagem?: ReactNode
  /** Aspect ratio width/height (default 10/7). */
  proporcao?: number
  className?: string
}

/** The flag or coat-of-arms box of the title corner; without an image, a dashed frame that says so (nothing invented). */
export function Bandeira({ src, alt, semImagem = 'sem bandeira no acervo', proporcao = 10 / 7, className }: BandeiraProps) {
  const style = { aspectRatio: String(r3(proporcao)) }
  return src ? (
    <img className={cx('ty-print-flag', className)} src={src} alt={alt} style={style} />
  ) : (
    <div className={cx('ty-print-flag', className)} data-vazia="" role="img" aria-label={`${alt}: não consta no acervo`} style={style}>
      {semImagem}
    </div>
  )
}
