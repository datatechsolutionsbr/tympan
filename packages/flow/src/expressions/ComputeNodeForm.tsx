// ComputeNodeForm: the settings of a compute step, whose logic is one
// expression tree edited visually or as JSON text. The pieces live in their
// own modules: computeDraft.ts (tree and text state), ComputeInsertPanel.tsx
// (operations, references and examples to insert at the caret) and
// ComputeTrial.tsx (dry run on sample data). This file wires them together.

import { useMemo, useState, type ReactNode } from 'react'
import { SegmentedControl, TextArea } from '@fakhir/design-system'
import { NodeFormFooter } from '../forms/NodeFormFooter'
import { defineLabels, useFlowLocale, useLabels } from '../internal/labels'
import { useExpressionCatalog } from './catalogContext'
import { ComputeInsertPanel } from './ComputeInsertPanel'
import { ComputeTrial } from './ComputeTrial'
import { openingTree, textErrorMessage, useComputeDraft, withoutScriptKeys } from './computeDraft'
import { ExpressionBuilder, type ExpressionBuilderLabels } from './ExpressionBuilder'
import { FLOW_INPUTS_REF, type ExpressionCatalog, type ExpressionNode, type OperationNode } from './model'
import type { TraceReport } from './trace'
import type { TraceTreeLabels } from './TraceTree'

export { LEGACY_SCRIPT_KEYS, PASS_THROUGH, textErrorMessage } from './computeDraft'

export interface ComputeNodeConfig {
  kind: 'compute'
  expression?: ExpressionNode
  [key: string]: unknown
}

export interface ComputeExample {
  /** Key into labels.examples for the visible name. */
  id: string
  expression: OperationNode
}

/** Examples authored for Fakhir's research census; names come from labels. */
export const defaultComputeExamples: ComputeExample[] = [
  {
    id: 'countConfirmed',
    expression: {
      operation: 'count',
      list: {
        operation: 'filter',
        list: { ref: 'inputs.assertions' },
        where: { operation: 'compare', op: 'eq', left: { ref: 'item.value' }, right: { value: 'confirmed_primary' } },
      },
    },
  },
  {
    id: 'shareProved',
    expression: {
      operation: 'arithmetic',
      op: 'divide',
      left: { operation: 'count', list: { ref: 'inputs.proved' } },
      right: { operation: 'count', list: { ref: 'inputs.assertions' } },
    },
  },
  { id: 'daysSinceRetrieval', expression: { operation: 'days_between', from: { ref: 'retrieval.fetched_at' }, to: { ref: 'inputs.edition_date' } } },
]

export interface ComputeNodeFormLabels {
  editorMode: string
  visual: string
  text: string
  expression: string
  expressionHint: string
  valid: string
  unparseable: string
  missingOperation: string
  unknownOperation: string
  referencePanel: string
  operations: string
  references: string
  examples: string
  searchOperations: string
  familyCount: string
  noOperations: string
  exampleNames: Record<string, string>
  testToggle: string
  sampleInputs: string
  sampleOutputs: string
  sampleHint: string
  run: string
  running: string
  results: string
  invalidExpression: string
  invalidSamples: string
  testFailed: string
  save: string
  cancel: string
  builder: Partial<ExpressionBuilderLabels>
  trace: Partial<TraceTreeLabels>
}

