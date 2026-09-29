// Tympan custom elements: one definition per component, consumed by React
// (generated wrappers in ./react) and by plain HTML. See docs/design/single-source-components.md.

import { defineTympanElement } from './base.ts'
import { TyWheelPickerElement } from './wheel-picker/element.ts'
import { TyToastElement } from './toast/element.ts'
import { TyTagFieldElement } from './tag-field/element.ts'
import { TyTabsElement } from './tabs/element.ts'
import { TySkipLinkElement } from './skip-link/element.ts'
import { TySegmentedControlElement } from './segmented-control/element.ts'
import { TySectionHeadingElement } from './section-heading/element.ts'
import { TyProgressBarElement } from './progress-bar/element.ts'
import { TyPageHeaderElement } from './page-header/element.ts'
import { TyNotificationCenterElement } from './notification-center/element.ts'
import { TyMarkdownViewElement } from './markdown-view/element.ts'
import { TyHeadingElement } from './heading/element.ts'
import { TyDataTableElement } from './data-table/element.ts'
import { TyCurrencyFieldElement } from './currency-field/element.ts'
import { TyCommandPaletteElement } from './command-palette/element.ts'
import { TyBreadcrumbsElement } from './breadcrumbs/element.ts'
import { TyBrandWordmarkElement } from './brand-wordmark/element.ts'
import { TyAvatarElement } from './avatar/element.ts'
import { TyActionMenuElement } from './action-menu/element.ts'
import { TyButtonElement } from './button/element.ts'
import { TyCheckboxElement } from './checkbox/element.ts'
import { TyDrawerElement } from './drawer/element.ts'
import { TyGradientMarkElement } from './gradient-mark/element.ts'
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
export { TyActionMenuElement } from './action-menu/element.ts'
export { TyAvatarElement } from './avatar/element.ts'
export { TyBrandWordmarkElement } from './brand-wordmark/element.ts'
export { TyBreadcrumbsElement } from './breadcrumbs/element.ts'
export { TyCommandPaletteElement } from './command-palette/element.ts'
export { TyCurrencyFieldElement } from './currency-field/element.ts'
export { TyDataTableElement } from './data-table/element.ts'
export { TyHeadingElement } from './heading/element.ts'
export { TyMarkdownViewElement } from './markdown-view/element.ts'
export { TyNotificationCenterElement } from './notification-center/element.ts'
export { TyPageHeaderElement } from './page-header/element.ts'
export { TyProgressBarElement } from './progress-bar/element.ts'
export { TySectionHeadingElement } from './section-heading/element.ts'
export { TySegmentedControlElement } from './segmented-control/element.ts'
export { TySkipLinkElement } from './skip-link/element.ts'
export { TyTabsElement } from './tabs/element.ts'
export { TyTagFieldElement } from './tag-field/element.ts'
export { TyToastElement } from './toast/element.ts'
export { TyWheelPickerElement } from './wheel-picker/element.ts'
export { TyButtonElement } from './button/element.ts'
export { TyCheckboxElement } from './checkbox/element.ts'
export { TyDrawerElement } from './drawer/element.ts'
export { TyGradientMarkElement } from './gradient-mark/element.ts'
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
export { brandWordmarkDefinition } from './brand-wordmark/definition.ts'
export { buttonDefinition } from './button/definition.ts'
export { checkboxDefinition } from './checkbox/definition.ts'
export { drawerDefinition } from './drawer/definition.ts'
export { gradientMarkDefinition } from './gradient-mark/definition.ts'
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
  defineTympanElement(TyActionMenuElement)
  defineTympanElement(TyAvatarElement)
  defineTympanElement(TyBrandWordmarkElement)
  defineTympanElement(TyBreadcrumbsElement)
  defineTympanElement(TyCommandPaletteElement)
  defineTympanElement(TyCurrencyFieldElement)
  defineTympanElement(TyDataTableElement)
  defineTympanElement(TyHeadingElement)
  defineTympanElement(TyMarkdownViewElement)
  defineTympanElement(TyNotificationCenterElement)
  defineTympanElement(TyPageHeaderElement)
  defineTympanElement(TyProgressBarElement)
  defineTympanElement(TySectionHeadingElement)
  defineTympanElement(TySegmentedControlElement)
  defineTympanElement(TySkipLinkElement)
  defineTympanElement(TyTabsElement)
  defineTympanElement(TyTagFieldElement)
  defineTympanElement(TyToastElement)
  defineTympanElement(TyWheelPickerElement)
  defineTympanElement(TyButtonElement)
  defineTympanElement(TyCheckboxElement)
  defineTympanElement(TyDrawerElement)
  defineTympanElement(TyGradientMarkElement)
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
