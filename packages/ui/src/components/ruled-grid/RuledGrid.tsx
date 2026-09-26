import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../../internal/cx'

type RowTag = 'div' | 'ul' | 'ol'
type CellTag = 'div' | 'li'

export interface RuledGridProps {
  /** Small crosses where rules meet, and at the outer corners. */
  marks?: boolean
  /** Rules along the outer edges too. */
  outerRules?: boolean
  children: ReactNode
  className?: string
}

export interface RuledGridRowProps {
  /** Column count or a full `grid-template-columns` value; auto-fit by default. */
  columns?: number | string
  /** `ul` / `ol` give the row list semantics (cells then use `li`). */
  as?: RowTag
  children: ReactNode
  className?: string
}

export interface RuledGridCellProps {
  as?: CellTag
  children: ReactNode
  className?: string
}

const MarksOn = createContext(false)
const CORNERS = ['start-start', 'start-end', 'end-start', 'end-end'] as const

/** Hairline-ruled layout grid for public pages (spec: wave-4/ruled-grid.md). */
export function RuledGrid(props: RuledGridProps) {
  const marks = props.marks === true
  return (
    <MarksOn.Provider value={marks}>
      <div className={cx('fk-ruled-grid', props.className)} data-marks={marks || undefined} data-outer={props.outerRules === false ? undefined : true}>
        {props.children}
      </div>
    </MarksOn.Provider>
  )
}

function template(columns: RuledGridRowProps['columns']): string | undefined {
  if (columns === undefined) return undefined
  return typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns
}

/** One row of cells separated by vertical rules. */
export function RuledGridRow(props: RuledGridRowProps) {
  const Tag = props.as ?? 'div'
  const cols = template(props.columns)
  const style = cols ? ({ '--fk-ruled-columns': cols } as CSSProperties) : undefined
  return (
    <Tag className={cx('fk-ruled-grid__row', props.className)} style={style}>
      {props.children}
    </Tag>
  )
}

/** One cell; draws its four corner marks when the grid asks for them (decorative). */
export function RuledGridCell(props: RuledGridCellProps) {
  const Tag = props.as ?? 'div'
  const marks = useContext(MarksOn)
  return (
    <Tag className={cx('fk-ruled-grid__cell', props.className)}>
      {marks && CORNERS.map((c) => <span key={c} className="fk-ruled-grid__mark" data-corner={c} aria-hidden="true" />)}
      {props.children}
    </Tag>
  )
}
