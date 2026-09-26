// AgentCreationWizard: a full-page, five-step flow for a new agent (starting
// point, identity, model, behaviour, review). The active step is mirrored to
// the host (address bar) through onStepChange; the host's initialStep moves
// the wizard back and forward.

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Bot, ChartColumn, FileSearch, Quote, Scale, Sparkles } from 'lucide-react'
import { Button, InlineNotice, NativeSelect, TextArea, TextField } from '@fakhir/design-system'
import { useConfirm, type ConfirmFn } from '../internal/confirm'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { AgentMark, ChoiceTiles, StepList, TagInput } from './parts'

export interface WizardModel {
  id: string
  name?: string
}

export interface WizardConnection {
  id: string
  name: string
  provider?: string
}

export interface AgentPreset {
  id: string
  name: string
  role: string
  systemPrompt?: string
  temperature?: number
  topP?: number
  maxOutputTokens?: number
  framework?: string
}

export type AgentDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface NewAgentInput {
  name: string
  role?: string
  description?: string
  avatar?: string
  connectionId?: string
  framework?: string
  model?: string
  outputSchema?: string
  systemPrompt?: string
  userPrompt?: string
  temperature?: number
  topP?: number
  topK?: number
  maxOutputTokens?: number
  difficulty?: AgentDifficulty
  tags?: string[]
}

export interface AgentCreationWizardLabels {
  steps: string
  stepCounter: string
  completed: string
  titles: { start: string; identity: string; model: string; behaviour: string; review: string }
  subtitles: { start: string; identity: string; model: string; behaviour: string; review: string }
  custom: string
  customDetail: string
  presets: string
  avatar: string
  avatarNames: Record<string, string>
  name: string
  nameRequired: string
  role: string
  description: string
  connection: string
  noConnection: string
  framework: string
  model: string
  noModels: string
  modelField: string
  outputSchema: string
  systemPrompt: string
  userPrompt: string
  temperature: string
  topP: string
  topK: string
  maxOutput: string
  difficulty: string
  difficultyNames: Record<AgentDifficulty, string>
  tags: string
  removeTag: string
  edit: string
  editGroup: string
  notSet: string
  cancel: string
  back: string
  next: string
  create: string
  creating: string
  failed: string
  untitled: string
  confirmCancelTitle: string
  confirmCancelMessage: string
  confirmCancel: string
  keepEditing: string
}

const en: AgentCreationWizardLabels = {
  steps: 'Steps',
  stepCounter: 'Step {n, number} of {total, number}',
  completed: 'completed',
  titles: { start: 'Starting point', identity: 'Identity', model: 'Model', behaviour: 'Behaviour and metadata', review: 'Review' },
  subtitles: {
    start: 'Start from a preset or from scratch.',
    identity: 'How the agent appears to people.',
    model: 'Which connection and model the agent runs on.',
    behaviour: 'Instructions, sampling and tags.',
    review: 'Check everything before creating the agent.',
  },
  custom: 'Custom',
  customDetail: 'Start from scratch',
  presets: 'Starting point',
  avatar: 'Mark',
  avatarNames: { bot: 'Assistant', search: 'Researcher', quote: 'Coder', scale: 'Reviewer', chart: 'Analyst', sparkles: 'Writer' },
  name: 'Name',
  nameRequired: 'Give the agent a name.',
  role: 'Role',
  description: 'Description',
  connection: 'Provider connection',
  noConnection: 'Choose a connection',
  framework: 'Agent framework',
  model: 'Model',
  noModels: 'No model available',
  modelField: 'Model identifier',
  outputSchema: 'Output schema (structured text)',
  systemPrompt: 'System prompt',
  userPrompt: 'User prompt',
  temperature: 'Temperature',
  topP: 'Nucleus sampling (top-p)',
  topK: 'Top-k sampling',
  maxOutput: 'Maximum output tokens',
  difficulty: 'Difficulty',
  difficultyNames: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' },
  tags: 'Tags',
  removeTag: 'Remove tag {tag}',
  edit: 'Edit',
  editGroup: 'Edit {group}',
  notSet: 'not set',
  cancel: 'Cancel',
  back: 'Back',
  next: 'Next',
  create: 'Create agent',
  creating: 'Creating',
  failed: 'The agent could not be created.',
  untitled: 'Untitled agent',
  confirmCancelTitle: 'Discard this agent?',
  confirmCancelMessage: 'What you entered will be lost.',
  confirmCancel: 'Discard',
  keepEditing: 'Keep editing',
}

