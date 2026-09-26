import { Check, CircleAlert, Minus } from 'lucide-react'
import { forwardRef, useId, type ReactNode } from 'react'
import { Checkbox as AriaCheckbox, CheckboxGroup as AriaCheckboxGroup, Label } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { useAppearedAfterMount } from '../field/Field'

export interface CheckboxProps {
  isSelected?: boolean
  defaultSelected?: boolean
  /** Mixed state for "select all" rows. */
  isIndeterminate?: boolean
  onChange?: (isSelected: boolean) => void
  label?: string
  /** Name when the visible text lives elsewhere. */
  accessibleLabel?: string
  description?: ReactNode
  /** Tile draws a surface around the row; bare is indicator plus text. */
  appearance?: 'tile' | 'bare'
  disabled?: boolean
  errorMessage?: string
  name?: string
  /** Form value; also the item key inside a CheckboxGroup. */
  value?: string
  required?: boolean
  id?: string
  className?: string
}

/** Whole-row checkbox with label and description (spec: wave-1/checkbox.md). */
export const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(function Checkbox(props, ref) {
  const {
    isSelected,
    defaultSelected,
    isIndeterminate,
    onChange,
    label,
    accessibleLabel,
    description,
    appearance = 'tile',
    disabled = false,
    errorMessage,
    name,
    value,
    required,
    id,
    className,
  } = props
  const base = useId()
  devWarning(!label && !accessibleLabel, 'Checkbox: provide `label` or `accessibleLabel`.')
  const labelId = label ? `${base}-label` : undefined
  const descId = description != null ? `${base}-desc` : undefined
  const errorId = errorMessage ? `${base}-error` : undefined
  const describedBy = [descId, errorId].filter(Boolean).join(' ') || undefined
  const appeared = useAppearedAfterMount(!!errorMessage)
  return (
    <div className={cx('ty-checkbox', className)} data-appearance={appearance}>
      <AriaCheckbox
        ref={ref}
        id={id}
        isSelected={isSelected}
        defaultSelected={defaultSelected}
        isIndeterminate={isIndeterminate}
        onChange={onChange}
        isDisabled={disabled}
        isInvalid={!!errorMessage}
        isRequired={required}
        name={name}
        value={value}
        aria-label={label ? undefined : accessibleLabel}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        className="ty-checkbox__row"
      >
        {({ isSelected: checked, isIndeterminate: mixed }) => (
          <>
            <span className="ty-checkbox__indicator" aria-hidden="true">
              {mixed ? <Minus className="ty-icon" focusable="false" /> : checked ? <Check className="ty-icon" focusable="false" /> : null}
            </span>
            {label || description != null ? (
              <span className="ty-checkbox__text">
                {label ? (
                  <span id={labelId} className="ty-checkbox__label">
                    {label}
                  </span>
                ) : null}
                {description != null ? (
                  <span id={descId} className="ty-checkbox__description">
                    {description}
                  </span>
                ) : null}
              </span>
            ) : null}
          </>
        )}
      </AriaCheckbox>
      {errorMessage ? (
        <p id={errorId} className="ty-checkbox__error" aria-live={appeared ? 'polite' : undefined}>
          <CircleAlert className="ty-icon" aria-hidden="true" focusable="false" />
          <span>{errorMessage}</span>
        </p>
      ) : null}
    </div>
  )
})

export interface CheckboxGroupProps {
  label: string
  description?: ReactNode
  value?: string[]
  defaultValue?: string[]
  onChange?: (values: string[]) => void
  orientation?: 'vertical' | 'horizontal'
  errorMessage?: string
  disabled?: boolean
  required?: boolean
  name?: string
  children: ReactNode
  className?: string
}

/** A labelled set of checkbox rows. */
export function CheckboxGroup({
  label,
  description,
  value,
  defaultValue,
  onChange,
  orientation = 'vertical',
  errorMessage,
  disabled,
  required,
  name,
  children,
  className,
}: CheckboxGroupProps) {
  const base = useId()
  const descId = description != null ? `${base}-desc` : undefined
  const errorId = errorMessage ? `${base}-error` : undefined
  return (
    <AriaCheckboxGroup
      className={cx('ty-checkbox-group', className)}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      isDisabled={disabled}
      isRequired={required}
      isInvalid={!!errorMessage}
      name={name}
      aria-describedby={[descId, errorId].filter(Boolean).join(' ') || undefined}
      data-orientation={orientation}
    >
      <Label className="ty-checkbox-group__label">{label}</Label>
      {description != null ? (
        <p id={descId} className="ty-checkbox-group__description">
          {description}
        </p>
      ) : null}
      <div className="ty-checkbox-group__items">{children}</div>
      {errorMessage ? (
        <p id={errorId} className="ty-checkbox__error">
          <CircleAlert className="ty-icon" aria-hidden="true" focusable="false" />
          <span>{errorMessage}</span>
        </p>
      ) : null}
    </AriaCheckboxGroup>
  )
}
