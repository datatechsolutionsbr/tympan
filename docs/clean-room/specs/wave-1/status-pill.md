# StatusPill

Wave 1 · feedback · Status: specified

## Purpose
Shows the current state of an item (active, pending, failed…) with an icon, a word and a semantic tone, optionally announcing changes.

## Anatomy
- **Root** pill.
- **Status icon** (always present; may animate for "in progress").
- **Label** word.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| status | string | required | Key of the current status. |
| statusMap | Record<string, { label: string; tone: Tone; icon?: node; busy?: boolean }> | built-in map | Maps keys to label, tone and icon. Built-in keys: pending, approved, rejected, active, inactive, processing, error, success. Unknown keys fall back to neutral tone with the key as label (development warning). |
| tone | 'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral' | from map | Override; colours from the semantic set of §2.3. |
| label | string | from map | Override of the visible word. |
| size | 'small' \| 'regular' | 'regular' | Text step (≥ 12 px). |
| announce | boolean | false | When true, changes are announced politely. |

## States
One per tone; "busy" statuses show a moving icon. Each tone must carry an icon and a word (§2.3: colour never alone).

## Keyboard and ARIA
- No APG widget pattern; not focusable.
- No RAC primitive; custom.
- By default the pill is plain text (its label is read in place). With `announce`, the pill sits in a polite live region so a change is spoken once.
- The icon is decorative; the word is the accessible text. Do not prefix with a hidden "Status:" unless the host asks via I18n.

## Responsive, touch, motion, forced colours
- Pill radius (§2.4); never wraps; truncation not allowed (labels must be short).
- Busy icon rotation stops under reduced motion (static icon kept).
- Reduced transparency: opaque tinted fill.
- Forced colours: border and icon in `CanvasText`; tone differences carried by icon shape and word.

## Acceptance tests
- Given `status="active"` with the built-in map, when rendered, then the word and the success tone icon are shown.
- Given a custom map entry, when rendered, then its label, tone and icon are used.
- Given an unknown status, when rendered, then a neutral pill with the key as text appears.
- Given `announce` and the status changes, then the new label is announced once, politely.
- Given no `announce`, when a table of fifty pills renders, then no live regions are created.
- Given reduced motion and a busy status, then the icon does not rotate.

## Open questions
- The fork gave every pill a status role and a hidden "Status:" prefix, creating many live regions in tables; this spec makes announcing opt-in.
- The proof-state badge of design direction §2.11 is a separate, new component; it is not this pill.
