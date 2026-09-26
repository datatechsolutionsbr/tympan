import { X } from 'lucide-react'
import { useContext, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
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

/* ---------------------------------------------------------------- gate -- */

/** Why an entry was refused (kept for readability; the field just ignores refusals). */
type Verdict = { take: string } | { refuse: 'blank' | 'invalid' | 'duplicate' | 'full' | 'unlisted' }

const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0

/** The gate every entry passes: trim, normalise, then the four refusals in order. */
function judge(raw: string, held: readonly string[], props: TagFieldProps): Verdict {
  const bare = raw.trim()
  if (bare === '') return { refuse: 'blank' }
  const shaped = props.validate ? props.validate(bare) : bare
  if (!shaped) return { refuse: 'invalid' }
  if (held.some((h) => same(h, shaped))) return { refuse: 'duplicate' }
  if (props.max !== undefined && held.length >= props.max) return { refuse: 'full' }
  const closed = props.suggestions && props.allowFreeText === false
  if (closed && !props.suggestions!.includes(shaped)) return { refuse: 'unlisted' }
  return { take: shaped }
}

/* --------------------------------------------------------------- typing -- */

/**
 * The text being typed. After a commit, the combobox writes the chosen
 * option's text back into the input once; that echo is dropped.
 */
function useTyping() {
  const [typed, setTyped] = useState('')
  const echo = useRef<string | null>(null)
  return {
    typed,
    expectEcho: (text: string) => {
      echo.current = text
      setTyped('')
    },
    receive: (text: string) => {
      const isEcho = echo.current !== null && text === echo.current
      echo.current = null
      setTyped(isEcho ? '' : text)
    },
  }
}

interface KeyPlan {
  typed: string
  commitTyped: () => void
  commitOption: (id: string) => void
  dropLast: () => void
}

/** Input with the commit keys; reads the combobox (if any) to know whether an option is highlighted. */
function TypingInput({ id, holder, plan, inputRef }: { id: string; holder?: string; plan: KeyPlan; inputRef: RefObject<HTMLInputElement | null> }) {
  const combo = useContext(ComboBoxStateContext)
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const pointed = combo?.isOpen ? combo.selectionManager.focusedKey : null
    const commits = event.key === 'Enter' || event.key === ','
    if (event.key === 'Backspace' && plan.typed === '') return plan.dropLast()
    if (!commits || (event.key === 'Enter' && pointed != null)) return // Enter on an option is the combobox's own
    event.preventDefault()
    if (pointed == null) return plan.commitTyped()
    plan.commitOption(String(pointed))
    combo?.close()
  }
  return <Input id={id} ref={inputRef} className="fk-tag-field__typing" placeholder={holder} onKeyDown={onKeyDown} />
}

/* ---------------------------------------------------------------- chips -- */

function DropChip({ spoken, off }: { spoken: string; off?: boolean }) {
  const nameId = useId()
  return (
    <AriaButton slot="remove" className="fk-tag-field__drop" aria-labelledby={nameId} isDisabled={off}>
      <X className="fk-icon" aria-hidden="true" focusable="false" />
      <span id={nameId} className="fk-visually-hidden">
        {spoken}
      </span>
    </AriaButton>
  )
}

function ChipStrip(props: { name: string; chips: Array<{ id: string; text: string }>; off?: boolean; dropName: (text: string) => string; onDrop?: (keys: Set<Key>) => void }) {
  return (
    <TagGroup aria-label={props.name} onRemove={props.onDrop} className="fk-tag-field__chips">
      <TagList items={props.chips} className="fk-tag-field__chip-list">
        {(chip) => (
          <Tag id={chip.id} textValue={chip.text} className="fk-tag-field__chip" isDisabled={props.off}>
            <span className="fk-tag-field__chip-text">{chip.text}</span>
            <DropChip spoken={props.dropName(chip.text)} off={props.off} />
          </Tag>
        )}
      </TagList>
    </TagGroup>
  )
}

/* ------------------------------------------------------------ component -- */

const tint = (tone: TagFieldTone): CSSProperties | undefined =>
  typeof tone === 'number' ? ({ '--fk-tag-field-tint': `var(--fk-categorical-${tone})` } as CSSProperties) : undefined

/**
 * Short values typed into removable chips, optionally assisted by (or
 * restricted to) suggestions (spec: wave-2/tag-field.md).
 */
