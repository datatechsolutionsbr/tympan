import { X } from 'lucide-react'
import { useContext, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react'
import {
  Button as AriaButton,
  ComboBox,
  ComboBoxStateContext,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
  Tag,
  TagGroup,
  TagList,
  TextField as AriaTextField,
  type Key,
} from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

export type TagFieldTone = 'neutral' | 'accent' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface TagFieldProps {
  value: string[]
  onChange: (next: string[]) => void
  label?: string
  ariaLabel?: string
  placeholder?: string
  suggestions?: string[]
  suggestionLabels?: Record<string, string>
  allowFreeText?: boolean
  /** Normalises an entry (after trimming) or rejects it with null. */
  validate?: (raw: string) => string | null
  max?: number
  disabled?: boolean
  tone?: TagFieldTone
  helperText?: string
  errorText?: string
  removeLabel?: (display: string) => string
  className?: string
}

/** The acceptance rules for one entry, as data the field consults. */
interface Rules {
  existing: string[]
  validate?: (raw: string) => string | null
  max?: number
  closedSet?: string[]
}

/** Returns the value to add, or null when the entry is rejected. */
function acceptEntry(raw: string, rules: Rules): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const normalised = rules.validate ? rules.validate(trimmed) : trimmed
  if (normalised == null || normalised === '') return null
  const lower = normalised.toLowerCase()
  if (rules.existing.some((v) => v.toLowerCase() === lower)) return null
  if (rules.max != null && rules.existing.length >= rules.max) return null
  if (rules.closedSet && !rules.closedSet.includes(normalised)) return null
  return normalised
}

interface EntryProps {
  id: string
  inputRef: RefObject<HTMLInputElement | null>
  placeholder?: string
  draft: string
  onCommitDraft: () => void
  onCommitKey: (key: string) => void
  onRemoveLast: () => void
}

/** The text entry; reads the combobox state (when present) to decide what Enter and comma commit. */
function Entry({ id, inputRef, placeholder, draft, onCommitDraft, onCommitKey, onRemoveLast }: EntryProps) {
  const combo = useContext(ComboBoxStateContext)
  const highlighted = () => (combo?.isOpen ? combo.selectionManager.focusedKey : null)
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && draft === '') {
      onRemoveLast()
      return
    }
    if (e.key !== 'Enter' && e.key !== ',') return
    const key = highlighted()
    if (e.key === 'Enter' && key != null) return // the combobox selects it
    e.preventDefault()
    if (key != null) {
      onCommitKey(String(key))
      combo?.close()
    } else onCommitDraft()
  }
  return <Input id={id} ref={inputRef} className="fk-tag-field__entry" placeholder={placeholder} onKeyDown={onKeyDown} />
}

/** Remove control of one pill, named by the host wording ("Remove alpha"). */
function PillRemove({ name, disabled }: { name: string; disabled?: boolean }) {
  const id = useId()
  return (
    <AriaButton slot="remove" className="fk-tag-field__remove" aria-labelledby={id} isDisabled={disabled}>
      <X className="fk-icon" aria-hidden="true" focusable="false" />
      <span id={id} className="fk-visually-hidden">
        {name}
      </span>
    </AriaButton>
  )
}

function toneStyle(tone: TagFieldTone): CSSProperties | undefined {
  return typeof tone === 'number' ? ({ '--fk-tag-field-tint': `var(--fk-categorical-${tone})` } as CSSProperties) : undefined
}

/**
 * Short values typed into removable pills, optionally assisted by (or
 * restricted to) suggestions (spec: wave-2/tag-field.md).
 */
