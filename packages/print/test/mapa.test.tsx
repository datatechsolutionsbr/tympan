// @vitest-environment node
// The real map: projection, mesh completeness, classing, determinism.
import { geoContains, geoPath } from 'd3-geo'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ALBERS_BRASIL, LivroPrint, Mapa, municipios, projecaoBrasil, quantis, classeDe, ufs, ufsDoRecorte } from '../src/index.ts'

/** Codes drawn in each class: { classe: [codes] } from the per-class paths. */
function desenhados(html: string): Map<number, string[]> {
  const m = new Map<number, string[]>()
  for (const x of html.matchAll(/<path d="M[^"]*" data-classe="(-?\d+)" data-codes="([^"]*)"/g)) m.set(Number(x[1]), x[2]!.split(' '))
  return m
}
/** Every code drawn, across all cells. */
const todos = (html: string) => [...html.matchAll(/<path d="M[^"]*" data-classe="-?\d+" data-codes="([^"]*)"/g)].flatMap((x) => x[1]!.split(' '))

const W = 1000
const H = 1000

/**
 * Albers equal-area conic written out from Snyder (1987, eq. 14-1 to 14-4),
 * with the IBGE origin latitude (−12°), as the independent reference: d3's
 * translate is where the origin (−54°, −12°) lands.
 */
function albersSnyder([lon, lat]: [number, number], k: number, [tx, ty]: [number, number]): [number, number] {
  const rad = Math.PI / 180
  const [f1, f2] = ALBERS_BRASIL.paralelos.map((p) => p * rad) as [number, number]
  const n = (Math.sin(f1) + Math.sin(f2)) / 2
  const C = Math.cos(f1) ** 2 + 2 * n * Math.sin(f1)
  const rho = Math.sqrt(C - 2 * n * Math.sin(lat * rad)) / n
  const rho0 = Math.sqrt(C - 2 * n * Math.sin(ALBERS_BRASIL.latitudeOrigem * rad)) / n
  const theta = n * (lon - ALBERS_BRASIL.meridiano) * rad
  const x = rho * Math.sin(theta)
  const y = rho0 - rho * Math.cos(theta)
  return [tx + k * x, ty - k * y]
}

/** Seats of two capitals (IBGE, sede municipal). */
const SEDES: Record<string, [number, number]> = {
  '3550308': [-46.6333, -23.5505], // São Paulo
  '5300108': [-47.8825, -15.7942], // Brasília
}

describe('mesh', () => {
  it('has the 5,570 municipalities and 27 UFs', () => {
    expect(municipios()).toHaveLength(5570)
    expect(new Set(municipios().map((f) => f.properties.code)).size).toBe(5570)
    expect(municipios().every((f) => /^\d{7}$/.test(f.properties.code))).toBe(true)
    expect(ufs()).toHaveLength(27)
    expect(ufsDoRecorte('Sul')).toEqual(new Set(['PR', 'SC', 'RS']))
  })

  it('rings are wound for d3 (no municipality covers the globe)', () => {
    const proj = projecaoBrasil(municipios(), W, H)
    const path = geoPath(proj)
    for (const f of municipios()) {
      const [[x0, y0], [x1, y1]] = path.bounds(f)
      expect(x1 - x0, f.properties.code).toBeLessThan(W / 2)
      expect(y1 - y0, f.properties.code).toBeLessThan(H / 2)
    }
  })
})

describe('projection', () => {
  const proj = projecaoBrasil(municipios(), W, H)
  const k = proj.scale()
  const t = proj.translate()
  for (const [code, sede] of Object.entries(SEDES)) {
    it(`${code}: the seat projects where the Albers formula puts it (±1 px), inside its municipality`, () => {
      const [ex, ey] = albersSnyder(sede, k, t)
      const [px, py] = proj(sede) as [number, number]
      expect(Math.abs(px - ex)).toBeLessThanOrEqual(1)
      expect(Math.abs(py - ey)).toBeLessThanOrEqual(1)
      const f = municipios().find((m) => m.properties.code === code)!
      expect(geoContains(f, sede)).toBe(true)
      const [[x0, y0], [x1, y1]] = geoPath(proj).bounds(f)
      expect(px).toBeGreaterThanOrEqual(x0 - 1)
      expect(px).toBeLessThanOrEqual(x1 + 1)
      expect(py).toBeGreaterThanOrEqual(y0 - 1)
      expect(py).toBeLessThanOrEqual(y1 + 1)
    })
  }

  it('is conic, not Mercator: meridians converge to the south', () => {
    const a = proj([-60, 0]) as [number, number]
    const b = proj([-50, 0]) as [number, number]
    const c = proj([-60, -30]) as [number, number]
    const d = proj([-50, -30]) as [number, number]
    expect(Math.abs(d[0] - c[0])).toBeLessThan(Math.abs(b[0] - a[0]))
  })
})

describe('classes', () => {
  it('quantiles split evenly and classDe is closed below', () => {
    const q = quantis([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)
    expect(q).toHaveLength(4)
    expect(classeDe(1, q)).toBe(0)
    expect(classeDe(10, q)).toBe(4)
    expect(classeDe(q[1]!, q)).toBe(2)
  })
})

describe('Mapa', () => {
  const html = (el: React.ReactElement, estilo: 'jornal' | 'caderno' | 'cordel' | 'deardata' = 'jornal', pb = false) =>
    renderToStaticMarkup(
      <LivroPrint estilo={estilo} pb={pb}>
        {el}
      </LivroPrint>,
    )

  it('draws every one of the 5,570 municipalities', () => {
    const s = html(<Mapa titulo="t" alt="achado" exemplo largura={120} />)
    expect(todos(s)).toHaveLength(5570)
    expect(new Set(todos(s)).size).toBe(5570)
    expect(todos(s).every((c) => /^\d{7}$/.test(c))).toBe(true)
    expect(s).toContain('role="img"')
    expect(s).toContain('aria-label="achado"')
  })

  it('classes values, marks missing ones "sem dado", and highlights by code and by name', () => {
    const valores = { '3550308': 12, '5300108': 3, '3304557': 7 }
    const s = html(<Mapa titulo="t" alt="a" valores={valores} limites={[5, 10]} destaques={['3550308', 'Brasília/DF']} largura={120} />)
    const d = desenhados(s)
    expect(d.get(2)).toEqual(['3550308'])
    expect(d.get(0)).toEqual(['5300108'])
    expect(d.get(1)).toEqual(['3304557'])
    expect(d.get(-1)).toHaveLength(5567)
    expect(s).toContain('sem dado')
    expect(s).toContain('São Paulo/SP')
    expect(s).toContain('Brasília/DF')
  })

  it('refuses an ambiguous or unknown highlight', () => {
    expect(() => html(<Mapa titulo="t" alt="a" exemplo destaques={['Bom Jesus']} />)).toThrow(/ambíguo/)
    expect(() => html(<Mapa titulo="t" alt="a" exemplo destaques={['Atlântida Perdida']} />)).toThrow(/não encontrado/)
  })

  it('recorte draws only its UFs; uf level draws 27 areas', () => {
    const s = html(<Mapa titulo="t" alt="a" recorte="Sul" exemplo largura={80} />)
    const codes = todos(s)
    expect(codes.length).toBe(1191)
    expect(codes.every((c) => ['41', '42', '43'].includes(c.slice(0, 2)))).toBe(true)
    const u = html(<Mapa titulo="t" alt="a" nivel="uf" valores={{ SP: 645, '31': 853 }} limites={[700]} largura={80} />)
    expect(todos(u)).toHaveLength(27)
    expect(desenhados(u).get(1)).toEqual(['MG'])
  })

  it('fits the height and lays small multiples out in a grid under it', () => {
    const s = html(<Mapa titulo="t" alt="a" exemplo largura={120} altura={60} />)
    const [, w, h] = s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!.map(Number) as [number, number, number]
    expect(h).toBeLessThanOrEqual(60)
    expect(w).toBeLessThan(120)
    const m = html(
      <Mapa titulo="t" alt="a" exemplo largura={120} altura={80} colunas={3} multiplos={['Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste'].map((r) => ({ titulo: r, recorte: r as 'Sul' }))} />,
    )
    const [, mw, mh] = m.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!.map(Number) as [number, number, number]
    expect(mw).toBe(120)
    expect(mh).toBeLessThanOrEqual(80)
    expect(todos(m)).toHaveLength(5570)
    expect(m.match(/class="ty-print-mapa-legenda"/g)).toHaveLength(1)
  })

  it('inks classes by style: flat, hatched in P&B, dotted in pontos', () => {
    expect(html(<Mapa titulo="t" alt="a" exemplo largura={60} nivel="uf" />)).toContain('color-mix(in oklab')
    const pb = html(<Mapa titulo="t" alt="a" exemplo largura={60} nivel="uf" />, 'jornal', true)
    expect(pb).toMatch(/<pattern[^>]*-k0"[^>]*rotate\(45\)/)
    expect(pb).not.toContain('color-mix(in oklab')
    expect(html(<Mapa titulo="t" alt="a" exemplo largura={60} nivel="uf" renderizador="pontos" />)).toMatch(/<pattern[^>]*-k4"[^>]*><rect[^>]*><\/rect><circle/)
  })

  it('is deterministic in every renderer, and never NaN', () => {
    for (const estilo of ['jornal', 'caderno', 'cordel', 'deardata'] as const) {
      for (const pb of [false, true]) {
        const el = <Mapa titulo="t" alt="a" exemplo largura={90} recorte="Nordeste" destaques={['Recife/PE']} />
        const a = html(el, estilo, pb)
        expect(html(el, estilo, pb)).toBe(a)
        expect(a).not.toMatch(/NaN|undefined|Infinity/)
      }
    }
  })
})
