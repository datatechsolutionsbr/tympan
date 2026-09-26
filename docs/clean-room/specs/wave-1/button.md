# Button

Wave 1 · primitive · Status: specified

## Purpose
Triggers one action or navigates to one destination, with text, icon or both, and a built-in touch hit area.

## Anatomy
- **Root**: the pressable element (a button, or a link when a destination is given).
- **Leading icon** (optional) and **trailing icon** (optional), decorative.
- **Label**: visible text; absent only in icon-only mode.
- **Busy indicator**: a small spinner that replaces the leading icon while busy.
- **Hit area**: an invisible extension that guarantees the touch target when the visible control is smaller.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| variant | 'primary' \| 'secondary' \| 'quiet' \| 'danger' | 'secondary' | Visual weight (design direction §2.10). At most one `primary` per view. |
| size | 'compact' \| 'regular' \| 'large' | 'regular' | Visible height step; `compact` only inside compact tables (§2.10). |
| shape | 'rounded' \| 'pill' \| 'circle' | 'rounded' | `circle` only for icon-only buttons. |
| iconOnly | boolean | false | Hides the label; then `accessibleLabel` is required. |
| accessibleLabel | string | none | Accessible name when no visible label, also used as tooltip text. |
| leadingIcon / trailingIcon | node | none | Decorative icons, hidden from assistive tech. |
| href | string | none | Renders as a link through the router adapter; `onPress` still fires. |
| type | 'button' \| 'submit' \| 'reset' | 'button' | Native form role. |
| busy | boolean | false | Shows the busy indicator, blocks presses, keeps width stable. |
| busyLabel | string | none | Replaces the label while busy and is announced. |
| disabled | boolean | false | Not pressable; stays in tab order only when `focusableWhenDisabled`. |
| focusableWhenDisabled | boolean | false | Lets keyboard users reach a disabled button to read its tooltip/reason. |
| fullWidth | boolean | false | Stretches to the container width. |
| onPress | (event) => void | none | Fires on pointer, touch, Enter and Space. |
| haptic | 'none' \| 'light' \| 'medium' | 'light' (`danger`: 'medium') | Requests haptic feedback on press start through the Haptics utility. |

## States
Rest, hover, pressed (slight inward feedback, no lift), focus-visible (ring per §2.6; double ring on primary), disabled (reduced emphasis, no hover), busy (`aria-busy`, spinner, label kept or replaced), current (when used as a link to the current page: `aria-current="page"`).

## Keyboard and ARIA
- APG pattern: **Button**; link mode follows **Link**.
- RAC primitive: `Button`; link mode: `Link`.
- Enter and Space activate a button; only Enter activates a link.
- Icon-only buttons must expose `accessibleLabel` as the accessible name; decorative icons carry no name.
- While busy: `aria-busy="true"`, presses ignored, focus is not lost.

## Responsive, touch, motion, forced colours
- The hit area is at least 44 × 44 px at every size, including `compact` (§2.10).
- Below 1024 px wide the visible height follows the touch step of §2.10.
- Press feedback uses the instant duration of §2.7; under reduced motion only a colour/opacity change remains, and the busy spinner stops rotating and shows a static glyph plus text.
- Under reduced transparency the glass fill becomes opaque.
- Forced colours: the root draws a system-colour border in every variant; the primary gradient is replaced by `ButtonFace`/`ButtonText`; focus ring uses `Highlight`.

## Acceptance tests
- Given a button with a label, when it is clicked, then `onPress` is called once.
- Given a focused button, when Space or Enter is pressed, then `onPress` is called.
- Given `href`, when rendered, then the element has the link role and navigates through the router adapter.
- Given `busy`, when pressed, then `onPress` is not called and `aria-busy` is true.
- Given `disabled`, when clicked, then nothing fires; given also `focusableWhenDisabled`, then Tab still reaches it and it reports `aria-disabled`.
- Given `iconOnly` without `accessibleLabel`, when rendered in development, then a warning is logged.
- Given `size="compact"`, when measured, then the pointer hit area is at least 44 × 44 px.
- Given reduced motion, when pressed, then no transform animation runs.
- Given axe, when any variant renders in light and dark themes, then no violations are reported.

## Open questions
- The fork offered many hue choices for the fill; the design direction allows one accent. Extra tones are not specified.
