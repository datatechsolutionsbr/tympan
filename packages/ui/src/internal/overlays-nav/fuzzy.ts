// Subsequence matching with a score, used by CommandPalette. A query matches a
// text when its characters appear in the same order. The score rewards
// contiguous runs, characters at word starts and an early first hit, so that
// "src" ranks "Sources" (a prefix run) above "Shared records catalog".

export interface FuzzyHit {
  score: number
  /** Indices in the text of each matched query character. */
  at: number[]
}

/** One user-perceived character: its folded form and its UTF-16 range in the source text. */
interface Unit {
  key: string
  from: number
  to: number
  wordStart: boolean
}

// Marks that are optional diacritics: Latin, Greek and Cyrillic accents, and
// Arabic and Hebrew vowel points. Other scripts' marks (Indic vowel signs,
// Thai tone marks…) carry meaning and are kept.
const OPTIONAL_MARK = /[\u0300-\u036f\u0591-\u05c7\u064b-\u065f\u0670\u06d6-\u06ed]/gu

function segmenter(granularity: 'grapheme' | 'word', locale?: string) {
  const Seg = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter
  return Seg ? new Seg(locale, { granularity }) : null
}

/** Folds one grapheme: compatibility-normalised, optional diacritics dropped, locale-lowercased. */
function foldUnit(grapheme: string, locale?: string): string {
  const bare = grapheme.normalize('NFKD').replace(OPTIONAL_MARK, '')
  return (bare || grapheme).normalize('NFC').toLocaleLowerCase(locale)
}

/** Splits text into grapheme units, marking the ones that start a word (any script). */
function unitsOf(text: string, locale?: string): Unit[] {
  const starts = new Set<number>([0])
  const words = segmenter('word', locale)
  if (words) {
    for (const w of words.segment(text)) if (w.isWordLike) starts.add(w.index)
  } else {
    for (const m of text.matchAll(/(?<=[\s\p{P}])\S/gu)) starts.add(m.index)
  }
  const graphemes = segmenter('grapheme', locale)
  const pieces = graphemes ? [...graphemes.segment(text)].map((g) => ({ segment: g.segment, index: g.index })) : [...text].reduce<Array<{ segment: string; index: number }>>((acc, ch) => {
    const prev = acc[acc.length - 1]
    acc.push({ segment: ch, index: prev ? prev.index + prev.segment.length : 0 })
    return acc
  }, [])
  return pieces
    .map((g) => ({ key: foldUnit(g.segment, locale), from: g.index, to: g.index + g.segment.length, wordStart: starts.has(g.index) }))
}

/** UTF-16 indices covered by the matched units (what markPieces expects). */
const covered = (units: Unit[], picked: number[]) => picked.flatMap((k) => Array.from({ length: units[k]!.to - units[k]!.from }, (_, j) => units[k]!.from + j))

/**
 * In-order match of the query's characters in the text, grapheme by
 * grapheme, for any script. `locale` drives lower-casing and word breaks
 * (so CJK and Thai get real word starts).
 */
export function fuzzyHit(query: string, text: string, locale?: string): FuzzyHit | null {
  const q = unitsOf(query.trim(), locale).map((u) => u.key)
  if (!q.length) return { score: 0, at: [] }
  const t = unitsOf(text, locale)
  const keys = t.map((u) => u.key)
  // Contiguous run first.
  for (let i = 0; i + q.length <= keys.length; i++) {
    if (q.every((k, j) => keys[i + j] === k)) {
      const picked = q.map((_, j) => i + j)
      return { score: 1000 + q.length * 12 + (t[i]!.wordStart ? 60 : 0) - i, at: covered(t, picked) }
    }
  }
  const picked: number[] = []
  let cursor = 0
  for (const k of q) {
    let pick = -1
    for (let i = cursor; i < keys.length; i++) {
      if (keys[i] !== k) continue
      if (pick < 0) pick = i
      if (t[i]!.wordStart) {
        pick = i
        break
      }
    }
    if (pick < 0) return null
    picked.push(pick)
    cursor = pick + 1
  }
  let score = 0
  picked.forEach((pos, k) => {
    const prev = picked[k - 1]
    score += 4
    if (prev !== undefined && pos === prev + 1) score += 10
    if (t[pos]!.wordStart) score += 8
  })
  return { score: score - (picked[0] ?? 0), at: covered(t, picked) }
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
