# ChipGroup

Wave 2 · form · Status: specified

## Purpose
Multiple selection from a known set of short items shown as chips, with optional select-all, clear, and the option to add custom items by typing.

## Anatomy
- Summary bar (optional): "N selected" count, "Select all" and "Clear" actions.
- Chip row: one checkable chip per item (optional short code before the name, optional colour marker).
- Remove control on chips the person created.
- Add field (optional) at the end of the row.
- Loading text or empty text in place of the row.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| items | { id: string; name: string; code?: string; marker?: categorical token; custom?: boolean }[] | required | Available chips. |
| selectedIds | string[] | required | Selected item ids (controlled). |
| onSelectionChange | (ids: string[]) => void | required | New selection. |
| allowCustom | boolean | false | Shows the add field. |
| onItemsChange | (items) => void | none | Required with `allowCustom`; receives the item list after an add or a removal. |
| showSummary | boolean | true | Shows the count and the two bulk actions. |
| loading | boolean | false | Shows loading text instead of chips. |
| label | string | required | Group name. |
| strings | { selected, selectAll, clear, empty, loading, addPlaceholder, addLabel, remove(name) } | host i18n | All visible and accessible text. |

## Behaviour
- Toggling a chip adds or removes its id.
- "Select all" selects every item; "Clear" empties the selection.
- Typing in the add field and pressing Enter, typing a comma, or leaving the field commits the draft. A draft containing commas adds several items at once. Each new item gets an id derived from its text; an entry matching an existing id is not duplicated but becomes selected. New items are selected automatically and marked as custom.
- Backspace in an empty add field removes the most recent custom item.
- Only custom items can be removed; removing one also deselects it.

## States
Chip unchecked, checked (accent border, check glyph, stronger text), hover, focus-visible, disabled; group loading; group empty.

## Keyboard and ARIA
- APG pattern: Checkbox (group of checkboxes). Backed by RAC `CheckboxGroup` with each chip a `Checkbox`; the add field is a RAC `TextField`.
- Group name from `label`; the summary count is in a polite live region.
- Remove controls are buttons named "Remove {name}".

## Responsive, touch, motion, forced colours
- Chips wrap; each chip and remove control has a 44 × 44 hit area.
- No motion except colour change.
- Forced colours: checked chips show a system-highlight border and the check glyph.

## Acceptance tests
- Given items A, B and none selected, When chip A is activated, Then onSelectionChange receives [A].
- Given the summary is shown, When "Select all" is activated, Then all ids are reported; When "Clear" is activated, Then [] is reported.
- Given allowCustom, When the person types "x, y" and presses Enter, Then two custom items are added and both are selected.
- Given an existing item "alpha", When "Alpha" is typed and committed, Then no new item is added and "alpha" becomes selected.
- Given a custom item exists, When Backspace is pressed in the empty add field, Then that item is removed and deselected.
- Given a catalogue item (not custom), When rendered, Then it has no remove control.
- Given loading=true, When rendered, Then the loading text is shown and no chips.
