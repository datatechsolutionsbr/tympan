// Colour math for the theme generator: sRGB <-> OKLab <-> OKLCH (from Björn
// Ottosson's published OKLab definition), gamut mapping by chroma reduction,
// alpha compositing, WCAG 2 contrast ratio and APCA lightness contrast
// (informational only). Pure and deterministic; no dependencies.

/** Straight (non-premultiplied) sRGB colour, channels 0..1. */
export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

export interface Oklch {
  l: number
  c: number
  h: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function fromLinear(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
}

export function rgbToOklab({ r, g, b }: Rgba): { L: number; a: number; b: number } {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

/** OKLab to linear-light sRGB (may be out of gamut). */
function oklabToLinear(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export function rgbToOklch(c: Rgba): Oklch {
  const { L, a, b } = rgbToOklab(c)
  const chroma = Math.hypot(a, b)
  let h = (Math.atan2(b, a) * 180) / Math.PI
  if (h < 0) h += 360
  return { l: L, c: chroma, h: chroma < 1e-6 ? 0 : h }
}

function inGamut(lin: [number, number, number]): boolean {
  const eps = 1e-6
  return lin.every((v) => v >= -eps && v <= 1 + eps)
}

/**
 * OKLCH to sRGB. Out-of-gamut colours keep lightness and hue and lose chroma
 * (binary search), which preserves the perceived tone of a ramp step.
 */
export function oklchToRgb({ l, c, h }: Oklch, alpha = 1): Rgba {
  const L = clamp01(l)
  const rad = (h * Math.PI) / 180
  const lin = (chroma: number) => oklabToLinear(L, chroma * Math.cos(rad), chroma * Math.sin(rad))
  let chroma = Math.max(0, c)
  if (!inGamut(lin(chroma))) {
    let lo = 0
    let hi = chroma
    for (let i = 0; i < 32; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(lin(mid))) lo = mid
      else hi = mid
    }
    chroma = lo
  }
  // Quantised to 8 bits per channel so every serialisation (hex, DTCG
  // components, rgb()) round-trips to the same value.
  const [r, g, b] = lin(chroma).map((v) => Math.round(clamp01(fromLinear(clamp01(v))) * 255) / 255) as [number, number, number]
  return { r, g, b, a: alpha }
}

const hex2 = (v: number) =>
  Math.round(clamp01(v) * 255)
    .toString(16)
    .padStart(2, '0')

/** `#rrggbb` (alpha ignored). */
export function toHex(c: Rgba): string {
  return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`
}

/** CSS serialisation: hex when opaque, `rgb(r g b / a)` otherwise. */
export function toCss(c: Rgba): string {
  if (c.a >= 1) return toHex(c)
  const ch = (v: number) => Math.round(clamp01(v) * 255)
  return `rgb(${ch(c.r)} ${ch(c.g)} ${ch(c.b)} / ${Math.round(c.a * 1000) / 1000})`
}

/** Parses `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb(r g b / a)` and `rgba(r, g, b, a)`. */
export function parseColor(input: string): Rgba {
  const s = input.trim().toLowerCase()
  if (s.startsWith('#')) {
    let h = s.slice(1)
    if (h.length === 3) h = [...h].map((x) => x + x).join('')
    if (h.length !== 6 && h.length !== 8) throw new Error(`Invalid colour ${input}`)
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 }
  }
  const m = /^rgba?\(([^)]+)\)$/.exec(s)
  if (m && m[1]) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
    const [r = 0, g = 0, b = 0, a = 1] = parts
    return { r: r / 255, g: g / 255, b: b / 255, a }
  }
  throw new Error(`Unsupported colour ${input}`)
}

/** Source-over compositing of `top` onto `bottom`. */
export function composite(top: Rgba, bottom: Rgba): Rgba {
  const a = top.a + bottom.a * (1 - top.a)
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }
  const mix = (t: number, b: number) => (t * top.a + b * bottom.a * (1 - top.a)) / a
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a }
}

/** Composites a stack given from top to bottom; the last layer should be opaque. */
export function flatten(stack: Rgba[]): Rgba {
  return stack.reduceRight<Rgba | null>((acc, layer) => (acc ? composite(layer, acc) : layer), null) ?? { r: 1, g: 1, b: 1, a: 1 }
}

/** WCAG 2.x relative luminance. */
export function luminance(c: Rgba): number {
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b)
}

/** WCAG 2.x contrast ratio (1..21) between two opaque colours. */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * APCA lightness contrast Lc (text on background), implemented from the
 * public description of the APCA-W3 0.0.98G constants. Informational only:
 * WCAG 2.2 conformance is decided by `contrastRatio`.
 */
export function apcaContrast(text: Rgba, background: Rgba): number {
  const y = (c: Rgba) => 0.2126729 * c.r ** 2.4 + 0.7151522 * c.g ** 2.4 + 0.072175 * c.b ** 2.4
  const clampBlack = (v: number) => (v > 0.022 ? v : v + (0.022 - v) ** 1.414)
  const yt = clampBlack(y(text))
  const yb = clampBlack(y(background))
  if (Math.abs(yb - yt) < 0.0005) return 0
  if (yb > yt) {
    const sapc = (yb ** 0.56 - yt ** 0.57) * 1.14
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100
  }
  const sapc = (yb ** 0.65 - yt ** 0.62) * 1.14
  return sapc > -0.1 ? 0 : (sapc + 0.027) * 100
}
