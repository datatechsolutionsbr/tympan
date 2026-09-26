// AgentEditorDialog: create or edit a saved agent (identity, engine,
// instructions, tools). Saves by itself a moment after each genuine edit;
// opening and hydrating the form is never an edit.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Button as AriaButton,
  Disclosure,
  DisclosurePanel,
  Heading,
  Input,
  Label,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  TextField as AriaTextField,
  ToggleButton,
  ToggleButtonGroup,
} from 'react-aria-components'
import { ChevronDown, CircleAlert, CircleCheck, Clock, Loader } from 'lucide-react'
import { Button, InlineNotice, Link, NativeSelect, SegmentedControl, Switch, TextArea, TextField } from '@fakhir/ui'
import { useConfirm } from '../internal/confirm'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { SectionedModal } from '../internal/SectionedModal'
import { useActiveDialog, useDialogStack, type AgentEditorPayload } from '../state/dialogStack'
import { cleanToolServers, OutputSchemaBuilder, ToolServerListField } from '../forms'
import { AgentMark, TagInput, useValueText } from './parts'

export interface AgentModel {
  id: string
  name?: string
  family: string
  /** Position on the host's capability scale (same scale as the tiers). */
  capability: number
  contextSize?: number
  outputLimit?: number
  reasoning?: boolean
  supports?: { maxOutput?: boolean; topP?: boolean; topK?: boolean }
}

export interface AgentProvider {
  id: string
  name: string
  families: string[]
  configured: boolean
}

/** A named band of the capability scale; `temperature` is the tier's sampling default. */
export interface CapabilityTier {
  key: string
  min: number
  max: number
  temperature?: number
}

export interface AutonomyLevel {
  key: 'low' | 'medium' | 'high' | 'full'
  /** Capability rating the level jumps to. */
  rating: number
}

export type ReasoningEffort = 'low' | 'medium' | 'high' | 'very_high'

export interface ToolServerEntry {
  prefix?: string
  url?: string
  command?: string
  args?: string[]
  headers?: Record<string, string>
}

export interface AgentPayload {
  id?: string
  name: string
  description?: string
  active: boolean
  tags: string[]
  image?: string
  model?: string
  provider?: string
  temperature?: number
  reasoningEffort?: ReasoningEffort
  maxOutputTokens?: number
  topP?: number
  topK?: number
  systemPrompt?: string
  outputSchema?: Record<string, unknown>
  toolServers?: ToolServerEntry[]
}

export interface AgentEditorDialogLabels {
  createTitle: string
  editTitle: string
  sections: string
  engine: string
  instructions: string
  tools: string
  name: string
  namePlaceholder: string
  image: string
  active: string
  description: string
  tags: string
  removeTag: string
  capability: string
  tierNames: Record<string, string>
  autonomy: string
  autonomyNames: Record<AutonomyLevel['key'], string>
  model: string
  contextSize: string
  outputLimit: string
  servedVia: string
  connected: string
  needsSetup: string
  noProvider: string
  advanced: string
  manualModel: string
  maxOutput: string
  topP: string
  topK: string
  credentials: string
  manageCredentials: string
  temperature: string
  temperatureRanges: { precise: string; balanced: string; creative: string }
  reasoningEffort: string
  effortNames: Record<ReasoningEffort, string>
  systemPrompt: string
  outputSchema: string
  statusSaving: string
  statusPending: string
  statusSaved: string
  statusFailed: string
  retry: string
  unsaved: string
  confirmCloseTitle: string
  confirmCloseMessage: string
  confirmClose: string
  keepEditing: string
  untitled: string
  agentWord: string
}

