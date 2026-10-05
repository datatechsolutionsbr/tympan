// Bundles the stylesheets: src/styles.css into dist/styles.css (inlines
// relative @imports and the @datatechsolutions/tympan-tokens stylesheet, keeps
// the leading @layer order statement) and src/flow/styles.css into
// dist/flow.css (the flow canvas; hosts import it after styles.css).
//
// The one @import kept is the tokens package's fonts.css (the @font-face rules
// of the bundled fonts): its url()s are relative to that package's fonts/
// folder, so it stays an import of `@datatechsolutions/tympan-tokens/fonts.css`
// that the host's bundler resolves and rebases, instead of copying ~55 MB of
// font files into this package. It is placed right after the @layer statement,
// where CSS allows @import.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = join(here, '..')
const require = createRequire(join(pkg, 'package.json'))

const tokensDist = dirname(require.resolve('@datatechsolutions/tympan-tokens/tokens.css'))
const FONTS_IMPORT = "@import '@datatechsolutions/tympan-tokens/fonts.css';"

function inline(file, seen = new Set(), hoisted = new Set()) {
  if (seen.has(file)) return ''
  seen.add(file)
  const css = readFileSync(file, 'utf8')
  return css.replace(/@import\s+['"]([^'"]+)['"]\s*;\n?/g, (_, spec) => {
    if (dirname(file) === tokensDist && spec === './fonts.css') {
      hoisted.add(FONTS_IMPORT)
      return ''
    }
    const target = spec.startsWith('.') ? resolve(dirname(file), spec) : require.resolve(spec)
    return `/* ${spec} */\n${inline(target, seen, hoisted)}\n`
  })
}

for (const [from, to] of [
  ['styles.css', 'styles.css'],
  ['flow/styles.css', 'flow.css'],
]) {
  const hoisted = new Set()
  let out = inline(join(pkg, 'src', from), new Set(), hoisted)
  if (/@import/.test(out.replace(/\/\*[\s\S]*?\*\//g, ''))) throw new Error(`Unresolved @import left in dist/${to}`)
  if (hoisted.size) {
    const layer = /^@layer [^{;]+;\n/m.exec(out)
    if (!layer) throw new Error(`dist/${to}: no leading @layer statement to place the fonts import after`)
    const at = layer.index + layer[0].length
    out = `${out.slice(0, at)}${[...hoisted].join('\n')}\n${out.slice(at)}`
  }
  mkdirSync(join(pkg, 'dist'), { recursive: true })
  writeFileSync(join(pkg, 'dist', to), out)
  console.log(`ui: wrote dist/${to} (${Math.round(out.length / 1024)} kB)`)
}
