// RuleEditor: a saved rule end to end (identity, priority, activity, a yes/no
// condition, one action, and optional validity, lifecycle and tags). The
// condition builder and the action builder are exported on their own.

import { Fragment, useEffect, useId, useMemo, useState } from 'react'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Button as AriaButton, Disclosure, DisclosurePanel, Group, Heading, Input, Label, NumberField } from 'react-aria-components'
import { Button, InlineNotice, NativeSelect, Switch, Tag, TagList, TextArea, TextField } from '../../index'
import { createId } from '../internal/ids'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import { ExpressionField, type ExpressionFieldLabels } from './ExpressionField'
import type { ExpressionBuilderLabels } from './labels'
import { FLOW_INPUTS_REF, type ExpressionCatalog, type ExpressionNode } from './model'
import {
  choiceOptions,
  CUSTOM_ACTION,
  defaultParams,
  defaultRuleActions,
  DURATION_UNITS,
  readLooseValue,
  readTyped,
  validateParams,
  type ActionContext,
  type ActionKind,
  type ParamError,
  type ParamSpec,
} from './ruleActions'
import { conditionRootName, defaultRuleCondition, normalizeRuleCondition } from './ruleCondition'

export interface RuleAction {
  kind: string
  params?: Record<string, unknown>
}

export interface RuleValue {
  id?: string
  name: string
  description?: string
  enabled: boolean
  priority: number
  status?: string
  validFrom?: string | null
  validUntil?: string | null
  tags?: string[]
  condition: ExpressionNode
  action: RuleAction
  recurrence?: unknown
}

export const FALLBACK_RULE_STATUSES = ['draft', 'active', 'paused', 'archived'] as const

/** A new rule: empty name, enabled, priority 0, active, an equality condition, the first action kind. */
export function defaultRule(actionCatalog: readonly ActionKind[] = defaultRuleActions): RuleValue {
  const first = actionCatalog[0]
  return {
    name: '',
    enabled: true,
    priority: 0,
    status: 'active',
    condition: defaultRuleCondition(),
    action: first ? { kind: first.kind, params: defaultParams(first) } : { kind: CUSTOM_ACTION, params: {} },
  }
}

export interface RuleEditorLabels {
  name: string
  nameRequired: string
  priority: string
  active: string
  description: string
  conditionHeading: string
  actionHeading: string
  rootNames: { reference: string; value: string }
  condition: string
  actionKind: string
  unavailable: string
  noOptions: string
  required: string
  customLegend: string
  customKey: string
  customValue: string
  customRemove: string
  customAdd: string
  durationUnit: string
  units: Record<'minutes' | 'hours' | 'days', string>
  advanced: string
  validFrom: string
  validUntil: string
  invalidDate: string
  status: string
  statusNames: Record<string, string>
  tags: string
  addTag: string
  removeTag: string
  newTag: string
  /** Names and descriptions of action kinds and their parameters, by label key. */
  actions: Record<string, string>
  field: Partial<ExpressionFieldLabels>
  builder: Partial<ExpressionBuilderLabels>
}

const enActions: Record<string, string> = {
  setValue: 'Set value',
  setValueDescription: 'Write a value into a flow variable.',
  addTag: 'Add tag',
  addTagDescription: 'Tag the item being evaluated.',
  requestReview: 'Request review',
  requestReviewDescription: 'Create a task for a person in the verification queue.',
  notify: 'Notify',
  notifyDescription: 'Send a message to a role.',
  route: 'Route',
  routeDescription: 'Continue on one branch of the rule step.',
  stop: 'Stop',
  stopDescription: 'End the run with an outcome.',
  custom: 'Custom',
  customDescription: 'Free parameters read by the engine.',
  target: 'Target variable',
  value: 'Value',
  tag: 'Tag',
  role: 'Role',
  reason: 'Reason',
  dueIn: 'Due in',
  recipient: 'Recipient',
  message: 'Message',
  branch: 'Branch',
  outcome: 'Outcome',
  completed: 'Completed',
  failed: 'Failed',
}

