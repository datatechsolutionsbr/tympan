# Checkbox

Wave 1 · form · Status: specified

## Purpose
Selects or deselects an option that takes effect on submit, shown as a whole-row tile with label and optional description.

## Anatomy
- **Row** (the entire tile is the click target).
- **Indicator** box with check mark (or dash when indeterminate).
- **Label** and optional **description**.
- **Checkbox group** (optional): a labelled set of rows.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| isSelected / defaultSelected | boolean | false | Checked state. |
| isIndeterminate | boolean | false | Mixed state for "select all" rows. |
| onChange | (isSelected: boolean) => void | none | Fires with the next value. |
| label | string | required unless `accessibleLabel` | Visible label. |
| accessibleLabel | string | none | Name when the visible text lives elsewhere (for example, the leading indicator of a list row). |
| description | node | none | Secondary text linked as description. |
| appearance | 'tile' \| 'bare' | 'tile' | Tile draws a surface around the row; bare is indicator plus text. |
| disabled | boolean | false | Not operable. |
| errorMessage | string | none | Invalid state (e.g. a required consent). |
| name / value | string | none | Form submission. |

Group properties: `label`, `value: string[]`, `onChange(values)`, `orientation`, `errorMessage`.

## States
Unchecked, checked, indeterminate, hover, focus-visible (ring on the row, §2.6), disabled, invalid. Checked tile uses the accent-soft surface of §2.3 plus the visible check; never colour alone.

## Keyboard and ARIA
- APG pattern: **Checkbox** (dual-state and mixed).
- RAC primitives: `Checkbox` and `CheckboxGroup`.
- Space toggles; Tab moves between checkboxes.
- The native input remains in the accessibility tree; the drawn indicator is decorative.
- Indeterminate exposes `aria-checked="mixed"`.

## Responsive, touch, motion, forced colours
- Row height at least 44 px.
- Check mark appears with the instant duration (§2.7); no motion under reduced motion.
- Forced colours: indicator bordered with `CanvasText`, check mark in `CanvasText` (or `HighlightText` on `Highlight`).

## Acceptance tests
- Given a label, when the row text is clicked, then the checkbox toggles and `onChange` gets the next value.
- Given focus and Space, then it toggles.
- Given no label but `accessibleLabel`, when rendered, then the accessible name equals `accessibleLabel`.
- Given `isIndeterminate`, when rendered, then the state is mixed.
- Given `disabled`, when clicked, then nothing changes.
- Given a group with value ["a"], when "b" is checked, then `onChange` receives ["a","b"].
- Given axe, when checked, unchecked and invalid, then no violations are reported.
