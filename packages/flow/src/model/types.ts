// Graph vocabulary shared by every canvas in this package. Positions and sizes
// are in canvas units (1 unit = 1 CSS px at zoom 1). The screen position of a
// canvas point p is `p * zoom + (viewport.x, viewport.y)`.

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Rect extends Point, Size {}

/** Pan offset (screen px) and zoom factor of a canvas. */
export interface Viewport {
  x: number
  y: number
  zoom: number
}

/** Side of a node box. `start`/`end` are the inline sides (left/right in LTR). */
export type Side = 'start' | 'end' | 'top' | 'bottom'

/** Direction used by the editor state and the command bar. */
export type LayoutDirection = 'down' | 'right'

/** Direction used by AutoLayout ('right-left' is the RTL reading of 'left-right'). */
export type RankDirection = 'top-down' | 'left-right' | 'right-left'

/** A step on a canvas. `data` belongs to the node kind. */
export interface FlowNode<D extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  kind: string
  position: Point
  data: D
  /** Size the node declares (card width variant, note size, group frame). */
  size?: Size
  /** Size measured in the browser, when available. */
  measured?: Size
  /** Enclosing group frame; the position is then relative to that frame. */
  parentId?: string
  selected?: boolean
  hidden?: boolean
}

/** A directed connection between two nodes (the fork called these edges). */
export interface FlowConnector {
  id: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
  /** Explicit branch label; otherwise derived from well-known output ports. */
  label?: string
  /** Branch condition carried with the connector (opaque to the canvas). */
  condition?: unknown
  selected?: boolean
  hidden?: boolean
}

export interface FlowGraph {
  nodes: FlowNode[]
  connectors: FlowConnector[]
  viewport: Viewport
}

/** Per-node state of the live or inspected run held by the editor state. */
export type NodeResultStatus = 'pending' | 'running' | 'success' | 'error'

export interface NodeRunResult {
  status: NodeResultStatus
  data?: unknown
  error?: string
  durationMs?: number
}

/** Status vocabulary of read-only previews and run inspection. */
export type RunStatus = 'running' | 'completed' | 'failed' | 'skipped' | 'restored' | 'served-from-history' | 'unknown'

export const ORIGIN_VIEWPORT: Viewport = Object.freeze({ x: 0, y: 0, zoom: 1 })
