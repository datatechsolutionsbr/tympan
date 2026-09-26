# LegacyAliasMap (old motion aliases and platform colour constants → tokens)

Wave 4 · utility (decision record) · Status: specified

## Purpose
Records, for every older motion alias and every platform-style colour constant the fork exposed, what the new library provides instead. Decision: **the new library ships no aliases.** No app imports these today (see INVENTORY), so there is nothing to keep compatible. Anyone porting code uses this table to pick the token. The fork export names are listed only in INVENTORY; this file names the concepts.

## Anatomy (decision table)

### Durations
| Old concept | New token | Note |
|---|---|---|
| "instant" alias | zero | No transition. |
| "fast" alias | `quick` (`--fk-dur-quick`) | Menus, tabs. |
| "normal" alias | `base` (`--fk-dur-base`) | Drawers and panels. |
| "slow" alias | `base` | §2.7 has no longer step. |
| "very slow" alias | removed | A legitimate long period (skeleton pulse, §2.12) is a component-local constant documented in that component's spec, not a shared token. |
| reduced-motion duration set | MotionFoundation reduced behaviour | Tokens collapse to zero. |

### Easing
| Old concept | New token |
|---|---|
| default curve, in-out curve, platform-named curve | `enter` (`--fk-ease`) |
| deceleration ("out") | `enter` |
| acceleration ("in") | `exit` (`--fk-ease-out`) |

### Presets
| Old concept | New |
|---|---|
| spring presets and their reduced copies | removed; use `base` with `enter` (§2.7 no spring) |
| press and tap presets that scale | MotionFoundation `press` (opacity only) |
| card hover lift, card press, their reduced copies | removed (§2.7 no lift); hover changes the border token only |
| slide up / slide right presets | `slideFromBottom` / `slideFromEnd` |
| slide down preset | `fadeIn` (no top entrance in the token set) |
| fade-with-scale and fade-only presets | `fadeIn` |
| notification banner entrance and its reduced copy | Toast (wave 1) owns its entrance |
| list item entrance and stagger container | `fadeIn`; cascades only through CascadeGrid with the `decorativeMotion` switch |
| reduced-motion wrapper helper for animation props | `resolveTransition` |
| variants helper that strips motion when reduced | each MotionFoundation preset's reduced variant |

### Gesture constants
| Old concept | New |
|---|---|
| swipe action threshold in pixels and drag limits | SwipeRow properties expressed as fractions of the row width (`fullSwipeFraction` and the reveal width), not pixels |
| page-indicator dot variant (active width and colour) | PageDots (wave 2): active dot uses `--fk-accent`, inactive `--fk-line-strong`; shape change animated in `quick` |

### Platform system colour constants (a mobile-OS palette, light and dark)
Not carried over. Map by meaning:

| Meaning in old usage | New token |
|---|---|
| interactive blue | `--fk-accent` (the only interactive colour, §2.3) |
| green | success semantic colour |
| red | error semantic colour |
| orange, yellow | pending semantic colour |
| gray ramp | `--fk-ink-3`, `--fk-line`, `--fk-line-strong`, `--fk-surface-sunken` by role |
| purple, pink, teal, indigo, mint, cyan, brown | `--fk-categorical-*`, allowed only in maps, charts, legends and graph nodes (§2.3); otherwise no colour |

## Properties and events
None exported. The only token addition arising from wave 4 is MotionFoundation's `decorativeMotion` flag (default false), used by CascadeGrid.

## States
Not applicable.

## Keyboard and ARIA
Not applicable.

## Responsive, touch, motion, forced colours
Every replacement inherits MotionFoundation's reduced-motion behaviour and the token stylesheet's forced-colours rules.

## Acceptance tests
- Given the public export list of the new library, when searched for the old alias concepts (duration aliases, spring presets, platform colours), then none is exported.
- Given MotionFoundation, then it exposes exactly the tokens of §2.7 plus the `decorativeMotion` flag.
- Given SwipeRow, then no property is expressed in pixels.
