// Run-event stream with resume, bounded retries and a circuit breaker
// (spec: wave-2/live-report-view.md, "Run-event stream").
import { useEffect, useRef, useState } from 'react'
import type { RunEvent } from './runEvents'

export interface RunStreamCallbacks {
  connected: () => void
  event: (event: RunEvent) => void
  /** Last event id seen, used to resume after a reconnect. */
  cursor: (lastEventId: string) => void
  done: (outcome: 'completed' | 'failed') => void
  error: (error: unknown) => void
}

/** Host transport: opens one connection and returns the function that closes it. */
export type OpenRunStream = (flowId: string, runId: string, callbacks: RunStreamCallbacks, lastEventId: string | null) => () => void

export type RunStreamStatus = 'idle' | 'streaming' | 'completed' | 'failed' | 'error'

export interface RunStreamOptions {
  /** Consecutive retries before giving up (default 3). */
  maxRetries?: number
  /** First backoff in ms, doubled per retry (default 500). */
  backoffMs?: number
  /** Backoff cap in ms (default 4000). */
  maxBackoffMs?: number
  /** Connection attempts allowed inside `breakerWindowMs` (default 6). */
  breakerAttempts?: number
  breakerWindowMs?: number
}

export interface RunStreamState {
  events: RunEvent[]
  status: RunStreamStatus
  error: unknown
}

const IDLE: RunStreamState = { events: [], status: 'idle', error: null }

export function useRunEventStream(flowId: string | null, runId: string | null, openStream: OpenRunStream, options: RunStreamOptions = {}): RunStreamState {
  const [state, setState] = useState<RunStreamState>(IDLE)
  const opener = useRef(openStream)
  opener.current = openStream
  const opts = useRef(options)
  opts.current = options

  useEffect(() => {
    setState(IDLE)
    if (!flowId || !runId) return
    const cfg = { maxRetries: 3, backoffMs: 500, maxBackoffMs: 4000, breakerAttempts: 6, breakerWindowMs: 10_000, ...opts.current }
    let close: (() => void) | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let cursor: string | null = null
    let retries = 0
    let finished = false
    const attempts: number[] = []

    const shutdown = () => {
      if (timer) clearTimeout(timer)
      timer = null
      const c = close
      close = null
      c?.()
    }

    const giveUp = (error: unknown) => {
      finished = true
      shutdown()
      setState((s) => ({ ...s, status: 'error', error }))
    }

    const connect = () => {
      const now = Date.now()
      attempts.push(now)
      while (attempts.length && now - attempts[0]! > cfg.breakerWindowMs) attempts.shift()
      if (attempts.length > cfg.breakerAttempts) return giveUp(new Error('run stream: too many connection attempts'))
      setState((s) => ({ ...s, status: 'streaming' }))
      let alive = true
      const guard =
        <A extends unknown[]>(fn: (...a: A) => void) =>
        (...a: A) => {
          if (alive && !finished) fn(...a)
        }
      close = opener.current(
        flowId,
        runId,
        {
          connected: guard(() => setState((s) => ({ ...s, status: 'streaming', error: null }))),
          event: guard((e: RunEvent) => {
            retries = 0
            setState((s) => ({ ...s, events: [...s.events, e] }))
          }),
          cursor: guard((id: string) => {
            cursor = id
          }),
          done: guard((outcome: 'completed' | 'failed') => {
            finished = true
            shutdown()
            setState((s) => ({ ...s, status: outcome }))
          }),
          error: guard((error: unknown) => {
            alive = false
            const c = close
            close = null
            c?.()
            if (retries >= cfg.maxRetries) return giveUp(error)
            const wait = Math.min(cfg.maxBackoffMs, cfg.backoffMs * 2 ** retries)
            retries += 1
            setState((s) => ({ ...s, error }))
            timer = setTimeout(() => {
              timer = null
              if (!finished) connect()
            }, wait)
          }),
        },
        cursor,
      )
      // A transport may report an error synchronously, before `close` was stored.
      if (!alive && close) {
        const c = close
        close = null
        c()
      }
    }

    connect()
    return () => {
      finished = true
      shutdown()
    }
  }, [flowId, runId])

  return state
}
