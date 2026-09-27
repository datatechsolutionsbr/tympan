// check:no-utility-css — the clean-room library must stay free of utility-class
// CSS frameworks. Fails on (the forbidden patterns are listed below):
//  - any forbidden utility-CSS or class-variance-authority dependency in
//    the package.json of packages/tokens, packages/ui (with the flow canvas)
//    or packages/print, or in their package-lock.json entries;
//  - shadcn registry files (components.json);
//  - utility-framework at-rules in CSS (CSS_DIRECTIVE below);
//  - utility-class tokens in className strings of TS/TSX files: every static
//    class token must be a ty- prefixed name.
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import { lineOf, read, rel, repoRoot, report, SCANNED_PACKAGES, walk } from './lib.mjs'

const problems = []
const FORBIDDEN_DEP = /tailwind|class-variance-authority|^cva$|shadcn/i

// 1. package.json files
for (const pkg of SCANNED_PACKAGES) {
  const file = join(repoRoot, pkg, 'package.json')
  if (!existsSync(file)) continue
  const json = JSON.parse(read(file))
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'peerDependenciesMeta']) {
    for (const name of Object.keys(json[field] ?? {})) {
      if (FORBIDDEN_DEP.test(name)) problems.push(`${pkg}/package.json: ${field} contains ${name}`)
    }
  }
}

// 2. lockfile entries of these workspaces (direct deps and nested installs)
const lockFile = join(repoRoot, 'package-lock.json')
if (existsSync(lockFile)) {
  const lock = JSON.parse(read(lockFile))
  for (const [path, entry] of Object.entries(lock.packages ?? {})) {
    const own = SCANNED_PACKAGES.includes(path)
    const nested = SCANNED_PACKAGES.some((p) => path.startsWith(`${p}/node_modules/`))
    if (!own && !nested) continue
    if (nested && FORBIDDEN_DEP.test(path.split('node_modules/').pop())) problems.push(`package-lock.json: ${path}`)
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const name of Object.keys(entry[field] ?? {})) {
        if (FORBIDDEN_DEP.test(name)) problems.push(`package-lock.json: ${path} ${field} contains ${name}`)
      }
    }
  }
}

// 3. files
const CSS_DIRECTIVE = /@(tailwind|apply|theme|config|utility|variant|custom-variant)\b/g
const UTILITY = /^(?:[a-z-]+:)*-?(?:p[xytrblse]?|m[xytrblse]?|w|h|size|gap(?:-[xy])?|text|bg|rounded(?:-[a-z]+)?|flex|grid|items|justify|content|self|place|border(?:-[xytrbl])?|shadow|font|leading|tracking|min-w|max-w|min-h|max-h|space-[xy]|inset(?:-[xy])?|top|left|right|bottom|start|end|z|opacity|col|row|col-span|row-span|order|basis|grow|shrink|overflow|ring|outline|fill|stroke|translate-[xy]|scale|rotate|duration|ease|delay|animate|aspect|columns|divide(?:-[xy])?)-[\w[\]/.:%#()-]+$/
const BARE_UTILITY = /^(?:flex|grid|block|inline|inline-block|inline-flex|hidden|contents|relative|absolute|fixed|sticky|static|truncate|italic|underline|uppercase|lowercase|capitalize|container|sr-only|not-sr-only|grow|shrink|visible|invisible|isolate)$/
const CLASS_CONTEXTS = [
  /className\s*=\s*("[^"]*")/g,
  /className\s*=\s*('[^']*')/g,
  /className\s*=\s*\{\s*(`[^`]*`)\s*\}/g,
  /className\s*=\s*\{\s*(["'][^"']*["'])\s*\}/g,
  /className\s*:\s*(["'`][^"'`]*["'`])/g,
  /className\s*=\s*\{[^}]*\?\s*(["'][^"']*["'])\s*:\s*(["'][^"']*["'])/g,
  /\bcx\(([^)]*)\)/g,
]

function checkTokens(file, text, index, raw) {
  // Only string literals are class names (cx() arguments may also be expressions).
  const literals = [...raw.matchAll(/["'`]([^"'`]*)["'`]/g)].map((m) => m[1])
  for (const lit of literals) {
    for (const token of lit.replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).filter(Boolean)) {
      if (token.startsWith('ty-')) continue
      if (UTILITY.test(token) || BARE_UTILITY.test(token)) problems.push(`${rel(file)}:${lineOf(text, index)} utility class "${token}"`)
      else if (/^[a-z][\w-]*$/i.test(token)) problems.push(`${rel(file)}:${lineOf(text, index)} class "${token}" is not ty- prefixed`)
    }
  }
}

for (const file of walk()) {
  const name = basename(file)
  if (name === 'components.json') problems.push(`${rel(file)}: shadcn registry file`)
  if (/\.(css|pcss|scss)$/.test(name)) {
    const text = read(file)
    for (const m of text.matchAll(CSS_DIRECTIVE)) problems.push(`${rel(file)}:${lineOf(text, m.index)} CSS directive ${m[0]}`)
  }
  if (/\.(tsx?|jsx?|mjs)$/.test(name)) {
    const text = read(file)
    if (/from\s+['"](tailwindcss|@tailwindcss\/[\w-]+|tailwind-merge|class-variance-authority)['"]/.test(text)) problems.push(`${rel(file)}: imports a Tailwind-related module`)
    if (/\.test\.tsx?$/.test(name)) continue
    for (const re of CLASS_CONTEXTS) for (const m of text.matchAll(re)) checkTokens(file, text, m.index, m.slice(1).filter(Boolean).join(" "))
  }
}

report('check:no-utility-css', problems)
