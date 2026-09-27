import { describe, expect, it } from 'vitest'
import { realcar } from '../src/comum/realce'
import { contraste, hex, lerCor, nivelContraste } from '../src/cores'
import { amostra, descricaoEstilo, familia, filtrarEstilos, temaDoEstilo } from '../src/estilos'
import { alternarFavorito, guardarLocal, lerLocal } from '../src/local'
import { contarExemplos } from '../src/secoes/componentes/catalogo'
import { printPresets, PRINT_PRESET_NAMES } from '../src/tokens'

describe('colours', () => {
  it('parses computed colours and computes WCAG contrast', () => {
    expect(lerCor('rgb(15, 23, 42)')).toEqual([15, 23, 42])
    expect(lerCor('color(srgb 1 1 1)')).toEqual([255, 255, 255])
    expect(lerCor('#fff')).toEqual([255, 255, 255])
    expect(hex([22, 110, 90])).toBe('#166e5a')
    expect(contraste([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5)
    expect(nivelContraste(7.2)).toBe('AAA')
    expect(nivelContraste(4.6)).toBe('AA')
    expect(nivelContraste(3.2)).toBe('AA18')
    expect(nivelContraste(2)).toBe('falha')
  })
})

describe('book styles', () => {
  it('describes a style from its data and never from its referencia', () => {
    for (const id of PRINT_PRESET_NAMES) {
      const s = printPresets[id]
      const d = descricaoEstilo(s)
      expect(d).toContain(s.cor.papel)
      expect(d).not.toContain(s.referencia)
      expect(d).not.toMatch(/inspirado/i)
    }
    expect(familia('"Source Serif 4", Georgia, serif')).toBe('Source Serif 4')
    expect(temaDoEstilo('jornal')).toBe('print-jornal')
    expect(amostra(printPresets.dashboard).destaque).toBe(printPresets.dashboard.cor.destaque2)
  })

  it('searches labels and fonts ignoring accents', () => {
    expect(filtrarEstilos(PRINT_PRESET_NAMES, 'suico')).toContain('suico')
    expect(filtrarEstilos(PRINT_PRESET_NAMES, '')).toHaveLength(PRINT_PRESET_NAMES.length)
  })
})

describe('storage and favourites', () => {
  it('toggles favourites in insertion order', () => {
    expect(alternarFavorito(['a'], 'b')).toEqual(['a', 'b'])
    expect(alternarFavorito(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('round-trips values and survives broken storage', () => {
    guardarLocal('teste', { x: 1 })
    expect(lerLocal('teste', null)).toEqual({ x: 1 })
    localStorage.setItem('ty-site:quebrado', '{')
    expect(lerLocal('quebrado', 'padrão')).toBe('padrão')
  })
})

describe('code and catalogue helpers', () => {
  it('highlights keywords, strings and comments and keeps all the text', () => {
    const src = "import { A } from 'b' // nota\n<Button variant=\"primary\" />"
    const p = realcar(src)
    expect(p.map((x) => x.texto).join('')).toBe(src)
    expect(p.find((x) => x.texto === 'import')?.tipo).toBe('palavra')
    expect(p.find((x) => x.texto === "'b'")?.tipo).toBe('texto')
    expect(p.find((x) => x.texto.startsWith('// '))?.tipo).toBe('comentario')
    expect(p.find((x) => x.texto === 'variant')?.tipo).toBe('atributo')
  })

  it('counts the examples of a gallery page', () => {
    expect(contarExemplos('<Section a /><Section b>x</Section>')).toBe(2)
    expect(contarExemplos(undefined)).toBe(0)
  })
})
