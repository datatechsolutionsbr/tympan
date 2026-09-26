import { ChevronDown, CircleAlert } from 'lucide-react'
import { forwardRef, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  Button as AriaButton,
  Dialog,
  Heading,
  ListBox,
  ListBoxItem,
  Modal,
  ModalOverlay,
  type Key,
} from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { useMediaQuery } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import { useAppearedAfterMount, useFieldControl } from '../field/Field'

export type NativeSelectOption = string | { value: string; label: string; disabled?: boolean }
export interface NativeSelectGroup {
  label: string
  options: NativeSelectOption[]
}

export interface NativeSelectProps {
  label?: string
  accessibleLabel?: string
  hint?: ReactNode
  errorMessage?: string
  options?: NativeSelectOption[]
  groups?: NativeSelectGroup[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Text of the empty, disabled first option. */
  placeholder?: string
  /** `wheel` opens a bottom drawer with a wheel on narrow touch screens. */
  touchPresentation?: 'native' | 'wheel'
  required?: boolean
  disabled?: boolean
  name?: string
  id?: string
  className?: string
}

interface NormalOption {
  value: string
  label: string
  disabled: boolean
}

function normalise(o: NativeSelectOption): NormalOption {
  return typeof o === 'string' ? { value: o, label: o, disabled: false } : { value: o.value, label: o.label, disabled: !!o.disabled }
}

/** One value from a short list with the platform select (spec: wave-1/native-select.md). */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(props, ref) {
  const {
    label,
    accessibleLabel,
    hint,
    errorMessage,
    options = [],
    groups,
    value,
    defaultValue,
    onChange,
    placeholder,
    touchPresentation = 'native',
    required,
    disabled,
    name,
    id,
    className,
  } = props
  const messages = useMessages()
  const base = useId()
  const [inner, setInner] = useState(defaultValue ?? '')
  const current = value ?? inner
  const setValue = (v: string) => {
    if (value === undefined) setInner(v)
    onChange?.(v)
  }
  const hintId = hint != null ? `${base}-hint` : undefined
  const errorId = errorMessage ? `${base}-error` : undefined
  const labelId = `${base}-label`
  const wiring = useFieldControl({ id, describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined, invalid: !!errorMessage, required, disabled })
  const errorAppeared = useAppearedAfterMount(!!errorMessage)
  devWarning(!label && !accessibleLabel && !wiring.labelledBy, 'NativeSelect: provide `label`, `accessibleLabel` or a surrounding Field label.')

  const narrowTouch = useMediaQuery('(max-width: 639.98px) and (pointer: coarse)')
  const wheel = touchPresentation === 'wheel' && narrowTouch
  const [open, setOpenState] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const setOpen = (next: boolean) => {
    setOpenState(next)
    // Return focus to the trigger on every way of closing (Done, Escape, backdrop).
    if (!next) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const flat: NormalOption[] = [...options.map(normalise), ...(groups ?? []).flatMap((g) => g.options.map(normalise))]
  const currentLabel = flat.find((o) => o.value === current)?.label ?? ''
  const placeholderText = placeholder ?? messages.select.placeholder

  const renderOptions = (list: NativeSelectOption[]) =>
    list.map(normalise).map((o) => (
      <option key={o.value} value={o.value} disabled={o.disabled}>
        {o.label}
      </option>
    ))

  const selectEl = (hidden: boolean) => (
    <select
      ref={ref}
      id={hidden ? undefined : wiring.id}
      name={name}
      value={current}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => setValue(e.target.value)}
      disabled={wiring.disabled}
      required={wiring.required}
      aria-invalid={wiring.invalid || undefined}
      aria-describedby={hidden ? undefined : wiring.describedBy}
      aria-label={hidden ? undefined : label ? undefined : accessibleLabel}
      aria-labelledby={hidden ? undefined : !label && !accessibleLabel ? wiring.labelledBy : undefined}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      hidden={hidden}
      className="fk-native-select__control"
    >
      <option value="" disabled>
        {placeholderText}
      </option>
      {renderOptions(options)}
      {groups?.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {renderOptions(g.options)}
        </optgroup>
      ))}
    </select>
  )

  const labelText = label ?? accessibleLabel ?? ''

  return (
    <div
      className={cx('fk-native-select', className)}
      data-invalid={wiring.invalid || undefined}
      data-disabled={wiring.disabled || undefined}
      data-presentation={wheel ? 'wheel' : 'native'}
    >
      {label ? (
        wheel ? (
          <span id={labelId} className="fk-native-select__label">
            {label}
          </span>
        ) : (
          <label htmlFor={wiring.id} className="fk-native-select__label">
            {label}
          </label>
        )
      ) : null}
      {hint != null ? (
        <p id={hintId} className="fk-native-select__hint">
          {hint}
        </p>
      ) : null}
      <div className="fk-native-select__frame">
        {wheel ? (
          <>
            <AriaButton
              ref={triggerRef}
              id={wiring.id}
              className="fk-native-select__control fk-native-select__trigger"
              aria-label={`${labelText}: ${currentLabel || placeholderText}`}
              aria-describedby={wiring.describedBy}
              aria-haspopup="dialog"
              aria-expanded={open}
              isDisabled={wiring.disabled}
              onPress={() => setOpen(true)}
            >
              <span className="fk-native-select__value" data-placeholder={!currentLabel || undefined}>
                {currentLabel || placeholderText}
              </span>
            </AriaButton>
            {selectEl(true)}
          </>
        ) : (
          selectEl(false)
        )}
        <ChevronDown className="fk-icon fk-native-select__chevron" aria-hidden="true" focusable="false" />
      </div>
      {errorMessage ? (
        <p id={errorId} className="fk-native-select__error" role={errorAppeared ? 'alert' : undefined}>
          <CircleAlert className="fk-icon" aria-hidden="true" focusable="false" />
          <span>{errorMessage}</span>
        </p>
      ) : null}
      {wheel ? (
        <ModalOverlay isOpen={open} onOpenChange={setOpen} isDismissable className="fk-native-select__overlay">
          <Modal className="fk-native-select__drawer">
            <Dialog className="fk-native-select__dialog">
              <Heading slot="title" className="fk-native-select__drawer-title">
                {labelText}
              </Heading>
              <ListBox
                aria-label={labelText}
                className="fk-native-select__wheel"
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={current ? [current] : []}
                disabledKeys={flat.filter((o) => o.disabled).map((o) => o.value)}
                onSelectionChange={(keys) => {
                  if (keys === 'all') return
                  const [first] = [...keys] as Key[]
                  if (first != null && String(first) !== current) setValue(String(first))
                }}
                autoFocus
              >
                {flat.map((o) => (
                  <ListBoxItem key={o.value} id={o.value} textValue={o.label} className="fk-native-select__wheel-item">
                    {o.label}
                  </ListBoxItem>
                ))}
              </ListBox>
              <AriaButton className="fk-native-select__done" onPress={() => setOpen(false)}>
                {messages.select.done}
              </AriaButton>
            </Dialog>
          </Modal>
        </ModalOverlay>
      ) : null}
    </div>
  )
})
