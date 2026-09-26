// CanvasSurface: the pannable, zoomable plane every canvas of this package is
// built on (provenance graph, flow editor, flow preview). Nodes are ordinary
// HTML placed in canvas coordinates, in reading order, so the DOM (and the Tab
// order) follows the picture. Connectors are one SVG cubic each.
//
// Pointer gestures (mouse, pen and touch through Pointer Events):
//  - background: pan (hand mode, touch, middle button, Space held) or
//    marquee selection (select mode, primary mouse button);
//  - node: drag (select mode, after a small threshold), never a press;
//  - port ([data-fk-port]): draw a connection;
//  - two touch points: pinch zoom around their midpoint;
//  - wheel: pan, or zoom with Ctrl/⌘ (and trackpad pinch), or always zoom.

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { ConnectionPreviewLine } from '../connectors/ConnectionPreviewLine'
import { connectorCurve, type CurveEnd } from '../geometry/curve'
import { centreOf, enclosingRect, exitPoint, pointOnSide, rectsOverlap } from '../geometry/rect'
import { DEFAULT_ZOOM_LIMITS, clampZoom, fitBounds, ladderStep, revealRect, screenToCanvas, visibleArea, zoomAt, type ZoomLimits } from '../geometry/viewport'
import { useFlowLocale } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import type { Point, Rect, Side, Size, Viewport } from '../model/types'
import { OverviewMap } from './OverviewMap'
import { SurfaceContext, type SurfaceContextValue } from './SurfaceContext'
import type { CanvasApi, ConnectOptions, ConnectValidity, ConnectorParts, ConnectorShape, NodeDragEvent, PortAnchor, PortRef, SurfaceConnector, SurfaceNode } from './types'
import { useElementSize } from './useElementSize'
import { useNodeMeasurement } from './useNodeMeasurement'

export interface CanvasSurfaceProps {
  /** Accessible name of the canvas. */
  label: string
  /** Spoken role, for example "canvas" or "graph". */
  roleDescription?: string
  nodes: readonly SurfaceNode[]
  connectors?: readonly SurfaceConnector[]
  renderNode: (node: SurfaceNode) => ReactNode
  renderConnector?: (connector: SurfaceConnector, shape: ConnectorShape) => ConnectorParts
  /**
   * Where a connector touches its nodes. Sides are logical: in a right-to-left
   * canvas 'start' is the right side. 'border' attaches to the nearest border point.
   */
  portAnchor?: (nodeId: string, portId: string | undefined, role: 'source' | 'target') => PortAnchor | 'border'
  floating?: boolean
  /** Reading direction; defaults to the provider locale's. */
  direction?: 'ltr' | 'rtl'

  viewport?: Viewport
  defaultViewport?: Viewport
  onViewportChange?: (v: Viewport) => void
  zoomLimits?: ZoomLimits
  /** When to fit the graph into view. */
  fit?: 'mount' | 'resize' | 'none'
  /** Changing this value refits (for example a graph revision). */
  fitKey?: unknown
  fitPadding?: number
  /** Highest zoom a fit may choose (1 keeps text at its natural size). */
  maxFitZoom?: number

  mode?: 'select' | 'pan'
  dragNodes?: boolean
  marquee?: boolean
  wheel?: 'pan' | 'zoom' | 'none'
  pinch?: boolean

  onNodeDrag?: (e: NodeDragEvent) => void
  onMarquee?: (ids: string[], additive: boolean) => void
  onBackgroundPress?: (canvasPoint: Point) => void
  onBackgroundContextMenu?: (screen: Point, canvas: Point) => void
  onNodeContextMenu?: (id: string, screen: Point) => void
  onNodeKeyDown?: (id: string, e: KeyboardEvent<HTMLElement>) => void
  onNodeMeasured?: (id: string, size: Size) => void
  /** Escape inside the canvas. Return true when handled (e.g. selection cleared). */
  onEscape?: () => boolean
  /** Escape with nothing to clear: move focus out of the canvas (never trapped). */
  onLeave?: () => void
  connect?: ConnectOptions

