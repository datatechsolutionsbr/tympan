# ContextMenu

Wave 5 · overlays · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Wrap any region (a card, a row, a canvas node, an image) so that a secondary-click, the keyboard context-menu key, or a long press opens a menu of actions for that region at the pointer. It unifies ActionMenu's context mode (pointer) and LongPressMenu (touch) into one region component, with the full menu content model.

## Anatomy
- **Region**: the wrapped content; it keeps its own role and primary action.
- **Menu**: positioned at the pointer (or at the region's start edge for keyboard and touch), with the ActionMenu content model after its gap patch: items (icon, label, shortcut hint, tone), separators, titled sections, checkbox items, radio groups and submenus.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| children | node | required | The region. |
| items | ActionMenuEntry[] | required | Menu content. |
| label | string | required | Accessible name of the menu ("Actions for {name}"). |
| onAction | (id) => void | required | Plain item chosen. |
| onCheckedChange / onRadioChange | as Menubar | none | Stateful items. |
| onOpenChange | (open) => void | none | Opening and closing. |
| longPress | boolean | true | Long press opens the menu on touch. |
| disabled | boolean | false | The platform's native menu shows instead. |

## States
Closed, open at pointer, open from keyboard, open from long press, submenu open.

## Keyboard and ARIA
- RAC `MenuTrigger` with context trigger, `Menu`, `SubmenuTrigger`, `Popover`; APG **Menu** pattern for the content.
- Opens on secondary click, on the Context Menu key and on Shift+F10 while the region or an element inside it has focus. Focus moves to the first enabled item.
- Arrow Up and Down move (wrapping); Home and End; typeahead; Enter and Space activate; Arrow Right (reading-direction aware) opens a submenu and Arrow Left closes it; Escape closes and returns focus to the element that had focus before opening.
- The region itself is not given a menu role; hosts should also expose the same actions through a visible "More actions" button for discoverability (recommended, not enforced).
- When opened by pointer, the native context menu is suppressed only inside the region.

## Responsive, touch, motion, forced colours
- Long press (platform-typical duration) opens the menu with a haptic tick through the haptics adapter; moving the finger beyond the slop cancels it; text selection inside the region is not blocked unless the host opts in.
- On narrow viewports the menu opens as a bottom Drawer listing the same items (submenus become nested pages with a back action).
- Menu surface, spacing and tokens as ActionMenu; item hit area at least `--ty-control-target`.
- Opacity-only entrance with `--ty-dur-quick`, zero under reduced motion.
- Forced colours as ActionMenu.

## Acceptance tests
- Given a region, when it is secondary-clicked at a point, then the menu opens at that point with the first item focused.
- Given focus inside the region, when Shift+F10 is pressed, then the menu opens anchored to the region.
- Given a touch long press, then the menu opens and a haptic tick is requested; given the finger moves away before the press completes, then nothing opens.
- Given a submenu "Move to", when Arrow Right is pressed on it, then its items show and the first is focused.
- Given a radio group "Sort by" with "Name" checked, when "Date" is chosen, then `onRadioChange("sort", "date")` fires and Date reports checked.
- Given the menu open, when Escape is pressed, then focus returns to the element that had it.
- Given `disabled`, when secondary-clicked, then the native menu appears.
- Given a narrow viewport, when opened, then the items are shown in a Drawer.
