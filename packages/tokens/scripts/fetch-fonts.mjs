// Downloads every web font the Tympan themes name into packages/tokens/fonts/.
// Not part of the normal build: run it by hand when a theme adds or changes a
// family, review the diff and commit the result.
//
//   node scripts/fetch-fonts.mjs
//
// What it fetches: CORE_FONT_SPECS (the base stacks and the per-script Noto
// families, src/fonts.ts) and the Google Fonts specs of every print style
// (src/print-presets.ts). For each spec it asks the Google Fonts css2 API with
// a modern browser user agent, which answers with woff2 files sliced by
// unicode-range (the CJK families in ~100 slices each), downloads every
// file once (variable files are shared by all weights), and fetches the
// family's licence and METADATA.pb from the google/fonts repository.
//
// Output:
//   fonts/<family-slug>/*.woff2       the font files
//   fonts/<family-slug>/<licence>.txt OFL.txt, LICENSE.txt (Apache-2.0) or UFL.txt
//   fonts/manifest.json               families (licence, version, origin, size),
//                                     faces (family, style, weights, unicode-range,
//                                     file) and the faces of each spec
// scripts/build.mjs turns the manifest into @font-face rules.

import { createHash } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CORE_FONT_SPECS, printPresets } from '../src/index.ts'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'fonts')
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const printSpecs = [...new Set(Object.values(printPresets).flatMap((p) => p.googleFonts))]
const specs = [...new Set([...CORE_FONT_SPECS, ...printSpecs])].sort()

const slugOf = (family) => family.toLowerCase().replace(/[^a-z0-9]+/g, '')

async function get(url, as = 'text') {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`${res.status} ${url}`)
      return as === 'text' ? await res.text() : Buffer.from(await res.arrayBuffer())
    } catch (err) {
      if (attempt >= 4) throw err
      await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }
}

async function pool(items, size, fn) {
  const results = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++
        results[i] = await fn(items[i], i)
      }
    }),
  )
  return results
}

/** Parses a css2 response into faces: { subset, family, style, weight, url, unicodeRange }. */
function parseCss(css) {
  const faces = []
  const re = /(?:\/\*\s*([^*]+?)\s*\*\/\s*)?@font-face\s*\{([^}]*)\}/g
  for (const m of css.matchAll(re)) {
    const body = m[2]
    const prop = (name) => new RegExp(`${name}:\\s*([^;]+);`).exec(body)?.[1].trim()
    faces.push({
      subset: (m[1] ?? 'all').replace(/[^a-z0-9-]+/gi, ''),
      family: prop('font-family').replace(/^['"]|['"]$/g, ''),
      style: prop('font-style') ?? 'normal',
      weight: Number(prop('font-weight') ?? 400),
      url: /url\(([^)]+)\)/.exec(prop('src'))[1],
      unicodeRange: prop('unicode-range') ?? null,
    })
  }
  return faces
}

