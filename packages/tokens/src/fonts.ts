// Bundled web fonts. Tympan ships every family its themes name as woff2
// files inside this package (packages/tokens/fonts/, fetched once by
// scripts/fetch-fonts.mjs and committed), declared with @font-face in
// dist/fonts.css (imported by tokens.css) and in the print theme sheets.
// @font-face only downloads a file when text uses that face and falls in its
// unicode-range, so nothing is fetched from a third party at runtime and an
// unused script or theme costs nothing.
//
// The lists below are the source of truth for what scripts/fetch-fonts.mjs
// downloads; the specs use the Google Fonts css2 syntax
// (`Family Name:axes@values`) because that is where the files come from.

import { SCRIPT_RULES } from './scripts.ts'

/** Base stacks of every preset: Source Serif 4, IBM Plex Sans, IBM Plex Mono. */
export const BASE_FONT_SPECS: readonly string[] = [
  'Source Serif 4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400',
  'IBM Plex Sans:ital,wght@0,400;0,500;0,600;0,700;1,400',
  'IBM Plex Mono:ital,wght@0,400;0,500;0,600;0,700;1,400',
]

const NOTO_WEIGHTS = 'wght@400;500;600;700'

/** Noto families named by the base stacks and the per-script `:lang()` rules. */
export const SCRIPT_FONT_FAMILIES: readonly string[] = [
  ...new Set([
    'Noto Sans',
    'Noto Serif',
    'Noto Sans Mono',
    'Noto Naskh Arabic',
    'Noto Sans Arabic',
    'Noto Sans Hebrew',
    'Noto Serif Hebrew',
    'Noto Sans Devanagari',
    'Noto Serif Devanagari',
    'Noto Sans Bengali',
    'Noto Sans Tamil',
    'Noto Sans Thai',
    'Noto Serif Thai',
    'Noto Sans Ethiopic',
    'Noto Serif Ethiopic',
    'Noto Sans Armenian',
    'Noto Sans Georgian',
    'Noto Sans JP',
    'Noto Serif JP',
    'Noto Sans SC',
    'Noto Serif SC',
    'Noto Sans KR',
    'Noto Serif KR',
    ...SCRIPT_RULES.flatMap((r) => [...r.sans, ...(r.serif ?? [])]),
  ]),
]

export const SCRIPT_FONT_SPECS: readonly string[] = SCRIPT_FONT_FAMILIES.map((f) => `${f}:${NOTO_WEIGHTS}`)

/** Every spec whose faces go into dist/fonts.css (and so tokens.css). */
export const CORE_FONT_SPECS: readonly string[] = [...BASE_FONT_SPECS, ...SCRIPT_FONT_SPECS]

/**
 * Family names that are platform faces, generic keywords or legacy aliases
 * kept as fallbacks; they get no @font-face (tests check that every other
 * family a theme names is bundled).
 */
export const SYSTEM_FONT_FAMILIES: readonly string[] = [
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-monospace', 'ui-sans-serif', 'ui-serif',
  '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Segoe Print', 'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial',
  'Georgia', 'Times New Roman', 'Times', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New',
  'Courier', 'Palatino', 'Palatino Linotype', 'Book Antiqua', 'Garamond', 'Baskerville', 'Didot', 'Futura', 'Gill Sans',
  'Optima', 'Impact', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Arial Narrow', 'Arial Black', 'Avenir', 'Avenir Next',
  'American Typewriter', 'Rockwell', 'Copperplate', 'Bodoni 72', 'Hoefler Text', 'Iowan Old Style', 'Charter',
  'Source Serif Pro',
]

/** Shape of fonts/manifest.json (written by scripts/fetch-fonts.mjs). */
export interface FontManifest {
  families: Record<string, { slug: string; version: string | null; files: number; bytes: number; license: string; licenseFile: string }>
  faces: Record<string, { family: string; style: string; weights: number[]; unicodeRange: string | null; file: string; bytes: number }>
  specs: Record<string, string[]>
}

/**
 * @font-face rules for the faces of `specs`, with `url(<base><file>)`
 * (`base` is the path from the stylesheet to the fonts/ folder), font-display
 * swap and the unicode-range of each slice. Faces shared by several specs
 * are declared once.
 */
export function fontFaceCss(manifest: FontManifest, specs: readonly string[], base: string): string {
  const ids = new Set<string>()
  for (const spec of specs) {
    const faces = manifest.specs[spec]
    if (!faces) throw new Error(`Font spec not bundled (run scripts/fetch-fonts.mjs): ${spec}`)
    for (const id of faces) ids.add(id)
  }
  return [...ids]
    .map((id) => {
      const f = manifest.faces[id]!
      const lo = Math.min(...f.weights)
      const hi = Math.max(...f.weights)
      return [
        '@font-face {',
        `  font-family: '${f.family}';`,
        `  font-style: ${f.style};`,
        `  font-weight: ${lo === hi ? lo : `${lo} ${hi}`};`,
        '  font-display: swap;',
        `  src: url('${base}${f.file}') format('woff2');`,
        ...(f.unicodeRange ? [`  unicode-range: ${f.unicodeRange};`] : []),
        '}',
      ].join('\n')
    })
    .join('\n')
}
