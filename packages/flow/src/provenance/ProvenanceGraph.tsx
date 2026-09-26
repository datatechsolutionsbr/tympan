// ProvenanceGraph: "where did this come from". One question bar picks the
// item in focus (any value, record, number or manuscript sentence); five
// views show the same data:
//
//   Graph        horizontal bands in research order (search, reading,
//                source, assertion, base and verification, analysis,
//                edition, manuscript), the focus item's proof path down the
//                first column, everything else dimmed or hidden.
//   Tree         the keyboard and screen-reader alternative (APG tree).
//   Timeline     one lane per actor on a time axis.
//   Certificate  the obligation tree the verifier checked for a claim.
//   Compare      what changed between two editions.
//
// The evidence panel (inspector) stays beside the graph and the tree. The
// graph's filters (type, actor, proof), the steps back and forward and "only
// the proof path" sit as chips in one row above the canvas with the line key;
// the canvas tools (select, move, zoom, fit, rearrange, tree, export, find)
// form a dock, drawn over the canvas or handed to the host (renderTools).
// The question field and the view switch are exported on their own so a
// host can place them in its page header (showQuestionBar={false}).
//
// Keys on a focused node: Up/Down move between bands along the relations
// (towards the origin is Up), Left/Right move inside a band (mirrored in
// RTL), Home/End go to the first/last node, Enter/Space select, Escape
// returns to the question bar.

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ComboBox, Input, Label, ListBox, ListBoxItem, Popover as AriaPopover, Button as AriaButton, Radio, RadioGroup, Switch as AriaSwitch, Text } from 'react-aria-components'
import { ArrowDown, ArrowUp, Check, ChevronDown, FileDown, GitCompareArrows, Hourglass, ListTree } from 'lucide-react'
import { Button, EmptyState, InlineNotice, useMediaQuery } from '@fakhir/ui'
import { kindTone } from '../catalog/palette'
import { fill, useFlowLocale, useLabels } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import type { Point } from '../model/types'
import { CanvasSurface } from '../surface/CanvasSurface'
import type { CanvasApi, ConnectorShape, NodeDragEvent, SurfaceConnector, SurfaceNode } from '../surface/types'
import { CanvasNodeSearch } from '../toolbar/CanvasNodeSearch'
import { CanvasToolbar } from '../toolbar/CanvasToolbar'
import { canvasToolItems, type CanvasToolItem } from '../toolbar/canvasTools'
import { EditionCompare } from './EditionCompare'
import { provenanceLabels, type ProvenanceLabels } from './labels'
import {
  bandGeometryFrom,
  bandLayout,
  DEFAULT_BANDS,
  type BandGeometry,
  EMPTY_FILTERS,
  isDeep,
  proofKeyOf,
  proofPath,
  provenanceView,
  readingOrder,
  searchableText,
  type ProofKey,
  type ProvActor,
  type ProvFilters,
  type ProvItem,
  type ProvLink,
  type ProvStatement,
  type ProvVertex,
} from './model'
import type { EditionComparison, ProofCertificate } from './proofTypes'
import { ProvenanceCertificate } from './ProvenanceCertificate'
import { FilterChips } from './ProvenanceFilters'
import { ProvenanceInspector } from './ProvenanceInspector'
import { ProvenanceLegend } from './ProvenanceLegend'
import { ActorNode, ProvenanceNode } from './ProvenanceNode'
import { ProvenanceTimeline } from './ProvenanceTimeline'
import { ProvenanceTree } from './ProvenanceTree'

