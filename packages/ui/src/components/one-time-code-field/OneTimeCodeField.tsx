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

/* ---------------------------------------------------------- characters -- */

const ALLOWED: Record<CodeCharacters, RegExp> = { digits: /^\p{Nd}$/u, alphanumeric: /^(?:\p{Nd}|[a-z])$/iu }

/**
 * Any script's decimal digit as its ASCII digit (codes are issued in ASCII).
 * Unicode decimal digits come in runs of ten starting at a zero, so the digit
 * is the distance to the start of its run.
 */
function westernDigit(glyph: string): string {
  if (/^[0-9]$/.test(glyph) || !/^\p{Nd}$/u.test(glyph)) return glyph
  const point = glyph.codePointAt(0)!
  let runStart = point
  while (point - runStart < 9 && /^\p{Nd}$/u.test(String.fromCodePoint(runStart - 1))) runStart--
  return String(point - runStart)
}

/** The accepted characters of a text, in order, digits in ASCII. */
const cleaned = (text: string, kind: CodeCharacters) => [...text].filter((g) => ALLOWED[kind].test(g)).map(westernDigit)

/* --------------------------------------------------------------- cells -- */

/** A code as one cell per box ('' when empty), and where focus should go after an edit. */
type Edit = { cells: string[]; focus: number }

const blank = (size: number) => Array.from({ length: size }, () => '')
const cellsOf = (code: string, size: number) => blank(size).map((_, k) => code[k] ?? '')

/** Writes characters from `at` onwards (a start at 0 replaces the whole code); focus the first gap. */
function write(cells: string[], at: number, glyphs: string[]): Edit {
  const out = at === 0 ? blank(cells.length) : cells.slice()
  glyphs.slice(0, cells.length - at).forEach((g, k) => (out[at + k] = g))
  const gap = out.indexOf('')
  return { cells: out, focus: gap < 0 ? cells.length - 1 : gap }
}

/** Backspace: clears this cell, or the previous one when this is already empty. */
function erase(cells: string[], at: number): Edit | null {
  const target = cells[at] ? at : at - 1
  if (target < 0) return null
  const out = cells.slice()
  out[target] = ''
  return { cells: out, focus: target }
}

/** What an input event added to a cell that held `before`. */
function added(before: string, now: string): string {
  if (before && now.startsWith(before)) return now.slice(before.length)
  return now.replace(before, '')
}

/* ----------------------------------------------------------- component -- */

/** One character per box, with paste and autofill (spec: wave-2/one-time-code-field.md). */
export function OneTimeCodeField(props: OneTimeCodeFieldProps) {
  const size = props.length ?? 6
  const kind = props.characters ?? 'digits'
  const off = props.disabled ?? false
  const copy = useMessages().oneTimeCode
  const forward = useLocale().direction === 'rtl' ? -1 : 1
  const faultId = useId()
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const [cells, setCells] = useState(() => cellsOf(props.value, size))

  // Follow the controlled value when the host changes it from outside.
  useEffect(() => {
    setCells((mine) => (mine.length === size && mine.join('') === props.value ? mine : cellsOf(props.value, size)))
  }, [props.value, size])

  useEffect(() => {
    if (props.autoFocus) refs.current[0]?.focus()
  }, [props.autoFocus])

  const focusCell = (k: number) => refs.current[Math.min(size - 1, Math.max(0, k))]?.focus()

  /** Applies an edit: state, host callbacks, haptics, focus. */
  const apply = (edit: Edit, feel: 'light' | 'none') => {
    if (feel !== 'none') requestHaptic(feel)
    setCells(edit.cells)
    const code = edit.cells.join('')
    props.onChange(code)
    if (edit.cells.every((c) => c !== '')) {
      requestHaptic('medium')
      props.onComplete?.(code)
    }
    focusCell(edit.focus)
  }

  const onInput = (k: number, now: string) => {
    const glyphs = cleaned(added(cells[k] ?? '', now), kind)
    if (glyphs.length === 0) return
    // Several characters at once (autofill) are handled like a paste from the start.
    if (glyphs.length > 1) return apply(write(cells, 0, glyphs), 'light')
    const next = cells.slice()
    next[k] = glyphs[0]!
    apply({ cells: next, focus: k < size - 1 ? k + 1 : k }, 'light')
  }

  const keys: Record<string, (k: number) => void> = {
    Backspace: (k) => {
      const edit = erase(cells, k)
      if (edit) apply(edit, 'none')
    },
    ArrowLeft: (k) => focusCell(k - forward),
    ArrowRight: (k) => focusCell(k + forward),
  }

  const onKeyDown = (k: number, event: KeyboardEvent<HTMLInputElement>) => {
    const act = keys[event.key]
    if (!act) return
    event.preventDefault()
    act(k)
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const glyphs = cleaned(event.clipboardData.getData('text'), kind)
    if (glyphs.length) apply(write(cells, 0, glyphs), 'light')
  }

  const naming = props.boxLabel ?? copy.box
  const fault = props.errorText

  return (
    <div className={cx('ty-otc', props.className)} data-invalid={fault ? true : undefined}>
      <Group className="ty-otc__group" aria-label={props.label ?? copy.label} aria-describedby={fault ? faultId : undefined} isDisabled={off} isInvalid={!!fault}>
        {cells.map((glyph, k) => (
          <Input
            key={k}
            ref={(node) => void (refs.current[k] = node)}
            className="ty-otc__box"
            value={glyph}
            aria-label={naming(k + 1, size)}
            aria-invalid={fault ? true : undefined}
            disabled={off}
            inputMode={kind === 'digits' ? 'numeric' : 'text'}
            autoComplete={k === 0 ? 'one-time-code' : 'off'}
            autoCapitalize="off"
            spellCheck={false}
            onFocus={(event) => event.target.select()}
            onChange={(event) => onInput(k, event.target.value)}
            onKeyDown={(event) => onKeyDown(k, event)}
            onPaste={onPaste}
          />
        ))}
      </Group>
      {fault ? (
        <p id={faultId} className="ty-otc__error" role="alert">
          {fault}
        </p>
      ) : null}
    </div>
  )
}
