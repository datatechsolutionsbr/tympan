// ComputeNodeForm: the settings of a compute step, whose whole logic is one
// expression tree. The tree is edited with the visual builder or as JSON text
// (with a side panel to insert operations, references and examples at the
// caret), and can be tried on sample data when the host offers a dry run.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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

type ErrorWords = { unparseable: string; missingOperation: string; unknownOperation: string }

const ERROR_TEXT: { [K in ExpressionTextError['kind']]: (e: Extract<ExpressionTextError, { kind: K }>, w: ErrorWords, locale?: string) => string | null } = {
  empty: () => null,
  unparseable: (e, w, locale) => fill(w.unparseable, { detail: e.detail }, locale),
  'missing-operation': (_e, w) => w.missingOperation,
  'unknown-operation': (e, w, locale) => fill(w.unknownOperation, { name: e.operation }, locale),
}

/** Sentence for a text problem; null for an empty document (no message). */
export function textErrorMessage(error: ExpressionTextError, l: ErrorWords, locale?: string): string | null {
  return (ERROR_TEXT[error.kind] as (e: ExpressionTextError, w: ErrorWords, locale?: string) => string | null)(error, l, locale)
}

/** Sample data text: blank is "none", otherwise it must be a JSON object. */
function readSample(text: string): { sample?: Record<string, unknown> } | { problem: string } {
  if (!text.trim()) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (why) {
    return { problem: why instanceof Error ? why.message : String(why) }
  }
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { sample: parsed as Record<string, unknown> } : { problem: 'object expected' }
}

const startingTree = (config: Record<string, unknown>): OperationNode => {
  const tree = config.expression as OperationNode | undefined
  return tree && typeof tree === 'object' && typeof tree.operation === 'string' ? tree : PASS_THROUGH
}

/**
 * The expression as both a tree and its JSON text. Text edits re-parse and
 * move the tree only when valid; `insertAtCaret` splices a fragment where the
 * caret is and puts the caret after it.
 */
function useExpressionDraft(start: OperationNode, catalog: ExpressionCatalog | undefined) {
  const [tree, setTree] = useState(start)
  const [text, setTextRaw] = useState(() => prettyJson(start))
  const [problem, setProblem] = useState<ExpressionTextError | null>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const caretAfter = useRef<number | null>(null)

  useEffect(() => {
    const el = area.current
    const at = caretAfter.current
    if (at === null || !el) return
    caretAfter.current = null
    el.focus()
    el.setSelectionRange(at, at)
  }, [text])

  const setText = (next: string) => {
    setTextRaw(next)
    const read = parseExpressionText(next, catalog)
    setProblem(read.ok ? null : read.error)
    if (read.ok) setTree(read.value)
  }
  const insertAtCaret = (fragment: string) => {
    if (!text.trim()) {
      caretAfter.current = fragment.length
      return setText(fragment)
    }
    const from = area.current?.selectionStart ?? text.length
    const to = area.current?.selectionEnd ?? from
    caretAfter.current = from + fragment.length
    setText(`${text.slice(0, from)}${fragment}${text.slice(to)}`)
  }
  const resync = () => {
    setTextRaw(prettyJson(tree))
    setProblem(null)
  }
  return { tree, setTree, text, setText, problem, area, insertAtCaret, resync }
}

type PanelView = 'operations' | 'references' | 'examples'

function InsertButton({ onInsert, children }: { onInsert: () => void; children: ReactNode }) {
  return (
    <li>
      <AriaButton className="fk-expr-form__insert" onPress={onInsert}>
        {children}
      </AriaButton>
    </li>
  )
}

const code = (text: string) => (
  <code className="fk-compute__ref" dir="ltr">
    {text}
  </code>
)

