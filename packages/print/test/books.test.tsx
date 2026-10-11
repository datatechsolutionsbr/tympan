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

describe('texto: proper names and table figures', () => {
  const css = (tokens?: Parameters<typeof PrintBook>[0]['tokens']) =>
    renderToStaticMarkup(<PrintBook estilo="bauhaus" tokens={tokens} incluirCss={false} carregarFontes={false} />)
  it('bauhaus lowercases the level-1 title and eyebrow by default', () => {
    const h = css()
    expect(h).toContain('--ty-print-titulo1-caixa: lowercase;')
    expect(h).toContain('--ty-print-sobretitulo-caixa: lowercase;')
    expect(h).toContain('--ty-print-tabela-numeros: tabular-nums lining-nums;')
  })
  it('nomesProprios: preservar keeps the content casing; numerosTabela switches figures', () => {
    const h = css({ texto: { nomesProprios: 'preservar', numerosTabela: 'proporcional' } })
    expect(h).toContain('--ty-print-titulo1-caixa: none;')
    expect(h).toContain('--ty-print-sobretitulo-caixa: none;')
    expect(h).toContain('--ty-print-celula-caixa: none;')
    expect(h).toContain('--ty-print-tabela-numeros: proportional-nums lining-nums;')
    // Panel labels keep the style's casing.
    expect(h).toContain('--ty-print-rotulo-caixa: lowercase;')
  })
})

describe('ajustarPaginas with a foot source line', () => {
  it('fits the content above the Fonte rodape, not under it', async () => {
    const { ajustarPaginas } = await import('../src/index.ts')
    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM(`<section class="ty-print-page" aria-label="Página 6"><div class="ty-print-type-area"><div class="p"></div><p class="ty-print-source" data-rodape=""></p></div></section>`)
    const doc = dom.window.document
    const MM = 96 / 25.4
    const m = doc.querySelector<HTMLElement>('.ty-print-type-area')!
    const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 100, width: 100, height: bottom - top, x: 0, y: top, toJSON() {} })
    const zoom = () => Number(m.style.zoom || 1)
    // Type area 0..200 mm; the source occupies the last 4 mm; the panel ends at 199 mm (inside the area, under the source).
    doc.querySelector('.ty-print-page')!.getBoundingClientRect = () => rect(0, 240 * MM)
    m.getBoundingClientRect = () => rect(0, 200 * MM)
    doc.querySelector<HTMLElement>('.p')!.getBoundingClientRect = () => rect(0, 199 * MM * zoom())
    doc.querySelector<HTMLElement>('.ty-print-source')!.getBoundingClientRect = () => rect(196 * MM, 200 * MM)
    const g = globalThis as unknown as { getComputedStyle: unknown }
    const antes = g.getComputedStyle
    g.getComputedStyle = (el: Element) => ({ position: el.classList.contains('ty-print-source') ? 'absolute' : 'static' })
    try {
      const r = ajustarPaginas(doc)
      expect(r).toHaveLength(1)
      expect(r[0]!.escala).toBeLessThan(1)
      expect(199 * r[0]!.escala).toBeLessThanOrEqual(194.5 + 0.3)
    } finally {
      g.getComputedStyle = antes
    }
  })
})
