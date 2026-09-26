import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  apcaContrast,
  contrastRatio,
  fakhirPreset,
  generateRamp,
  generateThemeCss,
  oklchToRgb,
  parseColor,
  presets,
  RAMP_STEPS,
  resolveTheme,
  rgbToOklch,
  themeToDtcg,
  themeVariables,
  toCss,
  type ContrastLevel,
  type Mode,
  type ThemeConfig,
} from '../src/index.ts'

const MODES: Mode[] = ['light', 'dark']

describe('colour math', () => {
  it('round-trips sRGB through OKLCH', () => {
    for (const hex of ['#166e5a', '#0f172a', '#fcfdfd', '#be123c', '#34d399']) {
      const back = oklchToRgb(rgbToOklch(parseColor(hex)))
      expect(toCss(back)).toBe(hex)
    }
  })

  it('computes WCAG ratios for known pairs', () => {
    expect(contrastRatio(parseColor('#000000'), parseColor('#ffffff'))).toBeCloseTo(21, 5)
    expect(contrastRatio(parseColor('#526077'), parseColor('#fcfdfd'))).toBeGreaterThan(4.5)
  })

  it('computes APCA polarity (informational)', () => {
    expect(apcaContrast(parseColor('#000000'), parseColor('#ffffff'))).toBeGreaterThan(100)
    expect(apcaContrast(parseColor('#ffffff'), parseColor('#000000'))).toBeLessThan(-100)
  })
})

describe('ramps', () => {
  it('have 11 steps from light to dark and are deterministic', () => {
    const seed = { hue: 170, chroma: 0.13 }
    const a = generateRamp(seed)
    const b = generateRamp(seed)
    expect(Object.keys(a)).toHaveLength(11)
    expect(a).toEqual(b)
    const lightness = RAMP_STEPS.map((s) => rgbToOklch(a[s]).l)
    for (let i = 1; i < lightness.length; i++) expect(lightness[i]!).toBeLessThan(lightness[i - 1]!)
  })
})

function everyPairPasses(config: ThemeConfig, mode: Mode, contrast?: ContrastLevel) {
  const theme = resolveTheme(config, mode, contrast)
  const failures = theme.report.filter((r) => r.ratio < r.min)
  expect(failures, failures.map((f) => `${f.fg} over ${f.over.join('>')}: ${f.ratio}`).join('\n')).toEqual([])
  for (const r of theme.report) expect(r.min).toBe(r.kind === 'text' ? 4.5 : 3)
  return theme
}

describe('WCAG 2.2 AA in every preset and mode', () => {
  for (const preset of presets) {
    for (const mode of MODES) {
      for (const contrast of new Set<ContrastLevel>([preset.contrast, 'high'])) {
        it(`${preset.name} / ${mode} / ${contrast}: every on-X/X pair meets 4.5:1 text and 3:1 UI`, () => {
          const theme = everyPairPasses(preset, mode, contrast)
          expect(theme.report.length).toBeGreaterThan(60)
        })
      }
    }
  }

  it('checks the focus ring and field border as UI pairs', () => {
    const theme = resolveTheme(fakhirPreset, 'light')
    const kinds = new Set(theme.report.filter((r) => r.fg === 'focus-ring' || r.fg === 'input').map((r) => r.kind))
    expect([...kinds]).toEqual(['ui'])
  })

  it('keeps generated custom themes AA across a hue sweep (customizer safety)', () => {
    for (let hue = 0; hue < 360; hue += 30) {
      for (const glass of [true, false]) {
        const config: ThemeConfig = {
          name: `sweep-${hue}`,
          seeds: {
            brand: { hue, chroma: 0.16 },
            neutral: { hue, chroma: 0.015 },
            danger: { hue: 15, chroma: 0.2 },
            warning: { hue: 70, chroma: 0.15 },
            success: { hue: 150, chroma: 0.16 },
            info: { hue: 250, chroma: 0.07 },
          },
          radius: 12,
          contrast: 'default',
          glass,
          cta: hue % 60 === 0 ? 'gradient' : 'solid',
        }
        for (const mode of MODES) everyPairPasses(config, mode)
      }
    }
  })

  it('reports APCA Lc for every text pair (informational)', () => {
    const report = presets.flatMap((p) => MODES.flatMap((m) => resolveTheme(p, m).report.filter((r) => r.kind === 'text')))
    const weak = report.filter((r) => Math.abs(r.apca) < 45)
    // Not a gate: logged so reviewers can see which pairs APCA would call weak.
    console.info(`APCA: ${report.length} text pairs, ${weak.length} below |Lc| 45 (${[...new Set(weak.map((w) => w.fg))].join(', ')})`)
    expect(report.every((r) => Number.isFinite(r.apca))).toBe(true)
  })
})

