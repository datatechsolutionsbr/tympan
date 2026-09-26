import { useId, type ReactNode } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'
import { DeltaMark, type DeltaSentiment } from '../delta-indicator/DeltaIndicator'
import { Link } from '../link/Link'
import { Skeleton } from '../skeleton/Skeleton'

export interface TickerChange {
  value: string
  direction: 'up' | 'down' | 'flat'
  /** Independent of direction: a rise can be bad. */
  sentiment?: DeltaSentiment
}

export interface TickerEntry {
  id: string
  name: string
  qualifier?: string
  value: string
  change?: TickerChange
}

export interface TickerCardProps {
  title: string
  icon?: IconComponent
  entries: TickerEntry[]
  asOf?: string
  seeAll?: { label: string; href: string }
  maxEntries?: number
  onEntryPress?: (id: string) => void
  loading?: boolean
  /** Rows drawn while loading. */
  loadingRows?: number
  headingLevel?: 2 | 3 | 4
  labels?: { value?: string; change?: string; empty?: string; loading?: string }
  className?: string
}

interface RowWords {
  value: string
  change: string
}

function RowCells({ entry, words }: { entry: TickerEntry; words: RowWords }) {
  return (
    <>
      <span className="fk-ticker-card__who">
        <span className="fk-ticker-card__name" title={entry.name}>
          {entry.name}
        </span>
        {entry.qualifier ? (
          <span className="fk-ticker-card__qualifier">
            <span className="fk-visually-hidden">, </span>
            {entry.qualifier}
          </span>
        ) : null}
      </span>
      <span className="fk-ticker-card__figures">
        <span className="fk-ticker-card__value">
          <span className="fk-visually-hidden">{`, ${words.value} `}</span>
          {entry.value}
        </span>
        {entry.change ? (
          <span className="fk-ticker-card__change">
            <span className="fk-visually-hidden">{`, ${words.change} `}</span>
            <DeltaMark trend={entry.change.direction} sentiment={entry.change.sentiment ?? 'neutral'} text={entry.change.value} />
          </span>
        ) : null}
      </span>
    </>
  )
}

function Heading({ level, id, children }: { level: 2 | 3 | 4; id: string; children: ReactNode }) {
  const H = `h${level}` as 'h2' | 'h3' | 'h4'
  return (
    <H id={id} className="fk-ticker-card__title">
      {children}
    </H>
  )
}

/** A short comparison of one quantity across named entries (spec: wave-4/ticker-card.md). */
export function TickerCard(props: TickerCardProps) {
  const m = useMessages().ticker
  const titleId = useId()
  const words: RowWords = { value: props.labels?.value ?? m.value, change: props.labels?.change ?? m.change }
  const shown = typeof props.maxEntries === 'number' ? props.entries.slice(0, props.maxEntries) : props.entries
  const Icon = props.icon

  let body: ReactNode
  if (props.loading) {
    body = (
      <div className="fk-ticker-card__loading" aria-busy="true">
        <span role="status" className="fk-visually-hidden">
          {props.labels?.loading ?? m.loading}
        </span>
        {Array.from({ length: props.loadingRows ?? 3 }, (_, i) => (
          <div key={i} className="fk-ticker-card__ghost">
            <Skeleton width="medium" />
            <Skeleton width="short" />
          </div>
        ))}
      </div>
    )
  } else if (shown.length === 0) {
    body = <p className="fk-ticker-card__empty">{props.labels?.empty ?? m.empty}</p>
  } else {
    body = (
      <ul className="fk-ticker-card__rows" aria-labelledby={titleId}>
        {shown.map((entry) => (
          <li key={entry.id} className="fk-ticker-card__row-item" data-sentiment={entry.change?.sentiment}>
            {props.onEntryPress ? (
              <AriaButton className="fk-ticker-card__row" onPress={() => props.onEntryPress?.(entry.id)}>
                <RowCells entry={entry} words={words} />
              </AriaButton>
            ) : (
              <div className="fk-ticker-card__row">
                <RowCells entry={entry} words={words} />
              </div>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className={cx('fk-ticker-card', props.className)} aria-labelledby={titleId} data-interactive={props.onEntryPress ? '' : undefined}>
      <div className="fk-ticker-card__head">
        {Icon ? <Icon className="fk-ticker-card__icon" aria-hidden="true" focusable="false" /> : null}
        <Heading level={props.headingLevel ?? 3} id={titleId}>
          {props.title}
        </Heading>
      </div>
      {body}
      {props.asOf || props.seeAll ? (
        <div className="fk-ticker-card__foot">
          {props.asOf ? <span className="fk-ticker-card__asof">{props.asOf}</span> : null}
          {props.seeAll ? (
            <Link href={props.seeAll.href} standalone>
              {props.seeAll.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
