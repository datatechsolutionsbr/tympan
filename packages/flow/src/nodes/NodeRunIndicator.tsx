// NodeRunIndicator: a node's state in the current or inspected run (pending,
// running, succeeded, failed) with the duration once finished. The mark is not
// focusable; its words join the node's accessible name through useRunWords.

import { useEffect, useRef } from 'react'
import { CircleCheck, CircleX, Clock, LoaderCircle } from 'lucide-react'
import { runStateOf, type NodeRunState } from '../catalog/nodeState'
import { useAnnounce } from '../internal/Announcer'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { NodeResultStatus, NodeRunResult } from '../model/types'
import { useNodeResult } from '../state/editorState'

export interface NodeRunLabels {
  pending: string
  running: string
  succeeded: string
  succeededIn: string
  failed: string
  failedWith: string
  /** Live announcement for the focused node: "{node}: {state}". */
  announce: string
  milliseconds: string
  seconds: string
}

export const nodeRunLabels = defineLabels<NodeRunLabels>('nodeRun', {
  en: {
    pending: 'waiting',
    running: 'running',
    succeeded: 'succeeded',
    succeededIn: 'succeeded in {duration}',
    failed: 'failed',
    failedWith: 'failed: {message}',
    announce: '{node}: {state}',
    milliseconds: '{value, number} ms',
    seconds: '{value} s',
  },
  'pt-BR': {
    pending: 'aguardando',
    running: 'em execução',
    succeeded: 'concluída',
    succeededIn: 'concluída em {duration}',
    failed: 'falhou',
    failedWith: 'falhou: {message}',
    announce: '{node}: {state}',
    milliseconds: '{value, number} ms',
    seconds: '{value} s',
  },
  es: {
    pending: 'en espera',
    running: 'en ejecución',
    succeeded: 'completado',
    succeededIn: 'completado en {duration}',
    failed: 'falló',
    failedWith: 'falló: {message}',
    announce: '{node}: {state}',
    milliseconds: '{value, number} ms',
    seconds: '{value} s',
  },
})
export const defaultNodeRunLabels = nodeRunLabels.bundles.en

/**
 * Under one second: whole milliseconds ("340 ms"); otherwise seconds with one
 * decimal ("2.5 s", "2,5 s"). SI symbols, locale digits and separators.
 */
export function formatRunDuration(ms: number, locale: string, l: Pick<NodeRunLabels, 'milliseconds' | 'seconds'> = defaultNodeRunLabels): string {
  if (!Number.isFinite(ms) || ms < 0) return ''
  if (ms < 1000) return fill(l.milliseconds, { value: Math.round(ms) }, locale)
  const value = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ms / 1000)
  return fill(l.seconds, { value }, locale)
}

/** Words for a result, used in the node's accessible name. */
export function runWords(result: NodeRunResult | undefined, locale: string, l: NodeRunLabels): string | null {
  if (!result) return null
  const duration = result.durationMs !== undefined ? formatRunDuration(result.durationMs, locale, l) : ''
  switch (result.status) {
    case 'pending':
      return l.pending
    case 'running':
      return l.running
    case 'success':
      return duration ? fill(l.succeededIn, { duration }, locale) : l.succeeded
    case 'error': {
      const base = result.error ? fill(l.failedWith, { message: result.error }, locale) : l.failed
      return duration ? `${base}, ${duration}` : base
    }
  }
}

/** Run state and words of a node from the editor state (nothing outside an editor). */
export function useRunWords(nodeId: string, labels?: Partial<NodeRunLabels>): { result: NodeRunResult | undefined; runState: NodeRunState; words: string | null } {
  const result = useNodeResult(nodeId)
  const l = useLabels(nodeRunLabels, labels)
  const { locale } = useFlowLocale()
  return { result, runState: runStateOf(result?.status), words: runWords(result, locale, l) }
}

const MARKS: Record<NodeResultStatus, typeof Clock> = { pending: Clock, running: LoaderCircle, success: CircleCheck, error: CircleX }

export interface NodeRunIndicatorProps {
  nodeId: string
  /** Node kind (kept for hosts that tint per kind; the ring uses the pending semantic colour). */
  kind?: string
  /** Name used in the focused-node announcement. */
  nodeLabel?: string
  labels?: Partial<NodeRunLabels>
}

export function NodeRunIndicator({ nodeId, kind, nodeLabel, labels }: NodeRunIndicatorProps) {
  const result = useNodeResult(nodeId)
  const l = useLabels(nodeRunLabels, labels)
  const { locale } = useFlowLocale()
  const announce = useAnnounce()
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef<NodeResultStatus | undefined>(result?.status)

  useEffect(() => {
    const before = previous.current
    previous.current = result?.status
    if (!result || before === undefined || before === result.status) return
    // One region per editor: announce only for the node that has focus.
    const card = ref.current?.closest('.ty-node-card, [data-ty-node-id]')
    if (card && card.contains(document.activeElement)) {
      announce(fill(l.announce, { node: nodeLabel ?? nodeId, state: runWords(result, locale, l) ?? '' }, locale))
    }
  }, [result, announce, l, locale, nodeId, nodeLabel])

  if (!result) return null
  const Mark = MARKS[result.status]
  const done = result.status === 'success' || result.status === 'error'
  return (
    <span ref={ref} className="ty-node-run-indicator" data-status={result.status} data-kind={kind} aria-hidden="true" title={result.error}>
      <Mark className="ty-node-run-indicator__mark" focusable="false" />
      {done && result.durationMs !== undefined ? <span className="ty-node-run-indicator__duration">{formatRunDuration(result.durationMs, locale, l)}</span> : null}
    </span>
  )
}
