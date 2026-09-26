# StateSwitch

Wave 2 · form · Status: specified

## Purpose
A switch framed by the two state names (for example "Inactive" and "Active"), each with an icon, so the current state of a record is readable at a glance and can be changed in place.

## Anatomy
- Off label: icon and text, on the leading side.
- Switch in the middle.
- On label: icon and text, on the trailing side.
- The label of the current state is emphasised; the other is de-emphasised.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| checked | boolean | required | True means the "on" state. |
| onCheckedChange | (checked: boolean) => void | required | Requests the other state. |
| label | string | required | What is being switched, e.g. "Agent status". Stable accessible name. |
| offLabel | string | host i18n "Inactive" | Text for the off state. |
| onLabel | string | host i18n "Active" | Text for the on state. |
| offIcon, onIcon | Icon | neutral cross / check glyphs | Icons beside each state name. |
| disabled | boolean | false | Not operable. |
| pending | boolean | false | While the host saves, the switch is disabled and reports busy. |

## Behaviour
- Clicking either state label also toggles (they act as the switch's labels).
- Activation does not bubble to an enclosing clickable row.

## States
Off, on, hover, focus-visible, disabled, pending (busy).

## Keyboard and ARIA
- APG pattern: Switch. Backed by RAC `Switch`.
- Accessible name is `label`; the current state is announced as the checked state plus the state text as description (e.g. "Agent status, switch, on, Active").
- Space toggles. Pending sets `aria-busy`.

## Responsive, touch, motion, forced colours
- The switch and both labels together form a hit area at least 44 tall; the switch alone is at least 44 × 44 by padding.
- Thumb movement at `--fk-dur-instant`; instant with reduced motion.
- Forced colours: thumb position and emphasised text show the state; track outlined in system colours.

## Acceptance tests
- Given checked false, When rendered, Then a switch named by `label` is unchecked and "Inactive" is emphasised.
- Given the switch is activated, Then onCheckedChange receives true.
- Given the "Active" text is clicked, Then onCheckedChange receives true.
- Given the switch sits in a clickable table row, When toggled, Then the row's handler is not called.
- Given pending true, Then the switch is disabled and busy.

## Open questions
- The fork used a pressed toggle button whose name changed with state; this spec uses switch semantics with a stable name.
