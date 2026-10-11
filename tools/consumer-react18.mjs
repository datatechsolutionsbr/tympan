// Consumer check: a React 18 project renders tympan-print installed from `npm pack` tarballs and from `file:`
// with --install-links (both must print "18.3.1 ok"). A plain `file:` link is expected to FAIL: Node resolves
// react from the link's real path, i.e. the workspace's React 19 (see packages/print/README.md, "Installing").
//   node tools/consumer-react18.mjs        (needs network for react@18 from the registry)
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(fileURLToPath(import.meta.url), '..', '..')
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const packs = mkdtempSync(join(tmpdir(), 'ty-packs-'))
run('npm', ['pack', '-w', '@datatechsolutions/tympan-tokens', '-w', '@datatechsolutions/tympan-print', '--pack-destination', packs], raiz)
const teste = `import React, { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as P from '@datatechsolutions/tympan-print'
const html = renderToStaticMarkup(h(P.PrintBook, { estilo: 'jornal', lang: 'en', incluirCss: false }, h(P.Spread, { numero: '2-3' }, h(P.Page, { lado: 'par' }, h(P.Text, { titulo: 'Hello', nivel: 1 })))))
console.log(React.version, html.includes('>Hello<') ? 'ok' : 'FAIL')`
const casos = {
  'npm pack': ['i', join(packs, 'datatechsolutions-tympan-tokens-0.4.3.tgz'), join(packs, 'datatechsolutions-tympan-print-0.4.3.tgz')],
  'file: --install-links': ['i', '--install-links', `file:${join(raiz, 'packages/tokens')}`, `file:${join(raiz, 'packages/print')}`],
}
let falhou = false
for (const [nome, args] of Object.entries(casos)) {
  const dir = mkdtempSync(join(tmpdir(), 'ty-r18-'))
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'r18', private: true, type: 'module', dependencies: { react: '18.3.1', 'react-dom': '18.3.1' } }))
  writeFileSync(join(dir, 't.mjs'), teste)
  run('npm', ['i', '--silent'], dir)
  run('npm', [...args, '--silent'], dir)
  const out = run(process.execPath, ['t.mjs'], dir).trim()
  console.log(`${nome}: ${out}`)
  if (out !== '18.3.1 ok') falhou = true
}
process.exit(falhou ? 1 : 0)
