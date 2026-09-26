# TextArea

Wave 1 · form · Status: specified

## Purpose
Multi-line text entry with the same labelling, hint and validation behaviour as TextField.

## Anatomy
- **Label**, **hint**, **text area**, **error message**, optional **character counter**; same placement rules as TextField (§2.10).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label / accessibleLabel | string | none | One of the two is required. |
| hint | node | none | Linked description. |
| errorMessage | string | none | Invalid state and linked message. |
| value / defaultValue | string | none | Controlled or uncontrolled. |
| onChange | (value: string) => void | none | Every edit. |
| rows | number | 3 | Initial visible lines. |
| autoGrow | boolean | false | Grows with content up to `maxRows`, then scrolls. |
| maxRows | number | none | Upper bound for `autoGrow`. |
| resize | 'none' \| 'vertical' | 'vertical' | Manual resize handle. |
| maxLength / showCounter | number / boolean | none / false | Counter as in TextField. |
| monospace | boolean | false | Uses the mono family for code, keys or JSON (§2.2). |
| required, disabled, readOnly, name, placeholder | native | — | Native semantics. |

## States
Empty, filled, focus-visible, hover, invalid, disabled, read-only, over-limit, scrolled (when content exceeds `maxRows`).

## Keyboard and ARIA
- Native multi-line textbox; no APG widget pattern.
- RAC primitive: `TextField` with `TextArea`.
- Enter inserts a newline; the component never submits a form on Enter.
- Tab moves focus out (no tab insertion) unless the host opts into a code-editor mode, which is out of scope here.
- Same ARIA wiring as TextField, including when nested in a Field.

## Responsive, touch, motion, forced colours
- Full width by default; minimum touch height 44 px.
- Auto-grow changes height without animation.
- Reduced transparency: opaque background.
- Forced colours: visible border and system text colours.

## Acceptance tests
- Given a label, when rendered, then the text area's accessible name is the label.
- Given Enter is pressed while focused, then a newline is inserted and no submit event fires.
- Given `autoGrow` with `maxRows=6`, when 10 lines are typed, then height stops at 6 lines and the area scrolls.
- Given `errorMessage`, when rendered, then `aria-invalid` is true and the message is described.
- Given inside a Field with a Label, when rendered without an explicit id, then the label still targets the text area.
- Given `monospace`, when rendered, then the mono family is used.
