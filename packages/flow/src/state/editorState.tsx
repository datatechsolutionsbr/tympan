// FlowEditorState: one store per editor (never a module singleton), with
// actions and fine-grained read hooks.

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { FlowConnector, FlowNode, LayoutDirection, NodeRunResult, Point } from '../model/types'
import {
  clonePiece,
  copySelection,
  freezeSnapshot,
  mergePiece,
  PASTE_OFFSET,
  recordHistory,
  stepBack,
  stepForward,
  withoutNodes,
  type GraphSnapshot,
} from './graphEdits'
import { createStore, shallowEqual, useStoreSelector, type Store } from './store'

export type PanelName = 'variables' | 'versions' | 'run' | 'minimap' | 'grid' | 'shortcuts' | 'preview' | 'outline'

export interface CanvasMenuState {
  kind: 'node' | 'connector' | 'canvas' | 'selection'
  /** Screen position the menu opens at. */
  position: Point
  targetId?: string
}

export interface FlowEditorData {
  nodes: FlowNode[]
  connectors: FlowConnector[]
  past: GraphSnapshot[]
  future: GraphSnapshot[]
  clipboard: GraphSnapshot | null
  editingNodeId: string | null
  contextMenu: CanvasMenuState | null
  controlMode: 'select' | 'pan'
  layoutDirection: LayoutDirection
  panels: Record<PanelName, boolean>
  cardDensity: 'detailed' | 'compact'
  isRunning: boolean
  nodeResults: Record<string, NodeRunResult>
  selectedRunId: string | null
  locked: boolean
}

type Updater<T> = T | ((prev: T) => T)

export interface FlowEditorActions {
  setNodes(next: Updater<FlowNode[]>): void
  setConnectors(next: Updater<FlowConnector[]>): void
  /** Takes a history snapshot of the current graph (call before an edit). */
  snapshot(): void
  undo(): void
  redo(): void
  copy(): void
  paste(offset?: number): void
  /** Copies the selection in place (offset), selecting only the copies. One undo step. */
  duplicate(ids?: readonly string[]): void
  /** Removes selected nodes (and connectors touching them) and selected connectors. One undo step. Refused when locked. */
  removeSelection(): void
  removeNodes(ids: readonly string[]): void
  removeConnector(id: string): void
  selectAll(): void
  deselectAll(): void
  select(ids: readonly string[], additive?: boolean): void
  selectConnector(id: string | null): void
  setEditingNode(id: string | null): void
  openContextMenu(menu: CanvasMenuState): void
  closeContextMenu(): void
  setControlMode(mode: 'select' | 'pan'): void
  setLayoutDirection(direction: LayoutDirection): void
  togglePanel(name: PanelName): void
  setPanel(name: PanelName, open: boolean): void
  closeShortcuts(): void
  toggleDensity(): void
  setRunning(running: boolean): void
  setNodeResult(id: string, result: NodeRunResult): void
  clearNodeResults(): void
  setSelectedRun(id: string | null): void
  setLocked(locked: boolean): void
  reset(): void
}

export interface FlowEditorStore extends Store<FlowEditorData> {
  actions: FlowEditorActions
  historyLimit: number
}

export interface FlowEditorStoreOptions {
  /** Maximum undo depth (default 50). */
  historyLimit?: number
  initial?: Partial<Pick<FlowEditorData, 'nodes' | 'connectors' | 'controlMode' | 'layoutDirection' | 'cardDensity' | 'locked'>> & {
    panels?: Partial<Record<PanelName, boolean>>
  }
}

const CLOSED_PANELS: Record<PanelName, boolean> = {
  variables: false,
  versions: false,
  run: false,
  minimap: false,
  grid: true,
  shortcuts: false,
  preview: false,
  outline: false,
}

function blank(options: FlowEditorStoreOptions): FlowEditorData {
  const i = options.initial ?? {}
  return {
    nodes: i.nodes ?? [],
    connectors: i.connectors ?? [],
    past: [],
    future: [],
    clipboard: null,
    editingNodeId: null,
    contextMenu: null,
    controlMode: i.controlMode ?? 'select',
    layoutDirection: i.layoutDirection ?? 'down',
    panels: { ...CLOSED_PANELS, ...(i.panels ?? {}) },
    cardDensity: i.cardDensity ?? 'detailed',
    isRunning: false,
    nodeResults: {},
    selectedRunId: null,
    locked: i.locked ?? false,
  }
}

