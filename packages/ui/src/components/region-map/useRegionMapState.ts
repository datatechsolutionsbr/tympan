// State of a RegionMap: items grouped by region, zoom, pan and hover
// (spec: wave-2/region-map.md, "State hook").
import { useCallback, useMemo, useState } from 'react'

export interface RegionGroup<T> {
  code: string
  items: T[]
  count: number
}

export interface RegionMapStateOptions<T> {
  items: readonly T[]
  getRegionCode: (item: T) => string
  /** Only regions listed here receive items; others are ignored. */
  regionCentres: Record<string, readonly [number, number]>
  minZoom?: number
  maxZoom?: number
  zoomStep?: number
  /** Zoom at mount (clamped). */
  initialZoom?: number
}

export interface RegionMapState<T> {
  groups: RegionGroup<T>[]
  total: number
  zoom: number
  minZoom: number
  maxZoom: number
  canZoomIn: boolean
  canZoomOut: boolean
  zoomIn: () => void
  zoomOut: () => void
  setZoom: (z: number) => void
  pan: readonly [number, number]
  panBy: (dx: number, dy: number) => void
  resetView: () => void
  hovered: string | null
  setHovered: (code: string | null) => void
  /** Marker radius in map units: grows by count in four steps, shrinks as zoom grows. */
  markerRadius: (count: number) => number
}

const STEPS: ReadonlyArray<[number, number]> = [
  [50, 22],
  [20, 18],
  [5, 15],
  [0, 12],
]

export function useRegionMapState<T>(options: RegionMapStateOptions<T>): RegionMapState<T> {
  const { items, getRegionCode, regionCentres, minZoom = 1, maxZoom = 8, zoomStep = 0.5, initialZoom } = options
  const [zoom, setZoomRaw] = useState(() => Math.min(maxZoom, Math.max(minZoom, initialZoom ?? minZoom)))
  const [pan, setPan] = useState<readonly [number, number]>([0, 0])
  const [hovered, setHovered] = useState<string | null>(null)

  const groups = useMemo(() => {
    const byCode = new Map<string, T[]>()
    for (const item of items) {
      const code = getRegionCode(item)
      if (!Object.hasOwn(regionCentres, code)) continue
      const bucket = byCode.get(code)
      if (bucket) bucket.push(item)
      else byCode.set(code, [item])
    }
    return [...byCode].map(([code, list]) => ({ code, items: list, count: list.length })).sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
  }, [items, getRegionCode, regionCentres])

  const clamp = useCallback((z: number) => Math.min(maxZoom, Math.max(minZoom, Math.round(z * 100) / 100)), [minZoom, maxZoom])
  const setZoom = useCallback((z: number) => setZoomRaw(clamp(z)), [clamp])

  return {
    groups,
    total: groups.reduce((n, g) => n + g.count, 0),
    zoom,
    minZoom,
    maxZoom,
    canZoomIn: zoom < maxZoom,
    canZoomOut: zoom > minZoom,
    zoomIn: () => setZoomRaw((z) => clamp(z + zoomStep)),
    zoomOut: () => setZoomRaw((z) => clamp(z - zoomStep)),
    setZoom,
    pan,
    panBy: (dx, dy) => setPan(([x, y]) => [x + dx, y + dy]),
    resetView: () => {
      setZoomRaw(minZoom)
      setPan([0, 0])
    },
    hovered,
    setHovered,
    markerRadius: (count) => (STEPS.find(([min]) => count >= min)?.[1] ?? 12) / zoom,
  }
}
