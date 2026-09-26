import type { ReactNode } from 'react'
import type { CurveEnd } from '../geometry/curve'
import type { Point, Rect, Side, Size, Viewport } from '../model/types'

/** A box the surface places; the caller renders its content. */
export interface SurfaceNode {
  id: string
  /** Absolute canvas box. The height is a minimum unless `fixedHeight`. */
  rect: Rect
  fixedHeight?: boolean
  hidden?: boolean
  /** Lower layers are painted (and read) first; group frames use 0, nodes 1. */
  layer?: number
  selected?: boolean
  /** Per-node override of the surface's node dragging. */
  draggable?: boolean
  /** Tone name for the overview map. */
  tone?: string
}

export interface SurfaceConnector {
  id: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
  hidden?: boolean
}

/** Where a connector touches a node: a side and a position along it (0..1). */
export interface PortAnchor {
  side: Side
  along: number
}

export interface ConnectorShape {
  d: string
  mid: Point
  from: CurveEnd
  to: CurveEnd
  arrival: Point
  sourceRect: Rect
  targetRect: Rect
}

export interface ConnectorParts {
  /** SVG content drawn under the nodes (paths, hit path). */
  svg?: ReactNode
  /** HTML drawn above the nodes at canvas coordinates (labels, controls). */
  html?: ReactNode
}

/** One end of a connection being made. */
export interface PortRef {
  nodeId: string
  portId?: string
  role: 'source' | 'target'
}

export type ConnectValidity = 'unknown' | 'valid' | 'invalid'

export interface ConnectOptions {
  canConnect(from: PortRef, to: PortRef): boolean
  onConnect(from: PortRef, to: PortRef): void
  /** Name used in the live announcement while hovering a target. */
  nameOf?(nodeId: string): string
  labels?: {
    canConnect?: (name: string) => string
    cannotConnect?: (name: string) => string
  }
}

export interface NodeDragEvent {
  ids: string[]
  /** Total movement since the drag started, in canvas units. */
  delta: Point
  phase: 'start' | 'move' | 'end'
}

/** Imperative handle for toolbars and hosts. */
export interface CanvasApi {
  zoomIn(): void
  zoomOut(): void
  zoomTo(zoom: number): void
  fit(): void
  getViewport(): Viewport
  setViewport(v: Viewport): void
  /** Canvas point at the centre of what is visible. */
  visibleCentre(): Point
  /** Canvas point under a client (page) position. */
  clientToCanvas(p: Point): Point
  /** Pans just enough to show the node. */
  reveal(id: string): void
  /** Moves focus to the node's first focusable element (or its wrapper). */
  focusNode(id: string): void
  containerSize(): Size
}
