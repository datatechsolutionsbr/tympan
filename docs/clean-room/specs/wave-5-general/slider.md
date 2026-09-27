# Slider

Wave 5 · forms · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Choose a number, or a range between two numbers, by moving a thumb along a track. Used for thresholds, budgets, volume and filter ranges.

## Anatomy
- **Label** (visible, or an accessible label).
- **Value output** (optional): the formatted current value or range.
- **Track**: the full span.
- **Fill**: the part of the track between the minimum and the thumb (single) or between the two thumbs (range).
- **Thumb** (one or two).
- **Tick marks** (optional) with labels at chosen values.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label / accessibleLabel | string | one required | Name of the slider. |
| value / defaultValue | number or [number, number] | minValue | A two-item array makes it a range slider with two thumbs. |
| onChange | (value) => void | none | Fires while dragging and on each key step. |
| onChangeEnd | (value) => void | none | Fires once when a drag ends or after a key step (commit point for expensive work). |
| minValue / maxValue / step | numbers | 0 / 100 / 1 | Bounds and step. |
| largeStep | number | ten steps | Step for Page Up and Page Down. |
| formatOptions | number format options | none | Formats the output and the spoken value (percent, currency, unit), locale from the provider. |
| showValue | boolean | true | Shows the value output. |
| thumbLabels | [string, string] | from i18n ("Minimum", "Maximum") | Names of the two thumbs in a range. |
| minStepsBetweenThumbs | number | 0 | Keeps the range thumbs apart by at least this many steps. |
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | Direction of the track. |
| marks | { value; label? }[] | none | Ticks with optional labels. |
| disabled | boolean | false | Not operable. |
| name | string | none | Form field name (range submits two values). |

## States
Idle, hover, dragging (thumb pressed), focus-visible (per thumb), disabled, at minimum, at maximum.

## Keyboard and ARIA
- RAC `Slider`, `SliderTrack`, `SliderThumb`, `SliderOutput`; APG **Slider** and **Slider (Multi-Thumb)** patterns.
- Each thumb is a focusable `input type=range` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` (the formatted value).
- In a range, each thumb's min and max reflect the other thumb (plus the minimum distance), and each thumb has its own name.
- Arrow Right/Up increase by `step`; Arrow Left/Down decrease (horizontal arrows follow reading direction); Page Up/Down use `largeStep`; Home and End go to the bounds.
- Clicking the track moves the nearest thumb to that point.

## Responsive, touch, motion, forced colours
- The thumb hit area is at least `--ty-control-target` on touch; the visible thumb may be smaller.
- Dragging captures the pointer; vertical page scrolling is not triggered while dragging a horizontal slider.
- Track in `--ty-line`, fill in `--ty-accent`, thumb on `--ty-surface-solid` with a `--ty-line-strong` border, focus ring `--ty-focus-ring` at `--ty-focus-width`.
- The thumb follows the pointer with no animation; keyboard steps may ease with `--ty-dur-instant`, zero under reduced motion.
- Forced colours: track and thumb border in `CanvasText`, fill in `Highlight`, disabled in `GrayText`.
- Colour is not the only carrier: the output text shows the value.

## Acceptance tests
- Given a slider from 0 to 100 at 40, when Arrow Right is pressed, then the value is 41 and `onChange` fires with 41.
- Given `largeStep` 10, when Page Up is pressed, then the value rises by 10.
- Given Home, then the value is the minimum; End, the maximum.
- Given a range [20, 60] and `minStepsBetweenThumbs` 5, when the start thumb is pushed right with the keyboard, then it stops at 55.
- Given a range, when read by a screen reader, then the thumbs are named "Minimum" and "Maximum" (or `thumbLabels`).
- Given `formatOptions` percent, when the value is 0.25, then the output and the value text read "25%".
- Given a drag that ends, then `onChangeEnd` fires once with the final value.
- Given right-to-left reading direction, when Arrow Right is pressed on a horizontal slider, then the value decreases.
- Given `disabled`, then the thumbs cannot be focused or moved.
