// EntityListLoader (spec: wave-2/entity-list-loader.md). Loads a page's list
// and reloads it whenever the revalidation key changes (by default the
// router adapter's location key).
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useLocationKey } from '../router-adapter/RouterAdapter'

export interface EntityListOptions<T> {
  initial?: T[]
  /** Refetch trigger; `null` disables automatic fetching. Defaults to the location key. */
  revalidationKey?: string | number | null
}

export interface EntityListState<T> {
  items: T[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  setItems: Dispatch<SetStateAction<T[]>>
}

const toError = (reason: unknown) => (reason instanceof Error ? reason : new Error(typeof reason === 'string' ? reason : String(reason)))

export function useEntityListLoader<T>(fetcher: () => Promise<T[] | null | undefined>, options: EntityListOptions<T> = {}): EntityListState<T> {
  const locationKey = useLocationKey()
  const key = options.revalidationKey === undefined ? locationKey : options.revalidationKey
  const [items, setItems] = useState<T[]>(() => options.initial ?? [])
  const [loading, setLoading] = useState(key !== null)
  const [error, setError] = useState<Error | null>(null)

  // Always call the newest fetcher without making it an effect dependency.
  const latest = useRef(fetcher)
  latest.current = fetcher
  // Each request gets a ticket; only the newest live ticket may write state.
  const ticket = useRef(0)
  const alive = useRef(true)

  const load = useCallback(async () => {
    const mine = ++ticket.current
    setLoading(true)
    try {
      const result = await latest.current()
      if (!alive.current || mine !== ticket.current) return
      setItems(result ?? [])
      setError(null)
    } catch (reason) {
      if (!alive.current || mine !== ticket.current) return
      setError(toError(reason))
    } finally {
      if (alive.current && mine === ticket.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    if (key === null) {
      setLoading(false)
      return
    }
    void load()
  }, [key, load])

  return { items, loading, error, refresh: load, setItems }
}
