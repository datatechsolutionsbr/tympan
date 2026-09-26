// FlowSidePanel: the editor's inline-end panel. With nothing selected it
// sums the flow up (version, the edition it runs on, steps, AI use,
// determinism, citable outputs by shape) with "run" and "validate"; with a
// step selected it shows the step's settings, a preview of its output and
// "test" / "remove".

import { ArrowRight, Check, Ellipsis } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ActionMenu, Button, ListboxSelect, TextField } from '@fakhir/design-system'
import { fill, useFlowLocale, useLabels } from '../internal/labels'
import type { FlowNode } from '../model/types'
import { ShapeFlow } from './ShapeChip'
import { researchStepWords, specOfNode, type ReadyStep, type StepField } from './researchSteps'
import { shapeCounts, type DataShape } from './shapes'
import { useSteps } from './StepsContext'

/** Facts about the flow the host knows (the editor counts the rest). */
export interface FlowFacts {
  /** The flow's name (panel title). */
  name?: string
  /** Version and state, as the host words it ("v3 · draft"). */
  version?: string
  /** What it runs on ("edition 2026-09-20"). */
  runsOn?: string
  runsOverEdition?: number
  deterministic?: boolean
  seed?: string | number
}

/** A few rows of a step's output. */
export interface OutputPreview {
  columns: readonly string[]
  rows: ReadonlyArray<ReadonlyArray<string | number>>
}

export interface FlowSidePanelProps {
  nodes: readonly FlowNode[]
  selected: FlowNode | null
  facts?: FlowFacts
  preview?: OutputPreview | null
  locked?: boolean
  /** Result line of the last validation, when there was one. */
  validation?: string | null
  onRunFlow?: () => void
  onValidate: () => void
  onTestStep?: (nodeId: string) => void
  onRemove: (nodeId: string) => void
  onEdit: (nodeId: string, patch: Record<string, unknown>) => void
  onBack: () => void
}

const DRAWN = (n: FlowNode) => n.kind !== 'note' && n.kind !== 'group'

