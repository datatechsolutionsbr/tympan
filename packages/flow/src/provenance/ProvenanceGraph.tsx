// ProvenanceGraph: follow an item back to its sources (or forward to where it
// was used) and read the proof state of every step (design direction §3.13).
//
//   query bar   focus item · direction · steps · graph | list · filters
//   body        [list]  canvas (legend, dock tools)  [evidence panel]
//
// The list (APG tree) shows the same subgraph and shares the selection with
// the canvas, so the canvas is never the only way in. Below 1024 px the list
// is the default view. Escape on the canvas returns focus to the query bar.
//
// Keys on a focused node: Left/Right follow the relations (towards the origin
// is the reading-start side: Left in LTR, Right in RTL), Up/Down move to the
// previous/next item of the same rank, Home/End to the first/last item,
// Enter/Space select it and open the evidence panel.

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Button, EmptyState, InlineNotice, ListboxSelect, NativeSelect, SegmentedControl, useMediaQuery } from '@fakhir/design-system'
import { autoLayout } from '../layout/autoLayout'
import type { HopDirection } from '../model/graph'
import type { Point } from '../model/types'
import { fill, useFlowLocale, useLabels } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import { CanvasSurface } from '../surface/CanvasSurface'
import type { CanvasApi, ConnectorShape, NodeDragEvent, SurfaceConnector, SurfaceNode } from '../surface/types'
import { CanvasNodeSearch } from '../toolbar/CanvasNodeSearch'
import { CanvasToolbar } from '../toolbar/CanvasToolbar'
import { canvasToolItems } from '../toolbar/canvasTools'
import { kindTone } from '../catalog/palette'
import { provenanceLabels, type ProvenanceLabels } from './labels'
import { EMPTY_FILTERS, isDeep, proofKeyOf, provenanceView, readingOrder, type ProofKey, type ProvActor, type ProvFilters, type ProvItem, type ProvLink, type ProvStatement, type ProvVertex } from './model'
import { ProvenanceFilters } from './ProvenanceFilters'
import { ProvenanceInspector } from './ProvenanceInspector'
import { ProvenanceLegend } from './ProvenanceLegend'
import { ACTOR_CARD, ActorNode, PROV_CARD, ProvenanceNode } from './ProvenanceNode'
import { ProvenanceTree } from './ProvenanceTree'

export type ProvenanceViewMode = 'graph' | 'tree'

export interface ProvenanceGraphProps {
  items: readonly ProvItem[]
  statements: readonly ProvStatement[]
  /** Actors that statements attribute items to (needed only to draw actors as nodes). */
  actors?: readonly ProvActor[]
  focusId?: string | null
  defaultFocusId?: string | null
  onFocusChange?: (id: string | null) => void
  selectedId?: string | null
  defaultSelectedId?: string | null
  onSelect?: (id: string | null) => void
  hops?: number
  defaultHops?: number
  onHopsChange?: (hops: number) => void
  direction?: HopDirection
  defaultDirection?: HopDirection
  onDirectionChange?: (d: HopDirection) => void
  view?: ProvenanceViewMode
  defaultView?: ProvenanceViewMode
  onViewChange?: (v: ProvenanceViewMode) => void
  filters?: ProvFilters
  defaultFilters?: ProvFilters
  onFiltersChange?: (f: ProvFilters) => void
  /** Largest number of steps offered in the query bar. */
  maxHops?: number
  loading?: boolean
  /** Error message in plain words (the view then shows it with a retry). */
  error?: string | null
  onRetry?: () => void
  /** Keep the graph left-to-right even in RTL locales. */
  keepLtr?: boolean
  /**
   * Reading axis of the graph: 'vertical' (origins on top, the default, like
   * the list) or 'horizontal' (origins at the reading start: left in LTR,
   * right in RTL unless keepLtr).
   */
  orientation?: 'vertical' | 'horizontal'
  labels?: Partial<ProvenanceLabels>
  className?: string
}

const ALL = '__all__'

function initialMatch(query: string, fallback: boolean): boolean {
  return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : fallback
}