export const computeNodeFormLabels = defineLabels<ComputeNodeFormLabels>('ComputeNodeForm', {
  en: {
    editorMode: 'Editor',
    visual: 'Visual',
    text: 'Structured text',
    expression: 'Expression',
    expressionHint: 'One expression tree with an operation at its root.',
    valid: 'The expression is valid.',
    unparseable: 'The text could not be read: {detail}',
    missingOperation: 'The root must name an operation.',
    unknownOperation: '{name} is not an operation of the engine.',
    referencePanel: 'Reference',
    operations: 'Operations',
    references: 'References',
    examples: 'Examples',
    searchOperations: 'Search operations',
    familyCount: '{family} ({count, number})',
    noOperations: 'No operation matches.',
    exampleNames: {
      countConfirmed: 'Count assertions coded as confirmed',
      shareProved: 'Share of proved assertions',
      daysSinceRetrieval: 'Days between retrieval and edition',
    },
    testToggle: 'Test with sample data',
    sampleInputs: 'Sample flow inputs',
    sampleOutputs: 'Sample upstream outputs',
    sampleHint: 'Structured data; leave blank for none.',
    run: 'Run test',
    running: 'Running',
    results: 'Test result',
    invalidExpression: 'Fix the expression before testing it.',
    invalidSamples: 'The sample data could not be read: {detail}',
    testFailed: 'The test failed: {message}',
    save: 'Save',
    cancel: 'Cancel',
    builder: {},
    trace: {},
  },
  'pt-BR': {
    editorMode: 'Editor',
    visual: 'Visual',
    text: 'Texto estruturado',
    expression: 'Expressão',
    expressionHint: 'Uma árvore de expressão com uma operação na raiz.',
    valid: 'A expressão é válida.',
    unparseable: 'Não foi possível ler o texto: {detail}',
    missingOperation: 'A raiz precisa indicar uma operação.',
    unknownOperation: '{name} não é uma operação do motor.',
    referencePanel: 'Consulta',
    operations: 'Operações',
    references: 'Referências',
    examples: 'Exemplos',
    searchOperations: 'Buscar operações',
    familyCount: '{family} ({count, number})',
    noOperations: 'Nenhuma operação corresponde.',
    exampleNames: {
      countConfirmed: 'Contar asserções codificadas como confirmadas',
      shareProved: 'Proporção de asserções provadas',
      daysSinceRetrieval: 'Dias entre a coleta e a edição',
    },
    testToggle: 'Testar com dados de exemplo',
    sampleInputs: 'Entradas de exemplo do fluxo',
    sampleOutputs: 'Saídas de exemplo das etapas anteriores',
    sampleHint: 'Dado estruturado; deixe em branco para nenhum.',
    run: 'Executar teste',
    running: 'Executando',
    results: 'Resultado do teste',
    invalidExpression: 'Corrija a expressão antes de testá-la.',
    invalidSamples: 'Não foi possível ler os dados de exemplo: {detail}',
    testFailed: 'O teste falhou: {message}',
    save: 'Salvar',
    cancel: 'Cancelar',
    builder: {},
    trace: {},
  },
  es: {
    editorMode: 'Editor',
    visual: 'Visual',
    text: 'Texto estructurado',
    expression: 'Expresión',
    expressionHint: 'Un árbol de expresión con una operación en la raíz.',
    valid: 'La expresión es válida.',
    unparseable: 'No se pudo leer el texto: {detail}',
    missingOperation: 'La raíz debe indicar una operación.',
    unknownOperation: '{name} no es una operación del motor.',
    referencePanel: 'Consulta',
    operations: 'Operaciones',
    references: 'Referencias',
    examples: 'Ejemplos',
    searchOperations: 'Buscar operaciones',
    familyCount: '{family} ({count, number})',
    noOperations: 'Ninguna operación coincide.',
    exampleNames: {
      countConfirmed: 'Contar afirmaciones codificadas como confirmadas',
      shareProved: 'Proporción de afirmaciones probadas',
      daysSinceRetrieval: 'Días entre la recuperación y la edición',
    },
    testToggle: 'Probar con datos de ejemplo',
    sampleInputs: 'Entradas de ejemplo del flujo',
    sampleOutputs: 'Salidas de ejemplo de los pasos anteriores',
    sampleHint: 'Dato estructurado; déjelo en blanco si no hay.',
    run: 'Ejecutar prueba',
    running: 'Ejecutando',
    results: 'Resultado de la prueba',
    invalidExpression: 'Corrija la expresión antes de probarla.',
    invalidSamples: 'No se pudieron leer los datos de ejemplo: {detail}',
    testFailed: 'La prueba falló: {message}',
    save: 'Guardar',
    cancel: 'Cancelar',
    builder: {},
    trace: {},
  },
})
export const defaultComputeNodeFormLabels: ComputeNodeFormLabels = computeNodeFormLabels.bundles.en

