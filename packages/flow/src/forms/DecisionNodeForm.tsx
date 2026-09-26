// DecisionNodeForm (backlog B-002): what the decision reads, which values it
// may choose, how the model is asked, which provider, model and version
// decide, and the confidence below which a person reviews the result.

import { useId, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, InlineNotice, NativeSelect, TextArea, TextField } from '@datatechsolutions/tympan'
import type { DecisionConfig, DecisionOption } from '../decision/types'
import { createId } from '../internal/ids'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { NodeFormFooter } from './NodeFormFooter'

export interface DecisionNodeFormLabels {
  input: string
  inputHint: string
  inputRequired: string
  references: string
  options: string
  optionLegend: string
  optionValue: string
  optionLabel: string
  addOption: string
  removeOption: string
  tooFew: string
  duplicate: string
  blankValue: string
  instruction: string
  instructionHint: string
  provider: string
  model: string
  modelVersion: string
  modelVersionHint: string
  none: string
  outputVariable: string
  threshold: string
  thresholdHint: string
  thresholdInvalid: string
  save: string
  cancel: string
}

export const decisionNodeFormLabels = defineLabels<DecisionNodeFormLabels>('DecisionNodeForm', {
  en: {
    input: 'Input state',
    inputHint: 'Reference to the upstream value the decision reads.',
    inputRequired: 'Choose what the decision reads.',
    references: 'Available values',
    options: 'Options',
    optionLegend: 'Option {n, number}',
    optionValue: 'Value',
    optionLabel: 'Label',
    addOption: 'Add option',
    removeOption: 'Remove option {n, number}',
    tooFew: 'A decision needs at least two options.',
    duplicate: 'This value is already used by another option.',
    blankValue: 'Give the option a value.',
    instruction: 'Instruction',
    instructionHint: 'What the model is asked to decide. May reference upstream values.',
    provider: 'Provider',
    model: 'Model',
    modelVersion: 'Model version',
    modelVersionHint: 'Pinned and recorded with every result.',
    none: 'None',
    outputVariable: 'Output variable',
    threshold: 'Review threshold',
    thresholdHint: 'From 0 to 1. Below it, a person reviews the result.',
    thresholdInvalid: 'Use a number from 0 to 1.',
    save: 'Save',
    cancel: 'Cancel',
  },
  'pt-BR': {
    input: 'Estado de entrada',
    inputHint: 'Referência ao valor anterior que a decisão lê.',
    inputRequired: 'Escolha o que a decisão lê.',
    references: 'Valores disponíveis',
    options: 'Opções',
    optionLegend: 'Opção {n, number}',
    optionValue: 'Valor',
    optionLabel: 'Rótulo',
    addOption: 'Adicionar opção',
    removeOption: 'Remover opção {n, number}',
    tooFew: 'Uma decisão precisa de pelo menos duas opções.',
    duplicate: 'Este valor já é usado por outra opção.',
    blankValue: 'Dê um valor à opção.',
    instruction: 'Instrução',
    instructionHint: 'O que o modelo deve decidir. Pode citar valores anteriores.',
    provider: 'Provedor',
    model: 'Modelo',
    modelVersion: 'Versão do modelo',
    modelVersionHint: 'Fixada e registrada em cada resultado.',
    none: 'Nenhum',
    outputVariable: 'Variável de saída',
    threshold: 'Limiar de revisão',
    thresholdHint: 'De 0 a 1. Abaixo dele, uma pessoa revisa o resultado.',
    thresholdInvalid: 'Use um número de 0 a 1.',
    save: 'Salvar',
    cancel: 'Cancelar',
  },
  es: {
    input: 'Estado de entrada',
    inputHint: 'Referencia al valor anterior que lee la decisión.',
    inputRequired: 'Elija qué lee la decisión.',
    references: 'Valores disponibles',
    options: 'Opciones',
    optionLegend: 'Opción {n, number}',
    optionValue: 'Valor',
    optionLabel: 'Etiqueta',
    addOption: 'Añadir opción',
    removeOption: 'Quitar opción {n, number}',
    tooFew: 'Una decisión necesita al menos dos opciones.',
    duplicate: 'Este valor ya lo usa otra opción.',
    blankValue: 'Dé un valor a la opción.',
    instruction: 'Instrucción',
    instructionHint: 'Qué debe decidir el modelo. Puede citar valores anteriores.',
    provider: 'Proveedor',
    model: 'Modelo',
    modelVersion: 'Versión del modelo',
    modelVersionHint: 'Fijada y registrada con cada resultado.',
    none: 'Ninguno',
    outputVariable: 'Variable de salida',
    threshold: 'Umbral de revisión',
    thresholdHint: 'De 0 a 1. Por debajo, una persona revisa el resultado.',
    thresholdInvalid: 'Use un número de 0 a 1.',
    save: 'Guardar',
    cancel: 'Cancelar',
  },
})

