// AgentNode: a configured AI agent placed in a flow: name, role and model
// family (full model id on focus or hover). The body is shared with agent
// galleries outside the canvas (AgentCardBody).

import type { ReactNode } from 'react'
import { Focusable, Tooltip, TooltipTrigger } from 'react-aria-components'
import { Bot } from 'lucide-react'
import { defineLabels, fill, useLabels } from '../internal/labels'
import type { FlowNode, LayoutDirection } from '../model/types'
import { AgentMark } from './AgentIdentity'
import { ConnectionPorts } from './ConnectionPorts'
import { GraphNodeCard, type CardDensity } from './GraphNodeCard'
import { useKindPresentation } from './nodeChrome'
import { NodeRunIndicator, useRunWords } from './NodeRunIndicator'
import type { AgentSummary } from './types'

export interface AgentNodeLabels {
  kind: string
  name: string
  nameWithRole: string
  remove: string
  notFound: string
  model: string
  agentWord: string
}

export const agentNodeLabels = defineLabels<AgentNodeLabels>('agentNode', {
  en: {
    kind: 'agent',
    name: 'agent: {name}',
    nameWithRole: 'agent: {name}, {role}',
    remove: 'Remove {title} from canvas',
    notFound: 'Agent not found. It may have been deleted.',
    model: 'model {model}',
    agentWord: 'agent',
  },
  'pt-BR': {
    kind: 'agente',
    name: 'agente: {name}',
    nameWithRole: 'agente: {name}, {role}',
    remove: 'Remover {title} do canvas',
    notFound: 'Agente não encontrado. Ele pode ter sido excluído.',
    model: 'modelo {model}',
    agentWord: 'agente',
  },
  es: {
    kind: 'agente',
    name: 'agente: {name}',
    nameWithRole: 'agente: {name}, {role}',
    remove: 'Quitar {title} del lienzo',
    notFound: 'Agente no encontrado. Puede haber sido eliminado.',
    model: 'modelo {model}',
    agentWord: 'agente',
  },
})
export const defaultAgentNodeLabels = agentNodeLabels.bundles.en

/** Family shown on the mark: the explicit provider, else the id's first segment. */
export function modelFamily(modelId: string, provider?: string): string {
  if (provider) return provider
  const head = modelId.split(/[/:]/)[0] ?? modelId
  return head.split(/[-_.]/)[0] || head
}

/** Model family as text; the full id on focus or hover (no brand logos). */
export function ModelMark({ modelId, provider, labels }: { modelId: string; provider?: string; labels?: Partial<AgentNodeLabels> }) {
  const l = useLabels(agentNodeLabels, labels)
  return (
    <TooltipTrigger delay={300}>
      <Focusable>
        <span className="ty-model-mark" role="img" aria-label={fill(l.model, { model: modelId })} tabIndex={0} data-ty-above="" data-ty-no-drag="">
          {modelFamily(modelId, provider)}
        </span>
      </Focusable>
      <Tooltip className="ty-model-mark__tooltip" offset={6}>
        {modelId}
      </Tooltip>
    </TooltipTrigger>
  )
}

/** Agent card body shared with galleries: mark, name, role, the word "agent", model. */
export function AgentCardBody({ agent, density = 'detailed', actions, labels }: { agent: AgentSummary; density?: CardDensity; actions?: ReactNode; labels?: Partial<AgentNodeLabels> }) {
  const l = useLabels(agentNodeLabels, labels)
  return (
    <div className="ty-agent-body" data-density={density}>
      <AgentMark name={agent.name} image={agent.avatar ?? null} fallback="generated" />
      <div className="ty-agent-body__text">
        <span className="ty-agent-body__line">
          <span className="ty-agent-body__kind">{l.agentWord}</span>
          {agent.modelId ? <ModelMark modelId={agent.modelId} {...(agent.provider ? { provider: agent.provider } : {})} labels={labels} /> : null}
        </span>
        {density === 'detailed' && agent.role ? <span className="ty-agent-body__role">{agent.role}</span> : null}
      </div>
      {actions ? <div className="ty-agent-body__actions">{actions}</div> : null}
    </div>
  )
}

export interface AgentNodeProps {
  id: string
  agent: AgentSummary | null
  /** Title when the agent is missing. */
  label?: string
  density?: CardDensity
  onOpen?: () => void
  onRemove?: (id: string) => void
  /** Extra header actions (gallery use). */
  actions?: ReactNode
  selected?: boolean
  locked?: boolean
  preview?: boolean
  direction?: LayoutDirection
  labels?: Partial<AgentNodeLabels>
}

export function AgentNode(props: AgentNodeProps) {
  const { id, agent, label, density = 'detailed', onOpen, onRemove, actions, selected = false, locked = false, preview = false, direction = 'right' } = props
  const l = useLabels(agentNodeLabels, props.labels)
  const node: FlowNode = { id, kind: 'agent', position: { x: 0, y: 0 }, data: {} }
  const k = useKindPresentation(node, direction)
  const run = useRunWords(id)
  const title = agent?.name ?? label ?? l.kind
  const name = agent ? (agent.role ? fill(l.nameWithRole, { name: agent.name, role: agent.role }) : fill(l.name, { name: agent.name })) : undefined
  const canEdit = !preview && !locked
  return (
    <GraphNodeCard
      kind="agent"
      kindLabel={l.kind}
      title={title}
      icon={<Bot />}
      tone={k.tone}
      width="wide"
      density={density}
      selected={selected}
      locked={locked}
      runState={run.runState}
      problem={agent ? false : l.notFound}
      {...(name ? { accessibleName: run.words ? `${name}, ${run.words}` : name } : {})}
      {...(run.words && !name ? { stateWords: [run.words] } : {})}
      {...(onOpen && (canEdit || preview) ? { onActivate: onOpen } : {})}
      {...(onRemove && canEdit ? { onDelete: () => onRemove(id) } : {})}
      labels={{ remove: l.remove }}
      headerActions={actions}
      meta={agent ? <AgentCardBody agent={agent} density={density} labels={props.labels} /> : undefined}
      className="ty-flow-node"
    >
      <ConnectionPorts nodeId={id} nodeLabel={title} inputs={k.inputs} outputs={k.outputs} tone={k.tone} preview={preview} />
      <NodeRunIndicator nodeId={id} kind="agent" nodeLabel={title} />
    </GraphNodeCard>
  )
}