  grid?: boolean
  minimap?: boolean
  /** Canvas-space content drawn above connectors (alignment guides …). */
  overlay?: ReactNode
  /** Screen-space content over the canvas (toolbars, legends). */
  children?: ReactNode
  apiRef?: Ref<CanvasApi>
  className?: string
  /** Extra data attributes on the root (e.g. data-locked). */
  data?: Record<`data-${string}`, string | undefined>
}

const DRAG_THRESHOLD = 4

/** Logical side → physical side of the (always left-to-right) canvas geometry. */
export function physicalSide(side: Side, rtl: boolean): Side {
  if (!rtl) return side
  return side === 'start' ? 'end' : side === 'end' ? 'start' : side
}
const GRID_STEP = 24
const NO_DRAG = 'input, textarea, select, [contenteditable="true"], [data-fk-no-drag], [data-fk-port]'

type Gesture =
  | { kind: 'pan'; pointerId: number; start: Point; origin: Viewport }
  | { kind: 'marquee'; pointerId: number; start: Point; now: Point; additive: boolean }
  | { kind: 'node'; pointerId: number; start: Point; nodeId: string; ids: string[] | null; zoom: number }
  | { kind: 'connect'; pointerId: number; from: PortRef; pointer: Point }
  | { kind: 'pinch'; ids: [number, number]; startDistance: number; startMid: Point; origin: Viewport }

