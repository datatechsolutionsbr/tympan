// Geometry of Tympan's plate: the tympan of an astrolabe for a latitude (default 23°32′ S), in a 400-unit
// box. Almucantars (circles of equal altitude) are stereographic circles centred on the meridian. The
// same function draws the home page's hero plate and the Tympan mark, so they stay in sync.

export interface PlateCircle {
  cy: number
  r: number
}

export interface PlateGeometry {
  /** Centre and radius of the plate rim. */
  c: number
  r: number
  /** Radius of the equator circle. */
  equator: number
  /** Almucantar of altitude `deg` (0 = horizon). */
  almucantar: (deg: number) => PlateCircle
  /** y of the zenith. */
  zenith: number
  /** Tick marks on the outer ring every `stepDeg`, `long` every `longEvery` ticks. */
  ticks: (stepDeg: number, longEvery?: number, ring?: number) => Array<{ x1: number; y1: number; x2: number; y2: number; long: boolean }>
}

export function plateGeometry(latitudeDeg = -23.53, c = 200, r = 180): PlateGeometry {
  const phi = (latitudeDeg * Math.PI) / 180
  const k = r * Math.tan(Math.PI / 4 - (23.44 * Math.PI) / 180 / 2)
  const almucantar = (deg: number): PlateCircle => {
    const h = (deg * Math.PI) / 180
    const lat = Math.abs(phi)
    const y1 = k * Math.tan((Math.PI / 2 - (lat + (Math.PI / 2 - h))) / 2)
    const y2 = k * Math.tan((Math.PI / 2 - (lat - (Math.PI / 2 - h))) / 2)
    return { cy: c + (-y2 - y1) / 2, r: Math.abs(y1 - y2) / 2 }
  }
  const ticks = (stepDeg: number, longEvery = 6, ring = 12) =>
    Array.from({ length: Math.round(360 / stepDeg) }, (_, i) => {
      const a = (i * stepDeg * Math.PI) / 180
      const long = i % longEvery === 0
      const l = long ? 10 : 5
      return { x1: c + Math.cos(a) * (r + ring), y1: c + Math.sin(a) * (r + ring), x2: c + Math.cos(a) * (r + ring - l), y2: c + Math.sin(a) * (r + ring - l), long }
    })
  return { c, r, equator: k, almucantar, zenith: almucantar(89.9).cy, ticks }
}
