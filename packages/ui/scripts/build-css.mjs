// Bundles src/styles.css into dist/styles.css: inlines relative @imports and
// the @datatechsolutions/tympan-tokens stylesheet, keeps the leading @layer order statement.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = join(here, '..')
const require = createRequire(join(pkg, 'package.json'))

function inline(file, seen = new Set()) {
  if (seen.has(file)) return ''
  seen.add(file)
  const css = readFileSync(file, 'utf8')
  return css.replace(/@import\s+['"]([^'"]+)['"]\s*;/g, (_, spec) => {
    const target = spec.startsWith('.') ? resolve(dirname(file), spec) : require.resolve(spec)
    return `/* ${spec} */\n${inline(target, seen)}`
  })
}

const out = inline(join(pkg, 'src', 'styles.css'))
if (/@import/.test(out.replace(/\/\*[\s\S]*?\*\//g, ''))) throw new Error('Unresolved @import left in dist/styles.css')
mkdirSync(join(pkg, 'dist'), { recursive: true })
writeFileSync(join(pkg, 'dist', 'styles.css'), out)
console.log(`ui: wrote dist/styles.css (${Math.round(out.length / 1024)} kB)`)
