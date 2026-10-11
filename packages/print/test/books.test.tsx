// @vitest-environment node
// Regressions found while setting the Brasil Real books (one page per municipality).
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PrintBook, PrintMap } from '../src/index.ts'

describe('PrintMap with only `altura`', () => {
  it('a single narrowed map is not shifted out of its viewBox', () => {
    const html = renderToStaticMarkup(
      <PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}>
        <PrintMap titulo="RR" alt="Roraima" recorte={['MG']} largura={80} altura={30} exemplo />
      </PrintBook>,
    )
    const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(html)!
    expect(Number(vb[1])).toBeLessThan(80)
    expect(Number(vb[2])).toBeLessThanOrEqual(30.01)
    expect(html).not.toMatch(/ty-print-map-cell" transform="translate\(/)
  })
})

describe('several books in one HTML', () => {
  const livro = (estilo: 'jornal' | 'bauhaus', pb = false) =>
    renderToStaticMarkup(
      <PrintBook estilo={estilo} pb={pb} incluirCss={false} carregarFontes={false}>
        <PrintMap titulo="m" alt="m" recorte={['RR']} exemplo legenda={['a', 'b']} />
      </PrintBook>,
    )
  const escopo = (html: string) => /data-ty-print-livro="([^"]+)"/.exec(html)![1]

  it('books rendered separately get distinct scopes when their styles differ', () => {
    const a = livro('jornal')
    const b = livro('bauhaus')
    expect(escopo(a)).not.toBe(escopo(b))
    expect(escopo(livro('jornal', true))).not.toBe(escopo(a))
    // Each book's custom properties are scoped to its own attribute.
    expect(a).toContain(`[data-ty-print-livro="${escopo(a)}"] {`)
    expect(b).toContain(`[data-ty-print-livro="${escopo(b)}"] {`)
  })

  it('is deterministic and map pattern ids carry the book scope', () => {
    expect(livro('bauhaus')).toBe(livro('bauhaus'))
    const a = livro('jornal', true)
    const b = livro('bauhaus', true)
    const ids = (h: string) => new Set([...h.matchAll(/<pattern[^>]* id="([^"]+)"/g)].map((m) => m[1]))
    for (const i of ids(a)) expect(ids(b).has(i)).toBe(false)
  })

  it('an explicit escopo separates two books in the same style', () => {
    const r = (escopo: string) => renderToStaticMarkup(<PrintBook estilo="jornal" escopo={escopo} incluirCss={false} carregarFontes={false} />)
    expect(escopo(r('aberturas'))).toBe('tpb-aberturas')
    expect(escopo(r('miolo'))).toBe('tpb-miolo')
  })
})
