// DecisionNode (backlog B-002): a model reads an input state and chooses one
// of the declared options. Before a run the card shows what is read, how many
// options exist and who decides (provider · model · version); after a run it
// shows the chosen value and each option's probability as text, with a bar
// that only repeats the number.

import { useId } from 'react'
import { Target, TriangleAlert } from 'lucide-react'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { FlowNode, LayoutDirection } from '../model/types'
import { useNodeResult } from '../state/editorState'
import { ConnectionPorts } from '../nodes/ConnectionPorts'
import { GraphNodeCard, type CardDensity } from '../nodes/GraphNodeCard'
import { useKindPresentation } from '../nodes/nodeChrome'
import { NodeRunIndicator, useRunWords } from '../nodes/NodeRunIndicator'
import { rankedOptions, type DecisionConfig, type DecisionResult } from './types'

export interface DecisionNodeLabels {
  kind: string
  title: string
  input: string
  options: string
  decidedBy: string
  version: string
  chosen: string
  probabilities: string
  probability: string
  needsReview: string
  notConfigured: string
  remove: string
}

export const decisionNodeLabels = defineLabels<DecisionNodeLabels>('decisionNode', {
  en: {
    kind: 'decision',
    title: 'Decision',
    input: 'reads {ref}',
    options: '{count, plural, =0 {no options} one {# option} other {# options}}',
    decidedBy: 'decided by',
    version: 'version {version}',
    chosen: 'chosen: {value}',
    probabilities: 'Probability of each option',
    probability: '{label}: {percent}',
    needsReview: 'Needs review: no option is clear enough',
    notConfigured: 'Choose the input and at least two options.',
    remove: 'Remove {title}',
  },
  'pt-BR': {
    kind: 'decisão',
    title: 'Decisão',
    input: 'lê {ref}',
    options: '{count, plural, =0 {nenhuma opção} one {# opção} other {# opções}}',
    decidedBy: 'decidido por',
    version: 'versão {version}',
    chosen: 'escolha: {value}',
    probabilities: 'Probabilidade de cada opção',
    probability: '{label}: {percent}',
    needsReview: 'Precisa de revisão: nenhuma opção é clara o bastante',
    notConfigured: 'Escolha a entrada e pelo menos duas opções.',
    remove: 'Remover {title}',
  },
  es: {
    kind: 'decisión',
    title: 'Decisión',
    input: 'lee {ref}',
    options: '{count, plural, =0 {ninguna opción} one {# opción} other {# opciones}}',
    decidedBy: 'decidido por',
    version: 'versión {version}',
    chosen: 'elegido: {value}',
    probabilities: 'Probabilidad de cada opción',
    probability: '{label}: {percent}',
    needsReview: 'Requiere revisión: ninguna opción es lo bastante clara',
    notConfigured: 'Elige la entrada y al menos dos opciones.',
    remove: 'Quitar {title}',
  },
})
export const defaultDecisionNodeLabels = decisionNodeLabels.bundles.en

/** A run result that has the decision shape. */
export function isDecisionResult(x: unknown): x is DecisionResult {
  return !!x && typeof x === 'object' && typeof (x as DecisionResult).value === 'string' && typeof (x as DecisionResult).probabilities === 'object'
}

export interface DecisionNodeProps {
  id: string
  config: DecisionConfig | null
  /** Outcome to show; defaults to the node's run result when it has the decision shape. */
  result?: DecisionResult
  label?: string
  density?: CardDensity
  onConfigure?: (id: string) => void
  onRemove?: (id: string) => void
  selected?: boolean
  locked?: boolean
  preview?: boolean
  direction?: LayoutDirection
  labels?: Partial<DecisionNodeLabels>
}

export function DecisionNode(props: DecisionNodeProps) {
  const { id, config, label, density = 'detailed', onConfigure, onRemove, selected = false, locked = false, preview = false, direction = 'right' } = props
  const l = useLabels(decisionNodeLabels, props.labels)
  const { locale } = useFlowLocale()
  const listId = useId()
  const node: FlowNode = { id, kind: 'decision', position: { x: 0, y: 0 }, data: {} }
  const k = useKindPresentation(node, direction)
  const run = useRunWords(id)
  const live = useNodeResult(id)
  const result = props.result ?? (isDecisionResult(live?.data) ? live.data : undefined)
  const title = label ?? l.title
  const configured = !!config && !!config.input.ref && config.options.length >= 2
  const canEdit = !preview && !locked
  const pct = (p: number) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(p)
  const optionLabel = (value: string) => config?.options.find((o) => o.value === value)?.label ?? value
  const who = result ? [result.provider, result.model].filter(Boolean).join(' · ') : [config?.provider, config?.model].filter(Boolean).join(' · ')
  const version = result?.modelVersion ?? config?.modelVersion
  const words = [
    result ? fill(l.chosen, { value: optionLabel(result.value) }, locale) : null,
    result?.needsReview ? l.needsReview : null,
    run.words,
  ].filter((w): w is string => !!w)

  const meta = configured ? (
    <div className="fk-decision-node__meta">
      <span className="fk-decision-node__input">{fill(l.input, { ref: config!.input.ref }, locale)}</span>
      <span>{fill(l.options, { count: config!.options.length }, locale)}</span>
      {who || version ? (
        <span className="fk-decision-node__model">
          <span className="fk-visually-hidden">{l.decidedBy} </span>
          {who ? <code>{who}</code> : null}
          {version ? <code>{fill(l.version, { version }, locale)}</code> : null}
        </span>
      ) : null}
      {result ? (
        <div className="fk-decision-node__result">
          <p className="fk-decision-node__chosen">{fill(l.chosen, { value: optionLabel(result.value) }, locale)}</p>
          {result.needsReview ? (
            <p className="fk-decision-node__review">
              <TriangleAlert aria-hidden="true" focusable="false" />
              {l.needsReview}
            </p>
          ) : null}
          <ul className="fk-decision-node__probabilities" aria-label={l.probabilities} id={listId}>
            {rankedOptions(result, config!.options).map((o) => (
              <li key={o.value} className="fk-decision-node__option" data-chosen={o.value === result.value ? 'true' : undefined}>
                <span className="fk-decision-node__option-text">{fill(l.probability, { label: o.label, percent: o.probability === null ? '?' : pct(o.probability) }, locale)}</span>
                <span className="fk-decision-node__bar" aria-hidden="true">
                  <span className="fk-decision-node__bar-fill" style={{ inlineSize: `${Math.round((o.probability ?? 0) * 100)}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  ) : undefined

  return (
    <GraphNodeCard
      kind="decision"
      kindLabel={l.kind}
      title={title}
      icon={<Target />}
      tone={k.tone}
      width="wide"
      density={density}
      selected={selected}
      locked={locked}
      runState={run.runState}
      problem={configured ? false : l.notConfigured}
      stateWords={words}
      {...(onConfigure && (canEdit || preview) ? { onActivate: () => onConfigure(id) } : {})}
      {...(onRemove && canEdit ? { onDelete: () => onRemove(id) } : {})}
      labels={{ remove: l.remove }}
      meta={meta}
      className="fk-flow-node fk-decision-node"
    >
      <ConnectionPorts nodeId={id} nodeLabel={title} inputs={k.inputs} outputs={k.outputs} tone={k.tone} preview={preview} />
      <NodeRunIndicator nodeId={id} kind="decision" nodeLabel={title} />
    </GraphNodeCard>
  )
}
