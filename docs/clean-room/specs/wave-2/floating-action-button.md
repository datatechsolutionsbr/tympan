# FloatingActionButton

Wave 2 · primitive · Status: specified

## Purpose
Keeps the single most important creation action of a screen within thumb reach on small screens, and renders it as an ordinary inline button on wide screens.

## Anatomy
- **Action button**: a circular control holding an icon; in the extended form it also shows a short text label beside the icon.
- **Anchor**: the corner of the viewport the button sits in when floating, offset from the device safe-area inset.
- **Inline slot** (responsive mode only): the place in the page header where the same action appears on wide screens.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label | string | required | Accessible name; also the visible text when `extended` or when shown inline. |
| icon | ReactNode | none | Decorative glyph; hidden from assistive technology. |
| onPress | () => void | required | Fired on activation, never while `loading`. |
| placement | 'end-bottom' \| 'start-bottom' \| 'center-bottom' | 'end-bottom' | Corner used when floating; logical (mirrors in right-to-left). |
| presentation | 'responsive' \| 'floating' \| 'inline' | 'responsive' | Responsive: floating below the 1024 breakpoint (§2.8), inline above it. |
| extended | boolean | false | Shows the label next to the icon while floating. |
| size | 'regular' \| 'large' | 'regular' | Visual size; both keep at least a 44 px target. |
| emphasis | 'primary' \| 'secondary' | 'primary' | Primary uses the call-to-action treatment of §2.3; at most one primary per view. |
| loading | boolean | false | Busy: shows an in-button spinner, blocks activation. |
| disabled | boolean | false | Not operable. |

## States
Rest, hover, pressed, focus-visible (double ring on the gradient, §2.6), loading (`aria-busy`), disabled, hidden (when a modal or drawer covers the page it is removed from the tab order along with the page).

## Keyboard and ARIA
- APG pattern: Button. RAC primitive: `Button`.
- Enter and Space activate. The accessible name is `label` even when only the icon is visible.
- Only one instance of the action exists in the accessibility tree at a time: in responsive mode the hidden presentation must be removed from the tree, not just visually hidden.
- When floating, it follows the main content in reading order, not before it.

## Responsive, touch, motion, forced colours
- Target at least 44 × 44 px in every size; offset from the bottom safe-area inset so it never sits under the home indicator.
- Must not cover the last row of a list: the page reserves bottom padding equal to the button's height plus its offset while it floats.
- Entrance and press feedback use opacity and a small scale only; with reduced motion there is no scale, only an instant state change.
- Optional haptic tick on activation via the Haptics utility; never required for feedback.
- Forced colours: the button keeps a visible system-colour border; the icon uses `ButtonText`.

## Acceptance tests
- Given presentation 'responsive' and a viewport of 1280, when the page renders, then the action appears inline and no floating copy exists in the accessibility tree.
- Given a viewport of 375, when the page renders, then exactly one floating button with name `label` is present and it sits above the bottom safe area.
- Given `loading`, when the user presses Enter, then `onPress` is not called and the button reports busy.
- Given only an icon is visible, when a screen reader reads the button, then it announces `label`.
- Given reduced motion, when the button appears, then it does not scale in.
- Given axe runs on each state, then there are no violations.

## Open questions
- The fork renders the responsive form twice and hides one copy with styling; the new implementation should render one element and move it, or render one per breakpoint with the inactive one fully removed.
