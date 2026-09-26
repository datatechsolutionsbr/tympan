import type { ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { SummaryRow, type SummaryPair } from '../summary-row/SummaryRow'

export interface ListRowAction {
  label: string
  onPress: () => void
  tone?: 'neutral' | 'danger'
  disabled?: boolean
}

export type ListRowVariant = 'surface' | 'compact' | 'card' | 'emphasised'

export interface ListRowProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  metadata?: SummaryPair[]
  actions?: ListRowAction[]
  variant?: ListRowVariant
  /**
   * Item name appended (visually hidden) to every action name so repeated
   * labels stay distinct ("Edit, Survey A"). Defaults to `title` when it is text.
   */
  itemLabel?: string
  /** Text marker of the emphasised variant; defaults to the localised "Current". */
  emphasisLabel?: string
  className?: string
}

function ActionStrip({ actions, suffix }: { actions: ListRowAction[]; suffix?: string }) {
  if (actions.length === 0) return null
  return (
    <div className="ty-list-row__actions">
      {actions.map((action, i) => (
        <Button
          key={`${action.label}-${i}`}
          variant={action.tone === 'danger' ? 'danger' : 'quiet'}
          size="compact"
          disabled={action.disabled}
          onPress={action.onPress}
          className="ty-list-row__action"
        >
          {action.label}
          {suffix ? <span className="ty-visually-hidden">, {suffix}</span> : null}
        </Button>
      ))}
    </div>
  )
}

/** One item: summary on the leading side, text actions on the trailing side (spec: wave-2/list-row.md). */
export function ListRow({ variant = 'surface', actions = [], itemLabel, emphasisLabel, className, ...summary }: ListRowProps) {
  const copy = useMessages().listRow
  const suffix = itemLabel ?? (typeof summary.title === 'string' ? summary.title : undefined)
  const marked = variant === 'emphasised'
  return (
    <div className={cx('ty-list-row', className)} data-variant={variant}>
      <div className="ty-list-row__summary">
        <SummaryRow {...summary} iconTone={marked ? 'accent' : 'neutral'} />
        {marked ? <span className="ty-list-row__marker">{emphasisLabel ?? copy.current}</span> : null}
      </div>
      <ActionStrip actions={actions} suffix={suffix} />
    </div>
  )
}
