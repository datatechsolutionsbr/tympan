Wave 2 · Utility · Status: specified

# MotionFoundation

## Purpose
The single source of motion tokens and reduced-motion helpers every animated component reads.

## Contract
- Duration tokens, with values from design direction §2.7: `instant` (hover, press), `quick` (menu open, tab change), `base` (drawer and evidence panel entering). Exposed in milliseconds and seconds, and as CSS custom properties (`--fk-dur-*`).
- Easing tokens from §2.7: `enter` and `exit`, exposed as numeric control points and as CSS strings (`--fk-ease`, `--fk-ease-out`).
- No spring or stagger tokens (§2.7 says no springs, no stagger). Components that previously used springs use `base` with `enter`.
- `prefersReducedMotion()`: safe during server rendering (returns false), true when the media query matches.
- `resolveTransition(transition)`: returns a zero-duration transition when reduced motion is on.
- Named presets for common intents, each defined in terms of the tokens and opacity/translate only: `fadeIn`, `slideFromBottom`, `slideFromEnd`, `press` (opacity, not scale). Each has a reduced variant that is opacity-only or instant.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| duration | { instant, quick, base } | §2.7 | Milliseconds. |
| ease | { enter, exit } | §2.7 | Curves. |
| prefersReducedMotion | () => boolean | | Media query check. |
| resolveTransition | (t) => t | | Reduced-motion aware. |

## States
Normal; reduced motion (all durations collapse to zero at the token level, as §2.7 requires).

## Keyboard and ARIA
Not applicable.

## Responsive, touch, motion, forced colours
- Legitimate progress indicators (determinate progress bars) remain visible under reduced motion; only movement is removed, per §2.7.

## Acceptance tests
- Given reduced motion, then `resolveTransition` returns zero duration.
- Given server rendering, then `prefersReducedMotion()` returns false without error.
- Given the CSS variables, then each JS token matches its CSS counterpart.
- Given any preset's reduced variant, then it contains no translate or scale.

## Open questions
- The fork's extra tokens (a longer duration, several spring and easing names, platform colour constants) are not carried over; add tokens here only through the design direction. The mapping of every old alias is recorded in `wave-4/legacy-alias-map.md`; wave 4 adds one flag, `decorativeMotion` (default false), used only by `wave-4/cascade-grid.md`.
