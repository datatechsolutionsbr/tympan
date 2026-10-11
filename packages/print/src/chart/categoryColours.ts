// Colours by key for categorical data (party, candidate, type): the official colours a book chooses
// (`cores` prop, or the theme's `cor.categorias`), made safe to print. Two visible categories closer than
// ΔE2000 10 get a distinguishing hatch on the later one; text over a colour picks black or white for AA;
// very light colours get a thin outline against the paper; in P&B every category prints as a grey tone and a
// hatch of its own kind, always next to its label.
import { contrastRatio, deltaE2000, luminance, parseColor, toGrey, type PrintStyle } from '@datatechsolutions/tympan-tokens'

export interface CorCategoria {
  chave: string
  /** Fill (hex, or the style's categorical var when the key has no colour). */
  cor: string
  /** Text colour over the fill: black or white, whichever passes AA (4.5:1) — or the better of the two. */
  texto: '#000000' | '#ffffff'
  /** Draw a thin ink outline (the fill is too close to the paper to show its edge). */
  contorno: boolean
  /** Index (0–7) of the extra hatch that tells it apart from a near-identical colour, or null. */
  hachura: number | null
  /** The category it was too close to (ΔE2000 < 10), for the record. */
  parecidaCom?: string
}

const PRETO = '#000000'
const BRANCO = '#ffffff'

/** Black or white over `fundo`, whichever reads better (AA when either can). */
export function textoSobre(fundo: string): '#000000' | '#ffffff' {
  const f = parseColor(fundo)
  return contrastRatio(parseColor(PRETO), f) >= contrastRatio(parseColor(BRANCO), f) ? PRETO : BRANCO
}

/**
 * Colours for the visible categories, in order. `cores` (by key) wins over the theme's `cor.categorias`; keys
 * with neither take the style's qualitative palette in order. In P&B the fills are greys and every category
 * gets a hatch (kind by position), so tone + hatch + label carry it.
 */
export function coresCategorias(chaves: string[], estilo: Pick<PrintStyle, 'cor'>, pb: boolean, cores?: Record<string, string>): CorCategoria[] {
  const papel = estilo.cor.papel
  const mapa = { ...estilo.cor.categorias, ...cores }
  const out: CorCategoria[] = []
  let livre = 0
  for (const chave of chaves) {
    const propria = mapa[chave]
    const base = propria ?? null
    const cor = base ? (pb ? toGrey(base) : base) : `var(--ty-print-categorica-${(livre++ % 8) + 1})`
    const real = base ? parseColor(pb ? toGrey(base) : base) : null
    let hachura: number | null = null
    let parecidaCom: string | undefined
    if (pb) hachura = out.length % 8
    else if (real) {
      const proxima = out.find((o) => o.cor.startsWith('#') && deltaE2000(parseColor(o.cor), real) < 10)
      if (proxima) {
        // A hatch of a kind no earlier category uses.
        const usadas = new Set(out.map((o) => o.hachura).filter((h): h is number => h !== null))
        hachura = [1, 2, 3, 4, 6, 7, 0, 5].find((h) => !usadas.has(h)) ?? 1
        parecidaCom = proxima.chave
      }
    }
    out.push({
      chave,
      cor,
      texto: real ? textoSobre(cor) : PRETO,
      contorno: real ? contrastRatio(real, parseColor(papel)) < 1.3 || luminance(real) > 0.85 : false,
      hachura,
      ...(parecidaCom ? { parecidaCom } : {}),
    })
  }
  return out
}
