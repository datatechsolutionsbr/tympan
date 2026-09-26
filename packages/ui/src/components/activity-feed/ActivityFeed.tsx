import type { ReactNode } from 'react'
import { Link as AriaLink, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { ActorChip, type ActorKind } from '../actor-chip/ActorChip'

export interface ActivityEntry {
  id: string
  actor: { kind: ActorKind; name: string; agentKey?: string; model?: string }
  text: ReactNode
  at: string | Date
  /** Mono meta (id, rule, hash). */
  meta?: string
}

export interface ActivityFeedProps {
  entries: ActivityEntry[]
  label: string
  locale?: string
  /** Reference time for relative dates (tests, snapshots). */
  now?: Date
  moreHref?: string
  moreLabel?: string
  className?: string
}

const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
  ['year', Number.POSITIVE_INFINITY],
]

/** Relative phrase with the largest unit that keeps the number above one. */
export function relativePhrase(at: Date, now: Date, locale: string): string {
  let amount = (at.getTime() - now.getTime()) / 1000
  for (const [unit, size] of STEPS) {
    if (Math.abs(amount) < size) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(amount), unit)
    amount /= size
  }
  return ''
}

function Stamp({ at, now, locale }: { at: Date; now: Date; locale: string }) {
  const absolute = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(at)
  return (
    <time className="ty-activity__time" dateTime={at.toISOString()} title={absolute}>
      {relativePhrase(at, now, locale)}
    </time>
  )
}

/** Recent acts on the research, actor first (spec: wave-4/activity-feed.md; §2.11). */
export function ActivityFeed(props: ActivityFeedProps) {
  const words = useMessages().activityFeed
  const adapterLocale = useLocale().locale
  const locale = props.locale ?? adapterLocale
  const now = props.now ?? new Date()
  if (!props.entries.length) return <p className={cx('ty-activity__empty', props.className)}>{words.empty}</p>
  return (
    <div className={cx('ty-activity', props.className)}>
      <ol className="ty-activity__list" aria-label={props.label}>
        {props.entries.map((entry) => (
          <li key={entry.id} className="ty-activity__entry">
            <ActorChip compact kind={entry.actor.kind} name={entry.actor.name} agentKey={entry.actor.agentKey} model={entry.actor.model} />
            <div className="ty-activity__body">
              <p className="ty-activity__text" dir="auto">{entry.text}</p>
              <p className="ty-activity__meta">
                <Stamp at={typeof entry.at === 'string' ? new Date(entry.at) : entry.at} now={now} locale={locale} />
                {entry.meta ? <code className="ty-activity__code">{entry.meta}</code> : null}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {props.moreHref && props.moreLabel ? (
        <AriaLink className="ty-activity__more" href={props.moreHref}>
          {props.moreLabel}
        </AriaLink>
      ) : null}
    </div>
  )
}
