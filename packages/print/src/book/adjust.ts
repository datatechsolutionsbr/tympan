// Copyfitting of fixed pages, run in the browser that lays the book out (the PDF's Chrome, the editor's
// preview). The style studies were each tuned by hand so the method spread fits its 136 × 204 mm type area;
// with 39 styles and live content, the book does the same per page (see ajustarPaginas).

export interface AjusteOpcoes {
  /** Smallest scale allowed (default 0.84: 8.4 pt body text prints at about 7 pt). */
  minimo?: number
  /** Largest scale for a sparse page (default 1.3); 1 turns growing off. */
  maximo?: number
  /** Pages whose natural content fills less than this share of the type area grow (default 0.86). */
  alvo?: number
  /** Scale step (default 0.02). */
  passo?: number
}

export interface AjustePagina {
  /** aria-label of the page ("Página 28"). */
  pagina: string
  /** Scale applied (1 = untouched). */
  escala: number
  /** Millimetres still past the foot at the smallest scale (0 when it fits). */
  sobra: number
}

/**
 * Fits every templated page to its type area, as each style study was fitted by hand: a page whose content
 * passes the foot is scaled down in small steps (type, figures and gaps together, so the grid and proportions
 * stay), never below `minimo`; a sparse page (natural content under `alvo` of the height) is scaled up, never
 * above `maximo`, so its figures and text take the page instead of leaving half of it blank. Respiro pages
 * (virada, part openings, atlas plates) and covers keep their white. Call after fonts have loaded.
 * Deterministic: same content and style, same result.
 */
export function ajustarPaginas(raiz: ParentNode = document, opcoes: AjusteOpcoes = {}): AjustePagina[] {
  const minimo = opcoes.minimo ?? 0.84
  const maximo = opcoes.maximo ?? 1.3
  const alvo = opcoes.alvo ?? 0.86
  const passo = opcoes.passo ?? 0.02
  const MM = 96 / 25.4
  const out: AjustePagina[] = []
  const paginas = Array.from(raiz.querySelectorAll<HTMLElement>('.ty-print-page'))
  for (const pg of paginas) {
    if (pg.getAttribute('data-variante') === 'capa') continue
    const m = pg.querySelector<HTMLElement>(':scope > .ty-print-type-area')
    if (!m) continue
    const respiro = pg.hasAttribute('data-respiro') || pg.getAttribute('data-variante') === 'prancha'
    const comMolde = pg.hasAttribute('data-molde')
    // Natural height: rows at content height (a molde's growing rows would otherwise always reach the foot).
    const natural = () => {
      if (comMolde) m.setAttribute('data-medindo', '')
      const topo = m.getBoundingClientRect().top
      let fundo = topo
      for (const c of Array.from(m.children)) fundo = Math.max(fundo, c.getBoundingClientRect().bottom)
      const alt = m.getBoundingClientRect().height
      if (comMolde) m.removeAttribute('data-medindo')
      return { conteudo: (fundo - topo) / MM, mancha: alt / MM }
    }
    const excesso = () => {
      const n = natural()
      return n.conteudo - n.mancha
    }
    const inicio = natural()
    const razao = inicio.conteudo / inicio.mancha
    const cresce = !respiro && comMolde && maximo > 1 && razao < alvo
    if (!cresce && inicio.conteudo - inicio.mancha <= 0.3) continue
    const original = m.style.cssText
    const pr = pg.getBoundingClientRect()
    const mr = m.getBoundingClientRect()
    const topo = (mr.top - pr.top) / MM
    const esq = (mr.left - pr.left) / MM
    const larg = mr.width / MM
    const alt = mr.height / MM
    const aplicar = (e: number) =>
      // `zoom` scales the element's own offsets and sizes too: divide them so the box stays where it was.
      Object.assign(m.style, {
        zoom: String(e),
        insetBlock: 'auto',
        insetInline: 'auto',
        top: `${topo / e}mm`,
        left: `${esq / e}mm`,
        width: `${larg / e}mm`,
        height: `${alt / e}mm`,
      })
    let escala = 1
    if (cresce) {
      escala = Math.max(1, Math.floor(Math.min(maximo, alvo / razao) / passo) * passo)
      escala = Math.round(escala * 1000) / 1000
      aplicar(escala)
    }
    let sobra = excesso()
    while (sobra > 0.3 && escala - passo >= minimo - 1e-9) {
      escala = Math.round((escala - passo) * 1000) / 1000
      aplicar(escala)
      sobra = excesso()
    }
    if (escala === 1) {
      m.style.cssText = original
      continue
    }
    m.setAttribute('data-ajuste', String(escala))
    out.push({ pagina: pg.getAttribute('aria-label') ?? '?', escala, sobra: Math.max(0, Math.round(sobra * 10) / 10) })
  }
  return out
}

/** `ajustarPaginas` as a self-contained script (for puppeteer's `page.evaluate` or an inline `<script>`). */
export const SCRIPT_AJUSTE_PAGINAS = `(${ajustarPaginas.toString()})(document)`
