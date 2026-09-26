// FlowEditor: the editable DAG canvas. It owns one editor store per mount
// (FlowEditorState), draws the graph on CanvasSurface through the node and
// connector groups (nodeBridge), and wires tools, shortcuts, menus, dialogs,
// the outline (the keyboard alternative next to the canvas), the palette and
// the run views. Graph changes are reported debounced (onGraphChange) and
// immediately per commit (onGraphCommit, used by AutosaveController).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useMediaQuery } from '@fakhir/design-system'
import { nodeKindCatalog } from '../catalog/kindCatalog'
import { useRenderCatalog } from '../catalog/RenderCatalog'
import { absoluteRect } from '../geometry/rect'
import { AnnouncerProvider, useAnnounce } from '../internal/Announcer'
import { ConfirmProvider } from '../internal/confirm'
import { createId } from '../internal/ids'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { autoLayout, rankDirectionOf } from '../layout/autoLayout'
import { ancestorsOf } from '../model/graph'
import type { FlowConnector, FlowGraph, Point, Viewport } from '../model/types'
import { useAlignmentGuides } from '../nodes/AlignmentGuides'
import { fitGroupToMembers } from '../nodes/groupLayout'
import type { FlowNodeComponent, FlowReferenceData, StoredRule } from '../nodes/types'
import { DialogStackProvider, useActiveDialog, useDialogStack, type AgentEditorPayload, type NodeConfigPayload } from '../state/dialogStack'
import {
  createFlowEditorStore,
  FlowEditorStateProvider,
  useFlowEditorState,
  useFlowEditorStore,
  type FlowEditorStore,
} from '../state/editorState'
import { CanvasSurface } from '../surface/CanvasSurface'
import type { CanvasApi, PortRef, SurfaceNode } from '../surface/types'
import { CanvasNodeSearch } from '../toolbar/CanvasNodeSearch'
import { CanvasToolbar } from '../toolbar/CanvasToolbar'
import type { CanvasToolItem } from '../toolbar/canvasTools'
import { NodeConfigDialog, type NodeConfigDialogProps } from '../dialogs/NodeConfigDialog'
import { RunViews, type RunViewsProps } from '../run/RunViews'
import { CanvasBackgroundMenu, isContextMenuKey, NodeContextMenu, SelectionContextMenu } from './CanvasContextMenus'
import { editorToolItems, editorToolLabels, type LayoutCycle } from './editorTools'
import { FlowOutline } from './FlowOutline'
import { focusAfter } from './focusOut'
import { anchorFor, componentForKind, connectionAllowed, guideOverlay, nodeTitle, renderConnectorParts, sizeForNode, splitConnectorThrough } from './nodeBridge'
import { NodePalette, PALETTE_MEDIA_TYPE, type NodePaletteProps, type PalettePayload } from './NodePalette'
import { flowReadingOrder } from './FlowPreview'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useSelectionArrange } from './useSelectionArrange'

export interface FlowEditorLabels {
  canvas: string
  roleDescription: string
  tools: string
  outline: string
  palette: string
  aligned: string
  arranged: string
  canConnect: string
  cannotConnect: string
  group: string
  noteText: string
}

export const flowEditorLabels = defineLabels<FlowEditorLabels>('FlowEditor', {
  en: {
    canvas: 'Flow canvas',
    roleDescription: 'canvas',
    tools: 'Canvas tools',
    outline: 'Flow steps',
    palette: 'Steps to add',
    aligned: '{count, plural, one {# node} other {# nodes}} arranged',
    arranged: '{count, plural, one {# node} other {# nodes}} grouped',
    canConnect: '{name}: can connect',
    cannotConnect: '{name}: cannot connect',
    group: 'Group',
    noteText: '',
  },
  'pt-BR': {
    canvas: 'Canvas do fluxo',
    roleDescription: 'canvas',
    tools: 'Ferramentas do canvas',
    outline: 'Etapas do fluxo',
    palette: 'Etapas para adicionar',
    aligned: '{count, plural, one {# nó organizado} other {# nós organizados}}',
    arranged: '{count, plural, one {# nó agrupado} other {# nós agrupados}}',
    canConnect: '{name}: pode conectar',
    cannotConnect: '{name}: não pode conectar',
    group: 'Grupo',
    noteText: '',
  },
  es: {
    canvas: 'Lienzo del flujo',
    roleDescription: 'lienzo',
    tools: 'Herramientas del lienzo',
    outline: 'Pasos del flujo',
    palette: 'Pasos para añadir',
    aligned: '{count, plural, one {# nodo organizado} other {# nodos organizados}}',
    arranged: '{count, plural, one {# nodo agrupado} other {# nodos agrupados}}',
    canConnect: '{name}: se puede conectar',
    cannotConnect: '{name}: no se puede conectar',
    group: 'Grupo',
    noteText: '',
  },
})
export const defaultFlowEditorLabels = flowEditorLabels.bundles.en

