import { createElement, type ReactNode } from 'react'
import { cx } from '../../internal/cx'

export interface SummaryPair {
  label: string
  value: ReactNode
}

export interface SummaryRowProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Decorative icon; no tile is drawn without it. */
  icon?: ReactNode
  metadata?: SummaryPair[]
  /** Renders the title as a heading when the row opens a section. */
  titleLevel?: 'none' | 3 | 4
  iconTone?: 'accent' | 'neutral'
  className?: string
}

/** Plain text of a node, used as the tooltip of truncated lines. */
function plainText(node: ReactNode): string | undefined {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  return undefined
}

function TitleLine({ level, children }: { level: SummaryRowProps['titleLevel']; children: ReactNode }) {
  const tag = level === 3 || level === 4 ? `h${level}` : 'p'
  return createElement(tag, { className: 'ty-summary-row__title', title: plainText(children) }, children)
}

function PairList({ pairs }: { pairs: SummaryPair[] }) {
  if (pairs.length === 0) return null
  return (
    <dl className="ty-summary-row__pairs">
      {pairs.map((pair, index) => (
        <div className="ty-summary-row__pair" key={`${pair.label}:${index}`}>
          <dt>{pair.label}</dt>
          <dd>{pair.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Presentational core of rows and cards: icon tile, title, subtitle and a
 * wrapping line of label/value pairs (spec: wave-2/summary-row.md).
 */
export function SummaryRow(props: SummaryRowProps) {
  const pairs = props.metadata ?? []
  const tile = props.icon ? (
    <span className="ty-summary-row__tile" data-tone={props.iconTone ?? 'neutral'} aria-hidden="true">
      {props.icon}
    </span>
  ) : null
  return (
    <div className={cx('ty-summary-row', props.className)}>
      {tile}
      <div className="ty-summary-row__text">
        <TitleLine level={props.titleLevel}>{props.title}</TitleLine>
        {props.subtitle ? (
          <p className="ty-summary-row__subtitle" title={plainText(props.subtitle)}>
            {props.subtitle}
          </p>
        ) : null}
        <PairList pairs={pairs} />
      </div>
    </div>
  )
}
