// node scripts/shots.mjs [--url http://127.0.0.1:3410/] [--saida <folder>] [--locales pt-BR,en] [--modos light,dark]
//   [--tamanhos 1440x900,390x844] [rota ...]
// Screenshots of each route with headless Chrome, and a check for page errors and horizontal page scroll.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const req = createRequire(path.join(import.meta.dirname, '../../../packages/print/package.json'))
const puppeteer = req('puppeteer-core')
const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k)
  return i > 0 ? process.argv[i + 1] : d
}
const URL_ = arg('url', 'http://127.0.0.1:3410/')
const SAIDA = arg('saida', path.join(import.meta.dirname, '../shots'))
const LOCALES = arg('locales', 'pt-BR').split(',')
const MODOS = arg('modos', 'light,dark').split(',')
const TAMANHOS = arg('tamanhos', '1440x900,390x844').split(',').map((s) => s.split('x').map(Number))
const livres = process.argv.slice(2).filter((a, i, l) => !a.startsWith('--') && !(l[i - 1] ?? '').startsWith('--'))
const ROTAS = livres.length ? livres : ['', 'componentes', 'temas', 'livro', 'video', 'instalar']
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
fs.mkdirSync(SAIDA, { recursive: true })

const b = await puppeteer.launch({ executablePath: CHROME, headless: true })
const problemas = []
for (const locale of LOCALES) {
  for (const modo of MODOS) {
    for (const [w, h] of TAMANHOS) {
      const p = await b.newPage()
      await p.evaluateOnNewDocument((m) => {
        try {
          localStorage.setItem('ty-site-tema', JSON.stringify({ theme: 'tympan', mode: m, density: 'default' }))
        } catch {}
      }, modo)
      p.on('pageerror', (e) => problemas.push(`${locale} ${modo} ${w}: pageerror ${e.message.split('\n')[0]}`))
      p.on('console', (m) => m.type() === 'error' && problemas.push(`${locale} ${modo} ${w}: console ${m.text().slice(0, 160)}`))
      await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 500, hasTouch: w < 500 })
      for (const r of ROTAS) {
        await p.goto(`${URL_}#/${locale}/${r}`, { waitUntil: 'networkidle0', timeout: 120000 }).catch((e) => problemas.push(`${r}: ${e.message}`))
        await p.evaluate(() => document.fonts.ready)
        await new Promise((ok) => setTimeout(ok, 2500))
        const larg = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        if (larg > 1) problemas.push(`${locale} ${r || 'inicio'} ${w} ${modo}: horizontal scroll ${larg}px`)
        const nome = `${(r || 'inicio').replaceAll('/', '-')}-${locale}-${w}-${modo === 'light' ? 'claro' : 'escuro'}.png`
        await p.screenshot({ path: path.join(SAIDA, nome), fullPage: process.argv.includes('--inteira') })
        console.log(path.join(SAIDA, nome))
      }
      await p.close()
    }
  }
}
await b.close()
console.log(problemas.length ? '\nPROBLEMAS:\n' + [...new Set(problemas)].join('\n') : '\nsem problemas')
