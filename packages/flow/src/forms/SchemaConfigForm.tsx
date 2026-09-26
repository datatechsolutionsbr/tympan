// SchemaConfigForm: builds a node's settings form from the field schema the
// node kind catalog serves, so most kinds need no form of their own. Each
// property gets the editor its shape asks for; Save merges the edits over the
// incoming value, keeping keys the schema does not mention.

import { useReducer, type ReactNode } from 'react'
import { NativeSelect, Switch, TextArea, TextField } from '@fakhir/ui'
import type { ConfigSchema, FieldSchema } from '../catalog/kindCatalog'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { NodeFormFooter } from './NodeFormFooter'

export interface SchemaConfigFormLabels {
  save: string
  cancel: string
  none: string
  yes: string
  no: string
  empty: string
  invalidStructured: string
  required: string
}

export const schemaConfigFormLabels = defineLabels<SchemaConfigFormLabels>('SchemaConfigForm', {
  en: {
    save: 'Save',
    cancel: 'Cancel',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    empty: 'This step has nothing to configure.',
    invalidStructured: 'Not valid structured text: {detail}',
    required: 'Fill in this field.',
  },
  'pt-BR': {
    save: 'Salvar',
    cancel: 'Cancelar',
    none: 'Nenhum',
    yes: 'Sim',
    no: 'Não',
    empty: 'Esta etapa não tem nada a configurar.',
    invalidStructured: 'Texto estruturado inválido: {detail}',
    required: 'Preencha este campo.',
  },
  es: {
    save: 'Guardar',
    cancel: 'Cancelar',
    none: 'Ninguno',
    yes: 'Sí',
    no: 'No',
    empty: 'Este paso no tiene nada que configurar.',
    invalidStructured: 'Texto estructurado no válido: {detail}',
    required: 'Complete este campo.',
  },
})

export const defaultSchemaConfigFormLabels: SchemaConfigFormLabels = schemaConfigFormLabels.bundles.en

/**
 * Label from a property key when the schema has no title. Only ASCII keys are
 * split (camelCase, snake_case, kebab-case); keys in any other script are
 * shown as they are, so no script is broken apart.
 */
export function labelFromKey(key: string): string {
  if (!/^[\x20-\x7e]+$/.test(key)) return key
  const lower = key
    .split(/(?<=[a-z0-9])(?=[A-Z])|[_-]+/)
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return lower ? lower.charAt(0).toUpperCase() + lower.slice(1) : key
}

export interface SchemaConfigFormProps {
  value: Record<string, unknown>
  schema: ConfigSchema
  onSave: (value: Record<string, unknown>) => void
  onCancel: () => void
  saveDisabled?: boolean
  labels?: Partial<SchemaConfigFormLabels>
}

type Control = 'select' | 'number' | 'switch' | 'structured' | 'multiline' | 'line'

/** Keys whose text is long enough to deserve a multi-line area. */
const LONG_TEXT = /(prompt|template|body|instructions?|input|code)$/i

/** Shape tests in priority order; the first that matches picks the editor. */
const SHAPES: ReadonlyArray<[Control, (key: string, f: FieldSchema) => boolean]> = [
  ['select', (_k, f) => !!f.enum?.length],
  ['number', (_k, f) => f.type === 'number' || f.type === 'integer'],
  ['switch', (_k, f) => f.type === 'boolean'],
  ['structured', (_k, f) => f.type === 'array' || f.type === 'object'],
  ['multiline', (k) => LONG_TEXT.test(k)],
]

export function controlFor(key: string, field: FieldSchema): Control {
  return SHAPES.find(([, test]) => test(key, field))?.[0] ?? 'line'
}

/** Per-field working state: the value to save (absent = unchanged), raw JSON text, its problem, whether it was visited. */
interface Slot {
  changed?: { to: unknown }
  text?: string
  problem?: string
  visited?: boolean
}

type Slots = Record<string, Slot>
const patchSlot = (slots: Slots, [key, patch]: [string, Slot]): Slots => ({ ...slots, [key]: { ...slots[key], ...patch } })

const asText = (v: unknown) => (v === undefined || v === null ? '' : String(v))
const isEmpty = (v: unknown) => v === undefined || v === null || v === ''

