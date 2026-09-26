// Labelled number field (RAC NumberField; the design system has no NumberField
// yet): label above, identifier hint in mono, optional currency adornment,
// locale-aware parsing, whole numbers only when `integer`.

import type { ReactNode } from 'react'
import { FieldError, Group, Input, Label, NumberField, Text } from 'react-aria-components'

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

export function NumberInput({ label, hint, value, onChange, integer = false, prefix, errorMessage, autoFocus, name }: NumberInputProps) {
  return (
    <NumberField
      className="fk-run-number"
      value={value ?? Number.NaN}
      onChange={(v) => onChange(Number.isNaN(v) ? null : v)}
      formatOptions={integer ? { maximumFractionDigits: 0, useGrouping: false } : { maximumFractionDigits: 20, useGrouping: false }}
      {...(integer ? { step: 1 } : {})}
      isInvalid={!!errorMessage}
      {...(autoFocus ? { autoFocus } : {})}
      {...(name ? { name } : {})}
    >
      <Label className="fk-run-field__label">{label}</Label>
      {hint ? (
        <Text slot="description" className="fk-run-field__hint">
          {hint}
        </Text>
      ) : null}
      <Group className="fk-run-number__group">
        {prefix ? (
          <span className="fk-run-number__prefix" aria-hidden="true">
            {prefix}
          </span>
        ) : null}
        <Input className="fk-run-number__input" data-integer={integer || undefined} />
      </Group>
      {errorMessage ? <FieldError className="fk-run-field__error">{errorMessage}</FieldError> : null}
    </NumberField>
  )
}
