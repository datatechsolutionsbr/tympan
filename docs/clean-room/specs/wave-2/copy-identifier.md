# CopyIdentifier

Wave 2 · data display · Status: specified

## Purpose
Shows a long identifier (record id, hash, key) in shortened form and copies the full value to the clipboard on activation.

## Anatomy
- **Trigger**: a compact pill-shaped button (§2.4 pill) containing a copy icon and the shortened value in mono `meta` type (§2.2).
- **Confirmation**: the icon becomes a check and the text becomes a short "copied" word for a brief moment.
- **Live message**: visually hidden status text announcing the result.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | string | required | Identifier displayed. |
| copyValue | string | `value` | Text actually copied (for example a URL built from the id). |
| label | string | from i18n "copy" | Accessible verb prefix; the accessible name is "label: full value". |
| visibleLength | number | 8 | Characters shown before an ellipsis. Values not longer than this are shown whole. |
| onCopy | `(ok: boolean) => void` | undefined | Called after the copy attempt with its result. |

## States
- Idle: shortened value with copy icon.
- Hover and focus-visible: design-direction focus ring (§2.6).
- Copied: check icon and "copied" word for about two seconds, then back to idle.
- Failed (clipboard unavailable or denied): no change of the value; the live message says copying failed and suggests selecting the text; the full value is available in the tooltip and accessible name.

## Keyboard and ARIA
- A real button (RAC `Button`), not a span with a role. Enter and Space both copy.
- Activation does not propagate to a clickable parent (row, card).
- The confirmation is announced through a polite live region (`role="status"`).
- Tooltip with the full value on hover and focus (RAC `TooltipTrigger`), APG Tooltip pattern.

## Responsive, touch, motion, forced colours
- Visible pill may be small, but the hit area is at least 44 × 44 px on touch (§2.10).
- Icon swap is instant; no scale or bounce. Reduced motion changes nothing else.
- Forced colours: pill border in system text colour; copied state distinguishable by the check icon and word, not by colour.
- Semantic success colour (§2.3) only as a supplement to the word.

## Acceptance tests
- Given a 36-character id, when rendered, then 8 characters followed by an ellipsis are visible and the accessible name contains all 36.
- Given a 6-character id, when rendered, then all 6 are visible with no ellipsis.
- Given focus on the trigger, when Space is pressed, then the clipboard contains `copyValue` and the status region announces "copied".
- Given a clickable parent row, when the trigger is clicked, then the row's handler is not called.
- Given the clipboard API rejects, when activated, then the status region announces failure and `onCopy(false)` is called.
- Given the copied state, when about two seconds pass, then the idle icon returns.
