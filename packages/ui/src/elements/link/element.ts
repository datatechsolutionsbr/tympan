import { TyElement } from '../base.ts'
import type { Props } from '../definition.ts'
import { linkDefinition } from './definition.ts'

/** True for absolute http(s) URLs pointing to another origin (the React Link's `isExternalHref`). */
function isExternalHref(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return new URL(href).origin !== origin
  } catch {
    return false
  }
}

/**
 * `<ty-link>`. The native anchor inside does focus, keyboard activation and
 * opening in a new context; the element keeps the bound attributes in step,
 * infers `external` from absolute URLs to another origin (a host renders
 * `external` itself when it knows) and fills the external link's
 * screen-reader hint from `new-tab-label`.
 */
export class TyLinkElement extends TyElement {
  static override definition = linkDefinition

  override get props(): Props {
    const props = super.props
    if (!this.hasAttribute('external') && typeof props.href === 'string') props.external = isExternalHref(props.href)
    return props
  }

  override sync(): void {
    super.sync()
    const hint = this.querySelector('.ty-link__hint')
    if (!hint) return
    const label = this.getAttribute('new-tab-label') ?? String(linkDefinition.props.newTabLabel.default)
    const text = ` ${label}`
    if (hint.textContent !== text) hint.textContent = text
  }
}
