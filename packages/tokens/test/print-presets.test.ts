import { describe, expect, it } from 'vitest'
import { contrastRatio, deltaE2000, parseColor } from '../src/color.ts'
import {
  ESTADOS_PROVA,
  PRINT_PRESET_NAMES,
  googleFontsUrl,
  mergePrintStyle,
  printPresets,
  printStyleToCss,
  resolvePrintStyle,
  toGrey,
  type PrintStyle,
} from '../src/print-presets.ts'

/**
 * The lakebrasil mark (diagramacao/logo/*.svg and marca-lakebrasil.md): the
 * eight gradient stops of the iceberg plus the site greens. #5cc2e8 is the
 * light blue as quoted in the brief; the SVGs use #5cb8e8. Both are checked.
 */
const LOGO = ['#16c47e', '#0a8754', '#ffd566', '#e8b03a', '#5cb8e8', '#5cc2e8', '#2d7eb0', '#2c66a8', '#143962', '#059669', '#34d399', '#10b981']

const presets = Object.values(printPresets) as PrintStyle[]
const HEX = /^#[0-9a-f]{6}$/

function dataColours(s: PrintStyle): Array<[string, string]> {
  return [
    ['destaque', s.cor.destaque],
    ['destaque2', s.cor.destaque2],
    ['contexto', s.cor.contexto],
    ...ESTADOS_PROVA.map((e) => [`prova.${e}`, s.cor.prova[e]] as [string, string]),
  ]
}

describe('print presets', () => {
  it('has the 18 styles of the contract, keyed by name', () => {
    expect(PRINT_PRESET_NAMES).toEqual([
      'dashboard', 'dubois', 'deardata', 'caderno', 'isotype', 'cordel', 'riso', 'jornal', 'prancheta',
      'prancheta-clara', 'aquarela', 'tufte', 'suico', 'concretismo', 'economist', 'holmes', 'bayer', 'ft',
    ])
    for (const [key, s] of Object.entries(printPresets)) expect(s.name).toBe(key)
  })

  it.each(presets.map((s) => [s.name, s] as const))('%s is complete', (_, s) => {
    expect(s.label.length).toBeGreaterThan(2)
    expect(s.referencia.length).toBeGreaterThan(10)
    for (const v of Object.values(s.fontes)) expect(v).toMatch(/\S/)
    for (const k of ['papel', 'tinta', 'tinta2', 'tinta3', 'linha', 'destaque', 'destaque2', 'marcaTexto', 'contexto'] as const) {
      expect(s.cor[k], k).toMatch(HEX)
    }
    for (const e of ESTADOS_PROVA) expect(s.cor.prova[e], e).toMatch(HEX)
    expect(s.papel.intensidade).toBeGreaterThanOrEqual(0)
    expect(s.papel.intensidade).toBeLessThanOrEqual(1)
    expect(s.traco.largura).toBeGreaterThan(0)
    expect(s.traco.tremor).toBeGreaterThanOrEqual(0)
    expect(s.raio).toBeGreaterThanOrEqual(0)
    // Every family named in a stack is either loaded from Google Fonts or a system fallback.
    const loaded = s.googleFonts.map((g) => g.split(':')[0])
    for (const stack of Object.values(s.fontes)) {
      const first = /^"([^"]+)"/.exec(stack)?.[1]
      if (first) expect(loaded, `${s.name}: ${first}`).toContain(first)
    }
    expect(googleFontsUrl(s)).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?family=/)
  })

  it.each(presets.map((s) => [s.name, s] as const))('%s: ink and proof colours meet WCAG AA on the paper', (_, s) => {
    for (const pb of [false, true]) {
      const r = resolvePrintStyle(s, { pb })
      const paper = parseColor(r.cor.papel)
      const check = (name: string, c: string) => {
        const ratio = contrastRatio(parseColor(c), paper)
        expect(ratio, `${s.name}${pb ? ' (P&B)' : ''} ${name} ${c} on ${r.cor.papel}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
      }
      check('tinta', r.cor.tinta)
      check('tinta2', r.cor.tinta2)
      for (const e of ESTADOS_PROVA) check(`prova.${e}`, r.cor.prova[e])
    }
  })

  it.each(presets.map((s) => [s.name, s] as const))('%s: data colours stay at ΔE2000 >= 10 from the lakebrasil logo', (_, s) => {
    for (const [name, c] of dataColours(s)) {
      for (const logo of LOGO) {
        const d = deltaE2000(parseColor(c), parseColor(logo))
        expect(d, `${s.name} ${name} ${c} vs logo ${logo}: ΔE ${d.toFixed(1)}`).toBeGreaterThanOrEqual(10)
      }
    }
  })

  it('CIEDE2000 matches published reference pairs', () => {
    // Identical colours, black against white, and a reference value computed
    // from the Sharma et al. (2005) formula for #ff0000 against #00ff00.
    expect(deltaE2000(parseColor('#336699'), parseColor('#336699'))).toBe(0)
    expect(deltaE2000(parseColor('#000000'), parseColor('#ffffff'))).toBeCloseTo(100, 3)
    expect(deltaE2000(parseColor('#ff0000'), parseColor('#00ff00'))).toBeCloseTo(86.61, 1)
  })

  it('grey conversion keeps the relative luminance (and so every contrast ratio)', () => {
    for (const c of ['#c8431f', '#3d3fa0', '#fff1e5', '#1d4b8f']) {
      const g = toGrey(c)
      expect(g).toMatch(/^#([0-9a-f]{2})\1\1$/)
      expect(contrastRatio(parseColor(g), parseColor(c))).toBeLessThan(1.02)
    }
  })

  it('merges partial overrides without losing the other tokens', () => {
    const s = mergePrintStyle(printPresets.jornal, { cor: { destaque: '#8a1c7c', prova: { refutada: '#7a1111' } }, traco: { tremor: 1 }, fontes: { titulo: '"EB Garamond", serif' } })
    expect(s.cor.destaque).toBe('#8a1c7c')
    expect(s.cor.prova.refutada).toBe('#7a1111')
    expect(s.cor.prova.sustentada).toBe(printPresets.jornal.cor.prova.sustentada)
    expect(s.traco).toEqual({ ...printPresets.jornal.traco, tremor: 1 })
    expect(s.fontes.corpo).toBe(printPresets.jornal.fontes.corpo)
    expect(printStyleToCss(printPresets.jornal, { overrides: { cor: { destaque: '#8a1c7c' } } })).toContain('--ty-print-destaque: #8a1c7c;')
  })

  it('P&B output is grey except for the adjustments of the style', () => {
    const css = printStyleToCss(printPresets.jornal, { pb: true })
    const colours = [...css.matchAll(/: (#[0-9a-f]{6});/g)].map((m) => m[1]!)
    expect(colours.length).toBeGreaterThan(10)
    for (const c of colours) expect(c).toMatch(/^#([0-9a-f]{2})\1\1$/)
  })

  it('generates stable CSS for every preset', () => {
    const all = presets.map((s) => printStyleToCss(s) + printStyleToCss(s, { pb: true, seletor: `[data-ty-print-style="${s.name}"][data-ty-print-pb]` })).join('\n')
    expect(all).toMatchSnapshot()
  })
})
