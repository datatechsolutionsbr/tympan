# ButtonGroup

Wave 5 · actions · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Join related controls into one visual unit: a split button (main action plus a menu of variants), a pager ("Previous" / "Next"), a field with an attached action ("Search" input plus button), or a row of quiet actions with a text caption. Only layout and grouping semantics; each child keeps its own behaviour.

## Anatomy
- **Group**: a row or column of children touching edge to edge.
- Children: Button, ActionMenu trigger, TextField or InputGroup, ListboxSelect trigger, a **text segment** (a static label cell such as a unit or "https://"), or a **divider**.
- Groups can be nested side by side with a gap between them (for example two groups in a toolbar).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label | string | required when children are only icons | Accessible name of the group. |
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | Direction. |
| size | 'compact' \| 'regular' \| 'large' | inherits | Passed to child buttons and fields that do not set their own. |
| variant | Button variant | inherits | Passed to child buttons that do not set their own. |
| disabled | boolean | false | Disables every child. |
| children | nodes | required | Parts listed above. |
| ButtonGroupText (part) | text node | — | Static cell with the group's height and frame. |
| ButtonGroupDivider (part) | — | — | A thin line between two children of the same variant (used when their borders would not show). |

## States
The group has no state of its own; children keep theirs. Position states (first, middle, last, only) drive which corners are rounded.

## Keyboard and ARIA
- `role="group"` named by `label` (or by a visible caption through `aria-labelledby`).
- Each child keeps its own Tab stop and keyboard behaviour; the group does not add roving focus (use ToggleButtonGroup or a toolbar when a single Tab stop is wanted).
- A split button is two buttons: the main action and a menu trigger named "More {action} options" (from i18n) with `aria-haspopup="menu"`.
- Text segments are plain text, not focusable; when a text segment labels a field (for example "https://"), it is linked to that field as part of its description.

## Responsive, touch, motion, forced colours
- Every child keeps a hit area of at least `--ty-control-target` on touch.
- Horizontal groups never wrap; the host chooses vertical orientation or a narrower set on small screens.
- Only the outer corners use `--ty-radius-control`; inner edges are square; shared borders are drawn once with `--ty-line`. Focused children rise above neighbours so the whole focus ring `--ty-focus-ring` is visible.
- Text segment fill `--ty-surface-sunken`, text `--ty-ink-2`.
- No motion of its own.
- Forced colours: every child keeps a `ButtonText` border; dividers in `CanvasText`.

## Acceptance tests
- Given a horizontal group of three buttons, then only the first's start corners and the last's end corners are rounded.
- Given a group with `label="Text alignment"`, then the group role is named "Text alignment".
- Given a split button, when Tab is pressed from the main action, then focus moves to the menu trigger, which has `aria-haspopup="menu"`.
- Given `disabled` on the group, then every child is disabled.
- Given `size="compact"` on the group and no size on a child button, then the child renders compact.
- Given a focused middle button, then its focus ring is not clipped by its neighbours.
- Given right-to-left direction, then the rounded corners follow the reading direction.