export const ruleEditorLabels = defineLabels<RuleEditorLabels>('RuleEditor', {
  en: {
    name: 'Name',
    nameRequired: 'Give the rule a name.',
    priority: 'Priority',
    active: 'Active',
    description: 'Description',
    conditionHeading: 'Condition',
    actionHeading: 'Action',
    rootNames: { reference: 'reference', value: 'value' },
    condition: 'Condition',
    actionKind: 'Action',
    unavailable: 'This action is not available here. Its stored parameters are shown below; choose an available action to replace it.',
    noOptions: 'There is nothing to choose for {name} yet.',
    required: '{name} is required.',
    customLegend: 'Parameter {n, number}',
    customKey: 'Key',
    customValue: 'Value',
    customRemove: 'Remove parameter {key}',
    customAdd: 'Add parameter',
    durationUnit: 'Unit',
    units: { minutes: 'minutes', hours: 'hours', days: 'days' },
    advanced: 'Advanced',
    validFrom: 'Valid from',
    validUntil: 'Valid until',
    invalidDate: 'Enter a valid date and time.',
    status: 'Lifecycle status',
    statusNames: { draft: 'Draft', active: 'Active', paused: 'Paused', archived: 'Archived' },
    tags: 'Tags',
    addTag: 'Add tag',
    removeTag: 'Remove tag {tag}',
    newTag: 'New tag',
    actions: enActions,
    field: {},
    builder: {},
  },
  'pt-BR': {
    name: 'Nome',
    nameRequired: 'Dê um nome à regra.',
    priority: 'Prioridade',
    active: 'Ativa',
    description: 'Descrição',
    conditionHeading: 'Condição',
    actionHeading: 'Ação',
    rootNames: { reference: 'referência', value: 'valor' },
    condition: 'Condição',
    actionKind: 'Ação',
    unavailable: 'Esta ação não está disponível aqui. Os parâmetros guardados aparecem abaixo; escolha uma ação disponível para substituí-la.',
    noOptions: 'Ainda não há o que escolher em {name}.',
    required: '{name} é obrigatório.',
    customLegend: 'Parâmetro {n, number}',
    customKey: 'Chave',
    customValue: 'Valor',
    customRemove: 'Remover parâmetro {key}',
    customAdd: 'Adicionar parâmetro',
    durationUnit: 'Unidade',
    units: { minutes: 'minutos', hours: 'horas', days: 'dias' },
    advanced: 'Avançado',
    validFrom: 'Válida a partir de',
    validUntil: 'Válida até',
    invalidDate: 'Informe data e hora válidas.',
    status: 'Situação',
    statusNames: { draft: 'Rascunho', active: 'Ativa', paused: 'Pausada', archived: 'Arquivada' },
    tags: 'Etiquetas',
    addTag: 'Adicionar etiqueta',
    removeTag: 'Remover etiqueta {tag}',
    newTag: 'Nova etiqueta',
    actions: {
      setValue: 'Definir valor',
      setValueDescription: 'Grava um valor numa variável do fluxo.',
      addTag: 'Adicionar etiqueta',
      addTagDescription: 'Etiqueta o item avaliado.',
      requestReview: 'Pedir revisão',
      requestReviewDescription: 'Cria uma tarefa para uma pessoa na fila de verificação.',
      notify: 'Notificar',
      notifyDescription: 'Envia uma mensagem a um papel.',
      route: 'Encaminhar',
      routeDescription: 'Segue por um ramo da etapa de regra.',
      stop: 'Parar',
      stopDescription: 'Encerra a execução com um desfecho.',
      custom: 'Personalizada',
      customDescription: 'Parâmetros livres lidos pelo motor.',
      target: 'Variável de destino',
      value: 'Valor',
      tag: 'Etiqueta',
      role: 'Papel',
      reason: 'Motivo',
      dueIn: 'Prazo',
      recipient: 'Destinatário',
      message: 'Mensagem',
      branch: 'Ramo',
      outcome: 'Desfecho',
      completed: 'Concluída',
      failed: 'Falhou',
    },
    field: {},
    builder: {},
  },
  es: {
    name: 'Nombre',
    nameRequired: 'Dé un nombre a la regla.',
    priority: 'Prioridad',
    active: 'Activa',
    description: 'Descripción',
    conditionHeading: 'Condición',
    actionHeading: 'Acción',
    rootNames: { reference: 'referencia', value: 'valor' },
    condition: 'Condición',
    actionKind: 'Acción',
    unavailable: 'Esta acción no está disponible aquí. Sus parámetros guardados se muestran abajo; elija una acción disponible para reemplazarla.',
    noOptions: 'Todavía no hay nada que elegir en {name}.',
    required: '{name} es obligatorio.',
    customLegend: 'Parámetro {n, number}',
    customKey: 'Clave',
    customValue: 'Valor',
    customRemove: 'Quitar parámetro {key}',
    customAdd: 'Añadir parámetro',
    durationUnit: 'Unidad',
    units: { minutes: 'minutos', hours: 'horas', days: 'días' },
    advanced: 'Avanzado',
    validFrom: 'Válida desde',
    validUntil: 'Válida hasta',
    invalidDate: 'Introduzca una fecha y hora válidas.',
    status: 'Estado',
    statusNames: { draft: 'Borrador', active: 'Activa', paused: 'En pausa', archived: 'Archivada' },
    tags: 'Etiquetas',
    addTag: 'Añadir etiqueta',
    removeTag: 'Quitar etiqueta {tag}',
    newTag: 'Nueva etiqueta',
    actions: {
      setValue: 'Asignar valor',
      setValueDescription: 'Escribe un valor en una variable del flujo.',
      addTag: 'Añadir etiqueta',
      addTagDescription: 'Etiqueta el elemento evaluado.',
      requestReview: 'Pedir revisión',
      requestReviewDescription: 'Crea una tarea para una persona en la cola de verificación.',
      notify: 'Notificar',
      notifyDescription: 'Envía un mensaje a un rol.',
      route: 'Encaminar',
      routeDescription: 'Sigue por una rama del paso de regla.',
      stop: 'Detener',
      stopDescription: 'Termina la ejecución con un resultado.',
      custom: 'Personalizada',
      customDescription: 'Parámetros libres leídos por el motor.',
      target: 'Variable de destino',
      value: 'Valor',
      tag: 'Etiqueta',
      role: 'Rol',
      reason: 'Motivo',
      dueIn: 'Plazo',
      recipient: 'Destinatario',
      message: 'Mensaje',
      branch: 'Rama',
      outcome: 'Resultado',
      completed: 'Completada',
      failed: 'Falló',
    },
    field: {},
    builder: {},
  },
})