const en: AgentEditorDialogLabels = {
  createTitle: 'New agent',
  editTitle: 'Agent',
  sections: 'Agent sections',
  engine: 'Engine',
  instructions: 'Instructions',
  tools: 'Tools',
  name: 'Agent name',
  namePlaceholder: 'Untitled agent',
  image: 'Image address',
  active: 'Active',
  description: 'Description',
  tags: 'Tags',
  removeTag: 'Remove tag {tag}',
  capability: 'Capability',
  tierNames: {},
  autonomy: 'Autonomy',
  autonomyNames: { low: 'Low', medium: 'Medium', high: 'High', full: 'Full' },
  model: 'Model',
  contextSize: 'Context: {size, number} tokens',
  outputLimit: 'Output up to {size, number} tokens',
  servedVia: 'Served via {provider}',
  connected: 'connected',
  needsSetup: 'needs setup',
  noProvider: 'No configured provider serves this model family.',
  advanced: 'Advanced',
  manualModel: 'Choose the model',
  maxOutput: 'Maximum output tokens',
  topP: 'Nucleus sampling (top-p)',
  topK: 'Top-k sampling',
  credentials: 'Provider credentials',
  manageCredentials: 'Manage credentials',
  temperature: 'Sampling',
  temperatureRanges: { precise: 'precise', balanced: 'balanced', creative: 'creative' },
  reasoningEffort: 'Reasoning effort',
  effortNames: { low: 'Low', medium: 'Medium', high: 'High', very_high: 'Very high' },
  systemPrompt: 'System prompt',
  outputSchema: 'Output schema',
  statusSaving: 'Saving',
  statusPending: 'Will save in a moment',
  statusSaved: 'Saved',
  statusFailed: 'Not saved',
  retry: 'Retry',
  unsaved: 'Your last change was not saved.',
  confirmCloseTitle: 'Close without saving?',
  confirmCloseMessage: 'The last change could not be saved and will be lost.',
  confirmClose: 'Close',
  keepEditing: 'Keep editing',
  untitled: 'Untitled agent',
  agentWord: 'agent',
}

export const agentEditorDialogLabels = defineLabels<AgentEditorDialogLabels>('AgentEditorDialog', {
  en,
  'pt-BR': {
    createTitle: 'Novo agente',
    editTitle: 'Agente',
    sections: 'Seções do agente',
    engine: 'Motor',
    instructions: 'Instruções',
    tools: 'Ferramentas',
    name: 'Nome do agente',
    namePlaceholder: 'Agente sem nome',
    image: 'Endereço da imagem',
    active: 'Ativo',
    description: 'Descrição',
    tags: 'Etiquetas',
    removeTag: 'Remover etiqueta {tag}',
    capability: 'Capacidade',
    tierNames: {},
    autonomy: 'Autonomia',
    autonomyNames: { low: 'Baixa', medium: 'Média', high: 'Alta', full: 'Total' },
    model: 'Modelo',
    contextSize: 'Contexto: {size, number} tokens',
    outputLimit: 'Saída de até {size, number} tokens',
    servedVia: 'Servido por {provider}',
    connected: 'conectado',
    needsSetup: 'precisa de configuração',
    noProvider: 'Nenhum provedor configurado atende esta família de modelos.',
    advanced: 'Avançado',
    manualModel: 'Escolher o modelo',
    maxOutput: 'Máximo de tokens de saída',
    topP: 'Amostragem de núcleo (top-p)',
    topK: 'Amostragem top-k',
    credentials: 'Credenciais dos provedores',
    manageCredentials: 'Gerenciar credenciais',
    temperature: 'Amostragem',
    temperatureRanges: { precise: 'precisa', balanced: 'equilibrada', creative: 'criativa' },
    reasoningEffort: 'Esforço de raciocínio',
    effortNames: { low: 'Baixo', medium: 'Médio', high: 'Alto', very_high: 'Muito alto' },
    systemPrompt: 'Prompt de sistema',
    outputSchema: 'Esquema de saída',
    statusSaving: 'Salvando',
    statusPending: 'Será salvo em instantes',
    statusSaved: 'Salvo',
    statusFailed: 'Não salvo',
    retry: 'Tentar de novo',
    unsaved: 'A última alteração não foi salva.',
    confirmCloseTitle: 'Fechar sem salvar?',
    confirmCloseMessage: 'Não foi possível salvar a última alteração; ela será perdida.',
    confirmClose: 'Fechar',
    keepEditing: 'Continuar editando',
    untitled: 'Agente sem nome',
    agentWord: 'agente',
  },
  es: {
    createTitle: 'Nuevo agente',
    editTitle: 'Agente',
    sections: 'Secciones del agente',
    engine: 'Motor',
    instructions: 'Instrucciones',
    tools: 'Herramientas',
    name: 'Nombre del agente',
    namePlaceholder: 'Agente sin nombre',
    image: 'Dirección de la imagen',
    active: 'Activo',
    description: 'Descripción',
    tags: 'Etiquetas',
    removeTag: 'Quitar la etiqueta {tag}',
    capability: 'Capacidad',
    tierNames: {},
    autonomy: 'Autonomía',
    autonomyNames: { low: 'Baja', medium: 'Media', high: 'Alta', full: 'Total' },
    model: 'Modelo',
    contextSize: 'Contexto: {size, number} tokens',
    outputLimit: 'Salida de hasta {size, number} tokens',
    servedVia: 'Servido por {provider}',
    connected: 'conectado',
    needsSetup: 'requiere configuración',
    noProvider: 'Ningún proveedor configurado sirve esta familia de modelos.',
    advanced: 'Avanzado',
    manualModel: 'Elegir el modelo',
    maxOutput: 'Máximo de tokens de salida',
    topP: 'Muestreo de núcleo (top-p)',
    topK: 'Muestreo top-k',
    credentials: 'Credenciales de los proveedores',
    manageCredentials: 'Gestionar credenciales',
    temperature: 'Muestreo',
    temperatureRanges: { precise: 'preciso', balanced: 'equilibrado', creative: 'creativo' },
    reasoningEffort: 'Esfuerzo de razonamiento',
    effortNames: { low: 'Bajo', medium: 'Medio', high: 'Alto', very_high: 'Muy alto' },
    systemPrompt: 'Prompt de sistema',
    outputSchema: 'Esquema de salida',
    statusSaving: 'Guardando',
    statusPending: 'Se guardará en un momento',
    statusSaved: 'Guardado',
    statusFailed: 'No guardado',
    retry: 'Reintentar',
    unsaved: 'El último cambio no se guardó.',
    confirmCloseTitle: '¿Cerrar sin guardar?',
    confirmCloseMessage: 'No se pudo guardar el último cambio y se perderá.',
    confirmClose: 'Cerrar',
    keepEditing: 'Seguir editando',
    untitled: 'Agente sin nombre',
    agentWord: 'agente',
  },
})
export const defaultAgentEditorDialogLabels = agentEditorDialogLabels.bundles.en