export function FlowSidePanel(p: FlowSidePanelProps) {
  const rt = useSteps()
  const spec = p.selected ? specOfNode(p.selected, rt.byId) : undefined
  return p.selected ? <StepSettings {...p} node={p.selected} spec={spec} /> : <FlowOverview {...p} />
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fk-flow-side__fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function FlowOverview({ nodes, facts = {}, validation, onRunFlow, onValidate }: FlowSidePanelProps) {
  const rt = useSteps()
  const w = rt.words
  const { locale } = useFlowLocale()
  const specs = nodes.filter(DRAWN).map((n) => specOfNode(n, rt.byId))
  const ai = specs.some((s) => s?.usesAI)
  const outputs = specs.filter((s): s is ReadyStep => s?.verb === 'output' && !!s.output).map((s) => s.output as DataShape)
  const num = (v: number) => new Intl.NumberFormat(locale).format(v)
  return (
    <section className="fk-flow-side" aria-labelledby="fk-flow-side-title">
      <span className="fk-flow-side__eyebrow">{w.eyebrowFlow}</span>
      <h2 id="fk-flow-side-title" className="fk-flow-side__title">
        {facts.name ?? w.summaryTitle}
      </h2>
      <dl className="fk-flow-side__facts">
        {facts.version ? <Fact label={w.version} value={facts.version} /> : null}
        {facts.runsOn ? <Fact label={w.runsOn} value={facts.runsOn} /> : null}
        {facts.runsOverEdition !== undefined ? <Fact label={w.runs} value={num(facts.runsOverEdition)} /> : null}
        <Fact label={w.stepCount} value={num(specs.length)} />
        <Fact label={w.usesAI} value={ai ? w.yes : w.no} />
        {facts.deterministic !== undefined ? (
          <Fact label={w.deterministic} value={[facts.deterministic ? w.yes : w.no, facts.seed !== undefined ? fill(w.seed, { seed: String(facts.seed) }, locale) : null].filter(Boolean).join(' · ')} />
        ) : null}
        <Fact label={w.citable} value={outputs.length ? shapeCounts(outputs, rt.counts, locale) : w.none} />
      </dl>
      <div className="fk-flow-side__stack">
        {onRunFlow ? (
          <Button variant="primary" fullWidth leadingIcon={<ArrowRight className="fk-flow-side__arrow" />} onPress={onRunFlow}>
            {w.runFlow}
          </Button>
        ) : null}
        <Button variant="secondary" fullWidth leadingIcon={<Check />} onPress={onValidate}>
          {w.validate}
        </Button>
      </div>
      <p className="fk-flow-side__hint">{w.nothingSelected}</p>
      <p className="fk-flow-side__status" role="status">
        {validation ?? ''}
      </p>
    </section>
  )
}

function StepSettings({ node, spec, preview, locked, onTestStep, onRemove, onEdit, onBack }: FlowSidePanelProps & { node: FlowNode; spec: ReadyStep | undefined }) {
  const rt = useSteps()
  const w = rt.words
  const title = (typeof node.data.label === 'string' && node.data.label) || spec?.name || node.kind
  return (
    <section className="fk-flow-side" aria-labelledby="fk-flow-side-title" data-step={node.id}>
      <div className="fk-flow-side__top">
        <span className="fk-flow-side__eyebrow">{w.eyebrowStep}</span>
        <ActionMenu
          label={w.moreStep}
          trigger={<Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={w.moreStep} leadingIcon={<Ellipsis />} />}
          items={[
            { id: 'back', label: w.backToSummary },
            ...(!locked ? [{ id: 'remove', label: w.remove, tone: 'danger' as const }] : []),
          ]}
          onAction={(id) => (id === 'back' ? onBack() : onRemove(node.id))}
        />
      </div>
      <h2 id="fk-flow-side-title" className="fk-flow-side__title" dir="auto">
        {title}
      </h2>
      {spec && !spec.primitive ? <ShapeFlow inputs={spec.inputs} output={spec.output} words={rt.shapes} labels={w} /> : null}
      <form className="fk-flow-side__form" onSubmit={(e) => e.preventDefault()}>
        {(spec?.fields ?? []).map((f) => (
          <Field key={f.key} field={f} value={node.data[f.key]} disabled={!!locked} onCommit={(v) => onEdit(node.id, { [f.key]: v })} />
        ))}
        <Draft label={w.stepName} value={typeof node.data.label === 'string' ? node.data.label : ''} placeholder={spec?.name ?? ''} disabled={!!locked} onCommit={(v) => onEdit(node.id, { label: v || undefined })} />
      </form>
      <span className="fk-flow-side__eyebrow">{w.preview}</span>
      {preview && preview.rows.length ? (
        <div className="fk-flow-side__preview">
          <table>
            <thead>
              <tr>
                {preview.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td key={j} data-kind={j === 0 ? 'key' : typeof v === 'number' || /^\[?n\]?$/.test(String(v)) ? 'number' : 'value'}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="fk-flow-side__hint">{w.noPreview}</p>
      )}
      {!locked ? (
        <div className="fk-flow-side__row">
          {onTestStep ? (
            <Button variant="secondary" leadingIcon={<ArrowRight className="fk-flow-side__arrow" />} onPress={() => onTestStep(node.id)}>
              {w.testStep}
            </Button>
          ) : null}
          <Button variant="quiet" onPress={() => onRemove(node.id)}>
            {w.remove}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

/** A settings field: a choice, or text / number committed on blur or Enter. */
function Field({ field, value, disabled, onCommit }: { field: StepField; value: unknown; disabled: boolean; onCommit: (v: unknown) => void }) {
  const words = useLabels(researchStepWords, undefined)
  const current = value === undefined || value === null ? '' : String(value)
  const options = useMemo(() => {
    const values = [...(field.options ?? [])]
    if (current && !values.includes(current)) values.unshift(current)
    return values.map((v) => ({ value: v, label: words[`option.${v}`] ?? v }))
  }, [field.options, current, words])
  if (field.type === 'choice') {
    return (
      <div className="fk-flow-side__field">
        <ListboxSelect label={field.label ?? field.key} options={options} value={current || null} disabled={disabled} onChange={(v) => v !== current && onCommit(v)} />
      </div>
    )
  }
  return (
    <Draft
      label={field.label ?? field.key}
      value={current}
      numeric={field.type === 'number'}
      disabled={disabled}
      onCommit={(v) => onCommit(v === '' ? undefined : field.type === 'number' && Number.isFinite(Number(v)) ? Number(v) : v)}
    />
  )
}

/** A text field that reports its value when it loses focus or on Enter (one undo step per edit). */
function Draft({ label, value, placeholder, numeric, disabled, onCommit }: { label: string; value: string; placeholder?: string; numeric?: boolean; disabled: boolean; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const commit = () => {
    if (draft.trim() !== value) onCommit(draft.trim())
  }
  return (
    <div
      className="fk-flow-side__field"
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
    >
      <TextField label={label} value={draft} onChange={setDraft} onBlur={commit} disabled={disabled} {...(placeholder ? { placeholder } : {})} {...(numeric ? { inputType: 'number' as const } : {})} />
    </div>
  )
}
