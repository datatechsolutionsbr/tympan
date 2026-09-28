import { TyElement } from '../base.ts'
import { headingDefinition } from './definition.ts'

/**
 * `<ty-heading>`. All presentation: the host framework renders the anatomy
 * (the optional eyebrow and the heading of the chosen level) and the
 * stylesheet draws the type steps, including the narrow h1 and the
 * forced-colours fallback. Not a widget — no keyboard or events; the base
 * class builds and patches the anatomy for plain-HTML use (swapping the
 * heading tag when `level` changes) and keeps the bound attributes in step.
 */
export class TyHeadingElement extends TyElement {
  static override definition = headingDefinition
}
