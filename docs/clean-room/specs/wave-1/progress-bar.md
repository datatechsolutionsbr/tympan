# ProgressBar

Wave 1 · feedback · Status: specified

## Purpose
Show how far a determinate task has progressed (upload, batch run, profile completion), or an indeterminate state when the total is unknown.

## Anatomy
- **Label**: visible description above the bar (optional but recommended).
- **Value text**: percentage or "n of m" at the end of the label row.
- **Track**: full length.
- **Fill**: portion proportional to value.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | number | 0 | current value |
| minValue / maxValue | number | 0 / 100 | range |
| label | string | required unless `aria-label` given | accessible and visible name |
| valueLabel | string | computed percentage | custom value text, such as "3 of 8 steps" |
| showValue | boolean | true | show the value text |
| indeterminate | boolean | false | unknown progress; no value text |
| tone | 'accent' \| 'success' \| 'warning' \| 'danger' | 'accent' | semantic tone; never the only signal (pair with value text or status) |
| size | 'thin' \| 'regular' | 'regular' | track thickness |

## States
- determinate (0 to max), complete (value equals max), indeterminate.
- Values outside the range are clamped.

## Keyboard and ARIA
- APG pattern: **Meter** is not appropriate; use the `progressbar` role. RAC primitive: `ProgressBar` (provides `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`).
- Not focusable. When progress completes the host announces completion through a Toast or status message, not through the bar.

## Responsive, touch, motion, forced colours
- The fill width changes with `--fk-dur-quick`; reduced motion: instant updates, and the indeterminate animation becomes a static partial fill with the label still stating "in progress".
- Track uses `--fk-surface-sunken`, fill uses `--fk-accent` or the semantic colours of §2.3; radius `--fk-radius-pill`.
- Forced colours: track border and fill use system colours (`CanvasText` border, `Highlight` fill).
- Stretches to its container; no touch target.

## Acceptance tests
- Given value 40 and label "Upload", Then a progressbar named "Upload" has `aria-valuenow=40` and value text "40%".
- Given value 150 with max 100, Then `aria-valuenow` is 100.
- Given `valueLabel` "3 of 8 steps", Then `aria-valuetext` is "3 of 8 steps".
- Given `indeterminate`, Then `aria-valuenow` is absent.
- Given reduced motion, When value changes, Then no transition runs.
