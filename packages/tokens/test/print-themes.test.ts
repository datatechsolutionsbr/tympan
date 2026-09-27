import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  contrastRatio,
  fontStackToCss,
  generatePrintThemesCss,
  googleFontsUrl,
  legibleOn,
  parseColor,
  parseFontStack,
  PRINT_PRESET_NAMES,
  PRINT_THEME_PREFIX,
  printPresets,
  printStyleAccent,
  printStyleToTheme,
  printThemeFontUrls,
  printThemePresets,
  resolveTheme,
  rgbToOklch,
  themeToDtcg,
  themeVariables,
  toCss,
  type Mode,
  type PrintStyle,
} from '../src/index.ts'

const styles = Object.values(printPresets) as PrintStyle[]
const themeOf = (s: PrintStyle) => printThemePresets.find((t) => t.name === `${PRINT_THEME_PREFIX}${s.name}`)!
const hex = (c: string) => toCss(parseColor(c))
const darkPaper = (s: PrintStyle) => contrastRatio(parseColor(s.cor.papel), parseColor('#000000')) < 5
const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

describe('print themes', () => {
  it('derives one UI theme per print style, named print-<style>', () => {
    expect(printThemePresets.map((t) => t.name)).toEqual(PRINT_PRESET_NAMES.map((n) => `print-${n}`))
    for (const s of styles) expect(themeOf(s).label).toBe(s.label)
  })

  it.each(styles.map((s) => [s.name, s] as const))('%s keeps paper and ink in its own mode and flips them in the other', (_, s) => {
    const t = themeOf(s)
    const native: Mode = darkPaper(s) ? 'dark' : 'light'
    const other: Mode = native === 'light' ? 'dark' : 'light'
    const n = resolveTheme(t, native).colors
    const o = resolveTheme(t, other).colors
    expect(toCss(n.bg!)).toBe(hex(s.cor.papel))
    expect(toCss(n.ink!)).toBe(hex(s.cor.tinta))
    expect(toCss(o.ink!)).toBe(hex(s.cor.papel))
    // The other mode is a real inversion: its background sits on the opposite side of mid grey.
    const bgL = rgbToOklch(o.bg!).l
    if (other === 'dark') expect(bgL).toBeLessThan(0.3)
    else expect(bgL).toBeGreaterThan(0.9)
  })

  it.each(styles.map((s) => [s.name, s] as const))('%s keeps its accent hue as the brand in both modes', (_, s) => {
    const accent = rgbToOklch(parseColor(printStyleAccent(s)))
    if (accent.c < 0.05) return
    for (const mode of ['light', 'dark'] as const) {
      const brand = rgbToOklch(resolveTheme(themeOf(s), mode).colors.brand!)
      expect(hueGap(brand.h, accent.h), `${s.name} ${mode}`).toBeLessThan(20)
    }
  })

  it.each(styles.map((s) => [s.name, s] as const))('%s uses the style families (display, body; mono only when monospace)', (_, s) => {
    const t = themeOf(s)
    expect(t.fonts?.display).toEqual(parseFontStack(s.fontes.titulo))
    expect(t.fonts?.body).toEqual(parseFontStack(s.fontes.corpo))
    const mono = parseFontStack(s.fontes.mono)
    if (mono.at(-1) === 'monospace') expect(t.fonts?.mono).toEqual(mono)
    else expect(t.fonts?.mono).toBeUndefined()
    // Loaded like the print package does (Google Fonts css2), limited to the families used.
    expect(t.fontsUrl).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?family=/)
    expect(printThemeFontUrls[t.name]).toBe(t.fontsUrl)
    expect(t.fontsUrl!.length).toBeLessThanOrEqual(googleFontsUrl(s)!.length)
    // Every stack ends with a generic family (safe fallback).
    for (const list of Object.values(t.fonts ?? {})) expect(list.at(-1)).toMatch(/^(serif|sans-serif|monospace|cursive)$/)
  })

  it('keeps flat print styles flat and square, and the card and wash styles soft', () => {
    for (const name of ['suico', 'tufte', 'bauhaus', 'economist', 'brutalista'] as const) {
      const t = themeOf(printPresets[name])
      expect(t.glass, name).toBe(false)
      expect(t.cta, name).toBe('solid')
      expect(t.radius, name).toBe(0)
    }
    expect(themeOf(printPresets.suico).elevation).toBe('flat')
    expect(themeOf(printPresets.brutalista).elevation).toBe('offset')
    for (const name of ['dashboard', 'aquarela'] as const) {
      const t = themeOf(printPresets[name])
      expect(t.glass, name).toBe(true)
      expect(t.cta, name).toBe('gradient')
    }
    // Radius follows the print corner radius (mm at 96 dpi).
    expect(themeOf(printPresets.jornal).radius).toBe(Math.round(printPresets.jornal.raio * (96 / 25.4)))
  })

  it('uses the proof-state colours as semantic tones where the style defines them', () => {
    const t = resolveTheme(themeOf(printPresets.jornal), 'light').colors
    expect(toCss(t.danger!)).toBe(hex(printPresets.jornal.cor.prova.refutada))
    const d = resolveTheme(themeOf(printPresets.dashboard), 'light').colors
    expect(toCss(d.success!)).toBe(hex(printPresets.dashboard.cor.prova.sustentada))
  })

  it('flat elevation removes the resting shadows; offset draws a hard ink shadow', () => {
    const flat = resolveTheme(themeOf(printPresets.suico), 'light')
    expect(flat.shadows.sheet.every((l) => l.color.a === 0)).toBe(true)
    const offset = resolveTheme(themeOf(printPresets.brutalista), 'light')
    expect(offset.shadows.sheet[0]).toMatchObject({ x: 3, y: 3, blur: 0 })
  })

  it('moves an accent along lightness only until it reads on the paper', () => {
    const out = legibleOn('#f04e23', '#ffffff')
    expect(contrastRatio(parseColor(out), parseColor('#ffffff'))).toBeGreaterThanOrEqual(4.6)
    expect(hueGap(rgbToOklch(parseColor(out)).h, rgbToOklch(parseColor('#f04e23')).h)).toBeLessThan(10)
    expect(legibleOn('#3a4aa0', '#ffffff')).toBe('#3a4aa0')
  })

  it('accepts a per-style override', () => {
    const t = printStyleToTheme(printPresets.suico, { brand: '#1f3fae', radius: 4, glass: true })
    expect(t.radius).toBe(4)
    expect(t.glass).toBe(true)
    expect(toCss(resolveTheme(t, 'light').colors.brand!)).toBe('#1f3fae')
  })

  it('emits font families as --ty-font-* variables and DTCG fontFamily tokens', () => {
    const r = resolveTheme(themeOf(printPresets.tufte), 'light')
    const vars = new Map(themeVariables(r))
    expect(vars.get('--ty-font-serif')).toBe(fontStackToCss(themeOf(printPresets.tufte).fonts!.display!))
    expect(vars.get('--ty-font-sans')).toBe(fontStackToCss(themeOf(printPresets.tufte).fonts!.body!))
    const tree = themeToDtcg(r) as { fontFamily: Record<string, { $value: string[] }> }
    expect(tree.fontFamily.sans!.$value).toEqual(themeOf(printPresets.tufte).fonts!.body)
  })

  it('builds an opt-in sheet scoped to each theme attribute, without the preference blocks', () => {
    const css = generatePrintThemesCss(printThemePresets.slice(0, 2))
    expect(css.startsWith('@layer tympan.tokens {')).toBe(true)
    expect(css).toContain('[data-ty-theme="print-dashboard"]')
    expect(css).toContain('[data-ty-theme="print-dubois"][data-ty-mode="dark"]')
    expect(css).toContain('@media (prefers-contrast: more)')
    expect(css).not.toContain('forced-colors')
    expect(css).not.toContain(':root')
    expect(css).toContain('--ty-font-serif:')
  })

  const dist = join(__dirname, '..', 'dist')
  it.runIf(existsSync(join(dist, 'print-themes.css')))('keeps the print themes out of the default tokens.css', () => {
    const tokens = readFileSync(join(dist, 'tokens.css'), 'utf8')
    expect(tokens).not.toContain('print-')
    const all = readFileSync(join(dist, 'print-themes.css'), 'utf8')
    for (const t of printThemePresets) expect(all).toContain(`[data-ty-theme="${t.name}"]`)
    expect(existsSync(join(dist, 'print-themes', 'print-suico.css'))).toBe(true)
  })
})
