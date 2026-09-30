// Brazil's meshes (IBGE Malha Municipal 2022, simplified by
// scripts/gerar-malhas.mjs) and the projection. Everything here is a pure
// function of the data: d3-geo projects and writes path strings, React owns
// the SVG. No DOM, no randomness, so it renders the same on the server.
import { geoConicEqualArea, geoPath, type GeoProjection } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Feature, FeatureCollection, MultiLineString, MultiPolygon, Polygon } from 'geojson'
import municipiosTopo from './dados/municipios.topo.json'
import ufsTopo from './dados/ufs.topo.json'

export type NivelMapa = 'uf' | 'municipio'

export interface PropsMunicipio {
  /** 7-digit IBGE code. */
  code: string
  name: string
}

export interface PropsUf {
  /** Two-letter abbreviation (SP). */
  code: string
  /** 2-digit IBGE code (35). */
  ibge: string
  name: string
}

export type Area<P> = Feature<Polygon | MultiPolygon, P>

type TopoMun = Topology<{ municipios: GeometryCollection<PropsMunicipio> }>
type TopoUf = Topology<{ ufs: GeometryCollection<PropsUf> }>

const topoMun = municipiosTopo as unknown as TopoMun
const topoUf = ufsTopo as unknown as TopoUf

/** Albers equal-area conic as the IBGE uses it for Brazil: standard parallels −2° and −22°, central meridian −54°, latitude of origin −12°. */
export const ALBERS_BRASIL = { paralelos: [-2, -22] as [number, number], meridiano: -54, latitudeOrigem: -12 }

export const REGIOES = {
  Norte: '1',
  Nordeste: '2',
  Sudeste: '3',
  Sul: '4',
  'Centro-Oeste': '5',
} as const
export type Regiao = keyof typeof REGIOES

/** First digit of the IBGE code of each UF: its macro-region. */
export const UF_IBGE: Record<string, string> = {
  RO: '11', AC: '12', AM: '13', RR: '14', PA: '15', AP: '16', TO: '17',
  MA: '21', PI: '22', CE: '23', RN: '24', PB: '25', PE: '26', AL: '27', SE: '28', BA: '29',
  MG: '31', ES: '32', RJ: '33', SP: '35',
  PR: '41', SC: '42', RS: '43',
  MS: '50', MT: '51', GO: '52', DF: '53',
}
const UF_POR_IBGE: Record<string, string> = Object.fromEntries(Object.entries(UF_IBGE).map(([s, c]) => [c, s]))

/** UF abbreviation of a municipality code (3550308 → SP). */
export const ufDoMunicipio = (code: string) => UF_POR_IBGE[code.slice(0, 2)] ?? ''

let cacheMun: Area<PropsMunicipio>[] | null = null
let cacheUf: Area<PropsUf>[] | null = null

/** The 5,570 municipalities (lagoons excluded), in IBGE code order. */
export function municipios(): Area<PropsMunicipio>[] {
  cacheMun ??= (feature(topoMun, topoMun.objects.municipios) as FeatureCollection<Polygon | MultiPolygon, PropsMunicipio>).features
  return cacheMun
}

/** The 27 federative units, dissolved from the same simplified municipal arcs. */
export function ufs(): Area<PropsUf>[] {
  cacheUf ??= (feature(topoUf, topoUf.objects.ufs) as FeatureCollection<Polygon | MultiPolygon, PropsUf>).features
  return cacheUf
}

/** Recorte: a region name, or a list of UF abbreviations. */
export type Recorte = Regiao | string[]

/** UF abbreviations inside a recorte (all 27 without one). */
export function ufsDoRecorte(recorte?: Recorte): Set<string> {
  if (!recorte) return new Set(Object.keys(UF_IBGE))
  if (Array.isArray(recorte)) {
    const fora = recorte.filter((s) => !UF_IBGE[s.toUpperCase()])
    if (fora.length) throw new Error(`tympan-print Mapa: UF desconhecida no recorte: ${fora.join(', ')}`)
    return new Set(recorte.map((s) => s.toUpperCase()))
  }
  const digito = REGIOES[recorte]
  if (!digito) throw new Error(`tympan-print Mapa: recorte desconhecido "${String(recorte)}"`)
  return new Set(Object.entries(UF_IBGE).filter(([, c]) => c.startsWith(digito)).map(([s]) => s))
}

/**
 * The Albers projection fitted to `areas` inside a `largura` × `altura` box
 * (with `margem` on every side). Its scale and translation are the only
 * parameters that depend on the frame.
 */
export function projecaoBrasil(areas: Area<unknown>[], largura: number, altura: number, margem = 0): GeoProjection {
  const fc: FeatureCollection = { type: 'FeatureCollection', features: areas as Feature[] }
  return geoConicEqualArea()
    .parallels(ALBERS_BRASIL.paralelos)
    .rotate([-ALBERS_BRASIL.meridiano, 0])
    .center([0, ALBERS_BRASIL.latitudeOrigem])
    .fitExtent(
      [
        [margem, margem],
        [largura - margem, altura - margem],
      ],
      fc,
    )
}

/** Height a map of `areas` takes at `largura` (the projected aspect ratio), rounded to 0.1. */
export function alturaPara(areas: Area<unknown>[], largura: number): number {
  const p = projecaoBrasil(areas, largura, largura * 4)
  const [[, y0], [, y1]] = geoPath(p).bounds({ type: 'FeatureCollection', features: areas as Feature[] })
  return Math.ceil((y1 - y0) * 10) / 10
}

/** Path writer with 2 decimals (0.01 mm in print). */
export function caminho(p: GeoProjection) {
  return geoPath(p).digits(2)
}

/** Borders between UFs, and Brazil's outline, drawn once each from the municipal arcs (never twice, never offset). */
export function bordas(filtroUf?: Set<string>): { internas: MultiLineString; contorno: MultiLineString } {
  const obj = topoMun.objects.municipios
  const uf = (g: { properties?: unknown }) => ufDoMunicipio((g.properties as PropsMunicipio | undefined)?.code ?? '')
  const dentro = (g: { properties?: unknown }) => !filtroUf || filtroUf.has(uf(g))
  const internas = mesh(topoMun, obj, (a, b) => a !== b && uf(a) !== uf(b) && dentro(a) && dentro(b))
  const contorno = mesh(topoMun, obj, (a, b) => (a === b ? dentro(a) : dentro(a) !== dentro(b)))
  return { internas, contorno }
}

/** Borders between municipalities (for a recorte where they read). */
export function bordasMunicipais(filtroUf?: Set<string>): MultiLineString {
  const obj = topoMun.objects.municipios
  const dentro = (g: { properties?: unknown }) => !filtroUf || filtroUf.has(ufDoMunicipio((g.properties as PropsMunicipio | undefined)?.code ?? ''))
  return mesh(topoMun, obj, (a, b) => a !== b && dentro(a) && dentro(b))
}
