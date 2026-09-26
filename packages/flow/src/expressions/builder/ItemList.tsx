// A list operand: numbered items, each drawn by the caller, with remove and
// add. After a removal focus lands on the item that took the removed one's
// place (its kind switch), or on "add item" when none did.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Tag } from '@fakhir/design-system'
import { fill } from '../../internal/labels'
import { groupName, SlotHeading, useBuilderEnv } from './shared'

/** Where focus should go after items change; resolved once the DOM has updated. */
function useFocusLanding(dependency: unknown) {
  const [target, setTarget] = useState<number | null>(null)
  const holders = useRef(new Map<number, HTMLElement>())
  const fallback = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (target === null) return
    const holder = holders.current.get(target)
    const radio = holder?.querySelector<HTMLInputElement>('input[type="radio"]:checked') ?? holder?.querySelector<HTMLInputElement>('input[type="radio"]')
    ;(radio ?? fallback.current)?.focus()
    setTarget(null)
  }, [target, dependency])
  const holderRef = (index: number) => (el: HTMLElement | null) => {
    if (el) holders.current.set(index, el)
    else holders.current.delete(index)
  }
  return { land: setTarget, holderRef, fallback }
}

export interface ItemListProps {
  slotKey: string
  items: unknown[]
  depth: number
  onItems: (items: unknown[]) => void
  /** Draws item `index`; `switchRef` must reach its kind switch. */
  drawItem: (args: { index: number; item: unknown; name: string; onItem: (v: unknown) => void; switchRef: (el: HTMLElement | null) => void }) => ReactNode
}

export function ItemList({ slotKey, items, depth, onItems, drawItem }: ItemListProps) {
  const { words, locale } = useBuilderEnv()
  const focus = useFocusLanding(items.length)
  const remove = (index: number) => {
    onItems(items.filter((_, j) => j !== index))
    focus.land(index < items.length - 1 ? index : -1)
  }
  const rows = items.map((item, index) => (
    <li key={index} className="fk-expr__item">
      <span className="fk-expr__item-number" aria-hidden="true">
        {index + 1}
      </span>
      <div className="fk-expr__item-body">
        {drawItem({
          index,
          item,
          name: fill(words.item, { n: index + 1 }),
          onItem: (v) => onItems(items.map((x, j) => (j === index ? v : x))),
          switchRef: focus.holderRef(index),
        })}
      </div>
      <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={fill(words.removeItem, { n: index + 1 })} leadingIcon={<Trash2 />} onPress={() => remove(index)} />
    </li>
  ))
  return (
    <div className="fk-expr__list" role="group" aria-label={groupName(words, slotKey, depth)}>
      <SlotHeading slotKey={slotKey} trailing={<Tag size="small">{fill(words.itemCount, { count: items.length }, locale)}</Tag>} />
      {rows.length ? <ol className="fk-expr__items">{rows}</ol> : null}
      <Button ref={focus.fallback} variant="secondary" size="compact" leadingIcon={<Plus />} onPress={() => onItems([...items, { value: null }])}>
        {words.addItem}
      </Button>
    </div>
  )
}