/** Everything a field editor needs. */
interface FieldCtx {
  name: string
  field: FieldSchema
  label: string
  required: boolean
  current: unknown
  slot: Slot
  problem?: string
  l: SchemaConfigFormLabels
  put: (to: unknown) => void
  visit: () => void
  typeJson: (text: string) => void
}

const shared = (c: FieldCtx) => ({ label: c.label, hint: c.field.description, required: c.required, ...(c.problem ? { errorMessage: c.problem } : {}) })

const EDITORS: Record<Control, (c: FieldCtx) => ReactNode> = {
  select: (c) => (
    <NativeSelect
      {...shared(c)}
      placeholder={c.l.none}
      options={c.field.enum!.map((o) => ({ value: String(o), label: String(o) }))}
      value={asText(c.current)}
      onChange={(picked) => c.put(picked === '' ? undefined : c.field.enum!.find((o) => String(o) === picked))}
    />
  ),
  number: (c) => (
    <TextField
      {...shared(c)}
      inputType="number"
      value={typeof c.current === 'number' ? String(c.current) : ''}
      onChange={(t) => c.put(t.trim() === '' || Number.isNaN(Number(t)) ? undefined : Number(t))}
      onBlur={c.visit}
    />
  ),
  switch: (c) => <Switch label={c.label} {...(c.field.description ? { description: c.field.description } : {})} isSelected={c.current === true} onChange={c.put} />,
  structured: (c) => <TextArea {...shared(c)} monospace className="fk-ltr-text" rows={5} value={c.slot.text ?? ''} onChange={c.typeJson} />,
  multiline: (c) => <TextArea {...shared(c)} rows={4} autoGrow value={asText(c.current)} onChange={c.put} />,
  line: (c) => <TextField {...shared(c)} value={asText(c.current)} onChange={c.put} onBlur={c.visit} />,
}

export function SchemaConfigForm({ value, schema, onSave, onCancel, saveDisabled = false, labels }: SchemaConfigFormProps) {
  const l = useLabels(schemaConfigFormLabels, labels)
  const { locale } = useFlowLocale()
  const fields = Object.entries(schema.properties ?? {})
  const needed = schema.required ?? []
  const [slots, patch] = useReducer(patchSlot, undefined, () =>
    Object.fromEntries(fields.filter(([k, f]) => controlFor(k, f) === 'structured').map(([k]) => [k, { text: value[k] === undefined ? '' : JSON.stringify(value[k], null, 2) }])),
  )

  const valueOf = (key: string) => (slots[key]?.changed ? slots[key]!.changed!.to : value[key])

  /** Structured text: blank unsets, valid JSON replaces, invalid keeps the last good value and explains. */
  const typeJsonFor = (key: string) => (text: string) => {
    if (!text.trim()) return patch([key, { text, problem: '', changed: { to: undefined } }])
    try {
      patch([key, { text, problem: '', changed: { to: JSON.parse(text) as unknown } }])
    } catch (why) {
      patch([key, { text, problem: fill(l.invalidStructured, { detail: why instanceof Error ? why.message : String(why) }, locale) }])
    }
  }

  const merged = () => {
    const out = { ...value }
    for (const [key, slot] of Object.entries(slots)) {
      if (!slot.changed) continue
      if (slot.changed.to === undefined) delete out[key]
      else out[key] = slot.changed.to
    }
    return out
  }

  const editors = fields.map(([name, field]) => {
    const slot = slots[name] ?? {}
    const required = needed.includes(name)
    const current = valueOf(name)
    const problem = slot.problem || (required && slot.visited && isEmpty(current) ? l.required : undefined)
    const ctx: FieldCtx = {
      name,
      field,
      label: field.title ?? labelFromKey(name),
      required,
      current,
      slot,
      ...(problem ? { problem } : {}),
      l,
      put: (to) => patch([name, { changed: { to } }]),
      visit: () => patch([name, { visited: true }]),
      typeJson: typeJsonFor(name),
    }
    return <div key={name} className="fk-schema-form__field">{EDITORS[controlFor(name, field)](ctx)}</div>
  })

  return (
    <div className="fk-node-form fk-schema-form">
      {editors.length ? <div className="fk-node-form__fields">{editors}</div> : <p className="fk-node-form__empty">{l.empty}</p>}
      <NodeFormFooter onSave={() => onSave(merged())} onCancel={onCancel} saveDisabled={saveDisabled} labels={{ save: l.save, cancel: l.cancel }} />
    </div>
  )
}
