// ComputeNodeForm: a compute step whose logic is one expression tree, edited
// visually or as structured text, with an optional dry run on sample data.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { FlaskConical } from 'lucide-react'
import { Button, InlineNotice, SegmentedControl, TextArea, TextField } from '@fakhir/design-system'
import { NodeFormFooter } from '../forms/NodeFormFooter'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useExpressionCatalog } from './catalogContext'
import { ExpressionBuilder, type ExpressionBuilderLabels } from './ExpressionBuilder'
import {
  EXPRESSION_FAMILIES,
  FLOW_INPUTS_REF,
  parseExpressionText,
  pickerEntries,
  prettyJson,
  seedOperation,
  type ExpressionCatalog,
  type ExpressionNode,
  type ExpressionTextError,
  type OperationNode,
} from './model'
import type { TraceReport } from './trace'
import { TraceTree, type TraceTreeLabels } from './TraceTree'

export interface ComputeNodeConfig {
  kind: 'compute'
  expression?: ExpressionNode
  [key: string]: unknown
}

/** Keys of the earlier script-based compute step, dropped on load. */
export const LEGACY_SCRIPT_KEYS = ['script', 'code', 'language', 'runtime'] as const

/** Seeded into a blank document: hands the flow's inputs through unchanged. */
export const PASS_THROUGH: OperationNode = { operation: 'identity', value: { ref: FLOW_INPUTS_REF } }

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

export function textErrorMessage(error: ExpressionTextError, l: { unparseable: string; missingOperation: string; unknownOperation: string }, locale?: string): string | null {
  switch (error.kind) {
    case 'empty':
      return null
    case 'unparseable':
      return fill(l.unparseable, { detail: error.detail }, locale)
    case 'missing-operation':
      return l.missingOperation
    case 'unknown-operation':
      return fill(l.unknownOperation, { name: error.operation }, locale)
  }
}