/** Even split of a 0–100 scale when the host gives no tiers (the product sets the real bands). */
export const DEFAULT_CAPABILITY_TIERS: readonly CapabilityTier[] = [
  { key: 'basic', min: 0, max: 33, temperature: 0.3 },
  { key: 'capable', min: 34, max: 66, temperature: 0.7 },
  { key: 'advanced', min: 67, max: 100, temperature: 0.9 },
]

export const DEFAULT_AUTONOMY_LEVELS: readonly AutonomyLevel[] = [
  { key: 'low', rating: 12 },
  { key: 'medium', rating: 37 },
  { key: 'high', rating: 62 },
  { key: 'full', rating: 88 },
]

/** The most capable model whose rating does not exceed `rating` (else the least capable). */
export function modelForRating(models: readonly AgentModel[], rating: number): AgentModel | undefined {
  const sorted = [...models].sort((a, b) => a.capability - b.capability)
  let pick = sorted[0]
  for (const m of sorted) if (m.capability <= rating) pick = m
  return pick
}

export function tierForRating(tiers: readonly CapabilityTier[], rating: number): CapabilityTier | undefined {
  return tiers.find((t) => rating >= t.min && rating <= t.max) ?? (rating < (tiers[0]?.min ?? 0) ? tiers[0] : tiers[tiers.length - 1])
}

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'failed'

export interface AgentEditorDialogProps {
  onPersist?: (payload: AgentPayload) => Promise<void>
  /** Legacy hook after an explicit save; autosave never calls it. */
  onSaved?: () => void
  models: AgentModel[]
  providers: AgentProvider[]
  credentialsHref: string
  tiers?: readonly CapabilityTier[]
  autonomyLevels?: readonly AutonomyLevel[]
  /** Idle time before an edit is saved (ms). */
  saveDelay?: number
  labels?: Partial<AgentEditorDialogLabels>
}

