import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { Button as AriaButton, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { breakpoints, useMinWidth } from '../../internal/media'
import { useMessages } from '../../internal/provider'

export interface PaginationLabels {
  navigation: string
  previous: string
  next: string
  pageSize: string
  range: (from: number, to: number, total: number) => string
  page: (n: number) => string
  pageOf: (n: number, count: number) => string
}

export interface PaginationProps {
  /** Current page, 1-based. */
  page: number
  pageCount: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  /** When present, shows the page size selector. */
  pageSizeOptions?: number[]
  /** The host resets to page 1. */
  onPageSizeChange?: (size: number) => void
  siblingCount?: number
  busy?: boolean
  labels?: Partial<PaginationLabels>
  hideWhenSinglePage?: boolean
  className?: string
}

export type PageSlot = number | 'gap'

/** Page numbers to show: first, last, current and its siblings, with gaps. */
export function pageSlots(page: number, pageCount: number, siblingCount = 1): PageSlot[] {
  const pages = new Set<number>([1, pageCount])
  for (let p = page - siblingCount; p <= page + siblingCount; p++) if (p >= 1 && p <= pageCount) pages.add(p)
  if (page <= 1 + siblingCount) pages.add(Math.min(pageCount, 2))
  const sorted = [...pages].filter((p) => p >= 1).sort((a, b) => a - b)
  const out: PageSlot[] = []
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1]
    if (prev !== undefined && p - prev === 2) out.push(prev + 1)
    else if (prev !== undefined && p - prev > 2) out.push('gap')
    out.push(p)
  })
  return out
}

/** Moves through a paged collection (spec: wave-1/pagination.md). */
export function Pagination(props: PaginationProps) {
  const {
    page,
    pageCount,
    totalItems,
    pageSize,
    onPageChange,
    pageSizeOptions,
    onPageSizeChange,
    siblingCount = 1,
    busy = false,
    hideWhenSinglePage = true,
    className,
  } = props
  const messages = useMessages()
  const labels: PaginationLabels = { ...messages.pagination, ...props.labels }
  const wide = useMinWidth(breakpoints.sm)
  const { locale } = useLocale()
  const numeral = new Intl.NumberFormat(locale)
  const selectId = useId()
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const atStart = page <= 1
  const atEnd = page >= pageCount

  // If the focused arrow became disabled, move focus to the other arrow.
  useEffect(() => {
    const active = document.activeElement
    if (atStart && active === prevRef.current) nextRef.current?.focus()
    else if (atEnd && active === nextRef.current) prevRef.current?.focus()
  }, [atStart, atEnd])

  if (hideWhenSinglePage && pageCount <= 1 && !pageSizeOptions) return null

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(totalItems, page * pageSize)
  const go = (p: number) => {
    if (!busy && p >= 1 && p <= pageCount && p !== page) onPageChange(p)
  }

  return (
    <nav aria-label={labels.navigation} aria-busy={busy || undefined} className={cx('fk-pagination', className)}>
      <p className="fk-pagination__range" role="status">
        {labels.range(from, to, totalItems)}
      </p>
      <div className="fk-pagination__controls">
        <AriaButton ref={prevRef} className="fk-pagination__button" data-arrow="" isDisabled={busy || atStart} onPress={() => go(page - 1)}>
          <ChevronLeft className="fk-icon fk-mirror-rtl" aria-hidden="true" focusable="false" />
          <span className="fk-pagination__arrow-label">{labels.previous}</span>
        </AriaButton>
        {wide ? (
          <ul className="fk-pagination__pages">
            {pageSlots(page, pageCount, siblingCount).map((slot, i) =>
              slot === 'gap' ? (
                <li key={`gap-${i}`} className="fk-pagination__gap" aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={slot}>
                  <AriaButton
                    className="fk-pagination__button"
                    data-page=""
                    aria-label={labels.page(slot)}
                    aria-current={slot === page ? 'page' : undefined}
                    data-current={slot === page || undefined}
                    isDisabled={busy}
                    onPress={() => go(slot)}
                  >
                    {numeral.format(slot)}
                  </AriaButton>
                </li>
              ),
            )}
          </ul>
        ) : (
          <span className="fk-pagination__compact">{labels.pageOf(page, pageCount)}</span>
        )}
        <AriaButton ref={nextRef} className="fk-pagination__button" data-arrow="" isDisabled={busy || atEnd} onPress={() => go(page + 1)}>
          <span className="fk-pagination__arrow-label">{labels.next}</span>
          <ChevronRight className="fk-icon fk-mirror-rtl" aria-hidden="true" focusable="false" />
        </AriaButton>
      </div>
      {pageSizeOptions ? (
        <div className="fk-pagination__size">
          <label htmlFor={selectId} className="fk-pagination__size-label">
            {labels.pageSize}
          </label>
          <select
            id={selectId}
            className="fk-pagination__select"
            value={pageSize}
            disabled={busy}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </nav>
  )
}
