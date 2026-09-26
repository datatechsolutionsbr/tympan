// Number field of the run dialogs, on React Aria NumberField (the design
// system has none yet). Label on top, the variable's identifier as a hint,
// an optional currency sign before the digits, whole numbers on request.

import type { ReactNode } from 'react'
import { FieldError, Group, Input, Label, NumberField, Text, type NumberFieldProps } from 'react-aria-components'

export interface NumberInputProps {
  label: string
  hint?: ReactNode
  value: number | null
  onChange: (value: number | null) => void
  integer?: boolean
  /** Visible currency symbol before the value. */
  prefix?: string
  errorMessage?: string
  autoFocus?: boolean
  name?: string
}

const WHOLE: Intl.NumberFormatOptions = { maximumFractionDigits: 0, useGrouping: false }
const ANY: Intl.NumberFormatOptions = { maximumFractionDigits: 20, useGrouping: false }

/** React Aria reports an empty field as NaN; the dialogs speak null. */
const fromField = (n: number): number | null => (Number.isNaN(n) ? null : n)
const toField = (n: number | null): number => (n === null ? Number.NaN : n)

export function NumberInput(props: NumberInputProps) {
  const fieldProps: NumberFieldProps = {
    className: 'ty-run-number',
    value: toField(props.value),
    onChange: (n) => props.onChange(fromField(n)),
    formatOptions: props.integer ? WHOLE : ANY,
    isInvalid: Boolean(props.errorMessage),
  }
  if (props.integer) fieldProps.step = 1
  if (props.autoFocus) fieldProps.autoFocus = true
  if (props.name) fieldProps.name = props.name
  const adornment = props.prefix ? (
    <span className="ty-run-number__prefix" aria-hidden="true">
      {props.prefix}
    </span>
  ) : null
  return (
    <NumberField {...fieldProps}>
      <Label className="ty-run-field__label">{props.label}</Label>
      {props.hint ? (
        <Text slot="description" className="ty-run-field__hint">
          {props.hint}
        </Text>
      ) : null}
      <Group className="ty-run-number__group">
        {adornment}
        <Input className="ty-run-number__input" data-integer={props.integer ? true : undefined} />
      </Group>
      {props.errorMessage ? <FieldError className="ty-run-field__error">{props.errorMessage}</FieldError> : null}
    </NumberField>
  )
}
