import { ChevronDown } from 'lucide-react'
import { createElement, useMemo, type KeyboardEvent, type ReactNode } from 'react'
import { Button, Disclosure, DisclosureGroup, DisclosurePanel } from 'react-aria-components'
import { cx } from '../../internal/cx'

export interface DisclosureListGroup<T, M = unknown> {
  key: string
  header: ReactNode
  items: T[]
  meta?: M
}

export interface GroupedDisclosureListProps<T, M = unknown> {
  groups: DisclosureListGroup<T, M>[]
  renderItem: (item: T, group: DisclosureListGroup<T, M>) => ReactNode
  getItemKey: (item: T) => string
  collapsedKeys?: string[]
  defaultCollapsedKeys?: string[]
  onCollapsedChange?: (keys: string[]) => void
  headingLevel?: 2 | 3 | 4 | 5 | 6
  className?: string
}

const HEADER_SELECTOR = '.fk-grouped-list__trigger'

/** Up/Down move between group headers, Home/End to the first and last (APG accordion, optional keys). */
function moveBetweenHeaders(event: KeyboardEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement
  if (!target.matches(HEADER_SELECTOR)) return
  const headers = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(HEADER_SELECTOR))
  const at = headers.indexOf(target)
  const jumps: Record<string, number | undefined> = {
    ArrowDown: (at + 1) % headers.length,
    ArrowUp: (at - 1 + headers.length) % headers.length,
    Home: 0,
    End: headers.length - 1,
  }
  const next = jumps[event.key]
  if (next === undefined) return
  event.preventDefault()
  headers[next]?.focus()
}

function GroupItems<T, M>({
  group,
  render,
  keyOf,
}: {
  group: DisclosureListGroup<T, M>
  render: GroupedDisclosureListProps<T, M>['renderItem']
  keyOf: (item: T) => string
}) {
  return (
    <ul className="fk-grouped-list__items">
      {group.items.map((item) => (
        <li key={keyOf(item)} className="fk-grouped-list__item">
          {render(item, group)}
        </li>
      ))}
    </ul>
  )
}

/**
 * Items in named groups whose bodies collapse independently
 * (spec: wave-2/grouped-disclosure-list.md).
 */
export function GroupedDisclosureList<T, M = unknown>(props: GroupedDisclosureListProps<T, M>) {
  const { groups, headingLevel = 3 } = props
  const allKeys = useMemo(() => groups.map((g) => g.key), [groups])

  // The list thinks in collapsed keys; RAC thinks in expanded keys.
  const invert = (keys: Iterable<string>) => {
    const out = new Set(keys)
    return allKeys.filter((k) => !out.has(k))
  }
  const expansion =
    props.collapsedKeys !== undefined
      ? { expandedKeys: invert(props.collapsedKeys) }
      : { defaultExpandedKeys: invert(props.defaultCollapsedKeys ?? []) }

  // Capture phase: RAC buttons stop keyboard events from bubbling.
  return (
    <div className={cx('fk-grouped-list', props.className)} onKeyDownCapture={moveBetweenHeaders}>
      <DisclosureGroup
        className="fk-grouped-list__groups"
        allowsMultipleExpanded
        onExpandedChange={(open) => props.onCollapsedChange?.(invert([...open].map(String)))}
        {...expansion}
      >
        {groups.map((group) => (
          <Disclosure key={group.key} id={group.key} className="fk-grouped-list__group">
            {({ isExpanded }) => (
              <>
                {createElement(
                  `h${headingLevel}`,
                  { className: 'fk-grouped-list__heading' },
                  <Button slot="trigger" className="fk-grouped-list__trigger">
                    <span className="fk-grouped-list__header">{group.header}</span>
                    <ChevronDown className="fk-icon fk-grouped-list__chevron" aria-hidden="true" focusable="false" />
                  </Button>,
                )}
                {/* Collapsed bodies are not rendered at all: out of the tree and the tab order. */}
                <DisclosurePanel className="fk-grouped-list__body">
                  {isExpanded ? <GroupItems group={group} render={props.renderItem} keyOf={props.getItemKey} /> : null}
                </DisclosurePanel>
              </>
            )}
          </Disclosure>
        ))}
      </DisclosureGroup>
    </div>
  )
}
