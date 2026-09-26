Wave 2 · Feedback · Status: specified

# ConsentBanner

## Purpose
Asks once for consent to non-essential cookies and remembers the answer on the device.

## Anatomy
- **Panel**: floating at the bottom, surface level 3 (§2.5).
- **Message**: one or two sentences.
- **Learn more link**: to the privacy policy.
- **Reject** (secondary) and **Accept** (secondary as well; equal prominence for a fair choice).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| policyHref | string | required | Link target. |
| storageKey | string | a fixed key | Where the answer is stored. |
| onAccept, onReject | () => void | none | Called after the choice is stored. |
| texts | { message, learnMore, accept, reject, label } | from i18n | Copy. |

## States
Hidden (answer stored, or storage unreadable and host decided not to ask); shown; closing.

## Keyboard and ARIA
- Non-modal region: role `region` (or `dialog` without `aria-modal`) labelled by `label`. It must not trap focus or make the page inert, because it does not block reading.
- It appears in the tab order right after the skip link (rendered early in the DOM or reachable through a landmark).
- APG: "Landmark regions" guidance; RAC has no banner primitive, use `Button` and `Link`.
- Storage access is wrapped so a blocked storage never throws; in that case the banner shows each visit.

## Responsive, touch, motion, forced colours
- Full width below 640 px with buttons stacked; buttons 44 px tall.
- Entrance by fade only; none under reduced motion.
- Reduced transparency: opaque. Forced colours: panel border in `CanvasText`.

## Acceptance tests
- Given no stored answer, then the banner is shown.
- Given Accept, then the stored value is "accepted", the banner hides and `onAccept` fires once.
- Given Reject, then the stored value is "rejected" and `onReject` fires.
- Given a stored answer, then the banner is not rendered.
- Given storage throws, then the page still renders without error.
- Given the banner is shown, then content behind it remains focusable.

## Open questions
- The fork marks it as a modal dialog without trapping focus; the spec chooses a non-modal region.
- Accept and reject have equal visual weight (fair consent), unlike the fork.