const apply = <T,>(next: Updater<T>, prev: T): T => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next)

export function createFlowEditorStore(options: FlowEditorStoreOptions = {}): FlowEditorStore {
  const limit = options.historyLimit ?? 50
  const base = createStore<FlowEditorData>(blank(options))
  const get = base.getState
  const set = base.setState
  const current = () => freezeSnapshot(get().nodes, get().connectors)

  const actions: FlowEditorActions = {
    setNodes: (next) => set((s) => ({ nodes: apply(next, s.nodes) })),
    setConnectors: (next) => set((s) => ({ connectors: apply(next, s.connectors) })),
    snapshot() {
      const s = get()
      set(recordHistory({ past: s.past, future: s.future }, current(), limit))
    },
    undo() {
      const s = get()
      const r = stepBack({ past: s.past, future: s.future }, current())
      if (r) set({ ...r.stacks, nodes: r.graph.nodes, connectors: r.graph.connectors })
    },
    redo() {
      const s = get()
      const r = stepForward({ past: s.past, future: s.future }, current())
      if (r) set({ ...r.stacks, nodes: r.graph.nodes, connectors: r.graph.connectors })
    },
    copy() {
      const piece = copySelection(get().nodes, get().connectors)
      if (piece) set({ clipboard: piece })
    },
    paste(offset = PASTE_OFFSET) {
      const s = get()
      if (!s.clipboard || s.locked) return
      actions.snapshot()
      const piece = clonePiece(s.clipboard, offset)
      const merged = mergePiece({ nodes: get().nodes, connectors: get().connectors }, piece)
      // The clipboard follows the pasted copy so the next paste cascades.
      set({ ...merged, clipboard: freezeSnapshot(piece.nodes, piece.connectors) })
    },
    duplicate(ids) {
      const s = get()
      if (s.locked) return
      const chosen = ids ? new Set(ids) : null
      const nodes = chosen ? s.nodes.map((n) => ({ ...n, selected: chosen.has(n.id) })) : s.nodes
      const piece = copySelection(nodes, s.connectors)
      if (!piece) return
      actions.snapshot()
      set(mergePiece({ nodes: get().nodes, connectors: get().connectors }, clonePiece(piece)))
    },
    removeSelection() {
      const s = get()
      if (s.locked) return
      const ids = new Set(s.nodes.filter((n) => n.selected).map((n) => n.id))
      const connectorIds = new Set(s.connectors.filter((c) => c.selected).map((c) => c.id))
      if (!ids.size && !connectorIds.size) return
      actions.snapshot()
      const g = withoutNodes({ nodes: s.nodes, connectors: s.connectors.filter((c) => !connectorIds.has(c.id)) }, ids)
      set(g)
    },
    removeNodes(idList) {
      const s = get()
      if (s.locked || !idList.length) return
      actions.snapshot()
      set(withoutNodes({ nodes: s.nodes, connectors: s.connectors }, new Set(idList)))
    },
    removeConnector(id) {
      const s = get()
      if (s.locked || !s.connectors.some((c) => c.id === id)) return
      actions.snapshot()
      set({ connectors: get().connectors.filter((c) => c.id !== id) })
    },
    selectAll: () => set((s) => ({ nodes: s.nodes.map((n) => (n.selected || n.hidden ? n : { ...n, selected: true })) })),
    deselectAll: () =>
      set((s) => ({
        nodes: s.nodes.some((n) => n.selected) ? s.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)) : s.nodes,
        connectors: s.connectors.some((c) => c.selected) ? s.connectors.map((c) => (c.selected ? { ...c, selected: false } : c)) : s.connectors,
      })),
    select(idList, additive = false) {
      const chosen = new Set(idList)
      set((s) => ({
        nodes: s.nodes.map((n) => {
          const on = chosen.has(n.id) || (additive && !!n.selected)
          return !!n.selected === on ? n : { ...n, selected: on }
        }),
        connectors: additive ? s.connectors : s.connectors.map((c) => (c.selected ? { ...c, selected: false } : c)),
      }))
    },
    selectConnector(id) {
      set((s) => ({
        connectors: s.connectors.map((c) => (!!c.selected === (c.id === id) ? c : { ...c, selected: c.id === id })),
        nodes: id ? s.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)) : s.nodes,
      }))
    },
    setEditingNode: (id) => set({ editingNodeId: id }),
    openContextMenu: (menu) => set({ contextMenu: menu }),
    closeContextMenu: () => set({ contextMenu: null }),
    setControlMode: (mode) => set({ controlMode: mode }),
    setLayoutDirection: (direction) => set({ layoutDirection: direction }),
    togglePanel: (name) => set((s) => ({ panels: { ...s.panels, [name]: !s.panels[name] } })),
    setPanel: (name, open) => set((s) => (s.panels[name] === open ? {} : { panels: { ...s.panels, [name]: open } })),
    closeShortcuts: () => actions.setPanel('shortcuts', false),
    toggleDensity: () => set((s) => ({ cardDensity: s.cardDensity === 'detailed' ? 'compact' : 'detailed' })),
    setRunning: (running) => set({ isRunning: running }),
    setNodeResult: (id, result) => set((s) => ({ nodeResults: { ...s.nodeResults, [id]: result } })),
    clearNodeResults: () => set((s) => (Object.keys(s.nodeResults).length ? { nodeResults: {} } : {})),
    setSelectedRun: (id) => set({ selectedRunId: id }),
    setLocked: (locked) => set({ locked }),
    reset: () => set(blank(options)),
  }

  return { ...base, actions, historyLimit: limit }
}

