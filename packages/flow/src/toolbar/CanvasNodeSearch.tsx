// CanvasNodeSearch: "find a node" as a popover with a search field and a
// filtered list (RAC Autocomplete + SearchField + ListBox, APG combobox-like
// virtual focus). Choosing a result calls onPick; the host reveals, selects
// and focuses that node.

import { useMemo, type RefObject } from 'react'
import { Autocomplete, Dialog, Input, Label, ListBox, ListBoxItem, Popover, SearchField, Text, useFilter } from 'react-aria-components'
import { fill, useLabels } from '../internal/labels'

export interface SearchableNode {
  id: string
  label: string
  /** Spoken kind shown under the label ("assertion", "Compute"). */
  kindLabel?: string
  /** Extra text matched by the filter (ids, meta). */
  keywords?: string
}

export interface CanvasNodeSearchLabels {
  title: string
  field: string
  placeholder: string
  empty: string
  results: string
}

export const defaultCanvasNodeSearchLabels: CanvasNodeSearchLabels = {
  title: 'Find a node',
  field: 'Node name',
  placeholder: 'Type a name or id',
  empty: 'No node matches',
  results: '{count} results',
}

export interface CanvasNodeSearchProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  /** Element the popover is anchored to (the search tool). */
  triggerRef: RefObject<HTMLElement | null>
  nodes: readonly SearchableNode[]
  onPick: (id: string) => void
  labels?: Partial<CanvasNodeSearchLabels>
}

export function CanvasNodeSearch({ isOpen, onOpenChange, triggerRef, nodes, onPick, labels }: CanvasNodeSearchProps) {
  const l = useLabels(defaultCanvasNodeSearchLabels, labels)
  const { contains } = useFilter({ sensitivity: 'base' })
  const items = useMemo(() => nodes.map((n) => ({ ...n, text: [n.label, n.kindLabel, n.keywords, n.id].filter(Boolean).join(' ') })), [nodes])
  return (
    <Popover isOpen={isOpen} onOpenChange={onOpenChange} triggerRef={triggerRef} placement="top" className="fk-node-search" offset={8}>
      <Dialog aria-label={l.title} className="fk-node-search__dialog">
        <Autocomplete filter={contains}>
          <SearchField className="fk-node-search__field" aria-label={l.field} autoFocus>
            <Label className="fk-node-search__label">{l.field}</Label>
            <Input className="fk-node-search__input" placeholder={l.placeholder} />
          </SearchField>
          <ListBox
            className="fk-node-search__list"
            aria-label={l.title}
            items={items}
            selectionMode="single"
            renderEmptyState={() => <p className="fk-node-search__empty">{l.empty}</p>}
            onAction={(key) => {
              onPick(String(key))
              onOpenChange(false)
            }}
          >
            {(item) => (
              <ListBoxItem id={item.id} textValue={item.text} className="fk-node-search__option">
                <Text slot="label" className="fk-node-search__option-label">
                  {item.label}
                </Text>
                {item.kindLabel ? (
                  <Text slot="description" className="fk-node-search__option-kind">
                    {item.kindLabel}
                  </Text>
                ) : null}
              </ListBoxItem>
            )}
          </ListBox>
        </Autocomplete>
        <p className="fk-visually-hidden" role="status">
          {fill(l.results, { count: items.length })}
        </p>
      </Dialog>
    </Popover>
  )
}
