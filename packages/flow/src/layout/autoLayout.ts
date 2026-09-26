// Ranked placement of a directed graph so connectors read one way. The
// crossing reduction and coordinates come from @dagrejs/dagre (MIT); this
// module only chooses who takes part, feeds sizes in and reads corners out.
// Pure: the input list is never changed.

import { placeChain } from './chainLayout'
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
  /**
   * `start` (top-down only) keeps a chain on one line and puts branches after
   * it toward the inline end, which `rtl` flips (see chainLayout.ts);
   * `centre` (default) centres parents over their children.
   */
  alignment?: 'centre' | 'start'
  rtl?: boolean
}

const RANKDIR: Record<RankDirection, 'TB' | 'LR' | 'RL'> = { 'top-down': 'TB', 'left-right': 'LR', 'right-left': 'RL' }

/** Top-left corner for every node that takes part, keyed by id. */
function placeRanked(members: readonly LayoutNode[], links: readonly LayoutEdge[], direction: RankDirection, o: AutoLayoutOptions): Map<string, Point> {
  const g = new Graph()
  const edgeGap = o.margin ?? 24
  g.setGraph({
    rankdir: RANKDIR[direction],
    ranksep: o.rankGap ?? 64,
    nodesep: o.siblingGap ?? 32,
    marginx: edgeGap,
    marginy: edgeGap,
  })
  g.setDefaultEdgeLabel(() => ({}))
  const sizes = new Map(members.map((m) => [m.id, sizeOf(m, o.fallbackSize)]))
  sizes.forEach((s, id) => g.setNode(id, { width: s.width, height: s.height }))
  for (const { source, target } of links) if (source !== target && sizes.has(source) && sizes.has(target)) g.setEdge(source, target)
  layout(g)
  const corners = new Map<string, Point>()
  sizes.forEach((s, id) => {
    const centre = g.node(id) as { x: number; y: number } | undefined
    if (centre) corners.set(id, { x: centre.x - s.width / 2, y: centre.y - s.height / 2 })
  })
  return corners
}

/** Arranges nodes in ranks. Grouped children and fixed kinds (notes) keep their positions. */
export function autoLayout<N extends LayoutNode>(nodes: readonly N[], connectors: readonly LayoutEdge[], direction: RankDirection, options: AutoLayoutOptions = {}): N[] {
  const staysPut = new Set(options.fixedKinds ?? ['note'])
  const members = nodes.filter((n) => n.parentId === undefined && !staysPut.has(n.kind))
  const corners = !members.length
    ? new Map<string, Point>()
    : options.alignment === 'start' && direction === 'top-down'
      ? placeChain(new Map(members.map((m) => [m.id, sizeOf(m, options.fallbackSize)])), connectors, { rankGap: options.rankGap ?? 64, siblingGap: options.siblingGap ?? 32, margin: options.margin ?? 24, rtl: !!options.rtl })
      : placeRanked(members, connectors, direction, options)
  return nodes.map((n) => {
    const corner = corners.get(n.id)
    return corner ? { ...n, position: corner } : n
  })
}

/**
 * Maps the editor's direction names onto AutoLayout's. A horizontal flow reads
 * in the text direction: right-to-left in RTL locales unless `keepLtr`.
 */
export function rankDirectionOf(direction: 'down' | 'right', rtl = false, keepLtr = false): RankDirection {
  if (direction === 'down') return 'top-down'
  return rtl && !keepLtr ? 'right-left' : 'left-right'
}