function ReferencePanel({ catalog, refs, examples, l, locale, insert }: { catalog: ExpressionCatalog | undefined; refs: string[]; examples: ComputeExample[]; l: ComputeNodeFormLabels; locale: string; insert: (fragment: string) => void }) {
  const [view, setView] = useState<PanelView>('operations')
  const [query, setQuery] = useState('')
  const all = useMemo(() => pickerEntries(catalog, 'expression'), [catalog])
  const familyName = (f: string) => (l.builder.families as Record<string, string> | undefined)?.[f] ?? f
  const wanted = query.trim().toLocaleLowerCase(locale)
  const groups = EXPRESSION_FAMILIES.flatMap((family) => {
    const hits = all.filter((e) => e.family === family && (!wanted || e.id.toLocaleLowerCase(locale).includes(wanted)))
    return hits.length ? [{ family, hits }] : []
  })

  const views: Record<PanelView, () => ReactNode> = {
    operations: () => (
      <>
        <TextField mode="search" label={l.searchOperations} value={query} onChange={setQuery} />
        {groups.length === 0 ? (
          <p className="fk-expr__hint" role="status">
            {l.noOperations}
          </p>
        ) : (
          groups.map(({ family, hits }) => (
            <section key={family} className="fk-expr-form__family" aria-label={fill(l.familyCount, { family, count: hits.length }, locale)}>
              <h4 className="fk-expr-form__family-title">{fill(l.familyCount, { family: familyName(family), count: hits.length }, locale)}</h4>
              <ul className="fk-expr-form__insert-list">
                {hits.map((e) => (
                  <InsertButton key={e.id} onInsert={() => insert(JSON.stringify(seedOperation(e)))}>
                    {code(e.id)}
                  </InsertButton>
                ))}
              </ul>
            </section>
          ))
        )}
      </>
    ),
    references: () => (
      <ul className="fk-expr-form__insert-list" aria-label={l.references}>
        {refs.map((r) => (
          <InsertButton key={r} onInsert={() => insert(JSON.stringify({ ref: r }))}>
            {code(r)}
          </InsertButton>
        ))}
      </ul>
    ),
    examples: () => (
      <ul className="fk-expr-form__insert-list" aria-label={l.examples}>
        {examples.map((ex) => (
          <InsertButton key={ex.id} onInsert={() => insert(prettyJson(ex.expression))}>
            {l.exampleNames[ex.id] ?? ex.id}
          </InsertButton>
        ))}
      </ul>
    ),
  }

  return (
    <div className="fk-expr-form__panel">
      <SegmentedControl
        label={l.referencePanel}
        size="compact"
        value={view}
        onChange={(v) => setView(v as PanelView)}
        options={(['operations', 'references', 'examples'] as const).map((v) => ({ value: v, label: l[v] }))}
      />
      {views[view]()}
    </div>
  )
}

type Trial = { at: 'idle' } | { at: 'running' } | { at: 'done'; trace: TraceReport } | { at: 'failed'; message: string }

function DryRunPanel({ l, locale, blocked, launch }: { l: ComputeNodeFormLabels; locale: string; blocked: boolean; launch: (samples: { inputs?: Record<string, unknown>; nodeOutputs?: Record<string, unknown> }) => Promise<TraceReport> }) {
  const [shown, setShown] = useState(false)
  const [inputsText, setInputsText] = useState('')
  const [outputsText, setOutputsText] = useState('')
  const [trial, setTrial] = useState<Trial>({ at: 'idle' })
  const running = trial.at === 'running'

  const go = async () => {
    const inputs = readSample(inputsText)
    const outputs = readSample(outputsText)
    const bad = 'problem' in inputs ? inputs.problem : 'problem' in outputs ? outputs.problem : null
    if (bad !== null) return setTrial({ at: 'failed', message: fill(l.invalidSamples, { detail: bad }, locale) })
    setTrial({ at: 'running' })
    try {
      const trace = await launch({ ...('sample' in inputs && inputs.sample ? { inputs: inputs.sample } : {}), ...('sample' in outputs && outputs.sample ? { nodeOutputs: outputs.sample } : {}) })
      setTrial({ at: 'done', trace })
    } catch (why) {
      setTrial({ at: 'failed', message: fill(l.testFailed, { message: why instanceof Error ? why.message : String(why) }, locale) })
    }
  }

  return (
    <div className="fk-expr-form__section">
      <Button variant="secondary" leadingIcon={<FlaskConical />} aria-expanded={shown} onPress={() => setShown((v) => !v)}>
        {l.testToggle}
      </Button>
      {shown && (
        <div className="fk-expr-form__test">
          <TextArea className="fk-expr-form__code" label={l.sampleInputs} hint={l.sampleHint} monospace rows={4} value={inputsText} onChange={setInputsText} />
          <TextArea className="fk-expr-form__code" label={l.sampleOutputs} hint={l.sampleHint} monospace rows={4} value={outputsText} onChange={setOutputsText} />
          {blocked && (
            <InlineNotice tone="warning" urgency="polite">
              {l.invalidExpression}
            </InlineNotice>
          )}
          <div>
            <Button variant="secondary" busy={running} busyLabel={l.running} disabled={blocked || running} onPress={go}>
              {running ? l.running : l.run}
            </Button>
          </div>
          <div className="fk-expr-form__section" role="region" aria-label={l.results} aria-live="polite" aria-busy={running || undefined}>
            {trial.at === 'failed' && (
              <InlineNotice tone="danger" urgency="none">
                {trial.message}
              </InlineNotice>
            )}
            {trial.at === 'done' && <TraceTree report={trial.trace} labels={l.trace} />}
          </div>
        </div>
      )}
    </div>
  )
}

