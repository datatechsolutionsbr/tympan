# SegmentedControl

Wave 1 · form · Status: specified

## Purpose
Pick exactly one of a small set (two to five) of mutually exclusive options that change a view or a value in place, such as a period or display mode.

## Anatomy
- **Track**: container holding all segments.
- **Segment**: label and optional icon.
- **Selection thumb**: marks the selected segment; moves between segments.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| options | Array<string \| { value: string; label: string; icon?: icon }> | required | segments; a string is both value and label |
| value / defaultValue | string | first option | selected value |
| onChange | (value: string) => void | required | called only when the value actually changes |
| label | string | required | accessible name of the group |
| size | 'compact' \| 'regular' \| 'large' | 'regular' | visible height; the hit area is always at least 44 px |
| fullWidth | boolean | false | segments share the available width equally |
| disabled | boolean | false | whole control disabled |
| iconOnly | boolean | false | hide labels visually; labels remain accessible names |

## States
- segment: idle, hover, focus-visible, selected, disabled.
- control: enabled, disabled.
- Selecting the already selected segment does nothing (no event).

## Keyboard and ARIA
- APG pattern: **Radio Group** (single choice that changes a value). If the control switches visible panels, use Tabs instead. RAC primitive: `ToggleButtonGroup` with `selectionMode="single"` and `disallowEmptySelection`, or `RadioGroup` styled as segments.
- One tab stop; Arrow keys move selection and focus (wrapping), Home/End jump; direction follows reading direction.
- Selected segment exposes checked/pressed state; the group is labelled by `label`.
- Do not wrap the group in a live region; the state change is conveyed by the checked state.

## Responsive, touch, motion, forced colours
- Each segment keeps a 44 × 44 px minimum hit area on touch regardless of `size`.
- With `fullWidth` on narrow screens labels truncate with the full label as accessible name; beyond five options use a select.
- The thumb uses `--fk-accent-soft` with `--fk-accent` text (§2.3), radius `--fk-radius-control`; it slides with `--fk-dur-quick`; reduced motion: jumps instantly.
- Optional haptic tick on touch devices via the Haptics utility.
- Forced colours: selected segment has a system-colour border or fill so it is distinguishable without the thumb.

## Acceptance tests
- Given options Day, Week, Month and value Week, Then the Week segment is checked and it alone is in the tab order.
- Given focus in the control, When ArrowRight is pressed, Then Month becomes selected and `onChange('Month')` is called.
- Given the last segment selected, When ArrowRight is pressed, Then the first segment is selected.
- Given the selected segment, When clicked again, Then `onChange` is not called.
- Given `disabled`, When clicked, Then `onChange` is not called and the group is exposed as disabled.
- Given `iconOnly`, Then each segment still has its label as accessible name.

## Open questions
- The fork used tab roles and a polite live region on the track; the new control uses radio or toggle-group semantics and no live region.
