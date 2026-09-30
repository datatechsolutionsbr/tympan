import { TyElement } from '../base.ts'
import { popoverDefinition } from './definition.ts'
import { physicalSide, place, offsetPx, type Rect, type Size } from './model.ts'

/**
 * `<ty-popover>`. The host framework renders the anatomy (trigger or its
 * slot, panel with arrow/title/body) from the definition; the element adds
 * the behaviour (spec: wave-1/popover.md):
 *
 * - **Trigger wiring** — the trigger slot's first element (or the built-in
 *   info button) gets `aria-haspopup="dialog"` and reflects `open` in
 *   `aria-expanded`; activating it asks the host to toggle
 *   (`ty-open-change`).
 * - **Placement** — the panel is `position: fixed` at the geometry the
 *   shared placement model computes from the trigger's rectangle (side
 *   preference, collision flip, viewport clamp, arrow inset), recomputed
 *   on open, on resize and on scroll.
 * - **Dismissal** — Escape and a press outside ask to close; focus leaving
 *   the panel (a Tab past its last control) does too. Not a focus trap:
 *   content that needs one is a dialog.
 */
export class TyPopoverElement extends TyElement {
  static override definition = popoverDefinition

  /** Observed outside-press/focus listeners, for a clean disconnect. */
  #outsideController: AbortController | null = null
  /** The panel's fixed position is recomputed while open. */
  #raf = 0

  override connected(): void {
    super.connected?.()
    this.addEventListener('click', this.#onActivate)
    this.addEventListener('keydown', this.#onKeydown)
    if (this.props.open) this.#activate()
  }

  override disconnected(): void {
    super.disconnected?.()
    this.removeEventListener('click', this.#onActivate)
    this.removeEventListener('keydown', this.#onKeydown)
    this.#teardown()
  }

  protected override changed(): void {
    if (!this.isConnected) return
    this.#wireTrigger()
    if (this.props.open) this.#activate()
    else this.#teardown()
  }

  /** The control that toggles the panel: the trigger slot's first element, else the built-in info button. */
  #trigger(): HTMLElement | null {
    const slot = this.querySelector<HTMLSlotElement>('slot[name="trigger"]')
    const fromSlot = slot?.assignedElements({ flatten: true })[0]
    const trigger = fromSlot ?? this.querySelector('.ty-popover__trigger')
    return trigger instanceof HTMLElement ? trigger : null
  }

  #panel(): HTMLElement | null {
    return this.querySelector('.ty-popover')
  }

  /** The trigger reflects open state; the panel's name comes from title or accessibleLabel. */
  #wireTrigger(): void {
    const trigger = this.#trigger()
    const panel = this.#panel()
    if (!trigger || !panel) return
    trigger.setAttribute('aria-haspopup', 'dialog')
    trigger.setAttribute('aria-expanded', this.props.open ? 'true' : 'false')
    if (!panel.getAttribute('aria-label')) {
      const label = String(this.props.title || this.props.accessibleLabel || '')
      if (label) panel.setAttribute('aria-label', label)
    }
    // The panel is controlled by the trigger it belongs to.
    const id = panel.id || (panel.id = `ty-popover-panel-${crypto.randomUUID().slice(0, 8)}`)
    trigger.setAttribute('aria-controls', id)
  }

  #onActivate = (event: Event): void => {
    const trigger = this.#trigger()
    if (!trigger || !this.#contains(event.target as Node, trigger)) return
    // The host's own button already handles its activation semantics; the
    // element only asks for the toggle.
    event.preventDefault()
    this.requestOpen(!this.props.open)
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.props.open) return
    event.stopPropagation()
    this.requestOpen(false)
  }

  /** Ask the host to change visibility (controlled). */
  requestOpen(open: boolean): void {
    this.emit('ty-open-change', { open })
  }

  #activate(): void {
    if (this.#outsideController) return
    const controller = new AbortController()
    this.#outsideController = controller
    // A press that starts outside closes; one that starts inside (selecting
    // text) does not.
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (this.contains(event.target as Node)) return
        this.requestOpen(false)
      },
      { signal: controller.signal },
    )
    // Focus leaving the panel (and not entering the trigger) closes.
    this.addEventListener(
      'focusout',
      (event: FocusEvent) => {
        const next = event.relatedTarget as Node | null
        if (next && this.contains(next)) return
        this.requestOpen(false)
      },
      { signal: controller.signal },
    )
    const reposition = () => this.#place()
    window.addEventListener('resize', reposition, { signal: controller.signal })
    window.addEventListener('scroll', reposition, { capture: true, passive: true, signal: controller.signal })
    // Place after the anatomy has had its frame (a framework commits
    // children and host attributes separately).
    requestAnimationFrame(() => {
      if (!this.isConnected || !this.props.open) return
      this.#place()
      const panel = this.#panel()
      if (panel) {
        panel.setAttribute('data-entering', '')
        panel.addEventListener('animationend', () => panel.removeAttribute('data-entering'), { once: true })
      }
    })
  }

  #teardown(): void {
    this.#outsideController?.abort()
    this.#outsideController = null
    if (this.#raf) cancelAnimationFrame(this.#raf)
    this.#raf = 0
    const panel = this.#panel()
    if (panel) panel.style.removeProperty('inset')
  }

  #place(): void {
    const trigger = this.#trigger()
    const panel = this.#panel()
    if (!trigger || !panel) return
    const rect = trigger.getBoundingClientRect()
    const anchor: Rect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    // The panel measures itself at its natural size before placement.
    const style = getComputedStyle(panel)
    const size: Size = {
      width: panel.offsetWidth + Number.parseFloat(style.marginLeft || '0') + Number.parseFloat(style.marginRight || '0'),
      height: panel.offsetHeight + Number.parseFloat(style.marginTop || '0') + Number.parseFloat(style.marginBottom || '0'),
    }
    const viewport: Size = { width: document.documentElement.clientWidth, height: window.innerHeight }
    const rtl = getComputedStyle(this).direction === 'rtl'
    const side = physicalSide(String(this.props.placement || 'bottom'), rtl)
    const offset = offsetPx(Number(this.props.offset ?? 2), this.getAttribute('show-arrow') !== 'false')
    const placed = place(
      anchor,
      size,
      viewport,
      side,
      String(this.props.align || 'center') as 'start' | 'center' | 'end',
      offset,
    )
    this.#raf = requestAnimationFrame(() => {
      panel.style.position = 'fixed'
      panel.style.left = `${Math.round(placed.x)}px`
      panel.style.top = `${Math.round(placed.y)}px`
      panel.style.maxWidth = `${Math.max(0, viewport.width - 32)}px`
      const arrow = panel.querySelector<HTMLElement>('.ty-popover__arrow')
      if (arrow) arrow.dataset.side = placed.side
      panel.dataset.side = placed.side
    })
  }

  #contains(node: Node | null, scope: HTMLElement): boolean {
    let current: Node | null = node
    while (current) {
      if (current === scope) return true
      current = current.parentElement ?? (current instanceof HTMLSlotElement ? null : null)
      if (!current && node instanceof Node) {
        // Slotted light DOM resolves through its slot's host.
        const slot = (node as Element).assignedSlot
        if (slot) current = slot
      }
    }
    return false
  }
}
