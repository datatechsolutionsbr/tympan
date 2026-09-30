import { TyElement } from '../base.ts'
import { drawerDefinition } from './definition.ts'

/** Elements that may take keyboard focus inside the panel. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Marker of the elements this element made inert (a host's own inert is left alone). */
const INERT_MARK = 'data-ty-drawer-inert'

/** Open drawers share one page scroll lock; the last one to close releases it. */
let scrollLocks = 0

const lockScroll = () => {
  if (++scrollLocks === 1) document.documentElement.setAttribute('data-ty-drawer-open', '')
}
const unlockScroll = () => {
  if (scrollLocks > 0 && --scrollLocks === 0) document.documentElement.removeAttribute('data-ty-drawer-open')
}

/** Distance (px) or velocity (px/ms) past which a released drag closes the drawer (Drawer.tsx). */
const DRAG_DISTANCE = 120
const DRAG_VELOCITY = 0.6
/** Panel travel over which the backdrop fades to its dimmest still-visible opacity. */
const DRAG_FADE = 400

/**
 * `<ty-drawer>`. The host framework renders the anatomy (backdrop, panel,
 * header with handle/title/close, body, inset) from the definition while
 * `open`; the element adds the modal behaviour (the same contract as
 * `<ty-modal>`):
 *
 * - **Focus** — on open, focus moves to a `[data-autofocus]` control, else
 *   the first tabbable element, else the dialog itself; Tab and Shift+Tab
 *   wrap inside the panel; on close, focus returns to the element that had
 *   it when the drawer opened.
 * - **Dismissal** — Escape and the close button always ask to close
 *   (`ty-open-change`, `open: false`); a backdrop press and a downward drag
 *   past the threshold do too, unless `dismissible="false"`. A press that
 *   starts inside the panel and is released outside (selecting text) is not
 *   a backdrop press.
 * - **Drag** (bottom placement, while dismissible) — pressing the header
 *   (the grab area, never a button inside it) starts a drag: the panel
 *   follows the pointer down at full speed (`data-dragging`), the backdrop
 *   fades with the distance, and a release past 120 px or 0.6 px/ms asks to
 *   close; anything else — and a cancelled pointer — snaps back through the
 *   panel's CSS transition.
 * - **Isolation** — the page behind is `inert` and does not scroll while
 *   open (`data-ty-drawer-open` on the root, a shared counter for stacked
 *   drawers).
 *
 * Visibility is controlled: the element never closes itself, the host flips
 * `open`. `max-height` is applied to the panel on upgrade (a bottom
 * placement only). The open animation is `data-entering`, applied after the
 * first frame and removed when it ends.
 */
export class TyDrawerElement extends TyElement {
  static override definition = drawerDefinition

  #wasOpen = false
  #returnFocus: HTMLElement | null = null
  #inerted: Element[] = []
  #pressOnBackdrop = false
  #drag: { y: number; t: number } | null = null

