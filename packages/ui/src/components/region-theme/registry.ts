// RegionThemeRegistry: optional identity data of first-level subdivisions
// (spec: wave-4/region-theme-registry.md). The registry holds no country data;
// modules register at start-up.
import { createContext, createElement, useContext, type ReactNode } from 'react'
import { values } from '@fakhir/tokens/values'
import { toneNames, type ToneName } from '../tone-tint/toneTint'
import { validateRegionThemeEntry, type LonLat, type RegionThemeEntry, type SubdivisionKind, type SubdivisionRecord } from './format'

export interface IdentityColours {
  primary: string
  secondary: string
  /** Text colour on `primary` reaching 4.5:1, computed here, never stored. */
  onPrimary: 'light' | 'dark'
}

export interface Subdivision {
  code: string
  name: { local: string; en?: string }
  kind: SubdivisionKind
}

export interface RegionThemeRegistry {
  register(entry: RegionThemeEntry): void
  unregister(country: string): void
  countries(): string[]
  getSubdivision(country: string, code: string): Subdivision | undefined
  listSubdivisions(country: string): Subdivision[] | undefined
  isKnownSubdivision(country: string, code: string): boolean
  getIdentityColours(country: string, code: string): IdentityColours | undefined
  getIdentityTone(country: string, code: string): ToneName | undefined
  getLabelPoint(country: string, code: string): LonLat | undefined
  getCountryView(country: string): { centre: LonLat; zoomHint?: number } | undefined
  getMacroRegions(country: string): Array<{ id: string; labelKey: string; codes: string[] }> | undefined
  getFlagUrl(country: string, code: string): string | undefined
}

// Light and dark text of the design direction (§2.3: no pure white or black).
const LIGHT_TEXT = '#fcfdfd'
const DARK_TEXT = '#0f172a'

/** Categorical tones with their light-theme colour, to pick the nearest tone by hue. */
const CATEGORY_COLOURS: ReadonlyArray<[ToneName, string]> = toneNames
  .filter((t) => t.startsWith('categorical-'))
  .flatMap((t) => {
    const hex = values.themes.fakhir.light?.[`--fk-${t}` as `--fk-categorical-1`]
    return hex && /^#[0-9a-f]{6}$/i.test(hex) ? [[t, hex] as [ToneName, string]] : []
  })

function channels(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance(hex: string): number {
  const lin = channels(hex).map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!
}

/** WCAG contrast ratio of two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

function hueOf(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => v / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (d === 0) return -1
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

const key = (v: string) => v.trim().toUpperCase()

export function createRegionThemeRegistry(): RegionThemeRegistry {
  const store = new Map<string, RegionThemeEntry>()
  const record = (country: string, code: string): SubdivisionRecord | undefined =>
    store.get(key(country))?.subdivisions.find((s) => s.code === key(code))
  const asSubdivision = (entry: RegionThemeEntry, s: SubdivisionRecord): Subdivision => ({ code: s.code, name: { ...s.name }, kind: entry.subdivisionKind })

  return {
    register(entry) {
      validateRegionThemeEntry(entry)
      store.set(entry.country, entry)
    },
    unregister(country) {
      store.delete(key(country))
    },
    countries: () => [...store.keys()],
    getSubdivision(country, code) {
      const entry = store.get(key(country))
      const s = record(country, code)
      return entry && s ? asSubdivision(entry, s) : undefined
    },
    listSubdivisions(country) {
      const entry = store.get(key(country))
      return entry?.subdivisions.map((s) => asSubdivision(entry, s))
    },
    isKnownSubdivision: (country, code) => record(country, code) !== undefined,
    getIdentityColours(country, code) {
      const id = record(country, code)?.identity
      if (!id) return undefined
      const onPrimary = contrastRatio(id.primary, LIGHT_TEXT) >= contrastRatio(id.primary, DARK_TEXT) ? 'light' : 'dark'
      return { primary: id.primary.toLowerCase(), secondary: id.secondary.toLowerCase(), onPrimary }
    },
    getIdentityTone(country, code) {
      const id = record(country, code)?.identity
      if (!id) return undefined
      const h = hueOf(id.primary)
      if (h < 0) return 'neutral'
      let best: ToneName = 'neutral'
      let gap = 361
      for (const [tone, hex] of CATEGORY_COLOURS) {
        const hue = hueOf(hex)
        const d = Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue))
        if (d < gap) {
          gap = d
          best = tone
        }
      }
      return best
    },
    getLabelPoint: (country, code) => record(country, code)?.labelPoint,
    getCountryView: (country) => store.get(key(country))?.view,
    getMacroRegions: (country) => store.get(key(country))?.macroRegions?.map((g) => ({ ...g, codes: [...g.codes] })),
    getFlagUrl(country, code) {
      const entry = store.get(key(country))
      const s = record(country, code)
      if (!entry?.flagUrlTemplate || !s) return undefined
      return entry.flagUrlTemplate.replaceAll('{code}', s.code)
    },
  }
}

/** Module-level default registry used by the free functions below. */
export const defaultRegionThemeRegistry = createRegionThemeRegistry()

export const registerRegionTheme = (entry: RegionThemeEntry) => defaultRegionThemeRegistry.register(entry)
export const unregisterRegionTheme = (country: string) => defaultRegionThemeRegistry.unregister(country)
export const getSubdivision = (country: string, code: string) => defaultRegionThemeRegistry.getSubdivision(country, code)
export const listSubdivisions = (country: string) => defaultRegionThemeRegistry.listSubdivisions(country)
export const isKnownSubdivision = (country: string, code: string) => defaultRegionThemeRegistry.isKnownSubdivision(country, code)
export const getIdentityColours = (country: string, code: string) => defaultRegionThemeRegistry.getIdentityColours(country, code)
export const getIdentityTone = (country: string, code: string) => defaultRegionThemeRegistry.getIdentityTone(country, code)
export const getLabelPoint = (country: string, code: string) => defaultRegionThemeRegistry.getLabelPoint(country, code)
export const getCountryView = (country: string) => defaultRegionThemeRegistry.getCountryView(country)
export const getMacroRegions = (country: string) => defaultRegionThemeRegistry.getMacroRegions(country)
export const getFlagUrl = (country: string, code: string) => defaultRegionThemeRegistry.getFlagUrl(country, code)

const RegistryContext = createContext<RegionThemeRegistry>(defaultRegionThemeRegistry)

/** Supplies an isolated registry to a subtree (tests, embeds). */
export function RegionThemeProvider({ registry, children }: { registry: RegionThemeRegistry; children: ReactNode }) {
  return createElement(RegistryContext.Provider, { value: registry }, children)
}

export function useRegionThemeRegistry(): RegionThemeRegistry {
  return useContext(RegistryContext)
}
