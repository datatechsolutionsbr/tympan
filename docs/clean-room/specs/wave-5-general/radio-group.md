# RadioGroup

Wave 5 · forms · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Pick exactly one option from a short, fully visible list. Complements ChoiceGrid (large card choices) with the plain, compact form used inside settings and forms.

## Anatomy
- **Group label** and optional **group description**.
- **Radio** rows: a circular indicator, a label and an optional description line.
- **Error message** (optional) below the group.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label | string | required | Group name (visible). |
| description | text | none | Help text for the group. |
| options | { value; label; description?; disabled? }[] | required | The radios, in order. |
| value / defaultValue | string \| null | null | Selected value. |
| onChange | (value: string) => void | none | Fires when the selection changes. |
| orientation | 'vertical' \| 'horizontal' | 'vertical' | Layout and arrow-key axis. |
| required | boolean | false | Validation requires a choice. |
| errorMessage | string | none | Shows the invalid state. |
| disabled / readOnly | boolean | false | Whole group. |
| name | string | none | Form field name. |

## States
Unselected, selected, hover, pressed, focus-visible, disabled (group or option), read-only, invalid.

## Keyboard and ARIA
- RAC `RadioGroup` and `Radio`; APG **Radio Group** pattern.
- `role="radiogroup"` named by the label and described by the description and error.
- Tab moves into the group onto the selected radio, or the first enabled one when none is selected; Tab again leaves the group.
- Arrow keys move and select (next and previous, wrapping); disabled options are skipped. Horizontal arrows follow reading direction.
- Space selects the focused radio when nothing is selected.
- Required: `aria-required`; invalid: `aria-invalid` and the error message is announced.

## Responsive, touch, motion, forced colours
- The whole row (indicator plus label) is the hit area, at least `--ty-control-target` high on touch.
- Horizontal groups wrap onto new lines when they run out of room; they never scroll sideways.
- Indicator ring in `--ty-line-strong`, selected dot in `--ty-accent`, focus ring `--ty-focus-ring`; error text in `--ty-danger` with an icon.
- The dot appears with opacity only, `--ty-dur-instant`, zero under reduced motion.
- Forced colours: ring in `CanvasText`, selected dot in `Highlight`, disabled in `GrayText`.

## Acceptance tests
- Given three options and none selected, when Tab enters the group, then focus lands on the first option and nothing is selected.
- Given focus on the first option, when Arrow Down is pressed, then the second option is focused and selected and `onChange` fires.
- Given the last option focused, when Arrow Down is pressed, then the first option is selected.
- Given the second option disabled, when Arrow Down is pressed from the first, then the third is selected.
- Given `required` and no choice, when the form validates, then the error message shows and the group has `aria-invalid`.
- Given `orientation="horizontal"` and right-to-left direction, when Arrow Right is pressed, then the previous option is selected.
- Given a description on an option, then the radio's description is that text.
- Given a pointer press on the label text, then that option is selected.
