// Evaluation traces of an expression on sample data, and the small client
// that asks the engine to produce one (the "dry run"). The host always gives
// the endpoint; the engine may answer in snake case, which is accepted too.

export interface TraceSpan {
  kind: 'operation' | 'ref' | 'value'
  label: string
  args?: Record<string, unknown>
  /** Absent when the engine recorded no result for the frame. */
  result?: unknown
  children?: TraceSpan[]
}

export interface TraceReport {
  trace: TraceSpan
  truncated: boolean
  frameCount: number
  frameLimit: number
}

export interface DryRunRequest {
  config: Record<string, unknown>
  inputs?: Record<string, unknown>
  nodeOutputs?: Record<string, unknown>
}

export interface DryRunResponse {
  result: unknown
  trace: TraceReport
}

/** A loose record read from the wire, with alias-aware lookups. */
class Wire {
  private readonly bag: Record<string, unknown>
  constructor(raw: unknown) {
    this.bag = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  }
  /** First present value among the spellings. */
  get(...spellings: string[]): unknown {
    const hit = spellings.find((s) => Object.prototype.hasOwnProperty.call(this.bag, s))
    return hit === undefined ? undefined : this.bag[hit]
  }
  has(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.bag, name)
  }
}

const KIND_ALIASES: Record<string, TraceSpan['kind']> = { ref: 'ref', reference: 'ref', value: 'value', literal: 'value' }

function toSpan(raw: unknown): TraceSpan {
  const w = new Wire(raw)
  const span: TraceSpan = { kind: KIND_ALIASES[String(w.get('kind', 'span_kind') ?? '')] ?? 'operation', label: String(w.get('label', 'name', 'operation') ?? '') }
  const args = w.get('args', 'arguments')
  if (args !== null && typeof args === 'object' && !Array.isArray(args)) span.args = args as Record<string, unknown>
  if (w.has('result')) span.result = w.get('result')
  const kids = w.get('children', 'child_spans')
  if (Array.isArray(kids) && kids.length > 0) span.children = kids.map(toSpan)
  return span
}

/** Maps a report whose keys may be snake case (frame_count …) onto TraceReport. */
export function traceReportFromWire(raw: unknown): TraceReport {
  const w = new Wire(raw)
  const count = (...names: string[]) => Number(w.get(...names) ?? 0)
  return { trace: toSpan(w.get('trace', 'root')), truncated: Boolean(w.get('truncated', 'is_truncated')), frameCount: count('frameCount', 'frame_count'), frameLimit: count('frameLimit', 'frame_limit') }
}

/** Why a dry run failed: the HTTP status (0 for network or unreadable bodies) and the server's text. */
export class DryRunFailure extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'DryRunFailure'
    this.status = status
  }
}

const messageOf = (why: unknown) => (why instanceof Error ? why.message : String(why))

/** Runs `step`; any throw becomes a DryRunFailure with `status`. */
async function orFail<T>(status: number, step: () => Promise<T>): Promise<T> {
  try {
    return await step()
  } catch (why) {
    throw why instanceof DryRunFailure ? why : new DryRunFailure(status, messageOf(why))
  }
}

export async function runDryRun(endpoint: string, request: DryRunRequest, fetchImpl: typeof fetch = globalThis.fetch): Promise<DryRunResponse> {
  const init: RequestInit = { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(request) }
  const response = await orFail(0, () => fetchImpl(endpoint, init))
  if (!response.ok) {
    const said = await response.text().catch(() => response.statusText)
    throw new DryRunFailure(response.status, said || response.statusText)
  }
  const body = new Wire(await orFail(response.status, () => response.json() as Promise<unknown>))
  return { result: body.get('result'), trace: traceReportFromWire(body.get('trace')) }
}
