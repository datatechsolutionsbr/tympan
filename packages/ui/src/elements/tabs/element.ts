import { TyElement } from '../base.ts'
import { tabsDefinition } from './definition.ts'

/** One entry of the `tabs` JSON prop (the React TabItem, minus the icon component). */
interface TabItem {
  id: string
  label: string
  count?: number
  disabled?: boolean
}

/** A key made safe for the id of an aria reference (a space would split an idrefs list). */
const safe = (key: string) => key.replace(/[^a-zA-Z0-9_-]/g, '-')

/** The label/count signature each composed tab button last rendered. */
const rendered = new WeakMap<Element, string>()

/**
 * `<ty-tabs>`. The anatomy — rendered by the host framework or built from
 * plain HTML — is the shell (the root and the tab list); the element adds
 * what the declarative anatomy cannot express and the APG tabs behaviour
 * (spec: wave-1/tabs.md):
 *
 * - **Composition** — a native `<button role="tab">` per entry of the
 *   `tabs` JSON prop, composed into the list and kept in step with it
 *   (reusing nodes by key, so a recompose does not disturb focus). The
 *   count follows the label and joins the accessible name ("Runs 4").
 * - **Panels** — the default slot's children, keyed by `data-panel`, get
 *   the `tabpanel` role, an id the tab's `aria-controls` names, the tab's
 *   `aria-labelledby`, and the `ty-tabs__panel` class; only the selected
 *   panel shows (the rest stay mounted, `hidden` and `data-inert`, so their
 *   state survives a switch).
 * - **Selection** — controlled through `selected-key` (the element asks
 *   with `ty-selection-change`, the host flips the attribute) or
 *   uncontrolled from `default-selected-key`, falling back to the first
 *   enabled tab.
 * - **Keyboard** — one tab stop (roving tabindex on the focused, else the
 *   selected tab); the arrow keys move along the orientation axis, wrapping
 *   and skipping disabled tabs, Home and End jump, Left/Right follow the
 *   reading direction. Automatic activation selects on focus; manual needs
 *   Enter or Space (a native button press).
 *
 * Panels are the host's own children, which no host attribute reports, so a
 * MutationObserver re-runs the reconcile for panel changes; the pass only
 * writes differences, and settles after one extra run.
 */
export class TyTabsElement extends TyElement {
  static override definition = tabsDefinition

  /** Uncontrolled selection (controlled: the `selected-key` attribute). */
  #selected: string | undefined
  /** The tab holding DOM focus while the list has it (the roving tabindex). */
  #focused: string | undefined
  #observer: MutationObserver | null = null