const EditorStoreContext = createContext<FlowEditorStore | null>(null)

/** Provides an editor store; creates one per provider when none is passed. */
export function FlowEditorStateProvider({ store, options, children }: { store?: FlowEditorStore; options?: FlowEditorStoreOptions; children: ReactNode }) {
  const [own] = useState(() => store ?? createFlowEditorStore(options))
  return <EditorStoreContext.Provider value={store ?? own}>{children}</EditorStoreContext.Provider>
}

export function useFlowEditorStore(): FlowEditorStore {
  const store = useContext(EditorStoreContext)
  if (!store) throw new Error('Flow editor components must be inside <FlowEditorStateProvider> (FlowEditor provides one).')
  return store
}

/** The store when inside an editor, else null (for components usable in both). */
export function useOptionalFlowEditorStore(): FlowEditorStore | null {
  return useContext(EditorStoreContext)
}

export function useFlowEditorState<T>(selector: (s: FlowEditorData) => T, isEqual: (a: T, b: T) => boolean = shallowEqual as (a: T, b: T) => boolean): T {
  return useStoreSelector(useFlowEditorStore(), selector, isEqual)
}

export const useFlowEditorActions = (): FlowEditorActions => useFlowEditorStore().actions

// Read hooks named by the spec.
export const useCanUndo = () => useFlowEditorState((s) => s.past.length > 0)
export const useCanRedo = () => useFlowEditorState((s) => s.future.length > 0)
export const useHasClipboard = () => useFlowEditorState((s) => !!s.clipboard && s.clipboard.nodes.length > 0)
export const useCanvasMenu = () => useFlowEditorState((s) => s.contextMenu)
export const useEditingNodeId = () => useFlowEditorState((s) => s.editingNodeId)
export const useSelectedNodeCount = () => useFlowEditorState((s) => s.nodes.reduce((n, node) => n + (node.selected ? 1 : 0), 0))
export const useIsRunning = () => useFlowEditorState((s) => s.isRunning)
export const useNodeResults = () => useFlowEditorState((s) => s.nodeResults)

/** Result of one node from the editor state, or undefined outside an editor. */
export function useNodeResult(nodeId: string): NodeRunResult | undefined {
  const store = useOptionalFlowEditorStore()
  const fallback = useFallbackStore()
  return useStoreSelector(store ?? fallback, (s) => s.nodeResults[nodeId])
}

/** Locked flag, false outside an editor. */
export function useEditorLocked(): boolean {
  const store = useOptionalFlowEditorStore()
  const fallback = useFallbackStore()
  return useStoreSelector(store ?? fallback, (s) => s.locked)
}

let sharedFallback: FlowEditorStore | null = null
function useFallbackStore(): FlowEditorStore {
  sharedFallback ??= createFlowEditorStore()
  return sharedFallback
}
