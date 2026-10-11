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
