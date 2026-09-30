// Colour helpers for the token panels: parse a computed CSS colour, relative luminance and WCAG contrast.
// Pure functions, tested in test/colors.test.ts.

export type Rgb = [number, number, number]

/** Parses the colours getComputedStyle returns: rgb(), rgba(), color(srgb …) and #hex. */
export function lerCor(css: string): Rgb | null {
  const s = css.trim()
  let m = s.match(/^#([0-9a-f]{3,8})$/i)
  if (m) {
    const h = m[1]!
    const full = h.length <= 4 ? h.split('').map((c) => c + c).join('') : h
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i)
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]
  m = s.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i)
  if (m) return [Number(m[1]) * 255, Number(m[2]) * 255, Number(m[3]) * 255]
  return null
}

export function hex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`
}

export function luminancia([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG 2 contrast ratio (1 to 21). */
export function contraste(a: Rgb, b: Rgb): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p) as [number, number]
  return (x + 0.05) / (y + 0.05)
}

/** AAA, AA, AA for large text only, or below. */
export function nivelContraste(r: number): 'AAA' | 'AA' | 'AA18' | 'falha' {
  return r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA18' : 'falha'
}
