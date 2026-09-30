import { TyElement } from '../base.ts'
import { inlineNoticeDefinition } from './definition.ts'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * `<ty-inline-notice>`. The notice is painted by the stylesheet from
 * `tone`; the element adds dismissal: a press of the dismiss button emits
 * `ty-dismiss` (the host removes the notice) and moves focus to the next
 * logical element, not the document body.
 */
export class TyInlineNoticeElement extends TyElement {
  static override definition = inlineNoticeDefinition

  #dismiss = (event: Event) => {
    const button = (event.target as Element | null)?.closest?.('.ty-notice__dismiss')
    if (!button || !this.contains(button)) return
    // Focus moves to the next logical element, not the document body.
    const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE))
    const next =
      all.find((el) => !this.contains(el) && this.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) ??
      [...all].reverse().find((el) => !this.contains(el)) ??
      null
    this.emit('ty-dismiss')
    if (next) setTimeout(() => next.isConnected && next.focus(), 0)
  }

  protected override connected(): void {
    this.addEventListener('click', this.#dismiss)
  }

  protected override disconnected(): void {
    this.removeEventListener('click', this.#dismiss)
  }
}
