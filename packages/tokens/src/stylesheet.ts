// Assembles the token stylesheet: selector strategy for themes, modes and
// densities, plus the user-preference media blocks. Used by the static build
// (fed by Style Dictionary output) and by the live theme customizer (fed
// directly by the generator); both produce the same text for the same input.

import { presets as builtInPresets, DEFAULT_THEME } from './presets.ts'
import { printThemePresets } from './print-themes.ts'
import { scriptRules } from './scripts.ts'
import { DENSITIES, densityVariables, resolveTheme, themeVariables, type Density, type ThemeConfig } from './theme.ts'

export type VarList = Array<[string, string]>

export interface ThemeVars {
  name: string
  light: VarList
  dark: VarList
  /** Values used under `prefers-contrast: more` (omitted for themes that are already high contrast). */
  highLight?: VarList
  highDark?: VarList
}

export interface StylesheetInput {
  /** Theme-independent tokens (space, type, motion, z, layout). */
  base?: VarList
  themes: ThemeVars[]
  /** Theme applied to `:root` without attributes. `null` scopes every theme to its attribute. */
  defaultTheme?: string | null
  densities?: Partial<Record<Density, VarList>>
  /**
   * Component tokens that reference theme roles through var(). Declared on
   * every theme and mode scope so a nested theme re-resolves them.
   */
  components?: VarList
  /** Extra component rules emitted after the component tokens (e.g. the flow tone mapping). */
  componentRules?: string
  /** Cascade layer; `null` for none. */
  layer?: string | null
  banner?: string
  /**
   * Emit the user-preference blocks (reduced motion and transparency,
   * forced colours). Default true; add-on theme sheets loaded after the main
   * token sheet set it to false because those blocks already apply to every theme.
   */
  preferences?: boolean
}

const indent = (s: string, n = 2) =>
  s
    .split('\n')
    .map((l) => (l ? ' '.repeat(n) + l : l))
    .join('\n')
const decls = (vars: VarList, extra: string[] = []) => [...extra, ...vars.map(([n, v]) => `${n}: ${v};`)].join('\n')
const rule = (selectors: string[], body: string) => `${selectors.join(',\n')} {\n${indent(body)}\n}`
const media = (query: string, body: string) => `@media ${query} {\n${indent(body)}\n}`

/**
 * Selectors for one theme. The attributes may sit on the same element or on
 * an ancestor: `data-ty-theme` picks the theme, `data-ty-mode` forces light or
 * dark (absent or `system` follows `prefers-color-scheme`).
 */
export function themeSelectors(name: string, isDefault: boolean) {
  const t = `[data-ty-theme="${name}"]`
  return {
    light: isDefault ? [':root', t, '[data-ty-mode="light"]'] : [t, `${t} [data-ty-mode="light"]`],
    systemDark: isDefault
      ? [':root:not([data-ty-mode="light"])', `${t}:not([data-ty-mode="light"])`]
      : [`${t}:not([data-ty-mode="light"])`],
    dark: isDefault
      ? ['[data-ty-mode="dark"]', `${t}[data-ty-mode="dark"]`, `${t} [data-ty-mode="dark"]`, `[data-ty-mode="dark"] ${t}`]
      : [`${t}[data-ty-mode="dark"]`, `${t} [data-ty-mode="dark"]`, `[data-ty-mode="dark"] ${t}`],
    explicitLight: [`${t}[data-ty-mode="light"]`, `[data-ty-mode="dark"] ${t}[data-ty-mode="light"]`],
  }
}

function themeBlocks(theme: ThemeVars, isDefault: boolean, light: VarList, dark: VarList): string[] {
  const s = themeSelectors(theme.name, isDefault)
  return [
    rule(s.light, decls(light, ['color-scheme: light;'])),
    media('(prefers-color-scheme: dark)', rule(s.systemDark, decls(dark, ['color-scheme: dark;']))),
    rule(s.dark, decls(dark, ['color-scheme: dark;'])),
    rule(s.explicitLight, decls(light, ['color-scheme: light;'])),
  ]
}

