# InputGroup

Wave 5 · forms · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
A text input or text area inside one frame with add-ons at its start, end, above or below: icons, prefix and suffix text ("R$", ".com"), inline buttons (copy, send, voice), a counter, a spinner, or a toolbar row under a multi-line composer. TextField covers the fixed cases (leading icon, clear, reveal); InputGroup is the general tool, for example the chat composer.

## Anatomy
- **Frame**: one bordered control with the field's focus ring.
- **Control**: a single-line input or a multi-line text area.
- **Add-on** areas: `inline-start`, `inline-end`, `block-start` (a header row above the control) and `block-end` (a footer row below it). Each holds text, icons, Spinner, KeyboardKey, compact Buttons, ActionMenu triggers or a counter.
- **Label**, **hint** and **error** come from the surrounding Field.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| control | 'input' \| 'textarea' | 'input' | Kind of control. |
| inputProps | the TextField or TextArea behaviour props (value, onChange, placeholder, rows, autoGrow, maxRows, name, required, disabled, readOnly, type) | — | Forwarded to the control. |
| start / end / top / bottom | nodes | none | Add-on content for each area. |
| label / accessibleLabel / hint / errorMessage | — | — | Field wiring; one of label or accessibleLabel is required. |
| size | 'compact' \| 'regular' \| 'large' | 'regular' | Height step and add-on button size. |
| disabled / invalid | boolean | false | Whole group states. |
| onSubmitShortcut | () => void | none | Text area only: fires on Enter (without Shift) or on Mod+Enter, chosen by `submitKey`. |
| submitKey | 'enter' \| 'mod-enter' | 'enter' | Which key submits a multi-line control. |

## States
Idle, hover, focus-within (the whole frame shows the focus ring), invalid, disabled, read-only, busy (a Spinner add-on).

## Keyboard and ARIA
- RAC `Group` around RAC `Input` or `TextArea`; each add-on button is a RAC `Button`.
- The control keeps the field's label, description and error links. Prefix and suffix text is part of the control's description (for example "R$" reads as "Brazilian reais") through `aria-describedby`, not part of the value.
- Tab order: start add-on buttons, control, end add-on buttons, block add-ons in document order.
- Pointer press on a non-interactive part of the frame or on text add-ons moves focus to the control; presses on add-on buttons do not.
- Icon-only add-on buttons require an accessible name; add-on icons are decorative.
- `onSubmitShortcut` with `submitKey="enter"`: Enter submits, Shift+Enter inserts a line break; composition input (IME) never submits.

## Responsive, touch, motion, forced colours
- Add-on buttons have a hit area of at least `--ty-control-target` even when drawn compact.
- A multi-line control grows with `autoGrow` up to `maxRows`, then scrolls; block add-ons stay visible.
- Frame `--ty-input` fill, `--ty-line` border, `--ty-radius-control`; focus ring `--ty-focus-ring` at `--ty-focus-width` on the frame; invalid border `--ty-danger` plus the error text and icon.
- No motion beyond the focus ring (instant under reduced motion).
- Forced colours: frame border in `CanvasText`, focus ring in `Highlight`.

## Acceptance tests
- Given a start text "R$" and an input, when the input is focused, then its description includes the currency name and its value excludes "R$".
- Given an end icon-only copy button without a name, then a development warning is raised.
- Given a press on the start icon, then focus moves to the input.
- Given a press on an end button, then the button's action runs and focus does not jump to the input first.
- Given the input focused, then the whole frame shows the focus ring.
- Given a text area with `submitKey="enter"`, when Shift+Enter is pressed, then a line break is inserted; when Enter is pressed, then `onSubmitShortcut` fires.
- Given IME composition in progress, when Enter confirms the composition, then nothing is submitted.
- Given `errorMessage`, then the frame is invalid and the control has `aria-invalid`.
