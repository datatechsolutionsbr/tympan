import { TyElement } from '../base.ts'
import { surfaceDefinition } from './definition.ts'

const INTERACTIVE = 'a[href],button,input,select,textarea,summary,[role="button"],[role="link"],[role="checkbox"],[role="switch"],[tabindex]:not([tabindex="-1"])'

/**
 * `<ty-surface>`. The anatomy is purely presentational; the behaviour the
 * element adds is the pressable card: a press anywhere on the surface,
 * outside a nested control and outside a text selection, is forwarded to
 * the title's primary control (the link with `href`, the button otherwise),
 * so keyboard activation and context menus stay that control's own.
 */
export class TySurfaceElement extends TyElement {
  static override definition = surfaceDefinition

  get primary(): HTMLElement | null {
    return this.querySelector('.ty-surface__primary')
  }

  #pressable(): boolean {
    return this.hasAttribute('pressable') || this.hasAttribute('href')
  }

  #onClick = (event: MouseEvent) => {
    const primary = this.primary
    if (!this.#pressable() || this.hasAttribute('disabled') || !primary || !(event.target instanceof Element)) return
    if (primary.contains(event.target)) return
    const interactive = event.target.closest(INTERACTIVE)
    if (interactive && this.contains(interactive)) return
    if (typeof window !== 'undefined' && window.getSelection?.()?.toString()) return
    primary.click()
  }

  protected override connected(): void {
    if (this.#pressable() && !this.primary) console.warn('<ty-surface>: a pressable surface needs a title, which becomes its primary control.')
    this.addEventListener('click', this.#onClick)
  }

  protected override disconnected(): void {
    this.removeEventListener('click', this.#onClick)
  }
}