export function ComputeNodeForm(props: ComputeNodeFormProps) {
  const { value, references = [], onDryRun, onSave, onCancel, examples = defaultComputeExamples } = props
  const l = useLabels(computeNodeFormLabels, props.labels)
  const { locale } = useFlowLocale()
  const { catalog } = useExpressionCatalog(props.catalog)
  /** The incoming configuration without the keys of the old script-based step. */
  const kept = useMemo(() => Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([k]) => !(LEGACY_SCRIPT_KEYS as readonly string[]).includes(k))), [value])
  const draft = useExpressionDraft(startingTree(kept), catalog)
  const [asText, setAsText] = useState(false)
  const refs = useMemo(() => [FLOW_INPUTS_REF, ...references.filter((r) => r !== FLOW_INPUTS_REF)], [references])
  const blocked = asText && draft.problem !== null
  const configOf = (): ComputeNodeConfig => ({ ...kept, kind: 'compute', expression: draft.tree })
  const message = asText && draft.problem ? textErrorMessage(draft.problem, l, locale) : null

  const editor = asText ? (
    <div className="fk-expr-form__section">
      <TextArea ref={draft.area} className="fk-expr-form__code" label={l.expression} hint={l.expressionHint} monospace rows={12} value={draft.text} onChange={draft.setText} errorMessage={message ?? undefined} />
      {draft.problem === null && (
        <p className="fk-expr-form__valid" role="status">
          {l.valid}
        </p>
      )}
    </div>
  ) : (
    <ExpressionBuilder label={l.expression} value={draft.tree} onChange={(n) => draft.setTree(n as OperationNode)} references={refs} {...(props.catalog ? { catalog: props.catalog } : {})} labels={l.builder} />
  )

  return (
    <div className="fk-expr-form" data-form="compute">
      <SegmentedControl
        label={l.editorMode}
        value={asText ? 'text' : 'visual'}
        onChange={(m) => {
          if (m === 'text') draft.resync()
          setAsText(m === 'text')
        }}
        options={[
          { value: 'visual', label: l.visual },
          { value: 'text', label: l.text },
        ]}
      />
      <div className="fk-expr-form__layout" data-with-panel={asText || undefined}>
        {editor}
        {asText && <ReferencePanel catalog={catalog} refs={refs} examples={examples} l={l} locale={locale} insert={draft.insertAtCaret} />}
      </div>
      {onDryRun && <DryRunPanel l={l} locale={locale} blocked={blocked} launch={async (samples) => (await onDryRun({ config: configOf(), ...samples })).trace} />}
      <NodeFormFooter labels={{ save: l.save, cancel: l.cancel }} saveDisabled={blocked} onCancel={onCancel} onSave={() => onSave(configOf())} />
    </div>
  )
}
