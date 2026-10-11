// @vitest-environment node
// Publisher marks: cover logo slot and the optional mark in the running foot.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { registerPrintTheme, unregisterPrintTheme } from '@datatechsolutions/tympan-tokens'
import { Cover, Page, PrintBook, Spread } from '../src/index.ts'

const LOGO = { src: 'data:image/svg+xml,%3Csvg/%3E', alt: 'Editora X' }
afterEach(() => void unregisterPrintTheme('ed-x'))

describe('marks', () => {
  it('Cover logo: theme mark with true, or a given mark; both cover systems', () => {
    registerPrintTheme({ id: 'ed-x', base: 'jornal', marcas: { editora: LOGO } })
    const r = (el: React.ReactNode, pb = false) => renderToStaticMarkup(<PrintBook estilo="ed-x" pb={pb} incluirCss={false} carregarFontes={false}>{el}</PrintBook>)
    expect(r(<Cover titulo="T" logo />)).toMatch(/<img class="ty-print-mark" src="data:image\/svg\+xml[^"]*" alt="Editora X" style="inline-size:22mm;max-block-size:14mm/)
    expect(r(<Cover titulo="T" numeral="0" logo={{ ...LOGO, alt: 'Outra', largura: 30 }} />)).toContain('alt="Outra" style="inline-size:30mm')
    expect(r(<Cover titulo="T" />)).not.toContain('ty-print-mark')
    expect(r(<Cover titulo="T" logo />, true)).toContain('data-pb=""')
  })
  it('running foot mark from the theme (folio.marca) or the Page prop, sized by the molde', () => {
    registerPrintTheme({ id: 'ed-x', base: 'jornal', marcas: { editora: LOGO }, folio: { marca: 'editora' } })
    const h = renderToStaticMarkup(
      <PrintBook estilo="ed-x" incluirCss={false} carregarFontes={false}>
        <Spread numero="2-3" molde="unidade-territorial">
          <Page lado="par" />
          <Page lado="impar" marca={false} />
        </Spread>
      </PrintBook>,
    )
    expect((h.match(/ty-print-running-mark/g) ?? []).length).toBe(1)
    expect(h).toContain('class="ty-print-running-mark" style="block-size:3.5mm"')
  })
})
