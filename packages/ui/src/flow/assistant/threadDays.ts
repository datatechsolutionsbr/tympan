// Day buckets for the conversation history: today, yesterday, the seven days
// before, older. Days are calendar days in a time zone (the device's unless
// one is given), so "yesterday" changes at local midnight.

export type DayBucket = 'today' | 'yesterday' | 'lastWeek' | 'older'

const MS_PER_DAY = 86_400_000

/** Whole days since the epoch of the calendar date `instant` falls on in `zone`. */
export function dayNumber(instant: Date, zone?: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant)
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? NaN)
  return Math.floor(Date.UTC(pick('year'), pick('month') - 1, pick('day')) / MS_PER_DAY)
}

/** Upper age limit (in days) of each bucket, in display order. */
const LIMITS: ReadonlyArray<readonly [DayBucket, number]> = [
  ['today', 0],
  ['yesterday', 1],
  ['lastWeek', 7],
  ['older', Number.POSITIVE_INFINITY],
]

function bucketFor(age: number): DayBucket {
  for (const [bucket, limit] of LIMITS) if (age <= limit) return bucket
  return 'older'
}

/**
 * Groups threads by day bucket. An unreadable date counts as older; empty
 * buckets are left out; the given order is kept inside a bucket.
 */
export function groupThreadsByDay<T extends { updatedAt: string | number | Date }>(threads: readonly T[], now: Date = new Date(), zone?: string): Array<{ bucket: DayBucket; threads: T[] }> {
  const today = dayNumber(now, zone)
  const found = new Map<DayBucket, T[]>()
  for (const t of threads) {
    const when = new Date(t.updatedAt)
    const bucket = Number.isNaN(when.getTime()) ? 'older' : bucketFor(today - dayNumber(when, zone))
    const list = found.get(bucket) ?? []
    list.push(t)
    found.set(bucket, list)
  }
  return LIMITS.flatMap(([bucket]) => (found.has(bucket) ? [{ bucket, threads: found.get(bucket)! }] : []))
}
