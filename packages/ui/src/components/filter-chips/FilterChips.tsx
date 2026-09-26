import { ListFilter, X } from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Button as AriaButton, Tag, TagGroup, TagList, useLocale, type Key } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { categoricalVar } from '../../internal/forms-a/marks'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'

/** `neutral`, `accent`, or a categorical token index 1 to 8 (a small marker only, §2.3). */
export type FilterChipTone = 'neutral' | 'accent' | number

export interface ActiveFilter {
  kind: string
  value: string
  label: string
  tone?: FilterChipTone
  /** Own leading glyph, in place of the kind icon. */
  icon?: ReactNode
}

export interface FilterChipsProps {
  filters: ActiveFilter[]
  onRemove?: (filter: ActiveFilter) => void
  onClearAll?: () => void
  /** Icon per filter kind; `default` (or a neutral filter glyph) for the rest. */
  kindIcons?: Record<string, IconComponent>
  removeLabel?: (label: string) => string
  groupLabel?: string
  className?: string
}

const keyOf = (f: ActiveFilter) => `${encodeURIComponent(f.kind)}.${encodeURIComponent(f.value)}`

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** First focusable element after `node` in document order. */
function focusableAfter(node: Element): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE))
  return all.find((el) => node.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING && !node.contains(el)) ?? null
}

function Marker({ tone }: { tone: FilterChipTone | undefined }) {
  if (typeof tone !== 'number') return null
  return <span className="fk-filter-chips__marker" aria-hidden="true" style={categoricalVar('--fk-filter-chip-marker', tone)} />
}

/** Removable chips of the filters in force (spec: wave-2/filter-chips.md). */
export function FilterChips({ filters, onRemove, onClearAll, kindIcons, removeLabel, groupLabel, className }: FilterChipsProps) {
  const copy = useMessages().filterChips
  const { locale } = useLocale()
  const root = useRef<HTMLDivElement>(null)
  const uid = useId()
  const anchor = useRef<HTMLSpanElement>(null)
  const [said, setSaid] = useState('')
  // After a removal: the key to focus next, or 'after' to leave the group.
  const pendingFocus = useRef<string | null>(null)

  const byKey = new Map(filters.map((f) => [keyOf(f), f]))
  const nameRemove = removeLabel ?? copy.remove

  const remove = (keys: Set<Key>) => {
    const order = filters.map(keyOf)
    const gone = [...keys].map(String)
    const firstIdx = Math.min(...gone.map((k) => order.indexOf(k)))
    const rest = order.filter((k) => !gone.includes(k))
    pendingFocus.current = rest[firstIdx] ?? rest[firstIdx - 1] ?? 'after'
    const removed = gone.map((k) => byKey.get(k)).filter((f): f is ActiveFilter => !!f)
    setSaid(new Intl.ListFormat(locale, { type: 'unit', style: 'long' }).format(removed.map((f) => copy.removed(f.label))))
    removed.forEach((f) => onRemove?.(f))
  }

  useLayoutEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    if (target === 'after') {
      if (anchor.current) focusableAfter(anchor.current)?.focus()
      return
    }
    const row = root.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(target)}"]`)
    row?.focus()
  })

  const live = (
    <span ref={anchor} className="fk-visually-hidden" role="status" aria-live="polite">
      {said}
    </span>
  )
  if (filters.length === 0) return said ? live : null

  return (
    <div ref={root} className={cx('fk-filter-chips', className)}>
      <TagGroup aria-label={groupLabel ?? copy.group} onRemove={onRemove ? remove : undefined} className="fk-filter-chips__group">
        <TagList className="fk-filter-chips__list">
          {filters.map((f) => {
            const Icon = kindIcons?.[f.kind] ?? kindIcons?.default ?? ListFilter
            const k = keyOf(f)
            return (
              <Tag key={k} id={k} data-key={k} textValue={f.label} className="fk-filter-chips__chip" data-tone={typeof f.tone === 'number' ? 'category' : (f.tone ?? 'neutral')}>
                {f.icon ? (
                  <span className="fk-filter-chips__icon" aria-hidden="true">
                    {f.icon}
                  </span>
                ) : (
                  <Icon className="fk-filter-chips__icon" data-kind-icon={kindIcons?.[f.kind] ? f.kind : 'default'} aria-hidden="true" focusable="false" />
                )}
                <Marker tone={f.tone} />
                <span className="fk-filter-chips__text">{f.label}</span>
                {onRemove ? (
                  <AriaButton
                    slot="remove"
                    id={`${uid}-x-${k}`}
                    // Self-reference: the name is exactly the remove label, not joined with the row's.
                    aria-labelledby={`${uid}-x-${k}`}
                    className="fk-filter-chips__remove"
                    aria-label={nameRemove(f.label)}
                  >
                    <X aria-hidden="true" focusable="false" />
                  </AriaButton>
                ) : null}
              </Tag>
            )
          })}
        </TagList>
      </TagGroup>
      {onClearAll && filters.length >= 2 ? (
        <AriaButton className="fk-filter-chips__clear-all" onPress={onClearAll}>
          {copy.clearAll}
        </AriaButton>
      ) : null}
      {live}
    </div>
  )
}
