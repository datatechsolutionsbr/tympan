// Assembles the token stylesheet: selector strategy for themes, modes and
// densities, plus the user-preference media blocks. Used by the static build
// (fed by Style Dictionary output) and by the live theme customizer (fed
// directly by the generator); both produce the same text for the same input.

import { presets as builtInPresets, DEFAULT_THEME } from './presets.ts'
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
  /** Cascade layer; `null` for none. */
  layer?: string | null
  banner?: string
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
 * an ancestor: `data-fk-theme` picks the theme, `data-fk-mode` forces light or
 * dark (absent or `system` follows `prefers-color-scheme`).
 */
export function themeSelectors(name: string, isDefault: boolean) {
  const t = `[data-fk-theme="${name}"]`
  return {
    light: isDefault ? [':root', t, '[data-fk-mode="light"]'] : [t, `${t} [data-fk-mode="light"]`],
    systemDark: isDefault
      ? [':root:not([data-fk-mode="light"])', `${t}:not([data-fk-mode="light"])`]
      : [`${t}:not([data-fk-mode="light"])`],
    dark: isDefault
      ? ['[data-fk-mode="dark"]', `${t}[data-fk-mode="dark"]`, `${t} [data-fk-mode="dark"]`, `[data-fk-mode="dark"] ${t}`]
      : [`${t}[data-fk-mode="dark"]`, `${t} [data-fk-mode="dark"]`, `[data-fk-mode="dark"] ${t}`],
    explicitLight: [`${t}[data-fk-mode="light"]`, `[data-fk-mode="dark"] ${t}[data-fk-mode="light"]`],
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

const ANY_SCOPE = [':root', '[data-fk-theme]', '[data-fk-mode]']

/** Forced colours: roles map to system colours so boundaries and state stay visible. */
export const FORCED_COLORS_VARS: VarList = [
  ['--fk-bg', 'Canvas'],
  ['--fk-surface', 'Canvas'],
  ['--fk-surface-raised', 'Canvas'],
  ['--fk-surface-sunken', 'Canvas'],
  ['--fk-surface-solid', 'Canvas'],
  ['--fk-surface-raised-solid', 'Canvas'],
  ['--fk-secondary', 'ButtonFace'],
  ['--fk-on-secondary', 'ButtonText'],
  ['--fk-ink', 'CanvasText'],
  ['--fk-ink-2', 'CanvasText'],
  ['--fk-ink-3', 'CanvasText'],
  ['--fk-line', 'CanvasText'],
  ['--fk-line-soft', 'CanvasText'],
  ['--fk-line-strong', 'CanvasText'],
  ['--fk-input', 'CanvasText'],
  ['--fk-focus-ring', 'Highlight'],
  ['--fk-brand', 'Highlight'],
  ['--fk-accent', 'Highlight'],
  ['--fk-on-brand', 'HighlightText'],
  ['--fk-accent-ink', 'HighlightText'],
  ['--fk-brand-soft', 'Canvas'],
  ['--fk-accent-soft', 'Canvas'],
  ['--fk-on-brand-soft', 'LinkText'],
  ['--fk-on-accent-soft', 'LinkText'],
  ['--fk-cta', 'ButtonFace'],
  ['--fk-cta-solid', 'ButtonFace'],
  ['--fk-on-cta', 'ButtonText'],
  ['--fk-backdrop', 'transparent'],
  ['--fk-shadow-sheet', 'none'],
  ['--fk-shadow-raised', 'none'],
  ['--fk-shadow-floating', 'none'],
  ['--fk-shadow-modal', 'none'],
  ['--fk-glass-blur-sheet', '0px'],
  ['--fk-glass-blur-floating', '0px'],
]

/** Reduced transparency (and no backdrop-filter support): opaque surfaces, no blur, no ambient. */
export const OPAQUE_VARS: VarList = [
  ['--fk-surface', 'var(--fk-surface-solid) !important'],
  ['--fk-surface-raised', 'var(--fk-surface-raised-solid) !important'],
  ['--fk-secondary', 'var(--fk-surface-raised-solid) !important'],
  ['--fk-glass-blur-sheet', '0px !important'],
  ['--fk-glass-blur-floating', '0px !important'],
  ['--fk-glass-saturate', '1 !important'],
  ['--fk-ambient-1', 'transparent !important'],
  ['--fk-ambient-2', 'transparent !important'],
]

export function buildStylesheet(input: StylesheetInput): string {
  const parts: string[] = []
  const defaultTheme = input.defaultTheme === undefined ? DEFAULT_THEME : input.defaultTheme
  if (input.base?.length) parts.push(rule([':root'], decls(input.base)))

  const densities = input.densities ?? {}
  if (densities.default) parts.push(rule([':root', '[data-fk-density="default"]'], decls(densities.default)))
  for (const d of ['compact', 'comfortable'] as const) {
    const v = densities[d]
    if (v) parts.push(rule([`[data-fk-density="${d}"]`], decls(v)))
  }

  for (const theme of input.themes) {
    parts.push(`/* theme: ${theme.name} */`)
    parts.push(...themeBlocks(theme, theme.name === defaultTheme, theme.light, theme.dark))
  }

  const high = input.themes.filter((t) => t.highLight && t.highDark)
  if (high.length) {
    const inner = high.flatMap((t) => themeBlocks(t, t.name === defaultTheme, t.highLight!, t.highDark!))
    parts.push(`/* prefers-contrast: more -> the high-contrast variant of each theme */\n${media('(prefers-contrast: more)', inner.join('\n\n'))}`)
  }

  const durations = (input.base ?? []).filter(([n]) => n.startsWith('--fk-dur-')).map(([n]) => [n, '0ms'] as [string, string])
  if (durations.length) parts.push(media('(prefers-reduced-motion: reduce)', rule(ANY_SCOPE, decls(durations))))
  parts.push(media('(prefers-reduced-transparency: reduce)', rule(ANY_SCOPE, decls(OPAQUE_VARS))))
  parts.push(`@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n${indent(rule(ANY_SCOPE, decls(OPAQUE_VARS)))}\n}`)
  parts.push(media('(forced-colors: active)', rule(ANY_SCOPE, decls(FORCED_COLORS_VARS))))

  const body = parts.join('\n\n')
  const layered = input.layer === null ? body : `@layer ${input.layer ?? 'fakhir.tokens'} {\n${indent(body)}\n}`
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
    layer: options.layer === undefined ? 'fakhir.tokens' : options.layer,
  })
}

/** Variable lists of every built-in preset. */
export function presetThemeVars(list: readonly ThemeConfig[] = builtInPresets): ThemeVars[] {
  return list.map(themeVarsFor)
}

export { DENSITIES }
