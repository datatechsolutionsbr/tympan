import { SlidersHorizontal } from 'lucide-react'
import { useRef, useState, type FocusEvent, type ReactNode } from 'react'
import { Button as AriaButton, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { SearchInput } from '../../internal/forms-a/SearchInput'
import { useMediaQuery } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'
import { Button } from '../button/Button'
import { Drawer } from '../drawer/Drawer'
import { FilterChips, type ActiveFilter } from '../filter-chips/FilterChips'
import { ModalDialog } from '../modal-dialog/ModalDialog'

export interface SearchBarFilterDialog {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  activeCount?: number
  onClear?: () => void
  context?: { icon?: ReactNode; label: string; countText?: string }
  content: ReactNode
}

export interface SearchBarProps {
  query: string
  onQueryChange: (value: string) => void
  placeholder?: string
  /** Name of the search landmark (defaults to the placeholder wording). */
  label?: string
  filters?: ActiveFilter[]
  onRemoveFilter?: (filter: ActiveFilter) => void
  /** Host map from filter kind to category icon. */
  kindIcons?: Record<string, IconComponent>
  onClearAll?: () => void
  cancelStyle?: boolean
  onCancel?: () => void
  filterDialog?: SearchBarFilterDialog
  /** Content inside the end of the field. */
  end?: ReactNode
  /** Trailing slot (create button, density switch). */
  actions?: ReactNode
  bordered?: boolean
  className?: string
}

function FiltersPanel({ dialog, narrow }: { dialog: SearchBarFilterDialog; narrow: boolean }) {
  const copy = useMessages().searchBar
  const count = dialog.activeCount ?? 0
  const close = () => dialog.onOpenChange(false)
  const footer = (
    <>
      {dialog.onClear && count > 0 ? (
        <Button variant="quiet" onPress={dialog.onClear}>
          {copy.clear}
        </Button>
      ) : null}
      <Button variant="primary" onPress={close}>
        {copy.done}
      </Button>
    </>
  )
  const context = dialog.context ? (
    <p className="ty-search-bar__context">
      {dialog.context.icon ? <span aria-hidden="true">{dialog.context.icon}</span> : null}
      <span className="ty-search-bar__context-label">{dialog.context.label}</span>
      {dialog.context.countText ? <span className="ty-search-bar__context-count">{dialog.context.countText}</span> : null}
    </p>
  ) : null
  const title = dialog.title ?? copy.filtersTitle
  if (narrow) {
    return (
      <Drawer open={dialog.open} onOpenChange={dialog.onOpenChange} title={title} placement="bottom">
        {context}
        {dialog.content}
        <div className="ty-search-bar__drawer-actions">{footer}</div>
      </Drawer>
    )
  }
  return (
    <ModalDialog isOpen={dialog.open} onOpenChange={dialog.onOpenChange} title={title} actions={footer}>
      {context}
      {dialog.content}
    </ModalDialog>
  )
}

/** Search field, active filters, bulk clear and a filters dialog above a list (spec: wave-2/search-bar.md). */
export function SearchBar(props: SearchBarProps) {
  const copy = useMessages().searchBar
  const narrow = useMediaQuery('(max-width: 639.98px)')
  const { locale } = useLocale()
  const bar = useRef<HTMLDivElement>(null)
  const [focusInside, setFocusInside] = useState(false)
  const filters = props.filters ?? []
  const hasFilters = filters.length > 0
  const dirty = props.query.length > 0 || hasFilters
  const cancelShown = Boolean(props.cancelStyle && focusInside)
  const count = props.filterDialog?.activeCount ?? 0
  const placeholder = props.placeholder ?? (hasFilters ? copy.refinePlaceholder : copy.placeholder)

  // Cancel stays reachable while focus is anywhere inside the bar.
  const onBlurCapture = (e: FocusEvent) => {
    if (!bar.current?.contains(e.relatedTarget as Node | null)) setFocusInside(false)
  }

  const trailing: ReactNode[] = []
  if (cancelShown) {
    trailing.push(
      <AriaButton
        key="cancel"
        className="ty-search-bar__text-action"
        onPress={() => {
          props.onQueryChange('')
          props.onCancel?.()
          setFocusInside(false)
        }}
      >
        {copy.cancel}
      </AriaButton>,
    )
  } else if (dirty && props.onClearAll) {
    trailing.push(
      <AriaButton key="clear" className="ty-search-bar__text-action" onPress={props.onClearAll}>
        {copy.clearAll}
      </AriaButton>,
    )
  }
  if (props.filterDialog) {
    trailing.push(
      <Button
        key="filters"
        leadingIcon={<SlidersHorizontal />}
        aria-haspopup="dialog"
        aria-expanded={props.filterDialog.open}
        onPress={() => props.filterDialog!.onOpenChange(true)}
        className="ty-search-bar__filters"
      >
        <span aria-hidden="true">{copy.filters}</span>
        {count > 0 ? (
          <span className="ty-search-bar__count" aria-hidden="true">
            {new Intl.NumberFormat(locale).format(count)}
          </span>
        ) : null}
        <span className="ty-visually-hidden">{count > 0 ? copy.filtersActive(count) : copy.filters}</span>
      </Button>,
    )
  }

  return (
    <div
      ref={bar}
      role="search"
      aria-label={props.label ?? placeholder}
      className={cx('ty-search-bar', props.className)}
      data-bordered={props.bordered === false ? undefined : true}
      onFocusCapture={() => setFocusInside(true)}
      onBlurCapture={onBlurCapture}
    >
      <div className="ty-search-bar__main">
        <SearchInput
          className="ty-search-input ty-search-bar__field"
          value={props.query}
          onChange={props.onQueryChange}
          ariaLabel={placeholder}
          placeholder={placeholder}
          clearLabel={copy.clearSearch}
          end={props.end}
        />
        {trailing}
      </div>
      {hasFilters ? <FilterChips filters={filters} onRemove={props.onRemoveFilter} kindIcons={props.kindIcons} className="ty-search-bar__chips" /> : null}
      {props.actions ? <div className="ty-search-bar__actions">{props.actions}</div> : null}
      {props.filterDialog ? <FiltersPanel dialog={props.filterDialog} narrow={narrow} /> : null}
    </div>
  )
}
