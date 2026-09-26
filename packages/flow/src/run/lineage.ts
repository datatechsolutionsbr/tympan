// RunLineageAndDiff: pure helpers to read how a run was derived from another
// and to compare two runs node by node.

export type LineageKind = 'reset' | 'replay' | 'resume' | 'fork' | 'signal' | 'timer' | 'approval'

const LINEAGE_KINDS: readonly LineageKind[] = ['reset', 'replay', 'resume', 'fork', 'signal', 'timer', 'approval']

export interface Lineage {
  kind: LineageKind
  baseRunId: string
  nodeId?: string
}

/** Reads the engine's "kind:baseRunId" (or "approval:baseRunId:nodeId") text; null for root runs. */
export function parseLineage(triggeredBy: string | null | undefined): Lineage | null {
  if (!triggeredBy) return null
  const cut = triggeredBy.indexOf(':')
  if (cut <= 0) return null
  const kind = triggeredBy.slice(0, cut) as LineageKind
  if (!LINEAGE_KINDS.includes(kind)) return null
  const rest = triggeredBy.slice(cut + 1)
  if (!rest) return null
  if (kind === 'approval') {
    const second = rest.indexOf(':')
    if (second < 0) return { kind, baseRunId: rest }
    const baseRunId = rest.slice(0, second)
    if (!baseRunId) return null
    const nodeId = rest.slice(second + 1)
    return nodeId ? { kind, baseRunId, nodeId } : { kind, baseRunId }
  }
  return { kind, baseRunId: rest }
}

/** Last entry (in stored order) carried over from an earlier run; null when none. */
export function findForkPoint(entries: ReadonlyArray<{ nodeId: string; restored?: boolean }>): string | null {
  for (let i = entries.length - 1; i >= 0; i--) if (entries[i]!.restored) return entries[i]!.nodeId
  return null
}

/** "PausedForApproval", "PAUSED_FOR_APPROVAL" and "paused for approval" all become "paused_for_approval". */
export function normaliseStatus(status: string): string {
  return status
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value as Record<string, unknown>).sort()) out[k] = sortKeys((value as Record<string, unknown>)[k])
    return out
  }
  return value
}

/** Structured-data text with object keys sorted at every depth; the basis of every equality check. */
export function canonicalEncode(value: unknown): string {
  return JSON.stringify(sortKeys(value)) ?? 'undefined'
}

export interface DiffEntry {
  nodeId: string
  nodeKind: string
  status: string
  durationMs: number | null
  outputs?: Record<string, unknown> | null
  error?: string | null
  restored?: boolean
}

export type DiffKind = 'onlyA' | 'onlyB' | 'identical' | 'diverged'

export interface NodeDiff {
  nodeId: string
  nodeKind: string
  diff: DiffKind
  a: DiffEntry | null
  b: DiffEntry | null
  changedKeys: string[]
}

function changedOutputKeys(a: DiffEntry, b: DiffEntry): string[] {
  const oa = a.outputs ?? {}
  const ob = b.outputs ?? {}
  const keys: string[] = []
  for (const k of new Set([...Object.keys(oa), ...Object.keys(ob)])) {
    if (canonicalEncode(oa[k]) !== canonicalEncode(ob[k])) keys.push(k)
  }
  return keys
}

/** Node-by-node comparison: run A's order, then nodes only in B in B's order. */
export function diffTimelines(a: readonly DiffEntry[], b: readonly DiffEntry[]): NodeDiff[] {
  const inB = new Map(b.map((e) => [e.nodeId, e]))
  const inA = new Set(a.map((e) => e.nodeId))
  const rows: NodeDiff[] = a.map((ea) => {
    const eb = inB.get(ea.nodeId)
    if (!eb) return { nodeId: ea.nodeId, nodeKind: ea.nodeKind, diff: 'onlyA', a: ea, b: null, changedKeys: [] }
    const changedKeys = changedOutputKeys(ea, eb)
    const sameStatus = normaliseStatus(ea.status) === normaliseStatus(eb.status)
    const sameError = (ea.error ?? null) === (eb.error ?? null)
    return { nodeId: ea.nodeId, nodeKind: ea.nodeKind, diff: sameStatus && sameError && !changedKeys.length ? 'identical' : 'diverged', a: ea, b: eb, changedKeys }
  })
  for (const eb of b) if (!inA.has(eb.nodeId)) rows.push({ nodeId: eb.nodeId, nodeKind: eb.nodeKind, diff: 'onlyB', a: null, b: eb, changedKeys: [] })
  return rows
}

export interface VariableDiff {
  key: string
  diff: DiffKind
  a: unknown
  b: unknown
}

/** One row per key of either map, A's keys first then B's new keys. */
export function diffVariables(a?: Record<string, unknown> | null, b?: Record<string, unknown> | null): VariableDiff[] {
  const ma = a ?? {}
  const mb = b ?? {}
  const keys = [...Object.keys(ma), ...Object.keys(mb).filter((k) => !(k in ma))]
  return keys.map((key) => {
    const hasA = key in ma
    const hasB = key in mb
    const diff: DiffKind = !hasB ? 'onlyA' : !hasA ? 'onlyB' : canonicalEncode(ma[key]) === canonicalEncode(mb[key]) ? 'identical' : 'diverged'
    return { key, diff, a: ma[key], b: mb[key] }
  })
}
