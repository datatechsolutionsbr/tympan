// CanvasNodeSearch: "find a node" as a popover with a search field and a
// filtered list (RAC Autocomplete + SearchField + ListBox, APG combobox-like
// virtual focus). Choosing a result calls onPick; the host reveals, selects
// and focuses that node.

import { useMemo, useState, type RefObject } from 'react'
import { Autocomplete, Dialog, Input, Label, ListBox, ListBoxItem, Popover, SearchField, Text, useFilter } from 'react-aria-components'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'

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

export const canvasNodeSearchLabels = defineLabels<CanvasNodeSearchLabels>('CanvasNodeSearch', {
  en: {
    title: 'Find a node',
    field: 'Node name',
    placeholder: 'Type a name or id',
    empty: 'No node matches',
    results: '{count, plural, =0 {No results} one {# result} other {# results}}',
  },
  'pt-BR': {
    title: 'Encontrar um nó',
    field: 'Nome do nó',
    placeholder: 'Digite um nome ou id',
    empty: 'Nenhum nó corresponde',
    results: '{count, plural, =0 {Nenhum resultado} one {# resultado} other {# resultados}}',
  },
  es: {
    title: 'Buscar un nodo',
    field: 'Nombre del nodo',
    placeholder: 'Escriba un nombre o id',
    empty: 'Ningún nodo coincide',
    results: '{count, plural, =0 {Sin resultados} one {# resultado} other {# resultados}}',
  },
})

export const defaultCanvasNodeSearchLabels: CanvasNodeSearchLabels = canvasNodeSearchLabels.bundles.en

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
  const l = useLabels(canvasNodeSearchLabels, labels)
  const { locale } = useFlowLocale()
  const { contains } = useFilter({ sensitivity: 'base' })
  const [query, setQuery] = useState('')
  const all = useMemo(() => nodes.map((n) => ({ ...n, text: [n.label, n.kindLabel, n.keywords, n.id].filter(Boolean).join(' ') })), [nodes])
  // Filtered here (not by Autocomplete) so the announced count is exact.
  const items = useMemo(() => (query ? all.filter((n) => contains(n.text, query)) : all), [all, query, contains])
  return (
    <Popover isOpen={isOpen} onOpenChange={onOpenChange} triggerRef={triggerRef} placement="top" className="fk-node-search" offset={8}>
      <Dialog aria-label={l.title} className="fk-node-search__dialog">
        <Autocomplete inputValue={query} onInputChange={setQuery}>
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
          {fill(l.results, { count: items.length }, locale)}
        </p>
      </Dialog>
    </Popover>
  )
}