export const agentCreationWizardLabels = defineLabels<AgentCreationWizardLabels>('AgentCreationWizard', {
  en,
  'pt-BR': {
    steps: 'Etapas',
    stepCounter: 'Etapa {n, number} de {total, number}',
    completed: 'concluída',
    titles: { start: 'Ponto de partida', identity: 'Identidade', model: 'Modelo', behaviour: 'Comportamento e metadados', review: 'Revisão' },
    subtitles: {
      start: 'Comece de um modelo pronto ou do zero.',
      identity: 'Como o agente aparece para as pessoas.',
      model: 'Em qual conexão e modelo o agente roda.',
      behaviour: 'Instruções, amostragem e etiquetas.',
      review: 'Confira tudo antes de criar o agente.',
    },
    custom: 'Personalizado',
    customDetail: 'Começar do zero',
    presets: 'Ponto de partida',
    avatar: 'Marca',
    avatarNames: { bot: 'Assistente', search: 'Pesquisador', quote: 'Codificador', scale: 'Revisor', chart: 'Analista', sparkles: 'Redator' },
    name: 'Nome',
    nameRequired: 'Dê um nome ao agente.',
    role: 'Papel',
    description: 'Descrição',
    connection: 'Conexão com o provedor',
    noConnection: 'Escolha uma conexão',
    framework: 'Framework do agente',
    model: 'Modelo',
    noModels: 'Nenhum modelo disponível',
    modelField: 'Identificador do modelo',
    outputSchema: 'Esquema de saída (texto estruturado)',
    systemPrompt: 'Prompt de sistema',
    userPrompt: 'Prompt do usuário',
    temperature: 'Temperatura',
    topP: 'Amostragem de núcleo (top-p)',
    topK: 'Amostragem top-k',
    maxOutput: 'Máximo de tokens de saída',
    difficulty: 'Dificuldade',
    difficultyNames: { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado', expert: 'Especialista' },
    tags: 'Etiquetas',
    removeTag: 'Remover etiqueta {tag}',
    edit: 'Editar',
    editGroup: 'Editar {group}',
    notSet: 'não definido',
    cancel: 'Cancelar',
    back: 'Voltar',
    next: 'Avançar',
    create: 'Criar agente',
    creating: 'Criando',
    failed: 'Não foi possível criar o agente.',
    untitled: 'Agente sem nome',
    confirmCancelTitle: 'Descartar este agente?',
    confirmCancelMessage: 'O que você preencheu será perdido.',
    confirmCancel: 'Descartar',
    keepEditing: 'Continuar editando',
  },
  es: {
    steps: 'Pasos',
    stepCounter: 'Paso {n, number} de {total, number}',
    completed: 'completado',
    titles: { start: 'Punto de partida', identity: 'Identidad', model: 'Modelo', behaviour: 'Comportamiento y metadatos', review: 'Revisión' },
    subtitles: {
      start: 'Empiece desde una plantilla o desde cero.',
      identity: 'Cómo ven las personas al agente.',
      model: 'En qué conexión y modelo funciona el agente.',
      behaviour: 'Instrucciones, muestreo y etiquetas.',
      review: 'Revise todo antes de crear el agente.',
    },
    custom: 'Personalizado',
    customDetail: 'Empezar desde cero',
    presets: 'Punto de partida',
    avatar: 'Marca',
    avatarNames: { bot: 'Asistente', search: 'Investigador', quote: 'Codificador', scale: 'Revisor', chart: 'Analista', sparkles: 'Redactor' },
    name: 'Nombre',
    nameRequired: 'Dé un nombre al agente.',
    role: 'Rol',
    description: 'Descripción',
    connection: 'Conexión con el proveedor',
    noConnection: 'Elija una conexión',
    framework: 'Marco del agente',
    model: 'Modelo',
    noModels: 'No hay modelos disponibles',
    modelField: 'Identificador del modelo',
    outputSchema: 'Esquema de salida (texto estructurado)',
    systemPrompt: 'Prompt de sistema',
    userPrompt: 'Prompt de usuario',
    temperature: 'Temperatura',
    topP: 'Muestreo de núcleo (top-p)',
    topK: 'Muestreo top-k',
    maxOutput: 'Máximo de tokens de salida',
    difficulty: 'Dificultad',
    difficultyNames: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', expert: 'Experto' },
    tags: 'Etiquetas',
    removeTag: 'Quitar etiqueta {tag}',
    edit: 'Editar',
    editGroup: 'Editar {group}',
    notSet: 'sin definir',
    cancel: 'Cancelar',
    back: 'Atrás',
    next: 'Siguiente',
    create: 'Crear agente',
    creating: 'Creando',
    failed: 'No se pudo crear el agente.',
    untitled: 'Agente sin nombre',
    confirmCancelTitle: '¿Descartar este agente?',
    confirmCancelMessage: 'Se perderá lo que ha escrito.',
    confirmCancel: 'Descartar',
    keepEditing: 'Seguir editando',
  },
})

export const defaultAgentCreationWizardLabels = agentCreationWizardLabels.bundles.en

export interface AgentCreationWizardProps {
  labels?: Partial<AgentCreationWizardLabels>
  models: WizardModel[]
  /** Empty array: the host has no credential system; the model is typed inline. */
  connections: WizardConnection[]
  presets?: AgentPreset[]
  frameworks?: Array<{ id: string; label: string }>
  initialStep?: number
  onStepChange?: (step: number) => void
  onSubmit: (input: NewAgentInput) => Promise<void>
  onCancel: () => void
  /** Confirmation service (defaults to the nearest ConfirmProvider). */
  confirm?: ConfirmFn
}

const STEP_KEYS = ['start', 'identity', 'model', 'behaviour', 'review'] as const
const TOTAL = STEP_KEYS.length
const AVATARS = [
  { key: 'bot', icon: Bot },
  { key: 'search', icon: FileSearch },
  { key: 'quote', icon: Quote },
  { key: 'scale', icon: Scale },
  { key: 'chart', icon: ChartColumn },
  { key: 'sparkles', icon: Sparkles },
] as const
const DIFFICULTIES: AgentDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert']
const CUSTOM = '__custom__'

const clampStep = (n: number | undefined) => Math.min(TOTAL, Math.max(1, Math.round(Number.isFinite(n) ? (n as number) : 1)))

interface Draft {
  preset: string
  avatar: string
  name: string
  role: string
  description: string
  connectionId: string
  framework: string
  model: string
  outputSchema: string
  systemPrompt: string
  userPrompt: string
  temperature: string
  topP: string
  topK: string
  maxOutput: string
  difficulty: AgentDifficulty
  tags: string[]
}

function isTextEntry(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || el.closest('input, textarea, select, button, [role="button"], [role="radio"], a') !== null
}

export function AgentCreationWizard(props: AgentCreationWizardProps) {
  const { models, connections, presets = [], frameworks = [], onStepChange, onSubmit, onCancel } = props
  const l = useLabels(agentCreationWizardLabels, props.labels)
  const { locale } = useFlowLocale()
  const contextConfirm = useConfirm()
  const confirm = props.confirm ?? contextConfirm
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)
  const nameId = useId()

  const [step, setStep] = useState(() => clampStep(props.initialStep))
  const [reached, setReached] = useState(step)
  const [touched, setTouched] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [d, setD] = useState<Draft>(() => ({
    preset: CUSTOM,
    avatar: 'bot',
    name: '',
    role: '',
    description: '',
    connectionId: connections[0]?.id ?? '',
    framework: frameworks[0]?.id ?? '',
    model: models[0]?.id ?? '',
    outputSchema: '',
    systemPrompt: '',
    userPrompt: '',
    temperature: '',
    topP: '',
    topK: '',
    maxOutput: '',
    difficulty: 'beginner',
    tags: [],
  }))

  // Host navigation (back/forward) moves the wizard.
  useEffect(() => {
    if (props.initialStep === undefined) return
    setStep(clampStep(props.initialStep))
  }, [props.initialStep])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  const go = (n: number) => {
    const next = clampStep(n)
    setStep(next)
    setReached((r) => Math.max(r, next))
    onStepChange?.(next)
  }

  const edit = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setTouched(true)
    setD((prev) => ({ ...prev, [key]: value }))
    if (key === 'name' && String(value).trim()) setNameError(false)
  }

  const choosePreset = (id: string) => {
    setTouched(true)
    const p = presets.find((x) => x.id === id)
    setD((prev) =>
      p
        ? {
            ...prev,
            preset: id,
            name: p.name,
            role: p.role,
            systemPrompt: p.systemPrompt ?? prev.systemPrompt,
            temperature: p.temperature !== undefined ? String(p.temperature) : prev.temperature,
            topP: p.topP !== undefined ? String(p.topP) : prev.topP,
            maxOutput: p.maxOutputTokens !== undefined ? String(p.maxOutputTokens) : prev.maxOutput,
            framework: p.framework ?? prev.framework,
          }
        : { ...prev, preset: CUSTOM },
    )
  }

  const next = () => {
    if (step === 2 && !d.name.trim()) {
      setNameError(true)
      return
    }
    go(step + 1)
  }

  const input = (): NewAgentInput => {
    const preset = presets.find((p) => p.id === d.preset)
    const num = (s: string) => (s.trim() !== '' && Number.isFinite(Number(s)) ? Number(s) : undefined)
    const out: NewAgentInput = { name: d.name.trim() || preset?.name || l.untitled }
    const text: Array<[keyof NewAgentInput, string]> = [
      ['role', d.role],
      ['description', d.description],
      ['connectionId', d.connectionId],
      ['framework', d.framework],
      ['model', d.model],
      ['outputSchema', d.outputSchema],
      ['systemPrompt', d.systemPrompt],
      ['userPrompt', d.userPrompt],
    ]
    for (const [k, v] of text) if (v.trim()) (out as unknown as Record<string, unknown>)[k] = v.trim()
    out.avatar = d.avatar
    const nums: Array<[keyof NewAgentInput, string]> = [
      ['temperature', d.temperature],
      ['topP', d.topP],
      ['topK', d.topK],
      ['maxOutputTokens', d.maxOutput],
    ]
    for (const [k, v] of nums) {
      const n = num(v)
      if (n !== undefined) (out as unknown as Record<string, unknown>)[k] = n
    }
    out.difficulty = d.difficulty
    if (d.tags.length) out.tags = d.tags
    return out
  }

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSubmit(input())
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : l.failed)
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    if (!touched) {
      onCancel()
      return
    }
    const ok = await confirm({ title: l.confirmCancelTitle, message: l.confirmCancelMessage, confirmLabel: l.confirmCancel, cancelLabel: l.keepEditing, tone: 'danger' })
    if (ok) onCancel()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented) return
    if (e.key === 'Escape') {
      e.preventDefault()
      void cancel()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && step === TOTAL) {
      e.preventDefault()
      void create()
    } else if (e.key === 'Enter' && !e.shiftKey && !isTextEntry(e.target)) {
      e.preventDefault()
      if (step === TOTAL) void create()
      else next()
    }
  }

  const key = STEP_KEYS[step - 1]!
  const stepNames = STEP_KEYS.map((k) => l.titles[k])
  const presetTiles = useMemo(
    () => [...presets.map((p) => ({ value: p.id, title: p.name, detail: p.role })), { value: CUSTOM, title: l.custom, detail: l.customDetail }],
    [presets, l.custom, l.customDetail],
  )
  const modelName = (id: string) => models.find((m) => m.id === id)?.name ?? id
  const shown = (v: string | undefined) => (v && v.trim() ? v : l.notSet)

  return (
    <div className="fk-agent-wizard" onKeyDown={onKeyDown}>
      <header className="fk-agent-wizard__header">
        <p className="fk-agent-wizard__counter">{fill(l.stepCounter, { n: step, total: TOTAL }, locale)}</p>
        <h1 ref={headingRef} tabIndex={-1} className="fk-agent-wizard__title">
          {l.titles[key]}
        </h1>
        <p className="fk-agent-wizard__subtitle">{l.subtitles[key]}</p>
        <StepList steps={stepNames} current={step} reached={reached} label={l.steps} completedWord={l.completed} onJump={(n) => (n < step || n <= reached ? go(n) : undefined)} locale={locale} />
      </header>

      <div className="fk-agent-wizard__surface">
        {key === 'start' ? <ChoiceTiles label={l.presets} tiles={presetTiles} value={d.preset} onChange={choosePreset} /> : null}

        {key === 'identity' ? (
          <div className="fk-agent-wizard__fields">
            <ChoiceTiles
              label={l.avatar}
              value={d.avatar}
              onChange={(v) => edit('avatar', v)}
              tiles={AVATARS.map(({ key: k, icon: Icon }) => ({ value: k, title: l.avatarNames[k] ?? k, icon: <Icon focusable="false" /> }))}
            />
            <TextField id={nameId} label={l.name} required value={d.name} onChange={(v) => edit('name', v)} {...(nameError ? { errorMessage: l.nameRequired } : {})} />
            <TextField label={l.role} value={d.role} onChange={(v) => edit('role', v)} />
            <TextArea label={l.description} value={d.description} onChange={(v) => edit('description', v)} rows={3} />
          </div>
        ) : null}

        {key === 'model' ? (
          <div className="fk-agent-wizard__fields">
            {connections.length ? (
              <NativeSelect label={l.connection} value={d.connectionId} onChange={(v) => edit('connectionId', v)} options={connections.map((c) => ({ value: c.id, label: c.provider ? `${c.name} · ${c.provider}` : c.name }))} />
            ) : (
              <TextField label={l.modelField} value={d.model} onChange={(v) => edit('model', v)} />
            )}
            {frameworks.length ? <NativeSelect label={l.framework} value={d.framework} onChange={(v) => edit('framework', v)} options={frameworks.map((f) => ({ value: f.id, label: f.label }))} /> : null}
            {connections.length ? (
              <NativeSelect
                label={l.model}
                value={d.model}
                onChange={(v) => edit('model', v)}
                options={models.length ? models.map((m) => ({ value: m.id, label: m.name ?? m.id })) : [{ value: '', label: l.noModels }]}
              />
            ) : null}
            <TextArea label={l.outputSchema} value={d.outputSchema} onChange={(v) => edit('outputSchema', v)} rows={4} monospace />
          </div>
        ) : null}

        {key === 'behaviour' ? (
          <div className="fk-agent-wizard__fields">
            <TextArea label={l.systemPrompt} value={d.systemPrompt} onChange={(v) => edit('systemPrompt', v)} rows={4} />
            <TextArea label={l.userPrompt} value={d.userPrompt} onChange={(v) => edit('userPrompt', v)} rows={3} />
            <div className="fk-agent-wizard__numbers">
              <TextField label={l.temperature} inputType="number" value={d.temperature} onChange={(v) => edit('temperature', v)} />
              <TextField label={l.topP} inputType="number" value={d.topP} onChange={(v) => edit('topP', v)} />
              <TextField label={l.topK} inputType="number" value={d.topK} onChange={(v) => edit('topK', v)} />
              <TextField label={l.maxOutput} inputType="number" value={d.maxOutput} onChange={(v) => edit('maxOutput', v)} />
            </div>
            <NativeSelect label={l.difficulty} value={d.difficulty} onChange={(v) => edit('difficulty', v as AgentDifficulty)} options={DIFFICULTIES.map((x) => ({ value: x, label: l.difficultyNames[x] }))} />
            <TagInput label={l.tags} value={d.tags} onChange={(t) => edit('tags', t)} removeLabel={l.removeTag} />
          </div>
        ) : null}

        {key === 'review' ? (
          <div className="fk-agent-wizard__review">
            <ReviewGroup title={l.titles.identity} editLabel={fill(l.editGroup, { group: l.titles.identity }, locale)} onEdit={() => go(2)} editWord={l.edit}>
              <div className="fk-agent-wizard__review-mark">
                <AgentMark />
                <span>{shown(d.name || presets.find((p) => p.id === d.preset)?.name)}</span>
              </div>
              <Row term={l.role} value={shown(d.role)} />
              <Row term={l.description} value={shown(d.description)} />
            </ReviewGroup>
            <ReviewGroup title={l.titles.model} editLabel={fill(l.editGroup, { group: l.titles.model }, locale)} onEdit={() => go(3)} editWord={l.edit}>
              {connections.length ? <Row term={l.connection} value={shown(connections.find((c) => c.id === d.connectionId)?.name)} /> : null}
              {frameworks.length ? <Row term={l.framework} value={shown(frameworks.find((f) => f.id === d.framework)?.label)} /> : null}
              <Row term={l.model} value={shown(modelName(d.model))} mono />
            </ReviewGroup>
            <ReviewGroup title={l.titles.behaviour} editLabel={fill(l.editGroup, { group: l.titles.behaviour }, locale)} onEdit={() => go(4)} editWord={l.edit}>
              <Row term={l.systemPrompt} value={shown(d.systemPrompt)} />
              <Row term={l.difficulty} value={l.difficultyNames[d.difficulty]} />
              <Row term={l.tags} value={d.tags.length ? d.tags.join(', ') : l.notSet} />
            </ReviewGroup>
          </div>
        ) : null}

        {error ? (
          <InlineNotice tone="danger" title={l.failed} urgency="assertive">
            {error}
          </InlineNotice>
        ) : null}
      </div>

      <footer className="fk-agent-wizard__footer">
        <Button variant="quiet" onPress={() => void cancel()}>
          {l.cancel}
        </Button>
        <span className="fk-agent-wizard__spacer" />
        {step > 1 ? (
          <Button variant="secondary" leadingIcon={<ArrowLeft className="fk-agent-wizard__arrow" />} onPress={() => go(step - 1)}>
            {l.back}
          </Button>
        ) : null}
        {step < TOTAL ? (
          <Button variant="secondary" trailingIcon={<ArrowRight className="fk-agent-wizard__arrow" />} onPress={next}>
            {l.next}
          </Button>
        ) : (
          <Button variant="primary" busy={busy} busyLabel={l.creating} onPress={() => void create()}>
            {l.create}
          </Button>
        )}
      </footer>
    </div>
  )
}

function ReviewGroup({ title, editLabel, editWord, onEdit, children }: { title: string; editLabel: string; editWord: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="fk-agent-wizard__group">
      <div className="fk-agent-wizard__group-head">
        <h2 className="fk-agent-wizard__group-title">{title}</h2>
        <Button variant="quiet" size="compact" onPress={onEdit}>
          <span aria-hidden="true">{editWord}</span>
          <span className="fk-visually-hidden">{editLabel}</span>
        </Button>
      </div>
      <dl className="fk-agent-wizard__rows">{children}</dl>
    </section>
  )
}

function Row({ term, value, mono = false }: { term: string; value: string; mono?: boolean }) {
  return (
    <div className="fk-agent-wizard__row">
      <dt>{term}</dt>
      <dd data-mono={mono || undefined} {...(mono ? { dir: 'ltr' } : {})}>
        {value}
      </dd>
    </div>
  )
}
