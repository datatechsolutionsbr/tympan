// check:provenance — hard-fail markers that would suggest material from the
// forked component library or commercial templates leaked into the clean room,
// and imports of avatar artwork outside the licence allow-list.
// Scans every file of packages/tokens, packages/ui (with the flow canvas) and packages/print except build
// output and node_modules. The similarity comparison against the fork runs
// outside the clean room (see tools/provenance/README.md).
import { lineOf, read, rel, report, walk } from './lib.mjs'

const RULES = [
  [/data-\[slot=/g, 'slot data-attribute selector syntax'],
  [/TouchTarget/g, 'TouchTarget identifier'],
  [/--btn-/g, '--btn- custom property'],
  [/forced-colors:\[--/g, 'forced-colors arbitrary variant'],
  [/dark\/zinc/g, 'dark/zinc colour API'],
  [/Headless\.(Field|Button|Dialog|Menu|Listbox|Switch)\b/g, 'Headless.* namespace'],
  [/BentoCard|PlusGrid|GradientBackground|AnimatedNumber|Radiant\w*/g, 'marketing template component name'],
  [/catalyst|tailwind\s*(ui|plus)/gi, 'commercial template name'],
  [/(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"](@fakhir\/workflow|astrlabe-ui|@datatech\/astrlabe-ui)(\/[^'"]*)?['"]/g, 'import of the forked packages'],
  [/(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"][^'"]*ui-components[^'"]*['"]/g, 'import from a ui-components folder'],
  // DiceBear styles whose artwork is CC BY 4.0 or custom-licensed, and the collection that re-exports them
  // (allow-list: packages/ui/src/avatars/styles.ts).
  [/(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]@dicebear\/(?:adventurer|avataaars|big-ears|big-smile|bottts|croodles|dylan|fun-emoji|micah|miniavs|personas|toon-head|collection)(?:-neutral)?(?:\/[^'"]*)?['"]/g, 'DiceBear style outside the CC0/MIT allow-list'],
]
const TEXT = /\.(tsx?|jsx?|mjs|cjs|css|json|md|html|svg|txt|ya?ml)$/

const problems = []
for (const file of walk()) {
  if (!TEXT.test(file)) continue
  const text = read(file)
  for (const [re, why] of RULES) {
    for (const m of text.matchAll(re)) problems.push(`${rel(file)}:${lineOf(text, m.index)} ${why}: "${m[0]}"`)
  }
}

report('check:provenance', problems)
