// FlowSidePanel: the editor's inline-end panel. With nothing selected it
// sums the flow up (version, the edition it runs on, steps, AI use,
// determinism, citable outputs by shape) with "run" and "validate"; with a
// step selected it shows the step's settings, a preview of its output and
// "test" / "remove".

import { ArrowRight, Check, Ellipsis } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ActionMenu, Button, ListboxSelect, Switch, TextArea, TextField } from '../../index'
import { fill, useFlowLocale, useLabels } from '../internal/labels'
import type { FlowNode } from '../model/types'
import { ShapeFlow } from './ShapeChip'
import { researchStepWords, settingProblems, settingsOf, specOfNode, type ReadyStep, type StepField } from './researchSteps'
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
    <div className="ty-flow-side__fact">
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
    <section className="ty-flow-side" aria-labelledby="ty-flow-side-title">
      <span className="ty-flow-side__eyebrow">{w.eyebrowFlow}</span>
      <h2 id="ty-flow-side-title" className="ty-flow-side__title">
        {facts.name ?? w.summaryTitle}
      </h2>
      <dl className="ty-flow-side__facts">
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
      <div className="ty-flow-side__stack">
        {onRunFlow ? (
          <Button variant="primary" fullWidth leadingIcon={<ArrowRight className="ty-flow-side__arrow" />} onPress={onRunFlow}>
            {w.runFlow}
          </Button>
        ) : null}
        <Button variant="secondary" fullWidth leadingIcon={<Check />} onPress={onValidate}>
          {w.validate}
        </Button>
      </div>
      <p className="ty-flow-side__hint">{w.nothingSelected}</p>
      <p className="ty-flow-side__status" role="status">
        {validation ?? ''}
      </p>
    </section>
  )
}

