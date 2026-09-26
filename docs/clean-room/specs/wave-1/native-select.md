# NativeSelect

Wave 1 · form · Status: specified

## Purpose
Chooses one value from a short list using the platform's own select control, styled to match the field family.

## Anatomy
- **Label**, **hint**, **select control** with a **chevron** adornment, **error message**.
- **Placeholder option**: an empty, disabled first option when no value is chosen.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label / accessibleLabel | string | none | One is required. |
| hint | node | none | Linked description. |
| errorMessage | string | none | Invalid state. |
| options | Array<string \| { value: string; label: string; disabled?: boolean }> | [] | Items; plain strings use the same text for value and label. |
| groups | Array<{ label: string; options: … }> | none | Optional option groups. |
| value / defaultValue | string | none | Controlled or uncontrolled. |
| onChange | (value: string) => void | none | Fires with the new value. |
| placeholder | string | from I18n ("Select…") | Text of the empty option. |
| touchPresentation | 'native' \| 'wheel' | 'native' | On narrow touch screens, `wheel` opens a bottom Drawer with a Wheel Picker (wave 2) instead of the OS list, while a hidden native select keeps form submission working. |
| required, disabled, name | native | — | Native semantics. |

## States
Placeholder shown, value chosen, focus-visible, hover, invalid, disabled, open (native), and for wheel presentation: drawer open, drawer closed.

## Keyboard and ARIA
- Native select semantics; no APG widget pattern needed.
- No RAC primitive for the native mode; custom (native element). Wheel presentation uses RAC `Dialog` inside a `Modal` for the drawer and the Wheel Picker's own pattern.
- The label is always programmatically associated, even without a caller id (generated id), and a Field ancestor's id is honoured.
- Error message has `role="alert"` only when it first appears, then stays as a description.
- Wheel presentation: the trigger is a button whose name is "label: current value"; the drawer has a Done button and closes on Escape, returning focus to the trigger.

## Responsive, touch, motion, forced colours
- Visible and touch heights per §2.10.
- Wheel presentation only below 640 px and with a coarse pointer; otherwise native.
- Chevron does not animate under reduced motion.
- Forced colours: system `Field` colours and a visible border.

## Acceptance tests
- Given string options, when rendered, then each becomes an option with value equal to label.
- Given an option flagged disabled, when rendered, then it cannot be chosen.
- Given no value and a placeholder, when rendered, then the first option is empty, disabled and shows the placeholder.
- Given no id, when rendered with a label, then the label targets the select.
- Given a controlled value, when the parent changes it, then the select shows the new value.
- Given wheel presentation on a narrow touch screen, when the trigger is pressed, then a drawer with a wheel opens; choosing a value calls `onChange` and Done closes it, returning focus.
- Given `disabled`, when the trigger is pressed, then nothing opens.
