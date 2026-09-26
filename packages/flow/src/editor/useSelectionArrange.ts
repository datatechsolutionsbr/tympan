// SelectionArrange: group, ungroup, align, distribute and measure for the
// selected nodes. Every mutating action takes exactly one snapshot first, so it
// is one undo step; a selection too small for the action is a no-op.

import { useCallback, useRef } from 'react'
import { alignBoxes, distributeBoxes, frameAround, type AlignEdge, type DistributeAxis, type Placed } from '../geometry/arrange'
import { absoluteRect, sizeOf } from '../geometry/rect'
import { createId } from '../internal/ids'
import type { FlowNode, Size } from '../model/types'

/** Inner padding of a new group frame and the height of its header band. */
const FRAME_PADDING = 24
const FRAME_HEADER = 40

export interface GroupHandlers {
  onEdit?: (id: string) => void
  onToggleExpanded?: (id: string) => void
  onRemove?: (id: string) => void
}

export interface SelectionArrangeArgs {
  nodes: FlowNode[]
  setNodes: (next: FlowNode[] | ((prev: FlowNode[]) => FlowNode[])) => void
  snapshot: () => void
  /** Kept by the editor and passed to the frame's renderer (not stored in node data, which must stay serialisable). */
  groupHandlers?: GroupHandlers
  locked?: boolean
  /** Default name of a new group (from the i18n adapter). */
  groupName?: string
  /** Polite announcement after an action ("4 nodes aligned left"). */
  announce?: (action: 'group' | 'ungroup' | 'align' | 'distribute', detail: { count: number; edge?: AlignEdge; axis?: DistributeAxis }) => void
}

export function useSelectionArrange({ nodes, setNodes, snapshot, locked = false, groupName = 'Group', announce }: SelectionArrangeArgs) {
  const current = useRef(nodes)
  current.current = nodes

  const measure = useCallback((node: FlowNode): Size => sizeOf(node), [])

  const selectedBoxes = (): Placed[] => {
    const byId = new Map(current.current.map((n) => [n.id, n]))
    return current.current.filter((n) => n.selected && !n.hidden).map((n) => ({ id: n.id, rect: absoluteRect(n, byId) }))
  }

  /** Moves nodes to absolute canvas points, converting back to frame-relative positions. */
  const moveTo = (points: Map<string, { x: number; y: number }>) => {
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]))
      return prev.map((n) => {
        const p = points.get(n.id)
        if (!p) return n
        const parent = n.parentId ? byId.get(n.parentId) : undefined
        const origin = parent ? absoluteRect(parent, byId) : { x: 0, y: 0 }
        return { ...n, position: { x: p.x - origin.x, y: p.y - origin.y } }
      })
    })
  }

  const group = useCallback(() => {
    if (locked) return
    const boxes = selectedBoxes().filter((b) => !current.current.find((n) => n.id === b.id)?.parentId)
    if (boxes.length < 2) return
    const frame = frameAround(boxes, FRAME_PADDING, FRAME_HEADER)!
    snapshot()
    const id = createId('group')
    const members = new Set(boxes.map((b) => b.id))
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]))
      const rest = prev.map((n) => {
        if (!members.has(n.id)) return n.selected ? { ...n, selected: false } : n
        const abs = absoluteRect(n, byId)
        return { ...n, parentId: id, selected: false, position: { x: abs.x - frame.x, y: abs.y - frame.y } }
      })
      const frameNode: FlowNode = {
        id,
        kind: 'group',
        position: { x: frame.x, y: frame.y },
        size: { width: frame.width, height: frame.height },
        data: { label: groupName, tone: 'neutral', expanded: true, autoFit: true },
      }
      // First in the list so it renders behind its members.
      return [frameNode, ...rest]
    })
    announce?.('group', { count: boxes.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, snapshot, setNodes, groupName, announce])

  const ungroup = useCallback(() => {
    if (locked) return
    const frames = new Set(current.current.filter((n) => n.selected && n.kind === 'group').map((n) => n.id))
    if (!frames.size) return
    snapshot()
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]))
      return prev
        .filter((n) => !frames.has(n.id))
        .map((n) => {
          if (!n.parentId || !frames.has(n.parentId)) return n
          const abs = absoluteRect(n, byId)
          const { parentId: _drop, ...rest } = n
          return { ...rest, hidden: false, position: { x: abs.x, y: abs.y } }
        })
    })
    announce?.('ungroup', { count: frames.size })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, snapshot, setNodes, announce])

  const align = useCallback(
    (edge: AlignEdge) => {
      if (locked) return
      const boxes = selectedBoxes()
      if (boxes.length < 2) return
      snapshot()
      moveTo(alignBoxes(boxes, edge))
      announce?.('align', { count: boxes.length, edge })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locked, snapshot, announce],
  )

  const distribute = useCallback(
    (axis: DistributeAxis) => {
      if (locked) return
      const boxes = selectedBoxes()
      if (boxes.length < 3) return
      snapshot()
      moveTo(distributeBoxes(boxes, axis))
      announce?.('distribute', { count: boxes.length, axis })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locked, snapshot, announce],
  )

  return { group, ungroup, align, distribute, measure }
}
