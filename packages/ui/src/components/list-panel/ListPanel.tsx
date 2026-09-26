import { ChevronRight } from 'lucide-react'
import { Children, isValidElement, useRef, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import { GridList, GridListItem } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'

export interface ListPanelRowProps {
  id?: string
  leading?: ReactNode
  trailing?: ReactNode
  /** Makes the row activatable. */
  onAction?: () => void
  /** Makes the row a link through the router adapter. */
  href?: string
  disabled?: boolean
  /** Plain text of the row for type-ahead (defaults to the text children). */
  textValue?: string
  children: ReactNode
}

/**
 * One row of a ListPanel. It renders nothing by itself: the panel reads the
 * rows and draws them in the list, grid or feed form.
 */
export function ListPanelRow(_props: ListPanelRowProps): null {
  return null
}

export interface ListPanelProps {
  children: ReactNode
  elevation?: 'sheet' | 'raised'
  /** Accessible name of the list (required for activatable rows and feeds). */
  label?: string
  /** `feed`: APG Feed for long, streaming lists. */
  as?: 'list' | 'feed'
  className?: string
}

interface RowSpec extends ListPanelRowProps {
  key: string
}

/** Reads the declarative rows into plain data. */
function collectRows(children: ReactNode): RowSpec[] {
  const rows: RowSpec[] = []
  Children.forEach(children, (child, index) => {
    if (!isValidElement(child) || child.type !== ListPanelRow) return
    const props = (child as ReactElement<ListPanelRowProps>).props
    rows.push({ ...props, key: props.id ?? String(child.key ?? index) })
  })
  return rows
}

function RowBody({ row, chevron }: { row: RowSpec; chevron?: boolean }) {
  return (
    <>
      {row.leading ? <span className="fk-list-panel__leading">{row.leading}</span> : null}
      <span className="fk-list-panel__main">{row.children}</span>
      {row.trailing ? <span className="fk-list-panel__trailing">{row.trailing}</span> : null}
      {chevron ? <ChevronRight className="fk-icon fk-mirror-rtl fk-list-panel__chevron" aria-hidden="true" focusable="false" /> : null}
    </>
  )
}

const textOf = (row: RowSpec) => row.textValue ?? (typeof row.children === 'string' ? row.children : undefined)

/** Page Down / Page Up move between feed articles (APG Feed). */
function feedKeys(event: KeyboardEvent<HTMLDivElement>) {
  const step = event.key === 'PageDown' ? 1 : event.key === 'PageUp' ? -1 : 0
  if (!step) return
  const articles = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(':scope > article'))
  const current = articles.findIndex((a) => a.contains(document.activeElement))
  const next = articles[Math.min(articles.length - 1, Math.max(0, current + step))]
  if (!next) return
  event.preventDefault()
  next.focus()
}

function FeedForm({ rows, label }: { rows: RowSpec[]; label?: string }) {
  const feedRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={feedRef} role="feed" aria-label={label} className="fk-list-panel__rows" onKeyDown={feedKeys}>
      {rows.map((row, i) => (
        <article key={row.key} className="fk-list-panel__row" tabIndex={0} aria-posinset={i + 1} aria-setsize={rows.length}>
          <RowBody row={row} />
        </article>
      ))}
    </div>
  )
}

function GridForm({ rows, label }: { rows: RowSpec[]; label?: string }) {
  return (
    <GridList aria-label={label} className="fk-list-panel__rows" data-form="grid">
      {rows.map((row) => (
        <GridListItem
          key={row.key}
          id={row.key}
          textValue={textOf(row)}
          onAction={row.onAction}
          href={row.href}
          isDisabled={row.disabled}
          className="fk-list-panel__row"
          data-actionable={row.onAction || row.href ? '' : undefined}
        >
          <RowBody row={row} chevron={!!(row.onAction || row.href) && !row.trailing} />
        </GridListItem>
      ))}
    </GridList>
  )
}

function StaticForm({ rows, label }: { rows: RowSpec[]; label?: string }) {
  return (
    <ul className="fk-list-panel__rows" aria-label={label}>
      {rows.map((row) => (
        <li key={row.key} className="fk-list-panel__row">
          <RowBody row={row} />
        </li>
      ))}
    </ul>
  )
}

/** A surface of divided rows for short lists (spec: wave-2/list-panel.md). */
export function ListPanel({ children, elevation = 'sheet', label, as = 'list', className }: ListPanelProps) {
  const rows = collectRows(children)
  const actionable = rows.some((r) => r.onAction || r.href)
  const form = as === 'feed' ? 'feed' : actionable ? 'grid' : 'static'
  devWarning(form !== 'static' && !label, 'ListPanel: activatable rows and feeds need `label`.')
  const Form = form === 'feed' ? FeedForm : form === 'grid' ? GridForm : StaticForm
  return (
    <div className={cx('fk-list-panel', className)} data-elevation={elevation} data-form={form}>
      <Form rows={rows} label={label} />
    </div>
  )
}
