// Recent-choice store for CommandPalette: id → { uses, last }, persisted as
// JSON under a host key. Every storage access is guarded; a missing or
// blocked storage simply behaves as an empty store.

export interface RecentEntry {
  id: string
  uses: number
  last: number
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function loadRecent(key: string): RecentEntry[] {
  try {
    const raw = storage()?.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is RecentEntry => !!e && typeof e.id === 'string' && typeof e.uses === 'number' && typeof e.last === 'number',
    )
  } catch {
    return []
  }
}

/** Orders by use count, then by recency (newest first). */
export function rankRecent(list: readonly RecentEntry[]): RecentEntry[] {
  return [...list].sort((a, b) => b.uses - a.uses || b.last - a.last)
}

export function noteRecent(key: string, id: string, keep = 12, now = Date.now()): RecentEntry[] {
  const list = loadRecent(key)
  const found = list.find((e) => e.id === id)
  if (found) {
    found.uses += 1
    found.last = now
  } else list.push({ id, uses: 1, last: now })
  const kept = [...list].sort((a, b) => b.last - a.last).slice(0, keep)
  try {
    storage()?.setItem(key, JSON.stringify(kept))
  } catch {
    /* storage full or blocked: keep working without it */
  }
  return kept
}
