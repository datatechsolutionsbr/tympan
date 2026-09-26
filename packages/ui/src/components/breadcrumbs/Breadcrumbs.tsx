import { ArrowLeft, ChevronRight, Ellipsis } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { breakpoints, useMinWidth } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import { ActionMenu } from '../action-menu/ActionMenu'
import { Button } from '../button/Button'
import { Link } from '../link/Link'

export interface BreadcrumbItem {
  label: string
  href: string
}

export interface BreadcrumbsProps {
  /** Ancestors then the current page (the last item is current). */
  items: BreadcrumbItem[]
  /** Accessible name of the navigation landmark. */
  label?: string
  /** `auto` shows the trail at 640 px and above, compact below. */
  mode?: 'trail' | 'compact' | 'auto'
  /** Parent used in compact mode when there is only one item. */
  rootHref?: string
  rootLabel?: string
  /** Collapses middle items into an overflow menu when exceeded. */
  maxVisible?: number
  /** Trailing slot of the compact bar. */
  actions?: ReactNode
  /** Replaces the centred title of the compact bar. */
  centerContent?: ReactNode
  className?: string
}

type Entry = { kind: 'item'; item: BreadcrumbItem; index: number } | { kind: 'overflow'; items: BreadcrumbItem[] }

function visibleEntries(items: BreadcrumbItem[], maxVisible?: number): Entry[] {
  const all: Entry[] = items.map((item, index) => ({ kind: 'item', item, index }))
  if (!maxVisible || items.length <= maxVisible || maxVisible < 2) return all
  const tail = maxVisible - 1
  return [all[0]!, { kind: 'overflow', items: items.slice(1, items.length - tail) }, ...all.slice(items.length - tail)]
}

/** Where the page sits in the hierarchy (spec: wave-1/breadcrumbs.md). */
export function Breadcrumbs(props: BreadcrumbsProps) {
  const { items, label, mode = 'auto', rootHref, rootLabel, maxVisible, actions, centerContent, className } = props
  const messages = useMessages()
  const wide = useMinWidth(breakpoints.sm)
  const navLabel = label ?? messages.breadcrumbs.label
  const compact = mode === 'compact' || (mode === 'auto' && !wide)
  const current = items[items.length - 1]

  if (compact) {
    const parent = items.length > 1 ? items[items.length - 2] : rootHref ? { href: rootHref, label: rootLabel ?? '' } : undefined
    return (
      <nav aria-label={navLabel} className={cx('fk-breadcrumbs', className)} data-mode="compact">
        <div className="fk-breadcrumbs__bar">
          <div className="fk-breadcrumbs__back">
            {parent ? (
              <Link href={parent.href} emphasis="subtle" standalone aria-label={messages.breadcrumbs.backTo(parent.label)}>
                <ArrowLeft className="fk-icon fk-mirror-rtl" aria-hidden="true" focusable="false" />
                <span className="fk-breadcrumbs__back-label">{parent.label}</span>
              </Link>
            ) : null}
          </div>
          {centerContent !== undefined || actions ? (
            <div className="fk-breadcrumbs__center">
              {centerContent ?? (
                <span className="fk-breadcrumbs__title" aria-current="page">
                  {current?.label}
                </span>
              )}
            </div>
          ) : null}
          {actions ? <div className="fk-breadcrumbs__actions">{actions}</div> : null}
        </div>
      </nav>
    )
  }

  const entries = visibleEntries(items, maxVisible)
  return (
    <nav aria-label={navLabel} className={cx('fk-breadcrumbs', className)} data-mode="trail">
      <ol className="fk-breadcrumbs__list">
        {entries.map((entry, i) => {
          const isLast = i === entries.length - 1
          const separator = isLast ? null : <ChevronRight className="fk-icon fk-mirror-rtl fk-breadcrumbs__separator" aria-hidden="true" focusable="false" />
          if (entry.kind === 'overflow') {
            return (
              <li key="overflow" className="fk-breadcrumbs__item">
                <ActionMenu
                  label={messages.breadcrumbs.overflow}
                  items={entry.items.map((it, n) => ({ id: `${n}:${it.href}`, label: it.label, href: it.href }))}
                  onAction={() => {}}
                  trigger={
                    <Button
                      variant="quiet"
                      size="compact"
                      iconOnly
                      accessibleLabel={messages.breadcrumbs.overflow}
                      leadingIcon={<Ellipsis />}
                    />
                  }
                />
                {separator}
              </li>
            )
          }
          const { item } = entry
          const isCurrent = entry.index === items.length - 1
          return (
            <li key={`${entry.index}:${item.href}`} className="fk-breadcrumbs__item">
              {isCurrent ? (
                <span className="fk-breadcrumbs__current" aria-current="page" title={item.label}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} emphasis="subtle" className="fk-breadcrumbs__link">
                  <span className="fk-breadcrumbs__label" title={item.label}>
                    {item.label}
                  </span>
                </Link>
              )}
              {separator}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
