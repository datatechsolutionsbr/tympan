// Pure edits on a graph snapshot: history stacks, copy, paste, duplicate and
// removal. Shared by the editor state and the stand-alone EditorShortcuts hooks.

import { createId } from '../internal/ids'
import type { FlowConnector, FlowNode } from '../model/types'

export interface GraphSnapshot {
  nodes: FlowNode[]
  connectors: FlowConnector[]
}

/** Deep copy of node data so later edits never leak into history entries. */
export function freezeSnapshot(nodes: readonly FlowNode[], connectors: readonly FlowConnector[]): GraphSnapshot {
  return {
    nodes: nodes.map((n) => ({ ...n, position: { ...n.position }, data: structuredClone(n.data) })),
    connectors: connectors.map((c) => ({ ...c })),
  }
}

export interface HistoryStacks {
  past: GraphSnapshot[]
  future: GraphSnapshot[]
}

/** Pushes `current` onto past (bounded), clears future. */
export function recordHistory(stacks: HistoryStacks, current: GraphSnapshot, limit: number): HistoryStacks {
  const past = [...stacks.past, current]
  while (past.length > Math.max(1, limit)) past.shift()
  return { past, future: [] }
}

export function stepBack(stacks: HistoryStacks, current: GraphSnapshot): { stacks: HistoryStacks; graph: GraphSnapshot } | null {
  if (!stacks.past.length) return null
  const past = stacks.past.slice(0, -1)
  const graph = stacks.past[stacks.past.length - 1]!
  return { stacks: { past, future: [current, ...stacks.future] }, graph }
}

export function stepForward(stacks: HistoryStacks, current: GraphSnapshot): { stacks: HistoryStacks; graph: GraphSnapshot } | null {
  if (!stacks.future.length) return null
  const [graph, ...future] = stacks.future
  return { stacks: { past: [...stacks.past, current], future }, graph: graph! }
}

/** Selected nodes plus only the connectors whose both ends are selected; null when nothing is selected. */
export function copySelection(nodes: readonly FlowNode[], connectors: readonly FlowConnector[]): GraphSnapshot | null {
  const picked = nodes.filter((n) => n.selected)
  if (!picked.length) return null
  const ids = new Set(picked.map((n) => n.id))
  return freezeSnapshot(
    picked,
    connectors.filter((c) => ids.has(c.source) && ids.has(c.target)),
  )
}

export const PASTE_OFFSET = 32

/**
 * New nodes and connectors for a paste: fresh ids, remapped connectors,
 * positions shifted diagonally, only the new nodes selected.
 */
export function clonePiece(piece: GraphSnapshot, offset = PASTE_OFFSET): GraphSnapshot {
  const remap = new Map<string, string>()
  for (const n of piece.nodes) remap.set(n.id, createId(n.kind || 'node'))
  const nodes = piece.nodes.map((n) => ({
    ...n,
    id: remap.get(n.id)!,
    position: n.parentId && remap.has(n.parentId) ? { ...n.position } : { x: n.position.x + offset, y: n.position.y + offset },
    ...(n.parentId ? { parentId: remap.get(n.parentId) ?? n.parentId } : {}),
    data: structuredClone(n.data),
    selected: true,
  }))
  const connectors = piece.connectors.map((c) => ({
    ...c,
    id: createId('connector'),
    source: remap.get(c.source)!,
    target: remap.get(c.target)!,
    selected: false,
  }))
  return { nodes, connectors }
}

/** Graph with `piece` merged in and everything else deselected. */
export function mergePiece(graph: GraphSnapshot, piece: GraphSnapshot): GraphSnapshot {
  return {
    nodes: [...graph.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), ...piece.nodes],
    connectors: [...graph.connectors.map((c) => (c.selected ? { ...c, selected: false } : c)), ...piece.connectors],
  }
}

/** Removes the given nodes, their members and every connector touching them. */
export function withoutNodes(graph: GraphSnapshot, ids: ReadonlySet<string>): GraphSnapshot {
  const gone = new Set(ids)
  // Members of removed frames go too.
  let grew = true
  while (grew) {
    grew = false
    for (const n of graph.nodes) if (n.parentId && gone.has(n.parentId) && !gone.has(n.id)) {
      gone.add(n.id)
      grew = true
    }
  }
  return {
    nodes: graph.nodes.filter((n) => !gone.has(n.id)),
    connectors: graph.connectors.filter((c) => !gone.has(c.source) && !gone.has(c.target)),
  }
}
