// Maps for "one page per territorial unit" books: the unit with its neighbours
// (locator), and proportional circles over a recorte. Both draw only the
// geometries they use (never the whole mesh), read the style's data palette
// (destaque = the unit of interest in full ink, contexto = the rest in grey)
// and print no labels over the mesh; a callout, when asked, sits outside the
// drawing with a leader line to the margin.
import { tx } from '../i18n.ts'
import { geoCentroid, geoConicEqualArea, geoDistance } from 'd3-geo'
import { deltaE2000, parseColor } from '@datatechsolutions/tympan-tokens'
import { textoSobre } from '../chart/categoryColours.ts'
import type { ReactNode } from 'react'
import { useLarguraDisponivel, usePrint } from '../context.tsx'
import { comColchetes } from '../panels/common.tsx'
import { TabelaDados } from '../panels/Method.tsx'
import { cx, formatarNumero, r3 } from '../utils.ts'
import { ALBERS_BRASIL, CAPITAIS, alturaPara, bordas, caminho, ufs, municipios, municipiosPorCodigo, projecaoBrasil, ufDoMunicipio, ufsDoRecorte, vizinhanca, type Recorte } from './mesh.ts'

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
  /** A small Brazil in a corner with the unit's UF filled (default false). */
  inset?: boolean
  /** Mark the UF capital when it falls in the window and is not the unit (true: from CAPITAIS; or a code). */
  capital?: boolean | string
  /** A graphic scale with a round length (default false). */
  escala?: boolean
  /**
   * Fixed frame (mm): every locator of the book the same size; the window is centred on the unit, sized by
   * it, kept inside the UF on a border, and shows every municipality it covers (not only neighbours).
   */
  quadro?: { largura: number; altura: number }
  className?: string
}

/**
 * The unit (in the style's highlight ink) among its neighbours (in the context grey), framed by their bounding
 * box. No names over the mesh; the page title names the unit and the optional callout sits in the margin.
 */
export function MapaLocalizacao({ codigo, alt, titulo, aneis = 1, largura, altura, chamada, divisas = true, inset = false, capital = false, escala = false, quadro, className }: MapaLocalizacaoProps) {
  if (quadro) return <LocalizacaoQuadro codigo={codigo} alt={alt} titulo={titulo} quadro={quadro} inset={inset} capital={capital} escala={escala} className={className} />
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
  const destaque = pb ? 'var(--ty-print-tinta)' : 'var(--ty-print-interesse, var(--ty-print-destaque))'
  const contexto = 'var(--ty-print-contexto-area, var(--ty-print-contexto))'
  const nomeFoco = foco.properties.name
  const extras = extrasLocalizacao({ proj, codigo, uf: ufDoMunicipio(codigo), W, H, dx, inset, capital, escala, pb })
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
        {extras}
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
  const tinta = (k: boolean) => (k && !pb ? 'var(--ty-print-interesse, var(--ty-print-destaque))' : k ? 'var(--ty-print-tinta)' : 'var(--ty-print-contexto-area, var(--ty-print-contexto))')
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
        <TabelaDados titulo={tx('dados', { a: titulo })} colunas={[tx('municipio'), { rotulo: unidade ?? 'Valor', numerica: true }]} linhas={ordenados.slice(0, 20).map(({ a, v }) => [`${a.properties.name}/${ufDoMunicipio(a.properties.code)}`, formatarNumero(v)])} nota={pontos.length > 20 ? `Os 20 maiores de ${pontos.length}.` : undefined} />
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
export function Bandeira({ src, alt, semImagem, proporcao = 10 / 7, className }: BandeiraProps) {
  const style = { aspectRatio: String(r3(proporcao)) }
  return src ? (
    <img className={cx('ty-print-flag', className)} src={src} alt={alt} style={style} />
  ) : (
    <div className={cx('ty-print-flag', className)} data-vazia="" role="img" aria-label={tx('naoConstaNoAcervo', { a: alt })} style={style}>
      {semImagem ?? tx('semBandeira')}
    </div>
  )
}

/** Inset of Brazil with the UF, the capital point and a graphic scale for the locator map. */
function extrasLocalizacao({ proj, codigo, uf, W, H, dx, inset, capital, escala, pb }: { proj: ReturnType<typeof projecaoBrasil>; codigo: string; uf: string; W: number; H: number; dx: number; inset: boolean; capital: boolean | string; escala: boolean; pb: boolean }) {
  const out: ReactNode[] = []
  const cap = capital === true ? CAPITAIS[uf] : typeof capital === 'string' ? capital : undefined
  if (cap && cap !== codigo) {
    const f = municipiosPorCodigo([cap])[0]
    const p = f ? proj(geoCentroid(f)) : null
    if (p && p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H) {
      out.push(
        <g key="cap" className="ty-print-locator-capital" transform={`translate(${r3(p[0] + dx)} ${r3(p[1])})`} aria-label={tx('capital')}>
          <circle r={0.9} style={{ fill: 'var(--ty-print-papel)', stroke: 'var(--ty-print-tinta)', strokeWidth: 0.3 }} />
          <circle r={0.35} style={{ fill: 'var(--ty-print-tinta)' }} />
        </g>,
      )
    }
  }
  if (escala) {
    // A round length near a quarter of the width, measured on the ground at the bottom of the window.
    const y = H - 1.2
    const a = proj.invert?.([W * 0.6, y])
    const b = proj.invert?.([W * 0.6 + W / 4, y])
    if (a && b) {
      const km = geoDistance(a, b) * 6371
      const passos = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]
      const kmR = passos.reduce((m, p) => (Math.abs(p - km) < Math.abs(m - km) ? p : m), 1)
      const len = r3(((W / 4) * kmR) / km)
      const x0 = r3(W - len - 0.8 + dx)
      out.push(
        <g key="esc" className="ty-print-locator-scale" data-km={kmR}>
          <line x1={x0} y1={y} x2={r3(x0 + len)} y2={y} style={{ stroke: 'var(--ty-print-tinta)', strokeWidth: 0.35 }} />
          <line x1={x0} y1={y - 0.6} x2={x0} y2={y} style={{ stroke: 'var(--ty-print-tinta)', strokeWidth: 0.25 }} />
          <line x1={r3(x0 + len)} y1={y - 0.6} x2={r3(x0 + len)} y2={y} style={{ stroke: 'var(--ty-print-tinta)', strokeWidth: 0.25 }} />
          <text className="ty-print-map-label" x={r3(x0 + len)} y={r3(y - 0.9)} textAnchor="end">{`${kmR} km`}</text>
        </g>,
      )
    }
  }
  if (inset) {
    const w = r3(Math.min(12, W * 0.28))
    const todas = ufs()
    const pi = projecaoBrasil(todas, w, w, 0.2)
    const caminhoInset = caminho(pi).digits(1)
    const alvo = todas.find((f) => f.properties.code === uf)
    out.push(
      <g key="inset" className="ty-print-locator-inset" transform={`translate(${r3(dx + 0.3)} 0.3)`}>
        <path d={caminhoInset(bordas().contorno) ?? ''} style={{ fill: 'var(--ty-print-papel)', stroke: 'var(--ty-print-tinta-3)', strokeWidth: 0.2 }} />
        {alvo ? <path d={caminhoInset(alvo) ?? ''} style={{ fill: pb ? 'var(--ty-print-tinta)' : 'var(--ty-print-interesse, var(--ty-print-destaque))' }} /> : null}
      </g>,
    )
  }
  return out
}

