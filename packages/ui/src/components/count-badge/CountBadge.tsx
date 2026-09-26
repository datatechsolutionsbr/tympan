import { useEffect, useId, useRef, useState } from 'react'
import { cx } from '../../internal/cx'
import { announcePolitely } from '../../internal/data-a/announce'
import type { PluralNoun } from '../../internal/messages/data-a'
import { useMessages } from '../../internal/provider'

export interface CountBadgeProps {
  count: number
  /** Noun of the counted items, singular and plural. */
  itemNoun?: PluralNoun
  /** Above this the counter reads "max+"; the accessible text keeps the exact number. */
  max?: number
  tone?: 'attention' | 'neutral'
  /** Announce increases in the shared polite region. */
  announce?: boolean
  /**
   * Id of the accessible description. Point the host button's
   * `aria-describedby` at it, or place the badge inside the host button.
   */
  id?: string
  className?: string
}

/** The accessible sentence of a count ("3 notifications"). */
export function describeCount(count: number, noun: PluralNoun, phrase: (n: number, word: string) => string): string {
  return phrase(count, count === 1 ? noun.one : noun.other)
}

/** Remembers the last count and reports whether the latest render raised it. */
function useRise(count: number): boolean {
  const last = useRef(count)
  const [rose, setRose] = useState(false)
  useEffect(() => {
    setRose(count > last.current)
    last.current = count
  }, [count])
  return rose
}

/** Counter pinned to the corner of an icon button (spec: wave-2/count-badge.md). */
export function CountBadge({ count, itemNoun, max = 99, tone = 'attention', announce = false, id, className }: CountBadgeProps) {
  const copy = useMessages().countBadge
  const autoId = useId()
  const sentence = describeCount(count, itemNoun ?? copy.item, copy.describe)
  const rose = useRise(count)

  useEffect(() => {
    if (announce && rose) announcePolitely(sentence)
  }, [announce, rose, sentence])

  if (count <= 0) return null
  const shown = count > max ? `${max}+` : String(count)
  return (
    <span className={cx('fk-count-badge', className)} data-tone={tone} data-changed={rose || undefined}>
      <span className="fk-count-badge__value" aria-hidden="true">
        {shown}
      </span>
      <span className="fk-visually-hidden" id={id ?? autoId}>
        {sentence}
      </span>
    </span>
  )
}
