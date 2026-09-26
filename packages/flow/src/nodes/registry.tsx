// Registry of built-in node kinds and the rules canvases need about nodes:
// which component draws a kind, its size before measurement, where its ports
// sit, whether two nodes may be connected, and its spoken name.
//
// Node data keys read by the built-in kinds:
//   every kind   label?, description?
//   generic      dynamicOutputs?: { id, label, tone? }[]
//   agent        agentRef? (id in reference.agents)
//   rule         ruleId? (id in reference.rules) | engine?: RuleEngineConfig
//   note         text?, tone?            (size: node.size)
//   group        name?, description?, tone?, expanded?, autoFit?  (size: node.size)
//   datasource   sourceId, dialect?, table, selectedColumns?, filters?, limit?, readOnly?
//   decision     DecisionConfig fields (input, options, provider, model, modelVersion …)

import { humaniseKey, type RenderCatalog } from '../catalog/RenderCatalog'
import { DecisionNode } from '../decision/DecisionNode'
import type { DecisionConfig } from '../decision/types'
import type { FlowNode, LayoutDirection, Size } from '../model/types'
import { useOptionalFlowEditorStore } from '../state/editorState'
import type { PortAnchor } from '../surface/types'
import { AgentNode } from './AgentNode'
import { DataSourceNode, type DataSourceConfig } from './DataSourceNode'
import { GenericNode } from './GenericNode'
import { CARD_WIDTHS, estimatedCardHeight, type CardDensity } from './GraphNodeCard'
import { fitGroupToMembers, membersOf, minimumGroupSize, setGroupExpanded } from './groupLayout'
import { GroupNode } from './GroupNode'
import { NOTE_SIZE, NoteNode } from './NoteNode'
import { portAnchorFor as anchorOf } from './ports'
import { RuleNode } from './RuleNode'
import type { FlowNodeComponent, FlowNodeProps, RuleEngineConfig } from './types'

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

function AgentAdapter({ node, reference, density, locked, preview, selected, direction, onConfigure, onRemove }: FlowNodeProps) {
  const ref = str(node.data.agentRef) ?? str(node.data.agentId)
  const agent = reference?.agents?.find((a) => a.id === ref) ?? null
  return (
    <AgentNode
      id={node.id}
      agent={agent}
      label={str(node.data.label) ?? 'Agent'}
      density={density}
      locked={locked}
      preview={!!preview}
      selected={!!selected}
      direction={direction}
      {...(onConfigure ? { onOpen: () => onConfigure(node.id) } : {})}
      {...(onRemove ? { onRemove } : {})}
    />
  )
}

function RuleAdapter({ node, reference, density, locked, preview, selected, direction, onConfigure, onRemove, onToggleRule }: FlowNodeProps) {
  const rule = reference?.rules?.find((r) => r.id === str(node.data.ruleId)) ?? null
  const engine = (node.data.engine as RuleEngineConfig | undefined) ?? null
  const label = str(node.data.label)
  return (
    <RuleNode
      id={node.id}
      rule={rule}
      config={engine}
      {...(label ? { label } : {})}
      density={density}
      locked={locked}
      preview={!!preview}
      selected={!!selected}
      direction={direction}
      {...(onConfigure ? { onOpen: () => onConfigure(node.id) } : {})}
      {...(onToggleRule ? { onToggleEnabled: onToggleRule } : {})}
      {...(onRemove ? { onRemove } : {})}
    />
  )
}

function NoteAdapter({ node, locked, preview, selected, onTextChange }: FlowNodeProps) {
  const store = useOptionalFlowEditorStore()
  const size = node.size ?? NOTE_SIZE
  return (
    <NoteNode
      id={node.id}
      text={str(node.data.text) ?? ''}
      {...(str(node.data.tone) ? { tone: str(node.data.tone)! } : {})}
      width={size.width}
      height={size.height}
      selected={!!selected}
      locked={locked || !!preview}
      onTextChange={(text) => {
        if (onTextChange) return onTextChange(node.id, text)
        if (!store) return
        // One undo step per editing session.
        store.actions.snapshot()
        store.actions.setNodes((nodes) => nodes.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, text } } : n)))
      }}
    />
  )
}

function GroupAdapter({ node, locked, preview, selected, density, direction, onConfigure, onRemove, onToggleExpanded, onEnterFocus }: FlowNodeProps) {
  const store = useOptionalFlowEditorStore()
  const nodes = store?.getState().nodes ?? []
  const toggle = (id: string) => {
    if (onToggleExpanded) return onToggleExpanded(id)
    if (!store || locked) return
    const s = store.getState()
    store.actions.snapshot()
    const next = setGroupExpanded({ nodes: s.nodes, connectors: s.connectors }, id, node.data.expanded === false)
    store.actions.setNodes(next.nodes)
    store.actions.setConnectors(next.connectors)
  }
  const resize = (id: string, size: Size) => {
    if (!store || locked) return
    store.actions.snapshot()
    store.actions.setNodes((all) => all.map((n) => (n.id === id ? { ...n, size, data: { ...n.data, autoFit: false } } : n)))
  }
  return (
    <GroupNode
      id={node.id}
      {...(str(node.data.name) ?? str(node.data.label) ? { name: (str(node.data.name) ?? str(node.data.label))! } : {})}
      {...(str(node.data.description) ? { description: str(node.data.description)! } : {})}
      {...(str(node.data.tone) ? { tone: str(node.data.tone)! } : {})}
      expanded={node.data.expanded !== false}
      autoFit={node.data.autoFit !== false}
      size={node.size ?? { width: 400, height: 280 }}
      memberCount={membersOf(nodes, node.id).length}
      minSize={minimumGroupSize(nodes, node.id)}
      onToggleExpanded={toggle}
      onResize={resize}
      selected={!!selected}
      locked={locked}
      preview={!!preview}
      density={density}
      direction={direction}
      {...(onConfigure ? { onConfigure } : {})}
      {...(onRemove ? { onRemove } : {})}
      {...(onEnterFocus ? { onEnterFocus } : {})}
    />
  )
}

