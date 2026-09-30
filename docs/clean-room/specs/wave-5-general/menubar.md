# Menubar

Wave 5 · navigation · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
A persistent horizontal bar of top-level menus ("File", "Edit", "View") for application-like screens such as editors. Each top-level item opens a menu with actions, checkable options, radio choices and submenus.

## Anatomy
- **Bar**: row of top-level **menu triggers**.
- **Menu** per trigger, using the ActionMenu content model after its gap patch (items with icon, label, shortcut hint, tone; separators; sections with titles; checkbox items; radio groups; submenus).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label | string | required | Accessible name of the bar. |
| menus | { id; label; items: ActionMenuEntry[] }[] | required | Top-level menus and their content (entry types as in the ActionMenu gap patch). |
| onAction | (menuId, itemId) => void | required | Fires for plain items. |
| onCheckedChange | (itemId, checked) => void | none | Checkbox items. |
| onRadioChange | (groupId, value) => void | none | Radio groups. |
| openMenu / onOpenMenuChange | string \| null | null | Which menu is open (controlled or not). |
| disabled | boolean | false | Whole bar. |

## States
All closed; one menu open; submenu open; item focused; items disabled.

## Keyboard and ARIA
- APG **Menubar** pattern. React Aria Components have no menubar primitive; compose RAC `Toolbar`-style roving focus for the bar with RAC `MenuTrigger`, `Menu`, `MenuItem`, `MenuSection`, `SubmenuTrigger` and `Popover` for each menu. (Open question: adopt a RAC menubar if one ships.)
- Bar: `role="menubar"`, one Tab stop; Arrow Left and Right move between triggers (following reading direction), Home and End go to the ends.
- Trigger: `role="menuitem"` with `aria-haspopup="menu"` and `aria-expanded`. Enter, Space or Arrow Down open its menu on the first item; Arrow Up opens on the last.
- While a menu is open, Arrow Left and Right close it and open the neighbouring menu (unless focus is on a submenu trigger, where Arrow Right opens the submenu and Arrow Left in a submenu closes it).
- Pointer: after one menu is opened by a click, hovering another trigger switches menus without another click.
- Escape closes the open menu and returns focus to its trigger; Tab closes everything and leaves the bar.
- Typeahead inside a menu moves to the next item starting with the typed characters.
- Shortcut hints are text only (see KeyboardKey); the Menubar does not register global shortcuts.

## Responsive, touch, motion, forced colours
- Below the medium breakpoint the bar collapses into a single "Menu" trigger that opens the same structure as one menu with submenus per top-level item.
- Triggers and items at least `--ty-control-target` high on touch.
- Bar surface `--ty-surface`, trigger open state `--ty-accent-soft`; menus as ActionMenu.
- Menus open with opacity only, `--ty-dur-quick`, zero under reduced motion.
- Forced colours: open trigger and focused item in `Highlight` / `HighlightText`; checked marks are icons.

## Acceptance tests
- Given focus on "File", when Arrow Right is pressed, then focus moves to "Edit" and no menu opens.
- Given "File" focused, when Arrow Down is pressed, then its menu opens with the first item focused.
- Given the File menu open, when Arrow Right is pressed on a plain item, then File closes and Edit opens.
- Given a submenu trigger focused, when Arrow Right is pressed, then the submenu opens on its first item; Arrow Left closes it.
- Given the File menu opened by click, when the pointer moves over "View", then View's menu replaces it.
- Given a menu open, when Escape is pressed, then it closes and focus is on its trigger.
- Given a checkbox item "Show grid", when activated, then `onCheckedChange("grid", true)` fires and the item reports checked.
- Given a narrow viewport, then a single "Menu" trigger holds every top-level menu as a submenu.
