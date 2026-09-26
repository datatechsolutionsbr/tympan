# CompactConfirm

Wave 2 · overlay · Status: specified

## Purpose
A small, top-anchored confirmation card for quick, reversible-or-not decisions (sign out, delete one item) with an icon, an optional app name, a one-line question and two buttons. It is also the default dialog of ConfirmService and is reused by the workflow editor.

## Anatomy
- **Scrim**: light dimming of the page.
- **Card**: compact raised surface anchored near the top centre (§2.5 level 3 or 4).
- **Icon**: tone icon in a small tile.
- **Source line** (optional): app or module name in `meta` style.
- **Question**: the title.
- **Actions**: two equal-width buttons, Cancel and Confirm.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Visibility. |
| title | string | required | The question. |
| message | string | none | Optional short consequence line. |
| onConfirm | () => void | required | Confirm pressed. |
| onCancel | () => void | required | Cancel, Escape or scrim press. |
| confirmLabel / cancelLabel | string | localised "Confirm" / "Cancel" | Button text. |
| tone | 'neutral' \| 'danger' | 'danger' | Icon tile and confirm button treatment; danger always pairs with a warning icon and word. |
| icon | ReactNode | tone default | Icon override. |
| sourceLabel | string | none | Source line text. |
| haptic | boolean | true | Emits a warning haptic when opened (where supported). |

## States
Closed, opening, open, confirm focus-visible, closing.

## Keyboard and ARIA
- APG Alert Dialog. RAC `Modal` + `Dialog` with `role="alertdialog"`.
- Labelled by the question and described by the message, using ids unique to each instance.
- Focus moves into the card (Cancel first for danger tone), is trapped; Tab cycles the two buttons; Escape cancels; focus returns to the opener.
- Nothing renders in the accessibility tree while closed.

## Responsive, touch, motion, forced colours
- Width fits 320 wide screens with the 16 px gutter; below the top safe-area inset.
- Buttons at least 44 px tall.
- Appears with opacity and a short downward offset (`--fk-dur-quick`); reduced motion: opacity only.
- Reduced transparency: card opaque. Forced colours: card has a system border; buttons use `ButtonText`/`ButtonFace`; the danger button keeps its word.

## Acceptance tests
- Given `open` false, then nothing is rendered.
- Given open with title "Sign out?", then an alert dialog named "Sign out?" with "Cancel" and "Confirm" is exposed.
- Given custom labels and a source label, then they are shown.
- Given Confirm is pressed, then `onConfirm` fires once; given Cancel or Escape, then `onCancel` fires.
- Given two instances mounted, then their label ids differ.
- Given opening on a device with vibration support and `haptic` true, then a single warning haptic is requested.

## Open questions
- The fork reuses one fixed element id for the title across instances and uses the generic dialog role; both corrected here.
