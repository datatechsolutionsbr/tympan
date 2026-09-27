// Run lineage and run comparison, as pure data functions.
//
// A derived run carries an origin tag written by the engine ("replay:r7",
// "approval:r7:review"). Comparison lines two execution records up by step id
// and names what differs, using one canonical text form for every equality.

export type LineageKind = 'reset' | 'replay' | 'resume' | 'fork' | 'signal' | 'timer' | 'approval'

/** Origin of a derived run: how it was made and from which run (and step, for approvals). */
export interface Lineage {
  kind: LineageKind
  baseRunId: string
  nodeId?: string
}

const ORIGIN_TAG = /^(reset|replay|resume|fork|signal|timer|approval):(.+)$/s

/** Origin of a run from its tag; null for root runs (people, webhooks, schedules) and malformed tags. */
export function parseLineage(tag: string | null | undefined): Lineage | null {
  const match = tag ? ORIGIN_TAG.exec(tag) : null
  if (!match) return null
  const kind = match[1] as LineageKind
  const tail = match[2]!
  if (kind !== 'approval') return { kind, baseRunId: tail }
  const [run, ...stepParts] = tail.split(':')
  if (!run) return null
  const step = stepParts.join(':')
  return step ? { kind, baseRunId: run, nodeId: step } : { kind, baseRunId: run }
}

/** Id of the last carried-over step (stored order), or null. */
export function findForkPoint(steps: ReadonlyArray<{ nodeId: string; restored?: boolean }>): string | null {
  return steps.reduce<string | null>((found, step) => (step.restored ? step.nodeId : found), null)
}

/** Wire spellings of a status ("PausedForApproval", "PAUSED_FOR_APPROVAL", "paused for approval") collapse to snake case. */
export function normaliseStatus(raw: string): string {
  const words = raw
    .trim()
    .split(/(?<=[a-z0-9])(?=[A-Z])|[\s_-]+/)
    .filter(Boolean)
  return words.join('_').toLowerCase()
}

/** Structured text of a value with object keys in sorted order at every depth. */
export function canonicalEncode(value: unknown): string {
  const text = JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([p], [q]) => (p < q ? -1 : p > q ? 1 : 0)))
      : v,
  )
  return text ?? 'undefined'
}

const sameValue = (x: unknown, y: unknown) => canonicalEncode(x) === canonicalEncode(y)

/** One step of a recorded execution, as compared. */
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

export interface VariableDiff {
  key: string
  diff: DiffKind
  a: unknown
  b: unknown
}

/** Keys of A first, then keys only B has, each once. */
function unionKeys(left: Record<string, unknown>, right: Record<string, unknown>): string[] {
  return [...new Set([...Object.keys(left), ...Object.keys(right)])]
}

function verdict(inLeft: boolean, inRight: boolean, equal: () => boolean): DiffKind {
  if (!inRight) return 'onlyA'
  if (!inLeft) return 'onlyB'
  return equal() ? 'identical' : 'diverged'
}

/** Step-by-step comparison: A's order, then steps only B ran, in B's order. */
export function diffTimelines(a: readonly DiffEntry[], b: readonly DiffEntry[]): NodeDiff[] {
  const left = new Map(a.map((s) => [s.nodeId, s]))
  const right = new Map(b.map((s) => [s.nodeId, s]))
  const order = [...new Set([...left.keys(), ...right.keys()])]
  return order.map((id) => {
    const x = left.get(id) ?? null
    const y = right.get(id) ?? null
    const outputsX = x?.outputs ?? {}
    const outputsY = y?.outputs ?? {}
    const changedKeys = x && y ? unionKeys(outputsX, outputsY).filter((k) => !sameValue(outputsX[k], outputsY[k])) : []
    const diff = verdict(!!x, !!y, () => normaliseStatus(x!.status) === normaliseStatus(y!.status) && (x!.error ?? null) === (y!.error ?? null) && changedKeys.length === 0)
    return { nodeId: id, nodeKind: (x ?? y)!.nodeKind, diff, a: x, b: y, changedKeys }
  })
}

/** One row per variable of either map. */
export function diffVariables(a?: Record<string, unknown> | null, b?: Record<string, unknown> | null): VariableDiff[] {
  const left = a ?? {}
  const right = b ?? {}
  return unionKeys(left, right).map((key) => ({
    key,
    diff: verdict(key in left, key in right, () => sameValue(left[key], right[key])),
    a: left[key],
    b: right[key],
  }))
}
