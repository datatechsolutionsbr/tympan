# ToggleButton and ToggleButtonGroup

Wave 5 · actions · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
A button that stays on or off (bold, pin, star, show grid), and a group of such buttons where one or several can be on at once (text formatting, filters, view options). SegmentedControl stays the choice for "exactly one of a few views"; ToggleButtonGroup covers multiple selection, optional deselection and vertical layout.

## Anatomy
- **ToggleButton**: optional icon, optional label, pressed indicator (fill change plus the icon or label weight).
- **ToggleButtonGroup**: a row or column of ToggleButtons, either spaced apart or joined edge to edge.

## Properties and events
ToggleButton:
| Name | Type | Default | Meaning |
|---|---|---|---|
| isSelected / defaultSelected | boolean | false | Pressed state. |
| onChange | (selected: boolean) => void | none | Fires on toggle. |
| children / icon | text / icon | one required | Visible content. |
| accessibleLabel | string | none | Required when icon only. |
| appearance | 'quiet' \| 'outlined' | 'quiet' | Quiet: no frame until hover or pressed. Outlined: framed. |
| size | 'compact' \| 'regular' \| 'large' | 'regular' | Size step, matching Button. |
| disabled | boolean | false | Not operable. |
| id | string | none | Key inside a group. |

ToggleButtonGroup:
| Name | Type | Default | Meaning |
|---|---|---|---|
| label | string | required | Group name. |
| selectionMode | 'single' \| 'multiple' | 'multiple' | How many can be on. |
| selectedKeys / defaultSelectedKeys | set of ids | empty | Controlled or not. |
| onSelectionChange | (keys) => void | none | Fires on change. |
| disallowEmptySelection | boolean | false | In single mode, the last pressed button cannot be turned off. |
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | Layout and arrow axis. |
| joined | boolean | false | Buttons touch and share borders instead of being spaced. |
| appearance / size | as ToggleButton | 'quiet' / 'regular' | Passed down to every button unless one overrides it. |
| disabled | boolean | false | Whole group. |

## States
Off, on, hover (both), pressed, focus-visible, disabled; in a group, first, middle and last position when joined.

## Keyboard and ARIA
- RAC `ToggleButton` and `ToggleButtonGroup`; APG **Button** (toggle) and **Toolbar** focus behaviour for the group.
- A standalone ToggleButton is a `button` with `aria-pressed`. Enter and Space toggle it.
- The group has `role="radiogroup"` in single mode (buttons become radios with `aria-checked`) and `role="toolbar"` in multiple mode (buttons keep `aria-pressed`), named by `label`.
- Inside the group, one Tab stop; arrow keys move focus (roving), Home and End go to the ends; horizontal arrows follow reading direction. Moving focus does not change selection.
- An icon-only button's name comes from `accessibleLabel`; a Tooltip with the same text is recommended.

## Responsive, touch, motion, forced colours
- Each button's hit area is at least `--ty-control-target` on touch.
- A horizontal group that runs out of room wraps; joined groups do not wrap and must be sized by the host.
- On state: fill `--ty-accent-soft`, content `--ty-on-accent-soft`; outlined frame `--ty-line`, radius `--ty-radius-control` (joined groups round only the outer corners).
- State change animates fill only with `--ty-dur-instant`, zero under reduced motion.
- Forced colours: on state uses `Highlight` background and `HighlightText`; off state keeps a `ButtonText` border so the boundary stays visible. The on state is also conveyed by `aria-pressed` or `aria-checked`, not colour alone.

## Acceptance tests
- Given an off ToggleButton "Bold", when Space is pressed, then `aria-pressed` becomes true and `onChange(true)` fires.
- Given an icon-only ToggleButton without `accessibleLabel`, then a development warning is raised.
- Given a group in multiple mode with Bold and Italic, when both are pressed, then both are on and `onSelectionChange` reports both.
- Given single mode with Left selected, when Centre is pressed, then only Centre is on.
- Given single mode with `disallowEmptySelection` and Centre on, when Centre is pressed again, then it stays on.
- Given focus on the first button of a group, when Arrow Right is pressed, then focus moves to the second and selection does not change.
- Given a group, when Tab is pressed from inside, then focus leaves the group.
- Given `orientation="vertical"`, then Arrow Down moves focus and the group reports vertical orientation.
- Given a joined group, then only the outer corners are rounded and adjacent borders do not double.
