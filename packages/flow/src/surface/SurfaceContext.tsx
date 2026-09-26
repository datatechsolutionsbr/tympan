import { createContext, useContext } from 'react'
import type { PortRef } from './types'

export interface SurfaceContextValue {
  zoom: number
  /** True for a short moment after a node drag ended: presses then are not activations. */
  justDragged(): boolean
  /** Connection being drawn, if any. */
  connecting: PortRef | null
  /** Node currently hovered by a connection drag and whether it accepts it. */
  connectTarget: { nodeId: string; valid: boolean } | null
  /** Connectors attach to node borders (ports hidden, ids kept). */
  floating: boolean
}

const fallback: SurfaceContextValue = {
  zoom: 1,
  justDragged: () => false,
  connecting: null,
  connectTarget: null,
  floating: false,
}

export const SurfaceContext = createContext<SurfaceContextValue>(fallback)

export function useSurface(): SurfaceContextValue {
  return useContext(SurfaceContext)
}
