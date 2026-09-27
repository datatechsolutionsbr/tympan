// Bundles the stylesheets: src/styles.css into dist/styles.css (inlines
// relative @imports and the @datatechsolutions/tympan-tokens stylesheet, keeps
// the leading @layer order statement) and src/flow/styles.css into
// dist/flow.css (the flow canvas; hosts import it after styles.css).
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

for (const [from, to] of [
  ['styles.css', 'styles.css'],
  ['flow/styles.css', 'flow.css'],
]) {
  const out = inline(join(pkg, 'src', from))
  if (/@import/.test(out.replace(/\/\*[\s\S]*?\*\//g, ''))) throw new Error(`Unresolved @import left in dist/${to}`)
  mkdirSync(join(pkg, 'dist'), { recursive: true })
  writeFileSync(join(pkg, 'dist', to), out)
  console.log(`ui: wrote dist/${to} (${Math.round(out.length / 1024)} kB)`)
}
