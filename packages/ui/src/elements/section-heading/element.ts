import { TyElement } from '../base.ts'
import { sectionHeadingDefinition } from './definition.ts'

/**
 * `<ty-section-heading>`. All presentation: the host framework renders the
 * anatomy (the heading row with icon, title, subtitle and trailing slot,
 * plus the extra slot under it) and the stylesheet lays it out — the row
 * wraps, so the trailing slot lands under the title when it does not fit.
 * Not a widget — no keyboard or events; the base class builds and patches
 * the anatomy for plain-HTML use (swapping the heading tag when `level`
 * changes) and keeps the bound attributes in step.
 */
export class TySectionHeadingElement extends TyElement {
  static override definition = sectionHeadingDefinition
}
