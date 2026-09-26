// Run history loading plus two readers that dig usage figures out of the
// free-form outputs steps report (token counts, tool calls).

import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { LoadRuns, RunSummary } from './types'

export interface RunHistory {
  runs: RunSummary[]
  state: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  retry: () => void
}

type Ledger = Omit<RunHistory, 'retry'> & { round: number }
type LedgerStep = { to: 'loading' } | { to: 'ready'; runs: RunSummary[] } | { to: 'error'; message: string } | { to: 'again' }

function ledger(prev: Ledger, step: LedgerStep): Ledger {
  if (step.to === 'again') return { ...prev, round: prev.round + 1 }
  if (step.to === 'loading') return { ...prev, state: 'loading', error: null }
  if (step.to === 'ready') return { ...prev, state: 'ready', runs: step.runs }
  return { ...prev, state: 'error', error: step.message }
}

/** Fetches the runs while `active`, again when `reloadKey` changes; an answer that arrives late is dropped. */
export function useRunHistory(flowId: string, loadRuns: LoadRuns | undefined, active: boolean, reloadKey: unknown = 0): RunHistory {
  const [book, apply] = useReducer(ledger, { runs: [], state: 'idle', error: null, round: 0 })
  useEffect(() => {
    if (!active || !loadRuns) return
    let current = true
    apply({ to: 'loading' })
    loadRuns(flowId)
      .then((runs) => current && apply({ to: 'ready', runs }))
      .catch((why: unknown) => current && apply({ to: 'error', message: why instanceof Error ? why.message : String(why) }))
    return () => {
      current = false
    }
  }, [flowId, loadRuns, active, reloadKey, book.round])
  const retry = useCallback(() => apply({ to: 'again' }), [])
  return { runs: book.runs, state: book.state, error: book.error, retry }
}

/** Runs `effect` once each time `value` goes from `from` to `to`. */
export function useTransition<T>(value: T, from: T, to: T, effect: () => void): void {
  const seen = useRef(value)
  const handler = useRef(effect)
  handler.current = effect
  useEffect(() => {
    const before = seen.current
    seen.current = value
    if (Object.is(before, from) && Object.is(value, to)) handler.current()
  }, [value, from, to])
}

export interface TokenUsage {
  input: number
  output: number
  total: number
}

type Bag = Record<string, unknown>
const isBag = (v: unknown): v is Bag => typeof v === 'object' && v !== null && !Array.isArray(v)
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/** Spellings providers use for the (in, out) token pair. */
const TOKEN_FIELDS: ReadonlyArray<readonly [string, string]> = [
  ['input_tokens', 'output_tokens'],
  ['inputTokens', 'outputTokens'],
  ['prompt_tokens', 'completion_tokens'],
  ['promptTokens', 'completionTokens'],
  ['input', 'output'],
]
const USAGE_HOLDERS = ['usage', 'tokenUsage', 'token_usage', 'tokens']
const TOOL_LISTS = ['toolCalls', 'tool_calls', 'tools']

/** Every usage block found in a value, searching nested objects up to a small depth. */
function* usageBlocks(v: unknown, depth = 0): Generator<[number, number]> {
  if (!isBag(v) || depth > 3) return
  const holder = USAGE_HOLDERS.map((k) => v[k]).find(isBag)
  const pair = holder && TOKEN_FIELDS.find(([i, o]) => typeof holder[i] === 'number' || typeof holder[o] === 'number')
  if (holder && pair) {
    yield [count(holder[pair[0]]), count(holder[pair[1]])]
    return
  }
  for (const inner of Object.values(v)) yield* usageBlocks(inner, depth + 1)
}

/** Token usage summed over step outputs; null when no step reports any. */
export function sumTokens(outputs: readonly unknown[]): TokenUsage | null {
  const blocks = outputs.flatMap((o) => [...usageBlocks(o)])
  if (blocks.length === 0) return null
  const input = blocks.reduce((s, [i]) => s + i, 0)
  const output = blocks.reduce((s, [, o]) => s + o, 0)
  return { input, output, total: input + output }
}

function toolName(call: unknown): string | undefined {
  if (typeof call === 'string') return call || undefined
  if (!isBag(call)) return undefined
  const named = call.name ?? call.tool ?? (isBag(call.function) ? call.function.name : undefined)
  return typeof named === 'string' && named ? named : undefined
}

/** How often each tool was called, from common tool-call shapes; null when none. */
export function countTools(outputs: readonly unknown[]): Array<{ name: string; count: number }> | null {
  const names = outputs
    .filter(isBag)
    .flatMap((o) => TOOL_LISTS.flatMap((k) => (Array.isArray(o[k]) ? (o[k] as unknown[]) : [])))
    .map(toolName)
    .filter((n): n is string => !!n)
  if (!names.length) return null
  const tally = names.reduce((m, n) => m.set(n, (m.get(n) ?? 0) + 1), new Map<string, number>())
  return Array.from(tally, ([name, n]) => ({ name, count: n }))
}

/** Readable text of an output value (strings as they are, the rest indented). */
export function prettyValue(value: unknown): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
