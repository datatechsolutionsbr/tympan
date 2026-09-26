# Legacy aliases → tokens (decision record)

Spec: `docs/clean-room/specs/wave-4/legacy-alias-map.md`. Decision: **the
library ships no aliases.** No app imported the older motion aliases or the
mobile-OS colour constants, so nothing needs to stay compatible. Code being
ported picks the replacement below. Old export names are listed only in the
spec inventory; this page names concepts. `legacy-alias-map.test.ts` checks
that none of these concepts is exported from `src/index.ts`.

## Durations

| Older concept | Use instead |
|---|---|
| an "instant" duration alias | no transition at all |
| a "fast" alias | `duration.ms.quick`, `--fk-dur-quick` |
| a "normal" alias | `duration.ms.base`, `--fk-dur-base` |
| a "slow" alias | `base` (the design direction has no longer step) |
| a "very slow" alias | removed; a long period such as the skeleton pulse is a constant of that component |
| a separate reduced-motion duration set | MotionFoundation: the tokens collapse to zero under reduced motion |

## Easing

| Older concept | Use instead |
|---|---|
| default, in-out or platform-named curves | `ease.css.enter`, `--fk-ease` |
| deceleration ("out") | `enter` |
| acceleration ("in") | `exit`, `--fk-ease-out` |

## Presets

| Older concept | Use instead |
|---|---|
| spring presets and their reduced copies | removed; `base` duration with `enter` easing |
| press or tap presets that scale | `motionPresets.press` (opacity only) |
| card hover lift and card press | removed; hover changes a border token only |
| slide up / slide right | `slideFromBottom` / `slideFromEnd` |
| slide down | `fadeIn` |
| fade with scale, fade only | `fadeIn` |
| notification banner entrance | owned by Toast |
| list item entrance, stagger container | `fadeIn`; cascades only through CascadeGrid with `decorativeMotion` |
| reduced-motion wrapper for animation props | `resolveTransition` |
| helper that strips motion when reduced | each preset's `reduced` variant (`getPreset`) |

## Gesture constants

| Older concept | Use instead |
|---|---|
| swipe threshold and drag limits in pixels | SwipeRow `fullSwipeFraction` and `revealFraction` (fractions of the row width) |
| page-indicator dot variant | PageDots: active dot `--fk-accent`, inactive `--fk-line-strong`, shape change in `quick` |

## Mobile-OS system colours

Not carried over. Map by meaning:

| Meaning | Token |
|---|---|
| interactive blue | `--fk-accent` (the only interactive colour) |
| green | success semantic colour (`--fk-success`) |
| red | error semantic colour (`--fk-danger`) |
| orange, yellow | pending semantic colour (`--fk-warning`) |
| gray ramp | `--fk-ink-3`, `--fk-line`, `--fk-line-strong`, `--fk-surface-sunken` by role |
| purple, pink, teal, indigo, mint, cyan, brown | `--fk-categorical-*`, only in maps, charts, legends and graph nodes |

The only addition arising from wave 4 is MotionFoundation's `decorativeMotion`
flag (default false), read by CascadeGrid.
