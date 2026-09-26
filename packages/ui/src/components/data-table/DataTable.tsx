import { ArrowDown, ArrowUp, ArrowUpDown, Check, Minus } from 'lucide-react'
import { useId, useRef, type CSSProperties, type ReactNode } from 'react'
import {
  Cell,
  Checkbox as AriaCheckbox,
  Column,
  Row,
  Table as AriaTable,
  TableBody,
  TableHeader,
  type Key,
  type Selection,
  type SortDescriptor,
} from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useDomAttributes } from '../../internal/dom'
import { useMessages } from '../../internal/provider'
import { EmptyState } from '../empty-state/EmptyState'
import { Skeleton } from '../skeleton/Skeleton'

export type DataTableDensity = 'comfortable' | 'standard' | 'compact'
export type SortDirection = 'ascending' | 'descending' | null

export interface DataTableColumn {
  id: string
  header: ReactNode
  sortable?: boolean
  align?: 'start' | 'end'
  /** End alignment and tabular figures. */
  numeric?: boolean
}

export interface DataTableRow {
  id: string
  cells: Record<string, ReactNode>
  href?: string
  /** Names the row link. */
  label?: string
}

export interface DataTableProps {
  /** Accessible name of the table. */
  caption: string
  /** Show the caption visually (it is always available to assistive technology). */
  captionVisible?: boolean
  columns: DataTableColumn[]
  rows: DataTableRow[]
  density?: DataTableDensity
  sortColumn?: string
  sortDirection?: SortDirection
  /** Sort cycle per column: none, ascending, descending, none. */
  onSortChange?: (column: string, direction: SortDirection) => void
  selectionMode?: 'none' | 'multiple'
  selectedKeys?: Set<string>
  onSelectionChange?: (keys: Set<string>) => void
  loading?: boolean
  loadingRowCount?: number
  /** Polite status while loading (defaults to the messages catalogue). */
  loadingLabel?: string
  emptyState?: ReactNode
  stickyFirstColumn?: boolean
  showColumnLines?: boolean
  onRowAction?: (id: string) => void
  /** Maximum height of the scroll container, enabling the sticky header. */
  maxBlockSize?: string
  className?: string
}

function textOf(node: ReactNode): string | undefined {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  return undefined
}

function nextDirection(current: SortDirection, sameColumn: boolean): SortDirection {
  if (!sameColumn || current === null) return 'ascending'
  return current === 'ascending' ? 'descending' : null
}

function SortIcon({ direction }: { direction: SortDirection }) {
  const Icon = direction === 'ascending' ? ArrowUp : direction === 'descending' ? ArrowDown : ArrowUpDown
  return <Icon className="fk-table__sort-icon" aria-hidden="true" focusable="false" />
}

function CellContent({ value }: { value: ReactNode }) {
  const text = textOf(value)
  return (
    <span className="fk-table__clamp" title={text}>
      {value}
    </span>
  )
}

function SelectionBox({ isSelected, isIndeterminate }: { isSelected: boolean; isIndeterminate: boolean }) {
  return (
    <span className="fk-table__checkbox-box" aria-hidden="true">
      {isIndeterminate ? <Minus /> : isSelected ? <Check /> : null}
    </span>
  )
}

