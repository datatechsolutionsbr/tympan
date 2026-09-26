// VariableListEditor: an ordered list of unique names edited inline (flow
// inputs, outputs, aggregated values). Additions and removals are announced.

import { useId, useRef, useState, type KeyboardEvent } from 'react'
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
const TONE_TOKEN: Record<VariableListTone, string> = {
  input: 'categorical-3',
  output: 'categorical-1',
  aggregate: 'categorical-8',
  terminal: 'categorical-6',
  neutral: 'neutral',
}

export function VariableListEditor(props: VariableListEditorProps) {
  const { value, onChange, label, tone = 'input', numbered = false, editable = false, max = 0, readOnly = false } = props
  const l = useLabels(variableListEditorLabels, props.labels)
  const { locale } = useFlowLocale()
  const labelId = useId()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState('')
  const addRef = useRef<HTMLInputElement>(null)
  const removeRefs = useRef<Array<HTMLButtonElement | HTMLAnchorElement | null>>([])
  const full = max > 0 && value.length >= max
  const canAdd = !readOnly && !full

  const add = () => {
    const name = draft.trim()
    if (!name) return
    if (value.includes(name)) {
      setError(l.duplicate)
      return
    }
    onChange([...value, name])
    setDraft('')
    setError(null)
    setLive(fill(l.added, { name }, locale))
    addRef.current?.focus()
  }

  const remove = (index: number) => {
    const name = value[index]!
    const next = value.filter((_, i) => i !== index)
    onChange(next)
    setLive(fill(l.removed, { name }, locale))
    // Focus: the row that takes this place, else the previous one, else the add field.
    requestAnimationFrame(() => {
      const target = removeRefs.current[index] && index < next.length ? removeRefs.current[index] : index > 0 ? removeRefs.current[index - 1] : null
      if (target && target.isConnected) target.focus()
      else addRef.current?.focus()
    })
  }

  const rename = (index: number, name: string) => onChange(value.map((v, i) => (i === index ? name : v)))

  const onAddKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div className="fk-var-list" data-tone={TONE_TOKEN[tone]}>
      {label ? (
        <span id={labelId} className="fk-var-list__label">
          {label}
        </span>
      ) : null}
      {value.length ? (
        <ul className="fk-var-list__rows" role="list" aria-labelledby={label ? labelId : undefined}>
          {value.map((name, i) => (
            <li key={i} className="fk-var-list__row">
              <span className="fk-var-list__marker" aria-hidden={!numbered || undefined} data-numbered={numbered || undefined}>
                {numbered ? new Intl.NumberFormat(locale).format(i + 1) : ''}
              </span>
              {editable ? (
                <TextField
                  className="fk-var-list__name-field"
                  accessibleLabel={fill(l.rowField, { n: i + 1 }, locale)}
                  value={name}
                  onChange={(v) => rename(i, v)}
                  {...(!name.trim() ? { errorMessage: l.blank } : value.indexOf(name) !== i ? { errorMessage: l.duplicate } : {})}
                />
              ) : (
                <span className="fk-var-list__name fk-mono fk-ltr-text" dir="ltr">
                  {name}
                </span>
              )}
              {readOnly ? null : (
                <Button
                  ref={(el) => {
                    removeRefs.current[i] = el
                  }}
                  variant="quiet"
                  size="compact"
                  shape="circle"
                  iconOnly
                  accessibleLabel={fill(l.remove, { name }, locale)}
                  leadingIcon={<X />}
                  onPress={() => remove(i)}
                />
              )}
            </li>
          ))}
        </ul>
      ) : !canAdd ? (
        <p className="fk-var-list__empty">{l.empty}</p>
      ) : null}
      {canAdd ? (
        <div className="fk-var-list__add" onKeyDown={onAddKey}>
          <TextField
            ref={addRef}
            accessibleLabel={l.addField}
            placeholder={props.placeholder ?? l.placeholder}
            value={draft}
            onChange={(v) => {
              setDraft(v)
              setError(null)
            }}
            {...(error ? { errorMessage: error } : {})}
          />
          <Button variant="secondary" leadingIcon={<Plus />} disabled={!draft.trim()} onPress={add}>
            {props.addLabel ?? l.add}
          </Button>
        </div>
      ) : null}
      <p className="fk-visually-hidden" role="status" aria-live="polite">
        {live}
      </p>
    </div>
  )
}
