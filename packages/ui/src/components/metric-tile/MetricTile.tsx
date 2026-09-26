import { useId, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { DeltaIndicator } from '../delta-indicator/DeltaIndicator'

export type MetricTileTone = 'neutral' | 'success' | 'warning' | 'danger'

export interface MetricTrend {
  /** Change in percentage points unless `format` says otherwise. */
  value: number
  /** Comparison label, for example "vs last month". */
  label?: string
  format?: (n: number) => string
}

export interface MetricTileProps {
  title: string
  value: ReactNode
  subtitle?: string
  icon?: ReactNode
  trend?: MetricTrend
  tone?: MetricTileTone
  /** `raised` is a level-2 card; `plain` sits flat inside a sheet (§2.5). */
  surface?: 'raised' | 'plain'
  className?: string
}

/** Read-only metric for report KPI rows (spec: wave-2/metric-tile.md). */
export function MetricTile(props: MetricTileProps) {
  const titleId = useId()
  const { trend } = props
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className={cx('ty-metric-tile', props.className)}
      data-tone={props.tone ?? 'neutral'}
      data-surface={props.surface ?? 'raised'}
    >
      <div className="ty-metric-tile__head">
        <span id={titleId} className="ty-metric-tile__title">
          {props.title}
        </span>
        {props.icon ? (
          <span className="ty-metric-tile__badge" aria-hidden="true">
            {props.icon}
          </span>
        ) : null}
      </div>
      <div className="ty-metric-tile__value">{props.value}</div>
      {props.subtitle ? <p className="ty-metric-tile__subtitle">{props.subtitle}</p> : null}
      {trend ? (
        <p className="ty-metric-tile__trend">
          <DeltaIndicator value={trend.value} unit="percent" format={trend.format ? (n) => trend.format!(n) : undefined} />
          {trend.label ? <span className="ty-metric-tile__trend-label">{trend.label}</span> : null}
        </p>
      ) : null}
    </div>
  )
}