  protected override connected(): void {
    this.addEventListener('keydown', this.#onKeydown)
    this.addEventListener('mousedown', this.#onMousedown)
    this.addEventListener('click', this.#onClick)
    this.addEventListener('pointerdown', this.#onPointerDown)
    this.addEventListener('pointermove', this.#onPointerMove)
    this.addEventListener('pointerup', this.#onPointerUp)
    this.addEventListener('pointercancel', this.#onPointerUp)
    requestAnimationFrame(() => this.#applyMaxHeight())
    if (this.props.open) this.#activate()
  }

  protected override disconnected(): void {
    this.removeEventListener('keydown', this.#onKeydown)
    this.removeEventListener('mousedown', this.#onMousedown)
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('pointerdown', this.#onPointerDown)
    this.removeEventListener('pointermove', this.#onPointerMove)
    this.removeEventListener('pointerup', this.#onPointerUp)
    this.removeEventListener('pointercancel', this.#onPointerUp)
    this.#deactivate(true)
  }

  protected override changed(): void {
    if (!this.isConnected) return
    // After the first paint, like the text field's counter: the upgrade
    // never rewrites the rendered anatomy before it can be compared.
    requestAnimationFrame(() => this.#applyMaxHeight())
    if (this.props.open) this.#activate()
    else this.#deactivate(true)
  }

  /** `dismissible="false"` keeps the backdrop and drag from closing; Escape and the close button always work. */
  get #dismissible(): boolean {
    return this.getAttribute('dismissible') !== 'false'
  }

  #backdrop(): HTMLElement | null {
    return this.querySelector('.ty-drawer__backdrop')
  }

  #panel(): HTMLElement | null {
    return this.querySelector('.ty-drawer')
  }

  #dialog(): HTMLElement | null {
    return this.querySelector('.ty-drawer__dialog')
  }

  /** `max-height` is a CSS length, which attribute bindings cannot carry; the panel gets it here. */
  #applyMaxHeight(): void {
    const panel = this.#panel()
    if (!panel) return
    const value = this.props.placement === 'bottom' ? String(this.props.maxHeight ?? '') : ''
    if (panel.style.maxBlockSize !== value) panel.style.maxBlockSize = value
  }

  #activate(): void {
    if (this.#wasOpen) return
    this.#wasOpen = true
    const active = document.activeElement
    this.#returnFocus = active instanceof HTMLElement && !this.contains(active) ? active : null
    lockScroll()
    this.#applyInert()
    // The anatomy may land a beat after the `open` attribute (a framework
    // commits children and host attributes separately), so focus and the
    // entering animation wait a frame.
    requestAnimationFrame(() => {
      if (!this.isConnected || !this.props.open) return
      this.#focusInitial()
      for (const part of this.querySelectorAll('.ty-drawer__backdrop, .ty-drawer')) {
        part.setAttribute('data-entering', '')
        part.addEventListener('animationend', () => part.removeAttribute('data-entering'), { once: true })
      }
    })
  }

  #deactivate(restoreFocus: boolean): void {
    if (!this.#wasOpen) return
    this.#wasOpen = false
    this.#endDrag()
    unlockScroll()
    for (const element of this.#inerted) {
      if (element.getAttribute(INERT_MARK) !== null) {
        element.removeAttribute('inert')
        element.removeAttribute(INERT_MARK)
      }
    }
    this.#inerted = []
    const target = this.#returnFocus
    this.#returnFocus = null
    // A framework keeps owning focus across the commit that closed the
    // drawer (React re-focuses what was active before its mutations), so
    // the return waits a frame; an overlay opened in between still wins,
    // its own frame callback running later.
    if (restoreFocus && target?.isConnected) {
      requestAnimationFrame(() => {
        if (target.isConnected) target.focus()
      })
    }
  }

  /** Everything between this element and `<body>` gets inert siblings. */
  #applyInert(): void {
    let node: Element | null = this
    while (node && node !== document.body) {
      const parent: Element | null = node.parentElement
      if (!parent) break
      for (const sibling of Array.from(parent.children)) {
        if (sibling === node || sibling.hasAttribute('inert')) continue
        sibling.setAttribute('inert', '')
        sibling.setAttribute(INERT_MARK, '')
        this.#inerted.push(sibling)
      }
      node = parent
    }
  }

  #tabbables(): HTMLElement[] {
    const panel = this.#panel()
    if (!panel) return []
    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest('[hidden]'))
  }

  #focusInitial(): void {
    const dialog = this.#dialog()
    if (!dialog) return
    const active = document.activeElement
    if (active instanceof HTMLElement && dialog.contains(active)) return
    const chosen = dialog.querySelector<HTMLElement>('[data-autofocus]')
    if (chosen) {
      chosen.focus()
      return
    }
    ;(this.#tabbables()[0] ?? dialog).focus()
  }

  /** Ask the host to close; the host flips `open` (controlled visibility). */
  #requestClose(): void {
    this.emit('ty-open-change', { open: false })
  }

  #onKeydown = (event: Event): void => {
    const key = (event as KeyboardEvent).key
    if (key === 'Escape') {
      if ((event as KeyboardEvent).isComposing) return
      event.preventDefault()
      event.stopPropagation()
      this.#requestClose()
      return
    }
    if (key !== 'Tab') return
    const tabbables = this.#tabbables()
    const dialog = this.#dialog()
    if (!dialog) return
    event.preventDefault()
    event.stopPropagation()
    const backwards = (event as KeyboardEvent).shiftKey
    if (!tabbables.length) {
      dialog.focus()
      return
    }
    const current = tabbables.indexOf(document.activeElement as HTMLElement)
    const next = current === -1 ? (backwards ? tabbables.length - 1 : 0) : (current + (backwards ? -1 : 1) + tabbables.length) % tabbables.length
    tabbables[next]!.focus()
  }

  #onMousedown = (event: Event): void => {
    this.#pressOnBackdrop = event.target === this.#backdrop()
    // Keep focus inside the dialog: a press on the backdrop must not move
    // focus to the body (Escape is listened for on the panel's subtree).
    if (this.#pressOnBackdrop) event.preventDefault()
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element | null
    if (!target || typeof target.closest !== 'function') return
    const close = target.closest('.ty-drawer__close')
    if (close && this.contains(close)) {
      this.#requestClose()
      return
    }
    if (target === this.#backdrop() && this.#pressOnBackdrop && this.#dismissible) this.#requestClose()
    this.#pressOnBackdrop = false
  }

  // --- Drag to dismiss (bottom placement; spec: wave-1/drawer.md) -------

  #onPointerDown = (event: Event): void => {
    const pointer = event as PointerEvent
    if (!this.props.open || !this.#dismissible || this.props.placement !== 'bottom') return
    if (pointer.button !== undefined && pointer.button > 0) return
    const header = this.querySelector('.ty-drawer__header')
    const target = pointer.target as Element | null
    if (!header || !target || typeof target.closest !== 'function') return
    // The header is the grab area; a press on a control inside it (the
    // close button) is not a drag.
    if (target.closest('.ty-drawer__header') !== header || target.closest('button')) return
    this.#drag = { y: pointer.clientY, t: pointer.timeStamp || performance.now() }
    header.setPointerCapture?.(pointer.pointerId)
  }

  #onPointerMove = (event: Event): void => {
    const drag = this.#drag
    if (!drag) return
    const panel = this.#panel()
    const backdrop = this.#backdrop()
    const distance = Math.max(0, (event as PointerEvent).clientY - drag.y)
    if (panel) {
      panel.style.transition = 'none'
      panel.style.transform = distance > 0 ? `translateY(${distance}px)` : ''
      panel.toggleAttribute('data-dragging', distance > 0)
    }
    if (backdrop) backdrop.style.opacity = String(Math.max(0.2, 1 - distance / DRAG_FADE))
  }

  #onPointerUp = (event: Event): void => {
    const drag = this.#drag
    if (!drag) return
    const pointer = event as PointerEvent
    const cancelled = event.type === 'pointercancel'
    const distance = Math.max(0, pointer.clientY - drag.y)
    const elapsed = Math.max(1, (pointer.timeStamp || performance.now()) - drag.t)
    this.#endDrag()
    if (!cancelled && (distance >= DRAG_DISTANCE || distance / elapsed >= DRAG_VELOCITY)) this.#requestClose()
  }

  /** End the drag: clearing the inline styles lets the CSS transition snap the panel back. */
  #endDrag(): void {
    this.#drag = null
    const panel = this.#panel()
    if (panel) {
      panel.style.transition = ''
      panel.style.transform = ''
      panel.removeAttribute('data-dragging')
    }
    const backdrop = this.#backdrop()
    if (backdrop) backdrop.style.opacity = ''
  }
}
