import { TyElement } from '../base.ts'
import { skipLinkDefinition } from './definition.ts'

/**
 * `<ty-skip-link>`. A native anchor to the target's fragment, so keyboard
 * activation and the accessibility tree are the platform's; the stylesheet
 * hides it until focus (never `display: none`) and raises it above every
 * layer when visible. The element adds what markup cannot (mirroring the
 * React SkipLink's `focusSkipTarget`):
 *
 * - the derived `href` (`#` + `target-id`), applied after the first paint so
 *   the upgrade never rewrites the rendered anatomy (see <ty-text-field>);
 * - the activation behaviour: focus moves to the target — a temporary
 *   negative tabindex when the target is not natively focusable, removed on
 *   blur, so the next Tab continues from there — and the target scrolls to
 *   the start, where the document's `scroll-padding-top` keeps it clear of
 *   the sticky top bar (§2.6). The address bar's fragment is updated without
 *   a history entry.
 */
export class TySkipLinkElement extends TyElement {
  static override definition = skipLinkDefinition

  /** False until the first paint: the derived href is not applied during the upgrade the parity renderers compare. */
  #ready = false

  override sync(): void {
    super.sync()
    if (this.#ready) this.#applyTarget()
  }

  protected override connected(): void {
    this.addEventListener('click', this.#onClick)
    requestAnimationFrame(() => {
      if (!this.isConnected) return
      this.#ready = true
      this.#applyTarget()
    })
  }

  protected override disconnected(): void {
    this.removeEventListener('click', this.#onClick)
  }

  /** The anchor points at the target's fragment. */
  #applyTarget(): void {
    const link = this.querySelector('a')
    const href = `#${String(this.props.targetId)}`
    if (link && link.getAttribute('href') !== href) link.setAttribute('href', href)
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element | null
    const anchor = target && typeof target.closest === 'function' ? target.closest('a') : null
    if (!anchor || !this.contains(anchor)) return
    const targetId = String(this.props.targetId)
    if (!focusSkipTarget(targetId)) return
    event.preventDefault()
    if (typeof history !== 'undefined' && history.replaceState) history.replaceState(history.state, '', `#${targetId}`)
  }
}

/** Moves focus to `targetId`, making it programmatically focusable when needed (the React SkipLink's `focusSkipTarget`). */
export function focusSkipTarget(targetId: string): boolean {
  const target = document.getElementById(targetId)
  if (!target) return false
  const needsTabIndex = !target.hasAttribute('tabindex') && target.tabIndex < 0
  if (needsTabIndex) {
    target.setAttribute('tabindex', '-1')
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
  }
  target.focus({ preventScroll: true })
  // scroll-padding-top on the document keeps the target clear of the sticky top bar (§2.6).
  target.scrollIntoView?.({ block: 'start' })
  return true
}
