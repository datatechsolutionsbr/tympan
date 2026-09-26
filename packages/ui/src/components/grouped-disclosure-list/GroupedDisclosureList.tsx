// GroupedDisclosureList (spec: wave-2/grouped-disclosure-list.md).
//
// Items in named sections whose bodies open and close independently. The
// public API speaks in collapsed keys (all open by default); React Aria's
// DisclosureGroup speaks in expanded keys; `complement` turns one into the other.
import { ChevronDown } from 'lucide-react'
import { useMemo, type KeyboardEvent, type ReactNode } from 'react'
import { Button, Disclosure, DisclosureGroup, DisclosurePanel } from 'react-aria-components'
import { cx } from '../../internal/cx'

export interface ItemSection<T, M = unknown> {
  key: string
  header: ReactNode
  items: T[]
  meta?: M
}

export interface GroupedDisclosureListProps<T, M = unknown> {
  groups: ItemSection<T, M>[]
  renderItem: (item: T, group: ItemSection<T, M>) => ReactNode
  getItemKey: (item: T) => string
  collapsedKeys?: string[]
  defaultCollapsedKeys?: string[]
  onCollapsedChange?: (keys: string[]) => void
  headingLevel?: 2 | 3 | 4 | 5 | 6
  className?: string
}

type Level = NonNullable<GroupedDisclosureListProps<unknown>['headingLevel']>
const HEADING_TAG = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const satisfies Record<Level, string>

const TOGGLE_ATTR = 'data-ty-section-toggle'

/** Where each optional accordion key sends focus, given the current index and the count. */
const HOPS: Record<string, (i: number, n: number) => number> = {
  ArrowDown: (i, n) => (i + 1) % n,
  ArrowUp: (i, n) => (i + n - 1) % n,
  Home: () => 0,
  End: (_i, n) => n - 1,
}

/** APG accordion's optional keys, handled in the capture phase (RAC buttons stop bubbling). */
function hopBetweenToggles(event: KeyboardEvent<HTMLElement>) {
  const hop = HOPS[event.key]
  const from = event.target as HTMLElement
  if (!hop || !from.hasAttribute(TOGGLE_ATTR)) return
  const toggles = [...event.currentTarget.querySelectorAll<HTMLElement>(`[${TOGGLE_ATTR}]`)]
  event.preventDefault()
  toggles[hop(toggles.indexOf(from), toggles.length)]?.focus()
}

function SectionBody<T, M>(props: { section: ItemSection<T, M>; draw: GroupedDisclosureListProps<T, M>['renderItem']; idOf: (item: T) => string }) {
  return (
    <ul className="ty-grouped-list__items">
      {props.section.items.map((entry) => (
        <li key={props.idOf(entry)} className="ty-grouped-list__item">
          {props.draw(entry, props.section)}
        </li>
      ))}
    </ul>
  )
}

function SectionHead({ level, children }: { level: Level; children: ReactNode }) {
  const Tag = HEADING_TAG[level]
  return (
    <Tag className="ty-grouped-list__heading">
      <Button slot="trigger" className="ty-grouped-list__trigger" {...{ [TOGGLE_ATTR]: '' }}>
        <span className="ty-grouped-list__header">{children}</span>
        <ChevronDown className="ty-icon ty-grouped-list__chevron" aria-hidden="true" focusable="false" />
      </Button>
    </Tag>
  )
}

export function GroupedDisclosureList<T, M = unknown>(props: GroupedDisclosureListProps<T, M>) {
  const every = useMemo(() => props.groups.map((section) => section.key), [props.groups])
  const complement = (closed: Iterable<string>) => {
    const outside = new Set(closed)
    return every.filter((key) => !outside.has(key))
  }
  const openness =
    props.collapsedKeys === undefined ? { defaultExpandedKeys: complement(props.defaultCollapsedKeys ?? []) } : { expandedKeys: complement(props.collapsedKeys) }
  const report = (open: Set<unknown>) => props.onCollapsedChange?.(complement(Array.from(open, String)))

  return (
    <div className={cx('ty-grouped-list', props.className)} onKeyDownCapture={hopBetweenToggles}>
      <DisclosureGroup className="ty-grouped-list__groups" allowsMultipleExpanded onExpandedChange={report} {...openness}>
        {props.groups.map((section) => (
          <Disclosure key={section.key} id={section.key} className="ty-grouped-list__group">
            {({ isExpanded }) => (
              <>
                <SectionHead level={props.headingLevel ?? 3}>{section.header}</SectionHead>
                {/* A closed body is not rendered: out of the tree and the tab order. */}
                <DisclosurePanel className="ty-grouped-list__body">
                  {isExpanded && <SectionBody section={section} draw={props.renderItem} idOf={props.getItemKey} />}
                </DisclosurePanel>
              </>
            )}
          </Disclosure>
        ))}
      </DisclosureGroup>
    </div>
  )
}
