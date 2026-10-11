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
