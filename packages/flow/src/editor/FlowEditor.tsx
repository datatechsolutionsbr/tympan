// FlowEditor: the editable DAG canvas of an analysis. It owns one editor
// store per mount (FlowEditorState), draws the graph on CanvasSurface through
// the node and connector groups (nodeBridge) and research steps (steps/), and
// wires the step palette, the four ways to add a step (the "+" under a step,
// the "+" on a link, a palette drag, the A key and dock item), typed wiring
// checks, the side panel (flow summary or step settings), the list view (the
// keyboard view of the canvas), shortcuts, menus, dialogs and run views.
// Graph changes are reported debounced (onGraphChange) and immediately per
// commit (onGraphCommit, used by AutosaveController).

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
import { Button, Drawer, useMediaQuery } from '@fakhir/design-system'
import { Plus } from 'lucide-react'
import { nodeKindCatalog } from '../catalog/kindCatalog'
import { useRenderCatalog } from '../catalog/RenderCatalog'
import { absoluteRect } from '../geometry/rect'
import { AnnouncerProvider, useAnnounce } from '../internal/Announcer'
import { ConfirmProvider } from '../internal/confirm'
import { createId } from '../internal/ids'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { autoLayout, rankDirectionOf } from '../layout/autoLayout'
import { ancestorsOf } from '../model/graph'
import type { FlowConnector, FlowGraph, FlowNode, Point, Viewport } from '../model/types'
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
import { AddStepPicker } from '../steps/AddStepPicker'
import { FlowSidePanel, type FlowFacts, type OutputPreview } from '../steps/FlowSidePanel'
import { IssueBar } from '../steps/IssueBar'
import { researchStepCatalog, specOfNode, STEP_KIND, type ReadyStep, type StepCatalog } from '../steps/researchSteps'
import type { DataShape } from '../steps/shapes'
import { alongEdge, STEP_CARD_SIZE, StepCard } from '../steps/StepCard'
import { StepListView } from '../steps/StepListView'
import { StepPalette, STEP_MEDIA_TYPE, stepOfDrag, type StepPaletteProps } from '../steps/StepPalette'
import { StepsProvider, useReadyCatalog } from '../steps/StepsContext'
import { stepEditorWords } from '../steps/stepLabels'
import { stepToolItems } from '../steps/stepTools'
import { givenShape, inputIndex, linkAfter, linkThrough, stepNode, stepsAccepting, swapNeighbours, wiringIssues, type WiringIssue } from '../steps/wiring'
import { NodeConfigDialog, type NodeConfigDialogProps } from '../dialogs/NodeConfigDialog'
import { RunViews, type RunViewsProps } from '../run/RunViews'
import { CanvasBackgroundMenu, isContextMenuKey, NodeContextMenu, SelectionContextMenu } from './CanvasContextMenus'
import type { LayoutCycle } from './editorTools'
import { focusAfter } from './focusOut'
import { anchorFor, componentForKind, connectionAllowed, guideOverlay, nodeTitle, renderConnectorParts, sizeForNode, splitConnectorThrough } from './nodeBridge'
import { PALETTE_MEDIA_TYPE, type PalettePayload } from './NodePalette'
import { flowReadingOrder } from './FlowPreview'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useSelectionArrange } from './useSelectionArrange'