  protected override connected(): void {
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKeydown)
    this.addEventListener('focusin', this.#onFocusIn)
    this.addEventListener('focusout', this.#onFocusOut)
    this.#observer = new MutationObserver(() => this.#reconcile())
    this.#observer.observe(this, { childList: true, subtree: true })
  }

  protected override disconnected(): void {
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('keydown', this.#onKeydown)
    this.removeEventListener('focusin', this.#onFocusIn)
    this.removeEventListener('focusout', this.#onFocusOut)
    this.#observer?.disconnect()
    this.#observer = null
  }

  override sync(): void {
    const active = document.activeElement
    const refocus = active instanceof HTMLElement ? this.#keyOfTab(active) : undefined
    super.sync()
    this.#reconcile()
    // Plain HTML re-renders the anatomy on every attribute change, which
    // rebuilds the composed tabs; give the focus back to the tab that held it.
    if (refocus && !this.contains(document.activeElement)) this.#tabButton(refocus)?.focus()
  }

  #items(): TabItem[] {
    const raw = this.getAttribute('tabs')
    if (!raw) return []
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('not an array')
      const items: TabItem[] = []
      for (const entry of parsed) {
        if (typeof entry !== 'object' || entry === null) continue
        const { id, label, count, disabled } = entry as Record<string, unknown>
        if (typeof id !== 'string' || !id || typeof label !== 'string') continue
        items.push({ id, label, count: typeof count === 'number' ? count : undefined, disabled: disabled === true })
      }
      return items
    } catch {
      console.warn('ty-tabs: `tabs` must be a JSON array of { id, label, count?, disabled? }.')
      return []
    }
  }

  #reconcile(): void {
    const root = this.anatomyRoot()
    if (!root) return
    const list = root.querySelector('.ty-tabs__list')
    if (!(list instanceof HTMLElement)) return
    const props = this.props
    const items = this.#items()
    const controlled = this.hasAttribute('selected-key')
    if (!controlled && this.#selected === undefined) {
      const wanted = props.defaultSelectedKey ? String(props.defaultSelectedKey) : undefined
      this.#selected = wanted && items.some((i) => i.id === wanted) ? wanted : items.find((i) => !i.disabled)?.id
    }
    let selected = controlled && props.selectedKey !== undefined ? String(props.selectedKey) : this.#selected
    if (selected !== undefined && !items.some((i) => i.id === selected)) {
      selected = items.find((i) => !i.disabled)?.id
      if (!controlled) this.#selected = selected
    }

    this.#compose(list, items)
    const buttons = this.#buttons(list)
    // Roving focus: the focused tab while the list has focus, else the
    // selected one; a disabled tab never takes the tab stop.
    const roving = this.#focused ?? selected
    const rovingKey = items.some((i) => i.id === roving && !i.disabled) ? roving : selected
    for (const button of buttons) {
      const key = button.dataset.tabKey!
      const item = items.find((i) => i.id === key)!
      button.setAttribute('aria-selected', key === selected ? 'true' : 'false')
      button.toggleAttribute('data-selected', key === selected)
      button.disabled = item.disabled === true
      button.toggleAttribute('data-disabled', item.disabled === true)
      button.tabIndex = key === rovingKey && item.disabled !== true ? 0 : -1
    }

    const panels = new Map<string, HTMLElement>()
    for (const child of Array.from(root.children)) {
      if (child instanceof HTMLElement && child.hasAttribute('data-panel')) panels.set(child.getAttribute('data-panel')!, child)
    }
    for (const [key, panel] of panels) {
      panel.classList.add('ty-tabs__panel')
      panel.setAttribute('role', 'tabpanel')
      if (!panel.id) panel.id = `${this.instanceId}-panel-${safe(key)}`
      const tab = buttons.find((b) => b.dataset.tabKey === key)
      if (tab) {
        panel.setAttribute('aria-labelledby', tab.id)
        tab.setAttribute('aria-controls', panel.id)
      }
      const shown = key === selected
      panel.hidden = !shown
      panel.toggleAttribute('data-inert', !shown)
      // Tab from the list lands in the selected panel (spec: it is focusable).
      if (shown) panel.setAttribute('tabindex', '0')
      else panel.removeAttribute('tabindex')
    }
    for (const button of buttons) {
      if (!panels.has(button.dataset.tabKey!)) button.removeAttribute('aria-controls')
    }
  }

  /** One button per item, reused by key and reordered to match; leftovers go. */
  #compose(list: HTMLElement, items: TabItem[]): void {
    const existing = new Map<string, HTMLButtonElement>()
    for (const child of Array.from(list.children)) {
      if (child instanceof HTMLButtonElement && child.dataset.tabKey !== undefined) existing.set(child.dataset.tabKey, child)
    }
    const wanted: HTMLButtonElement[] = []
    for (const item of items) {
      let button = existing.get(item.id)
      if (!button) {
        button = document.createElement('button')
        button.type = 'button'
        button.className = 'ty-tabs__tab'
        button.setAttribute('role', 'tab')
        button.dataset.tabKey = item.id
      }
      existing.delete(item.id)
      button.id = `${this.instanceId}-tab-${safe(item.id)}`
      this.#fillTab(button, item)
      wanted.push(button)
    }
    for (const leftover of existing.values()) leftover.remove()
    wanted.forEach((button, index) => {
      if (list.children[index] !== button) list.insertBefore(button, list.children[index] ?? null)
    })
  }

