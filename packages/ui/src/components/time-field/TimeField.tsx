import { Clock } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Button as AriaButton, DialogTrigger, Heading } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { FieldLine, FloatSurface, joinIds } from '../../internal/forms-b/parts'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'

export interface TimeOfDay {
  hours: number
  minutes: number
}

export interface TimeFieldProps {
  value: TimeOfDay | null
  /** Called only on confirm. */
  onChange: (time: TimeOfDay) => void
  label: string
  placeholder?: string
  /** The date this time belongs to. */
  referenceDate?: Date | null
  /** With a reference date of today, times after now cannot be confirmed. */
  disallowFuture?: boolean
  minuteStep?: number
  disabled?: boolean
  isInvalid?: boolean
  errorText?: string
  hint?: ReactNode
  className?: string
}

const two = (n: number) => String(n).padStart(2, '0')
export const formatTimeOfDay = (t: TimeOfDay) => `${two(t.hours)}:${two(t.minutes)}`

/** One spinbutton segment: digits only, clamped, arrows step and wrap. */
const SEGMENTS = {
  hours: { max: 23 },
  minutes: { max: 59 },
} as const
type SegmentName = keyof typeof SEGMENTS

function Segment(props: {
  name: SegmentName
  label: string
  value: number
  step: number
  onValue: (n: number) => void
  onConfirm: () => void
  inputRef?: React.Ref<HTMLInputElement>
  describedBy?: string
}) {
  const { max } = SEGMENTS[props.name]
  const [text, setText] = useState(two(props.value))
  useEffect(() => setText(two(props.value)), [props.value])
  const typed = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(-2)
    const n = digits === '' ? 0 : Math.min(max, Number(digits))
    setText(digits === '' ? '' : Number(digits) > max ? two(n) : digits)
    props.onValue(n)
  }
  const keys = (e: KeyboardEvent<HTMLInputElement>) => {
    const span = max + 1
    const move: Record<string, number> = { ArrowUp: props.step, ArrowDown: -props.step }
    if (e.key in move) {
      e.preventDefault()
      props.onValue((((props.value + move[e.key]!) % span) + span) % span)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      props.onConfirm()
    }
  }
  return (
    <input
      ref={props.inputRef}
      className="fk-time-field__segment"
      role="spinbutton"
      aria-label={props.label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={props.value}
      aria-valuetext={two(props.value)}
      aria-describedby={props.describedBy}
      inputMode="numeric"
      autoComplete="off"
      maxLength={3}
      value={text}
      onChange={(e) => typed(e.target.value)}
      onKeyDown={keys}
      onFocus={(e) => e.target.select()}
    />
  )
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** The editor inside the popover: hours, minutes, a message and confirm. */
function Editor(props: { initial: TimeOfDay; title: string; blocked: (t: TimeOfDay) => boolean; step: number; onConfirm: (t: TimeOfDay) => void }) {
  const t = useMessages().timeField
  const [draft, setDraft] = useState(props.initial)
  const hoursRef = useRef<HTMLInputElement>(null)
  const messageId = useId()
  const titleId = useId()
  const isBlocked = props.blocked(draft)
  useEffect(() => {
    hoursRef.current?.focus()
    hoursRef.current?.select()
  }, [])
  const confirm = () => {
    if (!props.blocked(draft)) props.onConfirm(draft)
  }
  return (
    <div className="fk-time-field__editor" role="group" aria-labelledby={titleId}>
      <Heading slot="title" id={titleId} className="fk-time-field__title">
        {props.title}
      </Heading>
      <div className="fk-time-field__segments">
        <Segment name="hours" label={t.hours} value={draft.hours} step={1} inputRef={hoursRef} onValue={(hours) => setDraft((d) => ({ ...d, hours }))} onConfirm={confirm} />
        <span className="fk-time-field__colon" aria-hidden="true">
          :
        </span>
        <Segment name="minutes" label={t.minutes} value={draft.minutes} step={props.step} onValue={(minutes) => setDraft((d) => ({ ...d, minutes }))} onConfirm={confirm} />
      </div>
      <p id={messageId} className="fk-time-field__message" aria-live="polite">
        {isBlocked ? t.future : null}
      </p>
      <Button variant="primary" disabled={isBlocked} focusableWhenDisabled aria-describedby={isBlocked ? messageId : undefined} onPress={confirm}>
        {t.confirm}
      </Button>
    </div>
  )
}

/** A time of day (24 h) edited in a small popover and confirmed (spec: wave-2/time-field.md). */
export function TimeField(props: TimeFieldProps) {
  const t = useMessages().timeField
  const [open, setOpen] = useState(false)
  const base = useId()
  const labelId = `${base}-label`
  const textId = `${base}-text`
  const hintId = props.hint != null && !props.errorText ? `${base}-hint` : undefined
  const errorId = props.errorText ? `${base}-error` : undefined
  const invalid = !!props.isInvalid || !!props.errorText

  const blocked = (draft: TimeOfDay) => {
    if (!props.disallowFuture || !props.referenceDate) return false
    const now = new Date()
    if (!isSameDay(props.referenceDate, now)) return false
    return draft.hours * 60 + draft.minutes > now.getHours() * 60 + now.getMinutes()
  }

  return (
    <div className={cx('fk-time-field', props.className)} data-invalid={invalid || undefined}>
      <FieldLine kind="label" id={labelId}>
        {props.label}
      </FieldLine>
      {hintId ? (
        <FieldLine kind="hint" id={hintId}>
          {props.hint}
        </FieldLine>
      ) : null}
      <DialogTrigger isOpen={open} onOpenChange={setOpen}>
        <AriaButton
          className="fk-fb-trigger"
          isDisabled={props.disabled}
          aria-labelledby={`${labelId} ${textId}`}
          aria-describedby={joinIds(hintId, errorId)}
          data-invalid={invalid || undefined}
        >
          <span className="fk-fb-trigger__glyph" aria-hidden="true">
            <Clock />
          </span>
          <span id={textId} className="fk-fb-trigger__text" data-placeholder={props.value ? undefined : true}>
            {props.value ? formatTimeOfDay(props.value) : (props.placeholder ?? t.placeholder)}
          </span>
        </AriaButton>
        <FloatSurface labelledBy={labelId}>
          <Editor
            initial={props.value ?? { hours: 0, minutes: 0 }}
            title={props.label}
            blocked={blocked}
            step={Math.max(1, props.minuteStep ?? 1)}
            onConfirm={(time) => {
              props.onChange(time)
              setOpen(false)
            }}
          />
        </FloatSurface>
      </DialogTrigger>
      {errorId ? (
        <FieldLine kind="error" id={errorId}>
          {props.errorText}
        </FieldLine>
      ) : null}
    </div>
  )
}
