// RunExecutionState: start and stop a run through host transport, follow its
// event stream and project the events onto FlowEditorState.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOptionalFlowEditorStore, type FlowEditorActions } from '../state/editorState'
import type { RunEvent, StreamStatus } from './types'

type ProjectionActions = Pick<FlowEditorActions, 'setRunning' | 'setNodeResult' | 'clearNodeResults'>

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)

/** Applies one run event to the editor state. Pure apart from the actions it calls. */
export function applyRunEvent(actions: ProjectionActions, event: RunEvent): void {
  const e = event as Record<string, unknown> & { type: string }
  const nodeId = typeof e.nodeId === 'string' ? e.nodeId : null
  switch (e.type) {
    case 'run-started':
      // Never clears results: a suspended run that resumes sends it again.
      actions.setRunning(true)
      return
    case 'node-started':
      if (nodeId) actions.setNodeResult(nodeId, { status: 'running' })
      return
    case 'node-completed':
    case 'node-restored':
      if (nodeId) {
        const durationMs = num(e.durationMs)
        actions.setNodeResult(nodeId, { status: 'success', data: e.outputs, ...(durationMs !== undefined ? { durationMs } : {}) })
      }
      return
    case 'node-failed':
      if (nodeId) {
        const durationMs = num(e.durationMs)
        actions.setNodeResult(nodeId, { status: 'error', ...(typeof e.error === 'string' ? { error: e.error } : {}), ...(durationMs !== undefined ? { durationMs } : {}) })
      }
      return
    case 'run-completed':
    case 'run-failed':
      actions.setRunning(false)
      return
    default:
      return
  }
}

/** Clears results and sets not running. */
export function resetRunProjection(actions: ProjectionActions): void {
  actions.clearNodeResults()
  actions.setRunning(false)
}

const TERMINAL: readonly StreamStatus[] = ['completed', 'failed', 'error']

/**
 * Applies only the events not yet applied. Clears results only on a genuine
 * reset (status idle, or the list got shorter: a new run). A terminal stream
 * status forces not running; it never forces running.
 */
export function useRunProjection(events: readonly RunEvent[], streamStatus: StreamStatus, target?: ProjectionActions): void {
  const store = useOptionalFlowEditorStore()
  const actions = target ?? store?.actions ?? null
  const applied = useRef(0)
  useEffect(() => {
    if (!actions) return
    if (streamStatus === 'idle' || events.length < applied.current) {
      if (applied.current > 0 || streamStatus === 'idle') resetRunProjection(actions)
      applied.current = 0
      if (streamStatus === 'idle') return
    }
    for (let i = applied.current; i < events.length; i++) applyRunEvent(actions, events[i]!)
    applied.current = events.length
    if (TERMINAL.includes(streamStatus)) actions.setRunning(false)
  }, [events, streamStatus, actions])
}

export type StartRun = (flowId: string, inputs?: Record<string, unknown>) => Promise<{ id: string }>

export interface RunStreamHandlers {
  onEvent(event: RunEvent): void
  onStatus?(status: StreamStatus): void
  signal: AbortSignal
}

/** Host transport for the run-event stream; may return a disposer. */
export type OpenRunStream = (runId: string, handlers: RunStreamHandlers) => void | (() => void)

export type CancelRun = (runId: string) => Promise<void>

export interface FlowExecution {
  isRunning: boolean
  start(inputs?: Record<string, unknown>): Promise<void>
  stop(): Promise<void>
  runId: string | null
  streamStatus: StreamStatus
  /** After stop without cancelRun the run continues server side: say "stopped following". */
  stopped: null | 'cancelled' | 'stopped-following'
  events: readonly RunEvent[]
}

const ENDS = new Set(['run-completed', 'run-failed'])

export function useFlowExecution(flowId: string, startRun: StartRun, openStream: OpenRunStream, cancelRun?: CancelRun): FlowExecution {
  const [isRunning, setIsRunning] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [events, setEvents] = useState<RunEvent[]>([])
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle')
  const [stopped, setStopped] = useState<FlowExecution['stopped']>(null)
  const controller = useRef<AbortController | null>(null)
  const dispose = useRef<(() => void) | null>(null)
  const generation = useRef(0)
  const live = useRef({ startRun, openStream, cancelRun })
  live.current = { startRun, openStream, cancelRun }

  useRunProjection(events, streamStatus)

  const detach = useCallback(() => {
    controller.current?.abort()
    controller.current = null
    dispose.current?.()
    dispose.current = null
  }, [])

  const forget = useCallback(() => {
    generation.current++
    detach()
    setIsRunning(false)
    setRunId(null)
    setEvents([])
    setStreamStatus('idle')
  }, [detach])

  // A different flow resets everything.
  useEffect(() => {
    forget()
    setStopped(null)
    return detach
  }, [flowId, forget, detach])

  const start = useCallback(
    async (inputs?: Record<string, unknown>) => {
      detach()
      const gen = ++generation.current
      setStopped(null)
      setEvents([])
      setStreamStatus('idle')
      setIsRunning(true)
      let run: { id: string }
      try {
        run = await live.current.startRun(flowId, inputs)
      } catch (err) {
        if (gen === generation.current) setIsRunning(false)
        throw err
      }
      if (gen !== generation.current) return
      setRunId(run.id)
      const ac = new AbortController()
      controller.current = ac
      setStreamStatus('streaming')
      const off = live.current.openStream(run.id, {
        signal: ac.signal,
        onEvent: (event) => {
          if (gen !== generation.current) return
          setEvents((prev) => [...prev, event])
          // Run content decides the end, not the connection.
          if (ENDS.has(event.type)) setIsRunning(false)
        },
        onStatus: (status) => {
          if (gen !== generation.current) return
          setStreamStatus(status)
          if (TERMINAL.includes(status) && status !== 'error') setIsRunning(false)
        },
      })
      if (typeof off === 'function') dispose.current = off
    },
    [flowId, detach],
  )

  const stop = useCallback(async () => {
    const id = runId
    const cancel = live.current.cancelRun
    if (id && cancel) await cancel(id)
    setStopped(cancel ? 'cancelled' : 'stopped-following')
    forget()
  }, [runId, forget])

  return { isRunning, start, stop, runId, streamStatus, stopped, events }
}
