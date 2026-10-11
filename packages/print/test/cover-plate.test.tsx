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
      for (const [imp, folga, midia] of [[false, 0, 'screen'], [true, 3, 'screen'], [false, 0, 'print'], [true, 3, 'print']] as const) {
        await p.emulateMediaType(midia)
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

const PDFTOTEXT = ['/opt/homebrew/bin/pdftotext', '/usr/bin/pdftotext', '/usr/local/bin/pdftotext'].find((p) => existsSync(p))

describe('Cover children in the PDF', () => {
  it.skipIf(!existsSync(CHROME) || !PDFTOTEXT)('the plate sits on the page box (trim) and on the bleed of a press sheet', async () => {
    const { execFileSync } = await import('node:child_process')
    const { mkdtempSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const { default: puppeteer } = await import('puppeteer-core')
    const dir = mkdtempSync(join(tmpdir(), 'ty-capa-'))
    const PT = 72 / 25.4
    const b = await puppeteer.launch({ executablePath: CHROME, headless: true })
    try {
      for (const [imp, borda] of [[false, 0], [true, 6]] as const) {
        const arte = (
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#123456' }}>
            <span style={{ position: 'absolute', left: 0, top: 0, font: '10px sans-serif', color: '#fff' }}>CANTO</span>
            <span style={{ position: 'absolute', right: 0, bottom: 0, font: '10px sans-serif', color: '#fff' }}>FIM</span>
          </div>
        )
        const html = renderToStaticMarkup(
          <PrintBook estilo="jornal" impressao={imp ? { sangria: 3, marcasCorte: true } : false} carregarFontes={false}>
            <Spread numero="capa">
              <Page lado="impar" variante="capa">
                <Cover titulo="x">{arte}</Cover>
              </Page>
            </Spread>
          </PrintBook>,
        )
        const p = await b.newPage()
        await p.setContent(`<!doctype html><html><body style="margin:0">${html}</body></html>`)
        const arq = join(dir, `c-${imp}.pdf`)
        await p.pdf({ path: arq, preferCSSPageSize: true, printBackground: true })
        const out = execFileSync(PDFTOTEXT!, ['-bbox', arq, '-'], { encoding: 'utf8' })
        const w = Number(/<page width="([\d.]+)"/.exec(out)![1])
        const canto = /xMin="([\d.]+)"[^>]*>CANTO/.exec(out)!
        const fim = /xMax="([\d.]+)"[^>]*>FIM/.exec(out)!
        // The plate's left edge: the trim (0) without press output; the bleed edge (slug of 6 mm) with it.
        expect(Number(canto[1])).toBeCloseTo(borda * PT, 0)
        expect(Number(fim[1])).toBeCloseTo(w - borda * PT, 0)
      }
    } finally {
      await b.close()
    }
  }, 90000)
})

describe('Cover plate options', () => {
  it('is a direct child of the page (not of the type area), with fundo and margem', () => {
    const h = renderToStaticMarkup(
      <PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}>
        <Spread numero="capa">
          <Page lado="impar" variante="capa">
            <Cover fundo="#123456" margem>
              <i>arte</i>
            </Cover>
          </Page>
        </Spread>
      </PrintBook>,
    )
    expect(h).toMatch(/<\/section>/)
    expect(h).toMatch(/aria-label="[^"]*">(?:(?!ty-print-type-area).)*<div class="ty-print-capa" data-face="primeira" data-prancha="" style="background:#123456;padding:16mm 16mm 14mm"><i>arte<\/i>/)
    expect(h).not.toMatch(/ty-print-type-area"[^>]*>(?:(?!<\/div>).)*data-prancha/)
  })
})
