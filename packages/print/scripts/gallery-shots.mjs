// Renders the gallery spread of every preset in headless Chrome and saves
// gallery/shots/<preset>.png (and <preset>-pb.png with --pb). Builds the
// gallery first, serves dist-gallery on a local port, then calls Chrome.
//   node scripts/gallery-shots.mjs [--pb] [--only jornal,tufte] [--grafico halteres]
import { execFileSync } from 'node:child_process'
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = join(fileURLToPath(import.meta.url), '..', '..')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const args = process.argv.slice(2)
const valor = (k) => {
  const i = args.indexOf(k)
  return i >= 0 ? args[i + 1] : undefined
}
const comPb = args.includes('--pb')
const grafico = valor('--grafico') ?? 'estudo'

if (!args.includes('--no-build')) execFileSync('npx', ['vite', 'build', '--config', 'gallery/vite.config.ts', '--logLevel', 'warn'], { cwd: pkg, stdio: 'inherit' })

const { PRINT_PRESET_NAMES } = await import('../../tokens/src/print-presets.ts')
const nomes = valor('--only')?.split(',') ?? PRINT_PRESET_NAMES
const raiz = join(pkg, 'dist-gallery')
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' }
const servidor = createServer((req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let arq = join(raiz, caminho === '/' ? 'index.html' : caminho)
  if (!existsSync(arq) || statSync(arq).isDirectory()) arq = join(raiz, 'index.html')
  res.writeHead(200, { 'content-type': tipos[extname(arq)] ?? 'application/octet-stream' })
  createReadStream(arq).pipe(res)
})
await new Promise((r) => servidor.listen(0, '127.0.0.1', r))
const porta = servidor.address().port
const saida = join(pkg, 'gallery', 'shots')
mkdirSync(saida, { recursive: true })

const { default: puppeteer } = await import('puppeteer-core')
const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir: join(pkg, 'node_modules', '.chrome-shots'),
  args: ['--no-first-run', '--no-default-browser-check', '--hide-scrollbars'],
})
try {
  const pagina = await navegador.newPage()
  // 340 × 240 mm at 96 dpi, rendered at 2× for detail.
  await pagina.setViewport({ width: 1286, height: 908, deviceScaleFactor: 2 })
  for (const nome of nomes) {
    for (const pb of comPb ? [false, true] : [false]) {
      const arquivo = join(saida, `${nome}${pb ? '-pb' : ''}.png`)
      const url = `http://127.0.0.1:${porta}/?foto=1&estilo=${nome}&grafico=${grafico}${pb ? '&pb=1' : ''}`
      await pagina.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
      await pagina.evaluate(() => document.fonts.ready)
      await new Promise((r) => setTimeout(r, 300))
      const dupla = await pagina.$('.ty-print-dupla')
      await (dupla ?? pagina).screenshot({ path: arquivo })
      console.log(`gallery/shots/${nome}${pb ? '-pb' : ''}.png`)
    }
  }
} finally {
  await navegador.close()
}
servidor.close()
