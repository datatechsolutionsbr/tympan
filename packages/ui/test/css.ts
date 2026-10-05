// Reads a component stylesheet so tests can assert CSS contracts that jsdom
// cannot compute (hit areas, reduced motion, forced colours, layers).
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')

/** `cssOf('components/button/Button.css')` */
export function cssOf(relativeToSrc: string): string {
  return readFileSync(join(srcDir, relativeToSrc), 'utf8')
}

/** Returns the body of the first `@media <query>` block (brace-balanced), or ''. */
export function mediaBlock(css: string, query: RegExp, atRule = '@media'): string {
  const re = new RegExp(`${atRule}\\s*${query.source}[^{]*\\{`, 'g')
  const m = re.exec(css)
  if (!m) return ''
  let depth = 1
  let i = m.index + m[0].length
  const start = i
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') depth--
    i++
  }
  return css.slice(start, i - 1)
}