export type ProvenanceViewMode = 'graph' | 'tree' | 'timeline' | 'certificate' | 'compare'

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
  /** Steps towards origins. */
  back?: number
  defaultBack?: number
  onBackChange?: (n: number) => void
  /** Steps towards uses. */
  forward?: number
  defaultForward?: number
  onForwardChange?: (n: number) => void
  /** Show only the focus item's proof path. */
  onlyProofPath?: boolean
  defaultOnlyProofPath?: boolean
  onOnlyProofPathChange?: (on: boolean) => void
  view?: ProvenanceViewMode
  defaultView?: ProvenanceViewMode
  onViewChange?: (v: ProvenanceViewMode) => void
  filters?: ProvFilters
  defaultFilters?: ProvFilters
  onFiltersChange?: (f: ProvFilters) => void
  /** Largest number of steps offered in each direction. */
  maxHops?: number
  /** Certificates by claim id (the focus or the selected item). */
  certificates?: Readonly<Record<string, ProofCertificate>>
  onRerunCertificate?: (claimId: string) => void
  onDownloadCertificate?: (claimId: string) => void
  certificateBusy?: boolean
  /** Two editions to compare. */
  comparison?: EditionComparison | null
  onReread?: (id: string) => void
  onRequestVerification?: (id: string) => void
  loading?: boolean
  /** Error message in plain words (the view then shows it with a retry). */
  error?: string | null
  onRetry?: () => void
  /** Keep the graph's reading start on the left even in RTL locales. */
  keepLtr?: boolean
  labels?: Partial<ProvenanceLabels>
  /** Page title shown at the start of the question row (for example "Proveniência"). */
  title?: string
  /** Mono breadcrumb above the title (organisation / project / id). */
  breadcrumb?: string
  /** `false` when the host shows ProvenanceQuestion and ProvenanceViewSwitch itself. */
  showQuestionBar?: boolean
  /** Host dock: receives the canvas tool items; a dock over the canvas otherwise. */
  renderTools?: (items: CanvasToolItem[]) => ReactNode
  /** "Export PROV" in the canvas tools. */
  onExport?: () => void
  /** Content at the end of the graph's chip row (for example a sample-data tag). */
  toolRowEnd?: ReactNode
  /** Words for times on the timeline (for example placeholders while dates are not known). */
  formatTime?: (time: number, use: 'tick' | 'detail') => string
  /** Actions under the selected timeline event. */
  timelineActions?: (item: ProvItem) => ReactNode
  /** "Ask for a review" on a compared change. */
  onRequestReview?: (itemId: string) => void
  /** Compared row selected at first. */
  defaultCompareItemId?: string | null
  className?: string
}

const VIEWS: readonly ProvenanceViewMode[] = ['graph', 'tree', 'timeline', 'certificate', 'compare']
const PROV_RELATIONS_ORDER = ['wasDerivedFrom', 'wasAttributedTo', 'used', 'wasGeneratedBy'] as const

function initialMatch(query: string, fallback: boolean): boolean {
  return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : fallback
}

