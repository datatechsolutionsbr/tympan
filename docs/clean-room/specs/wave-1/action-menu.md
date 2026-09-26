# ActionMenu

Wave 1 · overlay · Status: specified

## Purpose
A list of commands shown either from a trigger button or at a pointer position (context invocation), for acting on the item under the pointer or the current selection.

## Anatomy
- **Trigger** (button mode): a button, often icon-only ("more actions").
- **Menu surface**: floating list.
- **Item**: optional leading icon, label, optional keyboard hint.
- **Separator**: divides groups.
- **Section** (optional): named group of items.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| items | Array<Item \| Separator \| Section> | required | entries in order |
| Item.id | string | required | stable key |
| Item.label | string | required | visible text and accessible name |
| Item.icon | icon component | none | decorative leading icon |
| Item.tone | 'default' \| 'danger' | 'default' | danger marks destructive commands (icon and wording, not colour alone) |
| Item.disabled | boolean | false | item is shown but cannot be activated |
| Item.shortcut | string | none | displayed hint only |
| onAction | (id: string) => void | required | called when an item is activated; menu then closes |
| mode | 'trigger' \| 'context' | 'trigger' | how the menu opens |
| trigger | node | none | trigger element (trigger mode) |
| position | { x: number; y: number } | none | viewport point for context mode |
| open / onOpenChange | boolean / (open) => void | uncontrolled | open state |
| label | string | required | accessible name of the menu |

## States
- closed, open; item idle, hover, focus-visible, pressed, disabled.
- In context mode the menu is clamped so it never overflows the viewport.

## Keyboard and ARIA
- APG pattern: **Menu Button** (trigger mode) and **Menu** (both modes). RAC primitive: `MenuTrigger` + `Popover` + `Menu` + `MenuItem` + `Separator` + `MenuSection`.
- Opening moves focus to the first enabled item (ArrowUp from trigger: last item).
- ArrowDown/ArrowUp move (wrapping), Home/End jump, typing a character moves to the next item starting with it.
- Enter/Space activate; Escape closes and returns focus to the trigger (or to the element that received the context request).
- Context mode must also open from the keyboard: Shift+F10 and the ContextMenu key on the focused target.
- Disabled items are focusable-skipped and announced as disabled.

## Responsive, touch, motion, forced colours
- Each item row is at least 44 px tall on touch layouts (below 1024 px) and the trigger has a 44 × 44 px hit area.
- On touch, context mode opens on long press of the target (see LongPressMenu for the richer variant).
- Surface: elevation level 3, `--fk-radius-card`; opening with `--fk-dur-quick`; reduced motion: instant.
- Forced colours: focused item uses `Highlight`/`HighlightText`; separators remain visible.

## Acceptance tests
- Given a trigger menu, When the trigger is activated with Enter, Then a `menu` is shown and the first enabled item is focused.
- Given an open menu, When ArrowDown is pressed on the last item, Then focus wraps to the first.
- Given an item, When it is activated, Then `onAction(id)` is called once and the menu closes.
- Given a disabled item, When clicked, Then `onAction` is not called.
- Given context mode at a point near the bottom-right corner, Then the whole menu is inside the viewport.
- Given an open menu, When Escape is pressed or the user clicks outside, Then it closes and focus returns to the origin.
- Given a focused list row with a context menu, When Shift+F10 is pressed, Then the menu opens.

## Open questions
- The fork's context menu had no arrow-key navigation or menu roles; the new one must follow the APG Menu pattern.
