import { TyElement } from '../base.ts'
import { progressBarDefinition } from './definition.ts'

/**
 * `<ty-progress-bar>`. The anatomy (rendered by the host framework, or built
 * from plain HTML) carries the progressbar role, its name, the range and an
 * in-range value; the stylesheet draws the track and fill, including the
 * indeterminate sweep and its reduced-motion and forced-colours fallbacks.
 * The element adds the computed state the definition language cannot
 * express (mirroring the React ProgressBar, which gets it from React Aria):
 *
 * - **clamping** — a value outside the range is pulled back in
 *   (`aria-valuenow`); in-range values never touch the rendered attribute;
 * - **value text** — the visible text and `aria-valuetext`: `valueLabel`
 *   when given, the rounded percentage otherwise; an indeterminate bar
 *   states `inProgressLabel` instead;
 * - **complete** — `data-complete` while a determinate value reaches the
 *   maximum;
 * - **the fill's inline size** — the percentage of the range (an
 *   indeterminate fill is sized and animated by the stylesheet).
 *
 * The first pass runs after the first paint, so the upgrade never rewrites
 * the rendered anatomy (see <ty-text-field>); attribute changes apply at
 * once.
 */
export class TyProgressBarElement extends TyElement {
  static override definition = progressBarDefinition

  /** False until the first paint: the computed state is not applied during the upgrade the parity renderers compare. */
  #ready = false

  override sync(): void {
    super.sync()
    if (this.#ready) this.#update()
  }

  protected override connected(): void {
    requestAnimationFrame(() => {
      if (!this.isConnected) return
      this.#ready = true
      this.#update()
    })
  }

  #update(): void {
    const root = this.anatomyRoot()
    if (!root) return
    const props = this.props
    const indeterminate = Boolean(props.indeterminate)
    const min = Number(props.minValue ?? 0)
    const max = Number(props.maxValue ?? 100)
    const clamped = Math.min(Math.max(Number(props.value ?? 0), min), max)
    const range = max - min
    const percentage = range > 0 ? Math.round(((clamped - min) / range) * 100) : 100

    if (indeterminate) root.removeAttribute('aria-valuenow')
    else {
      // super.sync() bound the raw value; only an out-of-range one needs the clamp.
      const now = String(clamped)
      if (root.getAttribute('aria-valuenow') !== now) root.setAttribute('aria-valuenow', now)
      const valueText = props.valueLabel !== undefined && props.valueLabel !== '' ? String(props.valueLabel) : `${percentage}%`
      if (root.getAttribute('aria-valuetext') !== valueText) root.setAttribute('aria-valuetext', valueText)
    }
    root.toggleAttribute('data-complete', !indeterminate && clamped >= max)

    const value = root.querySelector('.ty-progress__value')
    if (value) {
      const text = indeterminate
        ? String(props.inProgressLabel ?? 'In progress')
        : props.valueLabel !== undefined && props.valueLabel !== ''
          ? String(props.valueLabel)
          : `${percentage}%`
      if (value.textContent !== text) value.textContent = text
    }

    const fill = root.querySelector<HTMLElement>('.ty-progress__fill')
    if (fill) {
      const size = indeterminate ? '' : `${percentage}%`
      if (fill.style.inlineSize !== size) fill.style.inlineSize = size
    }
  }
}
