# Field and FieldGroup

Wave 1 · form · Status: specified

## Purpose
Provides the label, hint, required marker and error wiring around any form control, and groups related controls under a legend.

## Anatomy
- **Field**: wrapper that owns one generated control id.
- **Label**: above the control (§2.10), with an optional required marker.
- **Hint**: help text below the label.
- **Control slot**: any library control (TextField, TextArea, NativeSelect, ListboxSelect, pickers) or a native control.
- **Error**: message below the control, with icon.
- **Fieldset**: groups several Fields; has a **legend** and optional group description.
- **Field stack**: vertical rhythm container for several Fields (spacing from §2.1 "between form fields").

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label | node | none | Label content. |
| hint | node | none | Description. |
| errorMessage | string \| null | none | When set, the control is invalid and the hint is hidden in favour of the error. |
| required | boolean | false | Shows a required marker (text, not only a symbol) and sets `required` on the control. |
| controlId | string | generated | Overrides the generated id; an explicit id on the control wins over both. |
| disabled | boolean | false | Propagates to the control. |
| Fieldset: legend | node | required | Group name. |
| Fieldset: disabled | boolean | false | Disables every control in the group. |
| Fieldset: description | node | none | Group description. |

The Field exposes a context value (control id, description ids, invalid, required, disabled) so controls pick it up without manual wiring.

## States
Default, invalid, required, disabled (group-wide or single).

## Keyboard and ARIA
- No APG widget pattern; follows form labelling guidance (WCAG 1.3.1, 3.3.2).
- RAC: controls use their own `Label`, `Text slot="description"`, `FieldError` slots; the Fieldset maps to a native fieldset with legend (no RAC primitive needed).
- Label `for` points to the control id; the control's `aria-describedby` lists hint and error ids in that order.
- Error message is announced politely when it first appears; it is not a live region permanently.
- Required marker text comes from I18n ("required").

## Responsive, touch, motion, forced colours
- Label always above the control at every width.
- No motion.
- Forced colours: error icon remains visible; legend and label use `CanvasText`.

## Acceptance tests
- Given a Field with a Label and a TextField without ids, when rendered, then the label targets the text field.
- Given an explicit id on the control, when rendered, then the label targets that id.
- Given an explicit `for` on the label, when rendered, then it wins over the context id.
- Given `errorMessage`, when rendered, then the hint is hidden, the error is described and the control is invalid.
- Given `required`, when rendered, then the control is required and the marker is read as text.
- Given a disabled Fieldset, when rendered, then all nested controls are disabled.
- Given a Fieldset with a legend, when inspected, then the group's accessible name is the legend.
- Given a control outside any Field, when rendered, then it still works with its own id.
