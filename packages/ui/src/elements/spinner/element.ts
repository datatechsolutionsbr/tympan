import { TyElement } from '../base.ts'
import { spinnerDefinition } from './definition.ts'

/**
 * `<ty-spinner>`. All presentation: the host framework renders the anatomy
 * (an indeterminate progressbar and its glyph) and the stylesheet draws and
 * animates it. The element adds what markup cannot: it follows
 * `prefers-reduced-motion`, reflecting `data-reduced-motion` on the anatomy
 * root, and — a still indicator says nothing by itself — reveals the label
 * as text while motion is reduced. For an anatomy it built itself (plain
 * HTML) it adds the caption node; a framework-rendered one shows the label
 * through the default slot, so the element never creates a node a framework
 * owns.
 */
export class TySpinnerElement extends TyElement {
  static override definition = spinnerDefinition

  #media: MediaQueryList | null = null
  #caption: HTMLElement | null = null

  #onMedia = () => this.#reflectMotion()

  protected override connected(): void {
    this.#media = typeof matchMedia === 'undefined' ? null : matchMedia('(prefers-reduced-motion: reduce)')
    this.#media?.addEventListener('change', this.#onMedia)
    this.#reflectMotion()
  }

  protected override disconnected(): void {
    this.#media?.removeEventListener('change', this.#onMedia)
    this.#media = null
  }

  protected override changed(): void {
    this.#reflectMotion()
  }

  #reflectMotion(): void {
    const root = this.anatomyRoot()
    if (!root) return
    const reduced = this.#media?.matches ?? false
    root.toggleAttribute('data-reduced-motion', reduced)
    if (!this.owned) return
    const labelled = root.querySelector(':scope > .ty-spinner__label') !== null
    if (reduced && !labelled) {
      if (!this.#caption?.isConnected) {
        this.#caption = document.createElement('span')
        this.#caption.className = 'ty-spinner__label'
        this.#caption.setAttribute('aria-hidden', 'true')
      }
      this.#caption.textContent = String(this.props.label ?? '')
      root.append(this.#caption)
    } else if (!reduced && this.#caption) {
      this.#caption.remove()
      this.#caption = null
    }
  }
}