export const defaultDecisionNodeFormLabels: DecisionNodeFormLabels = decisionNodeFormLabels.bundles.en

export interface DecisionNodeFormProps {
  value: Partial<DecisionConfig> & Record<string, unknown>
  references?: string[]
  providers?: Array<{ id: string; name: string }>
  models?: Array<{ id: string; name?: string; provider?: string }>
  onSave: (value: DecisionConfig) => void
  onCancel: () => void
  labels?: Partial<DecisionNodeFormLabels>
}

type Row = DecisionOption & { key: string }

export interface DecisionValidation {
  input?: string
  options?: string
  rows: Record<string, string>
  threshold?: string
}

/** Checks the rules of the decision form; empty result means valid. */
export function validateDecision(inputRef: string, rows: Array<{ key: string; value: string }>, threshold: string): { input: boolean; tooFew: boolean; blank: string[]; duplicate: string[]; threshold: boolean } {
  const values = rows.map((r) => r.value.trim())
  const seen = new Map<string, number>()
  for (const v of values) if (v) seen.set(v, (seen.get(v) ?? 0) + 1)
  const t = threshold.trim() === '' ? null : Number(threshold)
  return {
    input: !inputRef.trim(),
    tooFew: rows.filter((r) => r.value.trim()).length < 2,
    blank: rows.filter((r) => !r.value.trim()).map((r) => r.key),
    duplicate: rows.filter((r) => r.value.trim() && (seen.get(r.value.trim()) ?? 0) > 1).map((r) => r.key),
    threshold: t !== null && !(Number.isFinite(t) && t >= 0 && t <= 1),
  }
}