export interface FlowEditorLabels {
  canvas: string
  roleDescription: string
  tools: string
  outline: string
  palette: string
  openPalette: string
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
    openPalette: 'Show steps',
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
    openPalette: 'Mostrar passos',
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
    openPalette: 'Mostrar pasos',
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
  /** Step palette props; `false` hides the palette. */
  palette?: Pick<StepPaletteProps, 'className'> | false
  /** Research steps and their shelves (default: the built-in research verbs). */
  steps?: StepCatalog
  /** False when the project allows no agents: AI steps are unavailable. */
  agentsAllowed?: boolean
  /** Start in the list view instead of the canvas. */
  defaultListView?: boolean
  /** `false` hides the side panel (flow summary / step settings). */
  sidePanel?: boolean
  /** Facts the summary shows next to what the editor counts. */
  flowFacts?: FlowFacts
  onRunFlow?: () => void
  /** Called after "validate flow" with the wiring issues found. */
  onValidate?: (issues: readonly WiringIssue[]) => void
  onTestStep?: (nodeId: string) => void
  /** A few rows of a step's output for the side panel. */
  outputPreview?: (nodeId: string) => OutputPreview | null
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
/** Step flows keep their main chain on one line with branches after it. */
const STEP_SPACING = (rtl: boolean) => ({ rankGap: 54, siblingGap: 24, alignment: 'start' as const, rtl })
const DRAWN = (n: FlowNode) => n.kind !== 'note' && n.kind !== 'group'
const isTyping = (el: HTMLElement) => !!el.closest('input, textarea, select, [contenteditable="true"]')
const plainA = (e: KeyboardEvent<HTMLElement>) => (e.key === 'a' || e.key === 'A') && !e.metaKey && !e.ctrlKey && !e.altKey

/** Where a new step goes: after a step, inside a link, or loose near a point. */
type Placement = { after: string } | { through: string } | { near: Point }

interface PickerState {
  title: string
  /** Shorter title for the search placeholder. */
  placeholder?: string
  arriving?: DataShape | null
  options: ReadyStep[]
  place: (stepId: string) => void
}

function EditorBody(props: FlowEditorProps & { reference: FlowReferenceData }) {
  const { reference, debounceMs = 800, extraNodeKinds, keepLtrLayout = false, singleKeyShortcuts = true } = props
  const l = useLabels(flowEditorLabels, props.labels)
  const sw = useLabels(stepEditorWords, undefined)
  const { locale, rtl } = useFlowLocale()
  const store = useFlowEditorStore()
  const actions = store.actions
  const catalog = useRenderCatalog()
  const announce = useAnnounce()
  const dialogs = useDialogStack()
  const wide = useMediaQuery('(min-width: 1024px)', true)
  const ready = useReadyCatalog(props.steps ?? researchStepCatalog)
  const aiAllowed = props.agentsAllowed !== false
  const [paletteOpen, setPaletteOpen] = useState(false)

  const nodes = useFlowEditorState((s) => s.nodes)
  const connectors = useFlowEditorState((s) => s.connectors)
  const locked = useFlowEditorState((s) => s.locked)
  const mode = useFlowEditorState((s) => s.controlMode)
  const density = useFlowEditorState((s) => s.cardDensity)
  const direction = useFlowEditorState((s) => s.layoutDirection)
  const panels = useFlowEditorState((s) => s.panels)
  const clipboard = useFlowEditorState((s) => !!s.clipboard)
  const menu = useFlowEditorState((s) => s.contextMenu)

  const apiRef = useRef<CanvasApi>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const sideRef = useRef<HTMLElement>(null)
  const [viewport, setViewport] = useState<Viewport>(props.initialGraph?.viewport ?? { x: 0, y: 0, zoom: 1 })
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport
  const [listView, setListView] = useState(!!props.defaultListView)
  const [searchOpen, setSearchOpen] = useState(false)
  const [picker, setPicker] = useState<PickerState | null>(null)
  const pickerAnchor = useRef<HTMLElement | null>(null)
  const [dragStep, setDragStep] = useState<string | null>(null)
  const [dropAt, setDropAt] = useState<{ start: number; top: number } | null>(null)
  const [recent, setRecent] = useState<string[]>([])
  const [validation, setValidation] = useState<string | null>(null)
  const searchTrigger = useRef<HTMLElement | null>(null)

  const kinds = useMemo(() => ({ [STEP_KIND]: StepCard, ...(extraNodeKinds ?? {}) }), [extraNodeKinds])
  const sizeOf = useCallback((n: FlowNode) => (n.kind === STEP_KIND ? (n.size ?? { ...STEP_CARD_SIZE }) : sizeForNode(n, density)), [density])
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const titleOf = useCallback(
    (n: FlowNode) => {
      const label = typeof n.data.label === 'string' && n.data.label ? n.data.label : undefined
      return label ?? (n.kind === STEP_KIND ? specOfNode(n, ready.byId)?.name : undefined) ?? nodeTitle(n, catalog)
    },
    [ready, catalog],
  )
  const nameOf = useCallback((id: string) => {
    const n = byId.get(id)
    return n ? titleOf(n) : id
  }, [byId, titleOf])

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

  // ---- surface model and wiring checks ----------------------------------
  const ordered = useMemo(() => flowReadingOrder(nodes, connectors, direction === 'right'), [nodes, connectors, direction])
  const surfaceNodes: SurfaceNode[] = useMemo(
    () =>
      ordered.map((n) => {
        const sized = { ...n, size: sizeOf(n) }
        return {
          id: n.id,
          rect: absoluteRect(sized, byId, sized.size),
          layer: n.kind === 'group' ? 0 : 1,
          fixedHeight: n.kind === 'group' || n.kind === 'note' || n.kind === STEP_KIND,
          ...(n.selected ? { selected: true } : {}),
          ...(n.hidden ? { hidden: true } : {}),
          draggable: !locked,
          tone: catalog.tone(n.kind),
        }
      }),
    [ordered, sizeOf, byId, locked, catalog],
  )
  const issues = useMemo(() => wiringIssues(nodes, connectors, ready.steps, aiAllowed), [nodes, connectors, ready, aiAllowed])
  const issuesByNode = useMemo(() => {
    const m = new Map<string, WiringIssue[]>()
    for (const i of issues) m.set(i.nodeId, [...(m.get(i.nodeId) ?? []), i])
    return m
  }, [issues])

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
  const focusNodeSoon = (id: string) => requestAnimationFrame(() => apiRef.current?.focusNode(id))

  const layoutNow = useCallback(
    (cycle: LayoutCycle, snapshot: boolean) => {
      const dir = cycle === 'left-right' ? 'right' : 'down'
      actions.setLayoutDirection(dir)
      const sized = store.getState().nodes.map((n) => ({ ...n, size: sizeOf(n) }))
      const laid = autoLayout(sized, store.getState().connectors, rankDirectionOf(dir, rtl, keepLtrLayout), STEP_SPACING(rtl && !keepLtrLayout))
      if (snapshot) actions.snapshot()
      const moved = new Map(laid.map((n) => [n.id, n.position]))
      actions.setNodes((prev) => prev.map((n) => (moved.get(n.id) === n.position ? n : { ...n, position: moved.get(n.id) ?? n.position })))
      requestAnimationFrame(() => apiRef.current?.fit())
    },
    [store, sizeOf, actions, rtl, keepLtrLayout],
  )
  const currentCycle = useCallback((): LayoutCycle => LAYOUT_TO_CYCLE[store.getState().layoutDirection] ?? 'top-down', [store])

  /** A node of a host kind (old palette payloads, notes from the canvas menu). */
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

  /** Adds a research step, links it and lays the flow out again (one undo step). */
  const insertStep = useCallback(
    (stepId: string, place: Placement) => {
      const step = ready.byId.get(stepId)
      if (!step || store.getState().locked || (step.usesAI && !aiAllowed)) return null
      const id = createId(step.kind)
      const all = store.getState().nodes
      const anchor = 'after' in place ? all.find((n) => n.id === place.after) : undefined
      const link = 'through' in place ? store.getState().connectors.find((c) => c.id === place.through) : undefined
      const ends = link ? [all.find((n) => n.id === link.source), all.find((n) => n.id === link.target)] : []
      const at =
        'near' in place
          ? { x: place.near.x - STEP_CARD_SIZE.width / 2, y: place.near.y - STEP_CARD_SIZE.height / 2 }
          : anchor
            ? { x: anchor.position.x, y: anchor.position.y + 140 }
            : ends[0] && ends[1]
              ? { x: (ends[0].position.x + ends[1].position.x) / 2, y: (ends[0].position.y + ends[1].position.y) / 2 }
              : { x: 0, y: 0 }
      actions.snapshot()
      actions.setNodes((prev) => [...prev.map((n) => (n.selected ? { ...n, selected: false } : n)), { ...stepNode(step, id, at), selected: true }])
      if ('after' in place) actions.setConnectors((prev) => linkAfter(prev, place.after, id, () => createId('connector')))
      else if ('through' in place) actions.setConnectors((prev) => linkThrough(prev, place.through, id, () => createId('connector')))
      if (!('near' in place)) layoutNow(currentCycle(), false)
      setRecent((r) => [stepId, ...r.filter((x) => x !== stepId)].slice(0, 8))
      announce(fill(sw.added, { name: step.name }, locale))
      requestAnimationFrame(() => apiRef.current?.focusNode(id))
      return id
    },
    [ready, store, aiAllowed, actions, layoutNow, currentCycle, announce, sw, locale],
  )

  /** Step a loose step should follow: the selection, else the nearest open end that fits. */
  const sourceFor = useCallback(
    (step: ReadyStep, near: Point): string | null => {
      const accepts = step.inputs[0]
      if (!accepts || step.primitive) return null
      const s = store.getState()
      const index = new Map(s.nodes.map((n) => [n.id, n]))
      const fits = (n: FlowNode) => {
        const g = givenShape(n, ready.byId)
        return !!g && accepts.includes(g)
      }
      const chosen = s.nodes.find((n) => n.selected && fits(n))
      if (chosen) return chosen.id
      const open = new Set(s.nodes.map((n) => n.id))
      for (const c of s.connectors) open.delete(c.source)
      let best: string | null = null
      let score = Infinity
      for (const n of s.nodes) {
        if (!fits(n)) continue
        const r = absoluteRect({ ...n, size: sizeOf(n) }, index, sizeOf(n))
        const gap = Math.hypot(r.x + r.width / 2 - near.x, r.y + r.height / 2 - near.y)
        const d = (Number.isFinite(gap) ? gap : 0) + (open.has(n.id) ? 0 : 100000)
        if (d < score) {
          best = n.id
          score = d
        }
      }
      return best
    },
    [store, ready, sizeOf],
  )

  /** Palette placement (tap, Enter or drop): follows a fitting step when there is one. */
  const placeLoose = useCallback(
    (stepId: string, near: Point) => {
      const step = ready.byId.get(stepId)
      if (!step) return null
      const from = sourceFor(step, near)
      return insertStep(stepId, from ? { after: from } : { near })
    },
    [ready, sourceFor, insertStep],
  )

  const canvasCentre = () => apiRef.current?.visibleCentre() ?? { x: 0, y: 0 }
  const openPicker = (trigger: HTMLElement | null, state: PickerState) => {
    pickerAnchor.current = trigger ?? rootRef.current
    setPicker(state)
  }
  const openAfter = useCallback(
    (nodeId: string, trigger: HTMLElement | null) => {
      const n = store.getState().nodes.find((x) => x.id === nodeId)
      if (!n || store.getState().locked) return
      const shape = givenShape(n, ready.byId)
      const name = nameOf(nodeId)
      openPicker(trigger, {
        title: fill(sw.pickerAfter, { name }, locale),
        placeholder: fill(sw.pickerAfter, { name: [...name].length > 14 ? `${[...name].slice(0, 7).join('').trimEnd()}...` : name }, locale),
        arriving: shape,
        // After one step: steps with a single input (a join also needs its second input).
        options: shape === null ? [] : stepsAccepting(shape, ready.steps, aiAllowed).filter((st) => st.inputs.length === 1),
        place: (id) => insertStep(id, { after: nodeId }),
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, ready, sw, nameOf, locale, aiAllowed, insertStep],
  )
  const openThrough = (connectorId: string) => {
    const c = store.getState().connectors.find((x) => x.id === connectorId)
    const from = c ? byId.get(c.source) : undefined
    if (!c || !from) return
    const shape = givenShape(from, ready.byId)
    const active = document.activeElement instanceof HTMLElement && canvasRef.current?.contains(document.activeElement) ? document.activeElement : canvasRef.current
    openPicker(active, {
      title: fill(sw.pickerBetween, { from: nameOf(c.source), to: nameOf(c.target) }, locale),
      arriving: shape,
      options: shape === null ? [] : stepsAccepting(shape, ready.steps, aiAllowed),
      place: (id) => insertStep(id, { through: connectorId }),
    })
  }
  const openLoose = (trigger: HTMLElement | null) =>
    openPicker(trigger, {
      title: sw.pickerFree,
      options: ready.steps.filter((s) => !s.primitive && (!s.usesAI || aiAllowed)),
      place: (id) => placeLoose(id, canvasCentre()),
    })
  /** Dock item and the A key: after the selected step, else a loose step. */
  const addFromDock = () => {
    const chosen = store.getState().nodes.find((n) => n.selected)
    const dockButton = rootRef.current?.querySelector<HTMLElement>('[data-tool="add-step"]') ?? null
    if (chosen && DRAWN(chosen)) openAfter(chosen.id, rootRef.current?.querySelector<HTMLElement>(`[data-fk-add-after="${chosen.id}"]`) ?? dockButton)
    else openLoose(dockButton)
  }

  const showSettings = (id: string) => {
    actions.select([id])
    requestAnimationFrame(() => sideRef.current?.querySelector<HTMLElement>('input, textarea')?.focus())
  }
  const openConfig = useCallback(
    (id: string) => {
      const n = store.getState().nodes.find((x) => x.id === id)
      if (!n || store.getState().locked) return
      if (n.kind === 'note') return
      if (n.kind === STEP_KIND && props.sidePanel !== false) {
        showSettings(id)
        return
      }
      actions.setEditingNode(id)
      const references = ancestorsOf(id, store.getState().connectors)
      dialogs.open<NodeConfigPayload>('node-config', { nodeId: id, kind: n.kind, label: nodeTitle(n, catalog), config: n.data, references })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, actions, dialogs, catalog, props.sidePanel],
  )

  const saveConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      actions.snapshot()
      actions.setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, data: { ...config, ...(typeof n.data.label === 'string' && config.label === undefined ? { label: n.data.label } : {}) } } : n)))
    },
    [actions],
  )
  const editStep = (nodeId: string, patch: Record<string, unknown>) => {
    actions.snapshot()
    actions.setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n
        const data = { ...n.data, ...patch }
        for (const k of Object.keys(patch)) if (patch[k] === undefined) delete data[k]
        return { ...n, data }
      }),
    )
  }

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
      if (!locked) layoutNow(cycle, true)
    },
    [locked, layoutNow],
  )

  const repair = (issue: WiringIssue) => {
    const fix = issue.repair
    if (fix.kind === 'replace') {
      actions.snapshot()
      actions.setNodes((prev) => prev.map((n) => (n.id === fix.nodeId ? { ...n, data: { stepId: fix.stepId } } : n)))
      announce(fill(sw.added, { name: ready.byId.get(fix.stepId)?.name ?? fix.stepId }, locale))
    } else if (fix.kind === 'insert') insertStep(fix.stepId, { through: issue.connectorId })
    else actions.removeConnector(issue.connectorId)
  }
  const validate = () => {
    setValidation(issues.length ? fill(sw.issueCount, { count: issues.length }, locale) : sw.validOk)
    props.onValidate?.(issues)
  }

  /** List view reorder: swaps linked neighbours, else their places. */
  const moveInList = (id: string, towards: -1 | 1) => {
    const list = ordered.filter(DRAWN)
    const i = list.findIndex((n) => n.id === id)
    const other = list[i + towards]
    if (!other || locked) return
    const [first, second] = towards === 1 ? [id, other.id] : [other.id, id]
    const swapped = swapNeighbours(store.getState().connectors, first, second)
    actions.snapshot()
    if (swapped) {
      actions.setConnectors(() => swapped)
      layoutNow(currentCycle(), false)
    } else {
      const a = list[i]!
      actions.setNodes((prev) => prev.map((n) => (n.id === a.id ? { ...n, position: other.position } : n.id === other.id ? { ...n, position: a.position } : n)))
    }
    announce(fill(sw.moved, { name: nameOf(id), position: i + towards + 1 }, locale))
  }

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

  // ---- node keys: add after, nudge, context menu -----------------------
  const onNodeKeyDown = (id: string, e: KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (isTyping(target)) return
    if (isContextMenuKey(e)) {
      e.preventDefault()
      const r = target.getBoundingClientRect()
      const selectedCount = store.getState().nodes.filter((n) => n.selected).length
      actions.openContextMenu({ kind: selectedCount > 1 ? 'selection' : 'node', position: { x: r.left + 8, y: r.bottom }, targetId: id })
      return
    }
    if (plainA(e) && singleKeyShortcuts && !locked && target.hasAttribute('data-fk-node-focus')) {
      e.preventDefault()
      e.stopPropagation()
      openAfter(id, rootRef.current?.querySelector<HTMLElement>(`[data-fk-add-after="${id}"]`) ?? target)
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
      const all = store.getState().nodes.filter((n) => !n.hidden && n.id !== id).map((n) => ({ id: n.id, rect: absoluteRect(n, byId, sizeOf(n)) }))
      guides.onKeyboardMove(all, absoluteRect(moved, byId, sizeOf(moved)), id)
    }
  }

  // ---- palette drop ----------------------------------------------------
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (locked) return
    const types = [...e.dataTransfer.types]
    if (types.includes(STEP_MEDIA_TYPE) || types.includes(PALETTE_MEDIA_TYPE)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
    if (types.includes(STEP_MEDIA_TYPE) && canvasRef.current) {
      const named = stepOfDrag(types)
      if (named && named !== dragStep) setDragStep(ready.steps.find((st) => st.id.toLowerCase() === named)?.id ?? null)
      const r = canvasRef.current.getBoundingClientRect()
      // The drop outline stays whole inside the canvas.
      const half = { w: STEP_CARD_SIZE.width / 2 + 8, h: STEP_CARD_SIZE.height / 2 + 8 }
      const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))
      setDropAt({ start: clamp(rtl ? r.right - e.clientX : e.clientX - r.left, half.w, r.width - half.w), top: clamp(e.clientY - r.top, half.h, r.height - half.h) })
    }
  }
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropAt(null)
  }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    setDropAt(null)
    setDragStep(null)
    if (locked) return
    const at = apiRef.current?.clientToCanvas({ x: e.clientX, y: e.clientY }) ?? { x: 0, y: 0 }
    const stepRaw = e.dataTransfer.getData(STEP_MEDIA_TYPE)
    const hostRaw = e.dataTransfer.getData(PALETTE_MEDIA_TYPE)
    if (!stepRaw && !hostRaw) return
    e.preventDefault()
    try {
      if (stepRaw) {
        const { stepId } = JSON.parse(stepRaw) as { stepId: string }
        placeLoose(stepId, at)
      } else {
        const payload = JSON.parse(hostRaw) as PalettePayload
        const id = addNode(payload.kind, at, payload)
        if (id) focusNodeSoon(id)
      }
    } catch {
      // Not a palette payload: ignore.
    }
  }

  // ---- tools -----------------------------------------------------------
  const items = stepToolItems({
    words: sw,
    mode,
    onModeChange: actions.setControlMode,
    onAdd: locked ? undefined : addFromDock,
    onArrange: locked ? undefined : () => autoArrange(currentCycle()),
    onFit: () => apiRef.current?.fit(),
    listView,
    onToggleList: () => setListView((v) => !v),
    onSearch: () => {
      searchTrigger.current = rootRef.current?.querySelector<HTMLElement>('[data-tool="search"]') ?? null
      setSearchOpen(true)
    },
  })

  // ---- rendering ---------------------------------------------------------
  const renderNode = (sn: SurfaceNode) => {
    const node = byId.get(sn.id)!
    const Card = componentForKind(node.kind, kinds)
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

  const chosen = nodes.filter((n) => n.selected)
  const single = chosen.length === 1 && DRAWN(chosen[0]!) ? chosen[0]! : null
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
  const issueBar = <IssueBar issues={issues} nameOf={nameOf} locked={locked} onRepair={repair} onShow={(id) => (listView ? showSettings(id) : (apiRef.current?.reveal(id), actions.select([id]), focusNodeSoon(id)))} />

  // Below 1024 px the palette opens as a bottom drawer and steps are placed by tap.
  const paletteBody =
    props.palette === false ? null : (
      <StepPalette
        {...(props.palette ?? {})}
        recent={recent}
        onDragChange={setDragStep}
        onPlace={(stepId) => {
          setPaletteOpen(false)
          placeLoose(stepId, canvasCentre())
        }}
      />
    )

  const dragName = dragStep ? ready.byId.get(dragStep)?.name : undefined

  return (
    <StepsProvider catalog={props.steps ?? researchStepCatalog} aiAllowed={aiAllowed} issues={issuesByNode} addAfter={openAfter}>
      <div
        ref={rootRef}
        className={['fk-editor', props.className].filter(Boolean).join(' ')}
        data-view={listView ? 'list' : 'canvas'}
        data-side={props.sidePanel === false ? 'none' : 'shown'}
        data-palette={props.palette === false || (listView && wide) ? 'none' : 'shown'}
        data-locked={locked ? 'true' : 'false'}
      >
        {props.palette !== false && wide && !listView ? <aside className="fk-editor__palette" aria-label={l.palette}>{paletteBody}</aside> : null}
        {props.palette !== false && !wide ? (
          <>
            <Button className="fk-editor__palette-open" variant="secondary" leadingIcon={<Plus />} onPress={() => setPaletteOpen(true)}>
              {l.openPalette}
            </Button>
            <Drawer open={paletteOpen} onOpenChange={setPaletteOpen} title={l.palette} placement="bottom">
              {paletteBody}
            </Drawer>
          </>
        ) : null}
        {listView ? (
          <div
            className="fk-editor__canvas"
            data-view="list"
            onKeyDown={(e) => {
              if (plainA(e) && !locked && !isTyping(e.target as HTMLElement) && !(e.target as HTMLElement).closest('.fk-flow-step-list__main')) {
                e.preventDefault()
                addFromDock()
              }
            }}
          >
            {issueBar}
            <StepListView
              nodes={ordered.filter(DRAWN)}
              locked={locked}
              activeId={single?.id ?? null}
              onConfigure={showSettings}
              onMove={moveInList}
              onRemove={(id) => actions.removeNodes([id])}
              onAddAfter={(id, trigger) => openAfter(id, trigger)}
              onActiveChange={(id) => actions.select([id])}
            />
            <div className="fk-editor__list-dock">{tools}</div>
          </div>
        ) : (
          <div
            ref={canvasRef}
            className="fk-editor__canvas"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onKeyDown={(e) => {
              const t = e.target as HTMLElement
              if (plainA(e) && singleKeyShortcuts && !locked && !isTyping(t) && !t.closest('[data-fk-node-id]')) {
                e.preventDefault()
                addFromDock()
              }
            }}
          >
            {issueBar}
            <CanvasSurface
              label={l.canvas}
              roleDescription={l.roleDescription}
              nodes={surfaceNodes}
              connectors={connectors}
              viewport={viewport}
              onViewportChange={setViewport}
              fit="resize"
              fitPadding={24}
              fitAlign="top"
              mode={mode}
              dragNodes={!locked}
              marquee
              grid={panels.grid}
              minimap={panels.minimap}
              apiRef={apiRef}
              portAnchor={(id, port, role) => {
                const n = byId.get(id)
                if (!n) return 'border'
                if (n.kind === STEP_KIND) {
                  const count = specOfNode(n, ready.byId)?.inputs.length ?? 1
                  return role === 'source' ? { side: 'bottom', along: 0.5 } : { side: 'top', along: alongEdge(inputIndex(port), Math.max(1, count)) }
                }
                return anchorFor(n, port, role, direction, catalog)
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
                  onOpenInsertPicker: (id) => openThrough(id),
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
                  const all = store.getState().nodes.filter((n) => !n.hidden).map((n) => ({ id: n.id, rect: absoluteRect(n, byId, sizeOf(n)) }))
                  guides.createDragHandler(all)(absoluteRect(moving, byId, sizeOf(moving)), ref, e.ids)
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
            {dropAt && dragName ? (
              <div className="fk-editor__drop" style={{ insetInlineStart: dropAt.start, insetBlockStart: dropAt.top }} aria-hidden="true">
                {fill(sw.dropHere, { name: dragName }, locale)}
              </div>
            ) : null}
          </div>
        )}
        {props.sidePanel !== false ? (
          <aside ref={sideRef} className="fk-editor__side" aria-label={single ? nameOf(single.id) : sw.summaryTitle}>
            <FlowSidePanel
              nodes={nodes}
              selected={single}
              {...(props.flowFacts ? { facts: props.flowFacts } : {})}
              preview={single && props.outputPreview ? props.outputPreview(single.id) : null}
              locked={locked}
              validation={validation}
              {...(props.onRunFlow ? { onRunFlow: props.onRunFlow } : {})}
              onValidate={validate}
              {...(props.onTestStep ? { onTestStep: props.onTestStep } : {})}
              onRemove={(id) => actions.removeNodes([id])}
              onEdit={editStep}
              onBack={() => actions.deselectAll()}
            />
          </aside>
        ) : null}
        {picker ? (
          <AddStepPicker
            title={picker.title}
            {...(picker.placeholder ? { placeholder: picker.placeholder } : {})}
            {...(picker.arriving !== undefined ? { arriving: picker.arriving } : {})}
            options={picker.options}
            triggerRef={pickerAnchor}
            onPick={picker.place}
            onClose={() => setPicker(null)}
          />
        ) : null}
        {searchOpen ? (
          <CanvasNodeSearch
            isOpen
            onOpenChange={setSearchOpen}
            triggerRef={searchTrigger}
            nodes={nodes.filter((n) => !n.hidden).map((n) => ({ id: n.id, label: titleOf(n), kindLabel: n.kind === STEP_KIND ? (specOfNode(n, ready.byId)?.name ?? n.kind) : (catalog.entry(n.kind)?.label ?? n.kind) }))}
            onPick={(id) => {
              if (listView) {
                showSettings(id)
                return
              }
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
            count={chosen.length}
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
    </StepsProvider>
  )
}

function parsePoint(s: string | undefined): Point {
  const [x, y] = (s ?? '0,0').split(',').map(Number)
  return { x: x ?? 0, y: y ?? 0 }
}
