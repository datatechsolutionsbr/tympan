import { CircleAlert } from 'lucide-react'
import { forwardRef, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Label, TextArea as AriaTextArea, TextField as AriaTextField } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { useMergedRefs } from '../../internal/dom'
import { useMessages } from '../../internal/provider'
import { useAppearedAfterMount, useFieldControl } from '../field/Field'

export interface TextAreaProps {
  label?: string
  accessibleLabel?: string
  hint?: ReactNode
  errorMessage?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Initial visible lines. */
  rows?: number
  /** Grows with content up to `maxRows`, then scrolls. */
  autoGrow?: boolean
  maxRows?: number
  resize?: 'none' | 'vertical'
  maxLength?: number
  showCounter?: boolean
  /** Mono family for code, keys or JSON. */
  monospace?: boolean
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  name?: string
  placeholder?: string
  id?: string
  className?: string
}

/** Multi-line text entry (spec: wave-1/text-area.md). */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(props, forwardedRef) {
  const {
    label,
    accessibleLabel,
    hint,
    errorMessage,
    value,
    defaultValue,
    onChange,
    rows = 3,
    autoGrow = false,
    maxRows,
    resize = 'vertical',
    maxLength,
    showCounter = false,
    monospace = false,
    required,
    disabled,
    readOnly = false,
    name,
    placeholder,
    id,
    className,
  } = props
  const messages = useMessages()
  const base = useId()
  const areaRef = useRef<HTMLTextAreaElement | null>(null)
  const ref = useMergedRefs(areaRef, forwardedRef)
  const [inner, setInner] = useState(defaultValue ?? '')
  const current = value ?? inner
  const setValue = (v: string) => {
    if (value === undefined) setInner(v)
    onChange?.(v)
  }

  const overLimit = maxLength != null && current.length > maxLength
  const hintId = hint != null ? `${base}-hint` : undefined
  const errorId = errorMessage ? `${base}-error` : undefined
  const counterId = showCounter && maxLength != null ? `${base}-counter` : undefined
  const wiring = useFieldControl({
    id,
    describedBy: [hintId, errorId, counterId].filter(Boolean).join(' ') || undefined,
    invalid: !!errorMessage || overLimit,
    required,
    disabled,
  })
  const errorAppeared = useAppearedAfterMount(!!errorMessage)
  devWarning(!label && !accessibleLabel && !wiring.labelledBy, 'TextArea: provide `label`, `accessibleLabel` or a surrounding Field label.')

  // Auto-grow: count hard lines, and in a real browser also soft-wrapped lines
  // measured from scrollHeight. No animation (spec).
  const lineCount = current.split('\n').length
  const [measured, setMeasured] = useState(0)
  useEffect(() => {
    const el = areaRef.current
    if (!autoGrow || !el) return
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
    if (!lineHeight || Number.isNaN(lineHeight)) return
    const previous = el.rows
    el.rows = 1
    const needed = Math.ceil((el.scrollHeight - 0.5) / lineHeight)
    el.rows = previous
    setMeasured(needed)
  }, [autoGrow, current])
  const wanted = Math.max(rows, lineCount, measured)
  const visibleRows = autoGrow ? (maxRows ? Math.min(wanted, maxRows) : wanted) : rows
  const scrolling = autoGrow && maxRows != null && wanted > maxRows

  return (
    <AriaTextField
      id={wiring.id}
      value={current}
      onChange={setValue}
      isDisabled={wiring.disabled}
      isReadOnly={readOnly}
      isRequired={wiring.required}
      isInvalid={wiring.invalid}
      name={name}
      aria-label={label ? undefined : accessibleLabel}
      aria-labelledby={!label && !accessibleLabel ? wiring.labelledBy : undefined}
      aria-describedby={wiring.describedBy}
      className={cx('ty-text-area', className)}
      data-monospace={monospace || undefined}
      data-resize={resize}
      data-auto-grow={autoGrow || undefined}
      data-scrolling={scrolling || undefined}
    >
      {label ? <Label className="ty-text-area__label">{label}</Label> : null}
      {hint != null ? (
        <p id={hintId} className="ty-text-area__hint">
          {hint}
        </p>
      ) : null}
      <AriaTextArea ref={ref} className="ty-text-area__input" rows={visibleRows} placeholder={placeholder} />
      {errorMessage ? (
        <p id={errorId} className="ty-text-area__error" aria-live={errorAppeared ? 'polite' : undefined}>
          <CircleAlert className="ty-icon" aria-hidden="true" focusable="false" />
          <span>{errorMessage}</span>
        </p>
      ) : null}
      {counterId && maxLength != null ? (
        <p id={counterId} className="ty-text-area__counter" data-over-limit={overLimit || undefined}>
          {overLimit ? messages.textField.overLimit(current.length, maxLength) : messages.textField.counter(current.length, maxLength)}
        </p>
      ) : null}
    </AriaTextField>
  )
})
