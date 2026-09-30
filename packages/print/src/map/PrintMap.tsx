// Mapa: the real map of Brazil (IBGE 2022 mesh, Albers equal-area conic),
// by federative unit or by municipality, as a class choropleth.
//
// Geometry is never touched by the style: every area is the projected mesh.
// The style only decides how a class is inked (flat colour, a hatch that
// reads in black and white, a dot screen) and how the borders are stroked
// (crisp, or trembled by rough.js with a fixed seed). Server-rendered and
// deterministic: d3-geo is used as pure functions, React writes the SVG.
import { geoCentroid } from 'd3-geo'
import type { ReactNode } from 'react'
import type { RenderizadorGrafico } from '@datatechsolutions/tympan-tokens'
import { useLarguraDisponivel, usePrint } from '../context.tsx'
import { comColchetes } from '../panels/common.tsx'
import { TabelaDados, type TabelaDadosProps } from '../panels/Method.tsx'
import { semente, tracar } from '../rough.ts'
import { cx, r3, useIdSeguro } from '../util.ts'
import { classeDe, quantis, rotulosLimites } from './classes.ts'
import {
  alturaPara,
  bordas,
  bordasMunicipais,
  caminho,
  municipios,
  projecaoBrasil,
  ufDoMunicipio,
  UF_IBGE,
  ufs,
  ufsDoRecorte,
  type Area,
  type NivelMapa,
  type Recorte,
} from './mesh.ts'

export interface MapaProps {
  titulo: string
  /** The finding in one sentence: the map's accessible name (and the EPUB alt text). */
  alt: string
  /** `municipio` (default: the 5,570 municipalities) or `uf` (the 27 federative units). */
  nivel?: NivelMapa
  /** Values by code (7-digit IBGE code; for `uf`, the abbreviation or the 2-digit code). Classed by `limites` or by quantiles. `null` or absent: no data. */
  valores?: Record<string, number | null>
  /** Class index (0 = lowest) by code, when the classes come ready (e.g. bands of a rule). Takes precedence over `valores`. */
  classes?: Record<string, number | null>
  /** Ascending class breaks for `valores` (n − 1 breaks → n classes). Without them, quantiles. */
  limites?: number[]
  /** Unit for generated legend labels. */
  unidade?: string
  /** `sequencial` (low → high, default) or `divergente` (two sides of a middle class). */
  escala?: 'sequencial' | 'divergente'
  /** Municipalities (or UFs) to outline and name: IBGE code, "Nome/UF" or a unique name. */
  destaques?: string[]
  /** Draw only a region ("Norte", "Nordeste", "Sudeste", "Sul", "Centro-Oeste") or a list of UFs. */
  recorte?: Recorte
  /** Example data (deterministic, not a finding): prints the "Dados de exemplo" tag. */
  exemplo?: boolean
  /** Class labels, low to high; their count sets the number of classes. */
  legenda?: string[]
  /** Label of the "no data" texture in the legend. */
  semDado?: string
  /** UF abbreviations on the map (default: on for `uf`, off for `municipio`). */
  rotulos?: boolean
  comoLer?: string
  naoMostra?: string
  /** Visible data table under the map; without it, a summary table is generated for assistive technology. */
  tabela?: TabelaDadosProps
  /** Renderer; defaults to the style's `chart`. */
  renderizador?: RenderizadorGrafico
  /** Width in mm (default: the panel's inner width). */
  largura?: number
  /** Maximum height of the drawing in mm (the map narrows to fit; with `multiplos`, of the whole grid). */
  altura?: number
  /** Small multiples: a grid of small maps sharing classes and one legend. Each item may bring its own recorte and data (else the figure's). */
  multiplos?: MapaMultiplo[]
  /** Columns of the small-multiples grid (default: up to 3). */
  colunas?: number
  /** Full-bleed plate. */
  sangria?: boolean
  className?: string
}

