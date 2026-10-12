// @vitest-environment node
// 0.5.5: dumbbell value labels near zero, second-series contrast, panel letters with a prime, margin notes row.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { contrastRatio, parseColor, PRINT_PRESET_NAMES, resolvePrintStyle } from '@datatechsolutions/tympan-tokens'
import { layoutHalteres } from '../src/chart/geometry.ts'
import { MethodChart, PrintBook } from '../src/index.ts'

const halteres = (a: number, extra: object = {}) => ({ tipo: 'halteres' as const, titulo: 'H', escala: [0, 10] as [number, number], rotuloA: 'antes', rotuloB: 'depois', linhas: [{ rotulo: 'Uma linha longa', a, b: 5 }], ...extra })

describe('dumbbell value labels near the start of the axis', () => {
  it('auto: a label that would hit the row labels goes above its point', () => {
    const L = layoutHalteres(halteres(0.1), 100)
    const x0 = L.eixo.x0
    expect(L.linhas[0]!.rotA.ancora).toBe('middle')
    expect(L.linhas[0]!.rotA.dy).toBeLessThan(0)
    const far = layoutHalteres(halteres(4), 100)
    expect(far.linhas[0]!.rotA.ancora).toBe('end')
    expect(far.linhas[0]!.rotA.x).toBeGreaterThan(x0)
    expect(layoutHalteres(halteres(0.1, { rotuloValor: 'fora' }), 100).linhas[0]!.rotA.ancora).toBe('end')
    expect(layoutHalteres(halteres(4, { rotuloValor: 'dentro' }), 100).linhas[0]!.rotA.ancora).toBe('middle')
  })
  it('renders above the point in the chart', () => {
    const h = renderToStaticMarkup(<PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}><MethodChart spec={halteres(0) as never} alt="a" /></PrintBook>)
    expect(h).toMatch(/class="ty-print-g-value-a"[^>]*text-anchor="middle"/)
  })
})

describe('second series: a strong neutral, apart from the first', () => {
  it('series B is tinta-2: AA on the paper in every preset and P&B; series A is hatched when the two are close', async () => {
    const { hachuraSerieA, COR_SERIE } = await import('../src/chart/parts.tsx')
    expect(COR_SERIE.b).toBe('tinta-2')
    for (const n of PRINT_PRESET_NAMES)
      for (const pb of [false, true]) {
        const s = resolvePrintStyle(n, { pb })
        expect(contrastRatio(parseColor(s.cor.tinta2), parseColor(s.cor.papel)), `${n} ${pb}`).toBeGreaterThanOrEqual(4.5)
        const r = contrastRatio(parseColor(s.cor.tinta2), parseColor(s.cor.contexto))
        if (r < 2) expect(hachuraSerieA(s), `${n} ${pb}`).toBe(true)
      }
  })
})

describe('panel letters with a prime', () => {
  it("g' and d′ print the prime glyph in its own span (text stays g′ for readers)", async () => {
    const { Panel } = await import('../src/index.ts')
    for (const estilo of ['dashboard', 'cartao-postal', 'isotype', 'riso']) {
      const h = renderToStaticMarkup(<PrintBook estilo={estilo} incluirCss={false} carregarFontes={false}><Panel letra="g'" titulo="t">x</Panel></PrintBook>)
      expect(h, estilo).toContain('<span class="ty-print-letter" data-primo="">g<span class="ty-print-letter-prime">′</span></span>')
    }
  })
})

describe('MarginNotes', () => {
  it('a row of notes on the six-column grid, spans adding up to six', async () => {
    const { MarginNotes } = await import('../src/index.ts')
    const h = renderToStaticMarkup(<PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}><MarginNotes itens={[{ titulo: 'A', texto: 'a' }, { titulo: 'B', texto: 'b', colunas: 1 }, { titulo: 'C', texto: 'c' }]} /></PrintBook>)
    const spans = [...h.matchAll(/data-colunas="(\d)"/g)].map((m) => Number(m[1]))
    expect(spans).toEqual([2, 1, 3])
    expect(spans.reduce((a, b) => a + b, 0)).toBe(6)
    expect(h).toContain('class="ty-print-margin-notes"')
  })
})
