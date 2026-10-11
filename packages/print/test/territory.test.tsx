// @vitest-environment node
// Components for one-page-per-territorial-unit books.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MOLDES, Page, Parliament, PrintArea, PrintBook, PrintFlag, PrintLocatorMap, PrintMap, PrintSymbolMap, Spread, layoutHemiciclo, municipios, vizinhanca } from '../src/index.ts'

const html = (el: React.ReactNode, pb = false) => renderToStaticMarkup(<PrintBook estilo="jornal" pb={pb} incluirCss={false} carregarFontes={false}>{el}</PrintBook>)
const BOA_VISTA = '1400100'

describe('vizinhanca', () => {
  it('finds the municipalities that share a border', () => {
    const { vizinhos } = vizinhanca(BOA_VISTA)
    expect(vizinhos.length).toBeGreaterThan(2)
    expect(vizinhos).not.toContain(BOA_VISTA)
    // symmetric
    for (const v of vizinhos) expect(vizinhanca(v).vizinhos).toContain(BOA_VISTA)
    expect(vizinhanca(BOA_VISTA, 2).vizinhos.length).toBeGreaterThan(vizinhos.length)
  })
})

describe('PrintLocatorMap', () => {
  it('draws only the unit and its neighbours, no labels on the mesh, theme inks', () => {
    const h = html(<PrintLocatorMap codigo={BOA_VISTA} alt="Boa Vista e vizinhos" largura={40} />)
    const n = vizinhanca(BOA_VISTA).vizinhos.length + 1
    expect(h).toContain(`data-areas="${n}"`)
    expect(h).toContain('var(--ty-print-destaque)')
    expect(h).toContain('var(--ty-print-contexto)')
    expect(h).not.toContain('ty-print-map-label')
    expect(h).toContain('<title>Boa Vista e vizinhos</title>')
    // Size: far below a whole-mesh map (item: volume per page).
    expect(h.length).toBeLessThan(40_000)
  })
  it('callout: leader line to the margin and the text outside the svg', () => {
    const h = html(<PrintLocatorMap codigo={BOA_VISTA} alt="a" largura={60} chamada={{ texto: 'Capital de RR' }} />)
    const svg = h.slice(h.indexOf('<svg'), h.indexOf('</svg>'))
    const x2 = Number(/<line [^>]*x2="([\d.]+)"/.exec(svg)![1])
    // The leader stops at the text column (the right 38 %), and the text sits in that column, never over the map.
    expect(x2).toBeGreaterThan(30)
    expect(x2).toBeLessThan(60 * 0.62 + 1.5)
    expect(h).toMatch(/class="ty-print-callout-text" style="top:[\d.]+%;inset-inline-end:0;inline-size:3[0-9.]+%/)
    expect(svg).not.toContain('Capital de RR')
    expect(h).toContain('ty-print-callout-text')
  })
})

describe('categorical PrintMap', () => {
  const cats = Object.fromEntries(municipios().filter((f) => f.properties.code.startsWith('14')).map((f, i) => [f.properties.code, ['PL', 'PL', 'PT', 'MDB'][i % 4]!]))
  it('uses the qualitative palette, legend in count order', () => {
    const h = html(<PrintMap titulo="t" alt="a" recorte={['RR']} escala="categorica" categorias={cats} />)
    expect(h).toContain('var(--ty-print-categorica-1)')
    expect(h).toContain('var(--ty-print-categorica-3)')
    expect(h).not.toMatch(/color-mix\(in oklab, var\(--ty-print-destaque\)/)
    expect(h.indexOf('>PL<')).toBeLessThan(h.indexOf('>MDB<'))
  })
  it('P&B: one distinct pattern per category', () => {
    const h = html(<PrintMap titulo="t" alt="a" recorte={['RR']} escala="categorica" categorias={cats} />, true)
    const pats = [...h.matchAll(/<pattern [^>]*id="([^"]+-c\d)"[^>]*>(.*?)<\/pattern>/g)].map((m) => m[0].replace(/id="[^"]+"/, ''))
    expect(pats).toHaveLength(3)
    expect(new Set(pats).size).toBe(3)
  })
  it('refuses more than eight categories', () => {
    const muitas = Object.fromEntries(Object.keys(cats).map((c, i) => [c, `P${i}`]))
    expect(() => html(<PrintMap titulo="t" alt="a" recorte={['RR']} escala="categorica" categorias={muitas} />)).toThrow(/até 8/)
  })
})

describe('PrintSymbolMap', () => {
  it('circle area is proportional to the value; largest drawn first', () => {
    const h = html(<PrintSymbolMap titulo="Votos" alt="a" recorte={['RR']} valores={{ [BOA_VISTA]: 400, '1400050': 100 }} raioMaximo={4} />)
    const r = Object.fromEntries([...h.matchAll(/data-code="(\d+)" cx="[^"]+" cy="[^"]+" r="([\d.]+)"/g)].map((m) => [m[1], Number(m[2])]))
    expect(r[BOA_VISTA]).toBe(4)
    expect(r['1400050']).toBe(2)
    expect(h.indexOf(`data-code="${BOA_VISTA}"`)).toBeLessThan(h.indexOf('data-code="1400050"'))
    // Legend labels side by side, at least 9 mm apart (they used to stack on each other).
    const leg = h.slice(h.indexOf('ty-print-symbols-legend'))
    const xs = [...leg.matchAll(/<text class="ty-print-map-label" x="([\d.]+)"/g)].map((m) => Number(m[1]))
    expect(xs.length).toBeGreaterThan(1)
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(9)
  })
})

describe('Parliament', () => {
  it('lays out exactly the seats and keeps party order', () => {
    expect(layoutHemiciclo(513)).toHaveLength(513)
    expect(layoutHemiciclo(81)).toHaveLength(81)
    const h = html(<Parliament alt="Câmara" bancadas={[{ sigla: 'A', assentos: 300 }, { sigla: 'B', assentos: 213 }]} maioria={257} />)
    expect((h.match(/data-sigla="A"/g) ?? []).length).toBe(300)
    expect((h.match(/data-sigla="B"/g) ?? []).length).toBe(213)
    expect(h).toContain('var(--ty-print-categorica-2)')
    expect(h).toMatch(/>A<\/span> 300/)
    expect(h).toContain('ty-print-parliament-majority')
  })
})

describe('molde unidade-territorial', () => {
  it('six blocks + title, flag and source on both pages', () => {
    const m = MOLDES['unidade-territorial']!
    const areas = (l: typeof m.par) => l.flatMap((x) => x.areas.map(([a]) => a))
    expect(areas(m.par)).toEqual(['titulo', 'bandeira', 'a', 'b', 'c', 'd', 'e', 'f', 'fonte'])
    expect(areas(m.impar)).toEqual(areas(m.par))
    const h = html(
      <Spread numero="6-7" molde="unidade-territorial">
        <Page lado="par">
          <PrintArea nome="titulo">t</PrintArea>
          <PrintArea nome="bandeira"><PrintFlag alt="Bandeira de Boa Vista" /></PrintArea>
          <PrintArea nome="a"><PrintLocatorMap codigo={BOA_VISTA} alt="a" /></PrintArea>
        </Page>
      </Spread>,
    )
    expect(h).toContain('data-molde="unidade-territorial"')
    expect(h).toContain('não consta no acervo')
    expect(h).not.toContain('data-fora-do-molde')
  })
})

describe('accessibility for EPUB: every figure svg has a title', () => {
  it('svg[role=img] carries <title> as first child in the gallery spreads', async () => {
    const { DuplaEstudo } = await import('../gallery/src/study.tsx')
    const { DuplaMapas } = await import('../gallery/src/maps.tsx')
    for (const el of [<DuplaEstudo key="e" grafico="halteres" />, <DuplaMapas key="m" />]) {
      const h = html(el)
      const svgs = [...h.matchAll(/<svg[^>]*role="img"[^>]*>(<[a-z]+)/g)]
      expect(svgs.length).toBeGreaterThan(0)
      for (const m of svgs) expect(m[1]).toBe('<title')
    }
  })
})

describe('Parliament geometry', () => {
  for (const n of [3, 8, 81, 513]) {
    it(`${n} seats: every dot inside the viewBox, legible radius, centred`, () => {
      const h = html(<Parliament alt="c" bancadas={[{ sigla: 'A', assentos: Math.ceil(n / 2) }, { sigla: 'B', assentos: Math.floor(n / 2) }]} largura={80} />)
      const [, W, H] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(h)!.map(Number)
      const dots = [...h.matchAll(/data-sigla="[AB]" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map((m) => m.slice(1).map(Number) as [number, number, number])
      expect(dots).toHaveLength(n)
      for (const [x, y, r] of dots) {
        expect(x - r).toBeGreaterThanOrEqual(0)
        expect(x + r).toBeLessThanOrEqual(W! + 1e-6)
        expect(y - r).toBeGreaterThanOrEqual(0)
        expect(y + r).toBeLessThanOrEqual(H! + 1e-6)
        expect(r).toBeLessThanOrEqual(1.6)
      }
      const xs = dots.map((d) => d[0])
      expect(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - W! / 2)).toBeLessThan(0.05)
    })
  }
})

describe('PrintSymbolMap legend and context contrast', () => {
  it('legend circles live in the map drawing and use the same radius function', () => {
    const h = html(<PrintSymbolMap titulo="V" alt="a" recorte={['RR']} valores={{ [BOA_VISTA]: 400, '1400050': 100 }} referencias={[400, 100]} raioMaximo={4} />)
    expect((h.match(/<svg/g) ?? []).length).toBe(1) // one drawing: the legend is inside it
    const leg = h.slice(h.indexOf('<g class="ty-print-symbols-legend"'))
    const rs = [...leg.matchAll(/<circle [^>]*r="([\d.]+)"/g)].map((m) => Number(m[1]))
    expect(rs).toEqual([4, 2]) // same as the map's 400 → 4 mm, 100 → 2 mm
  })
  it('context grey reaches 1.5:1 (areas) and 3:1 (strokes) on the paper', async () => {
    const { contrastRatio, parseColor, printStyleVariables, resolvePrintStyle } = await import('@datatechsolutions/tympan-tokens')
    const s = resolvePrintStyle('jornal', { overrides: { cor: { papel: '#f4ecd8', contexto: '#efe7d4' } } })
    const v = Object.fromEntries(printStyleVariables(s))
    expect(contrastRatio(parseColor(v['--ty-print-contexto-area']!), parseColor('#f4ecd8'))).toBeGreaterThanOrEqual(1.5)
    expect(contrastRatio(parseColor(v['--ty-print-contexto-traco']!), parseColor('#f4ecd8'))).toBeGreaterThanOrEqual(3)
    const loc = html(<PrintLocatorMap codigo={BOA_VISTA} alt="a" />)
    expect(loc).toContain('var(--ty-print-contexto-area')
  })
})

describe('P&B for book-supplied images and the locator panel', () => {
  it('greys flags and images and takes the locator panel fill from the ink', async () => {
    const { PRINT_CSS } = await import('../src/index.ts')
    expect(PRINT_CSS).toMatch(/\[data-ty-print-pb\] :is\(img, svg image\) \{\s*filter: grayscale\(1\)/)
    expect(PRINT_CSS).toMatch(/\[data-ty-print-pb\] \.ty-print-panel\[data-variante='bolso'\][^{]*\{\s*background: color-mix\(in srgb, var\(--ty-print-tinta\) 7%/)
    const h = html(<PrintFlag src="data:image/png;base64,AA==" alt="Bandeira" />, true)
    expect(h).toContain('data-ty-print-pb=""')
    expect(h).toContain('class="ty-print-flag"')
  })
})
