# FormActions

Wave 2 · layout · Status: specified

## Purpose
The row of buttons that ends a form or dialog: a secondary cancel action and a primary save action, or any arrangement of action buttons.

## Anatomy
- **Row**: aligned to the end side on wide screens with consistent spacing (§2.1 within-component 8 to 16).
- **Secondary button**: cancel or back (secondary variant, §2.10).
- **Primary button**: save or confirm (primary variant; the one CTA of the view, §2.3).
- **Free row** variant: arbitrary children with the same alignment rules.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| cancelLabel | string | required (preset) | Secondary label. |
| saveLabel | string | required (preset) | Primary label. |
| onCancel | `() => void` | required (preset) | Secondary handler. |
| onSave | `() => void` | undefined | Primary handler; when absent, the primary is a submit button for the enclosing form. |
| saveDisabled | boolean | false | Disables primary. |
| saving | boolean | false | Primary shows Spinner and busy label; both disabled. |
| emphasis | `'default' \| 'destructive'` | `'default'` | Destructive uses the danger button (filled only at confirmation, §2.10). |
| align | `'end' \| 'between' \| 'start'` | `'end'` | Row alignment. |
| children | node | undefined | Free row content (replaces the preset buttons). |

## States
- Idle, primary disabled, saving.

## Keyboard and ARIA
- A `group` element. Buttons are RAC `Button`; primary is `type="submit"` inside a form unless `onSave` is given.
- DOM order: secondary then primary, so Tab reaches the primary last; visual order matches on wide screens.
- Saving state is announced (button `aria-busy`, label change).

## Responsive, touch, motion, forced colours
- Under 640 px buttons stack full width, primary on top visually; the DOM order stays the same (use layout reversal, not reordering the tree), consistently across the library.
- Each button 44 px tall on touch.
- No motion. Forced colours: primary distinguished by border weight, not only fill.

## Acceptance tests
- Given the preset, when cancel is activated, then `onCancel` fires.
- Given no `onSave` inside a form, when primary is activated, then the form submits.
- Given `saveDisabled`, when rendered, then primary is disabled and cancel is enabled.
- Given `saving`, when rendered, then both are disabled and the primary exposes a busy state.
- Given 375 px, when rendered, then both buttons take full width and no horizontal scroll occurs.
- Given `emphasis` destructive, when rendered, then the primary uses the danger variant with its icon and word.