export function ProvenanceGraph(props: ProvenanceGraphProps) {
  const { items, statements, actors = [], maxHops = 8, loading = false, error = null, onRetry, keepLtr = false, orientation = 'vertical', className } = props
  const l = useLabels(provenanceLabels, props.labels)
  const { locale, rtl } = useFlowLocale()
  const wide = useMediaQuery('(min-width: 1024px)', true)

  const [focusId, setFocusId] = useControllable<string | null>(props.focusId, props.defaultFocusId ?? null, props.onFocusChange)
  const [selectedId, setSelectedIdRaw] = useControllable<string | null>(props.selectedId, props.defaultSelectedId ?? null, props.onSelect)
  const [hops, setHops] = useControllable<number>(props.hops, props.defaultHops ?? 2, props.onHopsChange)
  const [direction, setDirection] = useControllable<HopDirection>(props.direction, props.defaultDirection ?? 'both', props.onDirectionChange)
  const [view, setView] = useControllable<ProvenanceViewMode>(props.view, () => props.defaultView ?? (initialMatch('(min-width: 1024px)', true) ? 'graph' : 'tree'), props.onViewChange)
  const [filters, setFilters] = useControllable<ProvFilters>(props.filters, props.defaultFilters ?? EMPTY_FILTERS, props.onFiltersChange)
  const [listOpen, setListOpen] = useState(() => initialMatch('(min-width: 1280px)', true))
  const [inspectorOpen, setInspectorOpen] = useState(!!(props.selectedId ?? props.defaultSelectedId))
  const [mode, setMode] = useState<'select' | 'pan'>('select')
  const [zoom, setZoom] = useState(1)
  const [searchOpen, setSearchOpen] = useState(false)
  const [moved, setMoved] = useState<ReadonlyMap<string, Point>>(new Map())
  const [layoutRun, setLayoutRun] = useState(0)

  const api = useRef<CanvasApi>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const searchAnchor = useRef<HTMLElement | null>(null)
  const dragBase = useRef<Map<string, Point>>(new Map())

  const provView = useMemo(() => provenanceView(items, statements, actors, { focusId, hops, direction, filters }), [items, statements, actors, focusId, hops, direction, filters])
  const byId = useMemo(() => new Map(provView.vertices.map((v) => [v.id, v])), [provView])
  const linkById = useMemo(() => new Map(provView.links.map((lk) => [lk.id, lk])), [provView])
  const ordered = useMemo(() => readingOrder(items, statements), [items, statements])

  const setSelectedId = useCallback(
    (id: string | null) => {
      setSelectedIdRaw(id)
      setInspectorOpen(id !== null)
    },
    [setSelectedIdRaw],
  )

  // Positions: ranked layout (origins at the reading start), then any node the person moved.
  const layoutDirection = orientation === 'vertical' ? 'top-down' : rtl && !keepLtr ? 'right-left' : 'left-right'
  const laidOut = useMemo(() => {
    const nodes = provView.vertices.map((v) => ({ id: v.id, kind: v.type === 'item' ? v.item.kind : 'actor', position: { x: 0, y: 0 }, size: v.type === 'item' ? { ...PROV_CARD } : { ...ACTOR_CARD } }))
    return autoLayout(nodes, provView.links, layoutDirection)
  }, [provView, layoutDirection])
  const layoutKey = `${focusId}|${hops}|${direction}|${JSON.stringify(filters)}|${layoutRun}|${view}`
  useEffect(() => setMoved(new Map()), [layoutRun])

  const surfaceNodes = useMemo<SurfaceNode[]>(
    () =>
      laidOut.map((n) => {
        const p = moved.get(n.id) ?? n.position
        const v = byId.get(n.id)!
        return { id: n.id, rect: { ...p, width: n.size!.width, height: n.size!.height }, selected: n.id === selectedId, tone: v.type === 'item' ? kindTone(v.item.kind) : 'neutral' }
      }),
    [laidOut, moved, byId, selectedId],
  )
  const surfaceConnectors = useMemo<SurfaceConnector[]>(() => provView.links.map((lk) => ({ id: lk.id, source: lk.source, target: lk.target })), [provView])

  const leaveCanvas = useCallback(() => {
    barRef.current?.querySelector<HTMLElement>('button, input, select, [tabindex="0"]')?.focus()
  }, [])

  const moveFocusTo = useCallback((id: string | undefined) => {
    if (!id) return
    api.current?.reveal(id)
    api.current?.focusNode(id)
  }, [])

  const onNodeKey = useCallback(
    (id: string) => (e: KeyboardEvent<HTMLElement>) => {
      const originKey = rtl ? 'ArrowRight' : 'ArrowLeft'
      const aheadKey = rtl ? 'ArrowLeft' : 'ArrowRight'
      const layerOf = provView.layer.get(id)
      const sameLayer = provView.vertices.filter((v) => provView.layer.get(v.id) === layerOf)
      const index = sameLayer.findIndex((v) => v.id === id)
      let next: string | undefined
      if (e.key === originKey) next = provView.links.find((lk) => lk.target === id)?.source
      else if (e.key === aheadKey) next = provView.links.find((lk) => lk.source === id)?.target
      else if (e.key === 'ArrowUp') next = sameLayer[index - 1]?.id
      else if (e.key === 'ArrowDown') next = sameLayer[index + 1]?.id
      else if (e.key === 'Home') next = provView.vertices[0]?.id
      else if (e.key === 'End') next = provView.vertices[provView.vertices.length - 1]?.id
      else if (e.key === 'Escape') {
        e.preventDefault()
        leaveCanvas()
        return
      } else return
      e.preventDefault()
      moveFocusTo(next)
    },
    [rtl, provView, leaveCanvas, moveFocusTo],
  )

  const onNodeDrag = useCallback(
    (e: NodeDragEvent) => {
      if (e.phase === 'start') {
        dragBase.current = new Map(e.ids.map((id) => [id, surfaceNodes.find((n) => n.id === id)?.rect ?? { x: 0, y: 0 }]))
        return
      }
      setMoved((prev) => {
        const next = new Map(prev)
        for (const [id, base] of dragBase.current) next.set(id, { x: base.x + e.delta.x, y: base.y + e.delta.y })
        return next
      })
    },
    [surfaceNodes],
  )

  const renderConnector = useCallback(
    (c: SurfaceConnector, shape: ConnectorShape) => {
      const link = linkById.get(c.id) as ProvLink
      return {
        svg: <path className="fk-prov-link" data-relation={link.relation} d={shape.d} markerStart="url(#fk-surface-arrow)" />,
        html: (
          <span className="fk-prov-link__label" data-relation={link.relation} aria-hidden="true" style={{ transform: `translate(${shape.mid.x}px, ${shape.mid.y}px) translate(-50%, -50%)` }}>
            {l.relations[link.relation]}
          </span>
        ),
      }
    },
    [linkById, l],
  )

  const renderNode = useCallback(
    (n: SurfaceNode) => {
      const v = byId.get(n.id) as ProvVertex
      const activate = () => setSelectedId(n.id)
      return v.type === 'item' ? (
        <ProvenanceNode item={v.item} labels={l} locale={locale} selected={n.id === selectedId} onActivate={activate} onKeyDown={onNodeKey(n.id)} />
      ) : (
        <ActorNode actor={v.actor} labels={l} locale={locale} selected={n.id === selectedId} onActivate={activate} onKeyDown={onNodeKey(n.id)} />
      )
    },
    [byId, l, locale, selectedId, setSelectedId, onNodeKey],
  )

  const pickFromList = useCallback(
    (id: string) => {
      setSelectedId(id)
      if (view === 'graph') api.current?.reveal(id)
    },
    [setSelectedId, view],
  )

  const tools = canvasToolItems({
    zoom,
    mode,
    onModeChange: setMode,
    onZoomIn: () => api.current?.zoomIn(),
    onZoomOut: () => api.current?.zoomOut(),
    onZoomReset: () => api.current?.zoomTo(1),
    onFit: () => api.current?.fit(),
    onAutoLayout: () => setLayoutRun((r) => r + 1),
    listView: listOpen,
    onToggleListView: () => setListOpen((o) => !o),
    onSearch: () => {
      searchAnchor.current = canvasRef.current?.querySelector<HTMLElement>('[data-tool="search"]') ?? null
      setSearchOpen(true)
    },
    locale,
  })

  const presentProof = useMemo(() => {
    const seen = new Set<ProofKey>(provView.vertices.flatMap((v) => (v.type === 'item' ? [proofKeyOf(v.item)] : [])))
    return (['proved', 'pending', 'refuted', 'not_disclosed', 'none'] as const).filter((k) => seen.has(k))
  }, [provView])

  const selectedVertex = selectedId ? byId.get(selectedId) : undefined
  const focusOptions = [{ value: ALL, label: l.focusAll }, ...ordered.map((i) => ({ value: i.id, label: `${l.kinds[i.kind]}: ${i.title}` }))]
  const hopOptions = Array.from({ length: maxHops }, (_, i) => String(i + 1))

  const bar = (
    <div className="fk-prov__bar" role="group" aria-label={l.queryBar} ref={barRef}>
      <ListboxSelect
        className="fk-prov__focus"
        label={l.focus}
        options={focusOptions}
        value={focusId ?? ALL}
        onChange={(v) => {
          setFocusId(v === ALL ? null : v)
          if (v !== ALL) setSelectedId(v)
        }}
      />
      <SegmentedControl
        label={l.direction}
        size="compact"
        options={[
          { value: 'backward', label: l.backward },
          { value: 'forward', label: l.forward },
          { value: 'both', label: l.both },
        ]}
        value={direction}
        onChange={(v) => setDirection(v as HopDirection)}
        disabled={!focusId}
      />
      <NativeSelect className="fk-prov__hops" label={l.hops} options={hopOptions} value={String(hops)} onChange={(v) => setHops(Number(v))} disabled={!focusId} />
      <SegmentedControl
        label={l.view}
        size="compact"
        options={[
          { value: 'graph', label: l.viewGraph },
          { value: 'tree', label: l.viewTree },
        ]}
        value={view}
        onChange={(v) => setView(v as ProvenanceViewMode)}
      />
      <ProvenanceFilters value={filters} onChange={setFilters} labels={l} locale={locale} canShowActors={actors.some((a) => !!a.id)} />
      <p className="fk-prov__count" role="status">
        {fill(l.count, { count: provView.vertices.length }, locale)}
      </p>
    </div>
  )

  if (loading) {
    return (
      <div className={['fk-prov', className].filter(Boolean).join(' ')} data-state="loading" aria-busy="true">
        <p className="fk-prov__status" role="status">
          {l.loading}
        </p>
        <div className="fk-prov__ghosts" aria-hidden="true">
          <span className="fk-prov__ghost" />
          <span className="fk-prov__ghost" />
          <span className="fk-prov__ghost" />
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className={['fk-prov', className].filter(Boolean).join(' ')} data-state="error">
        <InlineNotice tone="danger" title={l.errorTitle} titleAs="h2" urgency="assertive" actions={onRetry ? <Button onPress={onRetry}>{l.retry}</Button> : undefined}>
          {error}
        </InlineNotice>
      </div>
    )
  }
  if (!items.length) {
    return (
      <div className={['fk-prov', className].filter(Boolean).join(' ')} data-state="empty">
        <EmptyState title={l.emptyTitle} description={l.emptyText} framing="section" />
      </div>
    )
  }

  const notices: Array<{ key: string; tone: 'info' | 'warning'; text: string }> = []
  if (provView.focusFiltered) notices.push({ key: 'filtered', tone: 'info', text: l.focusFiltered })
  else if (provView.focusIsolated) notices.push({ key: 'isolated', tone: 'info', text: l.isolated })
  else if (!provView.vertices.length) notices.push({ key: 'none', tone: 'info', text: l.noMatches })
  if (isDeep(provView, hops)) notices.push({ key: 'deep', tone: 'warning', text: fill(l.deep, { count: provView.vertices.length }, locale) })

  const tree = (
    <ProvenanceTree view={provView} focusId={focusId} direction={direction} selectedId={selectedId} onSelect={pickFromList} labels={l} locale={locale} />
  )

  return (
    <div
      className={['fk-prov', className].filter(Boolean).join(' ')}
      data-view={view}
      data-list-open={view === 'graph' && listOpen ? 'true' : 'false'}
      data-inspector-open={inspectorOpen && selectedVertex ? 'true' : 'false'}
      data-wide={wide ? 'true' : 'false'}
    >
      {bar}
      {notices.map((n) => (
        <InlineNotice key={n.key} tone={n.tone} urgency="polite" className="fk-prov__notice">
          {n.text}
        </InlineNotice>
      ))}
      <div className="fk-prov__body">
        {view === 'graph' && listOpen ? <div className="fk-prov__list">{tree}</div> : null}
        <div className="fk-prov__main" ref={canvasRef}>
          {view === 'tree' ? (
            <div className="fk-prov__tree-only">{tree}</div>
          ) : (
            <CanvasSurface
              label={l.graphName}
              roleDescription={l.graphRole}
              nodes={surfaceNodes}
              connectors={surfaceConnectors}
              renderNode={renderNode}
              renderConnector={renderConnector}
              fitKey={layoutKey}
              minFitZoom={0.6}
              minimap
              portAnchor={orientation === 'vertical' ? (_id, _port, role) => ({ side: role === 'source' ? 'bottom' : 'top', along: 0.5 }) : undefined}
              mode={mode}
              dragNodes={mode === 'select'}
              onNodeDrag={onNodeDrag}
              onViewportChange={(v) => setZoom(v.zoom)}
              onEscape={() => false}
              onLeave={leaveCanvas}
              direction={keepLtr ? 'ltr' : rtl ? 'rtl' : 'ltr'}
              apiRef={api}
              className="fk-prov__canvas"
            >
              <ProvenanceLegend labels={l} states={presentProof.length ? presentProof : undefined} />
              <CanvasToolbar items={tools} label={l.graphName} />
              <CanvasNodeSearch
                isOpen={searchOpen}
                onOpenChange={setSearchOpen}
                triggerRef={searchAnchor}
                nodes={provView.vertices.map((v) =>
                  v.type === 'item'
                    ? { id: v.id, label: v.item.title, kindLabel: l.kinds[v.item.kind], keywords: v.item.meta?.join(' ') ?? '' }
                    : { id: v.id, label: v.actor.name, kindLabel: l.actorKinds[v.actor.kind] },
                )}
                onPick={(id) => {
                  setSelectedId(id)
                  requestAnimationFrame(() => moveFocusTo(id))
                }}
              />
            </CanvasSurface>
          )}
        </div>
        {inspectorOpen && selectedVertex ? (
          <ProvenanceInspector vertex={selectedVertex} view={provView} labels={l} locale={locale} onSelect={pickFromList} onClose={() => setInspectorOpen(false)} />
        ) : null}
      </div>
    </div>
  )
}