export const defaultRuleEditorLabels: RuleEditorLabels = ruleEditorLabels.bundles.en

// ---- small fields ---------------------------------------------------------

function NumberInput({ label, value, onChange, min, max, step, integer }: { label: string; value: number | null; onChange: (v: number | null) => void; min?: number; max?: number; step?: number; integer?: boolean }) {
  return (
    <NumberField
      className="ty-rule-editor__number"
      value={value ?? NaN}
      onChange={(v) => onChange(Number.isNaN(v) ? null : v)}
      {...(min !== undefined ? { minValue: min } : {})}
      {...(max !== undefined ? { maxValue: max } : {})}
      {...(step !== undefined ? { step } : {})}
      formatOptions={integer ? { maximumFractionDigits: 0 } : {}}
    >
      <Label className="ty-rule-editor__label">{label}</Label>
      <Group>
        <Input className="ty-rule-editor__number-input" />
      </Group>
    </NumberField>
  )
}

/** Local date-time text ↔ UTC instant. */
export function localToInstant(local: string): string | null {
  if (!local) return null
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function instantToLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function DateTimeField({ label, value, onChange, errorText }: { label: string; value: string | null | undefined; onChange: (iso: string | null) => void; errorText: string }) {
  const id = useId()
  const [text, setText] = useState(() => instantToLocal(value))
  const [bad, setBad] = useState(false)
  return (
    <div className="ty-rule-editor__number">
      <label className="ty-rule-editor__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="ty-rule-editor__number-input"
        type="datetime-local"
        value={text}
        aria-invalid={bad || undefined}
        aria-describedby={bad ? `${id}-error` : undefined}
        onChange={(e) => {
          const t = e.target.value
          setText(t)
          const iso = localToInstant(t)
          setBad(t !== '' && iso === null)
          onChange(iso)
        }}
      />
      {bad ? (
        <p id={`${id}-error`} className="ty-rule-editor__error">
          {errorText}
        </p>
      ) : null}
    </div>
  )
}

// ---- condition --------------------------------------------------------------

export interface RuleConditionBuilderProps {
  value: ExpressionNode
  onChange: (next: ExpressionNode) => void
  references?: readonly string[]
  catalog?: ExpressionCatalog
  labels?: Partial<RuleEditorLabels>
}

export function RuleConditionBuilder({ value, onChange, references = [FLOW_INPUTS_REF], catalog, labels }: RuleConditionBuilderProps) {
  const l = useLabels(ruleEditorLabels, labels)
  return (
    <ExpressionField
      label={l.condition}
      value={value}
      onChange={onChange}
      references={references}
      mode="predicate"
      acceptLeaves
      labels={l.field}
      builderLabels={l.builder}
      {...(catalog ? { catalog } : {})}
    />
  )
}

// ---- action -----------------------------------------------------------------

export interface RuleActionBuilderProps {
  value: RuleAction
  onChange: (next: RuleAction) => void
  actionCatalog?: readonly ActionKind[]
  allowCustom?: boolean
  actionContext?: ActionContext
  references?: readonly string[]
  /** Declared type of each reference, to read Set value text as a number or boolean. */
  referenceTypes?: Record<string, 'number' | 'boolean' | 'string'>
  onValidate?: (errors: ParamError[]) => void
  labels?: Partial<RuleEditorLabels>
}

const CUSTOM_KIND: ActionKind = { kind: CUSTOM_ACTION, labelKey: 'custom', descriptionKey: 'customDescription', params: [] }

export function RuleActionBuilder(props: RuleActionBuilderProps) {
  const { value, onChange, actionCatalog, allowCustom = true, actionContext = {}, references = [FLOW_INPUTS_REF], referenceTypes = {}, onValidate } = props
  const l = useLabels(ruleEditorLabels, props.labels)
  const { locale } = useFlowLocale()
  const kinds = useMemo(() => [...(actionCatalog ?? defaultRuleActions), ...(allowCustom ? [CUSTOM_KIND] : [])], [actionCatalog, allowCustom])
  const kind = kinds.find((k) => k.kind === value.kind)
  const params = value.params ?? {}
  const say = (key: string | undefined) => (key ? (l.actions[key] ?? key) : '')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const errors = kind && kind.kind !== CUSTOM_ACTION ? validateParams(kind, params, actionContext) : []
  const errorKey = errors.map((e) => `${e.key}:${e.code}`).join('|')
  useEffect(() => {
    onValidate?.(errors)
    // errorKey summarises the errors array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorKey])

  const setParam = (key: string, v: unknown) => onChange({ ...value, params: { ...params, [key]: v } })

  const picker = (
    <NativeSelect
      label={l.actionKind}
      options={[...(kind ? [] : [{ value: value.kind, label: value.kind, disabled: true }]), ...kinds.map((k) => ({ value: k.kind, label: say(k.labelKey) }))]}
      value={value.kind}
      hint={kind?.descriptionKey ? say(kind.descriptionKey) : undefined}
      onChange={(k) => {
        const next = kinds.find((x) => x.kind === k)
        setTouched({})
        onChange({ kind: k, params: next?.kind === CUSTOM_ACTION ? {} : defaultParams(next) })
      }}
    />
  )

  if (!kind) {
    return (
      <div className="ty-rule-editor__panel">
        {picker}
        <InlineNotice tone="warning" urgency="none">
          {l.unavailable}
        </InlineNotice>
        <dl className="ty-rule-editor__readonly">
          {Object.entries(params).map(([k, v]) => (
            <Fragment key={k}>
              <dt dir="ltr">{k}</dt>
              <dd>{typeof v === 'string' ? v : JSON.stringify(v)}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    )
  }

  if (kind.kind === CUSTOM_ACTION) return <div className="ty-rule-editor__panel">{picker}<CustomParams params={params} onChange={(p) => onChange({ ...value, params: p })} l={l} /></div>

  const errorFor = (p: ParamSpec) => {
    const e = errors.find((x) => x.key === p.key)
    if (!e || e.code === 'noOptions') return undefined
    return touched[p.key] ? fill(l.required, { name: say(p.labelKey) }, locale) : undefined
  }

  return (
    <div className="ty-rule-editor__panel">
      {picker}
      <div className="ty-rule-editor__params">
        {kind.params.map((p) => {
          const name = say(p.labelKey)
          const current = params[p.key]
          const blur = () => setTouched((t) => ({ ...t, [p.key]: true }))
          if (p.type === 'number') return <NumberInput key={p.key} label={name} value={typeof current === 'number' ? current : null} onChange={(v) => setParam(p.key, v)} {...(p.min !== undefined ? { min: p.min } : {})} {...(p.max !== undefined ? { max: p.max } : {})} {...(p.step !== undefined ? { step: p.step } : {})} />
          if (p.type === 'boolean') return <Switch key={p.key} label={name} isSelected={current === true} onChange={(v) => setParam(p.key, v)} />
          if (p.type === 'choice' || p.type === 'reference') {
            const options = p.type === 'reference' ? references.map((r) => ({ value: r, label: r })) : choiceOptions(p, actionContext).map((o) => ({ value: o.value, label: o.label ?? say(o.labelKey) }))
            if (!options.length)
              return (
                <InlineNotice key={p.key} tone="warning" urgency="none">
                  {fill(l.noOptions, { name }, locale)}
                </InlineNotice>
              )
            return <NativeSelect key={p.key} label={name} placeholder="" options={[{ value: '', label: '' }, ...options]} value={typeof current === 'string' ? current : ''} onChange={(v) => setParam(p.key, v)} {...(errorFor(p) ? { errorMessage: errorFor(p)! } : {})} />
          }
          if (p.type === 'duration') {
            const d = (current && typeof current === 'object' ? current : {}) as { amount?: number; unit?: string }
            return (
              <fieldset key={p.key} className="ty-rule-editor__duration">
                <legend className="ty-rule-editor__label">{name}</legend>
                <NumberInput label={name} integer min={0} value={typeof d.amount === 'number' ? d.amount : null} onChange={(amount) => setParam(p.key, amount === null ? undefined : { amount, unit: d.unit ?? 'days' })} />
                <NativeSelect label={l.durationUnit} options={DURATION_UNITS.map((u) => ({ value: u, label: l.units[u] }))} value={d.unit ?? 'days'} onChange={(unit) => setParam(p.key, { amount: d.amount ?? 0, unit })} />
              </fieldset>
            )
          }
          const typed = p.typedBy ? referenceTypes[String(params[p.typedBy] ?? '')] : undefined
          return (
            <TextField
              key={p.key}
              label={name}
              value={current === undefined || current === null ? '' : String(current)}
              onChange={(t) => setParam(p.key, readTyped(t, typed))}
              onBlur={blur}
              {...(errorFor(p) ? { errorMessage: errorFor(p)! } : {})}
            />
          )
        })}
      </div>
    </div>
  )
}

function CustomParams({ params, onChange, l }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void; l: RuleEditorLabels }) {
  const { locale } = useFlowLocale()
  const [rows, setRows] = useState(() => Object.entries(params).map(([key, v]) => ({ id: createId('param'), key, text: typeof v === 'string' ? v : JSON.stringify(v) })))
  const emit = (next: typeof rows) => {
    setRows(next)
    const out: Record<string, unknown> = {}
    for (const r of next) if (r.key.trim()) out[r.key.trim()] = readLooseValue(r.text)
    onChange(out)
  }
  return (
    <div className="ty-rule-editor__params">
      {rows.map((r, i) => (
        <fieldset key={r.id} className="ty-rule-editor__row">
          <legend className="ty-visually-hidden">{fill(l.customLegend, { n: i + 1 }, locale)}</legend>
          <TextField className="ty-ltr-text" label={l.customKey} value={r.key} onChange={(key) => emit(rows.map((x) => (x.id === r.id ? { ...x, key } : x)))} />
          <TextField label={l.customValue} value={r.text} onChange={(text) => emit(rows.map((x) => (x.id === r.id ? { ...x, text } : x)))} />
          <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={fill(l.customRemove, { key: r.key || String(i + 1) }, locale)} leadingIcon={<Trash2 />} onPress={() => emit(rows.filter((x) => x.id !== r.id))} />
        </fieldset>
      ))}
      <Button variant="secondary" size="compact" leadingIcon={<Plus />} onPress={() => setRows((rs) => [...rs, { id: createId('param'), key: '', text: '' }])}>
        {l.customAdd}
      </Button>
    </div>
  )
}

// ---- full form ---------------------------------------------------------------

export interface RuleEditorProps {
  value?: RuleValue
  onChange: (next: RuleValue) => void
  actionCatalog?: readonly ActionKind[]
  allowCustom?: boolean
  actionContext?: ActionContext
  statuses?: readonly string[]
  references?: readonly string[]
  referenceTypes?: Record<string, 'number' | 'boolean' | 'string'>
  catalog?: ExpressionCatalog
  onValidate?: (errors: ParamError[]) => void
  labels?: Partial<RuleEditorLabels>
}

export function RuleEditor(props: RuleEditorProps) {
  const { actionCatalog, allowCustom, actionContext, statuses = FALLBACK_RULE_STATUSES, references = [FLOW_INPUTS_REF], referenceTypes, catalog, onValidate } = props
  const l = useLabels(ruleEditorLabels, props.labels)
  const [rule, setRule] = useControllable<RuleValue>(props.value, () => defaultRule(actionCatalog), props.onChange)
  const condition = useMemo(() => normalizeRuleCondition(rule.condition), [rule.condition])
  const [nameTouched, setNameTouched] = useState(false)
  const edit = (patch: Partial<RuleValue>) => setRule({ ...rule, ...patch })
  const hasAdvanced = !!(rule.validFrom || rule.validUntil || (rule.tags && rule.tags.length) || (rule.status && rule.status !== 'active'))
  const root = conditionRootName(condition)
  const rootWord = root === 'reference' ? l.rootNames.reference : root === 'value' ? l.rootNames.value : root
  const kind = [...(actionCatalog ?? defaultRuleActions), CUSTOM_KIND].find((k) => k.kind === rule.action.kind)
  const [tagDraft, setTagDraft] = useState('')

  return (
    <div className="ty-node-form ty-rule-editor">
      <div className="ty-rule-editor__basics">
        <TextField
          label={l.name}
          required
          value={rule.name}
          onChange={(name) => edit({ name })}
          onBlur={() => setNameTouched(true)}
          {...(nameTouched && !rule.name.trim() ? { errorMessage: l.nameRequired } : {})}
        />
        <NumberInput label={l.priority} integer min={0} value={rule.priority} onChange={(v) => edit({ priority: v === null ? 0 : Math.max(0, Math.round(v)) })} />
        <Switch label={l.active} isSelected={rule.enabled} onChange={(enabled) => edit({ enabled })} />
        <TextArea label={l.description} rows={2} value={rule.description ?? ''} onChange={(d) => edit(d ? { description: d } : { description: undefined })} />
      </div>

      <section className="ty-expr-form__section" aria-labelledby={`${rule.id ?? 'rule'}-condition`}>
        <h3 id={`${rule.id ?? 'rule'}-condition`} className="ty-expr-form__section-title">
          {l.conditionHeading} <Tag size="small">{rootWord}</Tag>
        </h3>
        <RuleConditionBuilder value={condition} onChange={(c) => edit({ condition: c })} references={references} labels={props.labels} {...(catalog ? { catalog } : {})} />
      </section>

      <section className="ty-expr-form__section" aria-labelledby={`${rule.id ?? 'rule'}-action`}>
        <h3 id={`${rule.id ?? 'rule'}-action`} className="ty-expr-form__section-title">
          {l.actionHeading} <Tag size="small">{kind ? (l.actions[kind.labelKey] ?? kind.labelKey) : rule.action.kind}</Tag>
        </h3>
        <RuleActionBuilder
          value={rule.action}
          onChange={(action) => edit({ action })}
          references={references}
          labels={props.labels}
          {...(actionCatalog ? { actionCatalog } : {})}
          {...(allowCustom !== undefined ? { allowCustom } : {})}
          {...(actionContext ? { actionContext } : {})}
          {...(referenceTypes ? { referenceTypes } : {})}
          {...(onValidate ? { onValidate } : {})}
        />
      </section>

      <Disclosure className="ty-rule-editor__disclosure" defaultExpanded={hasAdvanced}>
        <Heading level={3} className="ty-expr-form__section-title">
          <AriaButton slot="trigger" className="ty-rule-editor__disclosure-trigger">
            <ChevronRight className="ty-rule-editor__chevron" aria-hidden="true" focusable="false" />
            {l.advanced}
          </AriaButton>
        </Heading>
        <DisclosurePanel className="ty-rule-editor__panel">
          <div className="ty-rule-editor__basics">
            <DateTimeField label={l.validFrom} value={rule.validFrom} errorText={l.invalidDate} onChange={(validFrom) => edit({ validFrom })} />
            <DateTimeField label={l.validUntil} value={rule.validUntil} errorText={l.invalidDate} onChange={(validUntil) => edit({ validUntil })} />
            <NativeSelect label={l.status} options={statuses.map((s) => ({ value: s, label: l.statusNames[s] ?? s }))} value={rule.status ?? 'active'} onChange={(status) => edit({ status })} />
          </div>
          <div className="ty-rule-editor__tags">
            {rule.tags?.length ? <TagList label={l.tags} items={rule.tags.map((t) => ({ id: t, label: t }))} onRemove={(id) => edit({ tags: (rule.tags ?? []).filter((t) => t !== id) })} /> : null}
            <TextField label={l.newTag} value={tagDraft} onChange={setTagDraft} />
            <Button
              variant="secondary"
              size="compact"
              leadingIcon={<Plus />}
              disabled={!tagDraft.trim()}
              onPress={() => {
                const t = tagDraft.trim()
                if (t && !(rule.tags ?? []).includes(t)) edit({ tags: [...(rule.tags ?? []), t] })
                setTagDraft('')
              }}
            >
              {l.addTag}
            </Button>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}
