// Loading run history and reading usage figures out of node outputs.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LoadRuns, RunSummary } from './types'

export interface RunHistory {
  runs: RunSummary[]
  state: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  retry: () => void
}

/** Loads runs when `active` becomes true and whenever `reloadKey` changes while active. Late answers are ignored. */
export function useRunHistory(flowId: string, loadRuns: LoadRuns | undefined, active: boolean, reloadKey: unknown = 0): RunHistory {
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [state, setState] = useState<RunHistory['state']>('idle')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const ticket = useRef(0)
  useEffect(() => {
    if (!active || !loadRuns) return
    const mine = ++ticket.current
    setState('loading')
    setError(null)
    loadRuns(flowId).then(
      (list) => {
        if (mine !== ticket.current) return
        setRuns(list)
        setState('ready')
      },
      (err: unknown) => {
        if (mine !== ticket.current) return
        setError(err instanceof Error ? err.message : String(err))
        setState('error')
      },
    )
    return () => {
      ticket.current++
    }
  }, [flowId, loadRuns, active, reloadKey, attempt])
  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { runs, state, error, retry }
}

/** Calls `fn` when `value` changes from `from` to `to`. */
export function useTransition<T>(value: T, from: T, to: T, fn: () => void): void {
  const prev = useRef(value)
  const latest = useRef(fn)
  latest.current = fn
  useEffect(() => {
    if (Object.is(prev.current, from) && Object.is(value, to)) latest.current()
    prev.current = value
  }, [value, from, to])
}

export interface TokenUsage {
  input: number
  output: number
  total: number
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function usageOf(o: Record<string, unknown>): { input: number; output: number } | null {
  const pairs: Array<[string, string]> = [
    ['input_tokens', 'output_tokens'],
    ['inputTokens', 'outputTokens'],
    ['prompt_tokens', 'completion_tokens'],
    ['promptTokens', 'completionTokens'],
    ['input', 'output'],
  ]
  for (const [i, o2] of pairs) if (typeof o[i] === 'number' || typeof o[o2] === 'number') return { input: n(o[i]), output: n(o[o2]) }
  return null
}

/** Best-effort sum of token usage reported in node outputs; null when none reports it. */
export function sumTokens(outputs: readonly unknown[]): TokenUsage | null {
  let found = false
  let input = 0
  let output = 0
  const visit = (v: unknown, depth: number) => {
    if (!isObj(v) || depth > 3) return
    for (const key of ['usage', 'tokenUsage', 'token_usage', 'tokens']) {
      const u = v[key]
      if (isObj(u)) {
        const got = usageOf(u)
        if (got) {
          found = true
          input += got.input
          output += got.output
          return
        }
      }
    }
    for (const child of Object.values(v)) if (isObj(child)) visit(child, depth + 1)
  }
  for (const o of outputs) visit(o, 0)
  return found ? { input, output, total: input + output } : null
}

/** Tool names called, with counts, from common tool-call shapes; null when none. */
export function countTools(outputs: readonly unknown[]): Array<{ name: string; count: number }> | null {
  const counts = new Map<string, number>()
  const add = (name: unknown) => {
    if (typeof name === 'string' && name) counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  for (const o of outputs) {
    if (!isObj(o)) continue
    for (const key of ['toolCalls', 'tool_calls', 'tools']) {
      const list = o[key]
      if (!Array.isArray(list)) continue
      for (const call of list) {
        if (typeof call === 'string') add(call)
        else if (isObj(call)) add(call.name ?? call.tool ?? (isObj(call.function) ? call.function.name : undefined))
      }
    }
  }
  return counts.size ? [...counts.entries()].map(([name, count]) => ({ name, count })) : null
}

/** Pretty structured text for outputs. */
export function prettyValue(value: unknown): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
