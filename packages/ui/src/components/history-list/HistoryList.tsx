import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button, Disclosure, DisclosureGroup, DisclosurePanel, type Key } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { Skeleton } from '../skeleton/Skeleton'

export interface HistoryEntry {
  id: string
  /** Leading part of the header: ActorChip, then the date (§2.11). */
  start: ReactNode
  end?: ReactNode
  summary?: ReactNode
  details?: ReactNode
}

export interface HistoryListProps {
  items: HistoryEntry[]
  loading?: boolean
  loadingLabel: string
  emptyLabel: string
  expansion?: 'single' | 'multiple'
  expandedIds?: string[]
  defaultExpandedIds?: string[]
  onExpandedChange?: (ids: string[]) => void
  /** Number of skeleton rows while loading. */
  skeletonRows?: number
  className?: string
}

function HeaderText({ entry }: { entry: HistoryEntry }) {
  return (
    <span className="fk-history-list__header-text">
      <span className="fk-history-list__line">
        <span className="fk-history-list__start">{entry.start}</span>
        {entry.end ? <span className="fk-history-list__end">{entry.end}</span> : null}
      </span>
      {entry.summary ? <span className="fk-history-list__summary">{entry.summary}</span> : null}
    </span>
  )
}

/** An entry with details: a disclosure whose header is the trigger. */
function OpenableEntry({ entry }: { entry: HistoryEntry }) {
  return (
    <Disclosure id={entry.id} className="fk-history-list__entry" data-openable="">
      <Button slot="trigger" className="fk-history-list__header">
        <ChevronRight className="fk-icon fk-mirror-rtl fk-history-list__chevron" aria-hidden="true" focusable="false" />
        <HeaderText entry={entry} />
      </Button>
      <DisclosurePanel className="fk-history-list__details">{entry.details}</DisclosurePanel>
    </Disclosure>
  )
}

/** An entry without details: a static header, no button, no chevron. */
function StaticEntry({ entry }: { entry: HistoryEntry }) {
  return (
    <div className="fk-history-list__entry">
      <div className="fk-history-list__header" data-static="">
        <HeaderText entry={entry} />
      </div>
    </div>
  )
}

const toIds = (keys: Set<Key>) => [...keys].map(String)

/** Past entries whose headers expand to details (spec: wave-2/history-list.md). */
export function HistoryList(props: HistoryListProps) {
  const { items, loading = false, expansion = 'single', skeletonRows = 3 } = props

  if (loading) {
    return (
      <div className={cx('fk-history-list', props.className)} aria-busy="true" data-state="loading">
        <span role="status" className="fk-visually-hidden">
          {props.loadingLabel}
        </span>
        {Array.from({ length: skeletonRows }, (_, i) => (
          <div className="fk-history-list__ghost" key={i} aria-hidden="true">
            <Skeleton width="medium" />
            <Skeleton width="short" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className={cx('fk-history-list', 'fk-history-list__empty', props.className)} data-state="empty">
        {props.emptyLabel}
      </p>
    )
  }

  const selection =
    props.expandedIds !== undefined ? { expandedKeys: props.expandedIds } : { defaultExpandedKeys: props.defaultExpandedIds ?? [] }

  return (
    <DisclosureGroup
      className={cx('fk-history-list', props.className)}
      allowsMultipleExpanded={expansion === 'multiple'}
      onExpandedChange={(keys) => props.onExpandedChange?.(toIds(keys))}
      {...selection}
    >
      <ol className="fk-history-list__items">
        {items.map((entry) => (
          <li key={entry.id} className="fk-history-list__item">
            {entry.details == null ? <StaticEntry entry={entry} /> : <OpenableEntry entry={entry} />}
          </li>
        ))}
      </ol>
    </DisclosureGroup>
  )
}
