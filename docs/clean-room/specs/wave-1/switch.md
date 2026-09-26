# Switch

Wave 1 · form · Status: specified

## Purpose
Turns a single setting on or off with immediate effect, optionally with a label and description laid out as a row or a standalone setting tile.

## Anatomy
- **Track** and **thumb** (the control itself).
- **Label** and optional **description**.
- **Layout wrapper**: inline row (control then label) or setting tile (label and description on the start side, control on the end side).
- **Switch group** (optional): a vertical stack of switch rows sharing spacing and an optional group label.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| isSelected / defaultSelected | boolean | false | Controlled or uncontrolled on/off. |
| onChange | (isSelected: boolean) => void | none | Fires with the next value. |
| label | string | none | Visible label; if absent, `accessibleLabel` is required. |
| accessibleLabel | string | none | Name when there is no visible label. |
| description | node | none | Secondary text, linked as description. |
| layout | 'inline' \| 'tile' | 'inline' | Row or standalone tile. |
| size | 'small' \| 'regular' \| 'large' | 'regular' | Visible size step; the hit area never shrinks. |
| disabled | boolean | false | Not operable. |
| readOnly | boolean | false | Focusable, announces state, cannot change. |
| name / value | string | none | Form submission when on. |

## States
Off, on, hover, pressed, focus-visible (§2.6 ring around the track), disabled, read-only. The on state uses the accent (§2.3); the off state uses the sunken surface; the thumb position also changes so state is not colour-only.

## Keyboard and ARIA
- APG pattern: **Switch**.
- RAC primitive: `Switch` (group wrapper: RAC `Group` or a fieldset with legend).
- Space toggles; Enter toggles as well for parity with the fork.
- Role `switch` with `aria-checked`; clicking the label toggles.
- The label text does not change with state ("Notifications", not "On"/"Off"); a separate State Switch (wave 2) covers visible on/off captions.

## Responsive, touch, motion, forced colours
- The whole row (tile layout) or the control plus label (inline) is a 44 px tall hit area.
- Thumb slides with the quick duration of §2.7; under reduced motion it jumps.
- Reduced transparency: opaque track.
- Forced colours: track outlined with `CanvasText`, thumb filled with `CanvasText` when on and hollow when off.

## Acceptance tests
- Given an unchecked switch, when rendered, then it has role switch and `aria-checked` false.
- Given a click, then `onChange` is called with true.
- Given focus and Space, then the value toggles.
- Given `defaultSelected`, when clicked, then it toggles without a controlling parent.
- Given `disabled`, when clicked or Space is pressed, then `onChange` is not called.
- Given the tile layout with a description, when rendered, then the description is in the switch's accessible description.
- Given `size="small"`, when measured, then the hit area is at least 44 px tall.
- Given reduced motion, when toggled, then no transition runs.

## Open questions
- The fork exposed several hue choices for the on state; only the accent is specified.