export function TagField(props: TagFieldProps) {
  const copy = useMessages().tagField
  const held = props.value
  const tone = props.tone ?? 'neutral'
  const shown = (v: string) => props.suggestionLabels?.[v] ?? v
  const typing = useTyping()
  const inputRef = useRef<HTMLInputElement>(null)
  const wellRef = useRef<HTMLDivElement>(null)
  const root = useId()
  const ids = {
    input: `${root}-in`,
    caption: `${root}-cap`,
    note: props.helperText ? `${root}-note` : undefined,
    fault: props.errorText ? `${root}-fault` : undefined,
  }

  const admit = (raw: string) => {
    const verdict = judge(raw, held, props)
    if (!('take' in verdict)) return
    typing.expectEcho(shown(verdict.take))
    props.onChange([...held, verdict.take])
  }
  const plan: KeyPlan = {
    typed: typing.typed,
    commitTyped: () => admit(typing.typed),
    commitOption: admit,
    dropLast: () => {
      if (held.length && !props.disabled) props.onChange(held.slice(0, -1))
    },
  }

  const query = typing.typed.trim().toLocaleLowerCase()
  const offers = (props.suggestions ?? []).flatMap((s) => {
    if (held.some((h) => same(h, s))) return []
    const text = shown(s)
    const hit = !query || s.toLocaleLowerCase().includes(query) || text.toLocaleLowerCase().includes(query)
    return hit ? [{ id: s, text }] : []
  })

  // The chips sit beside (not inside) the text primitive so the two collections never share state.
  const hostProps = {
    className: 'fk-tag-field__typing-host',
    'aria-label': props.label ? undefined : props.ariaLabel,
    'aria-labelledby': props.label ? ids.caption : undefined,
    'aria-describedby': [ids.note, ids.fault].filter(Boolean).join(' ') || undefined,
    isDisabled: props.disabled || (props.max !== undefined && held.length >= props.max),
    isInvalid: Boolean(props.errorText),
  }
  const input = <TypingInput id={ids.input} holder={props.placeholder} plan={plan} inputRef={inputRef} />

  const typingHost: ReactNode = props.suggestions ? (
    <ComboBox
      {...hostProps}
      allowsCustomValue={props.allowFreeText ?? true}
      shouldFocusWrap
      menuTrigger="input"
      inputValue={typing.typed}
      onInputChange={typing.receive}
      items={offers}
      defaultFilter={() => true}
      selectedKey={null}
      onSelectionChange={(key) => key != null && admit(String(key))}
    >
      {input}
      <Popover className="fk-tag-field__menu-layer" offset={4} triggerRef={wellRef}>
        <ListBox className="fk-tag-field__menu" aria-label={copy.suggestions}>
          {(offer: { id: string; text: string }) => (
            <ListBoxItem id={offer.id} textValue={offer.text} className="fk-tag-field__choice">
              {offer.text}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  ) : (
    <AriaTextField {...hostProps} value={typing.typed} onChange={typing.receive}>
      {input}
    </AriaTextField>
  )

  const lines: Array<[string | undefined, string | undefined, string]> = [
    [ids.note, props.helperText, 'fk-tag-field__note'],
    [ids.fault, props.errorText, 'fk-tag-field__fault'],
  ]

  return (
    <div
      className={cx('fk-tag-field', props.className)}
      data-tone={typeof tone === 'number' ? 'category' : tone}
      data-invalid={props.errorText ? true : undefined}
      style={tint(tone)}
    >
      {props.label ? (
        <label id={ids.caption} htmlFor={ids.input} className="fk-tag-field__caption">
          {props.label}
        </label>
      ) : null}
      <div ref={wellRef} className="fk-tag-field__well" data-disabled={props.disabled || undefined}>
        <ChipStrip
          name={copy.chosen(props.label ?? props.ariaLabel ?? '')}
          chips={held.map((v) => ({ id: v, text: shown(v) }))}
          off={props.disabled}
          dropName={props.removeLabel ?? copy.remove}
          onDrop={
            props.disabled
              ? undefined
              : (keys) => {
                  const gone = new Set([...keys].map(String))
                  props.onChange(held.filter((v) => !gone.has(v)))
                  inputRef.current?.focus()
                }
          }
        />
        {typingHost}
      </div>
      {lines.map(([id, text, className]) =>
        id ? (
          <p key={className} id={id} className={className}>
            {text}
          </p>
        ) : null,
      )}
    </div>
  )
}
