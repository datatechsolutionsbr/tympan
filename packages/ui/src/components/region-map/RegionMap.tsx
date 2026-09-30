import { geoEqualEarth, geoMercator, geoPath, type GeoProjection } from 'd3-geo'
import { Minus, Plus } from 'lucide-react'
import { useLocale } from 'react-aria-components'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import type { ChartsGeoMessages } from '../../internal/messages/charts-geo'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { InlineNotice } from '../inline-notice/InlineNotice'
import { Skeleton } from '../skeleton/Skeleton'
import { resolveTint, type ToneName } from '../tone-tint/toneTint'
import { useRegionMapState, type RegionGroup } from './useRegionMapState'

export * from './useRegionMapState'

type RegionMapLabels = Pick<ChartsGeoMessages['regionMap'], 'map' | 'zoomIn' | 'zoomOut' | 'legendTitle' | 'more'>

export interface RegionMapTotals {
  items: number
  regions: number
  active: number
}

export interface RegionMapProps<T> {
  items: readonly T[]
  getRegionCode: (item: T) => string
  /** Marker positions as [longitude, latitude]; items of other regions are ignored. */
  regionCentres: Record<string, readonly [number, number]>
  /** GeoJSON FeatureCollection with the subdivision shapes, served by the host. */
  shapesUrl: string
  /** Feature property holding the region code (default `code`). */
  regionProperty?: string
  projection?: 'mercator' | 'equal-area'
  getRegionName?: (code: string) => string
  /** Colour of a region; categorical tones follow the region order by default. */
  getRegionTone?: (code: string) => ToneName
  /** Flag image next to the name in the legend (alt text is the name). */
  getRegionFlag?: (code: string) => string | undefined
  isRegionActive?: (code: string) => boolean
  onRegionToggle?: (code: string) => void
  renderRegionDetail?: (code: string, items: T[]) => ReactNode
  /** Position of the detail panel (default: bottom-left). */
  detailPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  formatCounter?: (totals: RegionMapTotals) => string
  labels?: Partial<RegionMapLabels>
  /** Regions shown in the legend before "+N more" (default 5). */
  legendLimit?: number
  minZoom?: number
  maxZoom?: number
  initialZoom?: number
  className?: string
}

interface Shape {
  code: string
  d: string
}

type Load = { phase: 'loading' } | { phase: 'error' } | { phase: 'ready'; collection: GeoCollection }
type GeoCollection = { type: 'FeatureCollection'; features: Array<{ type: 'Feature'; properties: Record<string, unknown> | null; geometry: unknown }> }

const VIEW_W = 800
const VIEW_H = 560
const PAD = 20
const DRAG_THRESHOLD = 6
const PAN_STEP = 40

function useShapes(url: string): Load {
  const [load, setLoad] = useState<Load>({ phase: 'loading' })
  useEffect(() => {
    let live = true
    setLoad({ phase: 'loading' })
    const ctrl = typeof AbortController === 'undefined' ? null : new AbortController()
    Promise.resolve()
      .then(() => fetch(url, ctrl ? { signal: ctrl.signal } : undefined))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<GeoCollection>
      })
      .then((collection) => {
        if (!live) return
        if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features)) throw new Error('not a FeatureCollection')
        setLoad({ phase: 'ready', collection })
      })
      .catch(() => {
        if (live) setLoad({ phase: 'error' })
      })
    return () => {
      live = false
      ctrl?.abort()
    }
  }, [url])
  return load
}

function buildProjection(kind: 'mercator' | 'equal-area', collection: GeoCollection): GeoProjection {
  const base = kind === 'equal-area' ? geoEqualEarth() : geoMercator()
  return base.fitExtent(
    [
      [PAD, PAD],
      [VIEW_W - PAD, VIEW_H - PAD],
    ],
    collection as unknown as Parameters<GeoProjection['fitExtent']>[1],
  )
}