const ANY_SCOPE = [':root', '[data-ty-theme]', '[data-ty-mode]']

/** Forced colours: roles map to system colours so boundaries and state stay visible. */
export const FORCED_COLORS_VARS: VarList = [
  ['--ty-bg', 'Canvas'],
  ['--ty-surface', 'Canvas'],
  ['--ty-surface-raised', 'Canvas'],
  ['--ty-surface-sunken', 'Canvas'],
  ['--ty-surface-solid', 'Canvas'],
  ['--ty-surface-raised-solid', 'Canvas'],
  ['--ty-secondary', 'ButtonFace'],
  ['--ty-on-secondary', 'ButtonText'],
  ['--ty-ink', 'CanvasText'],
  ['--ty-ink-2', 'CanvasText'],
  ['--ty-ink-3', 'CanvasText'],
  ['--ty-line', 'CanvasText'],
  ['--ty-line-soft', 'CanvasText'],
  ['--ty-line-strong', 'CanvasText'],
  ['--ty-input', 'CanvasText'],
  ['--ty-focus-ring', 'Highlight'],
  ['--ty-brand', 'Highlight'],
  ['--ty-accent', 'Highlight'],
  ['--ty-on-brand', 'HighlightText'],
  ['--ty-accent-ink', 'HighlightText'],
  ['--ty-brand-soft', 'Canvas'],
  ['--ty-accent-soft', 'Canvas'],
  ['--ty-on-brand-soft', 'LinkText'],
  ['--ty-on-accent-soft', 'LinkText'],
  ['--ty-cta', 'ButtonFace'],
  ['--ty-cta-solid', 'ButtonFace'],
  ['--ty-on-cta', 'ButtonText'],
  ['--ty-backdrop', 'transparent'],
  ['--ty-shadow-sheet', 'none'],
  ['--ty-shadow-raised', 'none'],
  ['--ty-shadow-floating', 'none'],
  ['--ty-shadow-modal', 'none'],
  ['--ty-glass-blur-sheet', '0px'],
  ['--ty-glass-blur-floating', '0px'],
]

/** Reduced transparency (and no backdrop-filter support): opaque surfaces, no blur, no ambient. */
export const OPAQUE_VARS: VarList = [
  ['--ty-surface', 'var(--ty-surface-solid) !important'],
  ['--ty-surface-raised', 'var(--ty-surface-raised-solid) !important'],
  ['--ty-secondary', 'var(--ty-surface-raised-solid) !important'],
  ['--ty-glass-blur-sheet', '0px !important'],
  ['--ty-glass-blur-floating', '0px !important'],
  ['--ty-glass-saturate', '1 !important'],
  ['--ty-ambient-1', 'transparent !important'],
  ['--ty-ambient-2', 'transparent !important'],
]

