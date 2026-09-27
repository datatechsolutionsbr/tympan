// The decision behind a rewind, apart from its dialog: which steps may be the
// cut, what is reused and what runs again, and the small state machine of
// the dialog (choosing, sending, failed).

import { useEffect, useMemo, useReducer } from 'react'
import { normaliseStatus } from './lineage'

export interface RewindNode {
  nodeId: string
  nodeKind: string
  status: string
}

/** A step can be the cut only when it finished. */
export const canCutAt = (step: RewindNode): boolean => normaliseStatus(step.status) === 'completed'

/**
 * Reused = finished steps up to and including the cut; again = everything
 * after the cut, whatever its state. No cut: nothing is reused.
 */
export function splitAtCut(steps: readonly RewindNode[], cut: string | null): { kept: RewindNode[]; rerun: RewindNode[] } {
  const kept: RewindNode[] = []
  const rerun: RewindNode[] = []
  let passed = cut === null || !steps.some((s) => s.nodeId === cut)
  for (const step of steps) {
    if (passed) rerun.push(step)
    else if (canCutAt(step)) kept.push(step)
    if (step.nodeId === cut) passed = true
  }
  return { kept, rerun }
}

export type RewindPhase = { name: 'editing' } | { name: 'sending' } | { name: 'failed'; message: string }

export interface RewindDraft {
  cut: string | null
  reason: string
  phase: RewindPhase
  /** Sentence for the polite region after the person moves the cut. */
  echo: { kept: number; rerun: number } | null
}

export type RewindAction =
  | { kind: 'reset'; cut: string | null }
  | { kind: 'cut'; cut: string; kept: number; rerun: number }
  | { kind: 'reason'; text: string }
  | { kind: 'send' }
  | { kind: 'fail'; message: string }
  | { kind: 'sent' }

const transitions: { [K in RewindAction['kind']]: (d: RewindDraft, a: Extract<RewindAction, { kind: K }>) => RewindDraft } = {
  reset: (_d, a) => ({ cut: a.cut, reason: '', phase: { name: 'editing' }, echo: null }),
  cut: (d, a) => ({ ...d, cut: a.cut, echo: { kept: a.kept, rerun: a.rerun } }),
  reason: (d, a) => ({ ...d, reason: a.text }),
  send: (d) => ({ ...d, phase: { name: 'sending' } }),
  fail: (d, a) => ({ ...d, phase: { name: 'failed', message: a.message } }),
  sent: (d) => ({ ...d, phase: { name: 'editing' } }),
}

export function rewindStep(draft: RewindDraft, action: RewindAction): RewindDraft {
  return (transitions[action.kind] as (d: RewindDraft, a: RewindAction) => RewindDraft)(draft, action)
}

/** Dialog state; re-seeds on every opening (requested step if eligible, else the first eligible). */
export function useRewindPlan(open: boolean, steps: readonly RewindNode[], requested: string | undefined) {
  const eligible = useMemo(() => steps.filter(canCutAt), [steps])
  const [draft, act] = useReducer(rewindStep, { cut: null, reason: '', phase: { name: 'editing' }, echo: null })
  useEffect(() => {
    if (open) act({ kind: 'reset', cut: (eligible.find((s) => s.nodeId === requested) ?? eligible[0])?.nodeId ?? null })
    // re-seed on opening only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const split = useMemo(() => splitAtCut(steps, draft.cut), [steps, draft.cut])
  const moveCut = (cut: string) => {
    const preview = splitAtCut(steps, cut)
    act({ kind: 'cut', cut, kept: preview.kept.length, rerun: preview.rerun.length })
  }
  return { eligible, draft, act, split, moveCut }
}