function parseSample(text: string): { ok: true; value: Record<string, unknown> | undefined } | { ok: false; detail: string } {
  if (!text.trim()) return { ok: true, value: undefined }
  try {
    const v = JSON.parse(text)
    if (!v || typeof v !== 'object' || Array.isArray(v)) return { ok: false, detail: 'object expected' }
    return { ok: true, value: v as Record<string, unknown> }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

function initialExpression(value: Record<string, unknown>): OperationNode {
  const e = value.expression
  return e && typeof e === 'object' && typeof (e as OperationNode).operation === 'string' ? (e as OperationNode) : PASS_THROUGH
}

export function ComputeNodeForm(props: ComputeNodeFormProps) {
  const { value, references = [], onDryRun, onSave, onCancel, examples = defaultComputeExamples } = props
  const l = useLabels(computeNodeFormLabels, props.labels)
  const { locale } = useFlowLocale()
  const { catalog } = useExpressionCatalog(props.catalog)
  const base = useMemo(() => {
    const out: Record<string, unknown> = { ...(value as Record<string, unknown>) }
    for (const k of LEGACY_SCRIPT_KEYS) delete out[k]
    return out
  }, [value])

  const [mode, setMode] = useState<'visual' | 'text'>('visual')
  const [model, setModel] = useState<OperationNode>(() => initialExpression(base))
  const [text, setText] = useState(() => prettyJson(initialExpression(base)))
  const [textError, setTextError] = useState<ExpressionTextError | null>(null)
  const [panel, setPanel] = useState<'operations' | 'references' | 'examples'>('operations')
  const [search, setSearch] = useState('')
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const pendingCaret = useRef<number | null>(null)

  const [testOpen, setTestOpen] = useState(false)
  const [inputsText, setInputsText] = useState('')
  const [outputsText, setOutputsText] = useState('')
  const [test, setTest] = useState<{ state: 'idle' } | { state: 'running' } | { state: 'done'; trace: TraceReport } | { state: 'error'; message: string }>({ state: 'idle' })

  const allRefs = useMemo(() => [FLOW_INPUTS_REF, ...references.filter((r) => r !== FLOW_INPUTS_REF)], [references])
  const invalid = mode === 'text' && textError !== null

  useEffect(() => {
    if (pendingCaret.current === null || !areaRef.current) return
    const at = pendingCaret.current
    pendingCaret.current = null
    areaRef.current.focus()
    areaRef.current.setSelectionRange(at, at)
  }, [text])

  const applyText = (t: string) => {
    setText(t)
    const r = parseExpressionText(t, catalog)
    if (r.ok) {
      setModel(r.value)
      setTextError(null)
    } else setTextError(r.error)
  }

  const insert = (fragment: string) => {
    const area = areaRef.current
    const blank = !text.trim()
    if (blank) {
      pendingCaret.current = fragment.length
      applyText(fragment)
      return
    }
    const start = area?.selectionStart ?? text.length
    const end = area?.selectionEnd ?? start
    pendingCaret.current = start + fragment.length
    applyText(text.slice(0, start) + fragment + text.slice(end))
  }

  const entries = useMemo(() => pickerEntries(catalog, 'expression'), [catalog])
  const needle = search.trim().toLocaleLowerCase(locale)
  const families = EXPRESSION_FAMILIES.map((f) => ({ family: f, entries: entries.filter((e) => e.family === f && (!needle || e.id.toLocaleLowerCase(locale).includes(needle))) })).filter((g) => g.entries.length)
  const builderLabels = l.builder

  const runTest = async () => {
    if (!onDryRun) return
    const inputs = parseSample(inputsText)
    const outputs = parseSample(outputsText)
    if (!inputs.ok || !outputs.ok) {
      setTest({ state: 'error', message: fill(l.invalidSamples, { detail: (!inputs.ok ? inputs.detail : !outputs.ok ? outputs.detail : '') as string }, locale) })
      return
    }
    setTest({ state: 'running' })
    try {
      const res = await onDryRun({
        config: { ...base, kind: 'compute', expression: model },
        ...(inputs.value ? { inputs: inputs.value } : {}),
        ...(outputs.value ? { nodeOutputs: outputs.value } : {}),
      })
      setTest({ state: 'done', trace: res.trace })
    } catch (e) {
      setTest({ state: 'error', message: fill(l.testFailed, { message: e instanceof Error ? e.message : String(e) }, locale) })
    }
  }

  const errorText = mode === 'text' && textError ? textErrorMessage(textError, l, locale) : null

  return (
    <div className="fk-expr-form" data-form="compute">
      <SegmentedControl
        label={l.editorMode}
        value={mode}
        onChange={(m) => {
          if (m === 'text') {
            setText(prettyJson(model))
            setTextError(null)
          }
          setMode(m as 'visual' | 'text')
        }}
        options={[
          { value: 'visual', label: l.visual },
          { value: 'text', label: l.text },
        ]}
      />
      <div className="fk-expr-form__layout" data-with-panel={mode === 'text' || undefined}>
        {mode === 'visual' ? (
          <ExpressionBuilder label={l.expression} value={model} onChange={(n) => setModel(n as OperationNode)} references={allRefs} {...(props.catalog ? { catalog: props.catalog } : {})} labels={builderLabels} />
        ) : (
          <div className="fk-expr-form__section">
            <TextArea
              ref={areaRef}
              className="fk-expr-form__code"
              label={l.expression}
              hint={l.expressionHint}
              monospace
              rows={12}
              value={text}
              onChange={applyText}
              errorMessage={errorText ?? undefined}
            />
            {!textError ? (
              <p className="fk-expr-form__valid" role="status">
                {l.valid}
              </p>
            ) : null}
          </div>
        )}
        {mode === 'text' ? (
          <div className="fk-expr-form__panel">
            <SegmentedControl
              label={l.referencePanel}
              size="compact"
              value={panel}
              onChange={(p) => setPanel(p as typeof panel)}
              options={[
                { value: 'operations', label: l.operations },
                { value: 'references', label: l.references },
                { value: 'examples', label: l.examples },
              ]}
            />
            {panel === 'operations' ? (
              <>
                <TextField mode="search" label={l.searchOperations} value={search} onChange={setSearch} />
                {families.length ? (
                  families.map((g) => (
                    <section key={g.family} className="fk-expr-form__family" aria-label={fill(l.familyCount, { family: g.family, count: g.entries.length }, locale)}>
                      <h4 className="fk-expr-form__family-title">{fill(l.familyCount, { family: labelOfFamily(builderLabels, g.family), count: g.entries.length }, locale)}</h4>
                      <ul className="fk-expr-form__insert-list">
                        {g.entries.map((e) => (
                          <li key={e.id}>
                            <AriaButton className="fk-expr-form__insert" onPress={() => insert(JSON.stringify(seedOperation(e)))}>
                              <code className="fk-compute__ref" dir="ltr">
                                {e.id}
                              </code>
                            </AriaButton>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))
                ) : (
                  <p className="fk-expr__hint" role="status">
                    {l.noOperations}
                  </p>
                )}
              </>
            ) : panel === 'references' ? (
              <ul className="fk-expr-form__insert-list" aria-label={l.references}>
                {allRefs.map((r) => (
                  <li key={r}>
                    <AriaButton className="fk-expr-form__insert" onPress={() => insert(JSON.stringify({ ref: r }))}>
                      <code className="fk-compute__ref" dir="ltr">
                        {r}
                      </code>
                    </AriaButton>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="fk-expr-form__insert-list" aria-label={l.examples}>
                {examples.map((ex) => (
                  <li key={ex.id}>
                    <AriaButton className="fk-expr-form__insert" onPress={() => insert(prettyJson(ex.expression))}>
                      {l.exampleNames[ex.id] ?? ex.id}
                    </AriaButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {onDryRun ? (
        <div className="fk-expr-form__section">
          <Button variant="secondary" leadingIcon={<FlaskConical />} aria-expanded={testOpen} onPress={() => setTestOpen((o) => !o)}>
            {l.testToggle}
          </Button>
          {testOpen ? (
            <div className="fk-expr-form__test">
              <TextArea className="fk-expr-form__code" label={l.sampleInputs} hint={l.sampleHint} monospace rows={4} value={inputsText} onChange={setInputsText} />
              <TextArea className="fk-expr-form__code" label={l.sampleOutputs} hint={l.sampleHint} monospace rows={4} value={outputsText} onChange={setOutputsText} />
              {invalid ? (
                <InlineNotice tone="warning" urgency="polite">
                  {l.invalidExpression}
                </InlineNotice>
              ) : null}
              <div>
                <Button variant="secondary" busy={test.state === 'running'} busyLabel={l.running} disabled={invalid || test.state === 'running'} onPress={runTest}>
                  {test.state === 'running' ? l.running : l.run}
                </Button>
              </div>
              <div className="fk-expr-form__section" role="region" aria-label={l.results} aria-live="polite" aria-busy={test.state === 'running' || undefined}>
                {test.state === 'error' ? (
                  <InlineNotice tone="danger" urgency="none">
                    {test.message}
                  </InlineNotice>
                ) : null}
                {test.state === 'done' ? <TraceTree report={test.trace} labels={l.trace} /> : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <NodeFormFooter labels={{ save: l.save, cancel: l.cancel }} saveDisabled={invalid} onCancel={onCancel} onSave={() => onSave({ ...base, kind: 'compute', expression: model })} />
    </div>
  )
}

function labelOfFamily(l: Partial<ExpressionBuilderLabels>, family: string): string {
  return (l.families as Record<string, string> | undefined)?.[family] ?? family
}
