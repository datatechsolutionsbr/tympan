import { TyElement } from '../base.ts'
import { checkboxDefinition } from './definition.ts'

/**
 * `<ty-checkbox>`. A native checkbox inside a `<label>` row: the label names
 * it, Space toggles it and forms submit it natively. The element reflects the
 * state to the `checked` attribute, mirrors `indeterminate` to the input's
 * property (CSS `:indeterminate` shows the minus mark), clears the mixed
 * state on the next toggle, and follows a form reset.
 */
export class TyCheckboxElement extends TyElement {
  static override definition = checkboxDefinition

  #form: HTMLFormElement | null = null

  get input(): HTMLInputElement | null {
    return this.querySelector('.ty-checkbox__row > input')
  }

  #onChange = (event: Event) => {
    const input = this.input
    if (event.target !== input || !input) return
    this.toggleAttribute('checked', input.checked)
    if (this.hasAttribute('indeterminate')) {
      this.removeAttribute('indeterminate')
      input.indeterminate = false
    }
  }

  #onReset = () => {
    // The reset runs after the event; read the restored state then.
    setTimeout(() => {
      const input = this.input
      if (input) this.toggleAttribute('checked', input.checked)
    })
  }

  #applyIndeterminate() {
    const input = this.input
    if (input) input.indeterminate = this.hasAttribute('indeterminate')
  }

  protected override connected(): void {
    this.addEventListener('change', this.#onChange)
    this.#form = this.input?.form ?? null
    this.#form?.addEventListener('reset', this.#onReset)
    this.#applyIndeterminate()
  }

  protected override disconnected(): void {
    this.removeEventListener('change', this.#onChange)
    this.#form?.removeEventListener('reset', this.#onReset)
    this.#form = null
  }

  protected override changed(): void {
    this.#applyIndeterminate()
  }
}
