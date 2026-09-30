import { TyElement } from '../base.ts'
import { nativeSelectDefinition } from './definition.ts'

/**
 * `<ty-native-select>`. A native `<select>` inside, so the picker (the
 * platform's own on touch devices), keyboard, screen-reader support and
 * form participation are the platform's; a form reset is native too. The
 * element only mirrors the `value` attribute into the control (a no-op
 * while it already matches, so an open picker is never disturbed); while
 * the user chooses, the live value is the control's own.
 */
export class TyNativeSelectElement extends TyElement {
  static override definition = nativeSelectDefinition

  get select(): HTMLSelectElement | null {
    return this.querySelector('select')
  }

  /** Controlled value in, without disturbing a matching control. */
  #applyValue = () => {
    const select = this.select
    const value = this.getAttribute('value')
    if (select && value !== null && select.value !== value) select.value = value
  }

  protected override connected(): void {
    this.#applyValue()
  }

  protected override changed(): void {
    if (!this.isConnected) return
    this.#applyValue()
  }
}
