// Shared helpers for the clean-room guardrails.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = join(fileURLToPath(import.meta.url), '..', '..', '..')
export const SCANNED_PACKAGES = ['packages/tokens', 'packages/fonts-cjk', 'packages/ui', 'packages/print', 'apps/site']
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-gallery', 'coverage', '.turbo', 'shots'])

/** Every file under the scanned packages (source, docs, config), skipping build output. */
export function* walk(dir = null) {
  const roots = dir ? [dir] : SCANNED_PACKAGES.map((p) => join(repoRoot, p))
  for (const root of roots) {
    let entries
    try {
      entries = readdirSync(root)
    } catch {
      continue
    }
    for (const name of entries) {
      if (SKIP_DIRS.has(name)) continue
      const full = join(root, name)
      if (statSync(full).isDirectory()) yield* walk(full)
      else yield full
    }
  }
}

export const rel = (file) => relative(repoRoot, file)
export const read = (file) => readFileSync(file, 'utf8')

/** 1-based line number of a string offset. */
export function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

export function report(name, problems) {
  if (problems.length) {
    console.error(`${name}: ${problems.length} problem(s)`)
    for (const p of problems) console.error(`  ${p}`)
    process.exit(1)
  }
  console.log(`${name}: ok`)
}
