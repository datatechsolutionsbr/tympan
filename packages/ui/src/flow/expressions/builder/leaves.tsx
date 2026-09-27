// Leaf editors of the expression builder: reference chips, literal text,
// plain parameters and raw JSON. None of them nests further.

import { useEffect, useReducer, useRef, useState } from 'react'
import { ToggleButton } from 'react-aria-components'
import { ListboxSelect, TextArea, TextField } from '../../../index'
import { fill } from '../../internal/labels'
import { prettyJson, readLiteral, vocabularyOf, writeLiteral, type OperandSlotSpec } from '../model'
import { useBuilderEnv } from './shared'

export function ReferencePicker({ current, offered, onPick }: { current: string; offered: readonly string[]; onPick: (ref: string) => void }) {
  const { words } = useBuilderEnv()
  const chips = offered.map((ref) => (
    <ToggleButton key={ref} className="ty-expr__chip" isSelected={ref === current} onChange={() => onPick(ref)}>
      <code dir="ltr">{ref}</code>
    </ToggleButton>
  ))
  return (
    <div className="ty-expr__reference">
      {chips.length ? (
        <div className="ty-expr__chips" role="group" aria-label={words.references}>
          {chips}
        </div>
      ) : null}
      <TextField label={words.referencePath} value={current} onChange={onPick} className="ty-expr__mono" />
    </div>
  )
}

/**
 * Text that mirrors a value without fighting the person typing: an outside
 * change rewrites the text, the text's own echo does not.
 */
function useMirroredText(value: unknown, print: (v: unknown) => string) {
  const [text, setText] = useState(() => print(value))
  const lastSent = useRef<unknown>(value)
  useEffect(() => {
    if (JSON.stringify(lastSent.current) !== JSON.stringify(value)) {
      lastSent.current = value
      setText(print(value))
    }
    // print is stable per caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return { text, setText, remember: (v: unknown) => (lastSent.current = v) }
}

/** Free text, read as structured data when it parses. */
export function LiteralText({ value, onValue }: { value: unknown; onValue: (v: unknown) => void }) {
  const { words } = useBuilderEnv()
  const mirror = useMirroredText(value, writeLiteral)
  return (
    <TextField
      label={words.literal}
      hint={words.literalHint}
      value={mirror.text}
      onChange={(typed) => {
        mirror.setText(typed)
        onValue(mirror.remember(readLiteral(typed)))
      }}
    />
  )
}

/** A plain parameter, or a friendly select when its vocabulary is known. */
export function ParameterField({ slot, value, onValue }: { slot: OperandSlotSpec; value: unknown; onValue: (v: unknown) => void }) {
  const { words } = useBuilderEnv()
  const vocabulary = vocabularyOf(slot)
  if (!vocabulary) {
    return <TextField label={slot.key} value={value == null ? '' : String(value)} onChange={(t) => onValue(readLiteral(t))} />
  }
  const options = vocabulary.map((w) => ({ value: w, label: words.vocabulary[w] ?? w }))
  return <ListboxSelect label={slot.key} value={typeof value === 'string' ? value : null} options={options} onChange={onValue} />
}

type RawState = { text: string; problem?: string }

/** JSON for operands the builder cannot shape; a broken text keeps the last good value. */
export function RawJson({ label, value, onValue }: { label: string; value: unknown; onValue: (v: unknown) => void }) {
  const { words } = useBuilderEnv()
  const [state, set] = useReducer((_: RawState, next: RawState) => next, value, (v): RawState => ({ text: prettyJson(v ?? {}) }))
  const change = (text: string) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (err) {
      set({ text, problem: fill(words.rawError, { detail: err instanceof Error ? err.message : String(err) }) })
      return
    }
    set({ text })
    onValue(parsed)
  }
  return <TextArea label={label} monospace rows={4} value={state.text} errorMessage={state.problem} onChange={change} />
}
