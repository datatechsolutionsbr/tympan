import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Group, Input, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { requestHaptic } from '../../internal/haptics'
import { useMessages } from '../../internal/provider'

export type CodeCharacters = 'digits' | 'alphanumeric'

export interface OneTimeCodeFieldProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (code: string) => void
  characters?: CodeCharacters
  label?: string
  boxLabel?: (position: number, total: number) => string
  errorText?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

const ACCEPT: Record<CodeCharacters, RegExp> = { digits: /^\p{Nd}$/u, alphanumeric: /^(?:\p{Nd}|[a-z])$/iu }

/** Any script's decimal digit as its ASCII digit (codes are issued in ASCII). */
function asciiDigit(ch: string): string {
  if (!/^\p{Nd}$/u.test(ch) || /^[0-9]$/.test(ch)) return ch
  const cp = ch.codePointAt(0)!
  // Unicode decimal digits come in contiguous runs of ten starting at a zero.
  for (let zero = cp; zero > cp - 10; zero--) {
    if (!/^\p{Nd}$/u.test(String.fromCodePoint(zero - 1))) return String(cp - zero)
  }
  return String((cp - 0x30) % 10)
}

/** Keeps only accepted characters, in order, with digits normalised to ASCII. */
function sanitize(raw: string, kind: CodeCharacters): string[] {
  return Array.from(raw)
    .filter((ch) => ACCEPT[kind].test(ch))
    .map(asciiDigit)
}

/** Slot model: one entry per box, '' for an empty box. */
function toSlots(value: string, size: number): string[] {
  return Array.from({ length: size }, (_, i) => value[i] ?? '')
}

/** One character per box, with paste and autofill (spec: wave-2/one-time-code-field.md). */
export function OneTimeCodeField({
  value,
  onChange,
  onComplete,
  length = 6,
  characters = 'digits',
  label,
  boxLabel,
  errorText,
  disabled = false,
  autoFocus = false,
  className,
}: OneTimeCodeFieldProps) {
  const copy = useMessages().oneTimeCode
  const { direction } = useLocale()
  const ahead = direction === 'rtl' ? -1 : 1
  const errorId = useId()
  const boxes = useRef<Array<HTMLInputElement | null>>([])
  const [slots, setSlots] = useState(() => toSlots(value, length))

  // Follow the controlled value when the host changes it from outside.
  useEffect(() => {
    setSlots((cur) => (cur.join('') === value && cur.length === length ? cur : toSlots(value, length)))
  }, [value, length])

  useEffect(() => {
    if (autoFocus) boxes.current[0]?.focus()
  }, [autoFocus])

  const focusBox = (i: number) => boxes.current[Math.max(0, Math.min(length - 1, i))]?.focus()

  const commit = (next: string[]) => {
    setSlots(next)
    const code = next.join('')
    onChange(code)
    const full = next.every(Boolean)
    if (full) {
      requestHaptic('medium')
      onComplete?.(code)
    }
    return full
  }

  const fillFrom = (start: number, chars: string[]) => {
    if (!chars.length) return
    const next = start === 0 ? toSlots('', length) : [...slots]
    chars.slice(0, length - start).forEach((ch, k) => (next[start + k] = ch))
    requestHaptic('light')
    commit(next)
    const empty = next.findIndex((s) => !s)
    focusBox(empty === -1 ? length - 1 : empty)
  }

  const onType = (i: number, raw: string) => {
    const previous = slots[i] ?? ''
    const typed = previous && raw.startsWith(previous) ? raw.slice(previous.length) : raw.replace(previous, '')
    const chars = sanitize(typed, characters)
    if (!chars.length) return
    if (chars.length > 1) {
      // Autofill or a multi-character entry: treat as a paste from the start.
      fillFrom(0, chars)
      return
    }
    const next = [...slots]
    next[i] = chars[0]!
    requestHaptic('light')
    commit(next)
    if (i < length - 1) focusBox(i + 1)
  }

  const keyMap: Record<string, (i: number) => boolean> = {
    Backspace: (i) => {
      const next = [...slots]
      const target = next[i] ? i : i - 1
      if (target < 0) return true
      next[target] = ''
      commit(next)
      focusBox(target)
      return true
    },
    // Inline-axis keys follow the reading direction.
    ArrowLeft: (i) => (focusBox(i - ahead), true),
    ArrowRight: (i) => (focusBox(i + ahead), true),
  }

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    const handler = keyMap[e.key]
    if (handler && handler(i)) e.preventDefault()
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    fillFrom(0, sanitize(e.clipboardData.getData('text'), characters))
  }

  const nameOf = boxLabel ?? copy.box
  const invalid = Boolean(errorText)

  return (
    <div className={cx('fk-otc', className)} data-invalid={invalid || undefined}>
      <Group
        className="fk-otc__group"
        aria-label={label ?? copy.label}
        aria-describedby={invalid ? errorId : undefined}
        isDisabled={disabled}
        isInvalid={invalid}
      >
        {slots.map((ch, i) => (
          <Input
            key={i}
            ref={(el) => {
              boxes.current[i] = el
            }}
            className="fk-otc__box"
            value={ch}
            aria-label={nameOf(i + 1, length)}
            aria-invalid={invalid || undefined}
            disabled={disabled}
            inputMode={characters === 'digits' ? 'numeric' : 'text'}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            autoCapitalize="off"
            spellCheck={false}
            onChange={(e) => onType(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </Group>
      {invalid ? (
        <p id={errorId} className="fk-otc__error" role="alert">
          {errorText}
        </p>
      ) : null}
    </div>
  )
}
