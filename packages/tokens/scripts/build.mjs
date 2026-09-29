// Builds the Tympan design tokens.
//
//   node scripts/build.mjs          -> dist/tokens.css, dist/tokens.json, dist/values.js(+.d.ts),
//                                      dist/dtcg/*.tokens.json, dist/contrast-report.md
//   node scripts/build.mjs --check  -> validates sources and generated themes only
//
// Pipeline:
//   1. Static DTCG sources in src/base/*.tokens.json (space, type, motion, z, layout).
//   2. The generator (src/theme.ts) resolves every preset in light and dark,
//      default and high contrast, and emits DTCG trees (src/dtcg.ts).
//   3. Style Dictionary v5 reads all DTCG trees and transforms them to
//      --ty-* custom properties (transforms below).
//   3b. Component tokens (src/flow.ts, --ty-flow-*) are DTCG aliases into the
//       theme tree; Style Dictionary resolves each alias to the referenced
//       token and emits it as a var() reference, so themes keep following.
//   4. src/stylesheet.ts assembles the selectors and preference media blocks.
//   5. Parity check: Style Dictionary output must equal the generator's direct
//      serialisation (the one the live theme customizer uses), value for value.
//   6. Print themes (src/print-themes.ts): the book styles as UI themes, in an
//      opt-in sheet (dist/print-themes.css, one file per theme in
//      dist/print-themes/) and light and dark DTCG trees (dist/dtcg/print/),
//      never in tokens.css.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import StyleDictionary from 'style-dictionary'
import { getReferences, usesReferences } from 'style-dictionary/utils'
import {
  buildStylesheet,
  DEFAULT_THEME,
  densityToDtcg,
  densityVariables,
  flowToDtcg,
  flowToneRules,
  flowVariables,
  fromDtcgColor,
  generatePrintThemesCss,
  gradientToCss,
  presets,
  printThemePresets,
  resolveTheme,
  shadowToCss,
  themeToDtcg,
  themeVariables,
  toCss,
} from '../src/index.ts'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = join(here, '..')
const dist = join(pkg, 'dist')
const checkOnly = process.argv.includes('--check')
const MODES = ['light', 'dark']
const DENSITY_NAMES = ['default', 'compact', 'comfortable']

// ---------------------------------------------------------------------------
// 1. Static sources and validation
// ---------------------------------------------------------------------------

const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'))
function merge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && !('$value' in v) && target[k] && typeof target[k] === 'object') merge(target[k], v)
    else target[k] = v
  }
  return target
}
const baseDir = join(pkg, 'src', 'base')
const base = readdirSync(baseDir)
  .filter((f) => f.endsWith('.tokens.json'))
  .sort()
  .reduce((acc, f) => merge(acc, readJson(join(baseDir, f))), {})

const DTCG_TYPES = new Set(['color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier', 'number', 'strokeStyle', 'border', 'transition', 'shadow', 'gradient', 'typography'])
function flattenTree(tree, path = [], type) {
  const t = tree.$type ?? type
  if ('$value' in tree) return [{ path, type: t, value: tree.$value }]
  return Object.entries(tree).flatMap(([k, v]) => (k.startsWith('$') || !v || typeof v !== 'object' ? [] : flattenTree(v, [...path, k], t)))
}
function validate(label, tree) {
  const errors = []
  for (const tok of flattenTree(tree)) {
    const id = tok.path.join('.')
    if (!tok.type) errors.push(`${label}: ${id} has no $type`)
    else if (!DTCG_TYPES.has(tok.type)) errors.push(`${label}: ${id} unknown $type ${tok.type}`)
    if (tok.type === 'dimension' && typeof tok.value === 'object' && !['px', 'rem'].includes(tok.value.unit)) errors.push(`${label}: ${id} unit must be px or rem`)
    if (tok.type === 'color' && typeof tok.value === 'object' && tok.value.colorSpace !== 'srgb') errors.push(`${label}: ${id} colour must be srgb`)
  }
  return errors
}

