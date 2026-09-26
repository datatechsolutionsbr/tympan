import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Form } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import type { Messages } from '../../internal/messages'
import { Button } from '../button/Button'
import { Checkbox } from '../checkbox/Checkbox'
import { InlineNotice } from '../inline-notice/InlineNotice'
import { NativeSelect } from '../native-select/NativeSelect'
import { StatusPill } from '../status-pill/StatusPill'
import { TextArea } from '../text-area/TextArea'
import { TextField } from '../text-field/TextField'

interface FieldBase {
  key: string
  label: string
  required?: boolean
  help?: string
}
export type RequestField =
  | (FieldBase & { kind: 'text'; placeholder?: string; default?: string })
  | (FieldBase & { kind: 'number'; min?: number; max?: number; step?: number; default?: number })
  | (FieldBase & { kind: 'longText'; rows?: number; default?: string })
  | (FieldBase & { kind: 'choice'; options: { value: string; label: string }[]; default?: string })
  | (FieldBase & { kind: 'boolean'; default?: boolean })

export interface InputRequest {
  stepId: string
  prompt: string
  description?: ReactNode
  fields: RequestField[]
  submitLabel?: string
  /** null hides the reject button. */
  rejectLabel?: string | null
  tone?: 'info' | 'warning' | 'success' | 'danger'
}

export interface RequestDecision {
  approved: boolean
  payload?: Record<string, unknown>
  reason?: string
}

export interface SchemaRequestFormProps {
  runId: string
  request: InputRequest
  submit: (runId: string, stepId: string, decision: RequestDecision) => Promise<void>
  onResolved?: (result: { approved: boolean; payload: Record<string, unknown> }) => void
  className?: string
}

type Values = Record<string, string | boolean>
type Phase = { kind: 'editing' } | { kind: 'sending'; approved: boolean } | { kind: 'resolved'; approved: boolean } | { kind: 'failed'; message: string }

function initialValues(fields: RequestField[]): Values {
  const out: Values = {}
  for (const f of fields) out[f.key] = f.kind === 'boolean' ? !!f.default : f.default != null ? String(f.default) : ''
  return out
}

/** Error text per invalid field (empty object when everything passes). */
function check(fields: RequestField[], values: Values, t: Messages['requestForm']): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of fields) {
    const v = values[f.key]
    if (f.kind === 'boolean') {
      if (f.required && v !== true) errors[f.key] = t.required
      continue
    }
    const text = typeof v === 'string' ? v.trim() : ''
    if (!text) {
      if (f.required) errors[f.key] = t.required
      continue
    }
    if (f.kind === 'number') {
      const n = Number(text)
      if (!Number.isFinite(n)) errors[f.key] = t.notNumber
      else if (f.min != null && n < f.min) errors[f.key] = t.atLeast(f.min)
      else if (f.max != null && n > f.max) errors[f.key] = t.atMost(f.max)
    }
  }
  return errors
}

/** Payload for an approval: typed values, empty strings dropped. */
function payloadOf(fields: RequestField[], values: Values): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    const v = values[f.key]
    if (f.kind === 'boolean') out[f.key] = v === true
    else if (typeof v === 'string' && v.trim() !== '') out[f.key] = f.kind === 'number' ? Number(v) : v
  }
  return out
}

/** One control for one schema entry, chosen by kind. */
function RequestControl(props: { field: RequestField; value: string | boolean; error?: string; locked: boolean; placeholder: string; onValue: (v: string | boolean) => void }) {
  const { field: f, error, locked } = props
  const text = typeof props.value === 'string' ? props.value : ''
  switch (f.kind) {
    case 'boolean':
      return <Checkbox label={f.label} description={f.help} isSelected={props.value === true} onChange={props.onValue} errorMessage={error} disabled={locked} required={f.required} />
    case 'longText':
      return <TextArea label={f.label} hint={f.help} rows={f.rows ?? 3} value={text} onChange={props.onValue} errorMessage={error} disabled={locked} required={f.required} />
    case 'choice':
      return <NativeSelect label={f.label} hint={f.help} options={f.options} placeholder={props.placeholder} value={text} onChange={props.onValue} errorMessage={error} disabled={locked} required={f.required} />
    default:
      return (
        <TextField
          label={f.label}
          hint={f.help}
          inputType={f.kind === 'number' ? 'number' : 'text'}
          placeholder={f.kind === 'text' ? f.placeholder : undefined}
          value={text}
          onChange={props.onValue}
          errorMessage={error}
          disabled={locked}
          required={f.required}
        />
      )
  }
}

