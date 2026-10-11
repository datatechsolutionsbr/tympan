// @vitest-environment node
// Fill mode on a dense page, laid out in a real Chrome: panels never overlap (regression: p1/p3 of a
// dashboard report). Skipped when no Chrome is installed (CHROME or the macOS default path).
import { existsSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DataTable, MethodChart, Numbers, Page, Panel, PrintBook, Source, Spread, Text } from '../src/index.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const linhas = (n: number) => Array.from({ length: n }, (_, i) => [`Linha ${i + 1}`, 1000 + i * 37, (i * 1.7).toFixed(1)])
const barras = { tipo: 'barras', titulo: 'Erro por braço', escala: [0, 100], unidade: '%', barras: [40, 30, 22, 12, 8].map((v, i) => ({ rotulo: `Braço ${i}`, valor: v, destaque: i === 3 })) }

function paginaDensa(n1 = 30, n2 = 22) {
  return renderToStaticMarkup(
    <PrintBook estilo="dashboard" lang="en">
      <Spread numero="2-3">
        <Page lado="par">
          <Text eyebrow="Results" titulo="A dense page" nivel={1} paragrafos={['A paragraph that takes a few lines of the page to explain the results before the panels start.']} />
          <Panel letra="a" titulo="Numbers" largura={3}><Numbers itens={[1, 2, 3, 4].map((k) => ({ valor: 10 * k + 0.5, rotulo: `metric ${k}`, ref: `#n${k}` }))} /></Panel>
          <Panel letra="b" titulo="Chart" largura={3}><MethodChart spec={barras as never} alt="a" /></Panel>
          <Panel letra="c" titulo="Table" largura={4}><DataTable colunas={['Item', { rotulo: 'n', numerica: true }, { rotulo: '%', numerica: true }]} linhas={linhas(n1)} /></Panel>
          <Panel letra="d" titulo="Chart 2" largura={2}><MethodChart spec={barras as never} alt="b" /></Panel>
          <Panel letra="e" titulo="Table 2"><DataTable colunas={['Item', { rotulo: 'n', numerica: true }, { rotulo: '%', numerica: true }]} linhas={linhas(n2)} /></Panel>
          <Source texto="results/*.json" rodape />
        </Page>
        <Page lado="impar" />
      </Spread>
    </PrintBook>,
  )
}

describe.skipIf(!existsSync(CHROME))('fill mode in Chrome', () => {
  for (const [n1, n2, cabe] of [[14, 10, true], [30, 22, false]] as const)
  it(`${n1}+${n2} table rows: no two panels overlap; what does not fit is reported, never overlapped`, async () => {
    const { default: puppeteer } = await import('puppeteer-core')
    const b = await puppeteer.launch({ executablePath: CHROME, headless: true })
    try {
      const p = await b.newPage()
      await p.setViewport({ width: 1300, height: 950 })
      await p.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">${paginaDensa(n1, n2)}</body></html>`)
      await p.waitForSelector('html[data-ty-print-ajuste="pronto"]', { timeout: 15000 })
      const r = await p.evaluate(() => {
        const pg = document.querySelector('.ty-print-page')!
        const caixas = [...pg.querySelectorAll('.ty-print-type-area > .ty-print-panel')].map((e) => {
          // The content box of each panel: the panel and the actual bottom of its last child (overflow counts).
          const a = e.getBoundingClientRect()
          const fundo = Math.max(a.bottom, ...[...e.querySelectorAll('*')].map((c) => c.getBoundingClientRect().bottom))
          return { l: a.left, r: a.right, t: a.top, b: fundo }
        })
        const fonte = pg.querySelector('.ty-print-source')!.getBoundingClientRect().top
        const sobra = Number(pg.querySelector('.ty-print-type-area')!.getAttribute('data-sobra') ?? 0)
        return { caixas, fonte, sobra }
      })
      const sobrepoe = (x: (typeof r.caixas)[0], y: (typeof r.caixas)[0]) => x.l < y.r - 0.5 && y.l < x.r - 0.5 && x.t < y.b - 0.5 && y.t < x.b - 0.5
      for (let i = 0; i < r.caixas.length; i++) for (let j = i + 1; j < r.caixas.length; j++) expect(sobrepoe(r.caixas[i]!, r.caixas[j]!), `${i}×${j}`).toBe(false)
      // Too dense even at the smallest scale: allowed only when the page says so (data-sobra), never silently.
      const passa = r.caixas.some((c) => c.b > r.fonte + 0.5)
      if (passa) expect(r.sobra).toBeGreaterThan(0)
      if (cabe) expect(passa).toBe(false)
    } finally {
      await b.close()
    }
  }, 60000)
})