// ---- provider -------------------------------------------------------------

export interface FlowEditorBootstrap {
  graph?: FlowGraph | null
  reference?: FlowReferenceData
}

interface ProviderValue {
  data: FlowEditorBootstrap | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: unknown
}

const ProviderContext = createContext<ProviderValue | null>(null)

export interface FlowEditorProviderProps {
  flowId?: string
  /** Loads the flow and its reference data from the host backend. */
  load?: (flowId: string) => Promise<FlowEditorBootstrap>
  onLoadError?: (error: unknown) => void
  children: ReactNode
}

/** Optional context that loads a flow and its reference data by id. */
export function FlowEditorProvider({ flowId, load, onLoadError, children }: FlowEditorProviderProps) {
  const [value, setValue] = useState<ProviderValue>({ data: null, status: 'idle', error: null })
  const report = useRef(onLoadError)
  report.current = onLoadError
  useEffect(() => {
    if (!flowId || !load) return
    let live = true
    setValue({ data: null, status: 'loading', error: null })
    load(flowId).then(
      (data) => live && setValue({ data, status: 'ready', error: null }),
      (error: unknown) => {
        if (!live) return
        setValue({ data: null, status: 'error', error })
        report.current?.(error)
      },
    )
    return () => {
      live = false
    }
  }, [flowId, load])
  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>
}

export function useFlowEditorBootstrap(): ProviderValue | null {
  return useContext(ProviderContext)
}

// ---- editor ---------------------------------------------------------------

export interface FlowEditorProps {
  flowId?: string
  /** Graph hydrated once on mount. */
  initialGraph?: FlowGraph | null
  reference?: FlowReferenceData
  /** Debounced graph report; also flushed when the page is hidden or unloaded. */
  onGraphChange?: (graph: FlowGraph) => void
  /** Every committed change, undebounced (AutosaveController). */
  onGraphCommit?: (graph: FlowGraph) => void
  debounceMs?: number
  onToggleRule?: (rule: StoredRule) => void
  extraNodeKinds?: Record<string, FlowNodeComponent>
  /** Replaces the built-in node configuration dialog. */
  renderNodeEditor?: (ctx: { payload: NodeConfigPayload; save: (config: Record<string, unknown>) => void; close: () => void }) => ReactNode
  /** Agent editor (host-supplied; the dialog-stack payload tells create or edit). */
  renderAgentEditor?: (ctx: { payload: AgentEditorPayload; close: () => void }) => ReactNode
  isCreatingAgent?: boolean
  onCancelCreateAgent?: () => void
  /** Props for the built-in node configuration dialog (data sources, loaders …). */
  nodeEditorProps?: Omit<NodeConfigDialogProps, 'onSave'>
  /** Host dock: receives the tool items; the built-in bottom toolbar otherwise. */
  renderTools?: (items: CanvasToolItem[]) => ReactNode
  /** Palette props; `false` hides the palette. */
  palette?: Omit<NodePaletteProps, 'onPlace'> | false
  /** Show the step list next to the canvas (default: below 1024 px). */
  defaultOutlineOpen?: boolean
  /** Horizontal layouts read left to right even in RTL locales. */
  keepLtrLayout?: boolean
  locked?: boolean
  singleKeyShortcuts?: boolean
  historyLimit?: number
  /** Run views (panel and drawer); shown when a loader is given. */
  runs?: Omit<RunViewsProps, 'flowId'>
  /** Existing store (hosts that drive runs or tests); one is created otherwise. */
  store?: FlowEditorStore
  labels?: Partial<FlowEditorLabels>
  className?: string
}

function graphOf(store: FlowEditorStore, viewport: Viewport): FlowGraph {
  const s = store.getState()
  return {
    nodes: s.nodes.map(({ selected: _s, measured: _m, ...n }) => n),
    connectors: s.connectors.map(({ selected: _s, ...c }) => c),
    viewport,
  }
}

