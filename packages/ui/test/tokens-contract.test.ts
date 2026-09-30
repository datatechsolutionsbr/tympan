// Every custom property a component reads must exist: either in the token
// stylesheet of @datatechsolutions/tympan-tokens or declared by the component itself.
import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const require = createRequire(import.meta.url)

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? cssFiles(join(dir, e.name)) : e.name.endsWith('.css') && e.name !== 'styles.css' ? [join(dir, e.name)] : [],
  )
}

describe('token contract', () => {
  const tokensCss = readFileSync(require.resolve('@datatechsolutions/tympan-tokens/tokens.css'), 'utf8')
  const defined = new Set([...tokensCss.matchAll(/(--ty-[\w-]+)\s*:/g)].map((m) => m[1]))

  it('the token stylesheet was built', () => {
    expect(defined.size).toBeGreaterThan(200)
  })

  for (const file of cssFiles(src)) {
    it(`${file.slice(src.length + 1)} only reads defined --ty-* properties`, () => {
      const css = readFileSync(file, 'utf8')
      // Component-scoped properties may also be set inline from the sibling TSX.
      const siblings = readdirSync(dirname(file))
        .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
        .map((f) => readFileSync(join(dirname(file), f), 'utf8'))
        .join('\n')
      const local = new Set([...css.matchAll(/(--ty-[\w-]+)\s*:/g)].map((m) => m[1]))
      // native-states.css restyles other components' markup, so it may read their own properties.
      if (file.endsWith('native-states.css')) for (const other of cssFiles(src)) for (const m of readFileSync(other, 'utf8').matchAll(/(--ty-[\w-]+)\s*:/g)) local.add(m[1])
      for (const m of siblings.matchAll(/['"](--ty-[\w-]+)['"]/g)) local.add(m[1])
      const used = [...new Set([...css.matchAll(/var\(\s*(--ty-[\w-]+)/g)].map((m) => m[1]!))]
      const missing = used.filter((n) => !defined.has(n) && !local.has(n))
      expect(missing).toEqual([])
    })
  }
})