const errors = validate('base', base)
const generated = {}
for (const preset of presets) {
  generated[preset.name] = {}
  for (const mode of MODES) {
    for (const contrast of new Set([preset.contrast, 'high'])) {
      const resolved = resolveTheme(preset, mode, contrast)
      const key = `${mode}${contrast === preset.contrast ? '' : '-high'}`
      generated[preset.name][key] = resolved
      errors.push(...validate(`${preset.name}/${key}`, themeToDtcg(resolved)))
      for (const r of resolved.report) if (!r.pass) errors.push(`${preset.name}/${key}: ${r.fg} over ${r.over.join(' > ')} is ${r.ratio}:1 (needs ${r.min}:1)`)
    }
  }
}
const printGenerated = {}
for (const preset of printThemePresets) {
  printGenerated[preset.name] = {}
  for (const mode of MODES) {
    for (const contrast of ['default', 'high']) {
      const resolved = resolveTheme(preset, mode, contrast)
      const key = `${mode}${contrast === 'default' ? '' : '-high'}`
      printGenerated[preset.name][key] = resolved
      errors.push(...validate(`${preset.name}/${key}`, themeToDtcg(resolved)))
      for (const r of resolved.report) if (!r.pass) errors.push(`${preset.name}/${key}: ${r.fg} over ${r.over.join(' > ')} is ${r.ratio}:1 (needs ${r.min}:1)`)
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
if (checkOnly) {
  const count = Object.values(generated).reduce((n, m) => n + Object.keys(m).length, 0)
  const printCount = Object.values(printGenerated).reduce((n, m) => n + Object.keys(m).length, 0)
  console.log(`tokens: base valid; ${presets.length} presets, ${count} theme/mode/contrast sets generated; ${printThemePresets.length} print themes, ${printCount} sets; all contrast pairs pass WCAG 2.2 AA`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// 2-3. Style Dictionary
// ---------------------------------------------------------------------------

/** Fallback names for the static base sources. */
function tyName(path) {
  const [group, ...rest] = path
  switch (group) {
    case 'duration':
      return ['dur', ...rest].join('-')
    case 'ease':
      return rest[0] === 'enter' ? 'ease' : `ease-${rest[0] === 'exit' ? 'out' : rest.join('-')}`
    case 'font':
      return rest[0] === 'family' ? `font-${rest.slice(1).join('-')}` : ['font', ...rest].join('-')
    default:
      return path.join('-')
  }
}

const typeOf = (token) => token.$type ?? token.type
const valueOf = (token) => token.$value ?? token.value
const dim = (v) => (typeof v === 'object' ? `${v.value}${v.unit}` : String(v))

const hooks = {
  transforms: {
    'ty/name': {
      type: 'name',
      transform: (token) => (token.$extensions?.['br.com.datatechsolutions.tympan']?.cssName ?? `--ty-${tyName(token.path)}`).replace(/^--/, ''),
    },
    'ty/color': { type: 'value', filter: (t) => typeOf(t) === 'color', transform: (t) => toCss(fromDtcgColor(valueOf(t))) },
    'ty/dimension': {
      type: 'value',
      filter: (t) => typeOf(t) === 'dimension',
      // Letter spacing is authored in rem (DTCG allows px|rem) and emitted in em.
      transform: (t) => (t.path[0] === 'font' && t.path[1] === 'tracking' ? `${valueOf(t).value}em` : dim(valueOf(t))),
    },
    'ty/duration': { type: 'value', filter: (t) => typeOf(t) === 'duration', transform: (t) => dim(valueOf(t)) },
    'ty/number': { type: 'value', filter: (t) => ['number', 'fontWeight'].includes(typeOf(t)), transform: (t) => String(valueOf(t)) },
    'ty/font-family': {
      type: 'value',
      filter: (t) => typeOf(t) === 'fontFamily',
      transform: (t) => [].concat(valueOf(t)).map((f) => (/[\s\d]/.test(f) && !/^[\w-]+$/.test(f) ? `'${f}'` : f)).join(', '),
    },
    'ty/cubic-bezier': { type: 'value', filter: (t) => typeOf(t) === 'cubicBezier', transform: (t) => `cubic-bezier(${valueOf(t).join(', ')})` },
    'ty/shadow': {
      type: 'value',
      filter: (t) => typeOf(t) === 'shadow',
      transform: (t) =>
        shadowToCss(
          valueOf(t).map((l) => ({ x: l.offsetX.value, y: l.offsetY.value, blur: l.blur.value, spread: l.spread.value, inset: !!l.inset, color: fromDtcgColor(l.color) })),
        ),
    },
    'ty/gradient': {
      type: 'value',
      filter: (t) => typeOf(t) === 'gradient',
      transform: (t) => gradientToCss(t.$extensions?.['br.com.datatechsolutions.tympan']?.angle ?? 180, valueOf(t).map((s) => fromDtcgColor(s.color))),
    },
  },
  formats: {
    'ty/list': ({ dictionary }) => JSON.stringify(dictionary.allTokens.map((t) => [`--${t.name}`, String(t.$value ?? t.value)])),
    // Component tokens only: an alias becomes var(--referenced-name), wrapped in
    // color-mix when the token carries a mix extension.
    'ty/ref-list': ({ dictionary }) =>
      JSON.stringify(
        dictionary.allTokens
          .filter((t) => t.path[0] === 'flow')
          .map((t) => {
            const original = t.original.$value ?? t.original.value
            if (typeof original !== 'string' || !usesReferences(original)) return [`--${t.name}`, String(t.$value ?? t.value)]
            const [target] = getReferences(original, dictionary.tokens, { usesDtcg: true })
            const ref = `var(--${target.name})`
            const mix = t.$extensions?.['br.com.datatechsolutions.tympan']?.mix
            return [`--${t.name}`, mix ? `color-mix(in ${mix.space}, ${ref} ${Math.round(mix.amount * 10000) / 100}%, ${mix.with})` : ref]
          }),
      ),
  },
}
const TRANSFORMS = ['ty/name', 'ty/color', 'ty/dimension', 'ty/duration', 'ty/number', 'ty/font-family', 'ty/cubic-bezier', 'ty/shadow', 'ty/gradient']

async function sdVariables(tokens, format = 'ty/list') {
  const sd = new StyleDictionary({
    usesDtcg: true,
    tokens,
    hooks,
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: { css: { transforms: TRANSFORMS, files: [{ destination: 'vars.json', format }] } },
  })
  const [out] = await sd.formatPlatform('css')
  return JSON.parse(out.output)
}

// Style Dictionary sorts tokens by tree order; compare as maps.
function assertParity(label, fromSd, direct) {
  const a = new Map(fromSd)
  const b = new Map(direct)
  const problems = []
  for (const [k, v] of b) if (a.get(k) !== v) problems.push(`${k}: generator ${v} / style-dictionary ${a.get(k)}`)
  for (const k of a.keys()) if (!b.has(k)) problems.push(`${k}: only in style-dictionary output`)
  if (problems.length) throw new Error(`Parity failure in ${label}:\n${problems.slice(0, 20).join('\n')}`)
}
const orderLike = (list, reference) => {
  const m = new Map(list)
  return reference.map(([k]) => [k, m.get(k)])
}

rmSync(dist, { recursive: true, force: true })
mkdirSync(join(dist, 'dtcg'), { recursive: true })
writeFileSync(join(dist, 'dtcg', 'base.tokens.json'), JSON.stringify(base, null, 2) + '\n')
const baseVars = await sdVariables(base)

const themes = []
const json = { base: Object.fromEntries(baseVars), density: {}, themes: {} }
for (const preset of presets) {
  const entry = { name: preset.name }
  json.themes[preset.name] = {}
  for (const [key, resolved] of Object.entries(generated[preset.name])) {
    const tree = themeToDtcg(resolved)
    writeFileSync(join(dist, 'dtcg', `${preset.name}.${key}.tokens.json`), JSON.stringify(tree, null, 2) + '\n')
    const direct = themeVariables(resolved)
    const viaSd = orderLike(await sdVariables(tree), direct)
    assertParity(`${preset.name}/${key}`, viaSd, direct)
    const slot = { light: 'light', dark: 'dark', 'light-high': 'highLight', 'dark-high': 'highDark' }[key]
    entry[slot] = viaSd
    json.themes[preset.name][key] = Object.fromEntries(viaSd)
  }
  themes.push(entry)
}

const densities = {}
for (const d of DENSITY_NAMES) {
  const tree = densityToDtcg(d)
  writeFileSync(join(dist, 'dtcg', `density.${d}.tokens.json`), JSON.stringify(tree, null, 2) + '\n')
  const direct = densityVariables(d)
  const viaSd = orderLike(await sdVariables(tree), direct)
  assertParity(`density/${d}`, viaSd, direct)
  densities[d] = viaSd
  json.density[d] = Object.fromEntries(viaSd)
}

// Component tokens: resolved against the default theme tree (any theme has
// the same role names), emitted as references.
const flowTree = flowToDtcg()
writeFileSync(join(dist, 'dtcg', 'flow.tokens.json'), JSON.stringify(flowTree, null, 2) + '\n')
const flowDirect = flowVariables()
const flowVars = orderLike(await sdVariables({ ...themeToDtcg(generated[DEFAULT_THEME].light), ...flowTree }, 'ty/ref-list'), flowDirect)
assertParity('flow', flowVars, flowDirect)
json.components = Object.fromEntries(flowVars)

// ---------------------------------------------------------------------------
// 4. Stylesheet, JSON, values module, contrast report
// ---------------------------------------------------------------------------

const css = buildStylesheet({
  base: baseVars,
  themes,
  defaultTheme: DEFAULT_THEME,
  densities,
  components: flowVars,
  componentRules: `/* flow tones: [data-tone] selects the four tone parts */\n${flowToneRules()}`,
  banner: '/* @datatechsolutions/tympan-tokens (FSL-1.1-ALv2): generated by scripts/build.mjs from src/base/*.tokens.json, src/presets.ts and src/flow.ts. Do not edit. */',
})
writeFileSync(join(dist, 'tokens.css'), css)
writeFileSync(join(dist, 'tokens.json'), JSON.stringify(json, null, 2) + '\n')

const names = (rec) => Object.keys(rec)
const union = (xs) => (xs.length ? xs.map((x) => JSON.stringify(x)).join(' | ') : 'never')
const themeNames = names(json.themes[DEFAULT_THEME].light)
writeFileSync(
  join(dist, 'values.js'),
  `// Generated by @datatechsolutions/tympan-tokens scripts/build.mjs. Do not edit. FSL-1.1-ALv2 licence.\nexport const values = ${JSON.stringify(json, null, 2)};\n` +
    `export function cssVar(name, fallback) {\n  const n = name.startsWith('--') ? name : \`--\${name}\`;\n  return fallback === undefined ? \`var(\${n})\` : \`var(\${n}, \${fallback})\`;\n}\n`,
)
writeFileSync(
  join(dist, 'values.d.ts'),
  `// Generated by @datatechsolutions/tympan-tokens scripts/build.mjs. Do not edit. FSL-1.1-ALv2 licence.\n` +
    `export type BaseTokenName = ${union(names(json.base))};\n` +
    `export type ThemeTokenName = ${union(themeNames)};\n` +
    `export type DensityTokenName = ${union(names(json.density.default))};\n` +
    `export type ComponentTokenName = ${union(names(json.components))};\n` +
    `export type TokenName = BaseTokenName | ThemeTokenName | DensityTokenName | ComponentTokenName;\n` +
    `export type PresetName = ${union(presets.map((p) => p.name))};\n` +
    `export declare const values: {\n  base: Record<BaseTokenName, string>;\n  density: Record<'default' | 'compact' | 'comfortable', Record<DensityTokenName, string>>;\n  components: Record<ComponentTokenName, string>;\n` +
    `  themes: Record<PresetName, Partial<Record<'light' | 'dark' | 'light-high' | 'dark-high', Record<ThemeTokenName, string>>>>;\n};\n` +
    `export declare function cssVar(name: TokenName, fallback?: string): string;\n`,
)

// ---------------------------------------------------------------------------
// 6. Print themes (opt-in)
// ---------------------------------------------------------------------------

const printBanner = (what) =>
  `/* @datatechsolutions/tympan-tokens (FSL-1.1-ALv2): ${what}, generated by scripts/build.mjs from src/print-themes.ts. Load after tokens.css. Do not edit. */`
mkdirSync(join(dist, 'dtcg', 'print'), { recursive: true })
mkdirSync(join(dist, 'print-themes'), { recursive: true })
const printThemes = []
for (const preset of printThemePresets) {
  const entry = { name: preset.name }
  for (const [key, resolved] of Object.entries(printGenerated[preset.name])) {
    const tree = themeToDtcg(resolved)
    // DTCG trees for light and dark; the high-contrast variants regenerate from the same config.
    if (!key.endsWith('-high')) writeFileSync(join(dist, 'dtcg', 'print', `${preset.name}.${key}.tokens.json`), JSON.stringify(tree, null, 2) + '\n')
    const direct = themeVariables(resolved)
    const viaSd = orderLike(await sdVariables(tree), direct)
    assertParity(`${preset.name}/${key}`, viaSd, direct)
    entry[{ light: 'light', dark: 'dark', 'light-high': 'highLight', 'dark-high': 'highDark' }[key]] = viaSd
  }
  printThemes.push(entry)
  writeFileSync(join(dist, 'print-themes', `${preset.name}.css`), generatePrintThemesCss([], { themes: [entry], banner: printBanner(`print theme ${preset.name}`) }))
}
writeFileSync(join(dist, 'print-themes.css'), generatePrintThemesCss([], { themes: printThemes, banner: printBanner('print themes (opt-in)') }))
writeFileSync(
  join(dist, 'print-themes.json'),
  JSON.stringify(
    printThemePresets.map((p) => ({ name: p.name, label: p.label, fontsUrl: p.fontsUrl ?? null, css: `print-themes/${p.name}.css` })),
    null,
    2,
  ) + '\n',
)

// The theme catalogue: every theme a host can select, in menu order (the
// built-in presets, then the print themes), with its label, whether it
// needs print-themes.css, and the font stylesheet it names. Custom
// elements (the theme palette) read it.
writeFileSync(
  join(dist, 'themes.json'),
  JSON.stringify(
    [
      ...presets.map((p) => ({ name: p.name, label: p.label ?? p.name, kind: 'preset', fontsUrl: p.fontsUrl ?? null })),
      ...printThemePresets.map((p) => ({ name: p.name, label: p.label ?? p.name, kind: 'print', fontsUrl: p.fontsUrl ?? null })),
    ],
    null,
    2,
  ) + '\n',
)

const lines = ['# Contrast report', '', 'Generated by `scripts/build.mjs`. WCAG 2.2 ratio decides pass/fail (4.5:1 text, 3:1 UI and focus). APCA Lc is informational.', '']
for (const preset of presets) {
  for (const [key, resolved] of Object.entries(generated[preset.name])) {
    lines.push(`## ${preset.name} / ${key}`, '', '| foreground | over | kind | WCAG | min | APCA Lc |', '|---|---|---|---|---|---|')
    for (const r of resolved.report) lines.push(`| ${r.fg} | ${r.over.join(' > ')} | ${r.kind} | ${r.ratio} | ${r.min} | ${r.apca} |`)
    lines.push('')
  }
}
for (const preset of printThemePresets) {
  for (const [key, resolved] of Object.entries(printGenerated[preset.name])) {
    lines.push(`## ${preset.name} / ${key} (print theme)`, '', '| foreground | over | kind | WCAG | min | APCA Lc |', '|---|---|---|---|---|---|')
    for (const r of resolved.report) lines.push(`| ${r.fg} | ${r.over.join(' > ')} | ${r.kind} | ${r.ratio} | ${r.min} | ${r.apca} |`)
    lines.push('')
  }
}
writeFileSync(join(dist, 'contrast-report.md'), lines.join('\n'))

console.log(`tokens: wrote dist/tokens.css (${baseVars.length} base, ${themeNames.length} per theme/mode, ${presets.length} presets, ${flowVars.length} component, parity with generator verified), tokens.json, themes.json, values.js, dtcg/, contrast-report.md; print-themes.css and print-themes/ (${printThemePresets.length} opt-in print themes, parity verified)`)
