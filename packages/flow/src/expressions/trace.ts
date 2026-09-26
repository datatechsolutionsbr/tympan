// Trace of an expression evaluated on sample data, and the dry-run client
// that asks the engine for one. The endpoint is always supplied by the host.

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

type Wire = Record<string, unknown>

const pick = (o: Wire, ...keys: string[]) => {
  for (const k of keys) if (k in o) return o[k]
  return undefined
}

function spanFromWire(w: unknown): TraceSpan {
  const o = (w && typeof w === 'object' ? w : {}) as Wire
  const kindRaw = String(pick(o, 'kind', 'span_kind') ?? 'operation')
  const kind: TraceSpan['kind'] = kindRaw === 'ref' || kindRaw === 'reference' ? 'ref' : kindRaw === 'value' || kindRaw === 'literal' ? 'value' : 'operation'
  const children = pick(o, 'children', 'child_spans')
  const span: TraceSpan = { kind, label: String(pick(o, 'label', 'name', 'operation') ?? '') }
  const args = pick(o, 'args', 'arguments')
  if (args && typeof args === 'object' && !Array.isArray(args)) span.args = args as Record<string, unknown>
  if ('result' in o) span.result = o.result
  if (Array.isArray(children) && children.length) span.children = children.map(spanFromWire)
  return span
}

/** Maps a report whose keys may be snake case (frame_count …) onto TraceReport. */
export function traceReportFromWire(wire: unknown): TraceReport {
  const o = (wire && typeof wire === 'object' ? wire : {}) as Wire
  return {
    trace: spanFromWire(pick(o, 'trace', 'root')),
    truncated: Boolean(pick(o, 'truncated', 'is_truncated')),
    frameCount: Number(pick(o, 'frameCount', 'frame_count') ?? 0),
    frameLimit: Number(pick(o, 'frameLimit', 'frame_limit') ?? 0),
  }
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

/** Rejection of runDryRun: HTTP status (0 for network or body failures) and server text. */
export class DryRunFailure extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'DryRunFailure'
    this.status = status
  }
}

export async function runDryRun(endpoint: string, request: DryRunRequest, fetchImpl: typeof fetch = globalThis.fetch): Promise<DryRunResponse> {
  let res: Response
  try {
    res = await fetchImpl(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(request) })
  } catch (e) {
    throw new DryRunFailure(0, e instanceof Error ? e.message : String(e))
  }
  if (!res.ok) {
    let text = ''
    try {
      text = await res.text()
    } catch {
      text = res.statusText
    }
    throw new DryRunFailure(res.status, text || res.statusText)
  }
  let body: unknown
  try {
    body = await res.json()
  } catch (e) {
    throw new DryRunFailure(res.status, e instanceof Error ? e.message : String(e))
  }
  const o = (body && typeof body === 'object' ? body : {}) as Wire
  return { result: o.result, trace: traceReportFromWire(o.trace) }
}