export function ProvenanceGraph(props: ProvenanceGraphProps) {
  const { items, statements, actors = [], maxHops = 8, loading = false, error = null, onRetry, keepLtr = false, className } = props
  const l = useLabels(provenanceLabels, props.labels)
  const { locale, rtl } = useFlowLocale()
  const mirror = rtl && !keepLtr
  const wide = useMediaQuery('(min-width: 1024px)', true)

  const [focusId, setFocusId] = useControllable<string | null>(props.focusId, props.defaultFocusId ?? null, props.onFocusChange)
  const [selectedId, setSelectedIdRaw] = useControllable<string | null>(props.selectedId, props.defaultSelectedId ?? props.defaultFocusId ?? null, props.onSelect)
  const [back, setBack] = useControllable<number>(props.back, props.defaultBack ?? 3, props.onBackChange)
  const [forward, setForward] = useControllable<number>(props.forward, props.defaultForward ?? 1, props.onForwardChange)
  const [onlyPath, setOnlyPath] = useControllable<boolean>(props.onlyProofPath, props.defaultOnlyProofPath ?? false, props.onOnlyProofPathChange)
  const [view, setView] = useControllable<ProvenanceViewMode>(props.view, () => props.defaultView ?? (initialMatch('(min-width: 1024px)', true) ? 'graph' : 'tree'), props.onViewChange)
  const [filters, setFilters] = useControllable<ProvFilters>(props.filters, props.defaultFilters ?? EMPTY_FILTERS, props.onFiltersChange)
  // On phones the inspector is a sheet over the page: it opens on selection only.
  const [inspectorOpen, setInspectorOpen] = useState(() => initialMatch('(min-width: 1024px)', true))
  const [mode, setMode] = useState<'select' | 'pan'>('select')
  const [zoom, setZoom] = useState(1)
  const [searchOpen, setSearchOpen] = useState(false)
  const [moved, setMoved] = useState<ReadonlyMap<string, Point>>(new Map())
  const [layoutRun, setLayoutRun] = useState(0)
  const pendingFocus = useRef<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [geometry, setGeometry] = useState<BandGeometry>(DEFAULT_BANDS)
  // Band sizes come from the --fk-flow-* tokens, so a theme or density can change them.
  useLayoutEffect(() => {
    const g = bandGeometryFrom(rootRef.current)
    setGeometry((prev) => (JSON.stringify(prev) === JSON.stringify(g) ? prev : g))
  }, [])

  const api = useRef<CanvasApi | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const searchAnchor = useRef<HTMLElement | null>(null)
  const dragBase = useRef<Map<string, Point>>(new Map())

  const fullView = useMemo(() => provenanceView(items, statements, actors, { focusId, back, forward, filters }), [items, statements, actors, focusId, back, forward, filters])
  const path = useMemo(() => proofPath(fullView, focusId), [fullView, focusId])
  const provView = useMemo(() => {
    if (!onlyPath || !path.nodes.size) return fullView
    return { ...fullView, vertices: fullView.vertices.filter((v) => path.nodes.has(v.id)), links: fullView.links.filter((lk) => path.links.has(lk.id)) }
  }, [fullView, onlyPath, path])
  const byId = useMemo(() => new Map(provView.vertices.map((v) => [v.id, v])), [provView])
  const linkById = useMemo(() => new Map(provView.links.map((lk) => [lk.id, lk])), [provView])
  const ordered = useMemo(() => readingOrder(items, statements), [items, statements])
  const hasPath = path.nodes.size > 1

  const setSelectedId = useCallback(
    (id: string | null) => {
      setSelectedIdRaw(id)
      if (id !== null) setInspectorOpen(true)
    },
    [setSelectedIdRaw],
  )

  // Band placement, then any node the person moved by hand.
  const bands = useMemo(() => bandLayout(provView, path.nodes, geometry, mirror), [provView, path, mirror, geometry])
  const layoutKey = `${focusId}|${back}|${forward}|${onlyPath}|${JSON.stringify(filters)}|${layoutRun}|${view}|${mirror}`

  const surfaceNodes = useMemo<SurfaceNode[]>(
    () =>
      provView.vertices.map((v) => {
        const p = moved.get(v.id) ?? bands.positions.get(v.id) ?? { x: 0, y: 0 }
        return { id: v.id, rect: { ...p, width: geometry.card.width, height: geometry.card.height }, selected: v.id === selectedId, tone: v.type === 'item' ? kindTone(v.item.kind) : 'neutral' }
      }),
    [provView, moved, bands, selectedId, geometry],
  )
  const surfaceConnectors = useMemo<SurfaceConnector[]>(() => provView.links.map((lk) => ({ id: lk.id, source: lk.source, target: lk.target })), [provView])

  const leaveCanvas = useCallback(() => {
    barRef.current?.querySelector<HTMLElement>('input, button, select, [tabindex="0"]')?.focus()
  }, [])

  const moveFocusTo = useCallback((id: string | undefined) => {
    if (!id) return
    api.current?.reveal(id)
    api.current?.focusNode(id)
  }, [])

  const onNodeKey = useCallback(
    (id: string) => (e: KeyboardEvent<HTMLElement>) => {
      const here = bands.positions.get(id)
      const sameBand = provView.vertices
        .filter((v) => bands.positions.get(v.id)?.y === here?.y)
        .sort((a, b) => (bands.positions.get(a.id)!.x - bands.positions.get(b.id)!.x) * (mirror ? -1 : 1))
      const index = sameBand.findIndex((v) => v.id === id)
      const nextInBand = mirror ? 'ArrowLeft' : 'ArrowRight'
      const prevInBand = mirror ? 'ArrowRight' : 'ArrowLeft'
      const yOf = (other: string) => bands.positions.get(other)?.y ?? 0
      const neighbours = provView.links.flatMap((lk) => (lk.source === id ? [lk.target] : lk.target === id ? [lk.source] : []))
      let next: string | undefined
      if (e.key === 'ArrowUp') next = neighbours.filter((n) => yOf(n) < (here?.y ?? 0)).sort((a, b) => yOf(b) - yOf(a))[0]
      else if (e.key === 'ArrowDown') next = neighbours.filter((n) => yOf(n) > (here?.y ?? 0)).sort((a, b) => yOf(a) - yOf(b))[0]
      else if (e.key === nextInBand) next = sameBand[index + 1]?.id
      else if (e.key === prevInBand) next = sameBand[index - 1]?.id
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
    [bands, provView, mirror, leaveCanvas, moveFocusTo],
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
      const onPathLink = path.links.has(link.id)
      const dim = hasPath && !onPathLink && !(path.ahead.has(link.source) && (path.ahead.has(link.target) || path.nodes.has(link.target)))
      // The relation is carried by the line style (legend in the tool row) and
      // spelled out in the inspector and the tree; no word sits on the line,
      // so it never covers a card between two close bands.
      return {
        svg: (
          <path className="fk-prov-link" data-relation={link.relation} data-on-path={onPathLink ? 'true' : undefined} data-dimmed={dim ? 'true' : undefined} d={shape.d} markerEnd="url(#fk-surface-arrow)">
            <title>{l.relations[link.relation]}</title>
          </path>
        ),
      }
    },
    [linkById, l, path, hasPath],
  )

  const renderNode = useCallback(
    (n: SurfaceNode) => {
      const v = byId.get(n.id) as ProvVertex
      const activate = () => setSelectedId(n.id)
      const onPathNode = path.nodes.has(n.id)
      return v.type === 'item' ? (
        <ProvenanceNode
          item={v.item}
          labels={l}
          locale={locale}
          selected={n.id === selectedId}
          onPath={hasPath && onPathNode}
          focused={n.id === focusId}
          dimmed={hasPath && !onPathNode && !path.ahead.has(n.id)}
          onActivate={activate}
          onKeyDown={onNodeKey(n.id)}
        />
      ) : (
        <ActorNode actor={v.actor} labels={l} locale={locale} selected={n.id === selectedId} onActivate={activate} onKeyDown={onNodeKey(n.id)} />
      )
    },
    [byId, l, locale, selectedId, setSelectedId, onNodeKey, path, hasPath, focusId],
  )

  // Band backgrounds and labels, drawn under the nodes in canvas units.
  const bandOverlay = (
    <div className="fk-prov-bands" aria-hidden="true">
      {bands.bands.map((b) => (
        <div
          key={b.key}
          className="fk-prov-band"
          data-parity={b.row % 2 ? 'odd' : 'even'}
          style={{ transform: `translate(${-4000}px, ${b.row * geometry.band}px)`, width: bands.width + 8000, height: geometry.band }}
        />
      ))}
      {bands.bands.map((b) => (
        <span
          key={`label-${b.key}`}
          className="fk-prov-band__label"
          style={{ transform: `translate(${bands.labelX}px, ${b.row * geometry.band}px)`, width: geometry.label, height: geometry.band }}
        >
          <span className="fk-prov-band__number">{new Intl.NumberFormat(locale).format(b.row + 1)}</span>
          <span className="fk-prov-band__name">{l.lanes[b.key]}</span>
        </span>
      ))}
    </div>
  )

  const openInGraph = useCallback(
    (id: string) => {
      setSelectedId(id)
      pendingFocus.current = id
      setView('graph')
    },
    [setSelectedId, setView],
  )

  const bindApi = useCallback(
    (handle: CanvasApi | null) => {
      api.current = handle
      const id = pendingFocus.current
      if (handle && id) {
        pendingFocus.current = null
        requestAnimationFrame(() => moveFocusTo(id))
      }
    },
    [moveFocusTo],
  )

  const baseTools = canvasToolItems({
    zoom,
    mode,
    onModeChange: setMode,
    onZoomIn: () => api.current?.zoomIn(),
    onZoomOut: () => api.current?.zoomOut(),
    onZoomReset: () => api.current?.zoomTo(1),
    onFit: () => api.current?.fit(),
    onAutoLayout: () => {
      setMoved(new Map())
      setLayoutRun((r) => r + 1)
    },
    onToggleListView: () => setView('tree'),
    onSearch: () => {
      searchAnchor.current = (document.activeElement as HTMLElement | null) ?? null
      setSearchOpen(true)
    },
    labels: { listView: l.toolTree },
    locale,
  })
  // Export sits with "find", before the search.
  const tools: CanvasToolItem[] = props.onExport
    ? [...baseTools.slice(0, -1), { id: 'export', label: l.toolExport, icon: FileDown, kind: 'action', group: 'find', onPress: props.onExport }, ...baseTools.slice(-1)]
    : baseTools

  const presentProof = useMemo(() => {
    const seen = new Set<ProofKey>(provView.vertices.flatMap((v) => (v.type === 'item' ? [proofKeyOf(v.item)] : [])))
    return (['proved', 'pending', 'refuted', 'not_disclosed', 'none'] as const).filter((k) => seen.has(k))
  }, [provView])

  const selectedVertex = selectedId ? (byId.get(selectedId) ?? fullView.vertices.find((v) => v.id === selectedId)) : undefined
  const hopOptions = Array.from({ length: maxHops + 1 }, (_, i) => String(i))
  const viewNames: Record<ProvenanceViewMode, string> = { graph: l.viewGraph, tree: l.viewTree, timeline: l.viewTimeline, certificate: l.viewCertificate, compare: l.viewCompare }

  void viewNames
  const question =
    props.showQuestionBar === false ? null : (
      <div className="fk-prov__bar" role="group" aria-label={l.queryBar} ref={barRef}>
        {props.title ? (
          <div className="fk-prov__heading">
            {props.breadcrumb ? <p className="fk-prov__crumb">{props.breadcrumb}</p> : null}
            <h1 className="fk-prov__title">{props.title}</h1>
          </div>
        ) : null}
        <ProvenanceQuestion
          items={ordered}
          value={focusId}
          labels={l}
          onChange={(id) => {
            setFocusId(id)
            setSelectedId(id)
          }}
        />
        <ProvenanceViewSwitch value={view} onChange={setView} labels={l} />
      </div>
    )

  const shell = (state: string, body: ReactNode) => (
    <div className={['fk-prov', className].filter(Boolean).join(' ')} data-state={state} {...(state === 'loading' ? { 'aria-busy': true } : {})}>
      {body}
    </div>
  )
  if (loading) {
    return shell(
      'loading',
      <>
        <p className="fk-prov__status" role="status">
          {l.loading}
        </p>
        <div className="fk-prov__ghosts" aria-hidden="true">
          <span className="fk-prov__ghost" />
          <span className="fk-prov__ghost" />
          <span className="fk-prov__ghost" />
        </div>
      </>,
    )
  }
  if (error) {
    return shell(
      'error',
      <InlineNotice tone="danger" title={l.errorTitle} titleAs="h2" urgency="assertive" actions={onRetry ? <Button onPress={onRetry}>{l.retry}</Button> : undefined}>
        {error}
      </InlineNotice>,
    )
  }
  if (!items.length) return shell('empty', <EmptyState title={l.emptyTitle} description={l.emptyText} framing="section" />)

  const notices: Array<{ key: string; tone: 'info' | 'warning'; text: string }> = []
  if (fullView.focusFiltered) notices.push({ key: 'filtered', tone: 'info', text: l.focusFiltered })
  else if (fullView.focusIsolated) notices.push({ key: 'isolated', tone: 'info', text: l.isolated })
  else if (!provView.vertices.length) notices.push({ key: 'none', tone: 'info', text: l.noMatches })
  if (isDeep(provView, Math.max(back, forward))) notices.push({ key: 'deep', tone: 'warning', text: fill(l.deep, { count: provView.vertices.length }, locale) })

  const inspector =
    inspectorOpen && selectedVertex ? (
      <ProvenanceInspector
        vertex={selectedVertex}
        view={fullView}
        labels={l}
        locale={locale}
        onSelect={(id) => setSelectedId(id)}
        {...(!wide ? { onClose: () => setInspectorOpen(false) } : {})}
        {...(props.onReread ? { onReread: props.onReread } : {})}
        {...(props.onRequestVerification ? { onRequestVerification: props.onRequestVerification } : {})}
        {...(props.formatTime ? { formatTime: props.formatTime } : {})}
      />
    ) : null

  const presentRelations = PROV_RELATIONS_ORDER.filter((r) => provView.links.some((lk) => lk.relation === r))
  void presentProof
  const graphRow = (
    <div className="fk-prov__tools" data-fk-canvas-exit="">
      <FilterChips value={filters} onChange={setFilters} labels={l} locale={locale} canShowActors={actors.some((a) => !!a.id)} />
      <span className="fk-prov-chip fk-prov-hops" role="group" aria-label={l.hops} data-disabled={focusId ? undefined : 'true'}>
        <ArrowUp className="fk-prov-hops__arrow" aria-hidden="true" focusable="false" />
        <select className="fk-prov-hops__select" aria-label={l.hopsBack} value={String(back)} onChange={(e) => setBack(Number(e.target.value))} disabled={!focusId}>
          {hopOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span aria-hidden="true">·</span>
        <ArrowDown className="fk-prov-hops__arrow" aria-hidden="true" focusable="false" />
        <select className="fk-prov-hops__select" aria-label={l.hopsForward} value={String(forward)} onChange={(e) => setForward(Number(e.target.value))} disabled={!focusId}>
          {hopOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span className="fk-prov-hops__word">{l.hopsWord}</span>
      </span>
      <AriaSwitch className="fk-prov-chip fk-prov-only-path" isSelected={onlyPath} onChange={setOnlyPath} isDisabled={!hasPath}>
        {l.onlyPath}
      </AriaSwitch>
      <span className="fk-prov__spacer" />
      <p className="fk-visually-hidden" role="status">
        {fill(l.count, { count: provView.vertices.length }, locale)}
      </p>
      <ProvenanceLegend labels={l} states={[]} relations={presentRelations.length ? presentRelations : undefined} variant="inline" />
      {props.toolRowEnd}
    </div>
  )
  const dock = props.renderTools ? props.renderTools(tools) : <CanvasToolbar className="fk-prov-dock" items={tools} label={l.graphName} placement="dock" exitTarget={false} />

  const certificateFor = (focusId && props.certificates?.[focusId]) || (selectedId && props.certificates?.[selectedId]) || null

  let main: ReactNode
  if (view === 'graph') {
    main = (
      <div className="fk-prov__main" ref={canvasRef}>
        {graphRow}
        <CanvasSurface
          label={l.graphName}
          roleDescription={l.graphRole}
          nodes={surfaceNodes}
          connectors={surfaceConnectors}
          renderNode={renderNode}
          renderConnector={renderConnector}
          overlay={bandOverlay}
          floating
          fitKey={layoutKey}
          fit="resize"
          fitAlign="start"
          fitInclude={{ x: 0, y: 0, width: bands.width, height: bands.height }}
          fitPadding={16}
          minFitZoom={0.55}
          minimap={provView.vertices.length > 12}
          mode={mode}
          dragNodes={mode === 'select'}
          onNodeDrag={onNodeDrag}
          onViewportChange={(v) => setZoom(v.zoom)}
          onEscape={() => false}
          onLeave={leaveCanvas}
          direction={mirror ? 'rtl' : 'ltr'}
          apiRef={bindApi}
          className="fk-prov__canvas"
          data={{ 'data-path': hasPath ? 'true' : undefined }}
        >
          <CanvasNodeSearch
            isOpen={searchOpen}
            onOpenChange={setSearchOpen}
            triggerRef={searchAnchor}
            nodes={provView.vertices.map((v) =>
              v.type === 'item' ? { id: v.id, label: v.item.title, kindLabel: l.kinds[v.item.kind], keywords: v.item.meta?.join(' ') ?? '' } : { id: v.id, label: v.actor.name, kindLabel: l.actorKinds[v.actor.kind] },
            )}
            onPick={(id) => {
              setSelectedId(id)
              requestAnimationFrame(() => moveFocusTo(id))
            }}
          />
          {props.renderTools ? null : dock}
        </CanvasSurface>
        {props.renderTools ? dock : null}
      </div>
    )
  } else if (view === 'tree') {
    main = (
      <div className="fk-prov__main">
        <div className="fk-prov__tree-only">
          <ProvenanceTree view={fullView} focusId={focusId} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} onOpenInGraph={openInGraph} labels={l} locale={locale} />
        </div>
      </div>
    )
  } else if (view === 'timeline') {
    main = (
      <div className="fk-prov__main">
        <ProvenanceTimeline
          items={provView.vertices.flatMap((v) => (v.type === 'item' ? [v.item] : []))}
          selectedId={selectedId}
          onSelect={(id: string) => setSelectedId(id)}
          {...(props.formatTime ? { formatTime: props.formatTime } : {})}
          {...(props.timelineActions ? { renderDetailActions: props.timelineActions } : {})}
        />
      </div>
    )
  } else if (view === 'certificate') {
    main = (
      <div className="fk-prov__main">
        <ProvenanceCertificate
          certificate={certificateFor}
          {...(certificateFor && props.onRerunCertificate ? { onRerun: () => props.onRerunCertificate!(certificateFor.claimId) } : {})}
          {...(certificateFor && props.onDownloadCertificate ? { onDownload: () => props.onDownloadCertificate!(certificateFor.claimId) } : {})}
          {...(props.certificateBusy !== undefined ? { busy: props.certificateBusy } : {})}
        />
      </div>
    )
  } else {
    main = (
      <div className="fk-prov__main">
        {props.comparison ? (
          <EditionCompare
            comparison={props.comparison}
            {...(props.defaultCompareItemId ? { defaultSelectedItemId: props.defaultCompareItemId } : {})}
            onOpenInGraph={(id) => (items.some((i) => i.id === id) ? openInGraph(id) : setView('graph'))}
            {...(props.onRequestReview ? { onRequestReview: props.onRequestReview } : {})}
          />
        ) : <EmptyState title={l.viewCompare} description={l.noComparison} framing="section" />}
      </div>
    )
  }

  const showInspector = view === 'graph' || view === 'tree'
  return (
    <div ref={rootRef} className={['fk-prov', className].filter(Boolean).join(' ')} data-view={view} data-inspector-open={showInspector && inspector ? 'true' : 'false'} data-wide={wide ? 'true' : 'false'}>
      {question}
      {notices.map((n) => (
        <InlineNotice key={n.key} tone={n.tone} urgency="polite" className="fk-prov__notice">
          {n.text}
        </InlineNotice>
      ))}
      <div className="fk-prov__body">
        {main}
        {showInspector ? inspector : null}
      </div>
    </div>
  )
}

const VIEW_ICON: Record<ProvenanceViewMode, typeof ListTree> = { graph: ProvGlyph as unknown as typeof ListTree, tree: ListTree, timeline: Hourglass, certificate: Check, compare: GitCompareArrows }

/** Three linked nodes, the provenance mark. */
function ProvGlyph(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M7 6h10M6 8l5 8M18 8l-5 8" />
    </svg>
  )
}

