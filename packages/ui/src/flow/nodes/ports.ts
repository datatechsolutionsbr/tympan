// Port placement: which ports a node has and where each sits. Pure; used by
// ConnectionPorts (drawing) and by portAnchorFor (connector geometry), so the
// dot and the line end always agree.

import type { BranchTone, PortSpec, PortTopology } from '../catalog/kindCatalog'
import type { RenderCatalog } from '../catalog/RenderCatalog'
import type { FlowNode, LayoutDirection, Side } from '../model/types'
import type { PortAnchor } from '../surface/types'

export type PortRole = 'source' | 'target'

/** A port ready to draw: logical side after the layout mapping, position 0..1 along it. */
export interface PlacedPort {
  id: string
  role: PortRole
  side: Side
  along: number
  label?: string
  tone?: BranchTone
}

/** Per-instance outputs (one per configured case), stored in node data. */
export interface DynamicOutput {
  id: string
  label: string
  tone?: BranchTone
}

/**
 * Top-down layouts turn the inline sides into block sides: start → top,
 * end → bottom. Ids never change, so saved connectors keep resolving.
 */
export function sideForLayout(side: Side, direction: LayoutDirection): Side {
  if (direction !== 'down') return side
  if (side === 'start') return 'top'
  if (side === 'end') return 'bottom'
  return side
}

/** Position of item `index` of `count` spread evenly along a side (1/(n+1) steps). */
export function evenSpread(index: number, count: number): number {
  return (index + 1) / (count + 1)
}

/** Ids of a port set: prefix plus index, or the stable keys when given. */
export function portSetIds(count: number, idPrefix: string, keys?: readonly string[]): string[] {
  return Array.from({ length: count }, (_, i) => keys?.[i] ?? `${idPrefix}-${i}`)
}

const IN: PortSpec = { id: 'in', side: 'start' }
const OUT: PortSpec = { id: 'out', side: 'end' }

/** Topology used when the catalog has none for a kind. */
export function fallbackTopology(kind: string): PortTopology {
  switch (kind) {
    case 'start':
    case 'trigger':
      return { inputs: [], outputs: [OUT] }
    case 'end':
    case 'answer':
      return { inputs: [IN], outputs: [] }
    case 'note':
      return { inputs: [], outputs: [] }
    case 'if-else':
    case 'branch':
      return {
        inputs: [IN],
        outputs: [
          { id: 'true', side: 'end', label: 'true', tone: 'success' },
          { id: 'false', side: 'end', label: 'false', tone: 'error' },
        ],
      }
    case 'iteration':
    case 'loop':
      return { inputs: [IN], outputs: [OUT, { id: 'loop', side: 'bottom', label: 'loop', tone: 'info' }] }
    case 'agent':
      return {
        inputs: [IN, { id: 'in-top', side: 'top' }],
        outputs: [OUT, { id: 'out-bottom', side: 'bottom' }, { id: 'rule', side: 'bottom', offset: 80, label: 'rule', tone: 'neutral' }],
      }
    case 'rule':
      return { inputs: [IN], outputs: [{ id: 'rule', side: 'end', label: 'rule', tone: 'neutral' }] }
    default:
      return { inputs: [IN], outputs: [OUT] }
  }
}

function place(specs: readonly PortSpec[], role: PortRole, direction: LayoutDirection): PlacedPort[] {
  // Ports without an explicit offset share their side evenly.
  const bySide = new Map<Side, PortSpec[]>()
  for (const s of specs) if (s.offset === undefined) bySide.set(s.side, [...(bySide.get(s.side) ?? []), s])
  return specs.map((s) => {
    const peers = bySide.get(s.side)
    const along = s.offset !== undefined ? s.offset / 100 : evenSpread(peers!.indexOf(s), peers!.length)
    return {
      id: s.id,
      role,
      side: sideForLayout(s.side, direction),
      along,
      ...(s.label ? { label: s.label } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
    }
  })
}

function dynamicOutputsOf(node: FlowNode): DynamicOutput[] | null {
  const d = node.data.dynamicOutputs
  if (!Array.isArray(d) || !d.length) return null
  return d.filter((o): o is DynamicOutput => !!o && typeof o === 'object' && typeof (o as DynamicOutput).id === 'string')
}

/** Every port of a node, placed for the current layout direction. */
export function portsOf(node: FlowNode, catalog: Pick<RenderCatalog, 'ports'>, direction: LayoutDirection): { inputs: PlacedPort[]; outputs: PlacedPort[] } {
  const topology = catalog.ports(node.kind) ?? fallbackTopology(node.kind)
  const dynamic = dynamicOutputsOf(node)
  const outputs: PortSpec[] = dynamic ? dynamic.map((o) => ({ id: o.id, side: 'end', label: o.label, ...(o.tone ? { tone: o.tone } : {}) })) : topology.outputs
  return { inputs: place(topology.inputs, 'target', direction), outputs: place(outputs, 'source', direction) }
}

/** Where a connector touches `node` for `portId`; the first port of the role when the id is unknown. */
export function portAnchorFor(node: FlowNode, portId: string | undefined, role: PortRole, direction: LayoutDirection, catalog: Pick<RenderCatalog, 'ports'>): PortAnchor {
  const { inputs, outputs } = portsOf(node, catalog, direction)
  const list = role === 'source' ? outputs : inputs
  const port = (portId !== undefined && list.find((p) => p.id === portId)) || list[0]
  if (port) return { side: port.side, along: port.along }
  return { side: sideForLayout(role === 'source' ? 'end' : 'start', direction), along: 0.5 }
}