/** Records as rows and attributes as columns (spec: wave-1/data-table.md). */
export function DataTable(props: DataTableProps) {
  const {
    caption,
    captionVisible = false,
    columns,
    rows,
    density = 'standard',
    sortColumn,
    sortDirection = null,
    onSortChange,
    selectionMode = 'none',
    loading = false,
    loadingRowCount = 10,
    loadingLabel,
    emptyState,
    stickyFirstColumn = true,
    showColumnLines = false,
    onRowAction,
    maxBlockSize,
    className,
  } = props
  const messages = useMessages()
  const captionId = useId()
  const interactive = selectionMode !== 'none' || !!onRowAction || rows.some((r) => r.href)

  const wrapperProps = {
    className: cx('fk-table-wrap', className),
    'data-density': density,
    'data-sticky-first': stickyFirstColumn || undefined,
    'data-column-lines': showColumnLines || undefined,
    'data-selectable': selectionMode !== 'none' || undefined,
  }
  const scrollStyle: CSSProperties | undefined = maxBlockSize ? { maxBlockSize } : undefined
  const captionNode = (
    <div id={captionId} className={captionVisible ? 'fk-table__caption' : 'fk-visually-hidden'}>
      {caption}
    </div>
  )
  const status = loading ? (
    <span role="status" className="fk-visually-hidden">
      {loadingLabel ?? messages.table.loading}
    </span>
  ) : null
  const empty = emptyState ?? <EmptyState framing="inline" headingLevel={4} title={messages.table.empty} />
  const colSpan = columns.length + (selectionMode !== 'none' ? 1 : 0)

  const requestSort = (column: string) => {
    onSortChange?.(column, nextDirection(sortColumn === column ? sortDirection : null, sortColumn === column))
  }

  if (!interactive) {
    return (
      <div {...wrapperProps}>
        {captionVisible ? captionNode : null}
        {status}
        <div className="fk-table-scroll" style={scrollStyle}>
          <table className="fk-table" aria-labelledby={captionVisible ? captionId : undefined} aria-busy={loading || undefined}>
            {captionVisible ? null : <caption className="fk-visually-hidden">{caption}</caption>}
            <thead className="fk-table__head">
              <tr className="fk-table__row fk-table__row--head">
                {columns.map((col) => {
                  const dir = sortColumn === col.id ? sortDirection : null
                  return (
                    <th
                      key={col.id}
                      scope="col"
                      className="fk-table__column"
                      data-align={col.numeric || col.align === 'end' ? 'end' : 'start'}
                      aria-sort={col.sortable ? (dir ?? 'none') : undefined}
                    >
                      {col.sortable ? (
                        <button type="button" className="fk-table__sort" onClick={() => requestSort(col.id)}>
                          <span>{col.header}</span>
                          <SortIcon direction={dir} />
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="fk-table__body">
              {loading
                ? Array.from({ length: loadingRowCount }, (_, i) => (
                    <tr key={`loading-${i}`} className="fk-table__row" data-loading="true" aria-hidden="true">
                      {columns.map((col) => (
                        <td key={col.id} className="fk-table__cell">
                          <Skeleton width={col.numeric ? 'short' : 'long'} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                  ? (
                      <tr className="fk-table__row fk-table__row--empty">
                        <td className="fk-table__cell fk-table__cell--empty" colSpan={colSpan}>
                          {empty}
                        </td>
                      </tr>
                    )
                  : rows.map((row) => (
                      <tr key={row.id} className="fk-table__row">
                        {columns.map((col, i) => {
                          const align = col.numeric || col.align === 'end' ? 'end' : 'start'
                          const content = <CellContent value={row.cells[col.id]} />
                          return i === 0 ? (
                            <th key={col.id} scope="row" className="fk-table__cell fk-table__cell--row-header" data-align={align}>
                              {content}
                            </th>
                          ) : (
                            <td key={col.id} className="fk-table__cell" data-align={align} data-numeric={col.numeric || undefined}>
                              {content}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <InteractiveTable
      {...props}
      wrapperProps={wrapperProps}
      captionNode={captionVisible ? captionNode : null}
      captionId={captionVisible ? captionId : undefined}
      status={status}
      empty={empty}
      scrollStyle={scrollStyle}
      requestSort={requestSort}
      loadingRowCount={loadingRowCount}
      density={density}
    />
  )
}

interface InteractiveProps extends DataTableProps {
  wrapperProps: Record<string, unknown>
  captionNode: ReactNode
  captionId?: string
  status: ReactNode
  empty: ReactNode
  scrollStyle?: CSSProperties
  requestSort: (column: string) => void
  loadingRowCount: number
}

const NO_SORT: SortDescriptor = { column: '__fk-none__', direction: 'ascending' }

function InteractiveTable({
  caption,
  columns,
  rows,
  sortColumn,
  sortDirection = null,
  selectionMode = 'none',
  selectedKeys,
  onSelectionChange,
  loading = false,
  loadingRowCount,
  onRowAction,
  wrapperProps,
  captionNode,
  captionId,
  status,
  empty,
  scrollStyle,
  requestSort,
}: InteractiveProps) {
  const tableRef = useRef<HTMLTableElement>(null)
  useDomAttributes(tableRef, { 'aria-busy': loading ? 'true' : undefined })
  const selectable = selectionMode !== 'none'
  const sortDescriptor: SortDescriptor =
    sortColumn && sortDirection ? { column: sortColumn, direction: sortDirection } : NO_SORT

  const loadingKeys = Array.from({ length: loading ? loadingRowCount : 0 }, (_, i) => `__fk-loading-${i}`)
  const onSelection = (keys: Selection) => {
    if (!onSelectionChange) return
    if (keys === 'all') onSelectionChange(new Set(rows.map((r) => r.id)))
    else onSelectionChange(new Set(Array.from(keys, (k: Key) => String(k))))
  }

  return (
    <div {...wrapperProps}>
      {captionNode}
      {status}
      <div className="fk-table-scroll" style={scrollStyle}>
        <AriaTable
          ref={tableRef}
          className="fk-table"
          aria-label={captionId ? undefined : caption}
          aria-labelledby={captionId}
          sortDescriptor={sortDescriptor}
          onSortChange={(d) => requestSort(String(d.column))}
          selectionMode={selectable ? 'multiple' : 'none'}
          selectionBehavior="toggle"
          selectedKeys={selectedKeys ?? new Set()}
          onSelectionChange={onSelection}
          disabledKeys={loadingKeys}
          onRowAction={onRowAction ? (key) => onRowAction(String(key)) : undefined}
        >
          <TableHeader className="fk-table__head">
            {selectable ? (
              <Column className="fk-table__column fk-table__column--select">
                <AriaCheckbox slot="selection" className="fk-table__checkbox" isDisabled={loading || rows.length === 0}>
                  {({ isSelected, isIndeterminate }) => <SelectionBox isSelected={isSelected} isIndeterminate={isIndeterminate} />}
                </AriaCheckbox>
              </Column>
            ) : null}
            {columns.map((col, i) => {
              const dir = sortColumn === col.id ? sortDirection : null
              return (
                <Column
                  key={col.id}
                  id={col.id}
                  isRowHeader={i === 0}
                  allowsSorting={!!col.sortable}
                  className="fk-table__column"
                  data-align={col.numeric || col.align === 'end' ? 'end' : 'start'}
                  textValue={textOf(col.header)}
                >
                  {col.sortable ? (
                    <span className="fk-table__sort">
                      <span>{col.header}</span>
                      <SortIcon direction={dir} />
                    </span>
                  ) : (
                    col.header
                  )}
                </Column>
              )
            })}
          </TableHeader>
          <TableBody
            className="fk-table__body"
            renderEmptyState={() => <div className="fk-table__empty">{empty}</div>}
          >
            {loading
              ? loadingKeys.map((key) => (
                  <Row key={key} id={key} className="fk-table__row" data-loading="true" textValue="">
                    {selectable ? (
                      <Cell className="fk-table__cell fk-table__cell--select">
                        <span aria-hidden="true" className="fk-table__checkbox-box" />
                      </Cell>
                    ) : null}
                    {columns.map((col) => (
                      <Cell key={col.id} className="fk-table__cell">
                        <Skeleton width={col.numeric ? 'short' : 'long'} />
                      </Cell>
                    ))}
                  </Row>
                ))
              : rows.map((row) => (
                  <Row
                    key={row.id}
                    id={row.id}
                    href={row.href}
                    textValue={row.label ?? textOf(row.cells[columns[0]?.id ?? '']) ?? row.id}
                    className="fk-table__row"
                    data-actionable={row.href || onRowAction ? true : undefined}
                  >
                    {selectable ? (
                      <Cell className="fk-table__cell fk-table__cell--select">
                        <AriaCheckbox slot="selection" className="fk-table__checkbox">
                          {({ isSelected, isIndeterminate }) => (
                            <SelectionBox isSelected={isSelected} isIndeterminate={isIndeterminate} />
                          )}
                        </AriaCheckbox>
                      </Cell>
                    ) : null}
                    {columns.map((col) => (
                      <Cell
                        key={col.id}
                        className="fk-table__cell"
                        data-align={col.numeric || col.align === 'end' ? 'end' : 'start'}
                        data-numeric={col.numeric || undefined}
                        textValue={textOf(row.cells[col.id])}
                      >
                        <CellContent value={row.cells[col.id]} />
                      </Cell>
                    ))}
                  </Row>
                ))}
          </TableBody>
        </AriaTable>
      </div>
    </div>
  )
}
