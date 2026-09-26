// Bundles src/styles.css into dist/styles.css by inlining its relative
// @imports. The design-system and token stylesheets are not inlined: hosts
// import '@fakhir/design-system/styles.css' once, before this file.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..')

function flatten(file, visited = new Set()) {
  if (visited.has(file)) return ''
  visited.add(file)
  return readFileSync(file, 'utf8').replace(/@import\s+['"](\.[^'"]+)['"]\s*;/g, (_, rel) => {
    const target = resolve(dirname(file), rel)
    return `/* ${rel} */\n${flatten(target, visited)}`
  })
}

const css = flatten(join(pkgDir, 'src', 'styles.css'))
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
if (/@import/.test(stripped)) throw new Error('flow-canvas: an @import was left unresolved in dist/styles.css')
mkdirSync(join(pkgDir, 'dist'), { recursive: true })
writeFileSync(join(pkgDir, 'dist', 'styles.css'), css)
console.log(`flow-canvas: wrote dist/styles.css (${Math.round(css.length / 1024)} kB)`)
