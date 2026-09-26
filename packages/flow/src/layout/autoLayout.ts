// AutoLayout: ranked (Sugiyama-style) placement through @dagrejs/dagre (MIT).
// Pure: returns a new list, never mutates the input.

import { Graph, layout } from '@dagrejs/dagre'
import { sizeOf } from '../geometry/rect'
import type { Point, RankDirection, Size } from '../model/types'

export interface LayoutNode {
  id: string
  kind: string
  position: Point
  size?: Size
  measured?: Size
  parentId?: string
}

export interface LayoutEdge {
  source: string
  target: string
}

export interface AutoLayoutOptions {
  /** Gap between ranks (design direction §2.1: --fk-space-8 = 64). */
  rankGap?: number
  /** Gap between nodes of one rank (--fk-space-6 = 32). */
  siblingGap?: number
  /** Margin around the whole layout (--fk-space-5 = 24). */
  margin?: number
  /** Kinds whose nodes are never moved (annotations). Default: note. */
  fixedKinds?: readonly string[]
  /** Size to assume when a node has neither measured nor declared size. */
  fallbackSize?: Size
}

const DEFAULTS = { rankGap: 64, siblingGap: 32, margin: 24 }

/** Arranges nodes in ranks so connectors read in one direction. */
export function autoLayout<N extends LayoutNode>(nodes: readonly N[], connectors: readonly LayoutEdge[], direction: RankDirection, options: AutoLayoutOptions = {}): N[] {
  const fixed = new Set(options.fixedKinds ?? ['note'])
  const movable = nodes.filter((n) => !n.parentId && !fixed.has(n.kind))
  if (!movable.length) return nodes.map((n) => n)
  const ids = new Set(movable.map((n) => n.id))

  const g = new Graph({ multigraph: false, compound: false })
  g.setGraph({
    rankdir: direction === 'left-right' ? 'LR' : direction === 'right-left' ? 'RL' : 'TB',
    ranksep: options.rankGap ?? DEFAULTS.rankGap,
    nodesep: options.siblingGap ?? DEFAULTS.siblingGap,
    marginx: options.margin ?? DEFAULTS.margin,
    marginy: options.margin ?? DEFAULTS.margin,
  })
  g.setDefaultEdgeLabel(() => ({}))
  // Sorted insertion keeps dagre's tie-breaks independent of caller order quirks.
  for (const n of movable) {
    const s = sizeOf(n, options.fallbackSize)
    g.setNode(n.id, { width: s.width, height: s.height })
  }
  for (const c of connectors) {
    if (ids.has(c.source) && ids.has(c.target) && c.source !== c.target) g.setEdge(c.source, c.target)
  }
  layout(g)

  return nodes.map((n) => {
    if (!ids.has(n.id)) return n
    const placed = g.node(n.id) as { x: number; y: number; width: number; height: number } | undefined
    if (!placed) return n
    // dagre reports centres; nodes are positioned by their top-left corner.
    return { ...n, position: { x: placed.x - placed.width / 2, y: placed.y - placed.height / 2 } }
  })
}

/**
 * Maps the editor's direction names onto AutoLayout's. A horizontal flow reads
 * in the text direction: right-to-left in RTL locales unless `keepLtr`.
 */
export function rankDirectionOf(direction: 'down' | 'right', rtl = false, keepLtr = false): RankDirection {
  if (direction !== 'right') return 'top-down'
  return rtl && !keepLtr ? 'right-left' : 'left-right'
}