export function buildStylesheet(input: StylesheetInput): string {
  const parts: string[] = []
  const defaultTheme = input.defaultTheme === undefined ? DEFAULT_THEME : input.defaultTheme
  if (input.base?.length) {
    parts.push(rule([':root'], decls(input.base)))
    parts.push(`/* per-script typography (:lang) */\n${scriptRules(input.base)}`)
    // Reading direction as a number, for inline-axis translations that must mirror in RTL.
    parts.push(`:root,\n[dir="ltr"] {\n  --ty-inline-sign: 1;\n}\n\n[dir="rtl"] {\n  --ty-inline-sign: -1;\n}`)
  }

  const densities = input.densities ?? {}
  if (densities.default) parts.push(rule([':root', '[data-ty-density="default"]'], decls(densities.default)))
  for (const d of ['compact', 'comfortable'] as const) {
    const v = densities[d]
    if (v) parts.push(rule([`[data-ty-density="${d}"]`], decls(v)))
  }

  if (input.components?.length) {
    parts.push(`/* component tokens */\n${rule(ANY_SCOPE, decls(input.components))}`)
  }
  if (input.componentRules) parts.push(input.componentRules)

  for (const theme of input.themes) {
    parts.push(`/* theme: ${theme.name} */`)
    parts.push(...themeBlocks(theme, theme.name === defaultTheme, theme.light, theme.dark))
  }

  const high = input.themes.filter((t) => t.highLight && t.highDark)
  if (high.length) {
    const inner = high.flatMap((t) => themeBlocks(t, t.name === defaultTheme, t.highLight!, t.highDark!))
    parts.push(`/* prefers-contrast: more -> the high-contrast variant of each theme */\n${media('(prefers-contrast: more)', inner.join('\n\n'))}`)
  }

  if (input.preferences !== false) {
    const durations = (input.base ?? []).filter(([n]) => n.startsWith('--ty-dur-')).map(([n]) => [n, '0ms'] as [string, string])
    if (durations.length) parts.push(media('(prefers-reduced-motion: reduce)', rule(ANY_SCOPE, decls(durations))))
    parts.push(media('(prefers-reduced-transparency: reduce)', rule(ANY_SCOPE, decls(OPAQUE_VARS))))
    parts.push(`@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n${indent(rule(ANY_SCOPE, decls(OPAQUE_VARS)))}\n}`)
    parts.push(media('(forced-colors: active)', rule(ANY_SCOPE, decls(FORCED_COLORS_VARS))))
  }

  const body = parts.join('\n\n')
  const layered = input.layer === null ? body : `@layer ${input.layer ?? 'tympan.tokens'} {\n${indent(body)}\n}`
  return `${input.banner ? `${input.banner}\n` : ''}${layered}\n`
}

/** Generator output for one theme config, as variable lists. */
export function themeVarsFor(config: ThemeConfig): ThemeVars {
  const vars: ThemeVars = {
    name: config.name,
    light: themeVariables(resolveTheme(config, 'light')),
    dark: themeVariables(resolveTheme(config, 'dark')),
  }
  if (config.contrast !== 'high') {
    vars.highLight = themeVariables(resolveTheme(config, 'light', 'high'))
    vars.highDark = themeVariables(resolveTheme(config, 'dark', 'high'))
  }
  return vars
}

export interface ThemeCssOptions {
  /** Make this theme the `:root` default (for a standalone stylesheet). */
  asDefault?: boolean
  /** Include the density blocks. */
  densities?: boolean
  layer?: string | null
}

/** CSS for one theme config, straight from the generator (used by the customizer). */
export function generateThemeCss(config: ThemeConfig, options: ThemeCssOptions = {}): string {
  return buildStylesheet({
    themes: [themeVarsFor(config)],
    defaultTheme: options.asDefault ? config.name : null,
    densities: options.densities
      ? { default: densityVariables('default'), compact: densityVariables('compact'), comfortable: densityVariables('comfortable') }
      : undefined,
    layer: options.layer === undefined ? 'tympan.tokens' : options.layer,
  })
}

/** Variable lists of every built-in preset. */
export function presetThemeVars(list: readonly ThemeConfig[] = builtInPresets): ThemeVars[] {
  return list.map(themeVarsFor)
}

/**
 * The opt-in stylesheet of the print themes (`print-themes.css`): every
 * listed theme scoped to its `data-ty-theme` attribute, with its high-contrast
 * variant, and no user-preference blocks (the main token sheet has them).
 * Load it after `tokens.css`.
 */
export function generatePrintThemesCss(list: readonly ThemeConfig[] = printThemePresets, options: { layer?: string | null; banner?: string; themes?: ThemeVars[] } = {}): string {
  return buildStylesheet({
    themes: options.themes ?? list.map(themeVarsFor),
    defaultTheme: null,
    layer: options.layer === undefined ? 'tympan.tokens' : options.layer,
    preferences: false,
    banner: options.banner,
  })
}

export { DENSITIES }
