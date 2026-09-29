import { TyElement } from '../base.ts'
import { gradientMarkDefinition } from './definition.ts'

/**
 * `<ty-gradient-mark>`. All presentation: the host framework renders the
 * anatomy and the stylesheet draws the token gradient. The element adds what
 * markup cannot: a per-instance `gradient` or `radius` CSS value becomes the
 * badge's custom property on upgrade, so a custom gradient paints while
 * server-rendered markup shows the default token gradient.
 */
export class TyGradientMarkElement extends TyElement {
  static override definition = gradientMarkDefinition

  override sync(): void {
    super.sync()
    const root = this.anatomyRoot()
    if (!root) return
    this.#customProperty(root, 'gradient', '--ty-gradient-mark-gradient')
    this.#customProperty(root, 'radius', '--ty-gradient-mark-radius')
  }

  #customProperty(root: HTMLElement, attribute: string, property: string): void {
    const value = this.getAttribute(attribute)
    if (value === null || value === '') root.style.removeProperty(property)
    else root.style.setProperty(property, value)
  }
}