export function TagField(props: TagFieldProps) {
  const m = useMessages()
  const { value, onChange, suggestions, suggestionLabels = {}, allowFreeText = true, tone = 'neutral' } = props
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const swallow = useRef<string | null>(null)
  const atMax = props.max != null && value.length >= props.max
  const shownText = (v: string) => suggestionLabels[v] ?? v
  const removeName = props.removeLabel ?? m.tagField.remove
  const name = props.label ?? props.ariaLabel ?? ''

  const add = (raw: string) => {
    const next = acceptEntry(raw, {
      existing: value,
      validate: props.validate,
      max: props.max,
      closedSet: suggestions && !allowFreeText ? suggestions : undefined,
    })
    if (next == null) return
    swallow.current = shownText(next)
    setDraft('')
    onChange([...value, next])
  }

  const removeKeys = (keys: Set<Key>) => {
    const drop = new Set([...keys].map(String))
    onChange(value.filter((v) => !drop.has(v)))
    inputRef.current?.focus()
  }

  const needle = draft.trim().toLowerCase()
  const options = (suggestions ?? [])
    .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
    .filter((s) => !needle || s.toLowerCase().includes(needle) || shownText(s).toLowerCase().includes(needle))
    .map((s) => ({ id: s, text: shownText(s) }))

  const pills = (
    <TagGroup aria-label={m.tagField.chosen(name)} onRemove={props.disabled ? undefined : removeKeys} className="fk-tag-field__pills">
      <TagList items={value.map((v) => ({ id: v, text: shownText(v) }))} className="fk-tag-field__list">
        {(pill) => (
          <Tag id={pill.id} textValue={pill.text} className="fk-tag-field__pill" isDisabled={props.disabled}>
            <span className="fk-tag-field__pill-text">{pill.text}</span>
            <PillRemove name={removeName(pill.text)} disabled={props.disabled} />
          </Tag>
        )}
      </TagList>
    </TagGroup>
  )

  const base = useId()
  const ids = {
    input: `${base}-entry`,
    label: `${base}-label`,
    helper: props.helperText ? `${base}-helper` : undefined,
    error: props.errorText ? `${base}-error` : undefined,
  }
  const boxRef = useRef<HTMLDivElement>(null)

  const entry = (
    <Entry
      id={ids.input}
      inputRef={inputRef}
      placeholder={props.placeholder}
      draft={draft}
      onCommitDraft={() => add(draft)}
      onCommitKey={add}
      onRemoveLast={() => {
        if (value.length > 0 && !props.disabled) onChange(value.slice(0, -1))
      }}
    />
  )

  const onDraft = (text: string) => {
    if (swallow.current != null && text === swallow.current) {
      swallow.current = null
      setDraft('')
      return
    }
    swallow.current = null
    setDraft(text)
  }

  // Pills sit beside (not inside) the text primitive so the two collections never share state.
  const control = {
    className: 'fk-tag-field__control',
    'aria-label': props.label ? undefined : props.ariaLabel,
    'aria-labelledby': props.label ? ids.label : undefined,
    'aria-describedby': [ids.helper, ids.error].filter(Boolean).join(' ') || undefined,
    isDisabled: props.disabled || atMax,
    isInvalid: !!props.errorText,
  }

  return (
    <div
      className={cx('fk-tag-field', props.className)}
      data-tone={typeof tone === 'number' ? 'category' : tone}
      data-invalid={props.errorText ? true : undefined}
      style={toneStyle(tone)}
    >
      {props.label ? (
        <label id={ids.label} htmlFor={ids.input} className="fk-tag-field__label">
          {props.label}
        </label>
      ) : null}
      <div ref={boxRef} className="fk-tag-field__box" data-disabled={props.disabled || undefined}>
        {pills}
        {suggestions ? (
          <ComboBox
            {...control}
            allowsCustomValue={allowFreeText}
            shouldFocusWrap
            menuTrigger="input"
            inputValue={draft}
            onInputChange={onDraft}
            items={options}
            defaultFilter={() => true}
            selectedKey={null}
            onSelectionChange={(key) => {
              if (key != null) add(String(key))
            }}
          >
            {entry}
            <Popover className="fk-tag-field__popover" offset={4} triggerRef={boxRef}>
              <ListBox className="fk-tag-field__options" aria-label={m.tagField.suggestions}>
                {(option: { id: string; text: string }) => (
                  <ListBoxItem id={option.id} textValue={option.text} className="fk-tag-field__option">
                    {option.text}
                  </ListBoxItem>
                )}
              </ListBox>
            </Popover>
          </ComboBox>
        ) : (
          <AriaTextField {...control} value={draft} onChange={onDraft}>
            {entry}
          </AriaTextField>
        )}
      </div>
      {ids.helper ? (
        <p id={ids.helper} className="fk-tag-field__helper">
          {props.helperText}
        </p>
      ) : null}
      {ids.error ? (
        <p id={ids.error} className="fk-tag-field__error">
          {props.errorText}
        </p>
      ) : null}
    </div>
  )
}