export function FlowEditor(props: FlowEditorProps) {
  const boot = useFlowEditorBootstrap()
  const [store] = useState(
    () =>
      props.store ??
      createFlowEditorStore({
        historyLimit: props.historyLimit ?? 50,
        initial: {
          nodes: props.initialGraph?.nodes ?? boot?.data?.graph?.nodes ?? [],
          connectors: props.initialGraph?.connectors ?? boot?.data?.graph?.connectors ?? [],
          locked: !!props.locked,
        },
      }),
  )
  // A provider that finishes loading after mount hydrates an empty editor once.
  const hydrated = useRef(store.getState().nodes.length > 0)
  useEffect(() => {
    const g = boot?.data?.graph
    if (!hydrated.current && g) {
      hydrated.current = true
      store.setState({ nodes: g.nodes, connectors: g.connectors })
    }
  }, [boot?.data?.graph, store])
  useEffect(() => {
    store.actions.setLocked(!!props.locked)
  }, [props.locked, store])

  return (
    <FlowEditorStateProvider store={store}>
      <DialogStackProvider>
        <ConfirmProvider>
          <AnnouncerProvider>
            <EditorBody {...props} reference={props.reference ?? boot?.data?.reference ?? {}} />
          </AnnouncerProvider>
        </ConfirmProvider>
      </DialogStackProvider>
    </FlowEditorStateProvider>
  )
}

const LAYOUT_TO_CYCLE: Record<string, LayoutCycle> = { down: 'top-down', right: 'left-right' }
const NUDGE = 8

