import { Check, X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { Button as AriaButton, Checkbox, CheckboxGroup, Input, Label, TextField } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { categoricalVar } from '../../internal/forms-a/marks'
import { useMessages } from '../../internal/provider'

export interface ChipItem {
  id: string
  name: string
  code?: string
  /** Categorical token index 1 to 8 (small marker). */
  marker?: number
  /** Created by the person; only these can be removed. */
  custom?: boolean
}

export interface ChipGroupStrings {
  selected: (count: number) => string
  selectAll: string
  clear: string
  empty: string
  loading: string
  addPlaceholder: string
  addLabel: string
  remove: (name: string) => string
}

export interface ChipGroupProps {
  items: ChipItem[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  allowCustom?: boolean
  onItemsChange?: (items: ChipItem[]) => void
  showSummary?: boolean
  loading?: boolean
  label: string
  strings?: Partial<ChipGroupStrings>
  disabled?: boolean
  className?: string
}

/**
 * Id derived from typed text: canonical composition, case-insensitive, runs
 * of white space as one dash. Combining marks are kept, since in many
 * scripts they distinguish words.
 */
export function chipIdFromText(text: string): string {
  return text.normalize('NFC').trim().toLowerCase().replace(/\s+/gu, '-')
}

interface Pending {
  items: ChipItem[]
  selected: string[]
}

/** Folds typed entries into the item list and the selection. */
function absorb(entries: string[], state: Pending): Pending {
  let { items, selected } = state
  for (const raw of entries) {
    const name = raw.trim()
    if (!name) continue
    const id = chipIdFromText(name)
    if (!items.some((it) => it.id === id)) items = [...items, { id, name, custom: true }]
    if (!selected.includes(id)) selected = [...selected, id]
  }
  return { items, selected }
}

function ChipFace({ item }: { item: ChipItem }) {
  return (
    <>
      <span className="fk-chip-group__tick" aria-hidden="true">
        <Check focusable="false" />
      </span>
      {item.marker ? <span className="fk-chip-group__marker" aria-hidden="true" style={categoricalVar('--fk-chip-marker', item.marker)} /> : null}
      {item.code ? <span className="fk-chip-group__code">{item.code}</span> : null}
      <span className="fk-chip-group__name">{item.name}</span>
    </>
  )
}

/** Multiple selection among chips, with bulk actions and custom entries (spec: wave-2/chip-group.md). */
export function ChipGroup(props: ChipGroupProps) {
  const base = useMessages().chipGroup
  const s: ChipGroupStrings = { ...base, ...props.strings }
  const [draft, setDraft] = useState('')
  const { items, selectedIds } = props

  const publish = (next: Pending) => {
    if (next.items !== items) props.onItemsChange?.(next.items)
    if (next.selected !== selectedIds) props.onSelectionChange(next.selected)
  }
  const commit = (text: string) => {
    publish(absorb(text.split(','), { items, selected: selectedIds }))
  }
  const onDraft = (value: string) => {
    const cut = value.lastIndexOf(',')
    if (cut === -1) return setDraft(value)
    commit(value.slice(0, cut))
    setDraft(value.slice(cut + 1))
  }
  const removeItem = (id: string) => {
    props.onItemsChange?.(items.filter((it) => it.id !== id))
    if (selectedIds.includes(id)) props.onSelectionChange(selectedIds.filter((x) => x !== id))
  }
  const onAddKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(draft)
      setDraft('')
    } else if (e.key === 'Backspace' && draft === '') {
      const last = [...items].reverse().find((it) => it.custom)
      if (last) removeItem(last.id)
    }
  }

  let body
  if (props.loading) body = <p className="fk-chip-group__note">{s.loading}</p>
  else if (!items.length && !props.allowCustom) body = <p className="fk-chip-group__note">{s.empty}</p>
  else
    body = (
      <div className="fk-chip-group__row">
        {items.map((item) => (
          <span key={item.id} className="fk-chip-group__slot" data-custom={item.custom || undefined}>
            <Checkbox value={item.id} className="fk-chip-group__chip">
              <ChipFace item={item} />
            </Checkbox>
            {item.custom ? (
              <AriaButton className="fk-chip-group__remove" aria-label={s.remove(item.name)} onPress={() => removeItem(item.id)}>
                <X aria-hidden="true" focusable="false" />
              </AriaButton>
            ) : null}
          </span>
        ))}
        {props.allowCustom ? (
          <TextField className="fk-chip-group__add" value={draft} onChange={onDraft} onBlur={() => (draft.trim() ? (commit(draft), setDraft('')) : undefined)} aria-label={s.addLabel}>
            <Input className="fk-chip-group__add-input" placeholder={s.addPlaceholder} onKeyDown={onAddKey} />
          </TextField>
        ) : null}
      </div>
    )

  return (
    <CheckboxGroup
      className={cx('fk-chip-group', props.className)}
      value={selectedIds}
      onChange={props.onSelectionChange}
      isDisabled={props.disabled}
      data-loading={props.loading || undefined}
    >
      <Label className="fk-chip-group__label">{props.label}</Label>
      {props.showSummary !== false && !props.loading ? (
        <div className="fk-chip-group__summary">
          <span className="fk-chip-group__count" role="status" aria-live="polite">
            {s.selected(selectedIds.length)}
          </span>
          <AriaButton className="fk-chip-group__bulk" onPress={() => props.onSelectionChange(items.map((it) => it.id))}>
            {s.selectAll}
          </AriaButton>
          <AriaButton className="fk-chip-group__bulk" onPress={() => props.onSelectionChange([])}>
            {s.clear}
          </AriaButton>
        </div>
      ) : null}
      {body}
    </CheckboxGroup>
  )
}
