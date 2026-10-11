// @vitest-environment node
// Colours by category key (official party colours): near-identical colours get a hatch, text over a colour
// is AA, very light colours get an outline, P&B is tone + hatch + label.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { contrastRatio, parseColor, printPresets } from '@datatechsolutions/tympan-tokens'
import { coresCategorias } from '../src/chart/categoryColours.ts'
import { MethodChart, Parliament, PrintBook, PrintMap, municipios } from '../src/index.ts'
const MethodChartImport = ({ spec }: { spec: object }) => <MethodChart spec={spec as never} alt="a" />

const AZUIS = { PSDB: '#0080c0', PODE: '#0a85c4', NOVO: '#0b7fbd' } // three near blues

describe('coresCategorias', () => {
  it('three near blues: the 2nd and 3rd get distinct hatches; text AA; light colour outlined', () => {
    const c = coresCategorias(['PSDB', 'PODE', 'NOVO', 'X'], printPresets.jornal, false, { ...AZUIS, X: '#fdfbf0' })
    expect(c[0]!.hachura).toBeNull()
    expect(c[1]!.hachura).not.toBeNull()
    expect(c[2]!.hachura).not.toBeNull()
    expect(c[1]!.hachura).not.toBe(c[2]!.hachura)
    expect(c[1]!.parecidaCom).toBe('PSDB')
    for (const x of c.slice(0, 3)) expect(contrastRatio(parseColor(x.texto), parseColor(x.cor))).toBeGreaterThanOrEqual(4.5)
    expect(c[3]!.contorno).toBe(true)
    expect(c[3]!.texto).toBe('#000000')
  })
  it('theme cor.categorias is used when the book passes no colours; P&B: grey tone and a hatch for each', () => {
    const estilo = { cor: { ...printPresets.jornal.cor, categorias: { PT: '#c4122d' } } }
    expect(coresCategorias(['PT'], estilo, false)[0]!.cor).toBe('#c4122d')
    const pb = coresCategorias(['PT', 'PL'], estilo, true, { PL: '#1a3a8a' })
    expect(pb[0]!.cor).toMatch(/^#([0-9a-f]{2})\1\1$/)
    expect(pb.map((x) => x.hachura)).toEqual([0, 1])
  })
})

describe('components with official colours', () => {
  const rr = municipios().filter((f) => f.properties.code.startsWith('14'))
  const categorias = Object.fromEntries(rr.map((f, i) => [f.properties.code, ['PSDB', 'PODE', 'NOVO'][i % 3]!]))
  const html = (el: React.ReactNode) => renderToStaticMarkup(<PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}>{el}</PrintBook>)
  it('categorical map: official fill for the first blue, hatch patterns over the other two', () => {
    const h = html(<PrintMap titulo="t" alt="a" recorte={['RR']} escala="categorica" categorias={categorias} cores={AZUIS} ordemCategorias={["PSDB", "PODE", "NOVO"]} />)
    expect(h).toMatch(/fill:#0080c0/)
    const pats = [...h.matchAll(/<pattern [^>]*id="[^"]+-c(\d)"[^>]*>\s*<rect[^>]*fill:(#[0-9a-f]{6})/g)].map((m) => m[2])
    expect(pats.sort()).toEqual(['#0a85c4', '#0b7fbd'])
  })
  it('parliament: party chips with AA text, near colours as rings', () => {
    const h = html(<Parliament alt="c" bancadas={[{ sigla: 'PSDB', assentos: 10 }, { sigla: 'PODE', assentos: 8 }, { sigla: 'PT', assentos: 12 }]} cores={{ ...AZUIS, PT: '#c4122d' }} />)
    expect(h).toContain('class="ty-print-category-chip" style="background:#c4122d;color:#ffffff"')
    expect(h).toMatch(/data-sigla="PODE"[^>]*fill:var\(--ty-print-papel\);stroke:#0a85c4/)
    expect(h).toMatch(/data-sigla="PSDB"[^>]*fill:#0080c0/)
  })
})

describe('bars with colours by key', () => {
  it('single-series bars take the official colours; near blues get a hatch overlay; light colour outlined', () => {
    const spec = { tipo: 'barras', titulo: 'Votos', escala: [0, 100], barras: [{ rotulo: 'PSDB', valor: 40 }, { rotulo: 'PODE', valor: 30 }, { rotulo: 'NOVO', valor: 20 }, { rotulo: 'X', valor: 10 }], cores: { ...AZUIS, X: '#fdfbf0' } }
    const h = renderToStaticMarkup(<PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}><MethodChartImport spec={spec} /></PrintBook>)
    expect(h).toMatch(/data-categoria="PSDB"[^>]*>.*?fill:#0080c0/)
    expect((h.match(/class="ty-print-bar-key"/g) ?? []).length).toBe(3) // PODE, NOVO hatched; X outlined
  })
})

describe('legend switches', () => {
  it('Parliament legenda={false} and PrintMap mostrarLegenda={false} drop the legend; bars with cores get one', () => {
    const html = (el: React.ReactNode) => renderToStaticMarkup(<PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}>{el}</PrintBook>)
    expect(html(<Parliament alt="c" bancadas={[{ sigla: 'A', assentos: 3 }]} legenda={false} />)).not.toContain('ty-print-map-legend')
    expect(html(<PrintMap titulo="t" alt="a" recorte={['RR']} exemplo mostrarLegenda={false} />)).not.toContain('ty-print-map-legend')
    const spec = { tipo: 'barras', titulo: 'V', escala: [0, 100], barras: [{ rotulo: 'PSDB', valor: 40 }], cores: AZUIS }
    expect(html(<MethodChartImport spec={spec} />)).toContain('data-legenda-cores=""')
  })
})

describe('categorical legend: counts, icons; section heading; optional title', () => {
  it('prints "N mun." and the monogram by key; a section heading above; no figure title when omitted', () => {
    const html = (el: React.ReactNode) => renderToStaticMarkup(<PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}>{el}</PrintBook>)
    const rr = municipios().filter((f) => f.properties.code.startsWith('14'))
    const cats = Object.fromEntries(rr.map((f, i) => [f.properties.code, i < 8 ? 'PL' : 'PT']))
    const h = html(<PrintMap alt="Partido mais votado" secao="Partido mais votado" recorte={['RR']} escala="categorica" categorias={cats} contagemLegenda icones={{ PL: <b>PL</b> }} />)
    expect(h).toContain('>8 mun.<')
    expect(h).toContain('>7 mun.<')
    expect(h).toContain('<span class="ty-print-map-legend-icon"><b>PL</b></span>')
    expect(h).toContain('<h2 class="ty-print-map-section ty-print-title">Partido mais votado</h2>')
    expect(h).not.toContain('ty-print-figure-head')
  })
  it('P&B grayscale filter only on raster images, never on text', async () => {
    const { PRINT_CSS } = await import('../src/index.ts')
    const regras = [...PRINT_CSS.matchAll(/([^{}]+)\{[^}]*filter: grayscale\(1\)/g)].map((m) => m[1]!.trim())
    expect(regras.length).toBeGreaterThan(0)
    for (const r of regras) expect(r, r).not.toMatch(/ty-print-flag(?!\w)|\.ty-print-panel(?! image)|svg(?! image)/)
  })
})

describe('compact bars', () => {
  it('no axis, value with unit and fixed decimals at the tip, fixed height per bar', () => {
    const spec = { tipo: 'barras', titulo: 'V', escala: [0, 40], unidade: '%', casas: 1, compacto: true, alturaBarra: 3, barras: [{ rotulo: 'PL', valor: 36 }, { rotulo: 'PT', valor: 21.45 }], cores: { PL: '#1a3a8a', PT: '#c4122d' } }
    const h = renderToStaticMarkup(<PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}><MethodChartImport spec={spec} /></PrintBook>)
    expect(h).toContain('>36,0%<')
    expect(h).toContain('>21,5%<')
    expect(h).not.toContain('ty-print-g-axis')
    expect(h).toMatch(/viewBox="0 0 [\d.]+ 6\.4"/) // 2 bars × 3 mm + 0.4
    expect(h).toMatch(/data-categoria="PL"[^>]*>.*?fill:#1a3a8a/)
  })
})
