// ConnectorInsertMenu: a small searchable list of step kinds, opened at the
// middle of a connector. Wide screens: popover anchored to the control that
// opened it; below 640 px: a bottom drawer.

import { useMemo, useState, type RefObject } from 'react'
import { Autocomplete, Dialog, Input, Label, ListBox, ListBoxItem, Popover, SearchField, Text, useFilter } from 'react-aria-components'
import { Drawer, useMediaQuery } from '@datatechsolutions/tympan'
import { useRenderCatalog } from '../catalog/RenderCatalog'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'

export interface InsertOption {
  kind: string
  label: string
}

export interface ConnectorInsertMenuLabels {
  title: string
  search: string
  placeholder: string
  empty: string
  results: string
}

export const connectorInsertMenuLabels = defineLabels<ConnectorInsertMenuLabels>('ConnectorInsertMenu', {
  en: { title: 'Insert a step', search: 'Step kind', placeholder: 'Search step kinds', empty: 'No step kind matches', results: '{count, plural, =0 {No results} one {# result} other {# results}}' },
  'pt-BR': { title: 'Inserir uma etapa', search: 'Tipo de etapa', placeholder: 'Buscar tipos de etapa', empty: 'Nenhum tipo de etapa corresponde', results: '{count, plural, =0 {Nenhum resultado} one {# resultado} other {# resultados}}' },
  es: { title: 'Insertar un paso', search: 'Tipo de paso', placeholder: 'Buscar tipos de paso', empty: 'Ningún tipo de paso coincide', results: '{count, plural, =0 {Sin resultados} one {# resultado} other {# resultados}}' },
})
export const defaultConnectorInsertMenuLabels = connectorInsertMenuLabels.bundles.en

export interface ConnectorInsertMenuProps {
  /** Canvas point the menu belongs to (the connector midpoint). */
  anchor: { x: number; y: number }
  /** Control the popover attaches to (and focus returns to). */
  triggerRef: RefObject<HTMLElement | null>
  options: readonly InsertOption[]
  onSelect: (kind: string) => void
  onClose: () => void
  labels?: Partial<ConnectorInsertMenuLabels>
}

function KindList({ options, onSelect, onClose, l }: { options: readonly InsertOption[]; onSelect: (k: string) => void; onClose: () => void; l: ConnectorInsertMenuLabels }) {
  const catalog = useRenderCatalog()
  const { locale } = useFlowLocale()
  const { contains } = useFilter({ sensitivity: 'base' })
  const [query, setQuery] = useState('')
  const all = useMemo(() => options.map((o) => ({ ...o, id: o.kind, text: catalog.entry(o.kind)?.label ?? o.label })), [options, catalog])
  const shown = useMemo(() => (query ? all.filter((o) => contains(o.text, query)) : all), [all, query, contains])
  return (
    <div className="ty-insert-menu__body">
      <Autocomplete inputValue={query} onInputChange={setQuery}>
        <SearchField className="ty-insert-menu__field" autoFocus aria-label={l.search}>
          <Label className="ty-insert-menu__label">{l.search}</Label>
          <Input className="ty-insert-menu__input" placeholder={l.placeholder} />
        </SearchField>
        <ListBox
          className="ty-insert-menu__list"
          aria-label={l.title}
          items={shown}
          renderEmptyState={() => <p className="ty-insert-menu__empty">{l.empty}</p>}
          onAction={(key) => {
            onSelect(String(key))
            onClose()
          }}
        >
          {(item) => {
            const Icon = catalog.icon(item.kind)
            return (
              <ListBoxItem id={item.id} textValue={item.text} className="ty-insert-menu__option">
                <span className="ty-insert-menu__bubble" data-tone={catalog.tone(item.kind)} aria-hidden="true">
                  <Icon focusable="false" />
                </span>
                <Text slot="label">{item.text}</Text>
              </ListBoxItem>
            )
          }}
        </ListBox>
      </Autocomplete>
      <p className="ty-visually-hidden" role="status">
        {fill(l.results, { count: shown.length }, locale)}
      </p>
    </div>
  )
}

export function ConnectorInsertMenu({ triggerRef, options, onSelect, onClose, labels }: ConnectorInsertMenuProps) {
  const l = useLabels(connectorInsertMenuLabels, labels)
  const narrow = !useMediaQuery('(min-width: 640px)', true)
  if (narrow) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()} title={l.title} placement="bottom">
        <KindList options={options} onSelect={onSelect} onClose={onClose} l={l} />
      </Drawer>
    )
  }
  return (
    <Popover isOpen onOpenChange={(open) => !open && onClose()} triggerRef={triggerRef} placement="bottom" offset={8} className="ty-insert-menu">
      <Dialog aria-label={l.title} className="ty-insert-menu__dialog">
        <KindList options={options} onSelect={onSelect} onClose={onClose} l={l} />
      </Dialog>
    </Popover>
  )
}
