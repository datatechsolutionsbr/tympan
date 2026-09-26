# TweenedNumber

Wave 2 · data display · Status: specified

## Purpose
Displays a number that eases from its previous value to a new target, as a progressive enhancement for figures that change in place.

## Anatomy
- A single inline text run with tabular numerals so width does not jitter.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | number | required | Target value. |
| durationMs | number | `--fk-dur-base` (§2.7) | Length of one tween; 0 disables animation. |
| decimals | number | 0 | Fixed decimals for the default formatter. |
| format | `(n: number) => string` | undefined | Formatter applied to every intermediate value (currency, grouping). |

## States
- Steady: shows exactly `format(value)` (or the fixed-decimal default).
- Tweening: intermediate values rise or fall with an easing that decelerates at the end (`--fk-ease`).
- Interrupted: when `value` changes mid-tween, the new tween starts from the number currently shown, not from the old target.
- First render: starts from zero, unless reduced motion or duration 0, in which case the target shows immediately.

## Keyboard and ARIA
- Not interactive; no role. Intermediate frames must not be announced: the element is not a live region. If the host needs announcements, the surrounding tile provides a live region that is updated with the final value only.
- The accessible text in the steady state is the exact final value.
- No APG pattern; no RAC primitive; custom.

## Responsive, touch, motion, forced colours
- `prefers-reduced-motion: reduce` renders the target instantly (WCAG 2.3.3).
- The tween stops and cleans up when the component unmounts or the tab is hidden.
- No colour of its own; inherits text colour; forced colours need nothing special.

## Acceptance tests
- Given reduced motion, when mounted with 1234, then the text is "1234" on the first frame.
- Given duration 0, when value changes from 10 to 20, then "20" appears immediately.
- Given normal motion, when value changes from 0 to 100, then after the duration elapses the text is exactly "100".
- Given a tween in progress at about 50, when value changes to 0, then the next frames descend from about 50.
- Given a currency formatter, when tweening, then every frame shows formatted currency.
- Given unmount mid-tween, when time passes, then no state update occurs.
