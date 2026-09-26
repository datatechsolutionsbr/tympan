import { forwardRef, useId, useState, type ReactNode } from 'react'
import { Switch as AriaSwitch } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'

export interface SwitchProps {
  isSelected?: boolean
  defaultSelected?: boolean
  onChange?: (isSelected: boolean) => void
  label?: string
  /** Name when there is no visible label. */
  accessibleLabel?: string
  description?: ReactNode
  /** Row (control then label) or setting tile (text start, control end). */
  layout?: 'inline' | 'tile'
  size?: 'small' | 'regular' | 'large'
  disabled?: boolean
  /** Focusable and announces its state, but cannot change. */
  readOnly?: boolean
  name?: string
  value?: string
  id?: string
  className?: string
}

/** On/off setting with immediate effect (spec: wave-1/switch.md). */
export const Switch = forwardRef<HTMLLabelElement, SwitchProps>(function Switch(props, ref) {
  const {
    isSelected,
    defaultSelected = false,
    onChange,
    label,
    accessibleLabel,
    description,
    layout = 'inline',
    size = 'regular',
    disabled = false,
    readOnly = false,
    name,
    value,
    id,
    className,
  } = props
  devWarning(!label && !accessibleLabel, 'Switch: provide `label` or `accessibleLabel`.')
  const base = useId()
  const labelId = label ? `${base}-label` : undefined
  const descId = description != null ? `${base}-desc` : undefined
  const [inner, setInner] = useState(defaultSelected)
  const selected = isSelected ?? inner
  const set = (next: boolean) => {
    if (isSelected === undefined) setInner(next)
    onChange?.(next)
  }

  return (
    <AriaSwitch
      ref={ref}
      id={id}
      isSelected={selected}
      onChange={set}
      isDisabled={disabled}
      isReadOnly={readOnly}
      name={name}
      value={value}
      aria-label={label ? undefined : accessibleLabel}
      aria-labelledby={labelId}
      aria-describedby={descId}
      // Enter toggles as well as Space (parity with the previous library).
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !disabled && !readOnly) {
          e.preventDefault()
          set(!selected)
        } else {
          e.continuePropagation()
        }
      }}
      className={cx('fk-switch', className)}
      data-layout={layout}
      data-size={size}
    >
      <span className="fk-switch__track" aria-hidden="true">
        <span className="fk-switch__thumb" />
      </span>
      {label || description != null ? (
        <span className="fk-switch__text">
          {label ? (
            <span id={labelId} className="fk-switch__label">
              {label}
            </span>
          ) : null}
          {description != null ? (
            <span id={descId} className="fk-switch__description">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </AriaSwitch>
  )
})

export interface SwitchGroupProps {
  label?: string
  children: ReactNode
  className?: string
}

/** Vertical stack of switch rows with an optional group label. */
export function SwitchGroup({ label, children, className }: SwitchGroupProps) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={label ? id : undefined} className={cx('fk-switch-group', className)}>
      {label ? (
        <span id={id} className="fk-switch-group__label">
          {label}
        </span>
      ) : null}
      {children}
    </div>
  )
}
