// RegionThemeData format and its validation (spec: wave-4/region-theme-data.md).
// Values in data modules are identity facts from public sources, never UI tokens.
import type { SubdivisionKind } from '../../internal/messages/charts-geo'

export type { SubdivisionKind } from '../../internal/messages/charts-geo'

export type LonLat = [longitude: number, latitude: number]

export interface SubdivisionRecord {
  /** Part after the hyphen of the ISO 3166-2 code, upper case. */
  code: string
  name: { local: string; en?: string }
  /** Two colours from the official flag or arms specification; absent when there is none. */
  identity?: { primary: string; secondary: string }
  /**
   * A point inside the polygon for a label. Optional in this library: modules
   * leave it out until it is computed from public boundary data with
   * `deriveGeometry()` (see ./geometry.ts); nothing is guessed.
   */
  labelPoint?: LonLat
}

export interface SourceCitation {
  /** Field group the citation covers: `codes`, `names`, `macroRegions`, `identity`, `labelPoint`, `view`. */
  field: string
  citation: string
  url: string
  /** ISO date the source was consulted. */
  retrievedOn: string
}

export interface RegionThemeEntry {
  country: string
  subdivisionKind: SubdivisionKind
  subdivisions: SubdivisionRecord[]
  /** Default map view; derived from boundary data like `labelPoint`. */
  view?: { centre: LonLat; zoomHint?: number }
  macroRegions?: Array<{ id: string; labelKey: string; codes: string[] }>
  flagUrlTemplate?: string
  sources: SourceCitation[]
  version: string
}

export const SUBDIVISION_KINDS: readonly SubdivisionKind[] = [
  'state',
  'province',
  'region',
  'department',
  'governorate',
  'prefecture',
  'county',
  'voivodeship',
  'district',
  'nation',
]

const HEX6 = /^#[0-9a-f]{6}$/i
const ALPHA2 = /^[A-Z]{2}$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const SUB_CODE = /^[A-Z0-9]{1,3}$/

export class RegionThemeError extends Error {
  constructor(
    readonly country: string,
    readonly field: string,
    readonly code: string | undefined,
    detail: string,
  ) {
    super(`RegionThemeData ${country || '??'}: ${field}${code ? ` (subdivision ${code})` : ''} ${detail}`)
    this.name = 'RegionThemeError'
  }
}

const inLon = (v: unknown) => typeof v === 'number' && v >= -180 && v <= 180
const inLat = (v: unknown) => typeof v === 'number' && v >= -90 && v <= 90
const isLonLat = (p: unknown): p is LonLat => Array.isArray(p) && p.length === 2 && inLon(p[0]) && inLat(p[1])

/** Throws a RegionThemeError naming the country, field and subdivision on the first problem. */
export function validateRegionThemeEntry(entry: RegionThemeEntry): void {
  const c = typeof entry?.country === 'string' ? entry.country : ''
  const fail = (field: string, detail: string, code?: string): never => {
    throw new RegionThemeError(c, field, code, detail)
  }
  if (!ALPHA2.test(c)) fail('country', 'must be an ISO 3166-1 alpha-2 code in upper case')
  if (!SUBDIVISION_KINDS.includes(entry.subdivisionKind)) fail('subdivisionKind', `must be one of ${SUBDIVISION_KINDS.join(', ')}`)
  if (!Array.isArray(entry.subdivisions) || entry.subdivisions.length === 0) fail('subdivisions', 'must list at least one subdivision')
  const seen = new Set<string>()
  for (const s of entry.subdivisions) {
    const code = typeof s?.code === 'string' ? s.code : ''
    if (!SUB_CODE.test(code)) fail('subdivisions[].code', 'must be the upper-case part after the hyphen of the ISO 3166-2 code', code || undefined)
    if (seen.has(code)) fail('subdivisions[].code', 'is duplicated', code)
    seen.add(code)
    if (typeof s.name?.local !== 'string' || !s.name.local.trim()) fail('subdivisions[].name.local', 'is required', code)
    if (s.identity !== undefined) {
      if (!HEX6.test(String(s.identity.primary))) fail('subdivisions[].identity.primary', 'must be a six-digit hex colour', code)
      if (!HEX6.test(String(s.identity.secondary))) fail('subdivisions[].identity.secondary', 'must be a six-digit hex colour', code)
    }
    if (s.labelPoint !== undefined && !isLonLat(s.labelPoint)) fail('subdivisions[].labelPoint', 'must be [longitude, latitude]', code)
  }
  if (entry.view !== undefined && !isLonLat(entry.view.centre)) fail('view.centre', 'must be [longitude, latitude]')
  for (const group of entry.macroRegions ?? []) {
    if (!group.id || !group.labelKey) fail('macroRegions', 'need an id and a labelKey')
    for (const code of group.codes ?? []) if (!seen.has(code)) fail('macroRegions[].codes', `lists an unknown subdivision in group ${group.id}`, code)
  }
  if (entry.flagUrlTemplate !== undefined && !entry.flagUrlTemplate.includes('{code}')) fail('flagUrlTemplate', 'must contain the {code} placeholder')
  if (!Array.isArray(entry.sources) || entry.sources.length === 0) fail('sources', 'must cite at least one source')
  for (const src of entry.sources) {
    if (!src.field || !src.citation || !/^https?:\/\//.test(String(src.url)) || !ISO_DATE.test(String(src.retrievedOn))) {
      fail('sources', `entry for "${src?.field ?? '?'}" needs field, citation, an http(s) url and an ISO retrievedOn date`)
    }
  }
  const cited = new Set(entry.sources.map((s) => s.field))
  const needs = ['codes', 'names']
  if (entry.macroRegions?.length) needs.push('macroRegions')
  if (entry.subdivisions.some((s) => s.identity)) needs.push('identity')
  if (entry.subdivisions.some((s) => s.labelPoint)) needs.push('labelPoint')
  if (entry.view) needs.push('view')
  for (const field of needs) if (!cited.has(field)) fail('sources', `has no citation for the "${field}" field group`)
  if (!ISO_DATE.test(entry.version)) fail('version', 'must be an ISO date')
}
