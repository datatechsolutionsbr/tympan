// Book themes: inheritance, registry, JSON and DTCG loading.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  TEMA_EXEMPLO_EDITORA,
  categoricaDoEstilo,
  fontesLocaisCss,
  paginaDoEstilo,
  printPresets,
  printStyleToCss,
  printThemeById,
  printThemeFromDtcg,
  registerPrintTheme,
  registeredPrintThemes,
  unregisterPrintTheme,
} from '../src/index.ts'

const fixture = (n: string) => JSON.parse(readFileSync(join(__dirname, 'fixtures', n), 'utf8'))

afterEach(() => {
  for (const id of registeredPrintThemes()) unregisterPrintTheme(id)
})

describe('book themes', () => {
  it('inherit a preset and override tokens and extras', () => {
    registerPrintTheme(TEMA_EXEMPLO_EDITORA)
    const s = printThemeById('editora-exemplo')
    expect(s.name).toBe('editora-exemplo')
    expect(s.cor.destaque).toBe('#1f4e79')
    expect(s.cor.tinta).toBe(printPresets.semanario.cor.tinta)
    expect(s.estrutura).toEqual(printPresets.semanario.estrutura)
    expect(paginaDoEstilo(s)).toEqual({ largura: 160, altura: 230, sangria: 3, marcasCorte: false })
    expect(printStyleToCss(s)).toContain('--ty-print-pagina-largura: 160mm;')
  })

  it('cascade: a volume theme over a collection theme', () => {
    registerPrintTheme(TEMA_EXEMPLO_EDITORA)
    registerPrintTheme({ id: 'volume-2', base: 'editora-exemplo', cor: { destaque: '#226633' }, marcas: { selo: { src: 'data:,', alt: 'Selo' } } })
    const s = printThemeById('volume-2')
    expect(s.cor.destaque).toBe('#226633')
    expect(s.cor.destaque2).toBe('#b5562b')
    expect(s.pagina?.largura).toBe(160)
    expect(s.marcas?.selo?.alt).toBe('Selo')
  })

  it('rejects unknown bases, cycles and preset ids', () => {
    expect(() => registerPrintTheme({ id: 'x', base: 'nao-existe' })).toThrow()
    expect(() => registerPrintTheme({ id: 'jornal', base: 'semanario' })).toThrow(/collides/)
    expect(() => registerPrintTheme({ id: 'Bad Id', base: 'jornal' })).toThrow(/kebab/)
  })

  it('loads the lakebrasil-editorial DTCG tokens (brand repo format)', () => {
    const t = registerPrintTheme(fixture('lakebrasil-editorial.tokens.json'))
    expect(t.id).toBe('lakebrasil-editorial')
    const s = printThemeById('lakebrasil-editorial')
    expect(s.fontes.titulo.startsWith('"Source Serif 4", ')).toBe(true)
    expect(s.cor.papel).toMatch(/^#[0-9a-f]{6}$/)
    expect(s.label).toContain('lakebrasil')
    expect(s.estrutura.painel).toBeTruthy()
    const pb = registerPrintTheme(fixture('lakebrasil-editorial-pb.tokens.json'))
    expect(printThemeById(pb.id).cor.tinta).toBe('#000000')
  })

  it('reads DTCG colour objects, ordered groups and dimensions', () => {
    const t = printThemeFromDtcg({
      $extensions: { 'dev.tympan.print': { name: 'marca-x', extends: 'jornal' } },
      cor: { destaque: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } }, categorica: { '2': { $type: 'color', $value: '#00ff00' }, '1': { $type: 'color', $value: '#0000ff' } } },
      fontes: { numero: { $type: 'fontFamily', $value: ['IBM Plex Sans', 'sans-serif'] } },
      raio: { $type: 'dimension', $value: { value: 1, unit: 'cm' } },
    })
    expect(t.cor?.destaque).toBe('#ff0000')
    expect(t.cor?.categorica).toEqual(['#0000ff', '#00ff00'])
    expect(t.fontes?.numero).toBe('"IBM Plex Sans", sans-serif')
    expect(t.raio).toBe(10)
  })

  it('data palette: categorical and diverging vars; local fonts as @font-face', () => {
    registerPrintTheme({ id: 'paleta', base: 'jornal', cor: { categorica: ['#111111'], divergente: ['#2166ac', '#e66101'] }, fontesLocais: [{ familia: 'Source Serif 4', src: 'fonts/SourceSerif4.woff2', peso: 600 }] })
    const s = printThemeById('paleta')
    expect(categoricaDoEstilo(s)[0]).toBe('#111111')
    const css = printStyleToCss(s)
    expect(css).toContain('--ty-print-divergente-1: #2166ac;')
    expect(css).toContain('--ty-print-categorica-8:')
    expect(fontesLocaisCss(s)).toContain('font-family: "Source Serif 4"; src: url("fonts/SourceSerif4.woff2") format("woff2"); font-weight: 600;')
  })
})
