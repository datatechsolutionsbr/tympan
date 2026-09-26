// Pure arithmetic of group frames: members' bounds, auto-fit, the smallest
// allowed manual size, and collapse/expand (which hides members and their
// connectors without moving anything).

import { enclosingRect, sizeOf } from '../geometry/rect'
import type { FlowConnector, FlowNode, Rect, Size } from '../model/types'

/** Inner padding around members (§2.1 --fk-space-5). */
export const GROUP_PADDING = 24
/** Height of the frame's header band. */
export const GROUP_HEADER = 48
export const GROUP_MIN_SIZE: Readonly<Size> = Object.freeze({ width: 240, height: 160 })
/** Keyboard resize step (grid step of the canvas). */
export const GROUP_RESIZE_STEP = 24

export function membersOf(nodes: readonly FlowNode[], groupId: string): FlowNode[] {
  return nodes.filter((n) => n.parentId === groupId)
}

/** Members' box in the frame's own coordinates, or null without members. */
export function memberBounds(nodes: readonly FlowNode[], groupId: string): Rect | null {
  return enclosingRect(membersOf(nodes, groupId).map((m) => ({ ...m.position, ...sizeOf(m) })))
}

/** Smallest manual size: members' far edges plus padding, never under the minimum. */
export function minimumGroupSize(nodes: readonly FlowNode[], groupId: string): Size {
  const b = memberBounds(nodes, groupId)
  if (!b) return { ...GROUP_MIN_SIZE }
  return {
    width: Math.max(GROUP_MIN_SIZE.width, b.x + b.width + GROUP_PADDING),
    height: Math.max(GROUP_MIN_SIZE.height, b.y + b.height + GROUP_PADDING),
  }
}

/**
 * Moves and resizes the frame so every side keeps the same padding around its
 * members, shifting member positions so none moves on screen.
 */
export function fitGroupToMembers(nodes: readonly FlowNode[], groupId: string): FlowNode[] {
  const group = nodes.find((n) => n.id === groupId)
  const b = memberBounds(nodes, groupId)
  if (!group || !b) return nodes.slice()
  const shift = { x: b.x - GROUP_PADDING, y: b.y - GROUP_PADDING - GROUP_HEADER }
  const size = {
    width: Math.max(GROUP_MIN_SIZE.width, b.width + GROUP_PADDING * 2),
    height: Math.max(GROUP_MIN_SIZE.height, b.height + GROUP_PADDING * 2 + GROUP_HEADER),
  }
  return nodes.map((n) => {
    if (n.id === groupId) return { ...n, position: { x: n.position.x + shift.x, y: n.position.y + shift.y }, size }
    if (n.parentId === groupId) return { ...n, position: { x: n.position.x - shift.x, y: n.position.y - shift.y } }
    return n
  })
}

/** Collapses or expands a frame: members and every connector touching them are hidden or shown. */
export function setGroupExpanded(graph: { nodes: readonly FlowNode[]; connectors: readonly FlowConnector[] }, groupId: string, expanded: boolean): { nodes: FlowNode[]; connectors: FlowConnector[] } {
  const members = new Set(membersOf(graph.nodes, groupId).map((m) => m.id))
  return {
    nodes: graph.nodes.map((n) => {
      if (n.id === groupId) return { ...n, data: { ...n.data, expanded } }
      if (members.has(n.id)) return { ...n, hidden: !expanded }
      return n
    }),
    connectors: graph.connectors.map((c) => (members.has(c.source) || members.has(c.target) ? { ...c, hidden: !expanded } : c)),
  }
}
