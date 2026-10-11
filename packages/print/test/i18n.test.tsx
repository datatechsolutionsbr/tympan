// @vitest-environment node
// Language of the book: component texts and number formatting follow PrintBook `lang`.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DataTable, MethodChart, Numbers, Page, PrintBook, ProofMark, Source, Spread, Trace } from '../src/index.ts'

const spec = { tipo: 'barras' as const, titulo: 'T', escala: [0, 100] as [number, number], unidade: '%', barras: [{ rotulo: 'A', valor: 12.5, destaque: true }, { rotulo: 'B', valor: 40.25 }] }

const livro = (lang: string, extra: object = {}) =>
  renderToStaticMarkup(
    <PrintBook estilo="dashboard" lang={lang} incluirCss={false} carregarFontes={false} {...extra}>
      <Spread numero="2-3">
        <Page lado="par">
          <ProofMark estado="sustentada" />
          <Source texto="x" />
          <Numbers itens={[{ valor: 1234.5, comparado: 2, rotulo: 'r', ref: '#n' }]} />
          <DataTable colunas={['a', { rotulo: 'n', numerica: true }]} linhas={[['x', 1234.5]]} />
          <MethodChart spec={spec as never} alt="a" />
          <Trace numero="1" consulta="q" tabela="t" fonteOficial="f" versao="v 2026-01-01" />
        </Page>
      </Spread>
    </PrintBook>,
  )

describe('i18n', () => {
  it('English edition: texts, accessible names and numbers', () => {
    const h = livro('en')
    expect(h).toContain('>Supported<')
    expect(h).toContain('<b>Source:</b>')
    expect(h).toContain('aria-label="Pages 2 and 3"')
    expect(h).toContain('aria-label="Page 2"')
    expect(h).toContain('aria-label="versus"')
    expect(h).toContain('1,234.5')
    expect(h).toMatch(/>12\.5</)
    expect(h).toContain('>Data: T<')
    expect(h).toContain('>Number<')
    expect(h).toContain('"Did you know?"')
    expect(h).not.toMatch(/Sustentada|Páginas|Fonte:|1\.234,5/)
  })
  it('Portuguese stays the default; a theme or the book overrides any key', () => {
    const h = livro('pt-BR')
    expect(h).toContain('>Sustentada<')
    expect(h).toContain('1.234,5')
    expect(livro('en', { textos: { fonte: 'Sources:' } })).toContain('<b>Sources:</b>')
  })
  it('a book in one language does not leak its number format to the next', () => {
    const both = renderToStaticMarkup(
      <>
        <PrintBook estilo="jornal" lang="en" incluirCss={false} carregarFontes={false}><DataTable colunas={['n']} linhas={[[1.5]]} /></PrintBook>
        <PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}><DataTable colunas={['n']} linhas={[[1.5]]} /></PrintBook>
      </>,
    )
    expect(both.indexOf('1.5')).toBeLessThan(both.indexOf('1,5'))
    expect(both).toContain('1,5')
  })
  it('Rastro is neutral by default: no sha256 line, no lakebrasil mark or seal', () => {
    const h = livro('pt-BR')
    expect(h).not.toContain('ty-print-trace-signs')
    expect(h).not.toContain('sha256')
  })
})

describe('single-series bars keep their highlight in every style', () => {
  it('dashboard: the highlighted bar is drawn as the series of interest, the rest as context', () => {
    const h = livro('en')
    expect(h).toMatch(/data-destaque=""/)
    expect(h).toContain('var(--ty-print-contexto)')
  })
})

describe('highlight in every preset and shape', () => {
  it('dashboard highlight differs from the ink; multi-series bars and dumbbells keep the highlighted row', async () => {
    const { printPresets } = await import('@datatechsolutions/tympan-tokens')
    expect(printPresets.dashboard.cor.destaque).not.toBe(printPresets.dashboard.cor.tinta)
    const pares = { tipo: 'halteres' as const, titulo: 'H', escala: [0, 10] as [number, number], rotuloA: '2010', rotuloB: '2020', linhas: [{ rotulo: 'A', a: 1, b: 5, destaque: true }, { rotulo: 'B', a: 2, b: 3 }] }
    for (const estilo of ['dashboard', 'jornal', 'semanario'] as const) {
      const h = renderToStaticMarkup(<PrintBook estilo={estilo} incluirCss={false} carregarFontes={false}><MethodChart spec={pares as never} alt="a" /></PrintBook>)
      expect(h, estilo).toMatch(/data-destaque=""/)
    }
  })
})
