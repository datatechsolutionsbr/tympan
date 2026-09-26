// AgentNodeForm: an agent step references a saved agent and holds only the
// per-run user prompt; every other agent setting lives on the saved agent.

import { useEffect, useState } from 'react'
import { ActorChip, InlineNotice, Link, ListboxSelect, Spinner, TextArea } from '@datatechsolutions/tympan'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { NodeFormFooter } from './NodeFormFooter'

export interface SavedAgentSummary {
  id: string
  name: string
  model?: string
}

export interface AgentNodeConfigValue {
  agentRef?: string
  /** Older name of the reference; read as agentRef. */
  agentId?: string
  userPrompt?: string
  [legacy: string]: unknown
}

export interface AgentNodeFormLabels {
  picker: string
  placeholder: string
  loading: string
  loadError: string
  legacy: string
  legacyHint: string
  model: string
  newAgent: string
  manageAgents: string
  prompt: string
  promptHint: string
  save: string
  cancel: string
}

export const agentNodeFormLabels = defineLabels<AgentNodeFormLabels>('AgentNodeForm', {
  en: {
    picker: 'Saved agent',
    placeholder: 'Choose a saved agent',
    loading: 'Loading saved agents',
    loadError: 'Saved agents could not be loaded: {message}',
    legacy: 'This step still carries its own model settings. Choose a saved agent; saving will keep only the reference and the prompt.',
    legacyHint: 'Choosing a saved agent replaces the settings stored on this step.',
    model: 'Model',
    newAgent: 'New agent',
    manageAgents: 'Manage agents',
    prompt: 'User prompt',
    promptHint: 'You can refer to earlier steps, for example {example}.',
    save: 'Save',
    cancel: 'Cancel',
  },
  'pt-BR': {
    picker: 'Agente salvo',
    placeholder: 'Escolha um agente salvo',
    loading: 'Carregando agentes salvos',
    loadError: 'Não foi possível carregar os agentes salvos: {message}',
    legacy: 'Esta etapa ainda guarda configurações próprias de modelo. Escolha um agente salvo; ao salvar, ficam só a referência e o prompt.',
    legacyHint: 'Escolher um agente salvo substitui as configurações guardadas nesta etapa.',
    model: 'Modelo',
    newAgent: 'Novo agente',
    manageAgents: 'Gerenciar agentes',
    prompt: 'Prompt do usuário',
    promptHint: 'Você pode citar etapas anteriores, por exemplo {example}.',
    save: 'Salvar',
    cancel: 'Cancelar',
  },
  es: {
    picker: 'Agente guardado',
    placeholder: 'Elija un agente guardado',
    loading: 'Cargando agentes guardados',
    loadError: 'No se pudieron cargar los agentes guardados: {message}',
    legacy: 'Este paso aún guarda su propia configuración de modelo. Elija un agente guardado; al guardar solo quedan la referencia y el prompt.',
    legacyHint: 'Elegir un agente guardado reemplaza la configuración de este paso.',
    model: 'Modelo',
    newAgent: 'Nuevo agente',
    manageAgents: 'Administrar agentes',
    prompt: 'Prompt del usuario',
    promptHint: 'Puede citar pasos anteriores, por ejemplo {example}.',
    save: 'Guardar',
    cancel: 'Cancelar',
  },
})

export const defaultAgentNodeFormLabels: AgentNodeFormLabels = agentNodeFormLabels.bundles.en

export interface AgentNodeFormProps {
  config: AgentNodeConfigValue
  onSave: (config: { kind: 'agent'; agentRef?: string; userPrompt?: string }) => void
  onCancel: () => void
  /** Pre-loaded agents; when given, nothing is loaded. */
  agents?: SavedAgentSummary[]
  loadAgents?: () => Promise<SavedAgentSummary[]>
  /** Where "New agent" / "Manage agents" go, through the router adapter. */
  agentsHref: string
  labels?: Partial<AgentNodeFormLabels>
}

/** Keys that meant "inline agent settings" in older flows. */
const INLINE_KEYS = ['model', 'provider', 'systemPrompt', 'temperature', 'topP', 'maxTokens', 'modelId']

type Load = { state: 'idle' | 'loading' | 'ready' | 'error'; agents: SavedAgentSummary[]; message?: string }

export function AgentNodeForm({ config, onSave, onCancel, agents, loadAgents, agentsHref, labels }: AgentNodeFormProps) {
  const l = useLabels(agentNodeFormLabels, labels)
  const { locale } = useFlowLocale()
  const [agentRef, setAgentRef] = useState<string | undefined>(config.agentRef ?? config.agentId)
  const [prompt, setPrompt] = useState(config.userPrompt ?? '')
  const [load, setLoad] = useState<Load>(() => (agents ? { state: 'ready', agents } : { state: loadAgents ? 'loading' : 'ready', agents: [] }))

  useEffect(() => {
    if (agents) {
      setLoad({ state: 'ready', agents })
      return
    }
    if (!loadAgents) return
    let live = true
    setLoad({ state: 'loading', agents: [] })
    loadAgents().then(
      (list) => live && setLoad({ state: 'ready', agents: list }),
      (err: unknown) => live && setLoad({ state: 'error', agents: [], message: err instanceof Error ? err.message : String(err) }),
    )
    // A late answer after unmount or new inputs is ignored.
    return () => {
      live = false
    }
  }, [agents, loadAgents])

  const legacy = !(config.agentRef ?? config.agentId) && INLINE_KEYS.some((k) => config[k] !== undefined)
  const chosen = load.agents.find((a) => a.id === agentRef)

  const save = () => {
    const p = prompt.trim()
    onSave({ kind: 'agent', ...(agentRef ? { agentRef } : {}), ...(p ? { userPrompt: prompt } : {}) })
  }

  return (
    <div className="ty-node-form ty-agent-form">
      {legacy ? (
        <InlineNotice tone="warning" urgency="none">
          {l.legacy}
        </InlineNotice>
      ) : null}
      {load.state === 'error' ? <InlineNotice tone="danger">{fill(l.loadError, { message: load.message ?? '' }, locale)}</InlineNotice> : null}
      {load.state === 'loading' ? (
        <p className="ty-agent-form__loading" role="status">
          <Spinner size="small" label={l.loading} />
          <span aria-hidden="true">{l.loading}</span>
        </p>
      ) : (
        <ListboxSelect
          label={l.picker}
          placeholder={l.placeholder}
          options={load.agents.map((a) => ({ value: a.id, label: a.name, ...(a.model ? { description: a.model } : {}) }))}
          value={agentRef ?? null}
          onChange={setAgentRef}
          {...(legacy ? { hint: l.legacyHint } : {})}
        />
      )}
      {chosen ? (
        <div className="ty-agent-form__summary">
          {/* ActorChip shows the model identifier in mono (§2.11). */}
          <ActorChip kind="agent" name={chosen.name} {...(chosen.model ? { model: chosen.model } : {})} />
        </div>
      ) : null}
      {load.state !== 'loading' ? (
        <Link href={agentsHref} standalone>
          {load.agents.length ? l.manageAgents : l.newAgent}
        </Link>
      ) : null}
      <TextArea label={l.prompt} hint={fill(l.promptHint, { example: '{{source.text}}' }, locale)} rows={4} autoGrow maxRows={12} value={prompt} onChange={setPrompt} />
      <NodeFormFooter onSave={save} onCancel={onCancel} labels={{ save: l.save, cancel: l.cancel }} />
    </div>
  )
}