/**
 * A form rendered from a small field schema that answers a paused run's
 * request for input (spec: wave-2/schema-request-form.md).
 */
export function SchemaRequestForm({ runId, request, submit, onResolved, className }: SchemaRequestFormProps) {
  const t = useMessages().requestForm
  const [values, setValues] = useState<Values>(() => initialValues(request.fields))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<Phase>({ kind: 'editing' })
  const inFlight = useRef(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const focusKey = useRef<string | null>(null)
  const titleId = useId()
  const locked = phase.kind === 'sending' || phase.kind === 'resolved'

  useEffect(() => {
    if (!focusKey.current) return
    const target = bodyRef.current?.querySelector<HTMLElement>(`[data-request-key="${CSS.escape(focusKey.current)}"] :is(input, select, textarea)`)
    focusKey.current = null
    target?.focus()
  }, [errors])

  const send = async (decision: RequestDecision) => {
    if (inFlight.current || phase.kind === 'resolved') return
    inFlight.current = true
    setPhase({ kind: 'sending', approved: decision.approved })
    try {
      await submit(runId, request.stepId, decision)
      setPhase({ kind: 'resolved', approved: decision.approved })
      onResolved?.({ approved: decision.approved, payload: decision.payload ?? {} })
    } catch (err) {
      setPhase({ kind: 'failed', message: (err instanceof Error && err.message) || t.failed })
    } finally {
      inFlight.current = false
    }
  }

  const approve = () => {
    const found = check(request.fields, values, t)
    setErrors(found)
    const first = request.fields.find((f) => found[f.key])
    if (first) {
      focusKey.current = first.key
      return
    }
    void send({ approved: true, payload: payloadOf(request.fields, values) })
  }
  const reject = () => {
    const reason = typeof values.reason === 'string' && values.reason.trim() ? values.reason.trim() : t.defaultReason
    void send({ approved: false, reason })
  }

  const sending = phase.kind === 'sending'
  return (
    <section className={cx('ty-request-form', className)} data-tone={request.tone ?? 'info'} aria-labelledby={titleId}>
      <h3 id={titleId} className="ty-request-form__prompt">
        {request.prompt}
      </h3>
      {request.description ? <div className="ty-request-form__description">{request.description}</div> : null}
      {phase.kind === 'failed' ? (
        <InlineNotice tone="danger" urgency="assertive">
          {phase.message}
        </InlineNotice>
      ) : null}
      <Form
        className="ty-request-form__form"
        validationBehavior="aria"
        aria-labelledby={titleId}
        onSubmit={(e) => {
          e.preventDefault()
          approve()
        }}
      >
        <div ref={bodyRef} className="ty-request-form__fields">
          {request.fields.map((field) => (
            <div key={field.key} data-request-key={field.key}>
              <RequestControl
                field={field}
                value={values[field.key] ?? ''}
                error={errors[field.key]}
                locked={locked}
                placeholder={t.choose}
                onValue={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
              />
            </div>
          ))}
        </div>
        {phase.kind === 'resolved' ? (
          <p className="ty-request-form__resolution" role="status">
            <StatusPill status={phase.approved ? 'approved' : 'rejected'} label={phase.approved ? t.approved : t.rejected} tone={phase.approved ? 'success' : 'neutral'} />
            <span>{phase.approved ? t.approvedSentence : t.rejectedSentence}</span>
          </p>
        ) : (
          <div className="ty-request-form__actions">
            {request.rejectLabel === null ? null : (
              <Button variant="secondary" disabled={sending} busy={sending && phase.approved === false} busyLabel={t.sending} onPress={reject}>
                {request.rejectLabel ?? t.reject}
              </Button>
            )}
            <Button variant="primary" type="submit" busy={sending && phase.approved} disabled={sending && !phase.approved} busyLabel={t.sending}>
              {request.submitLabel ?? t.submit}
            </Button>
          </div>
        )}
      </Form>
    </section>
  )
}
