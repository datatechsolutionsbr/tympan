// EntityListLoader (spec: wave-2/entity-list-loader.md).
//
// State lives in one reducer. Requests are numbered by a small "generation"
// counter kept outside React; a response only lands when its generation is
// still the newest and the host component is still mounted.
import { useCallback, useEffect, useReducer, useRef, type Dispatch, type SetStateAction } from 'react'
import { useLocationKey } from '../router-adapter/RouterAdapter'

export interface ListLoaderOptions<T> {
  initial?: T[]
  /** Refetch trigger; `null` disables automatic fetching. Defaults to the location key. */
  revalidationKey?: string | number | null
}

/** Output names are fixed by the spec. */
export interface ListLoaderResult<T> {
  items: T[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  setItems: Dispatch<SetStateAction<T[]>>
}

interface Snapshot<T> {
  rows: T[]
  busy: boolean
  failure: Error | null
}

type Event<T> =
  | { on: 'start' }
  | { on: 'rows'; rows: T[] }
  | { on: 'fail'; failure: Error }
  | { on: 'idle' }
  | { on: 'edit'; next: SetStateAction<T[]> }

function step<T>(now: Snapshot<T>, event: Event<T>): Snapshot<T> {
  switch (event.on) {
    case 'start':
      return now.busy ? now : { ...now, busy: true }
    case 'rows':
      return { rows: event.rows, busy: false, failure: null }
    case 'fail':
      return { ...now, busy: false, failure: event.failure }
    case 'idle':
      return now.busy ? { ...now, busy: false } : now
    case 'edit':
      return { ...now, rows: typeof event.next === 'function' ? (event.next as (prev: T[]) => T[])(now.rows) : event.next }
  }
}

function asError(reason: unknown): Error {
  if (reason instanceof Error) return reason
  return new Error(typeof reason === 'string' ? reason : String(reason))
}

/** Numbered requests: `issue()` opens one, `current(n)` says whether n may still write. */
function generations() {
  let newest = 0
  let mounted = true
  return {
    issue: () => ++newest,
    current: (n: number) => mounted && n === newest,
    detach: () => {
      mounted = false
    },
    attach: () => {
      mounted = true
    },
  }
}

export function useEntityListLoader<T>(fetcher: () => Promise<T[] | null | undefined>, options: ListLoaderOptions<T> = {}): ListLoaderResult<T> {
  const routeStamp = useLocationKey()
  const trigger = options.revalidationKey === undefined ? routeStamp : options.revalidationKey
  const [snap, send] = useReducer(step<T>, undefined, () => ({ rows: options.initial ?? [], busy: trigger !== null, failure: null }))

  // The newest fetcher is read at call time, so inline functions never loop.
  const source = useRef(fetcher)
  source.current = fetcher
  const gen = useRef(generations()).current

  const refresh = useCallback(async () => {
    const mine = gen.issue()
    send({ on: 'start' })
    let outcome: Event<T>
    try {
      outcome = { on: 'rows', rows: (await source.current()) ?? [] }
    } catch (reason) {
      outcome = { on: 'fail', failure: asError(reason) }
    }
    if (gen.current(mine)) send(outcome)
  }, [gen])

  useEffect(() => {
    gen.attach()
    return gen.detach
  }, [gen])

  useEffect(() => {
    if (trigger === null) send({ on: 'idle' })
    else void refresh()
  }, [trigger, refresh])

  const setItems = useCallback<Dispatch<SetStateAction<T[]>>>((next) => send({ on: 'edit', next }), [])
  return { items: snap.rows, loading: snap.busy, error: snap.failure, refresh, setItems }
}
