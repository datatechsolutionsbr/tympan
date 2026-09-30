import { TyElement } from '../base.ts'
import { brandWordmarkDefinition } from './definition.ts'

/**
 * `<ty-brand-wordmark>`. All presentation: the host framework renders the
 * anatomy (ink text, gradient accent) and the stylesheet draws it, including
 * the forced-colours fallback. Not a widget — no keyboard or events; the
 * base class builds and patches the anatomy for plain-HTML use and keeps the
 * bound attributes in step.
 */
export class TyBrandWordmarkElement extends TyElement {
  static override definition = brandWordmarkDefinition
}