  /** The label, and the count after a separating space so it joins the accessible name. */
  #fillTab(button: HTMLButtonElement, item: TabItem): void {
    const counted = typeof item.count === 'number'
    const signature = `${item.label} ${counted ? item.count : ''}`
    if (rendered.get(button) === signature) return
    rendered.set(button, signature)
    const label = document.createElement('span')
    label.className = 'ty-tabs__label'
    label.textContent = item.label
    if (!counted) {
      button.replaceChildren(label)
      return
    }
    const count = document.createElement('span')
    count.className = 'ty-tabs__count'
    count.textContent = String(item.count)
    button.replaceChildren(label, document.createTextNode(' '), count)
  }

  #buttons(list?: HTMLElement | null): HTMLButtonElement[] {
    const scope = list ?? this.anatomyRoot()?.querySelector('.ty-tabs__list')
    if (!(scope instanceof HTMLElement)) return []
    return Array.from(scope.children).filter((c): c is HTMLButtonElement => c instanceof HTMLButtonElement && c.dataset.tabKey !== undefined)
  }

  #tabButton(key: string): HTMLButtonElement | undefined {
    return this.#buttons().find((b) => b.dataset.tabKey === key)
  }

  /** The tab key an element belongs to, when it is a tab of this list. */
  #keyOfTab(node: Element | null): string | undefined {
    const tab = node?.closest('.ty-tabs__tab')
    return tab instanceof HTMLElement && this.contains(tab) ? tab.dataset.tabKey : undefined
  }

  #rtl(): boolean {
    let node: HTMLElement | null = this
    while (node) {
      const dir = node.getAttribute('dir')
      if (dir) return dir.toLowerCase() === 'rtl'
      node = node.parentElement
    }
    return getComputedStyle(this).direction === 'rtl'
  }

  /** Select a tab the user activated; a no-op for the current or a disabled tab. */
  #select(key: string): void {
    const item = this.#items().find((i) => i.id === key)
    if (!item || item.disabled) return
    const current = this.hasAttribute('selected-key') ? String(this.props.selectedKey ?? '') : this.#selected
    if (key === current) return
    if (this.hasAttribute('selected-key')) {
      // Controlled: the host flips `selected-key`.
      this.emit('ty-selection-change', { key })
      return
    }
    this.#selected = key
    this.#reconcile()
    this.emit('ty-selection-change', { key })
  }

  #focusTab(key: string): void {
    this.#focused = key
    this.#reconcile()
    const button = this.#tabButton(key)
    button?.focus()
    // An overflowing list scrolls the tab into view instead of wrapping.
    button?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }

  #onClick = (event: Event): void => {
    const key = this.#keyOfTab(event.target as Element)
    if (key) this.#select(key)
  }

  #onKeydown = (event: KeyboardEvent): void => {
    const list = this.anatomyRoot()?.querySelector('.ty-tabs__list')
    if (!(list instanceof HTMLElement) || !list.contains(event.target as Node)) return
    const vertical = String(this.props.orientation) === 'vertical'
    const rtl = this.#rtl()
    let move: 'home' | 'end' | number | null = null
    switch (event.key) {
      case 'ArrowRight':
        if (!vertical) move = rtl ? -1 : 1
        break
      case 'ArrowLeft':
        if (!vertical) move = rtl ? 1 : -1
        break
      case 'ArrowDown':
        if (vertical) move = 1
        break
      case 'ArrowUp':
        if (vertical) move = -1
        break
      case 'Home':
        move = 'home'
        break
      case 'End':
        move = 'end'
        break
      default:
        return
    }
    if (move === null) return
    event.preventDefault()
    const enabled = this.#items().filter((i) => !i.disabled)
    if (!enabled.length) return
    const current = this.#keyOfTab(document.activeElement as Element) ?? this.#selected
    const index = Math.max(0, enabled.findIndex((i) => i.id === current))
    const next = move === 'home' ? enabled[0]! : move === 'end' ? enabled[enabled.length - 1]! : enabled[(index + move + enabled.length) % enabled.length]!
    this.#focusTab(next.id)
    if (String(this.props.activation) === 'automatic') this.#select(next.id)
  }

  #onFocusIn = (event: FocusEvent): void => {
    const key = this.#keyOfTab(event.target as Element)
    if (!key || key === this.#focused) return
    this.#focused = key
    this.#reconcile()
  }

  #onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null
    const list = this.anatomyRoot()?.querySelector('.ty-tabs__list')
    if (next && list instanceof HTMLElement && list.contains(next)) return
    if (this.#focused === undefined) return
    this.#focused = undefined
    this.#reconcile()
  }
}
