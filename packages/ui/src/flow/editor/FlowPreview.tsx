// FlowPreview: a read-only picture of a flow for chat replies, run inspection
// and live previews. Layout and fit follow the graph only; selection and
// statuses never move the view.

import { useId, useLayoutEffect, useMemo, useRef, type ReactNode, type Ref } from 'react'
import { PreviewStatusMark, usePreviewStatusWord } from '../nodes/nodeChrome'
import { builtInNodeComponents } from '../nodes/registry'
import { useRenderCatalog } from '../catalog/RenderCatalog'
import { absoluteRect } from '../geometry/rect'
import { defineLabels, useFlowLocale, useLabels } from '../internal/labels'
import { autoLayout, rankDirectionOf } from '../layout/autoLayout'
import { layerIndex } from '../model/graph'
import type { FlowConnector, FlowNode, RunStatus } from '../model/types'
import { CanvasSurface } from '../surface/CanvasSurface'
import type { CanvasApi, SurfaceNode } from '../surface/types'
import type { FlowReferenceData } from '../nodes/types'
import { focusAfter } from './focusOut'
import { anchorFor, componentForKind, sizeForNode } from './nodeBridge'

export interface FlowPreviewLabels {
  canvas: string
}

export const flowPreviewLabels = defineLabels<FlowPreviewLabels>('FlowPreview', {
  en: { canvas: 'Flow preview' },
  'pt-BR': { canvas: 'Prévia do fluxo' },
  es: { canvas: 'Vista previa del flujo' },
})
export const defaultFlowPreviewLabels: FlowPreviewLabels = flowPreviewLabels.bundles.en

/**
 * Status mark for node kinds whose card does not draw one (the generic card
 * does): glyph and word over the card, the word added to the card's
 * accessible description, and a "not run" pattern instead of opacity alone.
 */
function StatusFrame({ status, children }: { status: RunStatus; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const word = usePreviewStatusWord(status)
  useLayoutEffect(() => {
    const target = ref.current?.querySelector<HTMLElement>('[data-ty-node-focus]')
    if (!target) return
    const own = (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((t) => t && t !== id)
    target.setAttribute('aria-describedby', [...own, id].join(' '))
  })
  return (
    <div ref={ref} className="ty-flow-preview__frame" data-status={status}>
      {children}
      <PreviewStatusMark status={status} />
      <span id={id} className="ty-visually-hidden">
        {word}
      </span>
    </div>
  )
}

export interface FlowPreviewProps {
  graph: { nodes: FlowNode[]; connectors: FlowConnector[] }
  /** When given, nodes without an entry read as "not run". */
  nodeStatuses?: Record<string, RunStatus>
  selectedNodeId?: string | null
  onNodeActivate?: (nodeId: string) => void
  layout?: 'auto' | 'preserve'
  direction?: 'top-down' | 'left-right'
  /** Keep a horizontal auto layout left to right in right-to-left locales. */
  keepLtrLayout?: boolean
  /** Inside a chat bubble: no pinch and no wheel zoom, so the page keeps scrolling. */
  embedded?: boolean
  reference?: FlowReferenceData
  apiRef?: Ref<CanvasApi>
  label?: string
  labels?: Partial<FlowPreviewLabels>
  className?: string
}

/** Reading order: layer, then position across the layer. */
export function flowReadingOrder(nodes: FlowNode[], connectors: FlowConnector[], horizontal: boolean): FlowNode[] {
  const layer = layerIndex(
    nodes.map((n) => n.id),
    connectors,
  )
  return [...nodes].sort((a, b) => (layer.get(a.id) ?? 0) - (layer.get(b.id) ?? 0) || (horizontal ? a.position.y - b.position.y : a.position.x - b.position.x))
}

export function FlowPreview(props: FlowPreviewProps) {
  const { graph, nodeStatuses, selectedNodeId = null, onNodeActivate, layout = 'auto', direction = 'top-down', keepLtrLayout = false, embedded = false, reference, apiRef, className } = props
  const l = useLabels(flowPreviewLabels, props.labels)
  const catalog = useRenderCatalog()
  const { rtl } = useFlowLocale()
  const rootRef = useRef<HTMLDivElement>(null)
  const editorDirection = direction === 'left-right' ? 'right' : 'down'

  // Recomputed only when the graph (or its layout settings) change.
  const placed = useMemo(() => {
    const sized = graph.nodes.map((n) => ({ ...n, size: sizeForNode(n, 'detailed') }))
    const laid = layout === 'auto' ? autoLayout(sized, graph.connectors, rankDirectionOf(editorDirection, rtl, keepLtrLayout)) : sized
    return flowReadingOrder(laid, graph.connectors, editorDirection === 'right')
  }, [graph, layout, editorDirection, rtl, keepLtrLayout])

  const byId = useMemo(() => new Map(placed.map((n) => [n.id, n])), [placed])
  const surfaceNodes: SurfaceNode[] = placed.map((n) => ({
    id: n.id,
    rect: absoluteRect(n, byId),
    layer: n.kind === 'group' ? 0 : 1,
    fixedHeight: n.kind === 'group' || n.kind === 'note',
    selected: n.id === selectedNodeId,
    ...(n.hidden ? { hidden: true } : {}),
    tone: catalog.tone(n.kind),
  }))

  return (
    <div ref={rootRef} className={['ty-flow-preview', className].filter(Boolean).join(' ')}>
      <CanvasSurface
        label={props.label ?? l.canvas}
        nodes={surfaceNodes}
        connectors={graph.connectors}
        fitKey={placed}
        wheel={embedded ? 'none' : 'zoom'}
        pinch={!embedded}
        {...(apiRef ? { apiRef } : {})}
        portAnchor={(id, port, role) => {
          const n = byId.get(id)
          return n ? anchorFor(n, port, role, editorDirection, catalog) : 'border'
        }}
        onLeave={() => focusAfter(rootRef.current)}
        renderNode={(sn) => {
          const node = byId.get(sn.id)!
          const Card = componentForKind(node.kind)
          const status: RunStatus | undefined = nodeStatuses ? (nodeStatuses[node.id] ?? 'unknown') : undefined
          const card = (
            <Card
              node={node}
              density="detailed"
              direction={editorDirection}
              locked
              preview
              selected={node.id === selectedNodeId}
              {...(status ? { runStatus: status } : {})}
              {...(onNodeActivate ? { onConfigure: onNodeActivate } : {})}
              {...(reference ? { reference } : {})}
            />
          )
          // The generic card draws its own status mark; other kinds get the frame.
          return status && builtInNodeComponents[node.kind] ? <StatusFrame status={status}>{card}</StatusFrame> : card
        }}
      />
    </div>
  )
}
