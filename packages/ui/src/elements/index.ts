// Tympan custom elements: one definition per component, consumed by React
// (generated wrappers in ./react), by Rust/Dioxus (generated bindings in the
// tympan-dioxus crate) and by plain HTML. See docs/design/single-source-components.md.

import { defineTympanElement } from './base.ts'
import { TyButtonElement } from './button/element.ts'
import { TySwitchElement } from './switch/element.ts'
import { TyThemePaletteElement } from './theme-palette/element.ts'

export { TyElement, defineTympanElement } from './base.ts'
export { TyButtonElement } from './button/element.ts'
export { TySwitchElement } from './switch/element.ts'
export { TyThemePaletteElement } from './theme-palette/element.ts'
export { buttonDefinition } from './button/definition.ts'
export { switchDefinition } from './switch/definition.ts'
export { themePaletteDefinition } from './theme-palette/definition.ts'
export { renderAnatomy, renderElement } from './anatomy.ts'
export type { ElementDefinition, PropDef, EventDef, AnatomyNode, ElementNode, Example } from './definition.ts'
export type { Appearance, Mode as ThemeMode, Density as ThemeDensity } from './theme-palette/model.ts'

/** Register every Tympan custom element (idempotent; a no-op outside a browser). */
export function defineTympanElements(): void {
  defineTympanElement(TyButtonElement)
  defineTympanElement(TySwitchElement)
  defineTympanElement(TyThemePaletteElement)
}
