import type { CSSProperties } from 'react'
import { ToggleButton, ToggleButtonGroup, type Key } from 'react-aria-components'
import { cx } from '../../internal/cx'

/** Index into the categorical palette (`--ty-categorical-1` … `-8`), §2.3. */
export type CategoryMarker = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface CategoryItem {
  key: string
  /** Reported selection; defaults to `key`. */
  value?: string
  code: string
  name: string
  marker: CategoryMarker
  disabled?: boolean
}

export interface CategoryTabsProps {
  items: CategoryItem[]
  selected: string | null
  /** Receives the item's value (or key); null when `allowNone` clears the filter. */
  onSelect: (value: string | null) => void
  label: string
  allowNone?: boolean
  className?: string
}

const markerStyle = (marker: CategoryMarker) => ({ '--ty-category-marker': `var(--ty-categorical-${marker})` }) as CSSProperties

/** Name without its leading code ("PT Portugal" → "Portugal"); the full name when nothing is left. */
function nameWithoutCode(code: string, name: string): string {
  const trimmed = name.trim()
  const after = trimmed.slice(code.length)
  // Only a whole leading code counts: "PT Portugal" yes, "Brasil" for "BR" no.
  if (!trimmed.startsWith(code) || /^[\p{L}\p{N}]/u.test(after)) return trimmed
  return after.replace(/^[\s:·,-]+/, '') || trimmed
}

const reportedValue = (item: CategoryItem) => item.value ?? item.key

/**
 * Filter chooser as a single-choice group of toggle buttons (APG Radio Group
 * semantics through RAC ToggleButtonGroup), spec: wave-2/category-tabs.md.
 */
export function CategoryTabs({ items, selected, onSelect, label, allowNone = false, className }: CategoryTabsProps) {
  const change = (keys: Set<Key>) => {
    const next = [...keys][0]
    if (next != null) {
      if (String(next) !== selected) onSelect(String(next))
    }
    else if (allowNone) onSelect(null)
  }
  return (
    // Activation stays inside the row: an enclosing clickable card never sees it.
    <div className={cx('ty-category-tabs', className)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <ToggleButtonGroup
        aria-label={label}
        className="ty-category-tabs__row"
        selectionMode="single"
        disallowEmptySelection={!allowNone}
        selectedKeys={selected == null ? [] : [selected]}
        onSelectionChange={change}
      >
        {items.map((item) => (
          <ToggleButton key={item.key} id={reportedValue(item)} isDisabled={item.disabled} className="ty-category-tabs__item" style={markerStyle(item.marker)}>
            <span className="ty-category-tabs__marker" aria-hidden="true" />
            <strong className="ty-category-tabs__code">{item.code}</strong>{" "}
            <span className="ty-category-tabs__name">{nameWithoutCode(item.code, item.name)}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  )
}

export interface CategoryLabelProps {
  code: string
  /** Full name; becomes the accessible name. */
  name?: string
  marker: CategoryMarker
  size?: 'small' | 'medium'
  className?: string
}

/** Static colour marker plus code. */
export function CategoryLabel({ code, name, marker, size = 'medium', className }: CategoryLabelProps) {
  return (
    <span className={cx('ty-category-label', className)} data-size={size} style={markerStyle(marker)}>
      <span className="ty-category-tabs__marker" aria-hidden="true" />
      <span aria-hidden={name ? true : undefined}>{code}</span>
      {name ? <span className="ty-visually-hidden">{name}</span> : null}
    </span>
  )
}
