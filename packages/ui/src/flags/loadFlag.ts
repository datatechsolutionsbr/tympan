import { FLAG_CODES, loaders1by1, loaders4by3, type FlagCode } from './art'

export type FlagArt = '4x3' | '1x1'

const known = new Set<string>(FLAG_CODES)
const cache = new Map<string, string>()

export function isFlagCode(code: string): code is FlagCode {
  return known.has(code)
}

/** Cached SVG of a flag, if it has been loaded already. */
export function cachedFlagSvg(code: FlagCode, art: FlagArt): string | undefined {
  return cache.get(`${art}/${code}`)
}

/**
 * Loads one flag's SVG (its own chunk, so a page pays only for the flags it
 * shows). Unknown codes resolve to null.
 */
export async function loadFlagSvg(code: string, art: FlagArt = '4x3'): Promise<string | null> {
  if (!isFlagCode(code)) return null
  const key = `${art}/${code}`
  const hit = cache.get(key)
  if (hit) return hit
  const mod = await (art === '1x1' ? loaders1by1 : loaders4by3)[code]()
  cache.set(key, mod.default)
  return mod.default
}
