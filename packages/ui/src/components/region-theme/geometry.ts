// Documented loader for the geometry fields of RegionThemeData and
// CountryProfileData. The library ships no boundaries and no coordinates:
// the host serves a public-domain boundary file (for example Natural Earth
// admin-1, https://www.naturalearthdata.com/downloads/10m-cultural-vectors/)
// and this function computes label points and the country view from it, so no
// value is typed by hand.
import { geoArea, geoBounds, geoCentroid, geoContains } from 'd3-geo'
import type { LonLat, RegionThemeEntry, SourceCitation } from './format'

export interface BoundaryFeature {
  type: 'Feature'
  properties: Record<string, unknown> | null
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown } | null
}
export interface BoundaryCollection {
  type: 'FeatureCollection'
  features: BoundaryFeature[]
}

export interface DeriveOptions {
  /** Feature property holding the subdivision code (default `code`). */
  codeProperty?: string
  /** Accepts `BR-SP` or `SP` in the property (default: strip a `XX-` prefix). */
  normaliseCode?: (raw: string) => string
  /** Citation added to `sources` for the derived fields. */
  source: Omit<SourceCitation, 'field'>
}

type Geo = Parameters<typeof geoContains>[0]

/** A point inside the feature: its centroid when inside, else the centre of its largest part. */
export function labelPointOf(feature: BoundaryFeature): LonLat | undefined {
  if (!feature.geometry) return undefined
  const f = feature as unknown as Geo
  const centroid = geoCentroid(f) as LonLat
  if (geoContains(f, centroid)) return centroid
  if (feature.geometry.type !== 'MultiPolygon') return undefined
  const parts = (feature.geometry.coordinates as unknown[]).map((coordinates) => ({ type: 'Polygon', coordinates }) as unknown as Geo)
  const largest = parts.sort((a, b) => geoArea(b) - geoArea(a))[0]
  if (!largest) return undefined
  const c = geoCentroid(largest) as LonLat
  return geoContains(largest, c) ? c : undefined
}

/** Returns a copy of the entry with label points and the view computed from the boundaries. */
export function deriveGeometry(entry: RegionThemeEntry, boundaries: BoundaryCollection, options: DeriveOptions): RegionThemeEntry {
  const prop = options.codeProperty ?? 'code'
  const norm = options.normaliseCode ?? ((raw: string) => raw.replace(/^[A-Z]{2}-/, '').toUpperCase())
  const byCode = new Map<string, BoundaryFeature>()
  for (const f of boundaries.features) {
    const raw = f.properties?.[prop]
    if (typeof raw === 'string') byCode.set(norm(raw), f)
  }
  const subdivisions = entry.subdivisions.map((s) => {
    const f = byCode.get(s.code)
    const point = f ? labelPointOf(f) : undefined
    return point ? { ...s, labelPoint: point } : s
  })
  const [[w, south], [e, north]] = geoBounds(boundaries as unknown as Geo)
  const view = { centre: [(w + e) / 2, (south + north) / 2] as LonLat }
  return {
    ...entry,
    subdivisions,
    view,
    sources: [...entry.sources, { field: 'labelPoint', ...options.source }, { field: 'view', ...options.source }],
  }
}
