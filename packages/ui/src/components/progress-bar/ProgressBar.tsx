import { ProgressBar as AriaProgressBar, Label } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

export type ProgressBarTone = 'accent' | 'success' | 'warning' | 'danger'

export interface ProgressBarProps {
  value?: number
  minValue?: number
  maxValue?: number
  /** Visible and accessible name; required unless `aria-label` is given. */
  label?: string
  'aria-label'?: string
  /** Custom value text such as "3 of 8 steps". */
  valueLabel?: string
  showValue?: boolean
  indeterminate?: boolean
  /** Semantic tone; pair it with value text or a status word. */
  tone?: ProgressBarTone
  size?: 'thin' | 'regular'
  className?: string
}

/** Determinate or indeterminate task progress (spec: wave-1/progress-bar.md). */
export function ProgressBar({
  value = 0,
  minValue = 0,
  maxValue = 100,
  label,
  valueLabel,
  showValue = true,
  indeterminate = false,
  tone = 'accent',
  size = 'regular',
  className,
  ...rest
}: ProgressBarProps) {
  const messages = useMessages()
  const clamped = Math.min(Math.max(value, minValue), maxValue)
  return (
    <AriaProgressBar
      value={clamped}
      minValue={minValue}
      maxValue={maxValue}
      isIndeterminate={indeterminate}
      valueLabel={valueLabel}
      aria-label={label ? undefined : rest['aria-label']}
      className={cx('fk-progress', className)}
      data-tone={tone}
      data-size={size}
      data-indeterminate={indeterminate || undefined}
      data-complete={!indeterminate && clamped >= maxValue ? true : undefined}
    >
      {({ percentage, valueText }) => (
        <>
          {label || (showValue && !indeterminate) || indeterminate ? (
            <div className="fk-progress__header">
              {label ? <Label className="fk-progress__label">{label}</Label> : <span />}
              {indeterminate ? (
                <span className="fk-progress__value fk-progress__value--indeterminate">{messages.inProgress}</span>
              ) : showValue ? (
                <span className="fk-progress__value">{valueText}</span>
              ) : null}
            </div>
          ) : null}
          <div className="fk-progress__track" aria-hidden="true">
            <div
              className="fk-progress__fill"
              style={indeterminate ? undefined : { inlineSize: `${percentage ?? 0}%` }}
            />
          </div>
        </>
      )}
    </AriaProgressBar>
  )
}