interface FormState {
  id?: string
  name: string
  description: string
  active: boolean
  tags: string[]
  image: string
  rating: number
  modelId: string
  temperature: number
  reasoningEffort: ReasoningEffort
  maxOutput: string
  topP: string
  topK: string
  systemPrompt: string
  outputSchema?: Record<string, unknown>
  toolServers: ToolServerEntry[]
}

function hydrate(agent: AgentEditorPayload['agent'], models: readonly AgentModel[], tiers: readonly CapabilityTier[]): FormState {
  const a = (agent ?? {}) as Partial<AgentPayload> & { id?: string }
  const model = models.find((m) => m.id === a.model) ?? modelForRating(models, tiers[0]?.min ?? 0)
  const rating = model?.capability ?? tiers[0]?.min ?? 0
  const num = (v: number | undefined) => (typeof v === 'number' ? String(v) : '')
  return {
    ...(a.id ? { id: a.id } : {}),
    name: a.name ?? '',
    description: a.description ?? '',
    active: a.active ?? true,
    tags: a.tags ?? [],
    image: a.image ?? '',
    rating,
    modelId: model?.id ?? '',
    temperature: a.temperature ?? tierForRating(tiers, rating)?.temperature ?? 0.7,
    reasoningEffort: a.reasoningEffort ?? 'medium',
    maxOutput: num(a.maxOutputTokens),
    topP: num(a.topP),
    topK: num(a.topK),
    systemPrompt: a.systemPrompt ?? '',
    ...(a.outputSchema ? { outputSchema: a.outputSchema } : {}),
    toolServers: a.toolServers ?? [],
  }
}

