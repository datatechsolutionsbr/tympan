import { TyElement } from '../base.ts'
import { textFieldDefinition } from './definition.ts'

/**
 * `<ty-text-field>`. A native `<input>` inside, so typing, keyboard,
 * autofill and form participation (submit, reset, validation) are the
 * platform's. The element mirrors the `value` attribute into the control
 * (a no-op while the user types, so the caret stays put), applies
 * `default-value` once (the value a form reset returns to), keeps the
 * character counter and the over-limit state (over `max-length` the field
 * is invalid, never cut off), shows the clear action only while the field
 * is non-empty and editable (clearing empties the value, fires the native
 * `input` and `ty-clear`, and returns focus; Escape clears in search
 * mode), and toggles the password reveal (the input's type, the action's
 * `aria-pressed` and its name; the two icons are both in the button and
 * CSS picks the visible one).
 */
export class TyTextFieldElement extends TyElement {
  static override definition = textFieldDefinition

  #defaultApplied = false
  #revealed = false

  get field(): HTMLInputElement | null {
    return this.querySelector('input')
  }

  /** Controlled text in, without disturbing the caret while typing. */
  #applyValue = () => {
    const field = this.field
    if (!field) return
    const value = this.getAttribute('value')
    if (value !== null) {
      if (field.value !== value) field.value = value
    } else if (!this.#defaultApplied) {
      this.#defaultApplied = true
      const initial = this.getAttribute('default-value')
      if (initial !== null) {
        field.defaultValue = initial
        if (field.value === '') field.value = initial
      }
    }
  }

  /** The counter, the over-limit state, the success parts and the clear action's visibility. */
  #updateState = () => {
    const root = this.anatomyRoot()
    const field = this.field
    if (!root || !field) return
    const maxLength = this.props.maxLength as number | undefined
    const count = field.value.length
    const over = maxLength !== undefined && count > maxLength
    const counter = root.querySelector('.ty-text-field__counter')
    if (counter && maxLength !== undefined) {
      const template = String(over ? this.props.overLimitLabel : this.props.counterLabel)
      const text = template
        .replaceAll('{count}', String(count))
        .replaceAll('{max}', String(maxLength))
        .replaceAll('{over}', String(count - maxLength))
      if (counter.textContent !== text) counter.textContent = text
      counter.toggleAttribute('data-over-limit', over)
    }
    const invalid = over || this.hasAttribute('invalid') || root.querySelector('.ty-text-field__error') !== null
    root.toggleAttribute('data-invalid', invalid)
    if (invalid) field.setAttribute('aria-invalid', 'true')
    else field.removeAttribute('aria-invalid')
    // An over-limit field is not a success.
    for (const part of root.querySelectorAll('.ty-text-field__success, .ty-text-field__success-mark')) part.toggleAttribute('hidden', over)
    // The clear action only while there is something to clear and the field is editable.
    const clear = root.querySelector('.ty-text-field__clear')
    if (clear) clear.toggleAttribute('hidden', count === 0 || this.hasAttribute('disabled') || this.hasAttribute('read-only'))
  }

  /** The reveal state: the input's type, the action's pressed state and name. */
  #applyReveal = () => {
    if (this.props.mode !== 'password') return
    const field = this.field
    const button = this.querySelector('.ty-text-field__reveal')
    const type = this.#revealed ? 'text' : 'password'
    if (field && field.getAttribute('type') !== type) field.setAttribute('type', type)
    if (button) {
      button.setAttribute('aria-pressed', this.#revealed ? 'true' : 'false')
      const label = String(this.#revealed ? this.props.hidePasswordLabel : this.props.showPasswordLabel)
      if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label)
    }
  }

  /** Clear: empty value, a native input event (the wrappers' onChange), `ty-clear`, focus back on the input. */
  #clear = () => {
    const field = this.field
    if (!field || field.disabled || field.readOnly || field.value === '') return
    // The prototype setter bypasses React's value tracker, so a controlled
    // wrapper sees the change and reports it from the input event below.
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    if (setValue) setValue.call(field, '')
    else field.value = ''
    field.dispatchEvent(new Event('input', { bubbles: true }))
    this.emit('ty-clear')
    field.focus()
  }

  #onInput = (event: Event) => {
    if (event.target !== this.field) return
    this.#updateState()
  }

  #onClick = (event: Event) => {
    const target = event.target as Element | null
    if (!target || typeof target.closest !== 'function') return
    const clear = target.closest('.ty-text-field__clear')
    if (clear && this.contains(clear)) {
      this.#clear()
      return
    }
    const reveal = target.closest('.ty-text-field__reveal')
    if (reveal && this.contains(reveal) && !(reveal as HTMLButtonElement).disabled) {
      this.#revealed = !this.#revealed
      this.#applyReveal()
    }
  }

  /** Escape clears in search mode (the SearchField behaviour). */
  #onKeydown = (event: Event) => {
    if ((event as KeyboardEvent).key !== 'Escape' || event.target !== this.field) return
    if (this.props.mode === 'search') this.#clear()
  }

  protected override connected(): void {
    this.addEventListener('input', this.#onInput)
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKeydown)
    this.#applyValue()
    this.#applyReveal()
    // Count and clear-visibility after the first paint, so the upgrade never
    // rewrites the rendered anatomy (see <ty-text-area>).
    requestAnimationFrame(() => this.#updateState())
  }

  protected override disconnected(): void {
    this.removeEventListener('input', this.#onInput)
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('keydown', this.#onKeydown)
  }

  protected override changed(): void {
    if (!this.isConnected) return
    this.#applyValue()
    this.#applyReveal()
    this.#updateState()
  }
}
