// Deterministic theme generator. Input: seed hues and chroma, a radius base,
// contrast level, glass on/off and optional pinned colours. Output: 11-step
// OKLCH ramps, paired semantic roles (X / on-X), shadows, radii and glass
// values for one mode, with every declared contrast pair checked and, where a
// role is not pinned, nudged along its lightness axis until WCAG 2.2 AA holds.
//
// The role model (paired surface/foreground roles, one radius base deriving
// the radius scale, themes as a swap of custom properties) and the idea of
// 11-step ramps in OKLCH are publicly documented concepts (sources in
// PROVENANCE.md). No code or values were taken from them; the lightness curve,
// chroma curve, hues and role recipes below are this project's own.

import { apcaContrast, contrastRatio, flatten, oklchToRgb, parseColor, rgbToOklch, toCss, type Oklch, type Rgba } from './color.ts'

export type Mode = 'light' | 'dark'
export type ContrastLevel = 'default' | 'high'
export type Density = 'compact' | 'default' | 'comfortable'

export interface Seed {
  /** OKLCH hue in degrees. */
  hue: number
  /** Peak OKLCH chroma of the ramp (0..~0.37). */
  chroma: number
}

export type SeedName = 'brand' | 'neutral' | 'danger' | 'warning' | 'success' | 'info'

/**
 * Typographic roles a theme may set. They map onto the base font tokens the
 * components read: `display` -> `--ty-font-serif` (headings h1 to h3 and KPI
 * numbers), `body` -> `--ty-font-sans` (everything else), `mono` ->
 * `--ty-font-mono` (identifiers). A role left out keeps the base stack.
 */
export type FontRole = 'display' | 'body' | 'mono' | 'sans' | 'serif'

/** CSS token of each font role (`--ty-font-<name>`). */
export const FONT_ROLE_TOKENS: Record<FontRole, 'serif' | 'sans' | 'mono'> = { display: 'serif', body: 'sans', mono: 'mono', sans: 'sans', serif: 'serif' }

/** Elevation treatment: blurred shadows, none (flat print), or a hard offset shadow without blur. */
export type Elevation = 'soft' | 'flat' | 'offset'

export interface ThemeConfig {
  /** Identifier used in `data-ty-theme`. Lowercase letters, digits and dashes. */
  name: string
  /** Human label (customizer, docs). */
  label?: string
  seeds: Record<SeedName, Seed>
  /** Hues of the eight chart / categorical colours. */
  chartHues?: number[]
  /** Control radius in px; card and sheet radii derive from it. */
  radius: number
  contrast: ContrastLevel
  /** Translucent blurred surfaces when true; opaque when false. */
  glass: boolean
  /** Call-to-action fill: brand gradient or solid brand. */
  cta: 'gradient' | 'solid'
  /** Exact colours that override generated roles (CSS colour strings). */
  pins?: Partial<Record<Mode, Partial<Record<RoleName, string>>>>
  /** Exact gradient stops for the call to action, per mode. */
  ctaPins?: Partial<Record<Mode, string[]>>
  /** Font families per role, most preferred first, ending with a generic family. */
  fonts?: Partial<Record<FontRole, string[]>>
  /**
   * Stylesheet URL that loads the families of `fonts` (for example a Google
   * Fonts css2 URL). The token CSS never fetches it; the host or
   * ThemeProvider's `fonts` map adds the link.
   */
  fontsUrl?: string
  /** Shadow treatment; `soft` when omitted. */
  elevation?: Elevation
  /** Arbitrary string variables (e.g. for textures) */
  strings?: Record<string, string>
}

export const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type RampStep = (typeof RAMP_STEPS)[number]

// Lightness and relative chroma per step (this project's own curve: near
// white at 50, near black at 950, chroma peaking around 500-600).
const RAMP_L = [0.975, 0.94, 0.885, 0.815, 0.725, 0.635, 0.55, 0.47, 0.395, 0.325, 0.255]
const RAMP_C = [0.1, 0.2, 0.38, 0.6, 0.84, 1, 0.97, 0.88, 0.76, 0.62, 0.5]

