import { TyElement } from '../base.ts'
import { modalDefinition } from './definition.ts'

/** Elements that may take keyboard focus inside the panel. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Marker of the elements this element made inert (a host's own inert is left alone). */
const INERT_MARK = 'data-ty-modal-inert'

/** Open modals share one page scroll lock; the last one to close releases it. */
let scrollLocks = 0

const lockScroll = () => {
  if (++scrollLocks === 1) document.documentElement.setAttribute('data-ty-modal-open', '')
}
const unlockScroll = () => {
  if (scrollLocks > 0 && --scrollLocks === 0) document.documentElement.removeAttribute('data-ty-modal-open')
}

/**
 * `<ty-modal>`. The host framework renders the anatomy (backdrop, panel,
 * header, body, actions) from the definition while `open`; the element adds
 * the modal behaviour:
 *
 * - **Focus** — on open, focus moves to a `[data-autofocus]` control, else
 *   the title (`initial-focus="title"`), else the first tabbable element
 *   (an `alertdialog` without `initial-focus` starts on its first action,
 *   the least destructive by convention), else the panel itself. Tab and
 *   Shift+Tab wrap inside the panel. On close, focus returns to the element
 *   that had it when the modal opened.
 * - **Escape** asks to close (`ty-open-change`, `open: false`) unless
 *   `busy`; the close button and an allowed backdrop press do the same. A
 *   press that starts inside the panel and is released outside (selecting
 *   text) does not count as a backdrop press. An `alertdialog` never closes
 *   through the backdrop.
 * - **Isolation** — the page behind is `inert` and does not scroll while
 *   open (`data-ty-modal-open` on the root, a shared counter for stacked
 *   modals).
 *
 * Visibility is controlled: the element never closes itself, the host flips
 * `open` (the spec's `isOpen`/`onOpenChange`). The open animation is
 * `data-entering`, applied after the first frame and removed when it ends.
 */
export class TyModalElement extends TyElement {
  static override definition = modalDefinition

  #wasOpen = false
  #returnFocus: HTMLElement | null = null
  #inerted: Element[] = []
  #pressOnBackdrop = false

  protected override connected(): void {
    this.addEventListener('keydown', this.#onKeydown)
    this.addEventListener('mousedown', this.#onMousedown)
    this.addEventListener('click', this.#onClick)
    if (this.props.isOpen) this.#activate()
  }

  protected override disconnected(): void {
    this.removeEventListener('keydown', this.#onKeydown)
    this.removeEventListener('mousedown', this.#onMousedown)
    this.removeEventListener('click', this.#onClick)
    this.#deactivate(true)
  }

  protected override changed(): void {
    if (!this.isConnected) return
    if (this.props.isOpen) this.#activate()
    else this.#deactivate(true)
  }

  /** The backdrop press dismisses a dialog unless told otherwise; an alertdialog never. */
  get #dismissOnBackdrop(): boolean {
    const value = this.getAttribute('dismiss-on-backdrop')
    if (value !== null) return value !== 'false'
    return this.props.role !== 'alertdialog'
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
      if (!this.isConnected || !this.props.isOpen) return
      this.#focusInitial()
      for (const part of this.querySelectorAll('.ty-modal-dialog__backdrop, .ty-modal-dialog')) {
        part.setAttribute('data-entering', '')
        part.addEventListener('animationend', () => part.removeAttribute('data-entering'), { once: true })
      }
    })
  }

  #deactivate(restoreFocus: boolean): void {
    if (!this.#wasOpen) return
    this.#wasOpen = false
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
    // modal (React re-focuses what was active before its mutations), so the
    // return waits a frame; a modal opened in between still wins, its own
    // frame callback running later.
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

  #panel(): HTMLElement | null {
    return this.querySelector('.ty-modal-dialog__panel')
  }

  #tabbables(): HTMLElement[] {
    const panel = this.#panel()
    if (!panel) return []
    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest('[hidden]'))
  }

  #focusInitial(): void {
    const panel = this.#panel()
    if (!panel) return
    const active = document.activeElement
    if (active instanceof HTMLElement && panel.contains(active)) return
    const chosen = panel.querySelector<HTMLElement>('[data-autofocus]')
    if (chosen) {
      chosen.focus()
      return
    }
    if (this.props.initialFocus === 'title') {
      panel.querySelector<HTMLElement>('.ty-modal-dialog__title')?.focus()
      return
    }
    const tabbables = this.#tabbables()
    // An alertdialog without explicit initial focus starts on its first
    // action (the least destructive, by convention).
    if (this.props.role === 'alertdialog' && !this.hasAttribute('initial-focus')) {
      const action = panel.querySelector<HTMLElement>('.ty-modal-dialog__actions button:not([disabled])')
      if (action) {
        action.focus()
        return
      }
    }
    ;(tabbables[0] ?? panel).focus()
  }

  /** Ask the host to close; the host flips `open` (controlled visibility). */
  #requestClose(): void {
    if (this.props.busy) return
    this.emit('ty-open-change', { open: false })
  }

  #onKeydown = (event: Event): void => {
    const key = (event as KeyboardEvent).key
    if (key === 'Escape') {
      if ((event as KeyboardEvent).isComposing || this.props.busy) return
      event.preventDefault()
      event.stopPropagation()
      this.#requestClose()
      return
    }
    if (key !== 'Tab') return
    const tabbables = this.#tabbables()
    const panel = this.#panel()
    if (!panel) return
    event.preventDefault()
    event.stopPropagation()
    const backwards = (event as KeyboardEvent).shiftKey
    if (!tabbables.length) {
      panel.focus()
      return
    }
    const current = tabbables.indexOf(document.activeElement as HTMLElement)
    const next = current === -1 ? (backwards ? tabbables.length - 1 : 0) : (current + (backwards ? -1 : 1) + tabbables.length) % tabbables.length
    tabbables[next]!.focus()
  }

  #onMousedown = (event: Event): void => {
    this.#pressOnBackdrop = event.target === this.querySelector('.ty-modal-dialog__backdrop')
    // Keep focus inside the dialog: a press on the backdrop must not move
    // focus to the body (Escape is listened for on the panel's subtree).
    if (this.#pressOnBackdrop) event.preventDefault()
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element | null
    if (!target || typeof target.closest !== 'function') return
    const close = target.closest('.ty-modal-dialog__close')
    if (close && this.contains(close)) {
      this.#requestClose()
      return
    }
    const backdrop = this.querySelector('.ty-modal-dialog__backdrop')
    if (target === backdrop && this.#pressOnBackdrop && this.#dismissOnBackdrop) this.#requestClose()
    this.#pressOnBackdrop = false
  }
}
