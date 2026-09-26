// AddStepPicker: "Add after “…”". Lists only the steps whose input takes what
// the anchor step gives; type to narrow, ↑↓ to move, Enter to insert, Esc to
// close. A popover on wide screens, a bottom drawer below 640 px.

import { useMemo, useState, type RefObject } from 'react'
import { Autocomplete, Dialog, Heading, Input, ListBox, ListBoxItem, Popover, SearchField, Text, useFilter } from 'react-aria-components'
import { Search } from 'lucide-react'
import { Drawer, useMediaQuery } from '@fakhir/design-system'
import { fill, useFlowLocale } from '../internal/labels'
import { ShapeChip } from './ShapeChip'
import type { DataShape } from './shapes'
import type { ReadyStep } from './researchSteps'
import { useSteps } from './StepsContext'

export interface AddStepPickerProps {
  /** Heading: after a step, between two steps, or free. */
  title: string
  /** Search placeholder (defaults to the title). */
  placeholder?: string
  /** Shape arriving at the new step (undefined: anything). */
  arriving?: DataShape | null
  options: readonly ReadyStep[]
  triggerRef: RefObject<HTMLElement | null>
  onPick: (stepId: string) => void
  onClose: () => void
}

function PickerBody({ title, placeholder, arriving, options, onPick, onClose, headed }: Omit<AddStepPickerProps, 'triggerRef'> & { headed: boolean }) {
  const rt = useSteps()
  const w = rt.words
  const { locale } = useFlowLocale()
  const { contains } = useFilter({ sensitivity: 'base' })
  const [query, setQuery] = useState('')
  const shown = useMemo(() => (query ? options.filter((o) => contains(`${o.name} ${o.description}`, query)) : [...options]), [options, query, contains])
  return (
    <div className="fk-add-picker__body">
      {headed ? (
        <Heading slot="title" className="fk-visually-hidden">
          {title}
        </Heading>
      ) : null}
      <Autocomplete inputValue={query} onInputChange={setQuery} filter={() => true}>
        <SearchField className="fk-add-picker__field" autoFocus aria-label={title}>
          <Search className="fk-add-picker__glass" aria-hidden="true" focusable="false" />
          <Input className="fk-add-picker__input" placeholder={placeholder ?? title} />
        </SearchField>
        {arriving ? (
          <p className="fk-add-picker__only">
            <span>{w.pickerOnly}</span>
            <ShapeChip shapes={[arriving]} words={rt.shapes} />
          </p>
        ) : null}
        <ListBox
          className="fk-add-picker__list"
          aria-label={title}
          items={shown}
          renderEmptyState={() => <p className="fk-add-picker__empty">{arriving && !options.length ? fill(w.nothingAccepts, { shape: rt.shapes[arriving] }, locale) : fill(w.noMatch, { query }, locale)}</p>}
          onAction={(key) => {
            onPick(String(key))
            onClose()
          }}
        >
          {(item) => {
            const Icon = item.icon
            return (
              <ListBoxItem id={item.id} textValue={item.name} className="fk-add-picker__option">
                <span className="fk-add-picker__tile" aria-hidden="true">
                  <Icon focusable="false" />
                </span>
                <Text slot="label" className="fk-add-picker__name">
                  {item.name}
                </Text>
                <Text slot="description" className="fk-add-picker__about">
                  {item.description}
                </Text>
              </ListBoxItem>
            )
          }}
        </ListBox>
      </Autocomplete>
      <p className="fk-add-picker__keys" aria-hidden="true">
        {w.pickerKeys}
      </p>
      <p className="fk-visually-hidden" role="status">
        {fill(w.results, { count: shown.length }, locale)}
      </p>
    </div>
  )
}

export function AddStepPicker(props: AddStepPickerProps) {
  const narrow = !useMediaQuery('(min-width: 640px)', true)
  const { triggerRef, onClose, title } = props
  if (narrow) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()} title={title} placement="bottom">
        <PickerBody {...props} headed={false} />
      </Drawer>
    )
  }
  return (
    <Popover isOpen onOpenChange={(open) => !open && onClose()} triggerRef={triggerRef} placement="bottom start" offset={10} className="fk-add-picker">
      <Dialog className="fk-add-picker__dialog">
        <PickerBody {...props} headed />
      </Dialog>
    </Popover>
  )
}
