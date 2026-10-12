// @vitest-environment node
// 0.5.5: dumbbell value labels near zero, second-series contrast, panel letters with a prime, margin notes row.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { contrastRatio, parseColor, printPresets, PRINT_PRESET_NAMES, resolvePrintStyle } from '@datatechsolutions/tympan-tokens'
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
