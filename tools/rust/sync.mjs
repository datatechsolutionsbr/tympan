// Copies the JavaScript build's outputs the Rust crates embed into
// crates/tympan-tokens/generated/, so `cargo build` needs no Node.
//
// Usage: node tools/rust/sync.mjs [--check]   (after `npm run build`)
// --check writes nothing and exits 1 when a copy differs from the build.
//
// Where each output comes from is listed here and nowhere else: when the
// tokens move into packages/ui (refactor/tokens-into-ui), change SOURCES.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const check = process.argv.includes('--check')
const target = join(root, 'crates', 'tympan-tokens', 'generated')

/** generated file name -> path of the build output it copies. */
export const SOURCES = {
  'tokens.css': 'packages/tokens/dist/tokens.css',
  'tokens.json': 'packages/tokens/dist/tokens.json',
  'themes.json': 'packages/tokens/dist/themes.json',
  'print-themes.css': 'packages/tokens/dist/print-themes.css',
  'styles.css': 'packages/ui/dist/styles.css',
  'elements.js': 'packages/ui/dist/elements.bundle.js',
}

let stale = 0
mkdirSync(target, { recursive: true })
for (const [name, source] of Object.entries(SOURCES)) {
  const from = join(root, source)
  if (!existsSync(from)) {
    console.error(`rust: ${source} is missing; run npm run build first`)
    process.exit(1)
  }
  const to = join(target, name)
  const same = existsSync(to) && readFileSync(to).equals(readFileSync(from))
  if (same) continue
  if (check) {
    console.error(`rust: crates/tympan-tokens/generated/${name} differs from ${source} (run node tools/rust/sync.mjs)`)
    stale++
  } else copyFileSync(from, to)
}
if (stale) process.exit(1)
console.log(`rust: ${check ? 'checked' : 'synced'} ${Object.keys(SOURCES).length} files into crates/tympan-tokens/generated`)