/** 11-step ramp for a seed. */
export function generateRamp(seed: Seed): Record<RampStep, Rgba> {
  const out = {} as Record<RampStep, Rgba>
  RAMP_STEPS.forEach((step, i) => {
    out[step] = oklchToRgb({ l: RAMP_L[i] ?? 0.5, c: seed.chroma * (RAMP_C[i] ?? 1), h: seed.hue })
  })
  return out
}

/** Seed derived from an existing colour (keeps hue; chroma scaled to a ramp peak). */
export function seedFromColor(color: string, peakChroma?: number): Seed {
  const { c, h } = rgbToOklch(parseColor(color))
  return { hue: Math.round(h * 10) / 10, chroma: Math.round((peakChroma ?? c) * 1000) / 1000 }
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const ROLE_NAMES = [
  'bg', 'on-bg',
  'surface', 'on-surface', 'surface-raised', 'on-surface-raised', 'surface-sunken', 'on-surface-sunken',
  'surface-solid', 'surface-raised-solid',
  'ink', 'ink-2', 'ink-3',
  'line', 'line-soft', 'line-strong', 'input',
  'focus-ring',
  'brand', 'on-brand', 'brand-strong', 'brand-soft', 'on-brand-soft',
  'cta-solid', 'on-cta',
  'secondary', 'on-secondary',
  'danger', 'on-danger', 'danger-soft', 'on-danger-soft',
  'warning', 'on-warning', 'warning-soft', 'on-warning-soft',
  'success', 'on-success', 'success-soft', 'on-success-soft',
  'info', 'on-info', 'info-soft', 'on-info-soft',
  'neutral', 'on-neutral', 'neutral-soft', 'on-neutral-soft',
  'proof-proved', 'proof-proved-soft', 'proof-pending', 'proof-pending-soft', 'proof-refuted', 'proof-refuted-soft',
  'proof-not-disclosed', 'proof-not-disclosed-soft', 'proof-none', 'proof-none-soft',
  'actor-person', 'actor-person-soft', 'actor-agent', 'actor-agent-soft', 'actor-system', 'actor-system-soft',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-7', 'chart-8',
  'nav-bg', 'on-nav', 'nav-active', 'on-nav-active', 'nav-line',
  'backdrop', 'ambient-1', 'ambient-2',
] as const
export type RoleName = (typeof ROLE_NAMES)[number]

/** Design-direction names kept as aliases of the role model. */
export const ROLE_ALIASES: Record<string, RoleName> = {
  accent: 'brand',
  'accent-strong': 'brand-strong',
  'accent-soft': 'brand-soft',
  'accent-ink': 'on-brand',
  'on-accent': 'on-brand',
  'on-accent-soft': 'on-brand-soft',
  'categorical-1': 'chart-1',
  'categorical-2': 'chart-2',
  'categorical-3': 'chart-3',
  'categorical-4': 'chart-4',
  'categorical-5': 'chart-5',
  'categorical-6': 'chart-6',
  'categorical-7': 'chart-7',
  'categorical-8': 'chart-8',
}

interface Recipe {
  seed: SeedName | 'chart' | 'ambient'
  /** OKLCH lightness. */
  l: number
  /** Multiplier of the seed chroma. */
  c?: number
  /** Opacity. */
  a?: number
  /** Hue override (chart and ambient). */
  h?: number
}

const TONES = ['danger', 'warning', 'success', 'info', 'neutral'] as const

function recipes(mode: Mode, contrast: ContrastLevel, glass: boolean): Partial<Record<RoleName, Recipe>> {
  const dark = mode === 'dark'
  const high = contrast === 'high'
  const pick = (light: number, darkV: number) => (dark ? darkV : light)
  const softA = pick(0.1, 0.14) * (high ? 1.6 : 1)
  const r: Partial<Record<RoleName, Recipe>> = {
    bg: { seed: 'neutral', l: pick(0.975, 0.165), c: 0.5 },
    surface: { seed: 'neutral', l: pick(0.993, 0.235), c: 0.4, a: glass ? pick(0.82, 0.72) : 1 },
    'surface-raised': { seed: 'neutral', l: pick(0.993, 0.275), c: 0.4, a: glass ? pick(0.94, 0.86) : 1 },
    'surface-solid': { seed: 'neutral', l: pick(0.993, 0.235), c: 0.4 },
    'surface-raised-solid': { seed: 'neutral', l: pick(0.993, 0.275), c: 0.4 },
    'surface-sunken': { seed: 'neutral', l: pick(0.955, 0.195), c: 0.6 },
    ink: { seed: 'neutral', l: pick(0.21, 0.955), c: 2 },
    'ink-2': { seed: 'neutral', l: high ? pick(0.27, 0.93) : pick(0.37, 0.87), c: 2 },
    'ink-3': { seed: 'neutral', l: high ? pick(0.33, 0.9) : pick(0.5, 0.72), c: 2 },
    line: { seed: 'neutral', l: pick(0.55, 0.78), c: 2.5, a: high ? pick(0.45, 0.4) : pick(0.22, 0.16) },
    'line-soft': { seed: 'neutral', l: pick(0.55, 0.78), c: 2.5, a: high ? pick(0.3, 0.25) : pick(0.12, 0.09) },
    'line-strong': { seed: 'neutral', l: pick(0.55, 0.78), c: 2.5, a: high ? pick(0.75, 0.65) : pick(0.38, 0.3) },
    input: { seed: 'neutral', l: high ? pick(0.42, 0.78) : pick(0.6, 0.58), c: 2.5 },
    'focus-ring': { seed: 'brand', l: high ? pick(0.4, 0.85) : pick(0.47, 0.79), c: 0.75 },
    brand: { seed: 'brand', l: high ? pick(0.4, 0.85) : pick(0.47, 0.79), c: 0.75 },
    'brand-strong': { seed: 'brand', l: high ? pick(0.33, 0.9) : pick(0.4, 0.87), c: 0.7 },
    'brand-soft': { seed: 'brand', l: pick(0.55, 0.75), c: 0.8, a: softA },
    'on-brand-soft': { seed: 'brand', l: high ? pick(0.36, 0.88) : pick(0.44, 0.82), c: 0.75 },
    'on-brand': { seed: 'brand', l: pick(0.985, 0.25), c: 0.15 },
    'cta-solid': { seed: 'brand', l: pick(0.45, 0.45), c: 0.8 },
    'on-cta': { seed: 'brand', l: 0.985, c: 0.1 },
    secondary: { seed: 'neutral', l: pick(0.993, 0.275), c: 0.4, a: glass ? pick(0.7, 0.6) : 1 },
    'on-secondary': { seed: 'neutral', l: pick(0.21, 0.955), c: 2 },
    backdrop: { seed: 'neutral', l: pick(0.2, 0.1), c: 2, a: pick(0.4, 0.6) },
    'ambient-1': { seed: 'brand', l: 0.72, c: 0.9, a: glass ? pick(0.07, 0.12) : 0 },
    'ambient-2': { seed: 'ambient', l: 0.75, c: 0.12, h: 230, a: glass ? pick(0.05, 0.08) : 0 },
  }
  for (const tone of TONES) {
    const chroma = tone === 'neutral' ? 2 : 1
    r[tone] = { seed: tone, l: high ? pick(0.44, 0.8) : pick(0.51, 0.74), c: chroma }
    r[`${tone}-soft`] = { seed: tone, l: pick(0.6, 0.7), c: chroma, a: softA }
    r[`on-${tone}-soft`] = { seed: tone, l: high ? pick(0.38, 0.86) : pick(0.45, 0.8), c: chroma }
    r[`on-${tone}`] = { seed: 'neutral', l: pick(0.985, 0.18), c: 0.3 }
  }
  return r
}

/** Contrast pairs every theme must satisfy (WCAG 2.2 AA). */
export interface ContrastPair {
  fg: RoleName | `cta-stop-${number}` | 'focus-ring'
  /** Background stack from top to bottom; translucent layers are composited. */
  over: Array<RoleName | `cta-stop-${number}`>
  min: 4.5 | 3
  kind: 'text' | 'ui'
}

export function contrastPairs(ctaStops: number): ContrastPair[] {
  const pairs: ContrastPair[] = []
  const text = (fg: ContrastPair['fg'], ...over: ContrastPair['over']) => pairs.push({ fg, over, min: 4.5, kind: 'text' })
  const ui = (fg: ContrastPair['fg'], ...over: ContrastPair['over']) => pairs.push({ fg, over, min: 3, kind: 'ui' })
  for (const ink of ['ink', 'ink-2', 'ink-3'] as const) {
    text(ink, 'bg')
    text(ink, 'surface', 'bg')
    text(ink, 'surface-raised', 'bg')
    text(ink, 'surface-sunken')
  }
  text('on-bg', 'bg')
  text('on-surface', 'surface', 'bg')
  text('on-surface-raised', 'surface-raised', 'bg')
  text('on-surface-sunken', 'surface-sunken')
  text('brand', 'bg')
  text('brand', 'surface', 'bg')
  text('brand', 'surface-raised', 'bg')
  text('brand-strong', 'surface', 'bg')
  text('on-brand', 'brand')
  text('on-brand-soft', 'brand-soft', 'surface', 'bg')
  text('on-cta', 'cta-solid')
  for (let i = 0; i < ctaStops; i++) text('on-cta', `cta-stop-${i}`)
  text('on-secondary', 'secondary', 'bg')
  for (const tone of TONES) {
    text(tone, 'surface', 'bg')
    text(tone, 'surface-raised', 'bg')
    text(`on-${tone}`, tone)
    text(`on-${tone}-soft`, `${tone}-soft`, 'surface', 'bg')
  }
  for (const p of ['proved', 'pending', 'refuted', 'not-disclosed', 'none'] as const) {
    text(`proof-${p}`, 'surface', 'bg')
    text(`proof-${p}`, `proof-${p}-soft`, 'surface', 'bg')
  }
  for (const a of ['person', 'agent', 'system'] as const) text(`actor-${a}`, `actor-${a}-soft`, 'surface', 'bg')
  text('on-nav', 'nav-bg', 'bg')
  text('on-nav-active', 'nav-active', 'nav-bg', 'bg')
  ui('input', 'surface', 'bg')
  ui('input', 'bg')
  ui('input', 'surface-raised', 'bg')
  ui('focus-ring', 'bg')
  ui('focus-ring', 'surface', 'bg')
  ui('focus-ring', 'surface-raised', 'bg')
  ui('brand', 'surface-sunken')
  for (let i = 1; i <= 8; i++) ui(`chart-${i}` as RoleName, 'surface', 'bg')
  return pairs
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export interface ShadowLayer {
  x: number
  y: number
  blur: number
  spread: number
  color: Rgba
  inset?: boolean
}

export interface ContrastResult {
  fg: string
  over: string[]
  kind: 'text' | 'ui'
  min: number
  ratio: number
  apca: number
  pass: boolean
}

export interface ResolvedTheme {
  name: string
  mode: Mode
  contrast: ContrastLevel
  colors: Record<string, Rgba>
  ramps: Record<SeedName, Record<RampStep, Rgba>>
  cta: { angle: number; stops: Rgba[] }
  shadows: Record<'sheet' | 'raised' | 'floating' | 'modal' | 'sheet-inset', ShadowLayer[]>
  /** Pixel dimensions (radius, glass blur, focus width). */
  dimensions: Record<string, number>
  /** Font stacks keyed by token name (`serif`, `sans`, `mono`); empty when the theme keeps the base stacks. */
  fonts: Partial<Record<'serif' | 'sans' | 'mono', string[]>>
  numbers: Record<string, number>
  strings?: Record<string, string>
  report: ContrastResult[]
}

/** Hues of the eight chart colours when a theme sets none. */
export const DEFAULT_CHART_HUES = [250, 62, 165, 335, 215, 35, 110, 290]

function colorFrom(recipe: Recipe, seeds: Record<SeedName, Seed>): Oklch & { a: number } {
  const seed = recipe.seed === 'chart' || recipe.seed === 'ambient' ? undefined : seeds[recipe.seed]
  const chroma = seed ? seed.chroma * (recipe.c ?? 1) : (recipe.c ?? 0.1)
  return { l: recipe.l, c: chroma, h: recipe.h ?? seed?.hue ?? 0, a: recipe.a ?? 1 }
}

/** Resolves one theme in one mode. */
export function resolveTheme(config: ThemeConfig, mode: Mode, contrastOverride?: ContrastLevel): ResolvedTheme {
  const contrast = contrastOverride ?? config.contrast
  const dark = mode === 'dark'
  const recipeMap = recipes(mode, contrast, config.glass)
  const lch: Partial<Record<RoleName, Oklch & { a: number }>> = {}
  for (const [role, recipe] of Object.entries(recipeMap) as Array<[RoleName, Recipe]>) lch[role] = colorFrom(recipe, config.seeds)

  const chartHues = config.chartHues ?? DEFAULT_CHART_HUES
  chartHues.slice(0, 8).forEach((h, i) => {
    lch[`chart-${i + 1}` as RoleName] = { l: dark ? 0.76 : 0.55, c: dark ? 0.13 : 0.14, h, a: 1 }
  })

  const pinned = new Set<RoleName>()
  const colors: Record<string, Rgba> = {}
  const pins = config.pins?.[mode] ?? {}
  const pinnedValue = (role: RoleName): Rgba | undefined => {
    // Pins are exact design values; the high-contrast variant regenerates.
    const v = contrast === config.contrast ? pins[role] : undefined
    return v ? parseColor(v) : undefined
  }
  const materialise = (role: RoleName) => {
    const p = pinnedValue(role)
    if (p) {
      pinned.add(role)
      colors[role] = p
      return
    }
    const v = lch[role]
    if (v) colors[role] = oklchToRgb(v, v.a)
  }
  for (const role of Object.keys(lch) as RoleName[]) materialise(role)

  // Roles defined as copies of others (after pins so they follow them).
  const copy = (role: RoleName, from: RoleName) => {
    const p = pinnedValue(role)
    if (p) {
      pinned.add(role)
      colors[role] = p
    } else if (colors[from]) {
      colors[role] = { ...colors[from]! }
      if (lch[from]) lch[role] = { ...lch[from]! }
    }
  }
  const aliasRoles = (): void => {
    copy('on-bg', 'ink-2')
    copy('on-surface', 'ink-2')
    copy('on-surface-raised', 'ink-2')
    copy('on-surface-sunken', 'ink-2')
    copy('proof-proved', 'on-success-soft')
    copy('proof-proved-soft', 'success-soft')
    copy('proof-pending', 'on-warning-soft')
    copy('proof-pending-soft', 'warning-soft')
    copy('proof-refuted', 'on-danger-soft')
    copy('proof-refuted-soft', 'danger-soft')
    copy('proof-not-disclosed', 'on-neutral-soft')
    copy('proof-not-disclosed-soft', 'neutral-soft')
    copy('proof-none', 'ink-3')
    copy('proof-none-soft', 'neutral-soft')
    copy('actor-person', 'on-brand-soft')
    copy('actor-person-soft', 'brand-soft')
    copy('actor-agent', 'ink-2')
    copy('actor-agent-soft', 'neutral-soft')
    copy('actor-system', 'ink-3')
    copy('actor-system-soft', 'neutral-soft')
    copy('nav-bg', 'surface')
    copy('on-nav', 'ink-2')
    copy('nav-active', 'brand-soft')
    copy('on-nav-active', 'on-brand-soft')
    copy('nav-line', 'line')
  }
  aliasRoles()

  // Call to action stops.
  const brand = config.seeds.brand
  const ctaPin = config.ctaPins?.[mode]
  let ctaStops: Rgba[]
  if (ctaPin && contrast === config.contrast) ctaStops = ctaPin.map(parseColor)
  else if (config.cta === 'solid') ctaStops = [colors['cta-solid']!]
  else
    ctaStops = [
      oklchToRgb({ l: 0.5, c: brand.chroma * 0.85, h: brand.hue - 12 }),
      oklchToRgb({ l: 0.47, c: brand.chroma * 0.8, h: brand.hue + 8 }),
      oklchToRgb({ l: 0.47, c: brand.chroma * 0.85, h: brand.hue + 60 }),
    ]

  // Contrast enforcement: nudge non-pinned foreground roles along lightness.
  const pairs = contrastPairs(ctaStops.length)
  const layer = (name: string): Rgba => {
    const m = /^cta-stop-(\d+)$/.exec(name)
    if (m) return ctaStops[Number(m[1])]!
    return colors[name] ?? { r: 1, g: 1, b: 1, a: 1 }
  }
  const measure = (pair: ContrastPair) => {
    const bgc = flatten([...pair.over.map(layer), dark ? layer('bg') : layer('bg')])
    const fgc = flatten([layer(pair.fg), bgc])
    return { ratio: contrastRatio(fgc, bgc), apca: apcaContrast(fgc, bgc), bgc }
  }
  for (let pass = 0; pass < 3; pass++) {
    for (const pair of pairs) {
      const role = pair.fg as RoleName
      if (pinned.has(role) || !lch[role]) continue
      let guard = 0
      let m = measure(pair)
      while (m.ratio < pair.min && guard++ < 80) {
        const v = lch[role]!
        const bgL = rgbToOklch(m.bgc).l
        const step = bgL > 0.6 ? -0.01 : 0.01
        v.l = Math.min(0.995, Math.max(0.02, v.l + step))
        colors[role] = oklchToRgb(v, v.a)
        m = measure(pair)
      }
    }
    aliasRoles()
  }


  const report: ContrastResult[] = pairs.map((pair) => {
    const m = measure(pair)
    return {
      fg: pair.fg,
      over: pair.over,
      kind: pair.kind,
      min: pair.min,
      ratio: Math.round(m.ratio * 100) / 100,
      apca: Math.round(m.apca * 10) / 10,
      pass: m.ratio >= pair.min - 1e-9,
    }
  })

  // Aliases of the design-direction vocabulary.
  for (const [alias, role] of Object.entries(ROLE_ALIASES)) if (colors[role]) colors[alias] = colors[role]!

  const ramps = Object.fromEntries(
    (Object.keys(config.seeds) as SeedName[]).map((s) => [s, generateRamp(config.seeds[s])]),
  ) as Record<SeedName, Record<RampStep, Rgba>>

  const tint = oklchToRgb({ l: dark ? 0.12 : 0.2, c: config.seeds.neutral.chroma * 2, h: config.seeds.neutral.hue })
  const shade = (alpha: number) => ({ ...tint, a: Math.min(0.9, alpha * (dark ? 2 : 1)) })
  const inset: ShadowLayer = { x: 0, y: 1, blur: 0, spread: 0, inset: true, color: { r: 1, g: 1, b: 1, a: dark && config.glass ? 0.06 : 0 } }
  const elevation = config.elevation ?? 'soft'
  let shadows: ResolvedTheme['shadows']
  if (elevation === 'flat') {
    // Print-flat: surfaces sit on the page; only overlays keep a faint separation.
    const none: ShadowLayer[] = [{ x: 0, y: 0, blur: 0, spread: 0, color: { ...tint, a: 0 } }]
    shadows = { sheet: none, raised: none, floating: [{ x: 0, y: 2, blur: 6, spread: -2, color: shade(0.12) }], modal: [{ x: 0, y: 16, blur: 40, spread: -16, color: shade(0.3) }], 'sheet-inset': [inset] }
  } else if (elevation === 'offset') {
    // Hard shadow in the ink colour, no blur (cut-paper and poster styles).
    const ink = colors.ink ?? tint
    const hard = (d: number): ShadowLayer[] => [{ x: d, y: d, blur: 0, spread: 0, color: { ...ink, a: 1 } }]
    shadows = { sheet: hard(3), raised: hard(2), floating: hard(4), modal: hard(6), 'sheet-inset': [inset] }
  } else {
    shadows = {
      sheet: [
        { x: 0, y: 1, blur: 2, spread: 0, color: shade(0.04) },
        { x: 0, y: 8, blur: 24, spread: -12, color: shade(0.1) },
      ],
      raised: [{ x: 0, y: 4, blur: 12, spread: -2, color: shade(0.08) }],
      floating: [{ x: 0, y: 12, blur: 24, spread: -8, color: shade(0.14) }],
      modal: [{ x: 0, y: 40, blur: 100, spread: -30, color: shade(0.35) }],
      'sheet-inset': [inset],
    }
  }

  const R = config.radius
  const dimensions: Record<string, number> = {
    radius: R,
    'radius-control': R,
    'radius-card': Math.round(R * 1.6),
    'radius-sheet': Math.round(R * 2.4),
    'radius-pill': 999,
    'radius-agent': Math.max(2, Math.round(R * 0.6)),
    'focus-width': contrast === 'high' ? 3 : 2,
    'glass-blur-sheet': config.glass ? 20 : 0,
    'glass-blur-floating': config.glass ? 24 : 0,
  }
  const numbers: Record<string, number> = { 'glass-saturate': config.glass ? 1.15 : 1 }

  const fonts: ResolvedTheme['fonts'] = {}
  for (const role of ['display', 'body', 'mono'] as const) {
    const list = config.fonts?.[role]
    if (list?.length) fonts[FONT_ROLE_TOKENS[role]] = [...list]
  }

  return { name: config.name, mode, contrast, colors, ramps, cta: { angle: 135, stops: ctaStops }, shadows, dimensions, numbers, fonts, strings: config.strings ?? {}, report }
}

// ---------------------------------------------------------------------------
// Density (independent of the theme)
// ---------------------------------------------------------------------------

export const DENSITIES: Record<Density, Record<string, number>> = {
  compact: { 'control-height': 36, 'control-height-touch': 44, 'control-height-compact': 28, density: 0.875 },
  default: { 'control-height': 40, 'control-height-touch': 44, 'control-height-compact': 32, density: 1 },
  comfortable: { 'control-height': 44, 'control-height-touch': 48, 'control-height-compact': 36, density: 1.125 },
}

// ---------------------------------------------------------------------------
// Serialisation to CSS custom property lists
// ---------------------------------------------------------------------------

export function shadowToCss(layers: ShadowLayer[]): string {
  return layers
    .map((l) => `${l.inset ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${toCss(l.color)}`)
    .join(', ')
}

export function gradientToCss(angle: number, stops: Rgba[]): string {
  const list = stops.length === 1 ? [stops[0]!, stops[0]!] : stops
  return `linear-gradient(${angle}deg, ${list.map((s, i) => `${toCss(s)} ${Math.round((i / (list.length - 1)) * 100)}%`).join(', ')})`
}

/** Ordered `[--ty-name, value]` pairs for one resolved theme. */
export function themeVariables(t: ResolvedTheme): Array<[string, string]> {
  const out: Array<[string, string]> = []
  for (const [name, c] of Object.entries(t.colors)) out.push([`--ty-${name}`, toCss(c)])
  out.push(['--ty-cta', gradientToCss(t.cta.angle, t.cta.stops)])
  for (const [seed, ramp] of Object.entries(t.ramps)) {
    for (const step of RAMP_STEPS) out.push([`--ty-${seed}-${step}`, toCss(ramp[step])])
  }
  for (const [name, layers] of Object.entries(t.shadows)) out.push([`--ty-shadow-${name}`, shadowToCss(layers)])
  for (const [name, px] of Object.entries(t.dimensions)) out.push([`--ty-${name}`, `${px}px`])
  for (const [name, n] of Object.entries(t.numbers)) out.push([`--ty-${name}`, String(n)])
  for (const [name, list] of Object.entries(t.fonts)) out.push([`--ty-font-${name}`, fontStackToCss(list)])
  for (const [name, s] of Object.entries(t.strings ?? {})) out.push([`--ty-${name}`, s])
  return out
}

/**
 * CSS `font-family` value of a family list: names with spaces or digits are
 * quoted, keywords and single identifiers are not (the same rule as the
 * Style Dictionary font-family transform of the build).
 */
export function fontStackToCss(families: readonly string[]): string {
  return families.map((f) => (/[\s\d]/.test(f) && !/^[\w-]+$/.test(f) ? `'${f}'` : f)).join(', ')
}

/** Family list of a CSS `font-family` value (quotes removed). */
export function parseFontStack(stack: string): string[] {
  return stack
    .split(',')
    .map((f) => f.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
}

export function densityVariables(density: Density): Array<[string, string]> {
  return Object.entries(DENSITIES[density]).map(([k, v]) => [`--ty-${k}`, k === 'density' ? String(v) : `${v}px`])
}
