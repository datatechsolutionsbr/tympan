// The editor's single meeting point with the node and connector groups: which
// component draws a kind, sizes before measurement, port anchors, connection
// rules and connector drawing. Hosts replace renderers through FlowEditor's
// `extraNodeKinds`; the canvas code only talks to this module.

import type { ReactNode } from 'react'
import type { RenderCatalog } from '../catalog/RenderCatalog'
import { renderConditionalConnector, splitConnector } from '../connectors/ConditionalConnector'
import type { FlowConnector, FlowNode, LayoutDirection, Size } from '../model/types'
import { AlignmentGuidesOverlay } from '../nodes/AlignmentGuides'
import type { CardDensity } from '../nodes/GraphNodeCard'
import { canConnect, declaredNodeSize, nodeAccessibleName, nodeComponentFor, portAnchorFor } from '../nodes/registry'
import type { FlowNodeComponent } from '../nodes/types'
import type { ConnectorParts, ConnectorShape, PortAnchor } from '../surface/types'

/** Title of a node: per-instance label, then identity, then catalog label, then kind. */
export function nodeTitle(node: FlowNode, catalog: RenderCatalog): string {
  const label = typeof node.data.label === 'string' && node.data.label ? node.data.label : undefined
  return label ?? catalog.identity(node.kind, node.data)?.title ?? catalog.entry(node.kind)?.label ?? node.kind
}

/** "kind: title", for lists, menus and announcements. */
export const nodeName = (node: FlowNode, catalog: RenderCatalog): string => nodeAccessibleName(node, catalog)

export const componentForKind = (kind: string, extra?: Record<string, FlowNodeComponent>): FlowNodeComponent => nodeComponentFor(kind, extra)

export const sizeForNode = (node: FlowNode, density: CardDensity): Size => declaredNodeSize(node, density)

export const anchorFor = (node: FlowNode, portId: string | undefined, role: 'source' | 'target', direction: LayoutDirection, catalog: RenderCatalog): PortAnchor =>
  portAnchorFor(node, portId, role, direction, catalog)

export const connectionAllowed = (source: FlowNode, target: FlowNode, sourcePort?: string, targetPort?: string): boolean => canConnect(source, target, sourcePort, targetPort)

export interface ConnectorRenderOptions {
  sourceName: string
  targetName: string
  locked: boolean
  selected: boolean
  active?: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onInsertStep: (id: string, kind: string, point: { x: number; y: number }) => void
  onOpenInsertPicker?: (connectorId: string, point: { x: number; y: number }) => void
  insertableKinds?: Array<{ kind: string; label: string }>
}

export function renderConnectorParts(connector: FlowConnector, shape: ConnectorShape, o: ConnectorRenderOptions): ConnectorParts {
  return renderConditionalConnector(connector, shape, {
    sourceName: o.sourceName,
    targetName: o.targetName,
    locked: o.locked,
    selected: o.selected,
    ...(o.active ? { active: true } : {}),
    onSelect: o.onSelect,
    onDelete: o.onDelete,
    onInsertStep: o.onInsertStep,
    ...(o.onOpenInsertPicker ? { onOpenInsertPicker: o.onOpenInsertPicker } : {}),
    ...(o.insertableKinds ? { insertableKinds: o.insertableKinds } : {}),
  })
}

export const splitConnectorThrough = (connectors: FlowConnector[], id: string, newNodeId: string): FlowConnector[] => splitConnector(connectors, id, newNodeId)

export function guideOverlay(guides: { horizontal: number | null; vertical: number | null }): ReactNode {
  return <AlignmentGuidesOverlay guides={guides} />
}
