// Run events and their reduction into what LiveReportView shows
// (spec: wave-2/live-report-view.md, "Event reduction").
import type { RunPhase, RunStepState } from '../../internal/messages/charts-geo'
import type { Report, ReportSection } from '../report-view/types'

export type { RunPhase, RunStepState } from '../../internal/messages/charts-geo'

/** One event of the run stream, as the host's transport delivers it. */
export type RunEvent =
  | { type: 'run.started'; id?: string }
  | { type: 'step.started'; stepId: string; stepKind?: string; id?: string }
  | { type: 'step.completed'; stepId: string; report?: Partial<Report>; id?: string }
  | { type: 'step.error'; stepId: string; message: string; id?: string }
  | { type: 'run.paused'; stepId: string; prompt: string; fields?: Array<{ name: string; label: string }>; id?: string }
  | { type: 'ui.section'; section: ReportSection; id?: string }
  | { type: 'run.completed'; id?: string }
  | { type: 'run.failed'; message: string; id?: string }

export interface RunStep {
  id: string
  kind?: string
  state: RunStepState
  error?: string
}

export interface RunView {
  phase: RunPhase
  steps: RunStep[]
  report: Report | null
  error: string | null
  /** Step waiting for input while paused. */
  pausedStep: string | null
}

const TERMINAL: ReadonlySet<string> = new Set(['completed', 'failed', 'cancelled'])

/** Case-insensitive run status to a phase; unknown values count as pending. */
export function phaseOf(status: string | undefined | null): RunPhase {
  const s = (status ?? '').toLowerCase()
  if (s === 'canceled') return 'cancelled'
  const known: RunPhase[] = ['pending', 'running', 'paused', 'completed', 'failed', 'cancelled']
  return (known as string[]).includes(s) ? (s as RunPhase) : 'pending'
}

export const isTerminal = (status: string | undefined | null) => TERMINAL.has(phaseOf(status))

/** Adds a partial report onto an accumulated one: lists append, scalars replace. */
export function mergeReport(base: Report | null, part: Partial<Report> | undefined): Report | null {
  if (!part) return base
  const from = base ?? { title: part.title ?? '' }
  const join = <T,>(a: T[] | undefined, b: T[] | undefined) => (a || b ? [...(a ?? []), ...(b ?? [])] : undefined)
  const merged: Report = {
    ...from,
    ...Object.fromEntries(Object.entries(part).filter(([, v]) => v !== undefined)),
    title: part.title ?? from.title,
  }
  merged.kpis = join(from.kpis, part.kpis)
  merged.charts = join(from.charts, part.charts)
  merged.sections = join(from.sections, part.sections)
  return merged
}

function touchStep(steps: RunStep[], id: string, patch: Partial<RunStep>): RunStep[] {
  const at = steps.findIndex((s) => s.id === id)
  if (at < 0) return [...steps, { id, state: 'running', ...patch }]
  return steps.map((s, i) => (i === at ? { ...s, ...patch } : s))
}

export function initialRunView(report: Report | null, status?: string | null): RunView {
  return { phase: phaseOf(status), steps: [], report, error: null, pausedStep: null }
}

/** Pure reducer from one event to the next view. */
export function reduceRunEvent(view: RunView, event: RunEvent): RunView {
  switch (event.type) {
    case 'run.started':
      return { ...view, phase: 'running' }
    case 'step.started':
      return { ...view, steps: touchStep(view.steps, event.stepId, { state: 'running', kind: event.stepKind }) }
    case 'step.completed':
      return { ...view, steps: touchStep(view.steps, event.stepId, { state: 'done' }), report: mergeReport(view.report, event.report) }
    case 'step.error':
      return { ...view, steps: touchStep(view.steps, event.stepId, { state: 'failed', error: event.message }) }
    case 'run.paused': {
      const request: ReportSection = { kind: 'inputRequest', id: `input-${event.stepId}`, stepId: event.stepId, prompt: event.prompt, fields: event.fields ?? [] }
      return {
        ...view,
        phase: 'paused',
        pausedStep: event.stepId,
        steps: touchStep(view.steps, event.stepId, { state: 'paused' }),
        report: mergeReport(view.report, { sections: [request] }),
      }
    }
    case 'ui.section':
      return { ...view, report: mergeReport(view.report, { sections: [event.section] }) }
    case 'run.completed':
      return { ...view, phase: 'completed', pausedStep: null }
    case 'run.failed':
      return { ...view, phase: 'failed', error: event.message, pausedStep: null }
    default:
      return view
  }
}
