// @vitest-environment node
// Custom cover plate (Cover children): fills the page edge to edge, into the bleed on a press sheet.
import { existsSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Cover, Page, PrintBook, Spread } from '../src/index.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const livro = (impressao: boolean) =>
  renderToStaticMarkup(
    <PrintBook estilo="jornal" impressao={impressao ? { sangria: 3, marcasCorte: true } : false} carregarFontes={false}>
      <Spread numero="capa">
        <Page lado="impar" variante="capa">
          <Cover titulo="ignored">
            <div id="arte" style={{ width: '100%', height: '100%', background: '#123456' }} />
          </Cover>
        </Page>
      </Spread>
    </PrintBook>,
  )

describe('Cover children', () => {
  it('replace the cover layout', () => {
    const h = livro(false)
    expect(h).toContain('data-prancha=""')
    expect(h).toContain('id="arte"')
    expect(h).not.toContain('ignored')
  })
  it.skipIf(!existsSync(CHROME))('cover the trim, and the bleed on a press sheet (Chrome)', async () => {
    const { default: puppeteer } = await import('puppeteer-core')
    const b = await puppeteer.launch({ executablePath: CHROME, headless: true })
    try {
      const p = await b.newPage()
      const MM = 96 / 25.4
      for (const [imp, folga] of [[false, 0], [true, 3]] as const) {
        await p.setContent(`<!doctype html><html><body style="margin:0">${livro(imp)}</body></html>`)
        const r = await p.evaluate(() => {
          const a = document.getElementById('arte')!.getBoundingClientRect()
          const pg = document.querySelector('.ty-print-page')!.getBoundingClientRect()
          return { a: [a.left, a.top, a.right, a.bottom], pg: [pg.left, pg.top, pg.right, pg.bottom] }
        })
        expect(r.a[0]!).toBeCloseTo(r.pg[0]! - folga * MM, 0)
        expect(r.a[1]!).toBeCloseTo(r.pg[1]! - folga * MM, 0)
        expect(r.a[2]!).toBeCloseTo(r.pg[2]! + folga * MM, 0)
        expect(r.a[3]!).toBeCloseTo(r.pg[3]! + folga * MM, 0)
      }
    } finally {
      await b.close()
    }
  }, 60000)
})