function EditorBody(props: FlowEditorProps & { reference: FlowReferenceData }) {
  const { reference, debounceMs = 800, extraNodeKinds, keepLtrLayout = false, singleKeyShortcuts = true } = props
  const l = useLabels(flowEditorLabels, props.labels)
  const editorLabels = useLabels(editorToolLabels, undefined)
  const { locale, rtl } = useFlowLocale()
  const store = useFlowEditorStore()
  const actions = store.actions
  const catalog = useRenderCatalog()
  const announce = useAnnounce()
  const dialogs = useDialogStack()
  const wide = useMediaQuery('(min-width: 1024px)', true)

  const nodes = useFlowEditorState((s) => s.nodes)
  const connectors = useFlowEditorState((s) => s.connectors)
  const locked = useFlowEditorState((s) => s.locked)
  const mode = useFlowEditorState((s) => s.controlMode)
  const density = useFlowEditorState((s) => s.cardDensity)
  const direction = useFlowEditorState((s) => s.layoutDirection)
  const panels = useFlowEditorState((s) => s.panels)
  const canUndo = useFlowEditorState((s) => s.past.length > 0)
  const canRedo = useFlowEditorState((s) => s.future.length > 0)
  const clipboard = useFlowEditorState((s) => !!s.clipboard)
  const menu = useFlowEditorState((s) => s.contextMenu)

  const apiRef = useRef<CanvasApi>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<Viewport>(props.initialGraph?.viewport ?? { x: 0, y: 0, zoom: 1 })
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport
  const [layoutCycle, setLayoutCycle] = useState<LayoutCycle>('free')
  const [outlineOpen, setOutlineOpen] = useState(props.defaultOutlineOpen ?? !wide)
  const [searchOpen, setSearchOpen] = useState(false)
  const [fitKey, setFitKey] = useState(0)
  const searchTrigger = useRef<HTMLElement | null>(null)

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const nameOf = useCallback((id: string) => {
    const n = byId.get(id)
    return n ? nodeTitle(n, catalog) : id
  }, [byId, catalog])

  // ---- graph reporting -------------------------------------------------
  const dragging = useRef(false)
  const report = useRef({ change: props.onGraphChange, commit: props.onGraphCommit })
  report.current = { change: props.onGraphChange, commit: props.onGraphCommit }
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flush = useCallback(() => {
    if (!pending.current) return
    clearTimeout(pending.current)
    pending.current = null
    report.current.change?.(graphOf(store, viewportRef.current))
  }, [store])
  useEffect(() => {
    let last = { nodes: store.getState().nodes, connectors: store.getState().connectors }
    return store.subscribe(() => {
      const s = store.getState()
      if (s.nodes === last.nodes && s.connectors === last.connectors) return
      // Selection alone is not an edit.
      const selectionOnly =
        s.nodes.length === last.nodes.length &&
        s.connectors.length === last.connectors.length &&
        s.nodes.every((n, i) => n === last.nodes[i] || (n.id === last.nodes[i]!.id && n.position === last.nodes[i]!.position && n.data === last.nodes[i]!.data && n.size === last.nodes[i]!.size && n.hidden === last.nodes[i]!.hidden && n.parentId === last.nodes[i]!.parentId)) &&
        s.connectors.every((c, i) => c === last.connectors[i] || (c.id === last.connectors[i]!.id && c.source === last.connectors[i]!.source && c.target === last.connectors[i]!.target && c.hidden === last.connectors[i]!.hidden))
      last = { nodes: s.nodes, connectors: s.connectors }
      if (selectionOnly || dragging.current) return
      const graph = graphOf(store, viewportRef.current)
      report.current.commit?.(graph)
      if (pending.current) clearTimeout(pending.current)
      pending.current = setTimeout(() => {
        pending.current = null
        report.current.change?.(graphOf(store, viewportRef.current))
      }, debounceMs)
    })
  }, [store, debounceMs])
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  // ---- surface model ---------------------------------------------------
  const ordered = useMemo(() => flowReadingOrder(nodes, connectors, direction === 'right'), [nodes, connectors, direction])
  const surfaceNodes: SurfaceNode[] = useMemo(
    () =>
      ordered.map((n) => {
        const sized = { ...n, size: n.size ?? sizeForNode(n, density) }
        return {
          id: n.id,
          rect: absoluteRect(sized, byId, sized.size),
          layer: n.kind === 'group' ? 0 : 1,
          fixedHeight: n.kind === 'group' || n.kind === 'note',
          ...(n.selected ? { selected: true } : {}),
          ...(n.hidden ? { hidden: true } : {}),
          draggable: !locked,
          tone: catalog.tone(n.kind),
        }
      }),
    [ordered, density, byId, locked, catalog],
  )

  // ---- actions ---------------------------------------------------------
  const guides = useAlignmentGuides({ nameOf })
  const dragOrigin = useRef(new Map<string, Point>())
  const arrange = useSelectionArrange({
    nodes,
    setNodes: actions.setNodes,
    snapshot: actions.snapshot,
    locked,
    groupName: l.group,
    announce: (action, d) => announce(fill(action === 'group' ? l.arranged : l.aligned, { count: d.count }, locale)),
  })

  const addNode = useCallback(
    (kind: string, at: Point, payload?: Partial<PalettePayload>) => {
      if (locked) return null
      const id = createId(kind)
      const config = payload?.config ?? nodeKindCatalog.createDefaultConfig(kind) ?? {}
      const data: Record<string, unknown> = { ...config, ...(payload?.label ? { label: payload.label } : {}) }
      if (payload?.entityId) data[kind === 'agent' ? 'agentRef' : kind === 'rule' ? 'ruleId' : 'sourceId'] = payload.entityId
      const size = sizeForNode({ id, kind, position: at, data }, density)
      actions.snapshot()
      actions.setNodes((prev) => [...prev.map((n) => (n.selected ? { ...n, selected: false } : n)), { id, kind, data, position: { x: at.x - size.width / 2, y: at.y - size.height / 2 }, selected: true }])
      return id
    },
    [locked, density, actions],
  )

  const focusNodeSoon = (id: string) => requestAnimationFrame(() => apiRef.current?.focusNode(id))

  const openConfig = useCallback(
    (id: string) => {
      const n = store.getState().nodes.find((x) => x.id === id)
      if (!n || store.getState().locked) return
      if (n.kind === 'note') return
      actions.setEditingNode(id)
      const references = ancestorsOf(id, store.getState().connectors)
      dialogs.open<NodeConfigPayload>('node-config', { nodeId: id, kind: n.kind, label: nodeTitle(n, catalog), config: n.data, references })
    },
    [store, actions, dialogs, catalog],
  )

  const saveConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      actions.snapshot()
      actions.setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, data: { ...config, ...(typeof n.data.label === 'string' && config.label === undefined ? { label: n.data.label } : {}) } } : n)))
    },
    [actions],
  )

  const connect = useCallback(
    (from: PortRef, to: PortRef) => {
      if (store.getState().locked) return
      const exists = store.getState().connectors.some((c) => c.source === from.nodeId && c.target === to.nodeId && (c.sourcePort ?? null) === (from.portId ?? null))
      if (exists) return
      actions.snapshot()
      actions.setConnectors((prev) => [
        ...prev,
        { id: createId('connector'), source: from.nodeId, target: to.nodeId, ...(from.portId ? { sourcePort: from.portId } : {}), ...(to.portId ? { targetPort: to.portId } : {}) },
      ])
    },
    [store, actions],
  )

  const autoArrange = useCallback(
    (cycle: LayoutCycle) => {
      if (locked) return
      const dir = cycle === 'left-right' ? 'right' : 'down'
      actions.setLayoutDirection(dir)
      const sized = store.getState().nodes.map((n) => ({ ...n, size: n.size ?? sizeForNode(n, density) }))
      const laid = autoLayout(sized, store.getState().connectors, rankDirectionOf(dir, rtl, keepLtrLayout))
      actions.snapshot()
      const moved = new Map(laid.map((n) => [n.id, n.position]))
      actions.setNodes((prev) => prev.map((n) => (moved.get(n.id) === n.position ? n : { ...n, position: moved.get(n.id) ?? n.position })))
      requestAnimationFrame(() => apiRef.current?.fit())
    },
    [locked, store, density, actions, rtl, keepLtrLayout],
  )

  const escape = useCallback(() => {
    const s = store.getState()
    if (s.contextMenu) {
      actions.closeContextMenu()
      return true
    }
    if (s.nodes.some((n) => n.selected) || s.connectors.some((c) => c.selected)) {
      actions.deselectAll()
      return true
    }
    return false
  }, [store, actions])

  const leave = useCallback(() => {
    const tools = rootRef.current?.querySelector<HTMLElement>('[data-fk-canvas-exit] button, [data-fk-canvas-exit] [role="button"]')
    if (tools) tools.focus()
    else focusAfter(canvasRef.current)
  }, [])

  useEditorShortcuts(
    {
      escape,
      selectTool: () => actions.setControlMode('select'),
      panTool: () => actions.setControlMode('pan'),
      toggleGrid: () => actions.togglePanel('grid'),
      toggleMinimap: () => actions.togglePanel('minimap'),
      zoom100: () => apiRef.current?.zoomTo(1),
      zoom50: () => apiRef.current?.zoomTo(0.5),
      group: () => {
        if (store.getState().nodes.filter((n) => n.selected).length < 2) return false
        arrange.group()
      },
      ungroup: () => arrange.ungroup(),
      undo: () => {
        if (!store.getState().past.length) return false
        actions.undo()
      },
      redo: () => {
        if (!store.getState().future.length) return false
        actions.redo()
      },
      copy: () => actions.copy(),
      paste: () => {
        if (!store.getState().clipboard) return false
        actions.paste()
      },
      selectAll: () => actions.selectAll(),
      duplicate: () => actions.duplicate(),
      fit: () => apiRef.current?.fit(),
      zoomOut: () => apiRef.current?.zoomOut(),
      zoomIn: () => apiRef.current?.zoomIn(),
      delete: () => {
        if (store.getState().locked) return false
        actions.removeSelection()
      },
    },
    { scope: canvasRef, enabled: true, singleKey: singleKeyShortcuts, onLeave: leave },
  )

  // ---- node keys: nudge, context menu ---------------------------------
  const onNodeKeyDown = (id: string, e: KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return
    if (isContextMenuKey(e)) {
      e.preventDefault()
      const r = target.getBoundingClientRect()
      const selectedCount = store.getState().nodes.filter((n) => n.selected).length
      actions.openContextMenu({ kind: selectedCount > 1 ? 'selection' : 'node', position: { x: r.left + 8, y: r.bottom }, targetId: id })
      return
    }
    const steps: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const step = steps[e.key]
    if (!step || locked || e.metaKey || e.ctrlKey || e.altKey) return
    if (!target.hasAttribute('data-fk-node-focus')) return
    e.preventDefault()
    e.stopPropagation()
    const amount = e.shiftKey ? NUDGE * 4 : NUDGE
    // Arrow keys move on screen: left is left in both reading directions.
    actions.snapshot()
    actions.setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, position: { x: n.position.x + step[0] * amount, y: n.position.y + step[1] * amount } } : n)))
    const moved = store.getState().nodes.find((n) => n.id === id)
    if (moved) {
      const all = store.getState().nodes.filter((n) => !n.hidden && n.id !== id).map((n) => ({ id: n.id, rect: absoluteRect(n, byId, n.size ?? sizeForNode(n, density)) }))
      guides.onKeyboardMove(all, absoluteRect(moved, byId, moved.size ?? sizeForNode(moved, density)), id)
    }
  }

  // ---- palette drop ----------------------------------------------------
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!locked && [...e.dataTransfer.types].includes(PALETTE_MEDIA_TYPE)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    const raw = e.dataTransfer.getData(PALETTE_MEDIA_TYPE)
    if (!raw || locked) return
    e.preventDefault()
    try {
      const payload = JSON.parse(raw) as PalettePayload
      const at = apiRef.current?.clientToCanvas({ x: e.clientX, y: e.clientY }) ?? { x: 0, y: 0 }
      const id = addNode(payload.kind, at, payload)
      if (id) focusNodeSoon(id)
    } catch {
      // Not a palette payload: ignore.
    }
  }

  // ---- tools -----------------------------------------------------------
  const items = editorToolItems({
    zoom: viewport.zoom,
    mode,
    onModeChange: actions.setControlMode,
    onZoomIn: () => apiRef.current?.zoomIn(),
    onZoomOut: () => apiRef.current?.zoomOut(),
    onZoomReset: () => apiRef.current?.zoomTo(1),
    onFit: () => apiRef.current?.fit(),
    ...(!locked ? { onAutoLayout: () => autoArrange(layoutCycle === 'free' ? LAYOUT_TO_CYCLE[direction] ?? 'top-down' : layoutCycle) } : {}),
    listView: outlineOpen,
    onToggleListView: () => setOutlineOpen((o) => !o),
    onSearch: () => {
      searchTrigger.current = rootRef.current?.querySelector<HTMLElement>('[data-tool="search"]') ?? null
      setSearchOpen(true)
    },
    locale,
    canUndo,
    canRedo,
    onUndo: actions.undo,
    onRedo: actions.redo,
    showMap: panels.minimap,
    showGrid: panels.grid,
    compactCards: density === 'compact',
    onToggleMap: () => actions.togglePanel('minimap'),
    onToggleGrid: () => actions.togglePanel('grid'),
    onToggleCompact: actions.toggleDensity,
    layoutDirection: layoutCycle,
    onLayoutDirectionChange: (next) => {
      setLayoutCycle(next)
      if (next !== 'free') autoArrange(next)
    },
    editorLabels,
  })

  // ---- rendering ---------------------------------------------------------
  const renderNode = (sn: SurfaceNode) => {
    const node = byId.get(sn.id)!
    const Card = componentForKind(node.kind, extraNodeKinds)
    return (
      <div
        className="fk-editor__node"
        onFocus={(e) => {
          // Keyboard focus selects the node (unless it is already in the selection).
          if (e.target.hasAttribute('data-fk-node-focus') && !node.selected) actions.select([node.id])
        }}
        // Capture phase: React Aria buttons inside cards stop key propagation.
        onKeyDownCapture={(e) => onNodeKeyDown(node.id, e)}
        onPointerDown={(e) => {
          if (e.shiftKey || e.metaKey || e.ctrlKey) actions.select([node.id], true)
          else if (!node.selected) actions.select([node.id])
        }}
      >
        <Card
          node={node}
          density={density}
          direction={direction}
          locked={locked}
          selected={!!node.selected}
          reference={reference}
          onConfigure={openConfig}
          onRemove={(id) => actions.removeNodes([id])}
          onDuplicate={(id) => actions.duplicate([id])}
          onRename={(id, label) => {
            actions.snapshot()
            actions.setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)))
          }}
          {...(props.onToggleRule ? { onToggleRule: props.onToggleRule } : {})}
        />
      </div>
    )
  }

  const selectedCount = nodes.filter((n) => n.selected).length
  const nodeConfig = useActiveDialog<NodeConfigPayload>('node-config')
  const agentDialog = useActiveDialog<AgentEditorPayload>('agent-editor')
  useEffect(() => {
    if (props.isCreatingAgent) dialogs.open<AgentEditorPayload>('agent-editor', { mode: 'create' })
  }, [props.isCreatingAgent, dialogs])

  const closeConfig = () => {
    const id = nodeConfig?.payload.nodeId
    dialogs.close()
    actions.setEditingNode(null)
    if (id) focusNodeSoon(id)
  }

  const tools = props.renderTools ? props.renderTools(items) : <CanvasToolbar items={items} label={l.tools} placement="dock" />

  return (
    <div
      ref={rootRef}
      className={['fk-editor', props.className].filter(Boolean).join(' ')}
      data-outline={outlineOpen ? 'open' : 'closed'}
      data-palette={props.palette === false ? 'none' : 'shown'}
      data-locked={locked ? 'true' : 'false'}
    >
      {props.palette !== false && wide ? (
        <aside className="fk-editor__palette" aria-label={l.palette}>
          <NodePalette
            {...(props.palette ?? {})}
            onPlace={(kind, payload) => {
              const selected = store.getState().nodes.find((n) => n.selected)
              const at = selected ? { x: selected.position.x + 320, y: selected.position.y + 60 } : (apiRef.current?.visibleCentre() ?? { x: 0, y: 0 })
              const id = addNode(kind, at, payload)
              if (id) focusNodeSoon(id)
            }}
          />
        </aside>
      ) : null}
      <div ref={canvasRef} className="fk-editor__canvas" onDragOver={onDragOver} onDrop={onDrop}>
        <CanvasSurface
          label={l.canvas}
          roleDescription={l.roleDescription}
          nodes={surfaceNodes}
          connectors={connectors}
          viewport={viewport}
          onViewportChange={setViewport}
          fit="resize"
          fitKey={fitKey}
          mode={mode}
          dragNodes={!locked}
          marquee
          grid={panels.grid}
          minimap={panels.minimap}
          apiRef={apiRef}
          portAnchor={(id, port, role) => {
            const n = byId.get(id)
            return n ? anchorFor(n, port, role, direction, catalog) : 'border'
          }}
          floating={catalog.floatingConnections}
          renderNode={renderNode}
          renderConnector={(c, shape) => {
            const conn = c as FlowConnector
            return renderConnectorParts(conn, shape, {
              sourceName: nameOf(c.source),
              targetName: nameOf(c.target),
              locked,
              selected: !!conn.selected,
              onSelect: (id) => actions.selectConnector(id),
              onDelete: (id) => actions.removeConnector(id),
              onInsertStep: (id, kind, point) => {
                const newId = addNode(kind, point)
                if (!newId) return
                // addNode took the snapshot: the split joins the same undo step.
                actions.setConnectors((prev) => splitConnectorThrough(prev, id, newId))
              },
            })
          }}
          overlay={guideOverlay(guides.guides)}
          onNodeDrag={(e) => {
            if (locked) return
            if (e.phase === 'start') {
              actions.snapshot()
              dragging.current = true
              dragOrigin.current = new Map(e.ids.map((id) => [id, byId.get(id)?.position ?? { x: 0, y: 0 }]))
              if (!e.ids.every((id) => byId.get(id)?.selected)) actions.select(e.ids)
              return
            }
            actions.setNodes((prev) => prev.map((n) => {
              const o = dragOrigin.current.get(n.id)
              return o ? { ...n, position: { x: o.x + e.delta.x, y: o.y + e.delta.y } } : n
            }))
            const ref = e.ids[0]!
            const moving = store.getState().nodes.find((n) => n.id === ref)
            if (moving && e.phase === 'move') {
              const all = store.getState().nodes.filter((n) => !n.hidden).map((n) => ({ id: n.id, rect: absoluteRect(n, byId, n.size ?? sizeForNode(n, density)) }))
              guides.createDragHandler(all)(absoluteRect(moving, byId, moving.size ?? sizeForNode(moving, density)), ref, e.ids)
            }
            if (e.phase === 'end') {
              guides.onDragStop()
              // Groups that fit their members follow them.
              const parents = new Set(e.ids.map((id) => byId.get(id)?.parentId).filter((p): p is string => !!p))
              for (const p of parents) {
                if (byId.get(p)?.data.autoFit !== false) actions.setNodes((prev) => fitGroupToMembers(prev, p))
              }
              dragging.current = false
              // Commit the whole drag as one change.
              actions.setNodes((prev) => [...prev])
            }
          }}
          onMarquee={(ids, additive) => actions.select(ids, additive)}
          onBackgroundPress={() => actions.deselectAll()}
          onBackgroundContextMenu={(screen, canvasPoint) => actions.openContextMenu({ kind: 'canvas', position: screen, targetId: `${canvasPoint.x},${canvasPoint.y}` })}
          onNodeContextMenu={(id, screen) => {
            const many = store.getState().nodes.filter((n) => n.selected).length > 1 && byId.get(id)?.selected
            actions.openContextMenu({ kind: many ? 'selection' : 'node', position: screen, targetId: id })
          }}
          onEscape={escape}
          onLeave={leave}
          connect={{
            canConnect: (a, b) => {
              const s = byId.get(a.nodeId)
              const t = byId.get(b.nodeId)
              return !locked && !!s && !!t && connectionAllowed(s, t, a.portId, b.portId)
            },
            onConnect: connect,
            nameOf,
            labels: { canConnect: (name) => fill(l.canConnect, { name }, locale), cannotConnect: (name) => fill(l.cannotConnect, { name }, locale) },
          }}
          data={{ 'data-locked': locked ? 'true' : undefined }}
        >
          {tools}
        </CanvasSurface>
      </div>
      {outlineOpen ? (
        <aside className="fk-editor__outline" aria-label={l.outline}>
          <FlowOutline
            nodes={nodes}
            connectors={connectors}
            locked={locked}
            horizontal={direction === 'right'}
            canConnect={(s, t) => connectionAllowed(s, t)}
            addableKinds={nodeKindCatalog.kinds().filter((k) => !nodeKindCatalog.isExperimental(k) && !nodeKindCatalog.isDeprecated(k)).map((k) => ({ kind: k, label: nodeKindCatalog.entry(k)?.label ?? k }))}
            onAdd={(kind) => {
              const id = addNode(kind, apiRef.current?.visibleCentre() ?? { x: 0, y: 0 })
              if (id) setFitKey((k) => k + 1)
            }}
            onConfigure={openConfig}
            onConnect={(s, t) => connect({ nodeId: s, role: 'source' }, { nodeId: t, role: 'target' })}
            onDisconnect={(id) => actions.removeConnector(id)}
            onDelete={(id) => actions.removeNodes([id])}
            onMove={(id, towards) => {
              // Reorder = swap positions with the neighbour in reading order.
              const list = flowReadingOrder(store.getState().nodes, store.getState().connectors, direction === 'right')
              const i = list.findIndex((n) => n.id === id)
              const other = list[i + towards]
              if (!other) return
              const a = list[i]!
              actions.snapshot()
              actions.setNodes((prev) => prev.map((n) => (n.id === a.id ? { ...n, position: other.position } : n.id === other.id ? { ...n, position: a.position } : n)))
            }}
            onShow={(id) => {
              apiRef.current?.reveal(id)
              actions.select([id])
              focusNodeSoon(id)
            }}
          />
        </aside>
      ) : null}
      {searchOpen ? (
        <CanvasNodeSearch
          isOpen
          onOpenChange={setSearchOpen}
          triggerRef={searchTrigger}
          nodes={nodes.filter((n) => !n.hidden).map((n) => ({ id: n.id, label: nodeTitle(n, catalog), kindLabel: catalog.entry(n.kind)?.label ?? n.kind }))}
          onPick={(id) => {
            apiRef.current?.reveal(id)
            actions.select([id])
            focusNodeSoon(id)
          }}
        />
      ) : null}
      {menu?.kind === 'node' && menu.targetId ? (
        <NodeContextMenu
          anchor={menu.position}
          targetId={menu.targetId}
          onClose={actions.closeContextMenu}
          onEdit={openConfig}
          onDuplicate={(id) => actions.duplicate([id])}
          onCopy={(id) => {
            actions.select([id])
            actions.copy()
          }}
          onDelete={(id) => actions.removeNodes([id])}
        />
      ) : null}
      {menu?.kind === 'selection' ? (
        <SelectionContextMenu
          anchor={menu.position}
          count={selectedCount}
          onClose={actions.closeContextMenu}
          onCopy={actions.copy}
          onDuplicate={() => actions.duplicate()}
          onDelete={actions.removeSelection}
          onGroup={arrange.group}
          onAlign={arrange.align}
          onDistribute={arrange.distribute}
        />
      ) : null}
      {menu?.kind === 'canvas' ? (
        <CanvasBackgroundMenu
          anchor={menu.position}
          onClose={actions.closeContextMenu}
          canvasPosition={parsePoint(menu.targetId)}
          hasClipboardContent={clipboard}
          onPaste={() => actions.paste()}
          onSelectAll={actions.selectAll}
          onFitView={() => apiRef.current?.fit()}
          onAddNote={(p) => {
            const id = addNode('note', p)
            if (id) focusNodeSoon(id)
          }}
        />
      ) : null}
      {nodeConfig
        ? props.renderNodeEditor
          ? props.renderNodeEditor({
              payload: nodeConfig.payload,
              save: (config) => {
                saveConfig(nodeConfig.payload.nodeId, config)
                closeConfig()
              },
              close: closeConfig,
            })
          : <NodeConfigDialog {...(props.nodeEditorProps ?? {})} onSave={(id, config) => saveConfig(id, config)} />
        : null}
      {agentDialog && props.renderAgentEditor
        ? props.renderAgentEditor({
            payload: agentDialog.payload,
            close: () => {
              dialogs.close()
              if (agentDialog.payload.mode === 'create') props.onCancelCreateAgent?.()
            },
          })
        : null}
      {props.runs && props.flowId ? <RunViews flowId={props.flowId} {...props.runs} /> : null}
    </div>
  )
}

function parsePoint(s: string | undefined): Point {
  const [x, y] = (s ?? '0,0').split(',').map(Number)
  return { x: x ?? 0, y: y ?? 0 }
}
