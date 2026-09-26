// SimulationNodeForm: a repeated-sampling step (how many runs, how many steps
// per run, the starting state, the transition) plus the values tracked per
// step. Each expression field always has a root operation: bare values are
// wrapped in a "first non-empty value" operation with that single candidate.

import { useState } from 'react'
import { TextArea } from '@fakhir/ui'
import { NodeFormFooter } from '../forms/NodeFormFooter'
import { defineLabels, useLabels } from '../internal/labels'
import { ExpressionField, type ExpressionFieldLabels } from './ExpressionField'
import { FLOW_INPUTS_REF, isOperation, prettyJson, type ExpressionCatalog, type ExpressionNode, type OperationNode } from './model'

export type SimulationField = 'runs' | 'steps' | 'initialState' | 'step'
export const SIMULATION_FIELDS: readonly SimulationField[] = ['runs', 'steps', 'initialState', 'step']

/** Operation used to give a bare value a root operation (same meaning). */
export const FIRST_NON_EMPTY = 'coalesce'

/** References the transition may use besides flow inputs and ancestors. */
export const SIMULATION_STEP_REFS = ['state', 'run_index', 'step_index'] as const

export interface SimulationNodeConfig {
  kind: 'simulation'
  runs: ExpressionNode
  steps: ExpressionNode
  initialState: ExpressionNode
  step: ExpressionNode
  tracking: string[]
  [key: string]: unknown
}

export interface SimulationNodeFormLabels {
  runs: string
  runsHint: string
  steps: string
  stepsHint: string
  initialState: string
  initialStateHint: string
  step: string
  stepHint: string
  tracking: string
  trackingHint: string
  trackingInvalid: string
  field: Partial<ExpressionFieldLabels>
  save: string
  cancel: string
}

export const simulationNodeFormLabels = defineLabels<SimulationNodeFormLabels>('SimulationNodeForm', {
  en: {
    runs: 'Number of runs',
    runsHint: 'How many independent runs to sample.',
    steps: 'Steps per run',
    stepsHint: 'How many steps each run takes.',
    initialState: 'Initial state',
    initialStateHint: 'The state every run starts from.',
    step: 'Step transition',
    stepHint: 'The next state; may use the current state, the run index and the step index.',
    tracking: 'Tracked values',
    trackingHint: 'A list (structured text) of the values recorded at each step.',
    trackingInvalid: 'Tracked values must be a list.',
    field: {},
    save: 'Save',
    cancel: 'Cancel',
  },
  'pt-BR': {
    runs: 'Número de execuções',
    runsHint: 'Quantas execuções independentes amostrar.',
    steps: 'Passos por execução',
    stepsHint: 'Quantos passos cada execução dá.',
    initialState: 'Estado inicial',
    initialStateHint: 'O estado de onde toda execução parte.',
    step: 'Transição do passo',
    stepHint: 'O próximo estado; pode usar o estado atual, o índice da execução e o índice do passo.',
    tracking: 'Valores acompanhados',
    trackingHint: 'Uma lista (texto estruturado) dos valores registrados a cada passo.',
    trackingInvalid: 'Os valores acompanhados precisam ser uma lista.',
    field: {},
    save: 'Salvar',
    cancel: 'Cancelar',
  },
  es: {
    runs: 'Número de ejecuciones',
    runsHint: 'Cuántas ejecuciones independientes muestrear.',
    steps: 'Pasos por ejecución',
    stepsHint: 'Cuántos pasos da cada ejecución.',
    initialState: 'Estado inicial',
    initialStateHint: 'El estado desde el que parte cada ejecución.',
    step: 'Transición del paso',
    stepHint: 'El siguiente estado; puede usar el estado actual, el índice de ejecución y el índice de paso.',
    tracking: 'Valores seguidos',
    trackingHint: 'Una lista (texto estructurado) de los valores registrados en cada paso.',
    trackingInvalid: 'Los valores seguidos deben ser una lista.',
    field: {},
    save: 'Guardar',
    cancel: 'Cancelar',
  },
})

export const defaultSimulationNodeFormLabels: SimulationNodeFormLabels = simulationNodeFormLabels.bundles.en

/** A tree for the visual builder: operations as they are, anything else wrapped. */
export function seedSimulationField(value: unknown): OperationNode {
  if (isOperation(value)) return value
  const candidate = value && typeof value === 'object' && !Array.isArray(value) && ('ref' in value || 'value' in value) ? value : { value: value ?? null }
  return { operation: FIRST_NON_EMPTY, values: [candidate] }
}

export interface SimulationNodeFormProps {
  /** Each expression field is an expression tree or a bare literal. */
  value: Partial<Record<SimulationField, unknown>> & { tracking?: string[] } & Record<string, unknown>
  references?: string[]
  defaults?: Partial<Record<SimulationField, unknown>>
  catalog?: ExpressionCatalog
  onSave: (value: SimulationNodeConfig) => void
  onCancel: () => void
  labels?: Partial<SimulationNodeFormLabels>
}

export function SimulationNodeForm({ value, references = [], defaults = {}, catalog, onSave, onCancel, labels }: SimulationNodeFormProps) {
  const l = useLabels(simulationNodeFormLabels, labels)
  const [fields, setFields] = useState<Record<SimulationField, ExpressionNode>>(() => {
    const out = {} as Record<SimulationField, ExpressionNode>
    for (const f of SIMULATION_FIELDS) out[f] = seedSimulationField(value[f] !== undefined ? value[f] : (defaults[f] ?? null))
    return out
  })
  const [trackingText, setTrackingText] = useState(() => prettyJson(Array.isArray(value.tracking) ? value.tracking : []))
  const [tracking, setTracking] = useState<string[]>(() => (Array.isArray(value.tracking) ? value.tracking : []))
  const [trackingError, setTrackingError] = useState(false)
  const baseRefs = [FLOW_INPUTS_REF, ...references.filter((r) => r !== FLOW_INPUTS_REF)]

  const save = () => onSave({ ...value, kind: 'simulation', ...fields, tracking })

  return (
    <div className="fk-node-form fk-expr-form" data-form="simulation">
      {SIMULATION_FIELDS.map((f) => (
        <ExpressionField
          key={f}
          label={l[f]}
          hint={l[`${f}Hint` as const]}
          value={fields[f]}
          onChange={(n) => setFields((prev) => ({ ...prev, [f]: n }))}
          references={f === 'step' ? [...baseRefs, ...SIMULATION_STEP_REFS] : baseRefs}
          acceptLeaves
          labels={l.field}
          {...(catalog ? { catalog } : {})}
        />
      ))}
      <TextArea
        className="fk-expr-form__code"
        label={l.tracking}
        hint={l.trackingHint}
        monospace
        rows={3}
        value={trackingText}
        onChange={(t) => {
          setTrackingText(t)
          try {
            const v = JSON.parse(t) as unknown
            if (Array.isArray(v)) {
              setTracking(v.map(String))
              setTrackingError(false)
              return
            }
          } catch {
            /* fall through to the error */
          }
          setTrackingError(true)
        }}
        {...(trackingError ? { errorMessage: l.trackingInvalid } : {})}
      />
      <NodeFormFooter onSave={save} onCancel={onCancel} labels={{ save: l.save, cancel: l.cancel }} />
    </div>
  )
}
