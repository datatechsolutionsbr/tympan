import { CircleAlert, CircleCheck, Eye, EyeOff, Search, X } from 'lucide-react'
import { forwardRef, useId, useRef, useState, type FocusEvent, type ReactNode } from 'react'
import { Button as AriaButton, Input, Label, SearchField, TextField as AriaTextField } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { useMergedRefs } from '../../internal/dom'
import { useMessages } from '../../internal/provider'
import { useAppearedAfterMount, useFieldControl } from '../field/Field'

export type TextFieldMode = 'text' | 'search' | 'password'

export interface TextFieldProps {
  /** Search adds the magnifier and clear action; password adds the reveal action. */
  mode?: TextFieldMode
  /** Native type for `mode="text"`. */
  inputType?: 'text' | 'email' | 'url' | 'tel' | 'number'
  label?: string
  accessibleLabel?: string
  hint?: ReactNode
  errorMessage?: string
  successMessage?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Shows the clear action when non-empty (default true in search mode). */
  clearable?: boolean
  onClear?: () => void
  /** Shows the reveal action (default true in password mode). */
  revealable?: boolean
  maxLength?: number
  showCounter?: boolean
  appearance?: 'outlined' | 'filled'
  leadingIcon?: ReactNode
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  autoComplete?: string
  name?: string
  placeholder?: string
  id?: string
  className?: string
  autoFocus?: boolean
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
}

/** Single-line text entry: plain, search and password (spec: wave-1/text-field.md). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(props, forwardedRef) {
  const {
    mode = 'text',
    inputType = 'text',
    label,
    accessibleLabel,
    hint,
    errorMessage,
    successMessage,
    value,
    defaultValue,
    onChange,
    clearable = mode === 'search',
    onClear,
    revealable = mode === 'password',
    maxLength,
    showCounter = false,
    appearance = 'outlined',
    leadingIcon,
    required,
    disabled,
    readOnly = false,
    autoComplete,
    name,
    placeholder,
    id,
    className,
    autoFocus,
    onFocus,
    onBlur,
  } = props
  const messages = useMessages()
  const base = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const ref = useMergedRefs(inputRef, forwardedRef)

  const [inner, setInner] = useState(defaultValue ?? '')
  const current = value ?? inner
  const setValue = (v: string) => {
    if (value === undefined) setInner(v)
    onChange?.(v)
  }
  const [revealed, setRevealed] = useState(false)

  const overLimit = maxLength != null && current.length > maxLength
  const ownError = !!errorMessage
  const hintId = hint != null ? `${base}-hint` : undefined
  const errorId = ownError ? `${base}-error` : undefined
  const successId = successMessage && !ownError && !overLimit ? `${base}-success` : undefined
  const counterId = showCounter && maxLength != null ? `${base}-counter` : undefined
  const wiring = useFieldControl({
    id,
    describedBy: [hintId, errorId, successId, counterId].filter(Boolean).join(' ') || undefined,
    invalid: ownError || overLimit,
    required,
    disabled,
  })
  const errorAppeared = useAppearedAfterMount(ownError)

  devWarning(!label && !accessibleLabel && !wiring.labelledBy, 'TextField: provide `label`, `accessibleLabel` or a surrounding Field label.')

  const clear = () => {
    setValue('')
    onClear?.()
    inputRef.current?.focus()
  }

  const type = mode === 'password' ? (revealed ? 'text' : 'password') : mode === 'search' ? 'search' : inputType
  const icon = leadingIcon ?? (mode === 'search' ? <Search /> : null)
  const showClear = clearable && current.length > 0 && !readOnly && !wiring.disabled

  const shared = {
    id: wiring.id,
    value: current,
    onChange: setValue,
    isDisabled: wiring.disabled,
    isReadOnly: readOnly,
    isRequired: wiring.required,
    isInvalid: wiring.invalid,
    name,
    autoComplete,
    autoFocus,
    'aria-label': label ? undefined : accessibleLabel,
    'aria-labelledby': !label && !accessibleLabel ? wiring.labelledBy : undefined,
    'aria-describedby': wiring.describedBy,
    className: cx('ty-text-field', className),
    'data-appearance': appearance,
    'data-mode': mode,
    onFocus,
    onBlur,
  }

  const inner_ = (
    <>
      {label ? <Label className="ty-text-field__label">{label}</Label> : null}
      {hint != null ? (
        <p id={hintId} className="ty-text-field__hint">
          {hint}
        </p>
      ) : null}
      <div className="ty-text-field__group">
        {icon ? (
          <span className="ty-text-field__leading" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <Input ref={ref} className="ty-text-field__input" type={type} placeholder={placeholder} />
        {showClear && mode === 'search' ? (
          <AriaButton className="ty-text-field__action" aria-label={messages.textField.clear}>
            <X className="ty-icon" aria-hidden="true" focusable="false" />
          </AriaButton>
        ) : null}
        {showClear && mode !== 'search' ? (
          <AriaButton className="ty-text-field__action" aria-label={messages.textField.clear} onPress={clear}>
            <X className="ty-icon" aria-hidden="true" focusable="false" />
          </AriaButton>
        ) : null}
        {mode === 'password' && revealable ? (
          <AriaButton
            className="ty-text-field__action"
            aria-label={revealed ? messages.textField.hidePassword : messages.textField.showPassword}
            aria-pressed={revealed}
            isDisabled={wiring.disabled}
            onPress={() => setRevealed((r) => !r)}
          >
            {revealed ? <EyeOff className="ty-icon" aria-hidden="true" focusable="false" /> : <Eye className="ty-icon" aria-hidden="true" focusable="false" />}
          </AriaButton>
        ) : null}
        {successId ? <CircleCheck className="ty-icon ty-text-field__success-mark" aria-hidden="true" focusable="false" /> : null}
      </div>
      {ownError ? (
        <p id={errorId} className="ty-text-field__error" aria-live={errorAppeared ? 'polite' : undefined}>
          <CircleAlert className="ty-icon" aria-hidden="true" focusable="false" />
          <span>{errorMessage}</span>
        </p>
      ) : null}
      {successId ? (
        <p id={successId} className="ty-text-field__success">
          {successMessage}
        </p>
      ) : null}
      {counterId && maxLength != null ? (
        <p id={counterId} className="ty-text-field__counter" data-over-limit={overLimit || undefined}>
          {overLimit ? messages.textField.overLimit(current.length, maxLength) : messages.textField.counter(current.length, maxLength)}
        </p>
      ) : null}
    </>
  )

  if (mode === 'search') {
    return (
      <SearchField {...shared} onClear={() => {
        if (value === undefined) setInner('')
        onClear?.()
      }}>
        {inner_}
      </SearchField>
    )
  }
  return <AriaTextField {...shared} type={type}>{inner_}</AriaTextField>
})
