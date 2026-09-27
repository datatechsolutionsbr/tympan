// Deprecated ids of the print book styles and of their UI themes. Kept in a
// module of its own, with no runtime imports, so that hosts which only need to
// resolve a stored theme name (ThemeProvider, themeInitScript) can import it
// from `@datatechsolutions/tympan-tokens/print-aliases` without loading the
// presets or generating the print themes.

import type { PrintPresetName } from './print-presets.ts'

/** Prefix of every print theme name: `data-ty-theme="print-<style>"`. */
export const PRINT_THEME_PREFIX = 'print-'

/**
 * Deprecated style ids and the current id each one maps to. The styles were
 * renamed to neutral, descriptive ids (no trademarks, institutions or people's
 * names); the old ids keep working through `resolvePrintStyleName`,
 * `resolvePrintStyle`, `LivroPrint estilo` and, as `print-<old id>`, the UI
 * theme lookup (`resolvePrintThemeName`), with a one-time console warning in
 * development builds.
 *
 * Removal: the aliases (and the `'modulor'` emblem) will be dropped in the
 * next major version of @datatechsolutions/tympan-tokens and
 * @datatechsolutions/tympan-print; migrate stored data books to the new ids.
 */
export const PRINT_STYLE_ALIASES = {
  economist: 'semanario',
  ft: 'papel-salmao',
  schiphol: 'sinalizacao',
  'jornal-do-brasil': 'jornal-1959',
  'atlas-ibge': 'atlas-oficial',
  deardata: 'cartao-postal',
  tufte: 'minimo-de-tinta',
  holmes: 'infografico-ilustrado',
  bayer: 'diagrama-modernista',
  dubois: 'graficos-1900',
  minard: 'fluxo-historico',
  mccandless: 'blocos-coloridos',
  corbusier: 'proporcao-modular',
  aicher: 'pictogramas',
  vignelli: 'mapa-de-metro',
  'athos-bulcao': 'azulejo-modernista',
  crouwel: 'grade-holandesa',
  'saul-bass': 'papel-recortado',
} as const satisfies Record<string, PrintPresetName>

/** A deprecated style id (see PRINT_STYLE_ALIASES). */
export type PrintStyleAlias = keyof typeof PRINT_STYLE_ALIASES

const isDev = (() => {
  try {
    return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV !== 'production'
  } catch {
    return true
  }
})()
const warned = new Set<string>()

/** Warns once per id (development builds only) that a deprecated id was used. @internal */
export function warnDeprecatedPrintId(old: string, current: string, kind = 'print style'): void {
  if (!isDev || warned.has(old)) return
  warned.add(old)
  console.warn(`[@datatechsolutions/tympan] The ${kind} "${old}" is deprecated; use "${current}". The old id will be removed in the next major version.`)
}

/**
 * Deprecated print theme names (`print-<old style id>`) and the current theme
 * each maps to, derived from PRINT_STYLE_ALIASES (for example
 * `print-economist` -> `print-semanario`). Same removal schedule: dropped in
 * the next major version.
 */
export const PRINT_THEME_ALIASES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(PRINT_STYLE_ALIASES).map(([old, current]) => [`${PRINT_THEME_PREFIX}${old}`, `${PRINT_THEME_PREFIX}${current}`]),
)

/**
 * The current name of a theme: a deprecated `print-<old id>` is mapped to its
 * `print-<new id>` (with a one-time development warning); any other name is
 * returned unchanged.
 */
export function resolvePrintThemeName(theme: string): string {
  if (!Object.hasOwn(PRINT_THEME_ALIASES, theme)) return theme
  const current = PRINT_THEME_ALIASES[theme]!
  warnDeprecatedPrintId(theme, current, 'theme')
  return current
}