export interface ProvenanceViewSwitchProps {
  value: ProvenanceViewMode
  onChange: (view: ProvenanceViewMode) => void
  labels?: Partial<ProvenanceLabels>
  /** Views offered, in order (all five by default). */
  views?: readonly ProvenanceViewMode[]
  className?: string
}

/** The five views as one radio group with icons (graph, tree, timeline, certificate, compare). */
export function ProvenanceViewSwitch({ value, onChange, labels, views = VIEWS, className }: ProvenanceViewSwitchProps) {
  const l = useLabels(provenanceLabels, labels)
  const names: Record<ProvenanceViewMode, string> = { graph: l.viewGraph, tree: l.viewTree, timeline: l.viewTimeline, certificate: l.viewCertificate, compare: l.viewCompare }
  return (
    <RadioGroup className={['fk-prov-views', className].filter(Boolean).join(' ')} aria-label={l.view} orientation="horizontal" value={value} onChange={(v) => onChange(v as ProvenanceViewMode)}>
      {views.map((v) => {
        const Icon = VIEW_ICON[v]
        return (
          <Radio key={v} value={v} className="fk-prov-views__option">
            <Icon className="fk-prov-views__icon" aria-hidden="true" />
            <span className="fk-prov-views__word">{names[v]}</span>
          </Radio>
        )
      })}
    </RadioGroup>
  )
}