export function DecisionNodeForm({ value, references = [], providers = [], models = [], onSave, onCancel, labels }: DecisionNodeFormProps) {
  const l = useLabels(decisionNodeFormLabels, labels)
  const { locale } = useFlowLocale()
  const reasonId = useId()
  const [inputRef, setInputRef] = useState(value.input?.ref ?? '')
  const [rows, setRows] = useState<Row[]>(() => (value.options ?? []).map((o) => ({ ...o, key: createId('option') })))
  const [instruction, setInstruction] = useState(value.instruction ?? '')
  const [provider, setProvider] = useState(value.provider ?? '')
  const [model, setModel] = useState(value.model ?? '')
  const [modelVersion, setModelVersion] = useState(value.modelVersion ?? '')
  const [outputVariable, setOutputVariable] = useState(value.outputVariable ?? 'decision')
  const [threshold, setThreshold] = useState(value.threshold === undefined ? '' : String(value.threshold))
  const [attempted, setAttempted] = useState(false)
  const focusKey = useRef<string | null>(null)

  const v = validateDecision(inputRef, rows, threshold)
  const valid = !v.input && !v.tooFew && !v.blank.length && !v.duplicate.length && !v.threshold
  const shownModels = provider ? models.filter((m) => !m.provider || m.provider === provider) : models

  const save = () => {
    setAttempted(true)
    if (!valid) return
    const out: DecisionConfig = {
      ...(value as Record<string, unknown>),
      kind: 'decision',
      input: { ...(value.input ?? {}), ref: inputRef.trim() },
      options: rows.map(({ key: _k, ...o }) => ({ ...o, value: o.value.trim(), label: o.label.trim() || o.value.trim() })),
      outputVariable: outputVariable.trim() || 'decision',
    }
    const set = (k: 'instruction' | 'provider' | 'model' | 'modelVersion', s: string) => {
      if (s.trim()) out[k] = s.trim()
      else delete out[k]
    }
    set('instruction', instruction)
    set('provider', provider)
    set('model', model)
    set('modelVersion', modelVersion)
    if (threshold.trim()) out.threshold = Number(threshold)
    else delete out.threshold
    onSave(out)
  }

  return (
    <div className="ty-node-form ty-decision-form">
      <div className="ty-decision-form__input">
        <TextField
          className="ty-ltr-text"
          label={l.input}
          hint={l.inputHint}
          value={inputRef}
          onChange={setInputRef}
          required
          {...(attempted && v.input ? { errorMessage: l.inputRequired } : {})}
        />
        {references.length ? (
          <div className="ty-decision-form__refs" role="group" aria-label={l.references}>
            {references.map((r) => (
              <Button key={r} size="compact" variant={r === inputRef ? 'primary' : 'secondary'} current={r === inputRef} onPress={() => setInputRef(r)}>
                <span className="ty-ltr-text">{r}</span>
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <section className="ty-decision-form__options" aria-label={l.options}>
        <h3 className="ty-decision-form__heading">{l.options}</h3>
        {rows.map((r, i) => (
          <fieldset key={r.key} className="ty-decision-form__option">
            <legend className="ty-decision-form__legend">{fill(l.optionLegend, { n: i + 1 }, locale)}</legend>
            <TextField
              className="ty-ltr-text"
              label={l.optionValue}
              value={r.value}
              autoFocus={focusKey.current === r.key}
              onChange={(value) => setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, value } : x)))}
              {...(v.duplicate.includes(r.key) ? { errorMessage: l.duplicate } : attempted && v.blank.includes(r.key) ? { errorMessage: l.blankValue } : {})}
            />
            <TextField label={l.optionLabel} value={r.label} onChange={(label) => setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, label } : x)))} />
            <Button
              variant="quiet"
              size="compact"
              shape="circle"
              iconOnly
              accessibleLabel={fill(l.removeOption, { n: i + 1 }, locale)}
              leadingIcon={<Trash2 />}
              onPress={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
            />
          </fieldset>
        ))}
        {v.tooFew && (attempted || rows.length > 0) ? (
          <InlineNotice tone="warning" urgency="polite">
            <span id={reasonId}>{l.tooFew}</span>
          </InlineNotice>
        ) : null}
        <Button
          variant="secondary"
          size="compact"
          leadingIcon={<Plus />}
          onPress={() => {
            const key = createId('option')
            focusKey.current = key
            setRows((rs) => [...rs, { key, value: '', label: '' }])
          }}
        >
          {l.addOption}
        </Button>
      </section>

      <TextArea label={l.instruction} hint={l.instructionHint} rows={3} value={instruction} onChange={setInstruction} />
      <div className="ty-decision-form__model">
        <NativeSelect
          label={l.provider}
          options={[{ value: '', label: l.none }, ...providers.map((p) => ({ value: p.id, label: p.name }))]}
          value={provider}
          onChange={(p) => {
            setProvider(p)
            if (model && !models.some((m) => m.id === model && (!m.provider || m.provider === p))) setModel('')
          }}
        />
        <NativeSelect label={l.model} options={[{ value: '', label: l.none }, ...shownModels.map((m) => ({ value: m.id, label: m.name ?? m.id }))]} value={model} onChange={setModel} />
        <TextField className="ty-ltr-text ty-mono" label={l.modelVersion} hint={l.modelVersionHint} value={modelVersion} onChange={setModelVersion} />
      </div>
      <div className="ty-decision-form__model">
        <TextField className="ty-ltr-text" label={l.outputVariable} value={outputVariable} onChange={setOutputVariable} />
        <TextField
          inputType="number"
          label={l.threshold}
          hint={l.thresholdHint}
          value={threshold}
          onChange={setThreshold}
          {...(v.threshold ? { errorMessage: l.thresholdInvalid } : {})}
        />
      </div>
      <NodeFormFooter onSave={save} onCancel={onCancel} saveDisabled={!valid} disabledReasonId={reasonId} labels={{ save: l.save, cancel: l.cancel }} />
    </div>
  )
}
