import { TyElement } from '../base.ts'
import { actionMenuDefinition } from './definition.ts'
import { place, type Rect, type Size } from '../popover/model.ts'

/** Pixels kept between the surface and every viewport edge in context mode (ActionMenu.tsx's GUTTER). */
const GUTTER = 8
/** Gap between trigger and surface in trigger mode (ActionMenu.tsx's Popover offset). */
const TRIGGER_OFFSET = 8
/** Touch: a press held this long over the target is a context request (ActionMenu.tsx's LONG_PRESS_MS). */
const LONG_PRESS_MS = 500

const SVG = 'http://www.w3.org/2000/svg'

/** One actionable entry of the `items` JSON (ActionMenuItem: `icon` a text glyph, `iconPath` SVG path data). */
interface Item {
  type?: 'item'
  id: string
  label: string
  icon?: string
  /** SVG path data (24×24, subpaths separated by " | "); wins over `icon`. */
  iconPath?: string
  tone?: 'default' | 'danger'
  disabled?: boolean
  shortcut?: string
}
interface SeparatorEntry {
  type: 'separator'
}
interface SectionEntry {
  type: 'section'
  id: string
  title: string
  items: Item[]
}
type Entry = Item | SeparatorEntry | SectionEntry

/** A composed item row, for roving focus and activation. */
interface Rendered {
  id: string
  label: string
  disabled: boolean
  el: HTMLElement
}

/** Why the element asked to close; an outside press and Tab must not steal focus back. */
type CloseReason = 'escape' | 'action' | 'trigger' | 'outside' | 'tab'

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

function parseItems(raw: string): Entry[] {
  if (!raw.trim()) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Entry[]) : []
  } catch {
    console.warn('ty-action-menu: `items` is not valid JSON.')
    return []
  }
}

/**
 * An item's `iconPath` as the standard icon frame: one `<path>` per
 * " | "-separated subpath, the `d` always set as an attribute so the JSON
 * stays inert data (never parsed as markup).
 */
function iconSvg(iconPath: string): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('class', 'ty-icon')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  for (const d of iconPath.split(' | ')) {
    const path = document.createElementNS(SVG, 'path')
    path.setAttribute('d', d)
    svg.append(path)
  }
  return svg
}

/**
 * `<ty-action-menu>`. The host framework renders the anatomy (the built-in
 * trigger or the trigger slot, the hidden surface with its empty menu) from
 * the definition; the element adds what the anatomy cannot (spec:
 * wave-1/action-menu.md):
 *
 * - **Composition** — the item rows are data (`items` JSON): items (icon
 *   glyph, label, shortcut hint, danger tone, disabled), separators and
 *   named sections are composed into `.ty-action-menu__menu`, recomposed
 *   when the attribute changes or a re-render dropped them.
 * - **Opening** — trigger mode: the trigger (its own slotted control or the
 *   built-in ellipsis button) toggles, with ArrowDown/ArrowUp opening onto
 *   the first/last item. Context mode: a secondary click, Shift+F10, the
 *   ContextMenu key or a touch long press on the trigger slot's target opens
 *   at that point, clamped inside the viewport. Both only ask
 *   (`ty-open-change`); the host flips `open`.
 * - **Roving focus** — opening focuses the first enabled item;
 *   ArrowDown/ArrowUp move with wrapping, Home/End jump, a printable
 *   character moves to the next enabled item starting with it, all skipping
 *   disabled items (`aria-disabled`). Enter/Space activate (`ty-action`,
 *   then ask to close); Escape asks to close and focus returns to the
 *   origin (the trigger, or the element that received the context request);
 *   Tab and an outside press ask to close without stealing focus.
 * - **Placement** — trigger mode: below the trigger, aligned to its end,
 *   flipping and clamping through the shared placement model; context mode:
 *   the requested point clamped so the surface never overflows the
 *   viewport. Recomputed on resize and scroll while open.
 */
export class TyActionMenuElement extends TyElement {
  static override definition = actionMenuDefinition

  #rendered: Rendered[] = []
  #renderedKey: string | null = null
  #controller: AbortController | null = null
  #origin: HTMLElement | null = null
  #pendingFocus: 'first' | 'last' = 'first'
  #closeReason: CloseReason | null = null
  #point = { x: 0, y: 0 }
  #raf = 0
  #longPress: number | undefined
  /** Modality of the last interaction, for `data-focus-visible`. */
  #keyboard = true