export interface MapaMultiplo {
  titulo: string
  recorte?: Recorte
  valores?: Record<string, number | null>
  classes?: Record<string, number | null>
  destaques?: string[]
  /** Example data for this map (defaults to the figure's `exemplo`). */
  exemplo?: boolean
}

const SEM_DADO = -1
const SEM_SERIE = -2

// ---------------------------------------------------------------------------
// Geometry, cached by frame (pure: same inputs, same strings)
// ---------------------------------------------------------------------------

interface AreaPosta {
  code: string
  nome: string
  uf: string
  d: string
  cx: number
  cy: number
  /** Projected bounding box size (mm), to mark areas too small to see. */
  tam: number
}

interface Geometria {
  W: number
  H: number
  areas: AreaPosta[]
  internas: string
  contorno: string
  municipais: string | null
}

const CACHE = new Map<string, Geometria>()

/** Mesh of `nivel` in `recorte`, projected at width `Wmax` (narrower when the height would pass `Hmax`). */
function geometria(nivel: NivelMapa, recorte: Recorte | undefined, Wmax: number, Hmax?: number): Geometria {
  const chave = `${nivel}|${JSON.stringify(recorte ?? null)}|${Wmax}|${Hmax ?? ''}`
  const pronta = CACHE.get(chave)
  if (pronta) return pronta
  const filtro = ufsDoRecorte(recorte)
  const todas: Area<{ code: string; name: string }>[] =
    nivel === 'uf' ? ufs().filter((f) => filtro.has(f.properties.code)) : municipios().filter((f) => filtro.has(ufDoMunicipio(f.properties.code)))
  const margem = 0.6
  let W = Wmax
  let H = r3(alturaPara(todas, W - 2 * margem) + 2 * margem)
  if (Hmax && H > Hmax) {
    W = r3(Math.max(4, 2 * margem + ((W - 2 * margem) * (Hmax - 2 * margem)) / (H - 2 * margem)))
    H = r3(alturaPara(todas, W - 2 * margem) + 2 * margem)
  }
  const proj = projecaoBrasil(todas, W, H, margem)
  const path = caminho(proj)
  const areas = todas.map((f) => {
    const [[x0, y0], [x1, y1]] = path.bounds(f)
    const [cx, cy] = proj(geoCentroid(f)) ?? path.centroid(f)
    return {
      code: f.properties.code,
      nome: f.properties.name,
      uf: nivel === 'uf' ? f.properties.code : ufDoMunicipio(f.properties.code),
      d: path(f) ?? '',
      cx: r3(cx),
      cy: r3(cy),
      tam: r3(Math.max(x1 - x0, y1 - y0)),
    }
  })
  const b = bordas(recorte ? filtro : undefined)
  const g: Geometria = {
    W,
    H,
    areas,
    internas: path(b.internas) ?? '',
    contorno: path(b.contorno) ?? '',
    municipais: nivel === 'municipio' ? (path(bordasMunicipais(recorte ? filtro : undefined)) ?? '') : null,
  }
  CACHE.set(chave, g)
  return g
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Value of `map` for an area: by its code, and for UFs also by the 2-digit code. */
function valorDe<T>(mapa: Record<string, T>, a: AreaPosta, nivel: NivelMapa): T | undefined {
  if (a.code in mapa) return mapa[a.code]
  if (nivel === 'uf') {
    const ibge = UF_IBGE[a.code]
    if (ibge && ibge in mapa) return mapa[ibge]
  }
  return undefined
}

/**
 * Example field: smooth over the territory (so it looks like a map, not
 * noise), with a little per-area jitter and ~1.5% of areas without data.
 * Deterministic from the code.
 */
function classeExemplo(a: AreaPosta, g: Geometria, n: number, titulo: string): number {
  const h = semente(`${titulo}|${a.code}`)
  if (h % 67 === 0) return SEM_DADO
  const u = a.cx / g.W
  const v = a.cy / g.H
  const campo = 0.5 + 0.22 * Math.sin(u * 7.1 + 1.3) + 0.2 * Math.cos(v * 6.3 - 0.4) + 0.14 * Math.sin((u + v) * 11.7) + ((h % 1000) / 1000 - 0.5) * 0.3
  return Math.max(0, Math.min(n - 1, Math.floor(campo * n)))
}

function resolverDestaques(consultas: string[], areas: AreaPosta[], nivel: NivelMapa): AreaPosta[] {
  const out: AreaPosta[] = []
  for (const q of consultas) {
    const t = q.trim()
    let achadas: AreaPosta[]
    if (/^\d{7}$/.test(t) || (nivel === 'uf' && /^[A-Za-z]{2}$|^\d{2}$/.test(t))) {
      achadas = areas.filter((a) => a.code === t.toUpperCase() || (nivel === 'uf' && UF_IBGE[a.code] === t))
    } else {
      const m = t.match(/^(.*?)\s*(?:\/|\s-\s|\()\s*([A-Za-z]{2})\)?$/)
      const nome = normalizar(m ? (m[1] as string) : t)
      const uf = m ? (m[2] as string).toUpperCase() : null
      achadas = areas.filter((a) => normalizar(a.nome) === nome && (!uf || a.uf === uf))
      if (achadas.length > 1) throw new Error(`tympan-print Mapa: destaque "${q}" é ambíguo (${achadas.map((a) => `${a.nome}/${a.uf}`).join(', ')}); use "Nome/UF" ou o código IBGE`)
    }
    if (!achadas.length) throw new Error(`tympan-print Mapa: destaque "${q}" não encontrado no map`)
    out.push(...achadas)
  }
  return out
}

// ---------------------------------------------------------------------------
// Inks: how a class prints in each style
// ---------------------------------------------------------------------------

type Modo = 'chapado' | 'hachura' | 'pontos'

interface Tinta {
  /** CSS fill of class k (or of SEM_DADO). */
  fill(k: number): string
  defs: ReactNode
}

/** Position of class k: t in [0, 1] and, for diverging scales, its side. */
function posicao(k: number, n: number, escala: 'sequencial' | 'divergente'): { t: number; lado: -1 | 0 | 1 } {
  if (n <= 1) return { t: 1, lado: 1 }
  if (escala === 'sequencial') return { t: k / (n - 1), lado: 1 }
  const meio = (n - 1) / 2
  const d = (k - meio) / meio
  return { t: Math.abs(d), lado: d < 0 ? -1 : d > 0 ? 1 : 0 }
}

function tintas(id: string, modo: Modo, n: number, escala: 'sequencial' | 'divergente', pb: boolean, grossa: boolean): Tinta {
  const cor = (lado: number) => (pb ? 'var(--ty-print-tinta)' : lado < 0 ? 'var(--ty-print-destaque-2)' : 'var(--ty-print-destaque)')
  const papel = 'var(--ty-print-papel)'
  const padroes: ReactNode[] = []
  const fills: string[] = []
  for (let k = 0; k < n; k++) {
    const { t, lado } = posicao(k, n, escala)
    const c = cor(lado)
    if (modo === 'chapado') {
      const pct = escala === 'divergente' ? 8 + (lado < 0 ? 62 : 84) * t : 14 + 86 * t
      fills.push(`color-mix(in oklab, ${c} ${Math.round(pct)}%, ${papel})`)
      continue
    }
    const pid = `${id}-k${k}`
    fills.push(`url(#${pid})`)
    if (modo === 'pontos') {
      const e = 1.05
      const r = r3(0.1 + 0.36 * t)
      padroes.push(
        <pattern key={pid} id={pid} width={e} height={e} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <rect width={e} height={e} style={{ fill: papel }} />
          <circle cx={e / 2} cy={e / 2} r={r} style={lado < 0 && pb ? { fill: 'none', stroke: c, strokeWidth: 0.12 } : { fill: c }} />
        </pattern>,
      )
      continue
    }
    // Hatch: denser and heavier with the class; crossed on the upper classes;
    // the last one solid. Diverging sides lean opposite ways (/ and \).
    if (t >= 0.999 && n >= 4 && escala === 'sequencial') {
      padroes.push(
        <pattern key={pid} id={pid} width={1} height={1} patternUnits="userSpaceOnUse">
          <rect width={1} height={1} style={{ fill: c }} />
        </pattern>,
      )
      continue
    }
    // Ink coverage steps of about 6, 15, 30 and 55 % before solid, so
    // neighbouring classes stay apart in black and white.
    const degrau = t < 0.15 ? 0 : t < 0.4 ? 1 : t < 0.65 ? 2 : 3
    const e = [1.6, 1.05, 0.8, 0.8][degrau] as number
    const w = r3(([0.09, 0.16, 0.24, 0.26][degrau] as number) * (grossa ? 1.3 : 1))
    const cruz = degrau === 3
    const giro = lado < 0 ? -45 : 45
    padroes.push(
      <pattern key={pid} id={pid} width={e} height={e} patternUnits="userSpaceOnUse" patternTransform={`rotate(${giro})`}>
        <rect width={e} height={e} style={{ fill: papel }} />
        {lado === 0 ? null : <line x1={0} y1={0} x2={0} y2={e} style={{ stroke: c, strokeWidth: w }} />}
        {cruz ? <line x1={0} y1={e / 2} x2={e} y2={e / 2} style={{ stroke: c, strokeWidth: w }} /> : null}
        {lado === 0 ? <circle cx={e / 2} cy={e / 2} r={0.12} style={{ fill: c }} /> : null}
      </pattern>,
    )
  }
  // "No data": fine horizontal dashes in the context grey, unlike any class.
  const sd = `${id}-sd`
  padroes.push(
    <pattern key={sd} id={sd} width={1.2} height={0.7} patternUnits="userSpaceOnUse">
      <rect width={1.2} height={0.7} style={{ fill: papel }} />
      <line x1={0.1} y1={0.35} x2={0.75} y2={0.35} style={{ stroke: 'var(--ty-print-contexto)', strokeWidth: 0.14 }} />
    </pattern>,
  )
  return {
    fill: (k) => (k === SEM_DADO ? `url(#${sd})` : k === SEM_SERIE ? papel : (fills[k] ?? papel)),
    defs: padroes,
  }
}

function modoDe(nome: RenderizadorGrafico, pb: boolean): Modo {
  if (nome === 'pontos') return 'pontos'
  if (pb || nome === 'gravura') return 'hachura'
  return 'chapado'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Areas grouped by class, classes in ascending order (no data first). */
function porClasse(areas: AreaPosta[], ks: number[]): Array<[number, AreaPosta[]]> {
  const m = new Map<number, AreaPosta[]>()
  areas.forEach((a, i) => {
    const k = ks[i] as number
    const l = m.get(k)
    if (l) l.push(a)
    else m.set(k, [a])
  })
  return [...m.entries()].sort((x, y) => x[0] - y[0])
}

/** One map drawn in a cell: its areas with classes, borders, labels and highlights. */
interface Celula {
  chave: string
  titulo?: string
  g: Geometria
  ks: number[]
  alvo: AreaPosta[]
  x: number
  y: number
}

/**
 * Choropleth map of Brazil on the IBGE 2022 mesh (Albers equal-area conic,
 * parallels −2° and −22°, meridian −54°). Classes print as flat colour, as
 * hatches in black and white (or in the `gravura` renderer), or as dot
 * screens (`pontos`); areas without data carry their own texture. With
 * `multiplos`, a grid of small maps with shared classes and one legend.
 */
export function Mapa({
  titulo,
  alt,
  nivel = 'municipio',
  valores,
  classes,
  limites,
  unidade,
  escala = 'sequencial',
  destaques,
  recorte,
  exemplo = false,
  legenda,
  semDado = 'sem dado',
  rotulos,
  comoLer,
  naoMostra,
  tabela,
  renderizador,
  largura: larguraProp,
  altura,
  multiplos,
  colunas,
  sangria = false,
  className,
}: MapaProps) {
  const { estilo, pb } = usePrint()
  const disponivel = useLarguraDisponivel()
  const id = useIdSeguro('ty-print-map')
  const W = r3(larguraProp ?? disponivel ?? (sangria ? 150 : 110))
  const nome = renderizador ?? estilo.grafico
  const modo = modoDe(nome, pb)

  // The maps: one, or a grid of small multiples.
  const itens: Array<MapaMultiplo & { chave: string; unico: boolean }> = multiplos?.length
    ? multiplos.map((m, i) => ({ ...m, recorte: m.recorte, exemplo: m.exemplo ?? exemplo, valores: m.valores ?? valores, classes: m.classes ?? classes, chave: `${i}|${m.titulo}`, unico: false }))
    : [{ titulo, recorte, valores, classes, destaques, exemplo, chave: titulo, unico: true }]
  const nCol = Math.max(1, Math.min(itens.length, colunas ?? 3))
  const nLin = Math.ceil(itens.length / nCol)
  const vao = itens.length > 1 ? 3 : 0
  const cabecaCelula = itens.length > 1 ? 4.2 : 0
  const Wc = r3((W - vao * (nCol - 1)) / nCol)
  const Hc = altura ? Math.max(8, (altura - nLin * cabecaCelula - vao * (nLin - 1)) / nLin) : undefined
  const geos = itens.map((it) => geometria(nivel, it.recorte, Wc, Hc))

  // Classes, shared by every map of the figure.
  const vals: number[] = []
  itens.forEach((it, i) => {
    if (it.valores && !it.classes) for (const a of (geos[i] as Geometria).areas) {
      const v = valorDe(it.valores, a, nivel)
      if (typeof v === 'number' && Number.isFinite(v)) vals.push(v)
    }
  })
  const algumValor = itens.some((it) => it.valores && !it.classes)
  const lim = limites ?? (algumValor ? quantis(vals, legenda?.length ?? 5) : undefined)
  const todasClasses = itens.flatMap((it) => (it.classes ? Object.values(it.classes) : [])).filter((v): v is number => typeof v === 'number')
  const n = Math.max(1, legenda?.length ?? (lim ? lim.length + 1 : todasClasses.length ? Math.max(...todasClasses) + 1 : 5))
  const temSerie = itens.some((it) => it.classes || it.valores || it.exemplo)
  const classeArea = (it: MapaMultiplo, g: Geometria, a: AreaPosta): number => {
    if (it.classes) {
      const c = valorDe(it.classes, a, nivel)
      return typeof c === 'number' ? Math.max(0, Math.min(n - 1, Math.round(c))) : SEM_DADO
    }
    if (it.valores) {
      const v = valorDe(it.valores, a, nivel)
      return typeof v === 'number' && Number.isFinite(v) ? Math.min(n - 1, classeDe(v, lim ?? [])) : SEM_DADO
    }
    if (it.exemplo) return classeExemplo(a, g, n, `${titulo}|${it.titulo}`)
    return SEM_SERIE
  }

  // Grid placement: row heights follow the tallest map of the row.
  const celulas: Celula[] = []
  let y = 0
  for (let l = 0; l < nLin; l++) {
    const linha = itens.slice(l * nCol, (l + 1) * nCol)
    const hLinha = Math.max(...linha.map((_, j) => (geos[l * nCol + j] as Geometria).H))
    linha.forEach((it, j) => {
      const g = geos[l * nCol + j] as Geometria
      celulas.push({
        chave: it.chave,
        titulo: it.unico ? undefined : it.titulo,
        g,
        ks: g.areas.map((a) => classeArea(it, g, a)),
        alvo: it.destaques?.length ? resolverDestaques(it.destaques, g.areas, nivel) : [],
        x: r3(j * (Wc + vao) + (Wc - g.W) / 2),
        y: r3(y + cabecaCelula),
      })
    })
    y += cabecaCelula + hLinha + (l < nLin - 1 ? vao : 0)
  }
  const Wt = itens.length > 1 ? W : (celulas[0] as Celula).g.W
  const Ht = r3(y)
  const rotulosClasses = legenda ?? (lim ? rotulosLimites(lim, unidade) : Array.from({ length: n }, (_, k) => `classe ${k + 1}`))
  const conta = (c: Celula, k: number) => c.ks.filter((x) => x === k).length
  const semDadoN = celulas.reduce((t, c) => t + conta(c, SEM_DADO), 0)

  const tinta = tintas(id, modo, n, escala, pb, nome === 'gravura')

  // Borders: crisp, or trembled by rough.js (fixed seed) in hand-made styles.
  const lw = estilo.traco.largura * (itens.length > 1 ? 0.75 : 1)
  const mao = (nome === 'mao' || nome === 'aquarela') && estilo.traco.tremor > 0
  const borda = (d: string, chave: string, classe: string, largura: number) => {
    if (!d) return null
    if (!mao) return <path className={classe} d={d} style={{ strokeWidth: r3(largura) }} />
    const tr = tracar({ k: 'caminho', d }, `${titulo}|${chave}`, {
      roughness: Math.min(0.8, 0.3 + estilo.traco.tremor * 0.3),
      maxRandomnessOffset: 0.25,
      bowing: 0.2,
      strokeWidth: largura,
      disableMultiStroke: true,
      preserveVertices: true,
    })
    return (
      <g className={classe}>
        {tr.map((t, i) => (
          <path key={i} d={t.d} style={{ strokeWidth: r3(largura) }} />
        ))}
      </g>
    )
  }
  const mostrarRotulos = rotulos ?? (nivel === 'uf' && itens.length === 1)
  const unidadeContagem = nivel === 'uf' ? 'UFs' : 'Municípios'

  const desenhar = (c: Celula) => {
    const { g, ks, alvo } = c
    return (
      <g key={c.chave} className="ty-print-map-cell" transform={c.x || c.y ? `translate(${c.x} ${c.y})` : undefined}>
        {/* One filled path per class (the areas' outlines joined): a hatch or dot pattern is painted
            once per class, not once per municipality, which keeps print rasterisers fast. */}
        <g className="ty-print-map-areas" data-areas={g.areas.length}>
          {porClasse(g.areas, ks).map(([k, grupo]) => (
            <path key={k} d={grupo.map((a) => a.d).join('')} data-classe={k} data-codes={grupo.map((a) => a.code).join(' ')} style={{ fill: tinta.fill(k) }} />
          ))}
        </g>
        {g.municipais ? <path className="ty-print-map-municipalities" d={g.municipais} style={{ strokeWidth: c.g.areas.length > 2000 ? 0.05 : 0.08 }} /> : null}
        {borda(g.internas, `${c.chave}|internas`, 'ty-print-map-borders', lw * 0.75)}
        {borda(g.contorno, `${c.chave}|contorno`, 'ty-print-map-outline', lw * 1.25)}
        {mostrarRotulos
          ? g.areas.map((a) => (
              <text key={`r${a.code}`} className="ty-print-map-label" x={a.cx} y={r3(a.cy + 0.8)} textAnchor="middle">
                {nivel === 'uf' ? a.code : a.nome}
              </text>
            ))
          : null}
        {alvo.map((a) => {
          const esquerda = a.cx > g.W * 0.68
          const lx = r3(a.cx + (esquerda ? -3 : 3))
          const ly = r3(a.cy - 2.4)
          return (
            <g key={`d${a.code}`} className="ty-print-map-highlight" data-code={a.code}>
              <path d={a.d} style={{ strokeWidth: r3(lw * 1.8) }} />
              {a.tam < 1.6 ? <circle cx={a.cx} cy={a.cy} r={0.9} style={{ strokeWidth: r3(lw * 1.4) }} /> : null}
              <line x1={a.cx} y1={a.cy} x2={lx} y2={r3(ly + 0.6)} style={{ strokeWidth: r3(lw * 0.8) }} />
              <text x={r3(lx + (esquerda ? -0.4 : 0.4))} y={ly} textAnchor={esquerda ? 'end' : 'start'}>
                {nivel === 'uf' ? a.nome : `${a.nome}/${a.uf}`}
              </text>
            </g>
          )
        })}
      </g>
    )
  }

  return (
    <figure
      className={cx('ty-print-map', className)}
      data-nivel={nivel}
      data-renderizador={nome}
      data-modo={modo}
      data-multiplos={itens.length > 1 ? itens.length : undefined}
      data-sangria={sangria ? '' : undefined}
      data-exemplo={exemplo || itens.some((it) => it.exemplo) ? '' : undefined}
    >
      <figcaption className="ty-print-figure-head">
        <span className="ty-print-figure-title">{comColchetes(titulo)}</span>
      </figcaption>
      <svg className="ty-print-map-svg" viewBox={`0 0 ${Wt} ${Ht}`} role="img" aria-label={alt} style={{ maxInlineSize: `${Wt}mm`, aspectRatio: `${Wt} / ${Ht}` }}>
        <defs>{tinta.defs}</defs>
        {celulas.map((c, i) => (
          <g key={c.chave}>
            {c.titulo ? (
              <text className="ty-print-map-title-cell" x={r3((i % nCol) * (Wc + vao))} y={r3(c.y - 1.4)}>
                {c.titulo.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim()}
              </text>
            ) : null}
            {desenhar(c)}
          </g>
        ))}
      </svg>
      {temSerie ? (
        <ul className="ty-print-map-legend" data-escala={escala}>
          {rotulosClasses.map((l, k) => (
            <li key={k}>
              <svg viewBox="0 0 6 6" aria-hidden="true" focusable="false">
                <rect width={6} height={6} className="ty-print-map-sample" style={{ fill: tinta.fill(k) }} />
              </svg>
              {comColchetes(l)}
            </li>
          ))}
          {semDadoN > 0 ? (
            <li>
              <svg viewBox="0 0 6 6" aria-hidden="true" focusable="false">
                <rect width={6} height={6} className="ty-print-map-sample" style={{ fill: tinta.fill(SEM_DADO) }} />
              </svg>
              {semDado}
            </li>
          ) : null}
        </ul>
      ) : null}
      {comoLer ? (
        <p className="ty-print-map-note">
          <span className="ty-print-margin-title">Como ler</span> {comColchetes(comoLer)}
        </p>
      ) : null}
      {naoMostra ? (
        <p className="ty-print-map-note">
          <span className="ty-print-margin-title">O que o map não mostra</span> {comColchetes(naoMostra)}
        </p>
      ) : null}
      {exemplo || itens.some((it) => it.exemplo) ? <p className="ty-print-badge-example">Dados de exemplo</p> : null}
      {tabela ? (
        <TabelaDados {...tabela} />
      ) : temSerie ? (
        <div className="ty-print-sr">
          <TabelaDados
            titulo={`Dados: ${titulo}`}
            colunas={['Classe', ...(celulas.length > 1 ? celulas.map((c) => `${unidadeContagem}: ${c.titulo ?? ''}`) : [unidadeContagem])]}
            linhas={[
              ...rotulosClasses.map((l, k) => [l, ...celulas.map((c) => conta(c, k))]),
              ...(semDadoN ? [[semDado, ...celulas.map((c) => conta(c, SEM_DADO))]] : []),
            ]}
            nota={exemplo || itens.some((it) => it.exemplo) ? 'Dados de exemplo.' : undefined}
          />
          {celulas.some((c) => c.alvo.length) ? (
            <TabelaDados
              titulo="Em destaque"
              colunas={[nivel === 'uf' ? 'UF' : 'Município', 'Classe']}
              linhas={celulas.flatMap((c) =>
                c.alvo.map((a) => {
                  const k = c.ks[c.g.areas.indexOf(a)] as number
                  return [nivel === 'uf' ? a.nome : `${a.nome}/${a.uf}`, k >= 0 ? (rotulosClasses[k] ?? '') : semDado]
                }),
              )}
            />
          ) : null}
        </div>
      ) : null}
    </figure>
  )
}