describe('fakhir preset honours the design direction (§2.3, §2.4)', () => {
  it('pins the accent, surfaces and ink values', () => {
    const light = new Map(themeVariables(resolveTheme(fakhirPreset, 'light')))
    expect(light.get('--fk-accent')).toBe('#166e5a')
    expect(light.get('--fk-brand')).toBe('#166e5a')
    expect(light.get('--fk-bg')).toBe('#f6f8fa')
    expect(light.get('--fk-surface')).toBe('rgb(252 253 253 / 0.82)')
    expect(light.get('--fk-ink-3')).toBe('#526077')
    expect(light.get('--fk-radius-control')).toBe('10px')
    expect(light.get('--fk-radius-card')).toBe('16px')
    expect(light.get('--fk-radius-sheet')).toBe('24px')
    const dark = new Map(themeVariables(resolveTheme(fakhirPreset, 'dark')))
    expect(dark.get('--fk-accent')).toBe('#34d399')
    expect(dark.get('--fk-bg')).toBe('#0a0f1c')
  })

  it('derives the radius scale from one base', () => {
    const t = resolveTheme({ ...fakhirPreset, radius: 6 }, 'light')
    expect(t.dimensions['radius-card']).toBe(10)
    expect(t.dimensions['radius-sheet']).toBe(14)
  })

  it('switches glass off to opaque surfaces and no blur', () => {
    const t = resolveTheme({ ...fakhirPreset, glass: false, pins: undefined }, 'light')
    expect(t.colors.surface!.a).toBe(1)
    expect(t.dimensions['glass-blur-sheet']).toBe(0)
  })
})

describe('DTCG output', () => {
  it('emits srgb colour objects and px dimensions with css names', () => {
    const tree = themeToDtcg(resolveTheme(fakhirPreset, 'light')) as Record<string, Record<string, { $value: unknown; $extensions: Record<string, { cssName: string }> }>>
    const accent = tree.color!.accent!
    expect(accent.$value).toMatchObject({ colorSpace: 'srgb', hex: '#166e5a' })
    expect(accent.$extensions['app.fakhir']!.cssName).toBe('--fk-accent')
    expect(tree.dimension!['radius-card']!.$value).toEqual({ value: 16, unit: 'px' })
  })
})

describe('stylesheet', () => {
  const css = generateThemeCss({ ...fakhirPreset, name: 'custom' }, { densities: true })

  it('is layered and scoped by theme, mode and density attributes', () => {
    expect(css.startsWith('@layer fakhir.tokens {')).toBe(true)
    expect(css).toContain('[data-fk-theme="custom"]')
    expect(css).toContain('[data-fk-theme="custom"][data-fk-mode="dark"]')
    expect(css).toContain('[data-fk-density="compact"]')
    expect(css).not.toContain(':root:not([data-fk-mode="light"])')
  })

  it('handles contrast, transparency, motion and forced-colour preferences', () => {
    expect(css).toContain('@media (prefers-contrast: more)')
    expect(css).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(css).toContain('@media (forced-colors: active)')
    expect(css).toContain('--fk-focus-ring: Highlight;')
  })

  const built = join(__dirname, '..', 'dist', 'tokens.css')
  it.runIf(existsSync(built))('built tokens.css defines the default theme on :root and follows the OS scheme', () => {
    const text = readFileSync(built, 'utf8')
    expect(text).toMatch(/:root,\n\s*\[data-fk-theme="fakhir"\]/)
    expect(text).toContain(':root:not([data-fk-mode="light"])')
    expect(text).toContain('@media (prefers-reduced-motion: reduce)')
    expect(text).toContain('--fk-dur-quick: 0ms;')
  })
})

describe('per-script typography', () => {
  it('emits :lang() blocks that reorder stacks, drop tracking for joined scripts and relax leading', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8')
    const arabic = css.slice(css.indexOf(':lang(ar)'), css.indexOf('}', css.indexOf(':lang(ar)')))
    expect(arabic).toMatch(/--fk-font-sans:\s*"Noto Sans Arabic"/)
    expect(arabic).toMatch(/--fk-font-tracking-eyebrow:\s*0em/)
    expect(arabic).toMatch(/--fk-font-line-height-body:\s*28px/)
    const japanese = css.slice(css.indexOf(':lang(ja)'), css.indexOf('}', css.indexOf(':lang(ja)')))
    expect(japanese).toMatch(/line-break:\s*strict/)
    expect(css).toMatch(/--fk-font-sans:[^;]*Noto Sans/)
  })
})
