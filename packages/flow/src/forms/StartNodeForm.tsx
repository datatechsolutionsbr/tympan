// StartNodeForm: the input variables a run needs, and an optional default per
// variable. Edits stay local until Save.

import { useId, useState } from 'react'
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

export function StartNodeForm({ config, onSave, onCancel, labels }: StartNodeFormProps) {
  const l = useLabels(startNodeFormLabels, labels)
  const groupId = useId()
  const [vars, setVars] = useState<string[]>(() => [...(config.inputVariables ?? [])])
  const [defaults, setDefaults] = useState<Record<string, string>>(() => ({ ...(config.inputDefaults ?? {}) }))

  const save = () => {
    const names = vars.map((v) => v.trim()).filter(Boolean)
    const unique = [...new Set(names)]
    const kept: Record<string, string> = {}
    for (const name of unique) {
      const d = defaults[name]
      if (d !== undefined && d !== '') kept[name] = d
    }
    onSave({ ...config, kind: 'start', inputVariables: unique, inputDefaults: kept })
  }

  const named = vars.filter((v) => v.trim())

  return (
    <div className="fk-node-form fk-start-form">
      <VariableListEditor label={l.variables} value={vars} onChange={setVars} numbered editable tone="input" addLabel={l.add} placeholder={l.placeholder} />
      {named.length ? (
        <div className="fk-start-form__defaults" role="group" aria-labelledby={groupId}>
          <span id={groupId} className="fk-start-form__defaults-title">
            {l.defaults}
          </span>
          <div className="fk-start-form__grid">
            {named.map((name) => (
              <TextField
                key={name}
                className="fk-start-form__default"
                label={name}
                placeholder={l.defaultPlaceholder}
                value={defaults[name] ?? ''}
                onChange={(v) => setDefaults((d) => ({ ...d, [name]: v }))}
              />
            ))}
          </div>
        </div>
      ) : null}
      <NodeFormFooter onSave={save} onCancel={onCancel} labels={{ save: l.save, cancel: l.cancel }} />
    </div>
  )
}