export function AgentEditorDialog(props: AgentEditorDialogProps) {
  const { onPersist, models, providers, credentialsHref, tiers = DEFAULT_CAPABILITY_TIERS, autonomyLevels = DEFAULT_AUTONOMY_LEVELS, saveDelay = 1200 } = props
  const l = useLabels(agentEditorDialogLabels, props.labels)
  const { locale, direction } = useFlowLocale()
  const active = useActiveDialog<AgentEditorPayload>('agent-editor')
  const stack = useDialogStack()
  const confirm = useConfirm()

  const [form, setForm] = useState<FormState | null>(null)
  const [mode, setMode] = useState<'create' | 'edit'>('edit')
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [section, setSection] = useState('engine')
  const formRef = useRef<FormState | null>(null)
  formRef.current = form
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef<Promise<void> | null>(null)
  const again = useRef(false)

  // Hydrate on open; never counts as an edit.
  useEffect(() => {
    if (!active) {
      setForm(null)
      return
    }
    setForm(hydrate(active.payload.agent, models, tiers))
    setMode(active.payload.mode)
    setStatus('idle')
    setSection('engine')
    // Only a new opening re-hydrates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const model = form ? models.find((m) => m.id === form.modelId) : undefined
  const provider = model ? providers.find((p) => p.families.includes(model.family)) : undefined

  const payloadOf = useCallback(
    (f: FormState): AgentPayload => {
      const m = models.find((x) => x.id === f.modelId)
      const p = m ? providers.find((x) => x.families.includes(m.family)) : undefined
      const numOrUndef = (s: string) => (s.trim() !== '' && Number.isFinite(Number(s)) ? Number(s) : undefined)
      const out: AgentPayload = { name: f.name.trim(), active: f.active, tags: f.tags }
      if (f.id) out.id = f.id
      if (f.description.trim()) out.description = f.description.trim()
      if (f.image.trim()) out.image = f.image.trim()
      if (m) out.model = m.id
      if (p) out.provider = p.id
      if (m?.reasoning) out.reasoningEffort = f.reasoningEffort
      else out.temperature = f.temperature
      const mo = numOrUndef(f.maxOutput)
      const tp = numOrUndef(f.topP)
      const tk = numOrUndef(f.topK)
      if (mo !== undefined && m?.supports?.maxOutput) out.maxOutputTokens = mo
      if (tp !== undefined && m?.supports?.topP) out.topP = tp
      if (tk !== undefined && m?.supports?.topK) out.topK = tk
      if (f.systemPrompt.trim()) out.systemPrompt = f.systemPrompt
      if (f.outputSchema) out.outputSchema = f.outputSchema
      const servers = cleanToolServers(f.toolServers) as ToolServerEntry[] | undefined
      if (servers) out.toolServers = servers
      return out
    },
    [models, providers],
  )

  const persistNow = useCallback(async (): Promise<void> => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const f = formRef.current
    if (!f || !onPersist) return
    if (inFlight.current) {
      again.current = true
      return inFlight.current
    }
    setStatus('saving')
    const run = onPersist(payloadOf(f))
      .then(() => {
        setStatus('saved')
        setMode('edit')
      })
      .catch(() => setStatus('failed'))
      .finally(() => {
        inFlight.current = null
        if (again.current) {
          again.current = false
          void persistNow()
        }
      })
    inFlight.current = run
    return run
  }, [onPersist, payloadOf])

  const edit = (patch: Partial<FormState>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev))
    setStatus('pending')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void persistNow(), saveDelay)
  }

  const close = async () => {
    if (status === 'failed') {
      const ok = await confirm({ title: l.confirmCloseTitle, message: l.confirmCloseMessage, confirmLabel: l.confirmClose, cancelLabel: l.keepEditing, tone: 'danger' })
      if (!ok) return
    } else if (timer.current || inFlight.current) {
      await persistNow()
    }
    stack.close()
  }

  const tier = form ? tierForRating(tiers, form.rating) : undefined
  const tierName = tier ? (l.tierNames[tier.key] ?? tier.key) : ''
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale])
  const capabilityRef = useRef<HTMLInputElement>(null)
  const temperatureRef = useRef<HTMLInputElement>(null)
  const temperatureRange = form ? (form.temperature < 0.4 ? l.temperatureRanges.precise : form.temperature < 1 ? l.temperatureRanges.balanced : l.temperatureRanges.creative) : ''
  useValueText(capabilityRef, form ? `${nf.format(form.rating)}, ${tierName}` : '')
  useValueText(temperatureRef, form ? `${nf.format(form.temperature)}, ${temperatureRange}` : '')
  const statusId = useId()

  if (!active || !form) return null

  const bandOf = (level: AutonomyLevel) => {
    const idx = autonomyLevels.indexOf(level)
    const next = autonomyLevels[idx + 1]
    return form.rating >= level.rating - (idx === 0 ? Infinity : 0) && (!next || form.rating < next.rating)
  }
  const currentAutonomy = autonomyLevels.find(bandOf)?.key ?? null

  const setRating = (rating: number) => {
    const m = modelForRating(models, rating)
    const t = tierForRating(tiers, rating)
    edit({ rating, modelId: m?.id ?? form.modelId, ...(t?.temperature !== undefined ? { temperature: t.temperature } : {}) })
  }

  const statusView = (
    <div className="fk-agent-editor__status" data-status={status}>
      <p id={statusId} role="status" aria-live="polite" className="fk-agent-editor__status-line">
        {status === 'saving' ? (
          <>
            <Loader aria-hidden="true" focusable="false" className="fk-agent-editor__spin" />
            {l.statusSaving}
          </>
        ) : status === 'pending' ? (
          <>
            <Clock aria-hidden="true" focusable="false" />
            {l.statusPending}
          </>
        ) : status === 'saved' ? (
          <>
            <CircleCheck aria-hidden="true" focusable="false" />
            {l.statusSaved}
          </>
        ) : status === 'failed' ? (
          <>
            <CircleAlert aria-hidden="true" focusable="false" />
            {l.statusFailed}
          </>
        ) : null}
      </p>
      {status === 'failed' ? (
        <Button size="compact" variant="secondary" onPress={() => void persistNow()}>
          {l.retry}
        </Button>
      ) : null}
    </div>
  )

  const identity = (
    <div className="fk-agent-editor__identity">
      <div className="fk-agent-editor__identity-head">
        <AgentMark image={form.image} size="lg" />
        <div className="fk-agent-editor__name-block">
          <AriaTextField className="fk-agent-editor__name" value={form.name} onChange={(name) => edit({ name })}>
            <Label className="fk-visually-hidden">{l.name}</Label>
            <Input className="fk-agent-editor__name-input" placeholder={l.namePlaceholder} />
          </AriaTextField>
          <span className="fk-agent-editor__kind-word">{l.agentWord}</span>
        </div>
      </div>
      <Switch label={l.active} isSelected={form.active} onChange={(v) => edit({ active: v })} />
      <TextField label={l.image} inputType="url" value={form.image} onChange={(image) => edit({ image })} />
      <TextArea label={l.description} value={form.description} onChange={(description) => edit({ description })} rows={2} />
      <TagInput label={l.tags} value={form.tags} onChange={(tags) => edit({ tags })} removeLabel={l.removeTag} />
    </div>
  )

  const engine = (
    <div className="fk-agent-editor__section">
      <Slider className="fk-agent-slider" minValue={0} maxValue={100} step={1} value={form.rating} onChange={(v) => setRating(Array.isArray(v) ? v[0]! : v)}>
        <div className="fk-agent-slider__head">
          <Label className="fk-agent-slider__label">{l.capability}</Label>
          <SliderOutput className="fk-agent-slider__output">{() => tierName}</SliderOutput>
        </div>
        <SliderTrack className="fk-agent-slider__track">
          {({ state }) => (
            <>
              <span className="fk-agent-slider__fill" style={{ inlineSize: `${state.getThumbPercent(0) * 100}%` }} />
              <SliderThumb className="fk-agent-slider__thumb" inputRef={capabilityRef} />
            </>
          )}
        </SliderTrack>
      </Slider>
      <div className="fk-agent-editor__autonomy">
        <p className="fk-agent-editor__label" id={`${statusId}-autonomy`}>
          {l.autonomy}
        </p>
        <ToggleButtonGroup
          className="fk-agent-autonomy"
          aria-labelledby={`${statusId}-autonomy`}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={currentAutonomy ? [currentAutonomy] : []}
          onSelectionChange={(keys) => {
            const key = [...keys][0]
            const level = autonomyLevels.find((a) => a.key === key)
            if (level) setRating(level.rating)
          }}
        >
          {autonomyLevels.map((a) => (
            <ToggleButton key={a.key} id={a.key} className="fk-agent-autonomy__level">
              {l.autonomyNames[a.key]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <dl className="fk-agent-editor__summary">
        <div>
          <dt>{l.model}</dt>
          <dd className="fk-agent-editor__mono">{model ? (model.name ?? model.id) : ''}</dd>
          {model?.contextSize ? <dd className="fk-agent-editor__meta">{fill(l.contextSize, { size: model.contextSize }, locale)}</dd> : null}
          {model?.outputLimit ? <dd className="fk-agent-editor__meta">{fill(l.outputLimit, { size: model.outputLimit }, locale)}</dd> : null}
        </div>
      </dl>
      {model && provider ? (
        <p className="fk-agent-editor__served" data-configured={provider.configured}>
          {fill(l.servedVia, { provider: provider.name })}
          <span className="fk-agent-editor__provider-state">
            {provider.configured ? <CircleCheck aria-hidden="true" focusable="false" /> : <CircleAlert aria-hidden="true" focusable="false" />}
            {provider.configured ? l.connected : l.needsSetup}
          </span>
        </p>
      ) : model ? (
        <InlineNotice tone="warning" urgency="none">
          {l.noProvider}
        </InlineNotice>
      ) : null}
      <Disclosure className="fk-agent-editor__advanced">
        <Heading level={3} className="fk-agent-editor__advanced-heading">
          <AriaButton slot="trigger" className="fk-agent-editor__advanced-trigger">
            <ChevronDown aria-hidden="true" focusable="false" className="fk-agent-editor__chevron" />
            {l.advanced}
          </AriaButton>
        </Heading>
        <DisclosurePanel className="fk-agent-editor__advanced-panel">
          <NativeSelect
            label={l.manualModel}
            value={form.modelId}
            options={models.map((m) => ({ value: m.id, label: m.name ?? m.id }))}
            onChange={(id) => {
              const m = models.find((x) => x.id === id)
              edit({ modelId: id, ...(m ? { rating: m.capability } : {}) })
            }}
          />
          {model?.supports?.maxOutput ? <TextField label={l.maxOutput} inputType="number" value={form.maxOutput} onChange={(maxOutput) => edit({ maxOutput })} /> : null}
          {model?.supports?.topP ? <TextField label={l.topP} inputType="number" value={form.topP} onChange={(topP) => edit({ topP })} /> : null}
          {model?.supports?.topK ? <TextField label={l.topK} inputType="number" value={form.topK} onChange={(topK) => edit({ topK })} /> : null}
          <div className="fk-agent-editor__credentials">
            <p className="fk-agent-editor__label">{l.credentials}</p>
            <ul className="fk-agent-editor__credential-list">
              {providers.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <span className="fk-agent-editor__provider-state">
                    {p.configured ? <CircleCheck aria-hidden="true" focusable="false" /> : <CircleAlert aria-hidden="true" focusable="false" />}
                    {p.configured ? l.connected : l.needsSetup}
                  </span>
                </li>
              ))}
            </ul>
            <Link href={credentialsHref}>{l.manageCredentials}</Link>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  )

  const effortKeys: ReasoningEffort[] = ['low', 'medium', 'high', 'very_high']
  const instructions = (
    <div className="fk-agent-editor__section">
      {model?.reasoning ? (
        <SegmentedControl
          label={l.reasoningEffort}
          options={effortKeys.map((k) => ({ value: k, label: l.effortNames[k] }))}
          value={form.reasoningEffort}
          onChange={(v) => edit({ reasoningEffort: v as ReasoningEffort })}
        />
      ) : (
        <Slider className="fk-agent-slider" minValue={0} maxValue={2} step={0.1} value={form.temperature} onChange={(v) => edit({ temperature: Array.isArray(v) ? v[0]! : v })}>
          <div className="fk-agent-slider__head">
            <Label className="fk-agent-slider__label">{l.temperature}</Label>
            <SliderOutput className="fk-agent-slider__output">{() => temperatureRange}</SliderOutput>
          </div>
          <SliderTrack className="fk-agent-slider__track">
            {({ state }) => (
              <>
                <span className="fk-agent-slider__fill" style={{ inlineSize: `${state.getThumbPercent(0) * 100}%` }} />
                <SliderThumb className="fk-agent-slider__thumb" inputRef={temperatureRef} />
              </>
            )}
          </SliderTrack>
        </Slider>
      )}
      <TextArea label={l.systemPrompt} value={form.systemPrompt} onChange={(systemPrompt) => edit({ systemPrompt })} rows={6} autoGrow />
      <div className="fk-agent-editor__schema">
        <p className="fk-agent-editor__label">{l.outputSchema}</p>
        <OutputSchemaBuilder value={form.outputSchema} onChange={(outputSchema: Record<string, unknown> | undefined) => edit(outputSchema ? { outputSchema } : { outputSchema: undefined })} />
      </div>
    </div>
  )

  const tools = (
    <div className="fk-agent-editor__section">
      <ToolServerListField value={form.toolServers} onChange={(toolServers: ToolServerEntry[]) => edit({ toolServers })} />
    </div>
  )

  return (
    <SectionedModal
      isOpen
      onOpenChange={(open) => {
        if (!open) void close()
      }}
      title={mode === 'create' ? l.createTitle : form.name.trim() || l.editTitle}
      eyebrow={l.agentWord}
      icon={<AgentMark image={null} size="sm" />}
      width="xwide"
      className="fk-agent-editor"
      sections={[
        { id: 'engine', label: l.engine, content: engine },
        { id: 'instructions', label: l.instructions, content: instructions },
        { id: 'tools', label: l.tools, content: tools },
      ]}
      railLabel={l.sections}
      activeSection={section}
      onActiveSectionChange={setSection}
      railHeader={<div dir={direction}>{identity}</div>}
      railFooter={
        <div dir={direction}>
          {statusView}
          {status === 'failed' ? (
            <InlineNotice tone="warning" urgency="polite">
              {l.unsaved}
            </InlineNotice>
          ) : null}
        </div>
      }
    />
  )
}
