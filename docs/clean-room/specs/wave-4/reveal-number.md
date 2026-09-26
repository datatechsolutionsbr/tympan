# RevealNumber

Wave 4 · data display · Status: specified

## Purpose
A figure that counts from a starting value to its final value the first time it scrolls into view, used on public showcase pages to draw the eye to a headline number. It is a thin wrapper over TweenedNumber (wave 2): TweenedNumber animates when the value changes; RevealNumber animates once when it becomes visible.

## Anatomy
- A single inline text run with tabular numerals (§2.2), rendered by TweenedNumber.
- An optional suffix or prefix is part of the formatted text, not a separate element.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| from | number | 0 | Value shown before the element is seen. |
| to | number | required | Final value. |
| decimals | number | 0 | Fixed decimals of the default formatter. |
| format | (n: number) => string | fixed-decimal | Formatter for every intermediate value (grouping, percent, unit). |
| visibleFraction | number (0 to 1) | one half | Portion of the element that must be in view to start. |
| once | boolean | true | When false, the number returns to `from` when it leaves the view and counts again on return. |
| durationMs | number | `--fk-dur-base` (§2.7) | Passed to TweenedNumber. |

## States
- Waiting: shows `format(from)`.
- Counting: TweenedNumber tweening towards `to`.
- Done: shows `format(to)`; with `once` true it stays there.
- Reduced motion or no visibility observer support: shows `format(to)` immediately and never counts.

## Keyboard and ARIA
- The accessible text is always the final value: the visible counting run is hidden from assistive technology and a visually hidden copy holds `format(to)`. Screen readers never hear intermediate values.
- Not a live region. Nothing focusable.

## Responsive, touch, motion, forced colours
- Width does not jitter during counting (tabular numerals, reserved width of the final value).
- The count is opacity-free: only the digits change. Under `prefers-reduced-motion` there is no count at all (final value at once).
- Server rendering outputs the final value so the page is correct without scripts.
- Forced colours: plain text, no change.

## Acceptance tests
- Given from 0 and to 94, when the element is not yet in view, then the visible text reads 0 and the accessible text reads 94.
- Given the element enters the view, when the tween ends, then the visible text reads 94.
- Given reduced motion, when rendered, then 94 is shown at once and no animation frame is requested.
- Given once false, when the element leaves and re-enters the view, then the count runs again.
- Given server rendering, when the markup is inspected, then it contains the final value.

## Composition notes
Used inside HighlightStat. In the authenticated app, figures that change in place use TweenedNumber directly and figures that do not change use plain text (design direction §2.7: motion only for feedback and spatial continuity).
