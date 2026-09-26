# TextField

Wave 1 · form · Status: specified

## Purpose
Single-line text entry with label, hint, validation message and optional adornments, in three modes: plain, search and password.

## Anatomy
- **Label** (above the input, §2.10), **hint** (below the label), **input**, **error message** (below the input, with icon).
- **Leading adornment** (optional decorative icon; search mode shows a magnifier by default).
- **Trailing actions** (optional): clear button, reveal-password button, success mark.
- **Character counter** (optional), below the input on the end side.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| mode | 'text' \| 'search' \| 'password' | 'text' | Search adds the magnifier and clear action and uses a search input type; password adds the reveal action. |
| inputType | 'text' \| 'email' \| 'url' \| 'tel' \| 'number' | 'text' | Native type for `mode="text"`. |
| label | string | none | Visible label; if omitted `accessibleLabel` is required. |
| accessibleLabel | string | none | Name when no visible label. |
| hint | node | none | Help text linked via `aria-describedby`. |
| errorMessage | string | none | Marks the field invalid and is linked via `aria-describedby`. |
| successMessage | string | none | Confirms a valid value; shown only when there is no error. |
| value / defaultValue | string | none | Controlled or uncontrolled value. |
| onChange | (value: string) => void | none | Fires on every edit with the string value. |
| clearable | boolean | true in search, else false | Shows the clear action when non-empty. |
| onClear | () => void | none | Fires after clearing; value becomes empty and focus returns to the input. |
| revealable | boolean | true in password | Shows the reveal action. |
| maxLength / showCounter | number / boolean | none / false | Counter shows "n of max"; over-limit is an invalid state. |
| appearance | 'outlined' \| 'filled' | 'outlined' | Two surface treatments from §2.5/§2.10. |
| leadingIcon | node | none | Decorative icon. |
| required, disabled, readOnly, autoComplete, name, placeholder | native | — | Native semantics. |
| onFocus / onBlur | handlers | none | Pass-through. |

## States
Empty, filled, focus-visible (§2.6), hover, invalid (border and message with icon; never colour alone), valid/success, disabled, read-only (sunken surface, still focusable and copyable), password revealed / hidden, over-limit.

## Keyboard and ARIA
- No dedicated APG pattern (native textbox); search mode follows the **Search landmark** guidance when used as a page search.
- RAC primitives: `TextField` (with `Label`, `Input`, `Text slot="description"`, `FieldError`) and `SearchField` for search mode.
- Escape in search mode clears the value (RAC `SearchField` behaviour).
- Clear and reveal actions are real buttons with names from the I18n adapter ("Clear", "Show password" / "Hide password"); reveal uses `aria-pressed`.
- Invalid: `aria-invalid="true"`; error text announced politely when it appears.
- If placed inside a Field, the id and descriptions come from the Field (see field.md).

## Responsive, touch, motion, forced colours
- Visible height and touch height per §2.10; trailing action buttons each have a 44 × 44 px hit area.
- Font size at least 16 px on touch devices to avoid browser zoom on focus.
- Appear/disappear of trailing actions uses the quick duration of §2.7; none under reduced motion.
- Reduced transparency: opaque field background.
- Forced colours: `Field`/`FieldText` system colours, border always visible, invalid state also marked by the icon.

## Acceptance tests
- Given a label, when rendered, then the input's accessible name equals the label.
- Given `errorMessage`, when rendered, then `aria-invalid` is true and the message is in `aria-describedby`.
- Given search mode with text, when Escape is pressed, then the value clears and `onClear` fires.
- Given the clear action is pressed, then focus returns to the input.
- Given password mode, when the reveal action is pressed, then the text is visible and the action reports pressed; pressing again hides it.
- Given `maxLength=10` and `showCounter`, when 11 characters are typed, then the field is invalid and the counter says so in text.
- Given `readOnly`, when focused, then text can be selected but not edited.
- Given axe, when every mode renders with and without errors, then no violations are reported.
