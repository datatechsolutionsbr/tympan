import { describe, expect, it, vi } from 'vitest'
import { contrastRatio, deltaE2000, parseColor } from '../src/color.ts'
import {
  ESTADOS_PROVA,
  PRINT_PRESET_NAMES,
  PRINT_STYLE_ALIASES,
  googleFontsUrl,
  mergePrintStyle,
  printPresets,
  printPresetById,
  printStyleToCss,
  resolvePrintStyle,
  resolvePrintStyleName,
  toGrey,
  type PrintStyle,
} from '../src/print-presets.ts'

/**
 * Brand colours that data colours must stay away from (ΔE2000 >= 10), as in
 * diagramacao/marca-lakebrasil.md §3.5 and gerador/de_marcas.py:
 * - lakebrasil: the eight gradient stops of the iceberg plus the site greens
 *   (#5cc2e8, the light blue as quoted in the brief, is checked too; the SVGs use #5cb8e8);
 * - Datatech Solutions: the badge and DATA gradients (light and dark
 *   background) sampled every 5 %, plus the node tint #e0e7ff.
 */
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
function gradiente(paradas: Array<[number, string]>, n = 20): string[] {
  const out: string[] = []
  for (let k = 0; k <= n; k++) {
    const t = k / n
    for (let j = 0; j < paradas.length - 1; j++) {
      const [p0, c0] = paradas[j]!
      const [p1, c1] = paradas[j + 1]!
      if (p0 <= t && t <= p1) {
        const u = p1 === p0 ? 0 : (t - p0) / (p1 - p0)
        const a = hex(c0)
        const b = hex(c1)
        out.push(`#${a.map((x, i) => Math.round(x + (b[i]! - x) * u).toString(16).padStart(2, '0')).join('')}`)
        break
      }
    }
  }
  return out
}
const LAKEBRASIL = ['#16c47e', '#0a8754', '#ffd566', '#e8b03a', '#5cb8e8', '#5cc2e8', '#2d7eb0', '#2c66a8', '#143962', '#059669', '#34d399', '#10b981']
const DATATECH = [
  ...new Set([
    ...gradiente([[0, '#38bdf8'], [0.4, '#6366f1'], [1, '#a855f7']]),
    ...gradiente([[0, '#38bdf8'], [0.5, '#6366f1'], [1, '#a855f7']]),
    ...gradiente([[0, '#7dd3fc'], [0.5, '#818cf8'], [1, '#c084fc']]),
    '#e0e7ff',
  ]),
]
const LOGO = [...LAKEBRASIL, ...DATATECH]

const presets = Object.values(printPresets) as PrintStyle[]
const HEX = /^#[0-9a-f]{6}$/

function dataColours(s: PrintStyle): Array<[string, string]> {
  return [
    ['destaque', s.cor.destaque],
    ['destaque2', s.cor.destaque2],
    ['contexto', s.cor.contexto],
    ['marcaTexto', s.cor.marcaTexto],
    ...ESTADOS_PROVA.map((e) => [`prova.${e}`, s.cor.prova[e]] as [string, string]),
    // literal black and white adjustments of the style
    ...(['destaque', 'destaque2', 'contexto', 'marcaTexto'] as const).flatMap((k) => (s.pb[k] ? [[`pb.${k}`, s.pb[k]!] as [string, string]] : [])),
    ...ESTADOS_PROVA.flatMap((e) => (s.pb.prova?.[e] ? [[`pb.prova.${e}`, s.pb.prova[e]!] as [string, string]] : [])),
  ]
}

describe('print presets', () => {
  it('has the 39 styles of the contract, keyed by name', () => {
    expect(PRINT_PRESET_NAMES).toEqual([
      'dashboard', 'graficos-1900', 'cartao-postal', 'caderno', 'isotype', 'cordel', 'riso', 'jornal', 'prancheta',
      'prancheta-clara', 'aquarela', 'minimo-de-tinta', 'suico', 'concretismo', 'semanario', 'infografico-ilustrado',
      'diagrama-modernista', 'papel-salmao', 'dados-br', 'fluxo-historico', 'blocos-coloridos', 'construtivismo',
      'bauhaus', 'brutalista', 'divulgacao', 'proporcao-modular', 'sinalizacao', 'pictogramas', 'mapa-de-metro',
      'jornal-1959', 'azulejo-modernista', 'tropicalia', 'atlas-oficial', 'grade-holandesa', 'papel-recortado',
      'pop-art', 'cientifico', 'art-nouveau', 'memphis',
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
    for (const c of s.cor.ornamento ?? []) expect(c, 'ornamento').toMatch(HEX)
    expect((s.cor.ornamento ?? []).length).toBeLessThanOrEqual(4)
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

  it.each(presets.map((s) => [s.name, s] as const))('%s: data colours stay at ΔE2000 >= 10 from the lakebrasil and Datatech marks', (_, s) => {
    const conflitos: string[] = []
    for (const [name, c] of dataColours(s)) {
      for (const logo of LOGO) {
        const d = deltaE2000(parseColor(c), parseColor(logo))
        if (d < 10) conflitos.push(`${name} ${c} vs ${logo}: ΔE ${d.toFixed(1)}`)
      }
    }
    expect(conflitos, `${s.name}: ${conflitos.join('; ')}`).toEqual([])
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

/** Words that must not appear in a style id or label: trademarks, institutions and people's names. */
const NOMES_PROPRIOS = /economist|financial|schiphol|jornal do brasil|ibge|dear data|tufte|holmes|bayer|du ?bois|minard|nightingale|mccandless|corbusier|modulor|aicher|ol[íi]mpic|vignelli|athos|bulc[ãa]o|crouwel|saul|bass|lichtenstein|mucha|sottsass|rog[ée]rio|duarte|amilcar/i

describe('print style names', () => {
  it.each(presets.map((s) => [s.name, s] as const))('%s: id and label are neutral (the tradition is named only in the description)', (_, s) => {
    expect(s.name).not.toMatch(NOMES_PROPRIOS)
    expect(s.label).not.toMatch(NOMES_PROPRIOS)
    expect(s.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('maps every deprecated id to a current style, and resolves it with one development warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      for (const [old, current] of Object.entries(PRINT_STYLE_ALIASES)) {
        expect(PRINT_PRESET_NAMES).not.toContain(old)
        expect(PRINT_PRESET_NAMES).toContain(current)
        expect(resolvePrintStyleName(old)).toBe(current)
        expect(printPresetById(old)).toBe(printPresets[current])
      }
      expect(resolvePrintStyle('economist').name).toBe('semanario')
      expect(resolvePrintStyle('economist')).toEqual(resolvePrintStyle(printPresets.semanario))
      expect(resolvePrintStyle('ft', { pb: true })).toEqual(resolvePrintStyle(printPresets['papel-salmao'], { pb: true }))
      // One warning per deprecated id, however often it is resolved.
      const calls = warn.mock.calls.map((c) => String(c[0]))
      expect(calls.filter((c) => c.includes('"economist"'))).toHaveLength(1)
      expect(calls.length).toBe(Object.keys(PRINT_STYLE_ALIASES).length)
      expect(calls[0]).toMatch(/deprecated/)
    } finally {
      warn.mockRestore()
    }
  })

  it('resolves current names silently and rejects unknown ones', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(resolvePrintStyleName('semanario')).toBe('semanario')
      expect(resolvePrintStyleName('nao-existe')).toBeUndefined()
      expect(resolvePrintStyleName('toString')).toBeUndefined()
      expect(() => printPresetById('nao-existe')).toThrow(/unknown print style/)
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })
})
