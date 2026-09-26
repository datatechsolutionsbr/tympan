// VariableListEditor: an ordered list of unique names (flow inputs, outputs,
// aggregated values) edited in place. The rules and the typing state live in
// nameListModel.ts; this file only lays out three parts: the caption, the
// list of slots and the entry for a new name, plus one polite region.

import { Fragment, useId, useReducer, useRef, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { Plus, X } from 'lucide-react'
import { Button, TextField } from '@datatechsolutions/tympan'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { admit, EMPTY_ENTRY, focusTargetAfter, issueAt, nameListStep, replaceAt, withoutAt } from './nameListModel'

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

/** Marker colour per role (decorative; the name carries the meaning). */
const ROLE_SWATCH: Readonly<Record<VariableListTone, string>> = {
  neutral: 'neutral',
  input: 'categorical-3',
  aggregate: 'categorical-8',
  output: 'categorical-1',
  terminal: 'categorical-6',
}

type RemoveHandle = HTMLButtonElement | HTMLAnchorElement | null

interface SlotContext {
  list: readonly string[]
  numbered: boolean
  editable: boolean
  canRemove: boolean
  locale: string
  text: VariableListEditorLabels
  keepHandle: (position: number, el: RemoveHandle) => void
  rename: (position: number, name: string) => void
  remove: (position: number) => void
}

function slotMarker(ctx: SlotContext, position: number): ReactNode {
  return (
    <span className="ty-var-list__marker" aria-hidden={ctx.numbered ? undefined : true} data-numbered={ctx.numbered || undefined}>
      {ctx.numbered ? new Intl.NumberFormat(ctx.locale).format(position + 1) : ''}
    </span>
  )
}

function slotName(ctx: SlotContext, position: number, name: string): ReactNode {
  if (!ctx.editable) {
    return (
      <span className="ty-var-list__name ty-mono ty-ltr-text" dir="ltr">
        {name}
      </span>
    )
  }
  const issue = issueAt(ctx.list, position)
  const message = issue === 'blank' ? ctx.text.blank : issue === 'duplicate' ? ctx.text.duplicate : null
  return (
    <TextField
      className="ty-var-list__name-field"
      accessibleLabel={fill(ctx.text.rowField, { n: position + 1 }, ctx.locale)}
      value={name}
      onChange={(v) => ctx.rename(position, v)}
      {...(message ? { errorMessage: message } : {})}
    />
  )
}

function slotRemove(ctx: SlotContext, position: number, name: string): ReactNode {
  if (!ctx.canRemove) return null
  return (
    <Button
      ref={(el) => ctx.keepHandle(position, el)}
      variant="quiet"
      size="compact"
      shape="circle"
      iconOnly
      accessibleLabel={fill(ctx.text.remove, { name }, ctx.locale)}
      leadingIcon={<X />}
      onPress={() => ctx.remove(position)}
    />
  )
}

/** The parts of one row, in order; each is a function of the row. */
const SLOT_PARTS = [
  (ctx: SlotContext, position: number) => slotMarker(ctx, position),
  (ctx: SlotContext, position: number, name: string) => slotName(ctx, position, name),
  (ctx: SlotContext, position: number, name: string) => slotRemove(ctx, position, name),
] as const

interface EntryProps {
  draft: string
  complaint: string | null
  fieldLabel: string
  placeholder: string
  buttonText: string
  fieldRef: Ref<HTMLInputElement>
  onType: (text: string) => void
  onCommit: () => void
}

function NewNameEntry(p: EntryProps) {
  const commitOnEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault()
      p.onCommit()
    }
  }
  return (
    <div className="ty-var-list__add" onKeyDown={commitOnEnter}>
      <TextField ref={p.fieldRef} accessibleLabel={p.fieldLabel} placeholder={p.placeholder} value={p.draft} onChange={p.onType} {...(p.complaint ? { errorMessage: p.complaint } : {})} />
      <Button variant="secondary" leadingIcon={<Plus />} disabled={p.draft.trim() === ''} onPress={p.onCommit}>
        {p.buttonText}
      </Button>
    </div>
  )
}

export function VariableListEditor(props: VariableListEditorProps) {
  const text = useLabels(variableListEditorLabels, props.labels)
  const { locale } = useFlowLocale()
  const captionId = useId()
  const [entry, dispatch] = useReducer(nameListStep, EMPTY_ENTRY)
  const entryField = useRef<HTMLInputElement>(null)
  const handles = useRef(new Map<number, RemoveHandle>())

  const list = props.value
  const limit = props.max ?? 0
  const accepting = !props.readOnly && (limit <= 0 || list.length < limit)

  const commit = () => {
    const verdict = admit(list, entry.draft)
    if (verdict.kind === 'empty') return
    if (verdict.kind === 'taken') {
      dispatch({ type: 'refused' })
      return
    }
    props.onChange(verdict.next)
    dispatch({ type: 'accepted', name: verdict.name })
    entryField.current?.focus()
  }

  const ctx: SlotContext = {
    list,
    numbered: props.numbered ?? false,
    editable: props.editable ?? false,
    canRemove: !props.readOnly,
    locale,
    text,
    keepHandle: (position, el) => {
      if (el) handles.current.set(position, el)
      else handles.current.delete(position)
    },
    rename: (position, name) => props.onChange(replaceAt(list, position, name)),
    remove: (position) => {
      const rest = withoutAt(list, position)
      props.onChange(rest)
      dispatch({ type: 'dropped', name: list[position]! })
      const target = focusTargetAfter(position, rest.length)
      requestAnimationFrame(() => {
        const handle = target >= 0 ? handles.current.get(target) : null
        ;(handle?.isConnected ? handle : entryField.current)?.focus()
      })
    },
  }

  const spoken = entry.spoken ? fill(entry.spoken.kind === 'added' ? text.added : text.removed, { name: entry.spoken.name }, locale) : ''
  const caption = props.label ? (
    <span id={captionId} className="ty-var-list__label">
      {props.label}
    </span>
  ) : null

  let listing: ReactNode = null
  if (list.length) {
    listing = (
      <ul className="ty-var-list__rows" role="list" aria-labelledby={props.label ? captionId : undefined}>
        {list.map((name, position) => (
          <li key={position} className="ty-var-list__row">
            {SLOT_PARTS.map((part, i) => (
              <Fragment key={i}>{part(ctx, position, name)}</Fragment>
            ))}
          </li>
        ))}
      </ul>
    )
  } else if (!accepting) {
    listing = <p className="ty-var-list__empty">{text.empty}</p>
  }

  return (
    <div className="ty-var-list" data-tone={ROLE_SWATCH[props.tone ?? 'input']}>
      {caption}
      {listing}
      {accepting ? (
        <NewNameEntry
          draft={entry.draft}
          complaint={entry.complaint ? text.duplicate : null}
          fieldLabel={text.addField}
          placeholder={props.placeholder ?? text.placeholder}
          buttonText={props.addLabel ?? text.add}
          fieldRef={entryField}
          onType={(t) => dispatch({ type: 'typed', text: t })}
          onCommit={commit}
        />
      ) : null}
      <p className="ty-visually-hidden" role="status" aria-live="polite">
        {spoken}
      </p>
    </div>
  )
}
