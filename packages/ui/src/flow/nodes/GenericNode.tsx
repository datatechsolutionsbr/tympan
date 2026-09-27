// GenericNode: any node kind drawn from NodeKindCatalog data alone, so a kind
// added on the backend appears without new front-end code. Duplicate, delete
// and rename act on the shared editor state (one undo step each).

import { Copy, Settings2, Trash2 } from 'lucide-react'
import type { BranchTone } from '../catalog/kindCatalog'
import { defineLabels, fill, useLabels } from '../internal/labels'
import type { FlowNode, LayoutDirection, RunStatus } from '../model/types'
import { useEditorLocked, useOptionalFlowEditorStore } from '../state/editorState'
import { ConnectionPorts } from './ConnectionPorts'
import { GraphNodeCard, type CardDensity } from './GraphNodeCard'
import { NodeTools, PreviewStatusMark, useKindPresentation, usePreviewStatusWord, type NodeToolAction } from './nodeChrome'
import { NodeRunIndicator, useRunWords } from './NodeRunIndicator'

export interface GenericNodeLabels {
  tools: string
  configure: string
  duplicate: string
  remove: string
}

export const genericNodeLabels = defineLabels<GenericNodeLabels>('genericNode', {
  en: { tools: 'Tools for {label}', configure: 'Configure {label}', duplicate: 'Duplicate {label}', remove: 'Delete {label}' },
  'pt-BR': { tools: 'Ferramentas de {label}', configure: 'Configurar {label}', duplicate: 'Duplicar {label}', remove: 'Excluir {label}' },
  es: { tools: 'Herramientas de {label}', configure: 'Configurar {label}', duplicate: 'Duplicar {label}', remove: 'Eliminar {label}' },
})
export const defaultGenericNodeLabels = genericNodeLabels.bundles.en

export interface GenericNodeProps {
  id: string
  kind: string
  /** Per-instance label; always wins over the catalog label. */
  label?: string
  density?: CardDensity
  /** Replaces the kind's static outputs for this instance (one per configured case). */
  dynamicOutputs?: { id: string; label: string; tone?: BranchTone }[]
  onConfigure?: (id: string) => void
  selected?: boolean
  direction?: LayoutDirection
  /** Extra node data (identity resolvers read it). */
  data?: Record<string, unknown>
  preview?: boolean
  runStatus?: RunStatus
  /** Used when no editor state is present. */
  onDuplicate?: (id: string) => void
  onRemove?: (id: string) => void
  onRename?: (id: string, label: string) => void
  locked?: boolean
  labels?: Partial<GenericNodeLabels>
}

export function GenericNode(props: GenericNodeProps) {
  const { id, kind, label, density = 'detailed', dynamicOutputs, onConfigure, selected = false, direction = 'right', data, preview = false, runStatus } = props
  const l = useLabels(genericNodeLabels, props.labels)
  const store = useOptionalFlowEditorStore()
  const editorLocked = useEditorLocked()
  const locked = !!props.locked || editorLocked
  const node: FlowNode = { id, kind, position: { x: 0, y: 0 }, data: { ...(data ?? {}), ...(label !== undefined ? { label } : {}), ...(dynamicOutputs ? { dynamicOutputs } : {}) } }
  const k = useKindPresentation(node, direction)
  const run = useRunWords(id)
  const previewWord = usePreviewStatusWord(runStatus)

  const duplicate = () => {
    if (store) store.actions.duplicate([id])
    else props.onDuplicate?.(id)
  }
  const remove = () => {
    if (store) store.actions.removeNodes([id])
    else props.onRemove?.(id)
  }
  const rename = (next: string) => {
    if (locked) return
    if (store) {
      store.actions.snapshot()
      store.actions.setNodes((nodes) => nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: next } } : n)))
    } else props.onRename?.(id, next)
  }

  const editable = !preview && !locked
  const tools: NodeToolAction[] = editable
    ? [
        ...(onConfigure ? [{ id: 'configure', label: fill(l.configure, { label: k.title }), icon: Settings2, onPress: () => onConfigure(id) }] : []),
        ...(store || props.onDuplicate ? [{ id: 'duplicate', label: fill(l.duplicate, { label: k.title }), icon: Copy, onPress: duplicate }] : []),
        ...(store || props.onRemove ? [{ id: 'delete', label: fill(l.remove, { label: k.title }), icon: Trash2, onPress: remove, tone: 'danger' as const }] : []),
      ]
    : []

  const extra = [run.words, previewWord].filter((w): w is string => !!w)
  return (
    <GraphNodeCard
      kind={kind}
      kindLabel={k.category ?? k.kindLabel}
      title={k.title}
      description={k.description ?? (density === 'detailed' ? k.kindLabel : undefined)}
      icon={k.icon}
      tone={k.tone}
      width="standard"
      density={density}
      selected={selected}
      locked={locked}
      runState={run.runState}
      dimmed={runStatus === 'unknown'}
      stateWords={extra}
      {...((editable || preview) && onConfigure ? { onActivate: () => onConfigure(id) } : {})}
      {...(editable && (store || props.onRename) ? { onRename: rename } : {})}
      meta={runStatus ? <PreviewStatusMark status={runStatus} /> : undefined}
      className="ty-flow-node"
    >
      <NodeTools label={fill(l.tools, { label: k.title })} actions={tools} />
      <ConnectionPorts nodeId={id} nodeLabel={k.title} inputs={k.inputs} outputs={k.outputs} tone={k.tone} preview={preview} />
      <NodeRunIndicator nodeId={id} kind={kind} nodeLabel={k.title} />
    </GraphNodeCard>
  )
}
