// Run vocabulary shared by the run views, dialogs and the timeline.

import type { ActorKind } from '@fakhir/design-system'

/** Who started or produced something (design direction §2.11). */
export interface RunActor {
  kind: ActorKind
  name: string
  agentKey?: string
  model?: string
  email?: string
}

/** One node's outcome inside a stored run. */
export interface RunNodeResult {
  nodeId: string
  label?: string
  kind?: string
  status: string
  durationMs?: number
  error?: string
  outputs?: unknown
}

/** A past or current run as returned by the host's `loadRuns`. */
export interface RunSummary {
  id: string
  /** Engine status; normalised by the views (completed, succeeded … read as completed). */
  status: string
  startedAt: string
  durationMs?: number
  nodeResults?: RunNodeResult[]
  /** "kind:baseRunId" lineage text written by the engine (RunLineageAndDiff). */
  triggeredBy?: string | null
  actor?: RunActor
  inputs?: Record<string, unknown>
}

export type LoadRuns = (flowId: string) => Promise<RunSummary[]>

/** Events of the run-event stream projected onto the editor state. */
export type RunEvent =
  | { type: 'run-started'; runId?: string }
  | { type: 'node-started'; nodeId: string }
  | { type: 'node-completed'; nodeId: string; outputs?: unknown; durationMs?: number }
  | { type: 'node-restored'; nodeId: string; outputs?: unknown; durationMs?: number }
  | { type: 'node-failed'; nodeId: string; error?: string; durationMs?: number }
  | { type: 'run-completed'; runId?: string }
  | { type: 'run-failed'; runId?: string; error?: string }
  | { type: string; [key: string]: unknown }

export type StreamStatus = 'idle' | 'streaming' | 'completed' | 'failed' | 'error'

/** Normalised word set the views show (always with an icon). */
export type RunWord = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'restored' | 'unknown'
