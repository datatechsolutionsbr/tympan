// FlowSidePanel: the editor's inline-end panel. With nothing selected it sums
// the flow up (version, runs over the edition, steps, AI use, determinism,
// citable outputs) with "run" and "validate"; with a step selected it shows
// that step's settings, a preview of its output and "test" / "remove".

import { ArrowLeft, FlaskConical, Play, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, TextField } from '@fakhir/design-system'
import { fill, useFlowLocale } from '../internal/labels'
import type { FlowNode } from '../model/types'
import { ShapeFlow } from './ShapeChip'
import { specOfNode, type ReadyStep } from './researchSteps'
import { useSteps } from './StepsContext'

/** Facts about the flow the host knows (the editor counts the rest). */
export interface FlowFacts {
  version?: string
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

function FlowOverview({ nodes, facts = {}, validation, onRunFlow, onValidate }: FlowSidePanelProps) {
  const rt = useSteps()
  const w = rt.words
  const { locale } = useFlowLocale()
  const steps = nodes.filter(DRAWN)
  const specs = steps.map((n) => ({ n, s: specOfNode(n, rt.byId) }))
  const ai = specs.some((x) => x.s?.usesAI)
  const citable = specs.filter((x) => x.s?.verb === 'output').map((x) => (typeof x.n.data.label === 'string' && x.n.data.label) || x.s!.name)
  const num = (v: number) => new Intl.NumberFormat(locale).format(v)
  const rows: Array<[string, string]> = [
    ...(facts.version ? [[w.version, facts.version] as [string, string]] : []),
    ...(facts.runsOverEdition !== undefined ? [[w.runs, num(facts.runsOverEdition)] as [string, string]] : []),
    [w.stepCount, num(steps.length)],
    [w.usesAI, ai ? w.yes : w.no],
    ...(facts.deterministic !== undefined
      ? [[w.deterministic, [facts.deterministic ? w.yes : w.no, facts.seed !== undefined ? fill(w.seed, { seed: String(facts.seed) }, locale) : null].filter(Boolean).join(' · ')] as [string, string]]
      : []),
  ]
  return (
    <section className="fk-flow-side" aria-labelledby="fk-flow-side-title">
      <h2 id="fk-flow-side-title" className="fk-flow-side__title">
        {w.summaryTitle}
      </h2>
      <dl className="fk-flow-side__facts">
        {rows.map(([k, v]) => (
          <div key={k} className="fk-flow-side__fact">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
        <div className="fk-flow-side__fact" data-wide="true">
          <dt>{w.citable}</dt>
          <dd>
            {citable.length ? (
              <ul className="fk-flow-side__outputs">
                {citable.map((c, i) => (
                  <li key={`${c}-${i}`}>{c}</li>
                ))}
              </ul>
            ) : (
              w.none
            )}
          </dd>
        </div>
      </dl>
      <div className="fk-flow-side__actions">
        {onRunFlow ? (
          <Button variant="primary" leadingIcon={<Play />} onPress={onRunFlow}>
            {w.runFlow}
          </Button>
        ) : null}
        <Button variant="secondary" leadingIcon={<ShieldCheck />} onPress={onValidate}>
          {w.validate}
        </Button>
      </div>
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
      <div className="fk-flow-side__head">
        <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={w.backToSummary} leadingIcon={<ArrowLeft className="fk-flow-side__back" />} onPress={onBack} />
        <h2 id="fk-flow-side-title" className="fk-flow-side__title">
          {title}
        </h2>
      </div>
      {spec ? (
        <p className="fk-flow-side__about">
          {spec.description}
          {spec.primitive ? null : <ShapeFlow inputs={spec.inputs} output={spec.output} words={rt.shapes} labels={w} />}
        </p>
      ) : null}
      <form className="fk-flow-side__form" onSubmit={(e) => e.preventDefault()}>
        <Draft label={w.stepTitle} value={typeof node.data.label === 'string' ? node.data.label : ''} placeholder={spec?.name ?? ''} disabled={!!locked} onCommit={(v) => onEdit(node.id, { label: v || undefined })} />
        {(spec?.fields ?? []).map((f) => (
          <Draft
            key={f.key}
            label={f.label ?? f.key}
            numeric={f.type === 'number'}
            value={node.data[f.key] === undefined || node.data[f.key] === null ? '' : String(node.data[f.key])}
            disabled={!!locked}
            onCommit={(v) => onEdit(node.id, { [f.key]: v === '' ? undefined : f.type === 'number' && Number.isFinite(Number(v)) ? Number(v) : v })}
          />
        ))}
      </form>
      <h3 className="fk-flow-side__subtitle">{w.preview}</h3>
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
                    <td key={j}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="fk-flow-side__empty">{w.noPreview}</p>
      )}
      {!locked ? (
        <div className="fk-flow-side__actions">
          {onTestStep ? (
            <Button variant="secondary" leadingIcon={<FlaskConical />} onPress={() => onTestStep(node.id)}>
              {w.testStep}
            </Button>
          ) : null}
          <Button variant="danger" leadingIcon={<Trash2 />} onPress={() => onRemove(node.id)}>
            {w.remove}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

/** A field that reports its value when it loses focus or on Enter (one undo step per edit). */
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
