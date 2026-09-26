# GroupNodeForm

Wave 3 · form · Status: specified

## Purpose
Edit the name, description and marker tone of a group frame that visually encloses several nodes on the canvas.

## Anatomy
- Name field: single-line, required.
- Description field: multi-line, optional.
- Tone picker: a small set of swatches, one per categorical tone, each with a visible or accessible name.
- Form footer: cancel and save (save disabled while the name is blank).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | `{ label: string; description?: string; tone: GroupTone; …rest }` | required | Current group configuration; unknown keys are preserved on save. |
| tones | `GroupTone[]` | five categorical tones from design direction §2.3 | Offered swatches, in order. |
| onSave | `(value) => void` | required | Emits trimmed name, description (omitted when blank) and tone, merged over the original value. |
| onCancel | `() => void` | required | Discards edits. |
| labels | `GroupNodeFormLabels` | from i18n adapter | Field labels, placeholders, tone names, actions. |

`GroupTone` is an opaque string naming a categorical token (for example `tone-1` … `tone-5`), never a raw colour name.

## States
- Pristine, dirty, invalid (blank name: save disabled and the name field shows its error only after blur or a save attempt).
- Tone selected: exactly one swatch is checked.

## Keyboard and ARIA
- Name and description follow TextField / TextArea (RAC `TextField`).
- Tone picker follows the APG Radio Group pattern; back with RAC `RadioGroup` + `Radio`. Arrow keys move and select, Tab leaves the group. Each swatch has an accessible name that is the tone's word, not only its colour.
- Save button exposes `aria-disabled` reasoning through the name field's error message (`aria-describedby`).

## Responsive, touch, motion, forced colours
- Swatches have a 44 px target even if the visible swatch is smaller; spacing keeps targets from overlapping.
- The selected swatch is marked by a shape change (ring or check icon), not only by colour, so it survives forced colours; in forced colours swatches show their tone name on focus via tooltip.
- No animation other than the token durations for hover (§2.7); zero under reduced motion.

## Acceptance tests
- Given the name is "  Intake  ", when saved, then `onSave` receives label "Intake".
- Given the name is blank, then the save action is disabled and pressing Enter in the name field does not emit.
- Given the description is blank, when saved, then the description key is absent.
- Given tone 2 is selected, when the user presses Right Arrow in the tone group, then tone 3 becomes checked.
- Given a value with extra keys (size, expansion state), when saved, then those keys are unchanged.
- Given forced colours, then the checked swatch remains distinguishable.
