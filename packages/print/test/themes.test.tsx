// @vitest-environment node
// Book themes in PrintBook: registered ids, page format, folio, local fonts, press output.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { TEMA_EXEMPLO_EDITORA, registerPrintTheme, unregisterPrintTheme } from '@datatechsolutions/tympan-tokens'
import { Page, PrintBook, Spread } from '../src/index.ts'

afterEach(() => {
  unregisterPrintTheme('editora-exemplo')
})

const livro = (props: Partial<Parameters<typeof PrintBook>[0]> = {}) =>
  renderToStaticMarkup(
    <PrintBook estilo="editora-exemplo" incluirCss={false} {...props}>
      <Spread numero="8-9">
        <Page lado="par" variante="capa" />
        <Page lado="impar" cabeco="Cap." />
      </Spread>
    </PrintBook>,
  )

describe('PrintBook with a registered theme', () => {
  it('uses the theme by id: trim, folio and casing', () => {
    registerPrintTheme(TEMA_EXEMPLO_EDITORA)
    const h = livro()
    expect(h).toContain('data-ty-print-style="editora-exemplo"')
    expect(h).toContain('@page { size: 160mm 230mm; margin: 0; }')
    expect(h).toContain('data-ty-print-folio="centro"')
    expect(h).toContain('--ty-print-titulo1-caixa: none;')
    expect(h).not.toContain('ty-print-sheet')
  })

  it('press output: bleed, slug and crop marks', () => {
    registerPrintTheme({ ...TEMA_EXEMPLO_EDITORA, pagina: { ...TEMA_EXEMPLO_EDITORA.pagina, marcasCorte: true } })
    const h = livro({ impressao: true })
    expect(h).toContain('@page { size: 178mm 248mm; margin: 0; }') // 160 + 2 × (3 mm bleed + 6 mm slug)
    expect(h).toContain('--ty-print-sangria: 3mm;')
    expect((h.match(/class="ty-print-sheet"/g) ?? []).length).toBe(2)
    expect(h).toContain('data-marcas="8"')
    const sem = livro({ impressao: { sangria: 5, marcasCorte: false } })
    expect(sem).toContain('@page { size: 170mm 240mm; margin: 0; }')
    expect(sem).not.toContain('ty-print-crop-marks')
  })

  it('fontes="locais" emits @font-face and no Google link', () => {
    registerPrintTheme({ ...TEMA_EXEMPLO_EDITORA, fontesLocais: [{ familia: 'Source Serif 4', src: 'f/ss4.woff2' }] })
    const h = livro({ fontes: 'locais' })
    expect(h).toContain('@font-face { font-family: "Source Serif 4"')
    expect(h).not.toContain('fonts.googleapis.com')
    expect(livro()).toContain('fonts.googleapis.com')
  })

  it('fontes="locais" without fontesLocais uses the woff2 bundled in tympan-tokens', () => {
    const h = renderToStaticMarkup(<PrintBook estilo="semanario" fontes="locais" baseFontes="/f" incluirCss={false} />)
    expect(h).toMatch(/font-family: 'Fira Sans Condensed';[^}]*url\('\/f\/firasanscondensed\/[^']+\.woff2'\)/)
    expect(h).toMatch(/font-family: 'Source Serif 4'/)
    expect(h).not.toContain('fonts.googleapis.com')
    // A theme's own file wins for its family.
    registerPrintTheme({ id: 'editora-exemplo', base: 'semanario', fontesLocais: [{ familia: 'Source Serif 4', src: 'minha.woff2' }] })
    const t = livro({ fontes: 'locais', baseFontes: '/f/' })
    expect(t).not.toMatch(/'Source Serif 4';[^}]*\/f\/sourceserif4/)
    expect(t).toContain('url("minha.woff2")')
    expect(t).toMatch(/'Fira Sans Condensed'/)
  })
})

