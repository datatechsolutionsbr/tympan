// check:provenance — hard-fail markers that would suggest material from the
// forked component library or commercial templates leaked into the clean room.
// Scans every file of packages/tokens and packages/design-system except build
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
  [/(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"](@fakhir\/ui|@fakhir\/workflow|astrlabe-ui|@datatech\/astrlabe-ui)(\/[^'"]*)?['"]/g, 'import of the forked packages'],
  [/(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"][^'"]*ui-components[^'"]*['"]/g, 'import from a ui-components folder'],
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