function DataSourceAdapter({ node, reference, density, locked, preview, selected, direction, onConfigure, onRemove }: FlowNodeProps) {
  const d = node.data
  const config: DataSourceConfig | null = str(d.sourceId) && str(d.table) ? (d as unknown as DataSourceConfig) : null
  const src = reference?.dataSources?.find((s) => s.id === str(d.sourceId))
  const label = str(d.label)
  return (
    <DataSourceNode
      id={node.id}
      config={config}
      {...(src ? { source: { name: src.name, ...(src.connected !== undefined ? { connected: src.connected } : {}) } } : {})}
      dialects={reference?.dialects ?? []}
      {...(label ? { label } : {})}
      readOnly={d.readOnly === true || !!src?.sample}
      density={density}
      locked={locked}
      preview={!!preview}
      selected={!!selected}
      direction={direction}
      {...(onConfigure ? { onConfigure } : {})}
      {...(onRemove ? { onRemove } : {})}
    />
  )
}

function DecisionAdapter({ node, reference, density, locked, preview, selected, direction, onConfigure, onRemove }: FlowNodeProps) {
  const d = node.data as Partial<DecisionConfig>
  const config: DecisionConfig | null = d.input && Array.isArray(d.options) ? ({ kind: 'decision', ...d } as DecisionConfig) : null
  const result = reference?.decisionResults?.[node.id]
  const label = str(node.data.label)
  return (
    <DecisionNode
      id={node.id}
      config={config}
      {...(result ? { result } : {})}
      {...(label ? { label } : {})}
      density={density}
      locked={locked}
      preview={!!preview}
      selected={!!selected}
      direction={direction}
      {...(onConfigure ? { onConfigure } : {})}
      {...(onRemove ? { onRemove } : {})}
    />
  )
}

function GenericAdapter({ node, density, locked, preview, selected, direction, runStatus, onConfigure, onRemove, onDuplicate, onRename }: FlowNodeProps) {
  return (
    <GenericNode
      id={node.id}
      kind={node.kind}
      {...(str(node.data.label) ? { label: str(node.data.label)! } : {})}
      data={node.data}
      density={density}
      locked={locked}
      preview={!!preview}
      selected={!!selected}
      direction={direction}
      {...(runStatus ? { runStatus } : {})}
      {...(onConfigure ? { onConfigure } : {})}
      {...(onRemove ? { onRemove } : {})}
      {...(onDuplicate ? { onDuplicate } : {})}
      {...(onRename ? { onRename } : {})}
    />
  )
}

export const builtInNodeComponents: Record<string, FlowNodeComponent> = {
  agent: AgentAdapter,
  rule: RuleAdapter,
  note: NoteAdapter,
  group: GroupAdapter,
  datasource: DataSourceAdapter,
  decision: DecisionAdapter,
}

/** Component for a kind: host extras, then built-ins, then the catalog-driven generic node. */
export function nodeComponentFor(kind: string, extra?: Record<string, FlowNodeComponent>): FlowNodeComponent {
  return extra?.[kind] ?? builtInNodeComponents[kind] ?? GenericAdapter
}

/** Size to lay a node out with before it is measured. */
export function declaredNodeSize(node: FlowNode, density: CardDensity): Size {
  if (node.kind === 'note') return node.size ?? { ...NOTE_SIZE }
  if (node.kind === 'group') {
    if (node.data.expanded === false) return { width: CARD_WIDTHS.standard, height: estimatedCardHeight(density, false) }
    return node.size ?? { width: 400, height: 280 }
  }
  const wide = node.kind === 'agent' || node.kind === 'decision'
  return node.size ?? { width: wide ? CARD_WIDTHS.wide : CARD_WIDTHS.standard, height: estimatedCardHeight(density, density === 'detailed') }
}

/** Where a connector touches a node (logical side, 0..1 along it). */
export function portAnchorFor(node: FlowNode, portId: string | undefined, role: 'source' | 'target', direction: LayoutDirection, catalog: Pick<RenderCatalog, 'ports'>): PortAnchor {
  return anchorOf(node, portId, role, direction, catalog)
}

const NEVER_SOURCE = new Set(['end', 'answer', 'rule', 'note'])
const NEVER_TARGET = new Set(['start', 'trigger', 'note'])

/**
 * Connection rules: no self-connection; notes never connect; a start node is
 * never a target; end and answer nodes are never sources; a rule node is never
 * a source; an iteration-start node accepts input only from its iteration.
 */
export function canConnect(source: FlowNode, target: FlowNode, _sourcePort?: string, _targetPort?: string): boolean {
  if (source.id === target.id) return false
  if (NEVER_SOURCE.has(source.kind) || NEVER_TARGET.has(target.kind)) return false
  if (target.kind === 'iteration-start') {
    const owner = str(target.data.iterationId) ?? target.parentId
    return source.kind === 'iteration' && (!owner || owner === source.id)
  }
  return true
}

/** "Kind: label" for lists, announcements and search. */
export function nodeAccessibleName(node: FlowNode, catalog: Pick<RenderCatalog, 'entry'>): string {
  const kind = catalog.entry(node.kind)?.label ?? humaniseKey(node.kind)
  const title = str(node.data.label) ?? str(node.data.name) ?? (node.kind === 'note' ? str(node.data.text)?.split(/\s+/).slice(0, 6).join(' ') : undefined)
  return title ? `${kind}: ${title}` : kind
}

export { fitGroupToMembers }
