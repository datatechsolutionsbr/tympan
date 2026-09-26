// StartNodeForm: which inputs a run asks for, and a starting value for each.
// Nothing leaves the form until Save; Save cleans the names and keeps only the
// defaults that still belong to a named variable and are not empty.

import { useId, useReducer } from 'react'
import { TextField } from '@fakhir/design-system'
import { defineLabels, useLabels } from '../internal/labels'
import { NodeFormFooter } from './NodeFormFooter'
import { VariableListEditor } from './VariableListEditor'

export interface StartConfig {
  kind: 'start'
  inputVariables: string[]
  inputDefaults: Record<string, string>
  [key: string]: unknown
}

export interface StartNodeFormLabels {
  variables: string
  add: string
  placeholder: string
  defaults: string
  defaultPlaceholder: string
  save: string
  cancel: string
}

export const startNodeFormLabels = defineLabels<StartNodeFormLabels>('StartNodeForm', {
  en: { variables: 'Input variables', add: 'Add variable', placeholder: 'Variable name', defaults: 'Default values', defaultPlaceholder: 'Default value', save: 'Save', cancel: 'Cancel' },
  'pt-BR': { variables: 'Variáveis de entrada', add: 'Adicionar variável', placeholder: 'Nome da variável', defaults: 'Valores padrão', defaultPlaceholder: 'Valor padrão', save: 'Salvar', cancel: 'Cancelar' },
  es: { variables: 'Variables de entrada', add: 'Añadir variable', placeholder: 'Nombre de la variable', defaults: 'Valores predeterminados', defaultPlaceholder: 'Valor predeterminado', save: 'Guardar', cancel: 'Cancelar' },
})

export const defaultStartNodeFormLabels: StartNodeFormLabels = startNodeFormLabels.bundles.en

export interface StartNodeFormProps {
  config: { inputVariables?: string[]; inputDefaults?: Record<string, string>; [key: string]: unknown }
  onSave: (config: StartConfig) => void
  onCancel: () => void
  labels?: Partial<StartNodeFormLabels>
}

interface Draft {
  names: string[]
  fallback: Record<string, string>
}

type DraftEdit = { names: string[] } | { name: string; fallback: string }

function edit(draft: Draft, change: DraftEdit): Draft {
  return 'names' in change ? { ...draft, names: change.names } : { ...draft, fallback: { ...draft.fallback, [change.name]: change.fallback } }
}

/** The start configuration Save emits: unique trimmed names, non-empty defaults of those names, other keys untouched. */
function settle(config: StartNodeFormProps['config'], draft: Draft): StartConfig {
  const inputVariables = Array.from(new Set(draft.names.map((n) => n.trim()).filter(Boolean)))
  const inputDefaults = Object.fromEntries(inputVariables.flatMap((n) => (draft.fallback[n] ? [[n, draft.fallback[n]!]] : [])))
  return { ...config, kind: 'start', inputVariables, inputDefaults }
}

function DefaultValues({ names, fallback, heading, placeholder, onEdit }: { names: string[]; fallback: Record<string, string>; heading: string; placeholder: string; onEdit: (name: string, value: string) => void }) {
  const headingId = useId()
  return (
    <div className="fk-start-form__defaults" role="group" aria-labelledby={headingId}>
      <span id={headingId} className="fk-start-form__defaults-title">
        {heading}
      </span>
      <div className="fk-start-form__grid">
        {names.map((name) => (
          <TextField key={name} className="fk-start-form__default" label={name} placeholder={placeholder} value={fallback[name] ?? ''} onChange={(v) => onEdit(name, v)} />
        ))}
      </div>
    </div>
  )
}

export function StartNodeForm({ config, onSave, onCancel, labels }: StartNodeFormProps) {
  const l = useLabels(startNodeFormLabels, labels)
  const [draft, change] = useReducer(edit, config, (c): Draft => ({ names: [...(c.inputVariables ?? [])], fallback: { ...(c.inputDefaults ?? {}) } }))
  const named = draft.names.filter((n) => n.trim() !== '')
  return (
    <div className="fk-node-form fk-start-form">
      <VariableListEditor label={l.variables} value={draft.names} onChange={(names) => change({ names })} numbered editable tone="input" addLabel={l.add} placeholder={l.placeholder} />
      {named.length > 0 && <DefaultValues names={named} fallback={draft.fallback} heading={l.defaults} placeholder={l.defaultPlaceholder} onEdit={(name, fallback) => change({ name, fallback })} />}
      <NodeFormFooter onSave={() => onSave(settle(config, draft))} onCancel={onCancel} labels={{ save: l.save, cancel: l.cancel }} />
    </div>
  )
}