export interface ComputeDryRunRequest {
  config: ComputeNodeConfig
  inputs?: Record<string, unknown>
  nodeOutputs?: Record<string, unknown>
}

export interface ComputeNodeFormProps {
  value: ComputeNodeConfig | Record<string, unknown>
  /** Ancestor node ids. */
  references?: string[]
  onDryRun?: (req: ComputeDryRunRequest) => Promise<{ result: unknown; trace: TraceReport }>
  onSave: (config: ComputeNodeConfig) => void
  onCancel: () => void
  catalog?: ExpressionCatalog
  examples?: ComputeExample[]
  labels?: Partial<ComputeNodeFormLabels>
}

type EditorMode = 'visual' | 'text'

export function ComputeNodeForm(props: ComputeNodeFormProps) {
  const words = useLabels(computeNodeFormLabels, props.labels)
  const { locale } = useFlowLocale()
  const { catalog } = useExpressionCatalog(props.catalog)
  const base = useMemo(() => withoutScriptKeys(props.value as Record<string, unknown>), [props.value])
  const draft = useComputeDraft(openingTree(base), catalog)
  const [mode, setMode] = useState<EditorMode>('visual')
  const refs = useMemo(() => [FLOW_INPUTS_REF, ...(props.references ?? []).filter((r) => r !== FLOW_INPUTS_REF)], [props.references])

  const inText = mode === 'text'
  const textBroken = inText && draft.problem !== null
  const toConfig = (): ComputeNodeConfig => ({ ...base, kind: 'compute', expression: draft.tree })

  const editors: Record<EditorMode, () => ReactNode> = {
    visual: () => (
      <ExpressionBuilder label={words.expression} value={draft.tree} onChange={(n) => draft.setTree(n as OperationNode)} references={refs} {...(props.catalog ? { catalog: props.catalog } : {})} labels={words.builder} />
    ),
    text: () => {
      const error = draft.problem ? textErrorMessage(draft.problem, words, locale) : null
      return (
        <div className="fk-expr-form__section">
          <TextArea ref={draft.textArea} className="fk-expr-form__code" label={words.expression} hint={words.expressionHint} monospace rows={12} value={draft.text} onChange={draft.editText} errorMessage={error ?? undefined} />
          {draft.problem ? null : (
            <p className="fk-expr-form__valid" role="status">
              {words.valid}
            </p>
          )}
        </div>
      )
    },
  }

  const panel = inText ? (
    <ComputeInsertPanel
      catalog={catalog}
      refs={refs}
      examples={props.examples ?? defaultComputeExamples}
      words={{ ...words, familyNames: words.builder.families as Record<string, string> | undefined }}
      locale={locale}
      onPick={draft.splice}
    />
  ) : null

  const onDryRun = props.onDryRun
  return (
    <div className="fk-expr-form" data-form="compute">
      <SegmentedControl
        label={words.editorMode}
        value={mode}
        onChange={(next) => {
          if (next === 'text') draft.reprint()
          setMode(next as EditorMode)
        }}
        options={(['visual', 'text'] as const).map((m) => ({ value: m, label: words[m] }))}
      />
      <div className="fk-expr-form__layout" data-with-panel={inText || undefined}>
        {editors[mode]()}
        {panel}
      </div>
      {onDryRun ? <ComputeTrial words={words} locale={locale} blocked={textBroken} launch={async (samples) => (await onDryRun({ config: toConfig(), ...samples })).trace} /> : null}
      <NodeFormFooter labels={{ save: words.save, cancel: words.cancel }} saveDisabled={textBroken} onCancel={props.onCancel} onSave={() => props.onSave(toConfig())} />
    </div>
  )
}
