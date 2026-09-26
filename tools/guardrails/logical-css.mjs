// check:logical-css — Tympan supports right-to-left scripts, so layout CSS in
// packages/tokens, packages/ui and packages/flow uses logical properties only.
// Fails on physical left/right properties and values:
//  - margin-left/right, padding-left/right, border-left/right(-*),
//    border-*-left/right-radius, scroll-margin/padding-left/right, left:, right:;
//  - text-align: left|right, float: left|right, clear: left|right;
//  - inset shorthands and translate/transform are not inspected (use
//    inset-inline-*, and mirror translations under [dir='rtl'] or :dir(rtl)).
// A true physical case is allowed when the same line, or the line above,
// carries a comment containing `physical:` with the reason.
import { basename } from 'node:path'
import { lineOf, read, rel, report, walk } from './lib.mjs'

const problems = []
const RULES = [
  [/(^|[\s;{])((?:margin|padding|scroll-margin|scroll-padding)-(?:left|right))\s*:/g, 'use the -inline-start/-inline-end property'],
  [/(^|[\s;{])(border-(?:left|right)(?:-(?:width|style|color))?)\s*:/g, 'use border-inline-start/-end'],
  [/(^|[\s;{])(border-(?:top|bottom)-(?:left|right)-radius)\s*:/g, 'use border-start-start-radius and friends'],
  [/(^|[\s;{])((?:left|right))\s*:/g, 'use inset-inline-start/-end'],
  [/(^|[\s;{])(text-align\s*:\s*(?:left|right))\b/g, 'use text-align: start/end'],
  [/(^|[\s;{])((?:float|clear)\s*:\s*(?:left|right))\b/g, 'use inline-start/inline-end'],
]

function allowed(lines, lineNo) {
  const here = lines[lineNo - 1] ?? ''
  const above = lines[lineNo - 2] ?? ''
  return /physical:/.test(here) || /physical:/.test(above)
}

for (const file of walk()) {
  if (!/\.css$/.test(basename(file))) continue
  // Strip comments but keep offsets (so line numbers stay right).
  const raw = read(file)
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
  const lines = raw.split('\n')
  for (const [re, hint] of RULES) {
    for (const m of text.matchAll(re)) {
      const at = m.index + m[1].length
      const line = lineOf(text, at)
      // Skip selectors such as `:not(.x)` or media features (min-width) that are not declarations.
      const decl = text.slice(text.lastIndexOf('\n', at) + 1, text.indexOf('\n', at))
      if (/^\s*@/.test(decl) || /\{\s*$/.test(decl) && !/:\s*[^{]*;/.test(decl)) continue
      if (allowed(lines, line)) continue
      problems.push(`${rel(file)}:${line} ${m[2].trim()} (${hint})`)
    }
  }
}

report('check:logical-css', problems)
