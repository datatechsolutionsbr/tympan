# VariableListEditor

Wave 3 · form · Status: specified

## Purpose
Edit an ordered list of unique variable names (flow inputs, outputs, aggregated values) inline, with add, rename and remove.

## Anatomy
- Optional group label.
- Rows: each with a leading marker (ordinal number or a plain dot), the name (static text or an inline text field), and a remove icon button.
- Add row: a text field and an add button; hidden once the maximum is reached.
- Empty note: shown when the list is empty and nothing can be added.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | `string[]` | required | Current names. |
| onChange | `(names: string[]) => void` | required | Called on every add, edit or removal. |
| label | `string` | none | Group label. |
| placeholder | `string` | from i18n adapter | Add field hint. |
| addLabel | `string` | from i18n adapter | Add button text. |
| tone | `'input' \| 'output' \| 'aggregate' \| 'terminal' \| 'neutral'` | `'input'` | Semantic role, mapped to a categorical token for the marker only. |
| numbered | `boolean` | false | Show ordinal numbers instead of dots. |
| editable | `boolean` | false | Names become inline text fields. |
| max | `number` | 0 | Maximum length; 0 means unlimited. |

## States
- Empty, partially filled, full (add row hidden).
- Add field empty: add button disabled.
- Duplicate or blank candidate: not added; the field shows a short error ("already in the list").
- Row focus-within: row boundary emphasised.

## Keyboard and ARIA
- The list is a semantic list (`role="list"`) labelled by the group label; rows are list items. No RAC grid needed.
- Enter in the add field adds the name and keeps focus in the add field.
- Remove buttons have accessible names "Remove ‹name›" from the i18n adapter; after removal focus moves to the next row's remove button, or the previous one, or the add field.
- Inline edit fields are RAC `TextField` with the row's ordinal in their accessible name.
- Additions and removals are announced through a polite live region ("‹name› added", "‹name› removed").

## Responsive, touch, motion, forced colours
- Remove and add controls have 44 px targets.
- The tone is decorative; nothing depends on it. Forced colours: markers render as text or outline.
- No motion.

## Acceptance tests
- Given an empty list, when the user types "region" and presses Enter, then `onChange(["region"])` and the add field is cleared and focused.
- Given ["a"], when the user adds "a", then `onChange` is not called and an error is shown.
- Given `max` 2 and two names, then the add row is not rendered.
- Given `editable`, when row 1 is changed to "b", then `onChange` receives the list with "b" at index 0.
- Given ["a","b"], when "Remove a" is activated, then `onChange(["b"])` and focus lands on "Remove b".
- Given `numbered`, then rows show 1, 2, 3 in order.