  override sync(): void {
    super.sync()
    if (this.isConnected) this.#compose()
  }

  protected override connected(): void {
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKeydown)
    this.addEventListener('contextmenu', this.#onContextMenu)
    this.addEventListener('pointerdown', this.#onPointerDown)
    this.addEventListener('pointerup', this.#onPointerUp)
    this.addEventListener('pointercancel', this.#cancelLongPress)
    this.addEventListener('pointermove', this.#cancelLongPress)
    this.addEventListener('pointerover', this.#onPointerOver)
    this.addEventListener('pointerout', this.#onPointerOut)
    this.addEventListener('focusin', this.#onFocusIn)
    this.addEventListener('focusout', this.#onFocusOut)
    this.#reconcile()
  }

  protected override disconnected(): void {
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('keydown', this.#onKeydown)
    this.removeEventListener('contextmenu', this.#onContextMenu)
    this.removeEventListener('pointerdown', this.#onPointerDown)
    this.removeEventListener('pointerup', this.#onPointerUp)
    this.removeEventListener('pointercancel', this.#cancelLongPress)
    this.removeEventListener('pointermove', this.#cancelLongPress)
    this.removeEventListener('pointerover', this.#onPointerOver)
    this.removeEventListener('pointerout', this.#onPointerOut)
    this.removeEventListener('focusin', this.#onFocusIn)
    this.removeEventListener('focusout', this.#onFocusOut)
    this.#teardown()
  }

  protected override changed(): void {
    if (this.isConnected) this.#reconcile()
  }

  #reconcile(): void {
    if (!this.anatomyRoot()) return
    this.#compose()
    this.#wireTrigger()
    if (this.props.open) this.#activate()
    else this.#deactivate(true)
  }

  /** The toggle: the built-in trigger, else the trigger slot's first element (the context-mode target). */
  #trigger(): HTMLElement | null {
    const root = this.anatomyRoot()
    if (!root) return null
    const builtIn = root.querySelector('.ty-action-menu__trigger')
    if (builtIn instanceof HTMLElement) return builtIn
    for (const child of Array.from(root.children)) {
      if (child.classList.contains('ty-action-menu')) continue
      if (child instanceof HTMLElement) return child
    }
    return null
  }

  #surface(): HTMLElement | null {
    return this.querySelector('.ty-action-menu')
  }

  #menu(): HTMLElement | null {
    return this.querySelector('.ty-action-menu__menu')
  }

  /** The trigger reflects open state and controls the menu. */
  #wireTrigger(): void {
    const trigger = this.#trigger()
    if (!trigger) return
    trigger.setAttribute('aria-haspopup', 'menu')
    trigger.setAttribute('aria-expanded', this.props.open ? 'true' : 'false')
    const menu = this.#menu()
    if (menu?.id) trigger.setAttribute('aria-controls', menu.id)
  }

  /**
   * Compose the rows from the `items` JSON into the anatomy's empty menu.
   * The menu's children are all the element's (the anatomy renders none), so
   * it recomposes freely — but only when the JSON changed or a re-render
   * dropped the rows, so an open menu keeps its focused item.
   */
  #compose(): void {
    const menu = this.#menu()
    if (!menu) return
    const raw = this.getAttribute('items') ?? ''
    const entries = parseItems(raw)
    if (raw === this.#renderedKey && (menu.childElementCount > 0 || entries.length === 0)) return
    const id = this.instanceId
    const rendered: Rendered[] = []
    const nodes: HTMLElement[] = []
    for (const entry of entries) {
      if (entry.type === 'separator') {
        nodes.push(el('div', 'ty-action-menu__separator', { role: 'separator' }))
        continue
      }
      if (entry.type === 'section') {
        const section = el('div', 'ty-action-menu__section', { role: 'group', 'aria-labelledby': `${id}-section-${entry.id}` })
        const title = el('div', 'ty-action-menu__section-title', { id: `${id}-section-${entry.id}` })
        title.textContent = String(entry.title ?? '')
        section.append(title)
        for (const item of entry.items ?? []) section.append(this.#row(item, rendered))
        nodes.push(section)
        continue
      }
      nodes.push(this.#row(entry, rendered))
    }
    menu.replaceChildren(...nodes)
    this.#rendered = rendered
    this.#renderedKey = raw
  }

  /** One item row: role menuitem, tone and disabled as data/aria, the icon (SVG from `iconPath`, else the text glyph), label, shortcut hint. */
  #row(item: Item, rendered: Rendered[]): HTMLElement {
    const row = el('div', 'ty-action-menu__item', { role: 'menuitem', tabindex: '-1' })
    row.setAttribute('data-tone', item.tone ?? 'default')
    const disabled = Boolean(item.disabled)
    if (disabled) {
      row.setAttribute('aria-disabled', 'true')
      row.setAttribute('data-disabled', '')
    }
    if (item.iconPath) {
      const icon = el('span', 'ty-action-menu__icon', { 'aria-hidden': 'true' })
      icon.append(iconSvg(item.iconPath))
      row.append(icon)
    } else if (item.icon) {
      const icon = el('span', 'ty-action-menu__icon', { 'aria-hidden': 'true' })
      icon.textContent = item.icon
      row.append(icon)
    }
    const label = el('span', 'ty-action-menu__label')
    label.textContent = String(item.label ?? '')
    row.append(label)
    if (item.shortcut) {
      // Decorative: the shortcut must stay out of the item's accessible
      // name ("Rename", not "Rename F2").
      const shortcut = el('kbd', 'ty-action-menu__shortcut', { 'aria-hidden': 'true' })
      shortcut.textContent = item.shortcut
      row.append(shortcut)
    }
    rendered.push({ id: String(item.id ?? ''), label: String(item.label ?? ''), disabled, el: row })
    return row
  }

  #enabled(): Rendered[] {
    return this.#rendered.filter((r) => !r.disabled)
  }

  /** Ask the host to open (controlled); the focus target and origin are remembered for the frame after the flip. */
  #askOpen(focus: 'first' | 'last', origin: HTMLElement | null): void {
    if (this.props.open) return
    this.#pendingFocus = focus
    this.#origin = origin
    this.emit('ty-open-change', { open: true })
  }

  /** Ask the host to close; the reason decides whether focus returns to the origin. */
  #askClose(reason: CloseReason): void {
    if (!this.props.open) return
    this.#closeReason = reason
    this.emit('ty-open-change', { open: false })
  }

  /** A context request at a viewport point; an open menu re-anchors without asking again. */
  #askContext(point: { x: number; y: number }, origin?: HTMLElement | null): void {
    this.#point = point
    const active = document.activeElement
    this.#origin =
      origin ?? (active instanceof HTMLElement && this.contains(active) && !this.#surface()?.contains(active) ? active : this.#trigger())
    if (this.props.open && this.#controller) {
      this.#place()
      return
    }
    this.#pendingFocus = 'first'
    this.emit('ty-open-change', { open: true })
  }

  /** Activate an item: report it and ask to close; a disabled item does neither. */
  #choose(record: Rendered): void {
    if (record.disabled) return
    this.emit('ty-action', { id: record.id })
    this.#askClose('action')
  }

  #activate(): void {
    if (this.#controller) return
    const controller = new AbortController()
    this.#controller = controller
    if (!this.#origin) {
      const active = document.activeElement
      this.#origin = active instanceof HTMLElement && this.contains(active) && !this.#surface()?.contains(active) ? active : this.#trigger()
    }
    // A press that starts outside closes; one that starts inside does not.
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!this.contains(event.target as Node)) this.#askClose('outside')
      },
      { signal: controller.signal },
    )
    const reposition = () => this.#place()
    window.addEventListener('resize', reposition, { signal: controller.signal })
    window.addEventListener('scroll', reposition, { capture: true, passive: true, signal: controller.signal })
    // The anatomy may land a beat after the `open` attribute (a framework
    // commits children and host attributes separately), so placement and
    // focus wait a frame.
    this.#raf = requestAnimationFrame(() => {
      this.#raf = 0
      if (!this.isConnected || !this.props.open) return
      this.#compose()
      this.#place()
      const surface = this.#surface()
      if (surface) {
        surface.setAttribute('data-entering', '')
        surface.addEventListener('animationend', () => surface.removeAttribute('data-entering'), { once: true })
      }
      const enabled = this.#enabled()
      const pending = this.#pendingFocus
      this.#pendingFocus = 'first'
      if (!enabled.length) this.#menu()?.focus()
      else (pending === 'last' ? enabled[enabled.length - 1]! : enabled[0]!).el.focus()
    })
  }

  #deactivate(restoreFocus: boolean): void {
    if (!this.#controller) return
    this.#teardown()
    const reason = this.#closeReason
    this.#closeReason = null
    const origin = this.#origin
    this.#origin = null
    // Escape, an action and a trigger toggle return focus to the origin; an
    // outside press and Tab leave focus where it is going. The return waits
    // a frame: a framework keeps owning focus across the commit that closed
    // the menu (the modal's pattern).
    if (restoreFocus && origin?.isConnected && reason !== 'outside' && reason !== 'tab') {
      requestAnimationFrame(() => {
        if (origin.isConnected) origin.focus()
      })
    }
  }

  #teardown(): void {
    this.#controller?.abort()
    this.#controller = null
    if (this.#raf) cancelAnimationFrame(this.#raf)
    this.#raf = 0
    window.clearTimeout(this.#longPress)
    const surface = this.#surface()
    if (surface) {
      surface.removeAttribute('data-entering')
      surface.style.removeProperty('position')
      surface.style.removeProperty('left')
      surface.style.removeProperty('top')
    }
  }

  /** The context point: the controlled `position` attribute ("x,y"), else the last request's point. */
  #position(): { x: number; y: number } {
    const raw = this.getAttribute('position')
    if (raw) {
      const [x, y] = raw.split(',').map((part) => Number(part.trim()))
      if (Number.isFinite(x) && Number.isFinite(y)) return { x: x!, y: y! }
    }
    return this.#point
  }

  #place(): void {
    const surface = this.#surface()
    if (!surface || !this.props.open) return
    const size: Size = { width: surface.offsetWidth, height: surface.offsetHeight }
    const viewport: Size = { width: window.innerWidth, height: window.innerHeight }
    surface.style.position = 'fixed'
    if (this.props.mode === 'context') {
      const point = this.#position()
      // Clamped so the whole menu stays inside the viewport (clampToViewport in ActionMenu.tsx).
      surface.style.left = `${Math.round(Math.max(GUTTER, Math.min(point.x, viewport.width - size.width - GUTTER)))}px`
      surface.style.top = `${Math.round(Math.max(GUTTER, Math.min(point.y, viewport.height - size.height - GUTTER)))}px`
      return
    }
    const trigger = this.#trigger()
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const anchor: Rect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    const placed = place(anchor, size, viewport, 'bottom', 'end', TRIGGER_OFFSET)
    surface.style.left = `${Math.round(placed.x)}px`
    surface.style.top = `${Math.round(placed.y)}px`
    surface.dataset.side = placed.side
  }

  #step(delta: 1 | -1): void {
    const items = this.#enabled()
    if (!items.length) return
    const current = items.findIndex((r) => r.el === document.activeElement)
    const next = current === -1 ? (delta === 1 ? 0 : items.length - 1) : (current + delta + items.length) % items.length
    items[next]!.el.focus()
  }

  #jump(last: boolean): void {
    const items = this.#enabled()
    ;(last ? items[items.length - 1] : items[0])?.el.focus()
  }

  /** Type-ahead: the next enabled item (wrapping, after the current one) whose label starts with the character. */
  #typeahead(char: string): void {
    const items = this.#enabled()
    if (!items.length) return
    const current = items.findIndex((r) => r.el === document.activeElement)
    const needle = char.toLowerCase()
    for (let step = 1; step <= items.length; step++) {
      const candidate = items[(current + step + items.length) % items.length]!
      if (candidate.label.trim().toLowerCase().startsWith(needle)) {
        candidate.el.focus()
        return
      }
    }
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element | null
    if (!target || typeof target.closest !== 'function') return
    const surface = this.#surface()
    if (surface?.contains(target)) {
      const row = target.closest('.ty-action-menu__item')
      if (row && surface.contains(row)) {
        const record = this.#rendered.find((r) => r.el === row)
        if (record) this.#choose(record)
      }
      return
    }
    if (this.props.mode !== 'trigger') return
    const trigger = this.#trigger()
    if (trigger && (target === trigger || trigger.contains(target))) {
      // The host's own button already handles its activation semantics; the
      // element only asks for the toggle.
      event.preventDefault()
      if (this.props.open) this.#askClose('trigger')
      else this.#askOpen('first', trigger)
    }
  }

  #onKeydown = (event: Event): void => {
    const e = event as KeyboardEvent
    this.#keyboard = true
    const target = e.target as Node
    const surface = this.#surface()
    if (this.props.open && surface?.contains(target)) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          this.#step(1)
          return
        case 'ArrowUp':
          e.preventDefault()
          this.#step(-1)
          return
        case 'Home':
          e.preventDefault()
          this.#jump(false)
          return
        case 'End':
          e.preventDefault()
          this.#jump(true)
          return
        case 'Enter':
        case ' ': {
          e.preventDefault()
          const record = this.#rendered.find((r) => r.el === document.activeElement)
          if (record) this.#choose(record)
          return
        }
        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          this.#askClose('escape')
          return
        case 'Tab':
          // Focus moves on naturally; the menu only asks to close.
          this.#askClose('tab')
          return
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault()
            this.#typeahead(e.key)
          }
          return
      }
    }
    if (this.props.mode === 'context' && ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu')) {
      e.preventDefault()
      const focused = e.target instanceof HTMLElement ? e.target : this.#trigger()
      const rect = focused?.getBoundingClientRect()
      this.#askContext({ x: rect?.left ?? 0, y: rect?.bottom ?? 0 }, focused)
      return
    }
    if (this.props.mode === 'trigger' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      const trigger = this.#trigger()
      if (trigger && (target === trigger || trigger.contains(target))) {
        e.preventDefault()
        this.#askOpen(e.key === 'ArrowUp' ? 'last' : 'first', trigger)
      }
    }
  }

  #onContextMenu = (event: Event): void => {
    if (this.props.mode !== 'context') return
    event.preventDefault()
    if (this.#surface()?.contains(event.target as Node)) return
    const e = event as MouseEvent
    this.#askContext({ x: e.clientX, y: e.clientY })
  }

  #onPointerDown = (event: Event): void => {
    this.#keyboard = false
    const e = event as PointerEvent
    const target = e.target as Element | null
    const row = typeof target?.closest === 'function' ? target.closest('.ty-action-menu__item') : null
    if (row && this.#surface()?.contains(row)) row.setAttribute('data-pressed', '')
    if (this.props.mode !== 'context' || e.pointerType !== 'touch') return
    if (this.#surface()?.contains(e.target as Node)) return
    const point = { x: e.clientX, y: e.clientY }
    window.clearTimeout(this.#longPress)
    this.#longPress = window.setTimeout(() => this.#askContext(point), LONG_PRESS_MS)
  }

  #onPointerUp = (): void => {
    this.#cancelLongPress()
    for (const row of this.#surface()?.querySelectorAll('.ty-action-menu__item[data-pressed]') ?? []) {
      row.removeAttribute('data-pressed')
    }
  }

  #cancelLongPress = (): void => {
    window.clearTimeout(this.#longPress)
  }

  #onPointerOver = (event: Event): void => {
    const target = event.target as Element | null
    const row = typeof target?.closest === 'function' ? target.closest('.ty-action-menu__item') : null
    if (row && this.#surface()?.contains(row)) row.setAttribute('data-hovered', '')
  }

  #onPointerOut = (event: Event): void => {
    const target = event.target as Element | null
    const row = typeof target?.closest === 'function' ? target.closest('.ty-action-menu__item') : null
    if (!row) return
    row.removeAttribute('data-hovered')
    row.removeAttribute('data-pressed')
  }

  #onFocusIn = (event: Event): void => {
    const target = event.target as Element | null
    const row = typeof target?.closest === 'function' ? target.closest('.ty-action-menu__item') : null
    if (!row || !this.#surface()?.contains(row)) return
    for (const other of this.#surface()!.querySelectorAll('.ty-action-menu__item[data-focused]')) {
      other.removeAttribute('data-focused')
      other.removeAttribute('data-focus-visible')
    }
    row.setAttribute('data-focused', '')
    if (this.#keyboard) row.setAttribute('data-focus-visible', '')
  }

  #onFocusOut = (event: Event): void => {
    const target = event.target as Element | null
    const row = typeof target?.closest === 'function' ? target.closest('.ty-action-menu__item') : null
    if (!row) return
    row.removeAttribute('data-focused')
    row.removeAttribute('data-focus-visible')
  }
}
