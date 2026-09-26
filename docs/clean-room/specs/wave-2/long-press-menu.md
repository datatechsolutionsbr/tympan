Wave 2 · Overlay · Status: specified

# LongPressMenu

## Purpose
Wraps a tile (app icon, card) so a normal tap performs its primary action while a long press, right click or keyboard shortcut opens a small menu of secondary actions.

## Anatomy
- **Trigger**: the wrapped content, one focusable element.
- **Menu**: a floating list of items (icon and label), anchored to the trigger; items may have danger tone.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| children | ReactNode | required | Trigger content. |
| items | { label: string; icon?: ReactNode; href?: string; onAction?: () => void; tone?: 'neutral' or 'danger' }[] | required | Menu items. |
| href | string | none | Primary navigation on tap. |
| onTap | () => void | none | Primary action on tap (wins over href). |
| tapOpensMenu | boolean | false | When true a tap opens the menu instead of the primary action. |
| label | string | required | Accessible name of the trigger. |

## States
Rest; pressed (subtle, opacity only); open; item focused; closing.

## Keyboard and ARIA
- Trigger is a button (or link when `href`); Enter/Space runs the primary action (or opens the menu when `tapOpensMenu`).
- Shift+F10 and the context-menu key open the menu; the trigger exposes `aria-haspopup="menu"` and a description telling that more actions exist.
- Menu follows APG "Menu Button" / "Menu": arrow keys move, Home/End jump, Escape closes and returns focus to the trigger, Enter activates.
- RAC `MenuTrigger` with a custom long-press trigger (`useLongPress`) and `Menu`/`MenuItem`, `Popover`.
- Click outside closes; activating an item closes then runs it, navigating through the router adapter.

## Responsive, touch, motion, forced colours
- Long press uses the platform's standard duration (RAC default); a haptic tick on open.
- Menu items are 44 px tall.
- Reduced motion: menu appears without scale or translate.
- Reduced transparency: opaque menu. Forced colours: menu border and focused item via `Highlight`.

## Acceptance tests
- Given a short tap and `onTap`, then `onTap` fires and the menu stays closed.
- Given a long press, then the menu opens and the primary action does not fire.
- Given keyboard focus, when Shift+F10 is pressed, then the menu opens with the first item focused.
- Given the menu open, when Escape is pressed, then it closes and focus returns to the trigger.
- Given an item with `href`, when activated, then the router adapter navigates to it.
- Given right click, then the native context menu is suppressed and the menu opens.

## Open questions
- The fork has no keyboard way to open the menu when tap performs the primary action; the shortcut is new.
