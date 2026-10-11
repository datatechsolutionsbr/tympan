// The copyfitting script (layout faked: jsdom has none).
import { describe, expect, it } from 'vitest'

describe('ajustarPaginas with a foot source line', () => {
  it('fits the content above the Fonte rodape, not under it', async () => {
    const { ajustarPaginas } = await import('../src/index.ts')
    const doc = document.implementation.createHTMLDocument('t')
    doc.body.innerHTML = `<section class="ty-print-page" aria-label="Página 6"><div class="ty-print-type-area"><div class="p"></div><p class="ty-print-source" data-rodape=""></p></div></section>`
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
