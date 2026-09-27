// Drops the source maps of the flag chunks (dist/flags/**): each chunk is one
// generated SVG string, so its map would only double the package size.
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'flags')
let count = 0
let bytes = 0
for (const aspect of readdirSync(root)) {
  const dir = join(root, aspect)
  for (const name of readdirSync(dir)) {
    const file = join(dir, name)
    if (name.endsWith('.map')) {
      rmSync(file)
      count++
    } else if (name.endsWith('.js')) {
      writeFileSync(file, readFileSync(file, 'utf8').replace(/\n\/\/# sourceMappingURL=\S+\s*$/, '\n'))
      bytes += statSync(file).size
    }
  }
}
console.log(`ui: dist/flags holds ${Math.round(bytes / 1024)} kB of flag chunks (${count} source maps dropped)`)
