// VariableListEditor: a short ordered list of unique names (flow inputs,
// outputs, aggregated values). Rows can be renamed in place; a trailing field
// adds a name; a polite region says what was added or removed.

import { useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { Plus, X } from 'lucide-react'
import { Button, TextField } from '@fakhir/design-system'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'

export type VariableListTone = 'input' | 'output' | 'aggregate' | 'terminal' | 'neutral'

export interface VariableListEditorLabels {
  placeholder: string
  add: string
  addField: string
  remove: string
  rowField: string
  duplicate: string
  blank: string
  empty: string
  added: string
  removed: string
}

export const variableListEditorLabels = defineLabels<VariableListEditorLabels>('VariableListEditor', {
  en: {
    placeholder: 'New name',
    add: 'Add',
    addField: 'New name',
    remove: 'Remove {name}',
    rowField: 'Name {n, number}',
    duplicate: 'Already in the list',
    blank: 'Name is empty; it will be dropped on save',
    empty: 'No names yet.',
    added: '{name} added',
    removed: '{name} removed',
  },
  'pt-BR': {
    placeholder: 'Novo nome',
    add: 'Adicionar',
    addField: 'Novo nome',
    remove: 'Remover {name}',
    rowField: 'Nome {n, number}',
    duplicate: 'Já está na lista',
    blank: 'Nome vazio; será descartado ao salvar',
    empty: 'Nenhum nome ainda.',
    added: '{name} adicionado',
    removed: '{name} removido',
  },
  es: {
    placeholder: 'Nombre nuevo',
    add: 'Añadir',
    addField: 'Nombre nuevo',
    remove: 'Quitar {name}',
    rowField: 'Nombre {n, number}',
    duplicate: 'Ya está en la lista',
    blank: 'Nombre vacío; se descartará al guardar',
    empty: 'Todavía no hay nombres.',
    added: '{name} añadido',
    removed: '{name} quitado',
  },
})

export const defaultVariableListEditorLabels: VariableListEditorLabels = variableListEditorLabels.bundles.en

export interface VariableListEditorProps {
  value: string[]
  onChange: (names: string[]) => void
  label?: string
  placeholder?: string
  addLabel?: string
  tone?: VariableListTone
  numbered?: boolean
  editable?: boolean
  /** Maximum length; 0 means unlimited. */
  max?: number
  /** No add row (the list is only shown and pruned). */
  readOnly?: boolean
  labels?: Partial<VariableListEditorLabels>
}

/** Tone → categorical token name for the marker only (decorative). */
const MARKER_TONE: Record<VariableListTone, string> = {
  input: 'categorical-3',
  output: 'categorical-1',
  aggregate: 'categorical-8',
  terminal: 'categorical-6',
  neutral: 'neutral',
}

type Focusable = HTMLButtonElement | HTMLAnchorElement | null

/** What is wrong with row `i`, if anything: a blank name or a repeat of an earlier row. */
function rowProblem(names: readonly string[], i: number): 'blank' | 'duplicate' | null {
  const name = names[i] ?? ''
  if (!name.trim()) return 'blank'
  return names.indexOf(name) === i ? null : 'duplicate'
}

/** After removing row `gone` from a list that now has `left` rows: the index whose remove button takes focus, or -1 for the add field. */
function focusAfterRemoval(gone: number, left: number): number {
  if (gone < left) return gone
  return gone > 0 ? gone - 1 : -1
}

interface RowProps {
  index: number
  name: string
  names: readonly string[]
  numbered: boolean
  editable: boolean
  removable: boolean
  locale: string
  l: VariableListEditorLabels
  buttons: RefObject<Focusable[]>
  onRename: (index: number, name: string) => void
  onRemove: (index: number) => void
}

function NameRow({ index, name, names, numbered, editable, removable, locale, l, buttons, onRename, onRemove }: RowProps) {
  const problem = editable ? rowProblem(names, index) : null
  return (
    <li className="fk-var-list__row">
      <span className="fk-var-list__marker" aria-hidden={numbered ? undefined : true} data-numbered={numbered || undefined}>
        {numbered ? new Intl.NumberFormat(locale).format(index + 1) : ''}
      </span>
      {editable ? (
        <TextField
          className="fk-var-list__name-field"
          accessibleLabel={fill(l.rowField, { n: index + 1 }, locale)}
          value={name}
          onChange={(v) => onRename(index, v)}
          {...(problem ? { errorMessage: problem === 'blank' ? l.blank : l.duplicate } : {})}
        />
      ) : (
        <span className="fk-var-list__name fk-mono fk-ltr-text" dir="ltr">
          {name}
        </span>
      )}
      {removable && (
        <Button
          ref={(el) => {
            buttons.current[index] = el
          }}
          variant="quiet"
          size="compact"
          shape="circle"
          iconOnly
          accessibleLabel={fill(l.remove, { name }, locale)}
          leadingIcon={<X />}
          onPress={() => onRemove(index)}
        />
      )}
    </li>
  )
}

export function VariableListEditor(props: VariableListEditorProps) {
  const { value: names, onChange, label, tone = 'input', numbered = false, editable = false, max = 0, readOnly = false } = props
  const l = useLabels(variableListEditorLabels, props.labels)
  const { locale } = useFlowLocale()
  const titleId = useId()
  const [typed, setTyped] = useState('')
  const [complaint, setComplaint] = useState<string | null>(null)
  const [said, setSaid] = useState('')
  const field = useRef<HTMLInputElement>(null)
  const buttons = useRef<Focusable[]>([])
  const open = !readOnly && !(max > 0 && names.length >= max)

  const append = () => {
    const name = typed.trim()
    if (!name) return
    if (names.includes(name)) return setComplaint(l.duplicate)
    onChange([...names, name])
    setTyped('')
    setComplaint(null)
    setSaid(fill(l.added, { name }, locale))
    field.current?.focus()
  }

  const drop = (index: number) => {
    const rest = names.filter((_, i) => i !== index)
    onChange(rest)
    setSaid(fill(l.removed, { name: names[index]! }, locale))
    const next = focusAfterRemoval(index, rest.length)
    requestAnimationFrame(() => {
      const target = next >= 0 ? buttons.current[next] : null
      if (target?.isConnected) target.focus()
      else field.current?.focus()
    })
  }

  const rename = (index: number, name: string) => onChange(names.map((n, i) => (i === index ? name : n)))

  const enterAdds = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' || (e.target as HTMLElement).tagName !== 'INPUT') return
    e.preventDefault()
    append()
  }

  const rows = names.map((name, index) => (
    <NameRow key={index} index={index} name={name} names={names} numbered={numbered} editable={editable} removable={!readOnly} locale={locale} l={l} buttons={buttons} onRename={rename} onRemove={drop} />
  ))

  return (
    <div className="fk-var-list" data-tone={MARKER_TONE[tone]}>
      {label && (
        <span id={titleId} className="fk-var-list__label">
          {label}
        </span>
      )}
      {rows.length > 0 ? (
        <ul className="fk-var-list__rows" role="list" aria-labelledby={label ? titleId : undefined}>
          {rows}
        </ul>
      ) : (
        !open && <p className="fk-var-list__empty">{l.empty}</p>
      )}
      {open && (
        <div className="fk-var-list__add" onKeyDown={enterAdds}>
          <TextField
            ref={field}
            accessibleLabel={l.addField}
            placeholder={props.placeholder ?? l.placeholder}
            value={typed}
            onChange={(v) => {
              setTyped(v)
              setComplaint(null)
            }}
            {...(complaint ? { errorMessage: complaint } : {})}
          />
          <Button variant="secondary" leadingIcon={<Plus />} disabled={!typed.trim()} onPress={append}>
            {props.addLabel ?? l.add}
          </Button>
        </div>
      )}
      <p className="fk-visually-hidden" role="status" aria-live="polite">
        {said}
      </p>
    </div>
  )
}