/** Count markers on a country's subdivisions, with keyboard access and a list alternative (spec: wave-2/region-map.md). */
export function RegionMap<T>(props: RegionMapProps<T>) {
  const { regionProperty = 'code', projection = 'mercator', legendLimit = 5 } = props
  const copy = useMessages().regionMap
  const { locale, direction } = useLocale()
  const figures = useMemo(() => new Intl.NumberFormat(locale), [locale])
  const labels = { ...copy, ...props.labels }
  const uid = useId()
  const state = useRegionMapState({
    items: props.items,
    getRegionCode: props.getRegionCode,
    regionCentres: props.regionCentres,
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
    initialZoom: props.initialZoom,
  })
  const load = useShapes(props.shapesUrl)
  const nameOf = (code: string) => props.getRegionName?.(code) ?? code
  const rank = useMemo(() => new Map(state.groups.map((g, i) => [g.code, i])), [state.groups])
  const toneOf = (code: string): string => {
    const chosen = props.getRegionTone?.(code)
    if (chosen) return resolveTint(chosen).rgb
    const i = rank.get(code)
    return i === undefined ? 'var(--ty-surface-sunken)' : `var(--ty-categorical-${(i % 8) + 1})`
  }
  const active = (code: string) => props.isRegionActive?.(code) ?? false

  const geo = useMemo(() => {
    if (load.phase !== 'ready') return null
    const proj = buildProjection(projection, load.collection)
    const path = geoPath(proj)
    const shapes: Shape[] = load.collection.features.flatMap((f) => {
      const raw = f.properties?.[regionProperty]
      const d = path(f as Parameters<typeof path>[0])
      return typeof raw === 'string' && d ? [{ code: raw, d }] : []
    })
    return { proj, shapes }
  }, [load, projection, regionProperty])

  const markers = useMemo(() => {
    if (!geo) return []
    return state.groups.flatMap((g) => {
      const p = geo.proj(props.regionCentres[g.code] as [number, number])
      return p ? [{ group: g, x: p[0], y: p[1] }] : []
    })
  }, [geo, state.groups, props.regionCentres])

  // Roving focus over markers, in count order.
  const [cursor, setCursor] = useState(0)
  const [detail, setDetail] = useState<string | null>(null)
  const markerRefs = useRef<Array<SVGGElement | null>>([])
  const zoomInRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null)
  const safeCursor = Math.min(cursor, Math.max(markers.length - 1, 0))

  // Pointer gestures: drag pans, pinch zooms, a drag never counts as a tap.
  const svgRef = useRef<SVGSVGElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef({ moved: false, startX: 0, startY: 0, pinch: 0, zoomAtPinch: 1 })
  const toView = () => {
    const w = svgRef.current?.getBoundingClientRect().width
    return w ? VIEW_W / w : 1
  }
  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (pointers.current.size === 1) {
      g.moved = false
      g.startX = e.clientX
      g.startY = e.clientY
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }]
      g.pinch = Math.hypot(a.x - b.x, a.y - b.y)
      g.zoomAtPinch = state.zoom
      g.moved = true
    }
  }
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (pointers.current.size >= 2 && g.pinch > 0) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }]
      state.setZoom(g.zoomAtPinch * (Math.hypot(a.x - b.x, a.y - b.y) / g.pinch))
      return
    }
    if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < DRAG_THRESHOLD) return
    g.moved = true
    const k = toView()
    state.panBy((e.clientX - prev.x) * k, (e.clientY - prev.y) * k)
  }
  const onPointerEnd = (e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) gesture.current.pinch = 0
  }

  const toggle = (code: string) => {
    if (gesture.current.moved) return
    props.onRegionToggle?.(code)
  }

  const focusMarker = (i: number) => {
    setCursor(i)
    markerRefs.current[i]?.focus()
  }

  const onMarkerKey = (e: KeyboardEvent<SVGGElement>, i: number, code: string) => {
    const last = markers.length - 1
    let handled = true
    if (e.shiftKey && e.key.startsWith('Arrow')) {
      const d: Record<string, [number, number]> = { ArrowLeft: [PAN_STEP, 0], ArrowRight: [-PAN_STEP, 0], ArrowUp: [0, PAN_STEP], ArrowDown: [0, -PAN_STEP] }
      const step = d[e.key]
      if (step) state.panBy(step[0], step[1])
    } else if (e.key === (direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight') || e.key === 'ArrowDown') focusMarker(i >= last ? 0 : i + 1)
    else if (e.key === (direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft') || e.key === 'ArrowUp') focusMarker(i <= 0 ? last : i - 1)
    // Shift+arrows pan the geography itself, which is never mirrored.
    else if (e.key === 'Home') focusMarker(0)
    else if (e.key === 'End') focusMarker(last)
    else if (e.key === 'Enter' || e.key === ' ') {
      gesture.current.moved = false
      toggle(code)
    } else if (e.key === '+' || e.key === '=') state.zoomIn()
    else if (e.key === '-' || e.key === '_') state.zoomOut()
    else if (e.key === 'Escape') {
      if (detail) setDetail(null)
      else zoomInRef.current?.focus()
    } else handled = false
    if (handled) e.preventDefault()
  }

  const detailGroup = detail ? state.groups.find((g) => g.code === detail) : undefined
  const legend = state.groups.slice(0, legendLimit)
  const hidden = Math.max(0, state.groups.length - legend.length)
  const activeCount = state.groups.filter((g) => active(g.code)).length
  const [panX, panY] = state.pan
  const transform = `translate(${VIEW_W / 2 + panX} ${VIEW_H / 2 + panY}) scale(${state.zoom}) translate(${-VIEW_W / 2} ${-VIEW_H / 2})`

  const regionLabel = (g: RegionGroup<T>) => copy.regionItems(nameOf(g.code), g.count)

  let canvas: ReactNode
  if (load.phase === 'loading') {
    canvas = (
      <div className="ty-region-map__placeholder" role="status" aria-label={copy.loading}>
        <Skeleton shape="rect" />
      </div>
    )
  } else if (load.phase === 'error' || !geo) {
    canvas = (
      <div className="ty-region-map__placeholder">
        <InlineNotice tone="danger">{copy.loadError}</InlineNotice>
      </div>
    )
  } else {
    canvas = (
      <svg
        ref={svgRef}
        className="ty-region-map__svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="group"
        aria-label={labels.map}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <g transform={transform}>
          <g className="ty-region-map__shapes" aria-hidden="true">
            {geo.shapes.map((s) => (
              <path
                key={s.code}
                d={s.d}
                className="ty-region-map__shape"
                style={{ fill: toneOf(s.code) }}
                data-has-items={rank.has(s.code) || undefined}
                data-active={active(s.code) || undefined}
                data-hovered={state.hovered === s.code || undefined}
                onPointerEnter={() => state.setHovered(s.code)}
                onPointerLeave={() => state.setHovered(null)}
                onClick={() => rank.has(s.code) && toggle(s.code)}
              />
            ))}
          </g>
          <g className="ty-region-map__markers">
            {markers.map(({ group, x, y }, i) => {
              const r = state.markerRadius(group.count)
              const pressed = active(group.code)
              return (
                <g
                  key={group.code}
                  ref={(el) => {
                    markerRefs.current[i] = el
                  }}
                  className="ty-region-map__marker"
                  role="button"
                  tabIndex={i === safeCursor ? 0 : -1}
                  aria-pressed={props.onRegionToggle ? pressed : undefined}
                  aria-label={regionLabel(group)}
                  data-code={group.code}
                  data-active={pressed || undefined}
                  transform={`translate(${x} ${y})`}
                  onFocus={() => {
                    setCursor(i)
                    setDetail(group.code)
                  }}
                  onKeyDown={(e) => onMarkerKey(e, i, group.code)}
                  onClick={() => toggle(group.code)}
                  onPointerEnter={() => state.setHovered(group.code)}
                  onPointerLeave={() => state.setHovered(null)}
                >
                  <circle className="ty-region-map__hit" r={Math.max(r, 22 / state.zoom)} />
                  <circle className="ty-region-map__dot" r={r} style={{ color: toneOf(group.code) }} />
                  <text className="ty-region-map__count" textAnchor="middle" dominantBaseline="central" style={{ fontSize: `${12 / state.zoom}px` }}>
                    {figures.format(group.count)}
                  </text>
                </g>
              )
            })}
          </g>
        </g>
      </svg>
    )
  }

  const hoverCode = detail ?? state.hovered
  const panel = hoverCode && props.renderRegionDetail ? props.renderRegionDetail(hoverCode, (detailGroup ?? state.groups.find((g) => g.code === hoverCode))?.items ?? []) : null

  return (
    <div className={cx('ty-region-map', props.className)} data-phase={load.phase}>
      {props.formatCounter ? (
        <p className="ty-region-map__counter">{props.formatCounter({ items: state.total, regions: state.groups.length, active: activeCount })}</p>
      ) : null}
      <div className="ty-region-map__stage">
        {canvas}
        <div className="ty-region-map__zoom">
          <Button ref={zoomInRef} iconOnly accessibleLabel={labels.zoomIn} leadingIcon={<Plus />} disabled={!state.canZoomIn} onPress={state.zoomIn} />
          <Button iconOnly accessibleLabel={labels.zoomOut} leadingIcon={<Minus />} disabled={!state.canZoomOut} onPress={state.zoomOut} />
          <output className="ty-region-map__zoom-value" aria-live="polite">
            {copy.zoomValue(Math.round(state.zoom * 100))}
          </output>
        </div>
        {panel ? (
          <div className="ty-region-map__detail" id={`${uid}-detail`} data-position={props.detailPosition ?? 'bottom-left'}>
            {panel}
          </div>
        ) : null}
      </div>

      {legend.length ? (
        <div className="ty-region-map__legend">
          <p className="ty-region-map__legend-title" id={`${uid}-legend`}>
            {labels.legendTitle}
          </p>
          <ul aria-labelledby={`${uid}-legend`}>
            {legend.map((g) => {
              const flag = props.getRegionFlag?.(g.code)
              return (
                <li key={g.code} className="ty-region-map__legend-item">
                  {flag ? (
                    <img className="ty-region-map__flag" src={flag} alt={nameOf(g.code)} />
                  ) : (
                    <span className="ty-region-map__swatch" style={{ background: toneOf(g.code) }} aria-hidden="true" />
                  )}
                  <span>{flag ? null : nameOf(g.code)}</span>
                  <span className="ty-region-map__legend-count">{figures.format(g.count)}</span>
                </li>
              )
            })}
            {hidden ? <li className="ty-region-map__legend-more">{labels.more(hidden)}</li> : null}
          </ul>
        </div>
      ) : null}

      <ul className="ty-region-map__list" aria-label={copy.regionList}>
        {state.groups.map((g) => (
          <li key={g.code} className="ty-region-map__list-item">
            {props.onRegionToggle ? (
              <Button
                variant="quiet"
                size="compact"
                aria-pressed={active(g.code)}
                onPress={() => props.onRegionToggle?.(g.code)}
                className="ty-region-map__list-toggle"
              >
                {regionLabel(g)}
              </Button>
            ) : (
              <span>{regionLabel(g)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
