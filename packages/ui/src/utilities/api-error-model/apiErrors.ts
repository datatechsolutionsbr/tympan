// ApiErrorModel (spec: wave-2/api-error-model.md): one error shape for API
// failures, an RFC 9457 problem variant, and the run-domain types consumed by
// live-run components. The run vocabulary is the library's; the functions at
// the end translate the run enums of the host's OpenAPI workflows contract into
// it (a test reads that contract, when present, so both stay in step).

export interface SerializedApiError {
  message: string
  code: string
  status: number
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(message: string, init: { status?: number; code?: string; cause?: unknown } = {}) {
    super(message, init.cause === undefined ? undefined : { cause: init.cause })
    this.name = 'ApiError'
    this.status = init.status ?? 500
    this.code = init.code ?? 'unknown'
  }
  toJSON(): SerializedApiError {
    return { message: this.message, code: this.code, status: this.status }
  }
}

/** A non-2xx HTTP response. */
export class HttpResponseError extends ApiError {
  static readonly CODE = 'http_response'
  constructor(message: string, status = 500) {
    super(message, { status, code: HttpResponseError.CODE })
    this.name = 'HttpResponseError'
  }
}

export interface ProblemDocument {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  [extension: string]: unknown
}

/** An `application/problem+json` answer (RFC 9457); `type` is shown to people in meta (§2.12). */
export class ProblemError extends ApiError {
  readonly type: string
  readonly title: string
  readonly detail?: string
  readonly problem: ProblemDocument
  constructor(problem: ProblemDocument, fallbackStatus = 500) {
    const status = typeof problem.status === 'number' ? problem.status : fallbackStatus
    const type = problem.type ?? 'about:blank'
    super(problem.detail ?? problem.title ?? type, { status, code: type })
    this.name = 'ProblemError'
    this.type = type
    this.title = problem.title ?? ''
    this.detail = problem.detail
    this.problem = problem
  }
  override toJSON(): SerializedApiError & { type: string; title: string; detail?: string } {
    return { ...super.toJSON(), type: this.type, title: this.title, detail: this.detail }
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

/** HTTP status of any thrown value; 500 when it has none. */
export function statusOf(value: unknown): number {
  if (isApiError(value)) return value.status
  const s = (value as { status?: unknown } | null)?.status
  return typeof s === 'number' && s >= 100 && s <= 599 ? s : 500
}

/** Machine code of any thrown value; "unknown" when it has none. */
export function codeOf(value: unknown): string {
  if (isApiError(value)) return value.code
  const c = (value as { code?: unknown } | null)?.code
  return typeof c === 'string' && c ? c : 'unknown'
}

/* ---- Run domain ---- */

export type NodeStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped'
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type VariableValue = string | number | boolean | null | VariableValue[] | { [key: string]: VariableValue }

export const KNOWN_RUN_EVENT_TYPES = [
  'run.started',
  'node.started',
  'node.completed',
  'node.error',
  'node.skipped',
  'node.restored',
  'node.retry',
  'run.paused',
  'run.completed',
  'run.failed',
  'model.generation',
  'tool.execution',
  'agent.stream',
  'ui.render',
] as const
export type KnownRunEventType = (typeof KNOWN_RUN_EVENT_TYPES)[number]

export interface ExecutionEvent {
  /** Open-ended: consumers ignore kinds they do not know. */
  type: KnownRunEventType | (string & {})
  runId: string
  nodeId?: string
  nodeType?: string
  status?: NodeStatus | RunStatus
  outputs?: Record<string, VariableValue>
  error?: string
  durationMs?: number
  timestamp: string
}

const known = new Set<string>(KNOWN_RUN_EVENT_TYPES)

export function isKnownRunEvent(event: ExecutionEvent): event is ExecutionEvent & { type: KnownRunEventType } {
  return known.has(event.type)
}

export type RunEventHandlers = Partial<Record<KnownRunEventType, (event: ExecutionEvent) => void>>

/** Dispatches known events to handlers; unknown kinds return false and are skipped. */
export function createRunEventConsumer(handlers: RunEventHandlers): (event: ExecutionEvent) => boolean {
  return (event) => {
    if (!isKnownRunEvent(event)) return false
    handlers[event.type]?.(event)
    return true
  }
}

/* ---- Contract translation ---- */

const RUN_STATUS_FROM_CONTRACT: Record<string, RunStatus> = {
  queued: 'pending',
  running: 'running',
  waiting: 'running',
  succeeded: 'completed',
  failed: 'failed',
  cancelled: 'cancelled',
}

const NODE_STATUS_FROM_CONTRACT: Record<string, NodeStatus> = {
  pending: 'pending',
  running: 'running',
  waiting: 'running',
  succeeded: 'success',
  failed: 'error',
  skipped: 'skipped',
  cancelled: 'skipped',
}

const EVENT_FROM_CONTRACT: Record<string, string> = {
  'step.started': 'node.started',
  'step.succeeded': 'node.completed',
  'step.failed': 'node.error',
  'step.waiting': 'run.paused',
  // Logs and outputs have no library kind; they pass through as unknown.
  'step.log': 'step.log',
  'run.output': 'run.output',
}

/** Contract `RunStatus` → library run status (unknown values read as pending). */
export function runStatusFromContract(status: string): RunStatus {
  return RUN_STATUS_FROM_CONTRACT[status] ?? 'pending'
}

/** Contract `StepStatus` → library node status. */
export function nodeStatusFromContract(status: string): NodeStatus {
  return NODE_STATUS_FROM_CONTRACT[status] ?? 'pending'
}

/** Contract SSE event name (and run status for `run.status`) → library event type. */
export function eventTypeFromContract(event: string, runStatus?: string): string {
  if (event === 'run.status') {
    const s = runStatus ? runStatusFromContract(runStatus) : 'running'
    return s === 'completed' ? 'run.completed' : s === 'failed' ? 'run.failed' : runStatus === 'waiting' ? 'run.paused' : 'run.started'
  }
  return EVENT_FROM_CONTRACT[event] ?? event
}

export const CONTRACT_MAPPINGS = {
  runStatus: RUN_STATUS_FROM_CONTRACT,
  stepStatus: NODE_STATUS_FROM_CONTRACT,
  events: EVENT_FROM_CONTRACT,
} as const
