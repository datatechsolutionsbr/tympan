import { Check, ChevronDown, CircleAlert } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import {
  Button as AriaButton,
  Header,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Popover,
  Select,
  SelectValue,
  Text,
  type Key,
} from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { useMediaQuery } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import { useAppearedAfterMount, useFieldControl } from '../field/Field'

export interface ListboxSelectOption {
  value: string
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
}

export interface ListboxSelectSection {
  title: string
  options: ListboxSelectOption[]
}

export interface ListboxSelectProps {
  label?: string
  accessibleLabel?: string
  options?: ListboxSelectOption[]
  sections?: ListboxSelectSection[]
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  errorMessage?: string
  hint?: ReactNode
  disabled?: boolean
  required?: boolean
  /** Renders a hidden input for form submission. */
  name?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  id?: string
  className?: string
}

function Option({ option }: { option: ListboxSelectOption }) {
  return (
    <ListBoxItem id={option.value} textValue={option.label} isDisabled={option.disabled} className="fk-listbox-select__option">
      {({ isSelected }) => (
        <>
          {option.icon ? (
            <span className="fk-listbox-select__option-icon" aria-hidden="true">
              {option.icon}
            </span>
          ) : null}
          <span className="fk-listbox-select__option-text">
            <Text slot="label" className="fk-listbox-select__option-label">
              {option.label}
            </Text>
            {option.description ? (
              <Text slot="description" className="fk-listbox-select__option-description">
                {option.description}
              </Text>
            ) : null}
          </span>
          <span className="fk-listbox-select__check" aria-hidden="true">
            {isSelected ? <Check className="fk-icon" focusable="false" /> : null}
          </span>
        </>
      )}
    </ListBoxItem>
  )
}

/** One value from a custom listbox popover (spec: wave-1/listbox-select.md). */
export function ListboxSelect(props: ListboxSelectProps) {
  const {
    label,
    accessibleLabel,
    options = [],
    sections,
    value,
    defaultValue,
    onChange,
    placeholder,
    errorMessage,
    hint,
    disabled,
    required,
    name,
    open,
    onOpenChange,
    id,
    className,
  } = props
  const messages = useMessages()
  const base = useId()
  const hintId = hint != null ? `${base}-hint` : undefined
  const errorId = errorMessage ? `${base}-error` : undefined
  const wiring = useFieldControl({ id, describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined, invalid: !!errorMessage, required, disabled })
  const errorAppeared = useAppearedAfterMount(!!errorMessage)
  const narrow = useMediaQuery('(max-width: 639.98px)')
  devWarning(!label && !accessibleLabel && !wiring.labelledBy, 'ListboxSelect: provide `label`, `accessibleLabel` or a surrounding Field label.')

  const disabledKeys = [...options, ...(sections ?? []).flatMap((s) => s.options)].filter((o) => o.disabled).map((o) => o.value)

  const list = (
    <ListBox className="fk-listbox-select__list">
      {options.map((o) => (
        <Option key={o.value} option={o} />
      ))}
      {sections?.map((s) => (
        <ListBoxSection key={s.title} id={s.title} className="fk-listbox-select__section">
          <Header className="fk-listbox-select__section-title">{s.title}</Header>
          {s.options.map((o) => (
            <Option key={o.value} option={o} />
          ))}
        </ListBoxSection>
      ))}
    </ListBox>
  )

  return (
    <Select
      id={wiring.id}
      className={cx('fk-listbox-select', className)}
      value={value === undefined ? undefined : value}
      defaultValue={defaultValue ?? undefined}
      onChange={(key: Key | null) => {
        if (key != null) onChange?.(String(key))
      }}
      placeholder={placeholder ?? messages.select.placeholder}
      isDisabled={wiring.disabled}
      isRequired={wiring.required}
      isInvalid={wiring.invalid}
      disabledKeys={disabledKeys}
      name={name}
      isOpen={open}
      onOpenChange={onOpenChange}
      aria-label={label ? undefined : accessibleLabel}
      aria-labelledby={!label && !accessibleLabel ? wiring.labelledBy : undefined}
      aria-describedby={wiring.describedBy}
      data-presentation={narrow ? 'tray' : 'popover'}
    >
      {label ? <Label className="fk-listbox-select__label">{label}</Label> : null}
      {hint != null ? (
        <p id={hintId} className="fk-listbox-select__hint">
          {hint}
        </p>
      ) : null}
      <AriaButton className="fk-listbox-select__trigger" aria-describedby={wiring.describedBy}>
        <SelectValue className="fk-listbox-select__value" />
        <ChevronDown className="fk-icon fk-listbox-select__chevron" aria-hidden="true" focusable="false" />
      </AriaButton>
      {errorMessage ? (
        <p id={errorId} className="fk-listbox-select__error" aria-live={errorAppeared ? 'polite' : undefined}>
          <CircleAlert className="fk-icon" aria-hidden="true" focusable="false" />
          <span>{errorMessage}</span>
        </p>
      ) : null}
      {/* Narrow screens: the same popover (the collection must stay inside it)
          is laid out as a bottom tray by CSS. */}
      <Popover className={narrow ? 'fk-listbox-select__tray' : 'fk-listbox-select__popover'} offset={4} data-presentation={narrow ? 'tray' : 'popover'}>
        {list}
      </Popover>
    </Select>
  )
}
