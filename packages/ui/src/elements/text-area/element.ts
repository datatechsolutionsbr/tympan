import { TyElement } from '../base.ts'
import { textAreaDefinition } from './definition.ts'

/**
 * `<ty-text-area>`. A native `<textarea>` inside, so typing, keyboard and
 * form participation are the platform's. The element mirrors the `value`
 * attribute into the control (a no-op while the user types, so the cursor
 * stays put), applies `default-value` once (and makes it the value a form
 * reset returns to), keeps the character counter and the over-limit state
 * (over `max-length` the area is invalid, never cut off), and grows the
 * control with its content up to `max-rows` when `auto-grow` is set.
 */
export class TyTextAreaElement extends TyElement {
  static override definition = textAreaDefinition

  #defaultApplied = false

  get area(): HTMLTextAreaElement | null {
    return this.querySelector('textarea')
  }

  /** Controlled text in, without disturbing the caret while typing. */
  #applyValue = () => {
    const area = this.area
    if (!area) return
    const value = this.getAttribute('value')
    if (value !== null) {
      if (area.value !== value) area.value = value
    } else if (!this.#defaultApplied) {
      this.#defaultApplied = true
      const initial = this.getAttribute('default-value')
      if (initial !== null) {
        area.defaultValue = initial
        if (area.value === '') area.value = initial
      }
    }
  }

  /** The counter text and the over-limit state (also without a counter). */
  #updateState = () => {
    const root = this.anatomyRoot()
    const area = this.area
    if (!root || !area) return
    const maxLength = this.props.maxLength as number | undefined
    const count = area.value.length
    const over = maxLength !== undefined && count > maxLength
    const counter = root.querySelector('.ty-text-area__counter')
    if (counter && maxLength !== undefined) {
      const template = String(over ? this.props.overLimitLabel : this.props.counterLabel)
      const text = template
        .replaceAll('{count}', String(count))
        .replaceAll('{max}', String(maxLength))
        .replaceAll('{over}', String(count - maxLength))
      if (counter.textContent !== text) counter.textContent = text
      counter.toggleAttribute('data-over-limit', over)
    }
    const invalid = over || this.hasAttribute('invalid') || root.querySelector('.ty-text-area__error') !== null
    root.toggleAttribute('data-invalid', invalid)
    if (invalid) area.setAttribute('aria-invalid', 'true')
    else area.removeAttribute('aria-invalid')
  }

  /** Auto-grow: hard lines, plus soft-wrapped lines where they can be measured. */
  #measure = () => {
    const area = this.area
    if (!area || !this.hasAttribute('auto-grow')) return
    const rows = Number(this.props.rows ?? 3)
    const maxRows = this.props.maxRows as number | undefined
    const lines = area.value.split('\n').length
    let measured = 0
    const lineHeight = parseFloat(getComputedStyle(area).lineHeight)
    if (lineHeight && !Number.isNaN(lineHeight)) {
      const previous = area.rows
      area.rows = 1
      measured = Math.ceil((area.scrollHeight - 0.5) / lineHeight)
      area.rows = previous
    }
    const wanted = Math.max(rows, lines, measured)
    const visible = maxRows !== undefined ? Math.min(wanted, maxRows) : wanted
    if (area.rows !== visible) area.rows = visible
    this.anatomyRoot()?.toggleAttribute('data-scrolling', maxRows !== undefined && wanted > maxRows)
  }

  #onInput = (event: Event) => {
    if (event.target !== this.area) return
    this.#updateState()
    this.#measure()
  }

  protected override connected(): void {
    this.addEventListener('input', this.#onInput)
    this.#applyValue()
    // Measure and count after the first paint (the React component measures
    // in an effect too), so the upgrade never rewrites the rendered anatomy.
    // The value is not re-applied here: by the first frame it may already
    // hold what the user typed.
    requestAnimationFrame(() => {
      this.#updateState()
      this.#measure()
    })
  }

  protected override disconnected(): void {
    this.removeEventListener('input', this.#onInput)
  }

  protected override changed(): void {
    if (!this.isConnected) return
    this.#applyValue()
    this.#updateState()
    this.#measure()
  }
}
