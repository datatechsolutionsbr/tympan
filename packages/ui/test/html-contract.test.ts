// The HTML contract (docs/html-contract.md) is what non-React hosts emit, so
// every class and custom property it names must exist in the shipped CSS, and
// the native-state rules must never reach markup React Aria renders.
import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

/** src/styles.css with its relative imports inlined (the same walk as scripts/build-css.mjs). */
function bundled(file: string, seen = new Set<string>()): string {
  if (seen.has(file)) return ''
  seen.add(file)
  return readFileSync(file, 'utf8').replace(/@import\s+['"]([^'"]+)['"]\s*;/g, (_, spec: string) =>
    bundled(spec.startsWith('.') ? resolve(dirname(file), spec) : require.resolve(spec), seen),
  )
}

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? tsxFiles(join(dir, e.name)) : /\.tsx?$/.test(e.name) && !/\.test\./.test(e.name) ? [join(dir, e.name)] : [],
  )
}

const css = bundled(join(pkg, 'src', 'styles.css'))
const doc = readFileSync(join(pkg, 'docs', 'html-contract.md'), 'utf8')
const blocks = [...doc.matchAll(/```html\n([\s\S]*?)```/g)].map((m) => m[1]!)

describe('HTML contract', () => {
  it('has markup examples', () => {
    expect(blocks.length).toBeGreaterThan(25)
  })

  it('names only classes the stylesheet defines or the React components render', () => {
    const defined = new Set([...css.matchAll(/\.(ty-[\w-]+)/g)].map((m) => m[1]))
    // Hooks without rules of their own (ty-status__label, …) are still part of the markup.
    for (const file of tsxFiles(join(pkg, 'src'))) for (const m of readFileSync(file, 'utf8').matchAll(/['" ](ty-[a-z][\w-]*)/g)) defined.add(m[1])
    const named = new Set(blocks.flatMap((b) => [...b.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]!.split(/\s+/).filter(Boolean))))
    const missing = [...named].filter((c) => !defined.has(c))
    expect(missing).toEqual([])
  })

  it('names only custom properties the token or component CSS defines', () => {
    const defined = new Set([...css.matchAll(/(--ty-[\w-]+)\s*:/g)].map((m) => m[1]))
    const expanded = [...doc.matchAll(/`(--ty-[\w-]*)(?:\{([\w,-]+)\})?([\w-]*)`/g)].flatMap((m) =>
      m[2] ? m[2].split(',').map((part) => `${m[1]}${part}${m[3]}`) : [`${m[1]}${m[3]}`],
    )
    const ranges = [...doc.matchAll(/`(--ty-[\w-]+-)1` … `\1(\d)`/g)].flatMap((m) => Array.from({ length: Number(m[2]) }, (_, i) => `${m[1]}${i + 1}`))
    const missing = [...new Set([...expanded, ...ranges])].filter((n) => !n.endsWith('-') && !defined.has(n))
    expect(missing).toEqual([])
  })

  it('scopes every native-state rule away from React Aria markup', () => {
    const native = readFileSync(join(pkg, 'src', 'native-states.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...native.matchAll(/([^{}@;]+)\{/g)].map((m) => m[1]!.trim()).filter((s) => s && !/^(layer|media|supports)\b/.test(s) && !/^\(/.test(s))
    expect(selectors.length).toBeGreaterThan(40)
    for (const list of selectors) for (const one of list.split(/,(?![^()]*\))/)) expect(one.trim(), one.trim()).toMatch(/:not\(\[data-rac\]/)
  })

  it('is part of the shipped stylesheet', () => {
    expect(readFileSync(join(pkg, 'src', 'styles.css'), 'utf8')).toMatch(/@import '\.\/native-states\.css';\s*$/)
  })
})
