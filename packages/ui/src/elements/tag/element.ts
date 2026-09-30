import { TyElement } from '../base.ts'
import { tagDefinition } from './definition.ts'

/**
 * `<ty-tag>`. A static pill with a text, an optional leading icon or
 * category square, and an optional native remove button (wired by the
 * wrappers through its native click). The element adds what the markup
 * cannot: it names an unlabelled remove button "Remove <text>" (the host
 * passes a translated `remove-label` to override) and normalises
 * `category-index` into the 1–8 categorical tokens.
 */
export class TyTagElement extends TyElement {
  static override definition = tagDefinition

  override sync(): void {
    super.sync()
    const button = this.querySelector('.ty-tag__remove')
    if (button && !button.hasAttribute('aria-label')) {
      const text = this.querySelector('.ty-tag__text')?.textContent?.trim() ?? ''
      button.setAttribute('aria-label', `Remove ${text}`.trim())
    }
  }

  protected override changed(): void {
    const raw = this.getAttribute('category-index')
    if (raw === null) return
    const n = Number(raw)
    if (!Number.isFinite(n)) {
      this.removeAttribute('category-index')
      return
    }
    const normalized = String(((Math.max(1, Math.round(n)) - 1) % 8) + 1)
    if (normalized !== raw) this.setAttribute('category-index', normalized)
  }
}