// ---------------------------------------------------------------------------
// Fixed-frame locator (every map of a book the same size)
// ---------------------------------------------------------------------------

const CAIXAS = new Map<string, [number, number, number, number]>()

/** Planar lon/lat box of a feature (robust to ring orientation, unlike a spherical bounds). */
function caixaPlana(f: { properties: { code: string }; geometry: { coordinates: unknown } }): [number, number, number, number] {
  const pronta = CAIXAS.get(f.properties.code)
  if (pronta) return pronta
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const andar = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === 'number') {
      const [x, y] = c as [number, number]
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    } else if (Array.isArray(c)) c.forEach(andar)
  }
  andar(f.geometry.coordinates)
  const cx: [number, number, number, number] = [x0, y0, x1, y1]
  CAIXAS.set(f.properties.code, cx)
  return cx
}

/**
 * The locator in a fixed frame (`quadro`): the unit in the theme's highlight colour among every municipality
 * the window shows (light, white rules), the window centred on the unit and sized by it (so a long unit is
 * never tiny), kept inside the UF on a border; an inset of Brazil in its own column; capital point and scale.
 */
function LocalizacaoQuadro({ codigo, alt, titulo, quadro, inset, capital, escala, className }: { codigo: string; alt: string; titulo?: string; quadro: { largura: number; altura: number }; inset: boolean; capital: boolean | string; escala: boolean; className?: string }) {
  const { estilo, pb } = usePrint()
  const W = r3(quadro.largura)
  const H = r3(quadro.altura)
  const todos = municipios()
  const foco = todos.find((f) => f.properties.code === codigo)
  if (!foco) throw new Error(`tympan-print: município ${codigo} não está na malha`)
  const uf = ufDoMunicipio(codigo)
  const IW = inset ? r3(Math.min(H, W * 0.22)) : 0
  const mx0 = inset ? r3(IW + 1.2) : 0
  const ar = (W - mx0) / H
  const [x0, y0, x1, y1] = caixaPlana(foco)
  let jx = (x0 + x1) / 2
  let jy = (y0 + y1) / 2
  const dy = Math.max((y1 - y0) * 0.85, ((x1 - x0) * 0.85) / ar, 0.12)
  const dx = dy * ar
  // On a border the window stays inside the UF (the mesh has only Brazil: no empty foreign land).
  const doUf = todos.filter((f) => ufDoMunicipio(f.properties.code) === uf).map(caixaPlana)
  const u = [Math.min(...doUf.map((b) => b[0])), Math.min(...doUf.map((b) => b[1])), Math.max(...doUf.map((b) => b[2])), Math.max(...doUf.map((b) => b[3]))]
  const prender = (c: number, meia: number, a: number, b: number) => (b - a <= 2 * meia ? (a + b) / 2 : Math.min(Math.max(c, a + meia), b - meia))
  jx = prender(jx, dx, u[0]!, u[2]!)
  jy = prender(jy, dy, u[1]!, u[3]!)
  // Clockwise ring (d3-geo is spherical: counter-clockwise would be the globe minus the window).
  const janela = { type: 'Polygon' as const, coordinates: [[[jx - dx, jy - dy], [jx - dx, jy + dy], [jx + dx, jy + dy], [jx + dx, jy - dy], [jx - dx, jy - dy]]] }
  const proj = geoConicEqualArea().parallels(ALBERS_BRASIL.paralelos).rotate([-ALBERS_BRASIL.meridiano, 0]).center([0, ALBERS_BRASIL.latitudeOrigem]).fitExtent([[mx0, 0], [W, H]], janela as never)
  const path = caminho(proj)
  const vis = todos.filter((f) => {
    const [a, b, c, d] = caixaPlana(f)
    return c >= jx - dx && a <= jx + dx && d >= jy - dy && b <= jy + dy
  })
  const id = `ty-print-loc-${codigo}`
  const destaque = pb ? 'color-mix(in srgb, var(--ty-print-tinta) 72%, var(--ty-print-papel))' : 'var(--ty-print-destaque)'
  const contexto = 'var(--ty-print-contexto-area, var(--ty-print-contexto))'
  // Highlight too close to the context grey (ΔE2000 < 10): a hatch keeps the unit apart.
  const cD = pb ? null : estilo.cor.destaque
  const proximo = cD && cD.startsWith('#') && estilo.cor.contexto.startsWith('#') && deltaE2000(parseColor(cD), parseColor(estilo.cor.contexto)) < 10
  const extras = extrasLocalizacao({ proj, codigo, uf, W, H, dx: 0, inset: false, capital, escala, pb })
  const ufsF = ufs()
  const pI = projecaoBrasil(ufsF, IW, IW, 0.4)
  const pathI = caminho(pI).digits(1)
  return (
    <figure className={cx('ty-print-map', 'ty-print-locator', className)} data-codigo={codigo} data-quadro={`${W}x${H}`} data-areas={vis.length}>
      {titulo ? (
        <figcaption className="ty-print-figure-head">
          <span className="ty-print-figure-title">{comColchetes(titulo)}</span>
        </figcaption>
      ) : null}
      <svg className="ty-print-map-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={alt} style={{ inlineSize: `${W}mm`, maxInlineSize: '100%', aspectRatio: `${W} / ${H}` }}>
        <title>{alt}</title>
        <defs>
          <clipPath id={`${id}-c`}>
            <rect x={mx0} width={r3(W - mx0)} height={H} />
          </clipPath>
          {proximo ? (
            <pattern id={`${id}-h`} width={1} height={1} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width={1} height={1} style={{ fill: destaque }} />
              <line x1={0} y1={0} x2={0} y2={1} style={{ stroke: textoSobre(cD!), strokeWidth: 0.2, strokeOpacity: 0.7 }} />
            </pattern>
          ) : null}
        </defs>
        <g clipPath={`url(#${id}-c)`}>
          <path className="ty-print-locator-context" d={vis.filter((f) => f !== foco).map((f) => path(f) ?? '').join('')} style={{ fill: contexto, stroke: 'var(--ty-print-papel)', strokeWidth: 0.25 }} />
          <path className="ty-print-locator-focus" data-code={codigo} d={path(foco) ?? ''} style={{ fill: proximo ? `url(#${id}-h)` : destaque, stroke: 'var(--ty-print-papel)', strokeWidth: 0.3 }} />
          {extras}
        </g>
        {inset ? (
          <g className="ty-print-locator-inset" data-uf={uf}>
            <rect width={IW} height={IW} style={{ fill: 'var(--ty-print-papel)', stroke: 'var(--ty-print-linha)', strokeWidth: 0.2 }} />
            {ufsF.map((f) => (
              <path key={f.properties.code} d={pathI(f) ?? ''} style={{ fill: f.properties.code === uf ? destaque : contexto, stroke: 'var(--ty-print-papel)', strokeWidth: 0.12 }} />
            ))}
          </g>
        ) : null}
      </svg>
    </figure>
  )
}
