// Words and shapes the run group speaks: stored runs as the host returns
// them, the live event stream, and the status vocabulary shown on screen.

import type { ActorKind } from '@datatechsolutions/tympan'

/** Status word every run view shows (always beside an icon). */
export type RunWord = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'restored' | 'unknown'

/** State of the connection that delivers run events. */
export type StreamStatus = 'idle' | 'streaming' | 'completed' | 'failed' | 'error'

/** The person, agent or system behind a run or a version (design direction §2.11). */
export type RunActor = { kind: ActorKind; name: string } & Partial<Record<'agentKey' | 'model' | 'email', string>>

/** Outcome of one step inside a stored run. */
export type RunNodeResult = {
  nodeId: string
  status: string
} & Partial<{ label: string; kind: string; durationMs: number; error: string; outputs: unknown }>

/**
 * A run as the host's loader returns it. `status` is the engine's own
 * spelling; views normalise it. `triggeredBy` is the engine's origin tag
 * ("kind:baseRunId"), read with parseLineage.
 */
export type RunSummary = {
  id: string
  status: string
  startedAt: string
} & Partial<{
  durationMs: number
  nodeResults: RunNodeResult[]
  triggeredBy: string | null
  actor: RunActor
  inputs: Record<string, unknown>
}>

export type LoadRuns = (flowId: string) => Promise<RunSummary[]>

/** Payload per event name of the run stream; the union below is derived from it. */
type StepTiming = { outputs?: unknown; durationMs?: number }
interface RunEventPayloads {
  'run-started': { runId?: string }
  'run-completed': { runId?: string }
  'run-failed': { runId?: string; error?: string }
  'node-started': { nodeId: string }
  'node-completed': { nodeId: string } & StepTiming
  'node-restored': { nodeId: string } & StepTiming
  'node-failed': { nodeId: string; error?: string; durationMs?: number }
}

/** Events of the run stream; names the projection does not know are allowed and ignored. */
export type RunEvent = { [Name in keyof RunEventPayloads]: { type: Name } & RunEventPayloads[Name] }[keyof RunEventPayloads] | { type: string; [key: string]: unknown }