export function CanvasSurface(props: CanvasSurfaceProps) {
  const {
    label,
    roleDescription,
    nodes,
    connectors = [],
    renderNode,
    renderConnector,
    portAnchor,
    floating = false,
    direction,
    zoomLimits = DEFAULT_ZOOM_LIMITS,
    fit = 'mount',
    fitKey,
    fitPadding = 48,
    maxFitZoom = 1,
    mode = 'select',
    dragNodes = false,
    marquee = false,
    wheel = 'pan',
    pinch = true,
    onNodeDrag,
    onMarquee,
    onBackgroundPress,
    onBackgroundContextMenu,
    onNodeContextMenu,
    onNodeKeyDown,
    onNodeMeasured,
    onEscape,
    onLeave,
    connect,
    grid = false,
    minimap = false,
    overlay,
    children,
    apiRef,
    className,
    data,
  } = props

  const paneRef = useRef<HTMLDivElement>(null)
  const localeDirection = useFlowLocale().direction
  const rtl = (direction ?? localeDirection) === 'rtl'
  const container = useElementSize(paneRef)
  const [viewport, setViewport] = useControllable<Viewport>(props.viewport, props.defaultViewport ?? { x: 0, y: 0, zoom: 1 }, props.onViewportChange)
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport

  // Measured node sizes refine the declared ones.
  const { measured, refFor } = useNodeMeasurement(onNodeMeasured)
  const placed = useMemo(() => {
    const map = new Map<string, Rect>()
    for (const n of nodes) {
      if (n.hidden) continue
      const m = measured.get(n.id)
      map.set(n.id, m ? { ...n.rect, width: m.width, height: n.fixedHeight ? n.rect.height : Math.max(m.height, 1) } : n.rect)
    }
    return map
  }, [nodes, measured])

  const ordered = useMemo(() => nodes.filter((n) => !n.hidden).map((n, i) => ({ n, i })).sort((a, b) => (a.n.layer ?? 1) - (b.n.layer ?? 1) || a.i - b.i).map((x) => x.n), [nodes])

  // ---- viewport helpers -------------------------------------------------
  const bounds = useCallback(() => enclosingRect([...placed.values()]), [placed])
  const fitNow = useCallback(() => setViewport(fitBounds(bounds(), container, fitPadding, zoomLimits, maxFitZoom)), [bounds, container, fitPadding, zoomLimits, maxFitZoom, setViewport])
  const centrePivot = useCallback((): Point => ({ x: container.width / 2, y: container.height / 2 }), [container])

  const didFit = useRef(false)
  useEffect(() => {
    if (fit === 'none') return
    if (!didFit.current || fit === 'resize') {
      didFit.current = true
      fitNow()
    }
    // Refit on container size (resize mode) and on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container.width, container.height])
  const lastFitKey = useRef(fitKey)
  useEffect(() => {
    if (fit === 'none' || Object.is(lastFitKey.current, fitKey)) return
    lastFitKey.current = fitKey
    fitNow()
  }, [fitKey, fit, fitNow])

  const clientToLocal = useCallback((p: Point): Point => {
    const r = paneRef.current?.getBoundingClientRect()
    return r ? { x: p.x - r.left, y: p.y - r.top } : p
  }, [])

  const focusNode = useCallback((id: string) => {
    const wrapper = paneRef.current?.querySelector<HTMLElement>(`[data-fk-node-id="${CSS.escape(id)}"]`)
    if (!wrapper) return
    const target = wrapper.querySelector<HTMLElement>('[data-fk-node-focus], button, [tabindex]:not([tabindex="-1"])') ?? wrapper
    target.focus()
  }, [])

  useImperativeHandle(
    apiRef,
    (): CanvasApi => ({
      zoomIn: () => setViewport(zoomAt(viewportRef.current, ladderStep(viewportRef.current.zoom, 1, zoomLimits), centrePivot(), zoomLimits)),
      zoomOut: () => setViewport(zoomAt(viewportRef.current, ladderStep(viewportRef.current.zoom, -1, zoomLimits), centrePivot(), zoomLimits)),
      zoomTo: (z) => setViewport(zoomAt(viewportRef.current, z, centrePivot(), zoomLimits)),
      fit: fitNow,
      getViewport: () => viewportRef.current,
      setViewport,
      visibleCentre: () => centreOf(visibleArea(viewportRef.current, container)),
      clientToCanvas: (p) => screenToCanvas(viewportRef.current, clientToLocal(p)),
      reveal: (id) => {
        const r = placed.get(id)
        if (r) setViewport(revealRect(viewportRef.current, r, container))
      },
      focusNode,
      containerSize: () => container,
    }),
    [setViewport, zoomLimits, centrePivot, fitNow, container, clientToLocal, placed, focusNode],
  )

  // ---- connectors -------------------------------------------------------
  const endOf = useCallback(
    (nodeId: string, portId: string | undefined, role: 'source' | 'target', other: Rect): CurveEnd | null => {
      const r = placed.get(nodeId)
      if (!r) return null
      const anchor = floating ? 'border' : (portAnchor?.(nodeId, portId, role) ?? { side: role === 'source' ? 'end' : 'start', along: 0.5 })
      if (anchor === 'border') return exitPoint(r, centreOf(other))
      // Geometry is physical (start = left); logical sides mirror in RTL.
      const side = physicalSide(anchor.side, rtl)
      return { point: pointOnSide(r, side, anchor.along), side }
    },
    [placed, portAnchor, floating, rtl],
  )

  const shapes = useMemo(() => {
    const out: Array<{ c: SurfaceConnector; shape: ConnectorShape }> = []
    for (const c of connectors) {
      if (c.hidden) continue
      const s = placed.get(c.source)
      const t = placed.get(c.target)
      if (!s || !t) continue
      const from = endOf(c.source, c.sourcePort, 'source', t)
      const to = endOf(c.target, c.targetPort, 'target', s)
      if (!from || !to) continue
      const g = connectorCurve(from, to)
      out.push({ c, shape: { ...g, from, to, sourceRect: s, targetRect: t } })
    }
    return out
  }, [connectors, placed, endOf])

  // ---- gestures ---------------------------------------------------------
  const gesture = useRef<Gesture | null>(null)
  const touches = useRef(new Map<number, Point>())
  const dragEndedAt = useRef(0)
  const spaceHeld = useRef(false)
  const [marqueeBox, setMarqueeBox] = useState<Rect | null>(null)
  const [connecting, setConnecting] = useState<{ from: PortRef; pointer: Point } | null>(null)
  const [connectTarget, setConnectTarget] = useState<{ nodeId: string; portId?: string; role?: 'source' | 'target'; valid: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [liveText, setLiveText] = useState('')

  const hitTarget = (clientX: number, clientY: number, fallbackTarget: EventTarget | null): HTMLElement | null => {
    const fromPoint = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(clientX, clientY) : null
    return (fromPoint as HTMLElement | null) ?? (fallbackTarget instanceof HTMLElement || fallbackTarget instanceof SVGElement ? (fallbackTarget as HTMLElement) : null)
  }

  const resolveDrop = useCallback(
    (el: HTMLElement | null, from: PortRef): { ref: PortRef; valid: boolean } | null => {
      if (!el || !connect) return null
      const port = el.closest<HTMLElement>('[data-fk-port]')
      const nodeEl = el.closest<HTMLElement>('[data-fk-node-id]')
      const nodeId = port?.dataset.fkPortNode ?? nodeEl?.dataset.fkNodeId
      if (!nodeId) return null
      const wanted: 'source' | 'target' = from.role === 'source' ? 'target' : 'source'
      const portRole = port?.dataset.fkPortRole as 'source' | 'target' | undefined
      const ref: PortRef = { nodeId, role: wanted, ...(port && portRole === wanted && port.dataset.fkPortId ? { portId: port.dataset.fkPortId } : {}) }
      const src = from.role === 'source' ? from : ref
      const tgt = from.role === 'source' ? ref : from
      return { ref, valid: nodeId !== from.nodeId && connect.canConnect(src, tgt) }
    },
    [connect],
  )

  const onWindowMove = useCallback(
    (e: PointerEvent) => {
      const g = gesture.current
      if (!g) return
      if (g.kind === 'pinch') {
        if (!touches.current.has(e.pointerId)) return
        touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const a = touches.current.get(g.ids[0])
        const b = touches.current.get(g.ids[1])
        if (!a || !b) return
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const mid = clientToLocal({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
        const zoomed = zoomAt(g.origin, clampZoom(g.origin.zoom * (dist / Math.max(1, g.startDistance)), zoomLimits), g.startMid, zoomLimits)
        setViewport({ ...zoomed, x: zoomed.x + (mid.x - g.startMid.x), y: zoomed.y + (mid.y - g.startMid.y) })
        return
      }
      if (e.pointerId !== g.pointerId) return
      const here = { x: e.clientX, y: e.clientY }
      if (g.kind === 'pan') {
        setViewport({ ...g.origin, x: g.origin.x + here.x - g.start.x, y: g.origin.y + here.y - g.start.y })
      } else if (g.kind === 'marquee') {
        g.now = here
        const a = clientToLocal(g.start)
        const b = clientToLocal(here)
        setMarqueeBox({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) })
      } else if (g.kind === 'node') {
        const dx = here.x - g.start.x
        const dy = here.y - g.start.y
        if (!g.ids) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
          const self = nodes.find((n) => n.id === g.nodeId)
          g.ids = self?.selected ? nodes.filter((n) => n.selected && !n.hidden && n.draggable !== false).map((n) => n.id) : [g.nodeId]
          setDragging(true)
          onNodeDrag?.({ ids: g.ids, delta: { x: 0, y: 0 }, phase: 'start' })
        }
        onNodeDrag?.({ ids: g.ids, delta: { x: dx / g.zoom, y: dy / g.zoom }, phase: 'move' })
      } else if (g.kind === 'connect') {
        const local = clientToLocal(here)
        g.pointer = screenToCanvas(viewportRef.current, local)
        setConnecting({ from: g.from, pointer: g.pointer })
        const drop = resolveDrop(hitTarget(e.clientX, e.clientY, e.target), g.from)
        setConnectTarget((prev) => {
          const next = drop ? { nodeId: drop.ref.nodeId, ...(drop.ref.portId ? { portId: drop.ref.portId } : {}), role: drop.ref.role, valid: drop.valid } : null
          if (next && (!prev || prev.nodeId !== next.nodeId || prev.valid !== next.valid)) {
            const name = connect?.nameOf?.(next.nodeId) ?? next.nodeId
            setLiveText(next.valid ? (connect?.labels?.canConnect?.(name) ?? `${name}: can connect`) : (connect?.labels?.cannotConnect?.(name) ?? `${name}: cannot connect`))
          }
          return next
        })
      }
    },
    // nodes/connect change between renders; the handler is re-bound per gesture
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientToLocal, setViewport, zoomLimits, nodes, onNodeDrag, resolveDrop, connect],
  )

  const endGesture = useCallback(
    (e: PointerEvent) => {
      touches.current.delete(e.pointerId)
      const g = gesture.current
      if (!g) return
      if (g.kind === 'pinch') {
        if (touches.current.size < 2) gesture.current = null
        return
      }
      if (e.pointerId !== g.pointerId) return
      gesture.current = null
      if (g.kind === 'marquee') {
        setMarqueeBox(null)
        const a = clientToLocal(g.start)
        const b = clientToLocal(g.now)
        if (Math.hypot(a.x - b.x, a.y - b.y) < DRAG_THRESHOLD) {
          onBackgroundPress?.(screenToCanvas(viewportRef.current, a))
          return
        }
        const p1 = screenToCanvas(viewportRef.current, a)
        const p2 = screenToCanvas(viewportRef.current, b)
        const box = { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y), width: Math.abs(p1.x - p2.x), height: Math.abs(p1.y - p2.y) }
        onMarquee?.(
          [...placed.entries()].filter(([, r]) => rectsOverlap(r, box)).map(([id]) => id),
          g.additive,
        )
      } else if (g.kind === 'pan') {
        const moved = Math.hypot(e.clientX - g.start.x, e.clientY - g.start.y)
        if (moved < DRAG_THRESHOLD && e.type !== 'pointercancel') onBackgroundPress?.(screenToCanvas(viewportRef.current, clientToLocal(g.start)))
      } else if (g.kind === 'node') {
        if (g.ids) {
          dragEndedAt.current = performance.now()
          setDragging(false)
          const dx = (e.clientX - g.start.x) / g.zoom
          const dy = (e.clientY - g.start.y) / g.zoom
          onNodeDrag?.({ ids: g.ids, delta: { x: dx, y: dy }, phase: 'end' })
        }
      } else if (g.kind === 'connect') {
        setConnecting(null)
        setConnectTarget(null)
        if (e.type === 'pointercancel' || !connect) return
        const drop = resolveDrop(hitTarget(e.clientX, e.clientY, e.target), g.from)
        if (drop?.valid) {
          const src = g.from.role === 'source' ? g.from : drop.ref
          const tgt = g.from.role === 'source' ? drop.ref : g.from
          connect.onConnect(src, tgt)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientToLocal, onBackgroundPress, onMarquee, placed, onNodeDrag, connect, resolveDrop],
  )

  useEffect(() => {
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', endGesture)
    window.addEventListener('pointercancel', endGesture)
    return () => {
      window.removeEventListener('pointermove', onWindowMove)
      window.removeEventListener('pointerup', endGesture)
      window.removeEventListener('pointercancel', endGesture)
    }
  }, [onWindowMove, endGesture])

  const onPointerDownCapture = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const here = { x: e.clientX, y: e.clientY }
    if (e.pointerType === 'touch') {
      touches.current.set(e.pointerId, here)
      if (pinch && touches.current.size === 2) {
        const [a, b] = [...touches.current.entries()]
        gesture.current = {
          kind: 'pinch',
          ids: [a![0], b![0]],
          startDistance: Math.hypot(a![1].x - b![1].x, a![1].y - b![1].y),
          startMid: clientToLocal({ x: (a![1].x + b![1].x) / 2, y: (a![1].y + b![1].y) / 2 }),
          origin: viewportRef.current,
        }
        return
      }
    }
    if (target.closest('[data-fk-surface-chrome]')) return
    const port = target.closest<HTMLElement>('[data-fk-port]')
    if (port && connect && e.button === 0 && mode === 'select') {
      const nodeId = port.dataset.fkPortNode
      const role = port.dataset.fkPortRole as 'source' | 'target' | undefined
      if (nodeId && role) {
        e.preventDefault()
        e.stopPropagation()
        const from: PortRef = { nodeId, role, ...(port.dataset.fkPortId ? { portId: port.dataset.fkPortId } : {}) }
        const pointer = screenToCanvas(viewportRef.current, clientToLocal(here))
        gesture.current = { kind: 'connect', pointerId: e.pointerId, from, pointer }
        setConnecting({ from, pointer })
        return
      }
    }
    const nodeEl = target.closest<HTMLElement>('[data-fk-node-id]')
    const wantsPan = mode === 'pan' || e.button === 1 || spaceHeld.current || (e.pointerType === 'touch' && !nodeEl)
    if (wantsPan && (e.button === 0 || e.button === 1)) {
      gesture.current = { kind: 'pan', pointerId: e.pointerId, start: here, origin: viewportRef.current }
      return
    }
    if (nodeEl && e.button === 0) {
      const id = nodeEl.dataset.fkNodeId!
      const self = nodes.find((n) => n.id === id)
      if (dragNodes && self?.draggable !== false && !target.closest(NO_DRAG)) {
        gesture.current = { kind: 'node', pointerId: e.pointerId, start: here, nodeId: id, ids: null, zoom: viewportRef.current.zoom }
      }
      return
    }
    if (!nodeEl && e.button === 0) {
      gesture.current = marquee
        ? { kind: 'marquee', pointerId: e.pointerId, start: here, now: here, additive: e.shiftKey || e.metaKey || e.ctrlKey }
        : { kind: 'pan', pointerId: e.pointerId, start: here, origin: viewportRef.current }
    }
  }

  // Wheel needs a non-passive listener to keep the page from scrolling.
  useEffect(() => {
    const el = paneRef.current
    if (!el || wheel === 'none') return
    const onWheel = (e: WheelEvent) => {
      const local = clientToLocal({ x: e.clientX, y: e.clientY })
      const v = viewportRef.current
      if (wheel === 'zoom' || e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setViewport(zoomAt(v, v.zoom * Math.exp(-e.deltaY * 0.0015), local, zoomLimits))
      } else {
        e.preventDefault()
        setViewport({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY })
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [wheel, clientToLocal, setViewport, zoomLimits])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' && e.target === paneRef.current) spaceHeld.current = true
    if (e.key === 'Escape' && !e.defaultPrevented) {
      if (gesture.current?.kind === 'connect') {
        gesture.current = null
        setConnecting(null)
        setConnectTarget(null)
        e.preventDefault()
        return
      }
      const handled = onEscape?.() ?? false
      e.preventDefault()
      if (!handled) onLeave?.()
      return
    }
    // Keyboard view control when the canvas itself (not a node) has focus.
    if (e.target !== paneRef.current || e.metaKey || e.ctrlKey || e.altKey) return
    const v = viewportRef.current
    const step = e.shiftKey ? 160 : 40
    const pans: Record<string, Point> = { ArrowLeft: { x: step, y: 0 }, ArrowRight: { x: -step, y: 0 }, ArrowUp: { x: 0, y: step }, ArrowDown: { x: 0, y: -step } }
    const pan = pans[e.key]
    if (pan) {
      e.preventDefault()
      setViewport({ ...v, x: v.x + pan.x, y: v.y + pan.y })
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      setViewport(zoomAt(v, ladderStep(v.zoom, 1, zoomLimits), centrePivot(), zoomLimits))
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault()
      setViewport(zoomAt(v, ladderStep(v.zoom, -1, zoomLimits), centrePivot(), zoomLimits))
    }
  }
  const onKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ') spaceHeld.current = false
  }

  const ctx = useMemo<SurfaceContextValue>(
    () => ({
      zoom: viewport.zoom,
      justDragged: () => performance.now() - dragEndedAt.current < 250,
      connecting: connecting?.from ?? null,
      connectTarget: connectTarget ? { nodeId: connectTarget.nodeId, valid: connectTarget.valid } : null,
      floating,
    }),
    [viewport.zoom, connecting, connectTarget, floating],
  )

  const preview = useMemo(() => {
    if (!connecting) return null
    const r = placed.get(connecting.from.nodeId)
    if (!r) return null
    const pointerRect = { ...connecting.pointer, width: 0, height: 0 }
    const start = endOf(connecting.from.nodeId, connecting.from.portId, connecting.from.role, pointerRect)
    if (!start) return null
    let to: Point & { side?: CurveEnd['side'] } = connecting.pointer
    if (connectTarget?.valid) {
      const tr = placed.get(connectTarget.nodeId)
      const end = tr ? endOf(connectTarget.nodeId, connectTarget.portId, connectTarget.role ?? 'target', r) : null
      if (end) to = { ...end.point, side: end.side }
    }
    const validity: ConnectValidity = connectTarget ? (connectTarget.valid ? 'valid' : 'invalid') : 'unknown'
    return <ConnectionPreviewLine from={{ ...start.point, side: start.side }} to={to} validity={validity} />
  }, [connecting, connectTarget, placed, endOf])

  const svgParts: ReactNode[] = []
  const htmlParts: ReactNode[] = []
  for (const { c, shape } of shapes) {
    const parts: ConnectorParts = renderConnector ? renderConnector(c, shape) : { svg: <path className="fk-surface__connector" d={shape.d} markerEnd="url(#fk-surface-arrow)" /> }
    if (parts.svg) svgParts.push(<g key={c.id}>{parts.svg}</g>)
    if (parts.html) htmlParts.push(<div key={c.id} className="fk-surface__connector-html">{parts.html}</div>)
  }

  const transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
  const gridSize = GRID_STEP * viewport.zoom

  return (
    <SurfaceContext.Provider value={ctx}>
      <div
        ref={paneRef}
        className={['fk-surface', className].filter(Boolean).join(' ')}
        role="group"
        aria-label={label}
        aria-roledescription={roleDescription}
        tabIndex={0}
        data-mode={mode}
        data-direction={rtl ? 'rtl' : 'ltr'}
        data-dragging={dragging || undefined}
        data-connecting={connecting ? 'true' : undefined}
        onPointerDownCapture={onPointerDownCapture}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onContextMenu={(e) => {
          const target = e.target as HTMLElement
          const nodeEl = target.closest<HTMLElement>('[data-fk-node-id]')
          const local = clientToLocal({ x: e.clientX, y: e.clientY })
          if (nodeEl && onNodeContextMenu) {
            e.preventDefault()
            onNodeContextMenu(nodeEl.dataset.fkNodeId!, { x: e.clientX, y: e.clientY })
          } else if (!nodeEl && !target.closest('[data-fk-surface-chrome]') && onBackgroundContextMenu) {
            e.preventDefault()
            onBackgroundContextMenu({ x: e.clientX, y: e.clientY }, screenToCanvas(viewportRef.current, local))
          }
        }}
        {...data}
      >
        {grid ? (
          <svg className="fk-surface__grid" aria-hidden="true" focusable="false">
            <defs>
              <pattern id="fk-surface-grid" patternUnits="userSpaceOnUse" x={viewport.x % gridSize} y={viewport.y % gridSize} width={gridSize} height={gridSize}>
                <circle cx={gridSize / 2} cy={gridSize / 2} r={Math.max(0.6, 1 * viewport.zoom)} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fk-surface-grid)" />
          </svg>
        ) : null}
        <div className="fk-surface__plane" style={{ transform }}>
          <svg className="fk-surface__links" aria-hidden="true" focusable="false">
            <defs>
              <marker id="fk-surface-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="fk-surface__arrowhead" />
              </marker>
            </defs>
            {svgParts}
            {preview}
          </svg>
          {ordered.map((n) => {
            const r = n.rect
            return (
              <div
                key={n.id}
                className="fk-surface__node"
                data-fk-node-id={n.id}
                data-layer={n.layer ?? 1}
                style={{ transform: `translate(${r.x}px, ${r.y}px)`, width: r.width, ...(n.fixedHeight ? { height: r.height } : { minHeight: r.height }) }}
                onKeyDown={onNodeKeyDown ? (e) => onNodeKeyDown(n.id, e) : undefined}
                ref={refFor(n.id)}
              >
                {renderNode(n)}
              </div>
            )
          })}
          {overlay}
          {htmlParts}
        </div>
        {marqueeBox ? <div className="fk-surface__marquee" aria-hidden="true" style={{ left: marqueeBox.x, top: marqueeBox.y, width: marqueeBox.width, height: marqueeBox.height }} /> : null}
        {minimap ? <OverviewMap nodes={ordered} rects={placed} viewport={viewport} container={container} onCentre={(p) => setViewport({ ...viewportRef.current, x: container.width / 2 - p.x * viewportRef.current.zoom, y: container.height / 2 - p.y * viewportRef.current.zoom })} /> : null}
        {children}
        <div className="fk-visually-hidden" role="status" aria-live="polite">
          {connecting ? liveText : ''}
        </div>
      </div>
    </SurfaceContext.Provider>
  )

}