describe('page ornaments follow the theme trim', () => {
  it('draws in the trim viewBox with every shape inside it', () => {
    for (const base of ['art-nouveau', 'construtivismo', 'memphis', 'azulejo-modernista', 'bauhaus', 'pop-art']) {
      registerPrintTheme({ id: 'formato-x', base, pagina: { largura: 140, altura: 200 } })
      const h = renderToStaticMarkup(
        <PrintBook estilo="formato-x" incluirCss={false} carregarFontes={false}>
          <Spread numero="2-3">
            <Page lado="par" />
            <Page lado="impar" />
          </Spread>
        </PrintBook>,
      )
      unregisterPrintTheme('formato-x')
      const orn = [...h.matchAll(/<svg class="ty-print-ornament" viewBox="([^"]+)"[^>]*>(.*?)<\/svg>/g)]
      expect(orn.length, base).toBeGreaterThan(0)
      for (const [, vb, corpo] of orn) {
        expect(vb).toBe('0 0 140 200')
        for (const m of corpo!.matchAll(/\b(?:y|y1|y2|cy)="(-?[\d.]+)"/g)) expect(Number(m[1]), base).toBeLessThanOrEqual(200.01)
        for (const m of corpo!.matchAll(/\b(?:x|x1|x2|cx)="(-?[\d.]+)"/g)) expect(Number(m[1]), base).toBeLessThanOrEqual(140.01)
      }
    }
  })
})

describe('estrutura.economiaTinta (bauhaus for 5,571 pages)', () => {
  it('drops ornaments and panel fills, keeps the style', () => {
    const r = (tokens?: object) => renderToStaticMarkup(<PrintBook estilo="bauhaus" tokens={tokens} incluirCss={false} carregarFontes={false}><Spread numero="2-3"><Page lado="par" /><Page lado="impar" /></Spread></PrintBook>)
    expect(r()).toContain('class="ty-print-ornament"')
    const e = r({ estrutura: { economiaTinta: true } })
    expect(e).not.toContain('class="ty-print-ornament"')
    expect(e).toContain('data-ty-print-economia=""')
    expect(e).not.toContain('data-ty-print-fundo-painel')
  })
})

describe('theme weights and figures reach the page', () => {
  it('PrintBook emits the per-role rules of the theme, scoped to the book', () => {
    registerPrintTheme({ id: 'editora-exemplo', base: 'semanario', texto: { pesos: { titulo: 600, numero: 600 }, algarismos: { numero: 'tabular' } } })
    const h = livro()
    const escopo = /data-ty-print-livro="([^"]+)"/.exec(h)![1]
    expect(h).toContain(`[data-ty-print-livro="${escopo}"] :is(h1, h2, h3, h4`)
    expect(h).toMatch(/font-weight: 600; \}/)
    expect(h).toContain('font-variant-numeric: tabular-nums lining-nums; }')
  })
})

describe('local fonts cover every family of the theme stacks', () => {
  it('includes the mono family even when googleFonts omits it, and warns/throws for a family without a file', () => {
    registerPrintTheme({ id: 'editora-exemplo', base: 'semanario', googleFonts: [], fontes: { mono: '"IBM Plex Mono", monospace' } })
    const h = livro({ fontes: 'locais', baseFontes: '/f/' })
    expect(h).toMatch(/font-family: 'IBM Plex Mono';[^}]*\/f\/ibmplexmono\//)
    registerPrintTheme({ id: 'editora-exemplo', base: 'semanario', fontes: { mono: '"Fonte Inexistente", monospace' } })
    const avisos: string[] = []
    const orig = console.warn
    console.warn = (m: string) => void avisos.push(m)
    try {
      livro({ fontes: 'locais' })
    } finally {
      console.warn = orig
    }
    expect(avisos.join()).toContain('Fonte Inexistente')
    expect(() => livro({ fontes: 'locais', fontesEstritas: true })).toThrow(/Fonte Inexistente/)
  })
})

describe('fill mode (dashboard)', () => {
  it('widens the last panel of each row to six columns and gives panel rows the free height', async () => {
    const { Panel, Text } = await import('../src/index.ts')
    const h = renderToStaticMarkup(
      <PrintBook estilo="dashboard" incluirCss={false} carregarFontes={false}>
        <Spread numero="2-3">
          <Page lado="par">
            <Text titulo="T" nivel={1} />
            <Panel letra="a" titulo="a" largura={2}>x</Panel>
            <Panel letra="b" titulo="b" largura={2}>x</Panel>
            <Panel letra="c" titulo="c" largura={4}>x</Panel>
          </Page>
        </Spread>
      </PrintBook>,
    )
    expect(h).toContain('data-preencher=""')
    expect(h).toContain('grid-template-rows:auto auto minmax(min-content, 1fr)')
    const larguras = [...h.matchAll(/data-largura="(\d)"/g)].map((m) => Number(m[1]))
    expect(larguras).toEqual([2, 4, 6])
    const jornal = renderToStaticMarkup(<PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}><Spread numero="2-3"><Page lado="par"><Panel letra="a" titulo="a" largura={2}>x</Panel></Page></Spread></PrintBook>)
    expect(jornal).not.toContain('data-preencher')
  })
})
