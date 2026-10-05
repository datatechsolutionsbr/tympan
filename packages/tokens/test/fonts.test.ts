import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CORE_FONT_SPECS,
  SYSTEM_FONT_FAMILIES,
  fontFaceCss,
  parseFontStack,
  presets,
  printPresets,
  printThemeFontSpecs,
  printThemePresets,
  type FontManifest,
} from '../src/index.ts'
import { SCRIPT_RULES } from '../src/scripts.ts'

const root = join(import.meta.dirname, '..')
const manifest = JSON.parse(readFileSync(join(root, 'fonts', 'manifest.json'), 'utf8')) as FontManifest
const typeTokens = JSON.parse(readFileSync(join(root, 'src', 'base', 'type.tokens.json'), 'utf8'))
const system = new Set(SYSTEM_FONT_FAMILIES)
const specFamily = (spec: string) => spec.split(':')[0]!

describe('bundled fonts', () => {
  it('bundles every family named by the base stacks, the script rules and the presets', () => {
    const named = new Set<string>([
      ...Object.values<{ $value: string[] }>(typeTokens.font.family).filter((t) => t && Array.isArray(t.$value)).flatMap((t) => t.$value),
      ...SCRIPT_RULES.flatMap((r) => [...r.sans, ...(r.serif ?? [])]),
      ...presets.flatMap((p) => Object.values(p.fonts ?? {}).flat()),
    ])
    const missing = [...named].filter((f) => !system.has(f) && !manifest.families[f])
    expect(missing).toEqual([])
    // ...and the core sheet declares them.
    const declared = new Set(CORE_FONT_SPECS.map(specFamily))
    expect([...named].filter((f) => manifest.families[f] && !declared.has(f))).toEqual([])
  })

  it('bundles every family of every print theme and declares it in that theme', () => {
    for (const theme of printThemePresets) {
      const declared = new Set((printThemeFontSpecs[theme.name] ?? []).map(specFamily))
      const named = Object.values(theme.fonts ?? {}).flat()
      expect(named.filter((f) => !system.has(f) && !declared.has(f)), theme.name).toEqual([])
      expect(named.filter((f) => !system.has(f) && !manifest.families[f]), theme.name).toEqual([])
    }
    const printFamilies = Object.values(printPresets).flatMap((s) => [s.fontes.titulo, s.fontes.corpo, s.fontes.mono].flatMap(parseFontStack))
    expect(printFamilies.filter((f) => !system.has(f) && !manifest.families[f])).toEqual([])
  })

  it('has the files and a licence of every bundled spec', () => {
    const specs = [...CORE_FONT_SPECS, ...Object.values(printThemeFontSpecs).flat()]
    for (const spec of specs) {
      expect(manifest.specs[spec], spec).toBeDefined()
      for (const id of manifest.specs[spec]!) expect(existsSync(join(root, 'fonts', manifest.faces[id]!.file)), id).toBe(true)
    }
    for (const [family, f] of Object.entries(manifest.families)) {
      expect(f.license, family).toBe('OFL-1.1')
      expect(existsSync(join(root, 'fonts', f.licenseFile)), family).toBe(true)
    }
  })

  it('emits @font-face rules with relative URLs, swap and unicode-range', () => {
    const css = fontFaceCss(manifest, CORE_FONT_SPECS, '../fonts/')
    expect(css).not.toMatch(/https?:/)
    const faces = css.split('@font-face').slice(1)
    expect(faces.length).toBeGreaterThan(100)
    for (const face of faces) {
      expect(face).toContain('font-display: swap;')
      expect(face).toMatch(/src: url\('\.\.\/fonts\/[a-z0-9]+\/[\w-]+\.woff2'\) format\('woff2'\);/)
    }
    // CJK families are sliced, not one huge file.
    expect(css.match(/font-family: 'Noto Sans JP'/g)!.length).toBeGreaterThan(50)
    expect(() => fontFaceCss(manifest, ['Not A Font:wght@400'], '')).toThrow(/not bundled/)
  })
})
