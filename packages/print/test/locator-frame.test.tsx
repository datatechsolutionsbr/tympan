// @vitest-environment node
// Fixed-frame locator (PrintLocatorMap quadro): every map the same size, theme highlight, inset in its own column.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PrintBook, PrintLocatorMap } from '../src/index.ts'

const r = (codigo: string, tokens?: object, pb = false) =>
  renderToStaticMarkup(
    <PrintBook estilo="semanario" tokens={tokens} pb={pb} incluirCss={false} carregarFontes={false}>
      <PrintLocatorMap codigo={codigo} alt="a" quadro={{ largura: 50, altura: 20 }} inset capital escala />
    </PrintBook>,
  )

describe('PrintLocatorMap quadro', () => {
  it('same frame for a small, a long and a border municipality', () => {
    for (const c of ['1400175', '1400704', '3550308', '1302603']) {
      const h = r(c)
      expect(h, c).toContain('viewBox="0 0 50 20"')
      expect(h, c).toContain('data-quadro="50x20"')
    }
  })
  it('unit in the theme highlight (never flat black), light neighbours with paper rules, P&B a dark grey', () => {
    const h = r('1400175')
    expect(h).toMatch(/ty-print-locator-focus"[^>]*fill:var\(--ty-print-destaque\)/)
    expect(h).toMatch(/ty-print-locator-context"[^>]*fill:var\(--ty-print-contexto-area/)
    expect(r('1400175', undefined, true)).toMatch(/ty-print-locator-focus"[^>]*fill:color-mix\(in srgb, var\(--ty-print-tinta\) 72%/)
  })
  it('inset in its own column left of the map clip; capital point and scale', () => {
    const h = r('1400175')
    const clip = /<clipPath[^>]*><rect x="([\d.]+)"/.exec(h)!
    const inset = /ty-print-locator-inset"[^>]*><rect width="([\d.]+)"/.exec(h)!
    expect(Number(inset[1])).toBeLessThan(Number(clip[1]))
    expect(h).toContain('ty-print-locator-capital')
    expect(h).toContain('ty-print-locator-scale')
  })
  it('a highlight too close to the context grey gets a hatch', () => {
    const h = r('1400175', { cor: { destaque: '#bcb6a8', contexto: '#b8b2a4' } })
    expect(h).toMatch(/ty-print-locator-focus"[^>]*fill:url\(#ty-print-loc-1400175-h\)/)
  })
})
