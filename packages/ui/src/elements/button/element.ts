import { TyElement } from '../base.ts'
import { buttonDefinition } from './definition.ts'

/**
 * `<ty-button>`. The native button inside does focus, keyboard activation
 * and form submission; the element keeps the variant attributes in step and
 * blocks presses while busy (the button stays focusable, `aria-disabled`).
 */
export class TyButtonElement extends TyElement {
  static override definition = buttonDefinition

  #guard = (event: Event) => {
    if (!this.hasAttribute('busy')) return
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  protected override connected(): void {
    this.addEventListener('click', this.#guard, { capture: true })
  }

  protected override disconnected(): void {
    this.removeEventListener('click', this.#guard, { capture: true })
  }
}
