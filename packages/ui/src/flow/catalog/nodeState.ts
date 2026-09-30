// NodeStateStyles (wave-4 spec): a node exposes its interaction and run state
// as data attributes; the stylesheet (nodes/node-frame.css) maps them to
// tokens. This helper is the only way components build that attribute map.

import type { NodeResultStatus } from '../model/types'

export type NodeRunState = 'idle' | 'running' | 'suspended' | 'succeeded' | 'failed' | 'skipped'
export type NodeProofState = 'proved' | 'pending' | 'refuted' | 'not_disclosed' | 'none'

export interface NodeStateInput {
  selected?: boolean
  runState?: NodeRunState
  locked?: boolean
  dimmed?: boolean
  /** Border line style of provenance nodes (§2.11). Omit for workflow nodes. */
  proofState?: NodeProofState | null
}

export type NodeStateAttributes = Record<`data-${string}`, string>

export function nodeStateAttributes(state: NodeStateInput = {}): NodeStateAttributes {
  const attrs: NodeStateAttributes = {
    'data-selected': state.selected ? 'true' : 'false',
    'data-run-state': state.runState ?? 'idle',
    'data-locked': state.locked ? 'true' : 'false',
    'data-dimmed': state.dimmed ? 'true' : 'false',
  }
  if (state.proofState !== undefined && state.proofState !== null) {
    attrs['data-proof-state'] = state.proofState.replace('_', '-')
  }
  return attrs
}

/** Editor result status → normalised run state. */
export function runStateOf(status: NodeResultStatus | undefined): NodeRunState {
  switch (status) {
    case 'running':
      return 'running'
    case 'success':
      return 'succeeded'
    case 'error':
      return 'failed'
    default:
      return 'idle'
  }
}