function StepSettings({ node, spec, preview, locked, onTestStep, onRemove, onEdit, onBack }: FlowSidePanelProps & { node: FlowNode; spec: ReadyStep | undefined }) {
  const rt = useSteps()
  const w = rt.words
  const title = (typeof node.data.label === 'string' && node.data.label) || spec?.name || node.kind
  const settings = settingsOf(spec, node.data)
  const problems = settingProblems(spec, node.data, rt.problems.get(node.id))
  /** A field's new value, at the top of the node data or inside the object `configIn` names (undefined removes it). */
  const commit = (key: string, v: unknown) => {
    if (!spec?.configIn) return onEdit(node.id, { [key]: v })
    const next = { ...settings }
    if (v === undefined) delete next[key]
    else next[key] = v
    onEdit(node.id, { [spec.configIn]: next })
  }
  return (
    <section className="ty-flow-side" aria-labelledby="ty-flow-side-title" data-step={node.id}>
      <div className="ty-flow-side__top">
        <span className="ty-flow-side__eyebrow">{w.eyebrowStep}</span>
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
      <h2 id="ty-flow-side-title" className="ty-flow-side__title" dir="auto">
        {title}
      </h2>
      {spec && !spec.primitive ? <ShapeFlow inputs={spec.inputs} output={spec.output} words={rt.shapes} labels={w} /> : null}
      <form className="ty-flow-side__form" onSubmit={(e) => e.preventDefault()} noValidate>
        {problems[''] ? (
          <p className="ty-flow-side__problem" role="alert">
            {problems['']}
          </p>
        ) : null}
        {(spec?.fields ?? []).map((f) => (
          <Field key={f.key} field={f} value={settings[f.key]} error={problems[f.key]} disabled={!!locked} onCommit={(v) => commit(f.key, v)} />
        ))}
        <Draft label={w.stepName} value={typeof node.data.label === 'string' ? node.data.label : ''} placeholder={spec?.name ?? ''} disabled={!!locked} onCommit={(v) => onEdit(node.id, { label: v || undefined })} />
      </form>
      <span className="ty-flow-side__eyebrow">{w.preview}</span>
      {preview && preview.rows.length ? (
        <div className="ty-flow-side__preview">
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
        <p className="ty-flow-side__hint">{w.noPreview}</p>
      )}
      {!locked ? (
        <div className="ty-flow-side__row">
          {onTestStep ? (
            <Button variant="secondary" leadingIcon={<ArrowRight className="ty-flow-side__arrow" />} onPress={() => onTestStep(node.id)}>
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

/** A settings field: a choice, a switch, or text / number / list / structured text committed on blur or Enter. */
function Field({ field, value, error, disabled, onCommit }: { field: StepField; value: unknown; error?: string; disabled: boolean; onCommit: (v: unknown) => void }) {
  const words = useLabels(researchStepWords, undefined)
  const rt = useSteps()
  const { locale } = useFlowLocale()
  const current = value === undefined || value === null ? '' : typeof value === 'object' ? '' : String(value)
  const options = useMemo(() => {
    const values = [...(field.options ?? [])]
    if (current && !values.includes(current)) values.unshift(current)
    return values.map((v) => ({ value: v, label: words[`option.${v}`] ?? v }))
  }, [field.options, current, words])
  const label = field.label ?? field.key
  const req = field.required ? { required: true } : {}
  if (field.type === 'choice') {
    return (
      <div className="ty-flow-side__field">
        <ListboxSelect label={label} options={options} value={current || null} disabled={disabled} {...req} {...(error ? { errorMessage: error } : {})} onChange={(v) => v !== current && onCommit(v)} />
      </div>
    )
  }
  if (field.type === 'boolean') {
    return (
      <div className="ty-flow-side__field">
        <Switch label={label} isSelected={value === true} disabled={disabled} onChange={(on) => onCommit(on)} {...(error ? { description: <span className="ty-flow-side__problem">{error}</span> } : {})} />
      </div>
    )
  }
  if (field.type === 'json') return <JsonDraft label={label} value={value} error={error} disabled={disabled} required={!!field.required} invalid={(detail) => fill(rt.words.invalidJson, { detail }, locale)} onCommit={onCommit} />
  if (field.type === 'list') {
    const text = Array.isArray(value) ? value.map(String).join(', ') : current
    return (
      <Draft
        label={label}
        value={text}
        hint={rt.words.valuesHint}
        error={error}
        required={!!field.required}
        disabled={disabled}
        onCommit={(v) => {
          const items = v.split(',').map((x) => x.trim()).filter(Boolean)
          onCommit(items.length ? items : undefined)
        }}
      />
    )
  }
  return (
    <Draft
      label={label}
      value={current}
      numeric={field.type === 'number'}
      error={error}
      required={!!field.required}
      disabled={disabled}
      onCommit={(v) => onCommit(v === '' ? undefined : field.type === 'number' && Number.isFinite(Number(v)) ? Number(v) : v)}
    />
  )
}

/** Structured text (JSON) committed when it leaves the field; text that does not parse stays with its error. */
function JsonDraft({ label, value, error, disabled, required, invalid, onCommit }: { label: string; value: unknown; error?: string; disabled: boolean; required: boolean; invalid: (detail: string) => string; onCommit: (v: unknown) => void }) {
  const text = value === undefined ? '' : JSON.stringify(value, null, 2)
  const [draft, setDraft] = useState(text)
  const [parseError, setParseError] = useState<string | null>(null)
  useEffect(() => {
    setDraft(text)
    setParseError(null)
  }, [text])
  const commit = () => {
    const t = draft.trim()
    if (!t) {
      setParseError(null)
      if (value !== undefined) onCommit(undefined)
      return
    }
    try {
      const parsed: unknown = JSON.parse(t)
      setParseError(null)
      if (JSON.stringify(parsed) !== JSON.stringify(value)) onCommit(parsed)
    } catch (e) {
      setParseError(invalid(e instanceof Error ? e.message : String(e)))
    }
  }
  const shown = parseError ?? error
  return (
    <div className="ty-flow-side__field" onBlur={commit}>
      <TextArea label={label} value={draft} onChange={setDraft} monospace autoGrow rows={3} maxRows={12} disabled={disabled} {...(required ? { required: true } : {})} {...(shown ? { errorMessage: shown } : {})} />
    </div>
  )
}

/** A text field that reports its value when it loses focus or on Enter (one undo step per edit). */
function Draft({ label, value, placeholder, numeric, hint, error, required, disabled, onCommit }: { label: string; value: string; placeholder?: string; numeric?: boolean; hint?: string; error?: string; required?: boolean; disabled: boolean; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const commit = () => {
    if (draft.trim() !== value) onCommit(draft.trim())
  }
  return (
    <div
      className="ty-flow-side__field"
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
    >
      <TextField
        label={label}
        value={draft}
        onChange={setDraft}
        onBlur={commit}
        disabled={disabled}
        {...(placeholder ? { placeholder } : {})}
        {...(numeric ? { inputType: 'number' as const } : {})}
        {...(hint ? { hint } : {})}
        {...(error ? { errorMessage: error } : {})}
        {...(required ? { required: true } : {})}
      />
    </div>
  )
}
