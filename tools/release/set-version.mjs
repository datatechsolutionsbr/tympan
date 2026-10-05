// Sets one version on the four published packages and the caret ranges between them.
//
//   node tools/release/set-version.mjs 0.3.1        # write
//   node tools/release/set-version.mjs --check v0.3.1  # exit 1 unless every package is at that version
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const PACKAGES = ['tokens', 'fonts-cjk', 'ui', 'print'].map((dir) => join(root, 'packages', dir, 'package.json'))
const SCOPE = '@datatechsolutions/'
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

const args = process.argv.slice(2)
const check = args[0] === '--check'
const version = (check ? args[1] : args[0])?.replace(/^v/, '')
if (!version || !SEMVER.test(version)) {
  console.error('usage: set-version.mjs <x.y.z> | --check <vx.y.z>')
  process.exit(2)
}

let mismatches = 0
for (const file of PACKAGES) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  if (check) {
    const internal = Object.entries(pkg.dependencies ?? {}).filter(([name]) => name.startsWith(SCOPE))
    const bad = pkg.version !== version || internal.some(([, range]) => range !== `^${version}`)
    if (bad) {
      console.error(`${pkg.name}: version ${pkg.version}, internal ranges ${JSON.stringify(Object.fromEntries(internal))}; expected ${version}`)
      mismatches++
    }
    continue
  }
  pkg.version = version
  for (const name of Object.keys(pkg.dependencies ?? {})) if (name.startsWith(SCOPE)) pkg.dependencies[name] = `^${version}`
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
  console.log(`${pkg.name}@${version}`)
}
if (mismatches) process.exit(1)
if (check) console.log(`all packages at ${version}`)
