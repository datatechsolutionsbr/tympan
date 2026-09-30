import { TyElement } from '../base.ts'
import { pageHeaderDefinition } from './definition.ts'

/**
 * `<ty-page-header>`. Almost all presentation: the host framework renders
 * the anatomy (breadcrumbs, the row of icon, text and actions, the extra
 * slot) and the stylesheet lays it out, including the below-640px stacking
 * of the actions. The element adds the one dynamic part: with `editable`,
 * it mirrors the `value` attribute into the title input — a no-op while
 * the user types, so the caret stays put (the live value is the input's
 * own; typing is reported as the native `input` event).
 */
export class TyPageHeaderElement extends TyElement {
  static override definition = pageHeaderDefinition

  /** The editable title's input, when rendered. */
  get titleInput(): HTMLInputElement | null {
    return this.querySelector('.ty-page-header__title-input')
  }

  /** Controlled text in, without disturbing the caret while typing. */
  #applyValue = () => {
    const input = this.titleInput
    if (!input) return
    const value = this.getAttribute('value')
    if (value !== null && input.value !== value) input.value = value
  }

  protected override connected(): void {
    this.#applyValue()
  }

  protected override changed(): void {
    if (!this.isConnected) return
    this.#applyValue()
  }
}
