// @vitest-environment node
// The Brasil Real "partido mais votado" bars: horizontal, % of valid votes with the unit, party colours by key,
// the panel's width; laid out in Chrome when available.
import { existsSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MethodChart, Page, Panel, PrintBook, Spread } from '../src/index.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const CORES = { PT: '#E4142C', PL: '#1B3A8C', MDB: '#2E8B57', PSD: '#F2C200', UNIAO: '#0B5CAD' }
const spec = { tipo: 'barras', titulo: 'Partido mais votado', escala: [0, 40], unidade: '%', casas: 1, cores: CORES, barras: [{ rotulo: 'PL', valor: 36 }, { rotulo: 'PT', valor: 21.4 }, { rotulo: 'MDB', valor: 12 }, { rotulo: 'UNIAO', valor: 8.25 }, { rotulo: 'PSD', valor: 5 }] }
const html = (estilo: string, altura?: number) =>
  renderToStaticMarkup(
    <PrintBook estilo={estilo} carregarFontes={false}>
      <Spread numero="2-3">
        <Page lado="par">
          <Panel letra="a" titulo="Partidos" largura={3}>
            <MethodChart spec={spec as never} alt="Votos por partido" altura={altura} />
          </Panel>
        </Page>
      </Spread>
    </PrintBook>,
  )

describe('party bars (colours by key)', () => {
  it('horizontal compact bars in every style, with altura too: % with the unit, party colours', () => {
    for (const estilo of ['semanario', 'bauhaus', 'dashboard', 'jornal']) {
      const h = html(estilo, 30)
      expect(h, estilo).toContain('class="ty-print-g-compact"')
      expect(h, estilo).toContain('>36,0%<')
      expect(h, estilo).toContain('>8,3%<')
      expect(h, estilo).toMatch(/data-categoria="PT"[^>]*>.*?fill:#E4142C/)
      expect(h, estilo).not.toContain('class="ty-print-g-axis"')
    }
  })
  it.skipIf(!existsSync(CHROME))('fills the panel width and is not tiny (Chrome)', async () => {
    const { default: puppeteer } = await import('puppeteer-core')
    const b = await puppeteer.launch({ executablePath: CHROME, headless: true })
    try {
      const p = await b.newPage()
      await p.setContent(`<!doctype html><html><body style="margin:0">${html('semanario')}</body></html>`)
      const r = await p.evaluate(() => {
        const svg = document.querySelector('.ty-print-chart')!.getBoundingClientRect()
        const panel = document.querySelector('.ty-print-panel-body')!.getBoundingClientRect()
        const barra = document.querySelector('.ty-print-bar')!.getBoundingClientRect()
        return { svg: svg.width, panel: panel.width, alt: barra.height }
      })
      expect(r.svg).toBeGreaterThan(r.panel * 0.95)
      expect(r.alt).toBeGreaterThan(6) // px: ≥ 1.6 mm per bar
    } finally {
      await b.close()
    }
  }, 60000)
})
