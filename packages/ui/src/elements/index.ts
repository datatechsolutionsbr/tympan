// Tympan custom elements: one definition per component, consumed by React
// (generated wrappers in ./react), by Rust/Dioxus (generated bindings in the
// tympan-dioxus crate) and by plain HTML. See docs/design/single-source-components.md.

import { defineTympanElement } from './base.ts'
import { TyButtonElement } from './button/element.ts'
import { TyCheckboxElement } from './checkbox/element.ts'
import { TyDrawerElement } from './drawer/element.ts'
import { TyInlineNoticeElement } from './inline-notice/element.ts'
import { TyLinkElement } from './link/element.ts'
import { TyModalElement } from './modal/element.ts'
import { TyPopoverElement } from './popover/element.ts'
import { TyNativeSelectElement } from './native-select/element.ts'
import { TySeparatorElement } from './separator/element.ts'
import { TySkeletonElement } from './skeleton/element.ts'
import { TySpinnerElement } from './spinner/element.ts'
import { TyStatusPillElement } from './status-pill/element.ts'
import { TySurfaceElement } from './surface/element.ts'
import { TySwitchElement } from './switch/element.ts'
import { TyTagElement } from './tag/element.ts'
import { TyTextAreaElement } from './text-area/element.ts'
import { TyTextFieldElement } from './text-field/element.ts'
import { TyThemePaletteElement } from './theme-palette/element.ts'

export { TyElement, defineTympanElement } from './base.ts'
export { TyButtonElement } from './button/element.ts'
export { TyCheckboxElement } from './checkbox/element.ts'
export { TyDrawerElement } from './drawer/element.ts'
export { TyInlineNoticeElement } from './inline-notice/element.ts'
export { TyLinkElement } from './link/element.ts'
export { TyModalElement } from './modal/element.ts'
export { TyPopoverElement } from './popover/element.ts'
export { TyNativeSelectElement } from './native-select/element.ts'
export { TySeparatorElement } from './separator/element.ts'
export { TySkeletonElement } from './skeleton/element.ts'
export { TySpinnerElement } from './spinner/element.ts'
export { TyStatusPillElement } from './status-pill/element.ts'
export { TySurfaceElement } from './surface/element.ts'
export { TySwitchElement } from './switch/element.ts'
export { TyTagElement } from './tag/element.ts'
export { TyTextAreaElement } from './text-area/element.ts'
export { TyTextFieldElement } from './text-field/element.ts'
export { TyThemePaletteElement } from './theme-palette/element.ts'
export { buttonDefinition } from './button/definition.ts'
export { checkboxDefinition } from './checkbox/definition.ts'
export { drawerDefinition } from './drawer/definition.ts'
export { inlineNoticeDefinition } from './inline-notice/definition.ts'
export { linkDefinition } from './link/definition.ts'
export { modalDefinition } from './modal/definition.ts'
export { nativeSelectDefinition } from './native-select/definition.ts'
export { separatorDefinition } from './separator/definition.ts'
export { skeletonDefinition } from './skeleton/definition.ts'
export { spinnerDefinition } from './spinner/definition.ts'
export { statusPillDefinition } from './status-pill/definition.ts'
export { surfaceDefinition } from './surface/definition.ts'
export { switchDefinition } from './switch/definition.ts'
export { tagDefinition } from './tag/definition.ts'
export { textAreaDefinition } from './text-area/definition.ts'
export { textFieldDefinition } from './text-field/definition.ts'
export { themePaletteDefinition } from './theme-palette/definition.ts'
export { renderAnatomy, renderElement } from './anatomy.ts'
export type { ElementDefinition, PropDef, EventDef, AnatomyNode, ElementNode, Example } from './definition.ts'
export type { Appearance, Mode as ThemeMode, Density as ThemeDensity } from './theme-palette/model.ts'

/** Register every Tympan custom element (idempotent; a no-op outside a browser). */
export function defineTympanElements(): void {
  defineTympanElement(TyButtonElement)
  defineTympanElement(TyCheckboxElement)
  defineTympanElement(TyDrawerElement)
  defineTympanElement(TyInlineNoticeElement)
  defineTympanElement(TyLinkElement)
  defineTympanElement(TyModalElement)
  defineTympanElement(TyPopoverElement)
  defineTympanElement(TyNativeSelectElement)
  defineTympanElement(TySeparatorElement)
  defineTympanElement(TySkeletonElement)
  defineTympanElement(TySpinnerElement)
  defineTympanElement(TyStatusPillElement)
  defineTympanElement(TySurfaceElement)
  defineTympanElement(TySwitchElement)
  defineTympanElement(TyTagElement)
  defineTympanElement(TyTextAreaElement)
  defineTympanElement(TyTextFieldElement)
  defineTympanElement(TyThemePaletteElement)
}
