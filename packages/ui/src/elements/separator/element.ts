import { TyElement } from '../base.ts'
import { separatorDefinition } from './definition.ts'

/**
 * `<ty-separator>`. All presentation: the host framework renders the anatomy
 * (the rule, or two strokes around a readable caption) and the stylesheet
 * draws it, including the forced-colours fallback. Not a widget — no
 * keyboard or events; the base class builds and patches the anatomy for
 * plain-HTML use and keeps the bound attributes in step.
 */
export class TySeparatorElement extends TyElement {
  static override definition = separatorDefinition
}