export interface ProvenanceQuestionProps {
  items: readonly ProvItem[]
  value: string | null
  onChange: (id: string | null) => void
  labels?: Partial<ProvenanceLabels>
  /** Show the hint of what can be asked at the end of the field. */
  hint?: boolean
  className?: string
}

/** "Where did this come from [item]": a combobox over every item, matching titles, ids, values and quoted evidence. */
export function ProvenanceQuestion({ items, value, onChange, labels, hint = false, className }: ProvenanceQuestionProps) {
  const l = useLabels(provenanceLabels, labels)
  const [input, setInput] = useState<string | null>(null)
  const current = items.find((i) => i.id === value)
  const shown = input ?? (current ? current.title : '')
  const needle = (input ?? '').trim().toLocaleLowerCase()
  const options = needle ? items.filter((i) => searchableText(i).toLocaleLowerCase().includes(needle) || l.kinds[i.kind].toLocaleLowerCase().includes(needle)) : items
  return (
    <ComboBox
      className={['fk-prov-question', className].filter(Boolean).join(' ')}
      items={options}
      selectedKey={value}
      inputValue={shown}
      onInputChange={setInput}
      onSelectionChange={(key) => {
        setInput(null)
        if (key !== null) onChange(String(key))
      }}
      menuTrigger="focus"
      allowsEmptyCollection
    >
      <div className="fk-prov-question__field">
        <Label className="fk-prov-question__label">{l.question}</Label>
        <Input className="fk-prov-question__input" placeholder={l.questionHint} dir="auto" onBlur={() => setInput(null)} />
        {hint ? (
          <span className="fk-prov-question__hint" aria-hidden="true">
            {l.questionField}
          </span>
        ) : null}
        <AriaButton className="fk-prov-question__button">
          <ChevronDown aria-hidden="true" focusable="false" />
        </AriaButton>
      </div>
      <AriaPopover className="fk-prov-question__popover" placement="bottom start">
        <ListBox className="fk-prov-question__list" renderEmptyState={() => <p className="fk-prov-question__empty">{l.questionEmpty}</p>}>
          {(item: ProvItem) => (
            <ListBoxItem id={item.id} textValue={`${l.kinds[item.kind]}: ${item.title}`} className="fk-prov-question__option">
              <Text slot="label" className="fk-prov-question__option-title">
                <span className="fk-prov-question__option-kind">{l.kinds[item.kind]}</span> {item.title}
              </Text>
              {item.meta?.[0] ? (
                <Text slot="description" className="fk-prov-question__option-meta">
                  <code dir="ltr">{item.meta[0]}</code>
                </Text>
              ) : null}
            </ListBoxItem>
          )}
        </ListBox>
      </AriaPopover>
    </ComboBox>
  )
}
