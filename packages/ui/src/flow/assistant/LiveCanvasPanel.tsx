// The live canvas beside the dialogue: the newest flow the assistant built or
// opened. A complementary landmark on wide screens, a full-screen drawer on
// narrow ones. The body is the host's editor mount, or a read-only preview.

import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button, Drawer } from '../../index'
import { FlowPreview } from '../editor/FlowPreview'
import { fill } from '../internal/labels'
import type { FlowConnector, FlowNode } from '../model/types'
import type { AssistantLabels } from './AssistantConversation'
import type { FlowArtifact } from './useAssistantSession'

function previewGraph(graph: Record<string, unknown>): { nodes: FlowNode[]; connectors: FlowConnector[] } {
  const nodes = Array.isArray(graph.nodes) ? (graph.nodes as FlowNode[]) : []
  const connectors = Array.isArray(graph.connectors) ? (graph.connectors as FlowConnector[]) : Array.isArray(graph.edges) ? (graph.edges as FlowConnector[]) : []
  return { nodes, connectors }
}

export interface LiveCanvasPanelProps {
  artifact: FlowArtifact
  docked: boolean
  labels: AssistantLabels
  locale: string
  render?: (artifact: FlowArtifact) => ReactNode
  onClose: () => void
}

export function LiveCanvasPanel({ artifact, docked, labels: l, locale, render, onClose }: LiveCanvasPanelProps) {
  const body = <div className="ty-convo-canvas__body">{render ? render(artifact) : <FlowPreview graph={previewGraph(artifact.graph)} />}</div>
  if (!docked) {
    return (
      <Drawer open onOpenChange={(open) => (open ? undefined : onClose())} title={l.liveCanvas} placement="bottom" maxHeight="100dvh">
        {body}
      </Drawer>
    )
  }
  return (
    <aside className="ty-convo-canvas" aria-label={l.liveCanvas}>
      <header className="ty-convo-canvas__header">
        <h2 className="ty-convo-canvas__title">{l.liveCanvas}</h2>
        {artifact.flowId ? (
          <code className="ty-convo-canvas__id" title={artifact.flowId}>
            {fill(l.flowId, { id: artifact.flowId.slice(0, 8) }, locale)}
          </code>
        ) : null}
        <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={l.closeCanvas} leadingIcon={<X />} onPress={onClose} />
      </header>
      {body}
    </aside>
  )
}
