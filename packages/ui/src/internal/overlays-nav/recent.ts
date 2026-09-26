// Remembered choices of the CommandPalette.
//
// Persisted under a host key as one JSON object: { [id]: [timesChosen, lastChosenAt] }.
// Storage may be missing, blocked or full; every access is guarded and a
// broken store simply reads as empty.

export interface ChoiceStat {
  id: string
  /** How many times it was chosen. */
  count: number
  /** When it was last chosen (epoch ms). */
  at: number
}

type Ledger = Record<string, [number, number]>

function box(): Pick<Storage, 'getItem' | 'setItem'> | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

function readLedger(key: string): Ledger {
  let text: string | null | undefined
  try {
    text = box()?.getItem(key)
  } catch {
    return {}
  }
  if (!text) return {}
  try {
    const value: unknown = JSON.parse(text)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    const clean: Ledger = {}
    for (const [id, pair] of Object.entries(value as Record<string, unknown>)) {
      if (Array.isArray(pair) && typeof pair[0] === 'number' && typeof pair[1] === 'number') clean[id] = [pair[0], pair[1]]
    }
    return clean
  } catch {
    return {}
  }
}

const toStats = (ledger: Ledger): ChoiceStat[] => Object.entries(ledger).map(([id, [count, at]]) => ({ id, count, at }))

/** Everything remembered under `key`. */
export function readChoices(key: string): ChoiceStat[] {
  return toStats(readLedger(key))
}

/** Most chosen first; ties go to the most recent. */
export function orderChoices(stats: readonly ChoiceStat[]): ChoiceStat[] {
  return stats.slice().sort((x, y) => (x.count === y.count ? y.at - x.at : y.count - x.count))
}

/** Counts one more choice of `id`, keeps the `limit` most recent ids, returns the result. */
export function recordChoice(key: string, id: string, limit = 12, when = Date.now()): ChoiceStat[] {
  const ledger = readLedger(key)
  const [times] = ledger[id] ?? [0, 0]
  ledger[id] = [times + 1, when]
  const newestFirst = toStats(ledger)
    .sort((x, y) => y.at - x.at)
    .slice(0, limit)
  const trimmed: Ledger = Object.fromEntries(newestFirst.map((s) => [s.id, [s.count, s.at]]))
  try {
    box()?.setItem(key, JSON.stringify(trimmed))
  } catch {
    /* full or blocked: keep going without persistence */
  }
  return newestFirst
}
