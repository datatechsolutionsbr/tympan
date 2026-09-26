import { Check, CircleDashed, CirclePause, LoaderCircle, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { InlineNotice } from '../inline-notice/InlineNotice'
import { ReportView } from '../report-view/ReportView'
import type { Report, ReportSection } from '../report-view/types'
import { StatusPill, type StatusMap } from '../status-pill/StatusPill'
import { initialRunView, isTerminal, reduceRunEvent, type RunPhase, type RunStep, type RunStepState } from './runEvents'
import { useRunEventStream, type OpenRunStream, type RunStreamOptions } from './useRunEventStream'

export * from './runEvents'
export * from './useRunEventStream'

export interface LiveReportViewProps {
  flowId: string
  runId: string
  openStream: OpenRunStream
  initialReport?: Report | null
  /** Case-insensitive run status; a finished run is shown without subscribing. */
  initialStatus?: string
  /** Allow answering input requests in place (requires `submitInput`). */
  interactive?: boolean
  submitInput?: (runId: string, stepId: string, decision: unknown) => Promise<void>
  /** Host form for a pending input request (e.g. SchemaRequestForm); `submit` sends the decision. */
  renderInputRequest?: (data: ReportSection, submit: (decision: unknown) => Promise<void>) => ReactNode
  streamOptions?: RunStreamOptions
  className?: string
}

const STEP_ICON: Record<RunStepState, ReactNode> = {
  running: <LoaderCircle />,
  done: <Check />,
  failed: <X />,
  paused: <CirclePause />,
}

function StepStrip({ steps, label, words }: { steps: RunStep[]; label: string; words: Record<RunStepState, string> }) {
  if (!steps.length) return null
  return (
    <ol className="fk-live-report__steps" aria-label={label}>
      {steps.map((step) => (
        <li key={step.id} className="fk-live-report__step" data-state={step.state} title={step.error}>
          <span className="fk-live-report__step-mark" aria-hidden="true">
            {STEP_ICON[step.state] ?? <CircleDashed />}
          </span>
          <span className="fk-live-report__step-id">{step.id}</span>
          {step.kind ? <span className="fk-live-report__step-kind">{step.kind}</span> : null}
          <span className="fk-live-report__step-state">{words[step.state]}</span>
          {step.error ? <span className="fk-live-report__step-error">{step.error}</span> : null}
        </li>
      ))}
    </ol>
  )
}

/** A run's report while it executes (spec: wave-2/live-report-view.md). */
export function LiveReportView(props: LiveReportViewProps) {
  const { flowId, runId, openStream, initialReport = null, initialStatus, interactive = false, submitInput } = props
  const copy = useMessages().liveReport
  const finishedAtMount = isTerminal(initialStatus)
  const stream = useRunEventStream(finishedAtMount ? null : flowId, finishedAtMount ? null : runId, openStream, props.streamOptions)
  const [answered, setAnswered] = useState<string | null>(null)

  const view = useMemo(
    () => stream.events.reduce(reduceRunEvent, initialRunView(initialReport, initialStatus)),
    [stream.events, initialReport, initialStatus],
  )
  // Optimistic: once the pending input is answered, show "running" until the stream moves on.
  const phase: RunPhase = view.phase === 'paused' && answered !== null && answered === view.pausedStep ? 'running' : view.phase

  const phaseMap: StatusMap = {
    pending: { label: copy.phase.pending, tone: 'neutral' },
    running: { label: copy.phase.running, tone: 'info', icon: <LoaderCircle />, busy: true },
    paused: { label: copy.phase.paused, tone: 'warning', icon: <CirclePause /> },
    completed: { label: copy.phase.completed, tone: 'success', icon: <Check /> },
    failed: { label: copy.phase.failed, tone: 'danger', icon: <X /> },
    cancelled: { label: copy.phase.cancelled, tone: 'neutral', icon: <CircleDashed /> },
  }

  const send = async (stepId: string, decision: unknown) => {
    if (!submitInput) return
    setAnswered(stepId)
    await submitInput(runId, stepId, decision)
  }

  const renderRequest = (data: ReportSection): ReactNode => {
    const stepId = typeof data.stepId === 'string' ? data.stepId : ''
    const open = interactive && !!submitInput && view.phase === 'paused' && stepId === view.pausedStep && answered !== stepId
    if (!open) {
      return (
        <div className="fk-live-report__request">
          <p className="fk-live-report__prompt">{String(data.prompt ?? '')}</p>
        </div>
      )
    }
    if (props.renderInputRequest) return props.renderInputRequest(data, (decision) => send(stepId, decision))
    return (
      <div className="fk-live-report__request">
        <p className="fk-live-report__prompt">{String(data.prompt ?? '')}</p>
        <div className="fk-live-report__actions">
          <Button variant="primary" onPress={() => void send(stepId, { approved: true })}>
            {copy.approve}
          </Button>
          <Button onPress={() => void send(stepId, { approved: false })}>{copy.reject}</Button>
        </div>
      </div>
    )
  }

  const streamError = stream.status === 'error' ? (stream.error instanceof Error ? stream.error.message : String(stream.error ?? '')) : null
  const failure = view.error ?? streamError

  return (
    <div className={cx('fk-live-report', props.className)} data-phase={phase}>
      <div className="fk-live-report__head">
        <div role="status" aria-live="polite" aria-atomic="true" className="fk-live-report__phase">
          <StatusPill status={phase} statusMap={phaseMap} />
        </div>
        <StepStrip steps={view.steps} label={copy.steps} words={copy.step} />
      </div>
      {failure !== null ? (
        <InlineNotice tone="danger" title={copy.failed}>
          {failure}
        </InlineNotice>
      ) : null}
      {view.report ? (
        <ReportView report={view.report} renderInputRequest={renderRequest} />
      ) : failure === null ? (
        <p className="fk-live-report__waiting">{phase === 'paused' ? copy.pausedWaiting : copy.waiting}</p>
      ) : null}
    </div>
  )
}
