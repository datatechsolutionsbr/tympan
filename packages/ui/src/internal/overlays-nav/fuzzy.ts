// Subsequence matching with a score, used by CommandPalette. A query matches a
// text when its characters appear in the same order. The score rewards
// contiguous runs, characters at word starts and an early first hit, so that
// "src" ranks "Sources" (a prefix run) above "Shared records catalog".

export interface FuzzyHit {
  score: number
  /** Indices in the text of each matched query character. */
  at: number[]
}

const WORD_EDGE = /[\s\-_/.:,()]/

function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/** Greedy left-to-right scan, then a second pass preferring word starts. */
export function fuzzyHit(query: string, text: string): FuzzyHit | null {
  const q = fold(query.trim())
  if (!q) return { score: 0, at: [] }
  const t = fold(text)
  const direct = t.indexOf(q)
  if (direct >= 0) {
    const edge = direct === 0 || WORD_EDGE.test(t[direct - 1] ?? '')
    const at = Array.from({ length: q.length }, (_, k) => direct + k)
    return { score: 1000 + q.length * 12 + (edge ? 60 : 0) - direct, at }
  }
  const at: number[] = []
  let cursor = 0
  for (const ch of q) {
    // Prefer a word start ahead, fall back to the next occurrence.
    let pick = -1
    for (let i = cursor; i < t.length; i++) {
      if (t[i] !== ch) continue
      if (pick < 0) pick = i
      if (i === 0 || WORD_EDGE.test(t[i - 1] ?? '')) {
        pick = i
        break
      }
    }
    if (pick < 0) return null
    at.push(pick)
    cursor = pick + 1
  }
  let score = 0
  at.forEach((pos, k) => {
    const prev = at[k - 1]
    score += 4
    if (prev !== undefined && pos === prev + 1) score += 10
    if (pos === 0 || WORD_EDGE.test(t[pos - 1] ?? '')) score += 8
  })
  return { score: score - (at[0] ?? 0), at }
}

/** Splits `text` into plain and marked pieces from matched indices. */
export function markPieces(text: string, at: readonly number[]): Array<{ text: string; marked: boolean }> {
  const hits = new Set(at)
  const out: Array<{ text: string; marked: boolean }> = []
  for (let i = 0; i < text.length; i++) {
    const marked = hits.has(i)
    const last = out[out.length - 1]
    if (last && last.marked === marked) last.text += text[i]
    else out.push({ text: text[i] ?? '', marked })
  }
  return out
}
