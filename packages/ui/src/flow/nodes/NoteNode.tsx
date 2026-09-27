// NoteNode: a free-text annotation on the canvas. It never takes part in
// execution or connections (no ports). Edits are written back through
// onTextChange, one call per editing session.

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { TextArea, TextField } from 'react-aria-components'
import { StickyNote } from 'lucide-react'
import { defineLabels, fill, useLabels } from '../internal/labels'

/** Note tones: five categorical tones of design direction §2.3 (decorative). */
export const NOTE_TONES = ['categorical-1', 'categorical-2', 'categorical-3', 'categorical-5', 'categorical-7'] as const
export type NoteTone = (typeof NOTE_TONES)[number]

export const NOTE_SIZE = { width: 240, height: 160 } as const

export interface NoteNodeLabels {
  note: string
  placeholder: string
  annotation: string
  editor: string
}

export const noteNodeLabels = defineLabels<NoteNodeLabels>('noteNode', {
  en: { note: 'note', placeholder: 'Double-click to write a note', annotation: 'annotation, not a step', editor: 'Note text' },
  'pt-BR': { note: 'nota', placeholder: 'Clique duas vezes para escrever uma nota', annotation: 'anotação, não é uma etapa', editor: 'Texto da nota' },
  es: { note: 'nota', placeholder: 'Haz doble clic para escribir una nota', annotation: 'anotación, no es un paso', editor: 'Texto de la nota' },
})
export const defaultNoteNodeLabels = noteNodeLabels.bundles.en

export interface NoteNodeProps {
  id: string
  text?: string
  tone?: string
  width?: number
  height?: number
  onTextChange: (text: string) => void
  placeholder?: string
  selected?: boolean
  locked?: boolean
  labels?: Partial<NoteNodeLabels>
}

/** First words of the text for the group name (by words, never by characters). */
function firstWords(text: string, count = 6): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, count).join(' ') + (words.length > count ? '…' : '')
}

export function NoteNode(props: NoteNodeProps) {
  const { text = '', tone, width = NOTE_SIZE.width, height = NOTE_SIZE.height, onTextChange, selected = false, locked = false } = props
  const l = useLabels(noteNodeLabels, props.labels)
  const placeholder = props.placeholder ?? l.placeholder
  const safeTone = (NOTE_TONES as readonly string[]).includes(tone ?? '') ? (tone as NoteTone) : NOTE_TONES[0]
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const rootRef = useRef<HTMLDivElement>(null)
  const descId = useId()

  const start = () => {
    if (locked) return
    setDraft(text)
    setEditing(true)
  }
  const finish = () => {
    setEditing(false)
    if (draft !== text) onTextChange(draft)
    requestAnimationFrame(() => rootRef.current?.focus())
  }
  const onRootKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing || e.target !== rootRef.current) return
    if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault()
      e.stopPropagation()
      start()
    }
  }
  const name = text.trim() ? `${l.note}: ${firstWords(text)}` : l.note

  return (
    <div
      ref={rootRef}
      className="ty-note-node"
      role="group"
      aria-label={name}
      aria-describedby={descId}
      tabIndex={0}
      data-ty-node-focus=""
      data-tone={safeTone}
      data-selected={selected ? 'true' : 'false'}
      data-locked={locked ? 'true' : 'false'}
      data-editing={editing ? 'true' : undefined}
      style={{ inlineSize: width, blockSize: height }}
      onDoubleClick={start}
      onKeyDown={onRootKey}
      onPointerUp={(e) => {
        // Touch: a tap on an already selected note starts editing.
        if (e.pointerType === 'touch' && selected && !editing) start()
      }}
    >
      <span id={descId} className="ty-visually-hidden">
        {l.annotation}
      </span>
      <StickyNote className="ty-note-node__icon" aria-hidden="true" focusable="false" />
      {editing ? (
        <TextField className="ty-note-node__field" value={draft} onChange={setDraft} aria-label={l.editor} autoFocus>
          <TextArea
            className="ty-note-node__editor"
            data-ty-no-drag=""
            onBlur={finish}
            onKeyDown={(e) => {
              // Typing in a note never reaches canvas shortcuts.
              e.stopPropagation()
              if (e.key === 'Escape') {
                e.preventDefault()
                finish()
              }
            }}
          />
        </TextField>
      ) : text.trim() ? (
        <p className="ty-note-node__text">{text}</p>
      ) : (
        <p className="ty-note-node__text" data-empty="true">
          {placeholder}
        </p>
      )}
    </div>
  )
}

/** Accessible name used by lists and outlines. */
export function noteName(text: string, labels = defaultNoteNodeLabels): string {
  return text.trim() ? fill('{note}: {words}', { note: labels.note, words: firstWords(text) }) : labels.note
}
