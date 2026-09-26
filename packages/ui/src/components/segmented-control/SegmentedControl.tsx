import { useState } from 'react'
import { Radio, RadioGroup } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { requestHaptic } from '../../internal/haptics'
import type { IconComponent } from '../../internal/types'

export type SegmentedOption = string | { value: string; label: string; icon?: IconComponent }

export interface SegmentedControlProps {
  /** Two to five segments; a string is both value and label. */
  options: SegmentedOption[]
  value?: string
  defaultValue?: string
  /** Called only when the value actually changes. */
  onChange: (value: string) => void
  /** Accessible name of the group. */
  label: string
  size?: 'compact' | 'regular' | 'large'
  fullWidth?: boolean
  disabled?: boolean
  /** Hide labels visually; labels remain the accessible names. */
  iconOnly?: boolean
  className?: string
}

function normalise(o: SegmentedOption) {
  return typeof o === 'string' ? { value: o, label: o, icon: undefined } : o
}

/** Exactly one of a small set of options, changed in place (spec: wave-1/segmented-control.md). */
export function SegmentedControl({
  options,
  value,
  defaultValue,
  onChange,
  label,
  size = 'regular',
  fullWidth = false,
  disabled = false,
  iconOnly = false,
  className,
}: SegmentedControlProps) {
  const items = options.map(normalise)
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value ?? '')
  const current = value ?? inner
  return (
    <RadioGroup
      aria-label={label}
      orientation="horizontal"
      value={current}
      isDisabled={disabled}
      onChange={(next) => {
        if (next === current) return
        if (value === undefined) setInner(next)
        requestHaptic('light')
        onChange(next)
      }}
      className={cx('fk-segmented-control', className)}
      data-size={size}
      data-full-width={fullWidth || undefined}
      data-icon-only={iconOnly || undefined}
    >
      {items.map((o) => {
        const Icon = o.icon
        return (
          <Radio key={o.value} value={o.value} className="fk-segmented-control__segment" aria-label={iconOnly ? o.label : undefined}>
            {Icon ? <Icon className="fk-icon" aria-hidden="true" focusable="false" /> : null}
            <span className={iconOnly ? 'fk-visually-hidden' : 'fk-segmented-control__label'} title={fullWidth ? o.label : undefined}>
              {o.label}
            </span>
          </Radio>
        )
      })}
    </RadioGroup>
  )
}
