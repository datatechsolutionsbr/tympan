// SchemaConfigForm: a node configuration form generated from the field schema
// the node kind catalog serves. One control per property, in schema order.

import { useMemo, useState } from 'react'
import { NativeSelect, Switch, TextArea, TextField } from '@fakhir/design-system'
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
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
  return words ? words[0]!.toUpperCase() + words.slice(1) : key
}

export interface SchemaConfigFormProps {
  value: Record<string, unknown>
  schema: ConfigSchema
  onSave: (value: Record<string, unknown>) => void
  onCancel: () => void
  saveDisabled?: boolean
  labels?: Partial<SchemaConfigFormLabels>
}

/** Keys whose text is long enough to deserve a multi-line area. */
const LONG_TEXT = /(prompt|template|body|instructions?|input|code)$/i

type Control = 'select' | 'number' | 'switch' | 'structured' | 'multiline' | 'line'

export function controlFor(key: string, field: FieldSchema): Control {
  if (field.enum && field.enum.length) return 'select'
  if (field.type === 'number' || field.type === 'integer') return 'number'
  if (field.type === 'boolean') return 'switch'
  if (field.type === 'array' || field.type === 'object') return 'structured'
  if (LONG_TEXT.test(key)) return 'multiline'
  return 'line'
}

const pretty = (v: unknown) => (v === undefined ? '' : JSON.stringify(v, null, 2))

export function SchemaConfigForm({ value, schema, onSave, onCancel, saveDisabled = false, labels }: SchemaConfigFormProps) {
  const l = useLabels(schemaConfigFormLabels, labels)
  const { locale } = useFlowLocale()
  const entries = useMemo(() => Object.entries(schema.properties ?? {}), [schema])
  const required = useMemo(() => new Set(schema.required ?? []), [schema])
  // Edited values keyed by property; `undefined` means "unset" (removed on save).
  const [edits, setEdits] = useState<Record<string, unknown>>({})
  // Raw text of structured fields and their parse problems.
  const [texts, setTexts] = useState<Record<string, string>>(() => Object.fromEntries(entries.filter(([k, f]) => controlFor(k, f) === 'structured').map(([k]) => [k, pretty(value[k])])))
  const [parseErrors, setParseErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const current = (key: string) => (key in edits ? edits[key] : value[key])
  const set = (key: string, next: unknown) => setEdits((e) => ({ ...e, [key]: next }))

  const setStructured = (key: string, text: string) => {
    setTexts((t) => ({ ...t, [key]: text }))
    if (!text.trim()) {
      setParseErrors((p) => ({ ...p, [key]: '' }))
      set(key, undefined)
      return
    }
    try {
      const parsed = JSON.parse(text) as unknown
      setParseErrors((p) => ({ ...p, [key]: '' }))
      set(key, parsed)
    } catch (err) {
      // The last valid value stays in `edits`; only the message changes.
      setParseErrors((p) => ({ ...p, [key]: fill(l.invalidStructured, { detail: err instanceof Error ? err.message : String(err) }, locale) }))
    }
  }

  const save = () => {
    const out: Record<string, unknown> = { ...value }
    for (const [k, v] of Object.entries(edits)) {
      if (v === undefined) delete out[k]
      else out[k] = v
    }
    onSave(out)
  }

  return (
    <div className="fk-node-form fk-schema-form">
      {entries.length ? (
        <div className="fk-node-form__fields">
          {entries.map(([key, field]) => {
            const label = field.title ?? labelFromKey(key)
            const isRequired = required.has(key)
            const v = current(key)
            const missing = isRequired && touched[key] && (v === undefined || v === '' || v === null)
            const common = { label, hint: field.description, required: isRequired }
            switch (controlFor(key, field)) {
              case 'select':
                return (
                  <NativeSelect
                    key={key}
                    {...common}
                    placeholder={l.none}
                    options={field.enum!.map((o) => ({ value: String(o), label: String(o) }))}
                    value={v === undefined || v === null ? '' : String(v)}
                    onChange={(s) => {
                      const match = field.enum!.find((o) => String(o) === s)
                      set(key, s === '' ? undefined : match)
                    }}
                    {...(missing ? { errorMessage: l.required } : {})}
                  />
                )
              case 'number':
                return (
                  <TextField
                    key={key}
                    {...common}
                    inputType="number"
                    value={typeof v === 'number' ? String(v) : ''}
                    onChange={(s) => set(key, s.trim() === '' || Number.isNaN(Number(s)) ? undefined : Number(s))}
                    onBlur={() => setTouched((t) => ({ ...t, [key]: true }))}
                    {...(missing ? { errorMessage: l.required } : {})}
                  />
                )
              case 'switch':
                return (
                  <Switch
                    key={key}
                    label={label}
                    {...(field.description ? { description: field.description } : {})}
                    isSelected={v === true}
                    onChange={(on) => set(key, on)}
                  />
                )
              case 'structured':
                return (
                  <TextArea
                    key={key}
                    {...common}
                    monospace
                    className="fk-ltr-text"
                    rows={5}
                    value={texts[key] ?? ''}
                    onChange={(t) => setStructured(key, t)}
                    {...(parseErrors[key] ? { errorMessage: parseErrors[key] } : missing ? { errorMessage: l.required } : {})}
                  />
                )
              case 'multiline':
                return (
                  <TextArea
                    key={key}
                    {...common}
                    rows={4}
                    autoGrow
                    value={typeof v === 'string' ? v : v === undefined ? '' : String(v)}
                    onChange={(t) => set(key, t)}
                    {...(missing ? { errorMessage: l.required } : {})}
                  />
                )
              default:
                return (
                  <TextField
                    key={key}
                    {...common}
                    value={typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v)}
                    onChange={(t) => set(key, t)}
                    onBlur={() => setTouched((tt) => ({ ...tt, [key]: true }))}
                    {...(missing ? { errorMessage: l.required } : {})}
                  />
                )
            }
          })}
        </div>
      ) : (
        <p className="fk-node-form__empty">{l.empty}</p>
      )}
      <NodeFormFooter onSave={save} onCancel={onCancel} saveDisabled={saveDisabled} labels={{ save: l.save, cancel: l.cancel }} />
    </div>
  )
}