// 1. The css2 sheets.
console.log(`fetch-fonts: ${specs.length} specs`)
const sheets = await pool(specs, 8, async (spec) => {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(spec).replace(/%20/g, '+')}&display=swap`
  const css = await get(url)
  if (!css) throw new Error(`Google Fonts has no ${spec}`)
  return parseCss(css)
})

// 2. One face per (family, style, file); weights are the union over specs.
const byUrl = new Map()
const specFaces = {}
specs.forEach((spec, i) => {
  const ids = new Set()
  for (const f of sheets[i]) {
    const key = `${f.family}|${f.style}|${f.url}`
    let face = byUrl.get(key)
    if (!face) byUrl.set(key, (face = { ...f, weights: new Set() }))
    face.weights.add(f.weight)
    ids.add(key)
  }
  specFaces[spec] = [...ids]
})

// File names: <slug>-<style>-<subset>[-<weights>].woff2, stable and readable.
const faces = [...byUrl.values()]
const taken = new Map()
for (const f of faces) {
  const slug = slugOf(f.family)
  const base = `${slug}-${f.style}-${f.subset}`
  taken.set(base, (taken.get(base) ?? 0) + 1)
}
for (const f of faces) {
  const base = `${slugOf(f.family)}-${f.style}-${f.subset}`
  f.weights = [...f.weights].sort((a, b) => a - b)
  f.name = taken.get(base) > 1 ? `${base}-${f.weights.join('_')}` : base
}
// Unlabelled slices (the CJK families) still share a name: number them in sheet order.
const counts = new Map()
for (const f of faces) counts.set(f.name, (counts.get(f.name) ?? 0) + 1)
const seq = new Map()
for (const f of faces) {
  if (counts.get(f.name) > 1) {
    const n = seq.get(f.name) ?? 0
    seq.set(f.name, n + 1)
    f.name = `${f.name}-${String(n).padStart(3, '0')}`
  }
  f.file = `${slugOf(f.family)}/${f.name}.woff2`
}

// 3. Download.
rmSync(out, { recursive: true, force: true })
const families = {}
for (const f of faces) {
  const slug = slugOf(f.family)
  mkdirSync(join(out, slug), { recursive: true })
  const fam = (families[f.family] ??= { slug, version: /\/s\/[^/]+\/(v\d+)\//.exec(f.url)?.[1] ?? null, files: 0, bytes: 0 })
  fam.files++
}
let done = 0
await pool(faces, 16, async (f) => {
  const buf = await get(f.url, 'buffer')
  if (!buf) throw new Error(`missing ${f.url}`)
  writeFileSync(join(out, f.file), buf)
  f.sha256 = createHash('sha256').update(buf).digest('hex').slice(0, 16)
  f.bytes = buf.length
  families[f.family].bytes += buf.length
  if (++done % 200 === 0) console.log(`fetch-fonts: ${done}/${faces.length} files`)
})

// 4. Licences from github.com/google/fonts.
const REPO = 'https://raw.githubusercontent.com/google/fonts/main'
await pool(Object.entries(families), 8, async ([family, fam]) => {
  for (const dir of ['ofl', 'apache', 'ufl']) {
    const meta = await get(`${REPO}/${dir}/${fam.slug}/METADATA.pb`)
    if (!meta) continue
    const license = /license:\s*"([^"]+)"/.exec(meta)?.[1] ?? dir.toUpperCase()
    const designer = /designer:\s*"([^"]+)"/.exec(meta)?.[1] ?? null
    for (const file of ['OFL.txt', 'LICENSE.txt', 'UFL.txt']) {
      const text = await get(`${REPO}/${dir}/${fam.slug}/${file}`)
      if (text) {
        writeFileSync(join(out, fam.slug, file), text)
        Object.assign(fam, { license: { OFL: 'OFL-1.1', APACHE2: 'Apache-2.0', UFL: 'UFL-1.0' }[license] ?? license, licenseFile: `${fam.slug}/${file}`, designer, repository: `https://github.com/google/fonts/tree/main/${dir}/${fam.slug}` })
        return
      }
    }
  }
  throw new Error(`no licence found for ${family}`)
})

const manifest = {
  $comment: 'Generated by scripts/fetch-fonts.mjs. Do not edit; rerun the script.',
  fetched: new Date().toISOString().slice(0, 10),
  origin: 'Google Fonts css2 API (fonts.googleapis.com, woff2 sliced by unicode-range), files from fonts.gstatic.com; licences from github.com/google/fonts',
  families: Object.fromEntries(Object.entries(families).sort(([a], [b]) => a.localeCompare(b))),
  faces: Object.fromEntries(
    faces.map((f) => [`${f.family}|${f.style}|${f.file}`, { family: f.family, style: f.style, weights: f.weights, unicodeRange: f.unicodeRange, file: f.file, bytes: f.bytes, sha256: f.sha256 }]),
  ),
  specs: Object.fromEntries(specs.map((s) => [s, specFaces[s].map((k) => { const f = byUrl.get(k); return `${f.family}|${f.style}|${f.file}` })])),
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n')
// THIRD_PARTY_NOTICES.md of the tokens package: one row per bundled family.
const mb = (n) => `${(n / 1048576).toFixed(2)} MB`
const rows = Object.entries(manifest.families).map(([family, f]) => `| ${family} | ${f.version ?? ''} | ${f.license} | ${f.designer ?? ''} | ${f.files} | ${mb(f.bytes)} | \`fonts/${f.licenseFile}\` |`)
writeFileSync(
  join(here, '..', 'THIRD_PARTY_NOTICES.md'),
  [
    '# Third-party notices',
    '',
    '`@datatechsolutions/tympan-tokens` is licensed under FSL-1.1-ALv2 (Copyright 2026 Natalia Mesquita).',
    'It bundles the font files below, unmodified, in `fonts/` (generated by `scripts/fetch-fonts.mjs`;',
    `fetched ${manifest.fetched} from the Google Fonts css2 API as woff2 sliced by unicode-range).`,
    'Each family keeps its own licence, shipped next to its files. The SIL Open Font License 1.1',
    'allows bundling and redistribution with software; the fonts may not be sold by themselves,',
    'and Reserved Font Names apply to modified versions (none here are modified).',
    'Font-file sizes: see `fonts/manifest.json`.',
    '',
    '| Family | Version (gstatic) | Licence | Designer | Files | Size | Licence file |',
    '|---|---|---|---|---|---|---|',
    ...rows,
    '',
    `Total: ${Object.keys(manifest.families).length} families, ${faces.length} files, ${mb(faces.reduce((n, f) => n + f.bytes, 0))}.`,
    '',
  ].join('\n'),
)

const total = faces.reduce((n, f) => n + f.bytes, 0)
console.log(`fetch-fonts: ${Object.keys(families).length} families, ${faces.length} files, ${(total / 1048576).toFixed(1)} MB in fonts/`)
