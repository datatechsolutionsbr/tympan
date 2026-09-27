import { TyElement } from '../base.ts'
import { switchDefinition } from './definition.ts'

/**
 * `<ty-switch>`. A native checkbox with `role="switch"` inside a `<label>`:
 * the label names it, Space toggles it and forms submit it natively. The
 * element adds Enter (parity with the React Switch), keeps it unchangeable
 * while read-only, reflects the state to the `checked` attribute (and so to
 * `data-selected`), and follows a form reset.
 */
export class TySwitchElement extends TyElement {
  static override definition = switchDefinition

  #form: HTMLFormElement | null = null

  get input(): HTMLInputElement | null {
    return this.querySelector('input[role="switch"]')
  }

  #locked(): boolean {
    return this.hasAttribute('disabled') || this.hasAttribute('read-only')
  }

  #onKey = (event: KeyboardEvent) => {
    const input = this.input
    if (!input || event.key !== 'Enter' || event.target !== input || this.#locked()) return
    event.preventDefault()
    input.click()
  }

  #onClick = (event: Event) => {
    if (event.target === this.input && this.hasAttribute('read-only')) event.preventDefault()
  }

  #onChange = (event: Event) => {
    const input = this.input
    if (event.target !== input || !input) return
    this.toggleAttribute('checked', input.checked)
  }

  #onReset = () => {
    // The reset runs after the event; read the restored state then.
    setTimeout(() => {
      const input = this.input
      if (input) this.toggleAttribute('checked', input.checked)
    })
  }

  protected override connected(): void {
    this.addEventListener('keydown', this.#onKey)
    this.addEventListener('click', this.#onClick)
    this.addEventListener('change', this.#onChange)
    this.#form = this.input?.form ?? null
    this.#form?.addEventListener('reset', this.#onReset)
  }

  protected override disconnected(): void {
    this.removeEventListener('keydown', this.#onKey)
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('change', this.#onChange)
    this.#form?.removeEventListener('reset', this.#onReset)
    this.#form = null
  }

}
