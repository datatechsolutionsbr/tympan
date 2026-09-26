# CountBadge

Wave 2 · feedback · Status: specified

## Purpose
A small counter attached to the corner of an icon button (notifications, messages, pending approvals) that shows how many unseen items exist.

## Anatomy
- **Host**: the button or icon it decorates (not part of this component).
- **Counter**: a pill holding the number, or the capped form (for example "99+").
- **Description**: the text used by assistive technology ("3 notifications").

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| count | number | required | Number to show; nothing renders at 0. |
| itemNoun | { one: string; other: string } | from I18nAdapter | Noun used in the accessible text, with plural forms. |
| max | number | 99 | Above this the counter shows "max+" while the accessible text keeps the exact number. |
| tone | 'attention' \| 'neutral' | 'attention' | Attention uses the error/rose semantic colour (§2.3); neutral uses `--fk-ink-3`. |
| announce | boolean | false | Announces changes politely when the count increases. |

## States
Hidden (0), visible, capped, changed (optional announcement).

## Keyboard and ARIA
- Not focusable; no RAC primitive.
- The preferred wiring is that the host button's accessible name includes the count ("Notifications, 3 unread") via `aria-describedby` or by composition; the visible number is hidden from assistive technology to avoid double reading.
- When `announce` is true, increases are sent to a polite live region shared by the app (not a live region per badge).

## Responsive, touch, motion, forced colours
- Minimum text size 12 px (§2.2 floor); the pill grows horizontally for two or three characters.
- No pulsing or looping animation; at most a single brief emphasis on change, removed under reduced motion.
- Forced colours: the counter uses `Mark`/`MarkText` or a system border so it remains visible.

## Acceptance tests
- Given count 0, then nothing is rendered.
- Given count 3 and noun "notification/notifications", then the host is described as "3 notifications".
- Given count 150, then the counter shows "99+" and the accessible text says "150 notifications".
- Given `announce` and the count goes from 2 to 3, then one polite announcement is made.
- Given reduced motion, then no animation plays on change.

## Open questions
- The fork gives the counter its own status role and a pulsing loop; the spec replaces this with description on the host and a single shared live region.
