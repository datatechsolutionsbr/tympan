# ToneTint (tint resolver for glass surfaces)

Wave 4 · utility (token API) · Status: specified

## Purpose
Lets a component give a glass surface a faint tint of a named tone (the accent, a semantic state or a categorical hue) without the component ever holding a colour value. It replaces a helper that parsed utility class strings to guess a colour; the new resolver works on token names only.

## Anatomy
- **Tone names**: a closed set. `accent`; the semantic tones of §2.3 (`success`, `pending`, `error`, `neutral`); the categorical tones `categorical-1` to `categorical-8` of §2.3 (allowed only where §2.3 allows categories: map, charts, legends, graph nodes).
- **Tint tokens**: for each tone, three custom properties defined in the token stylesheet for both themes: the tone's channel triple (so alpha can be applied), a soft tint (surface wash) and a ring tint (border and focus-adjacent glow). Names follow `--fk-tint-<tone>-rgb`, `--fk-tint-<tone>-soft`, `--fk-tint-<tone>-ring`. Values are derived from the §2.3 colours; no new hues.
- **Resolver function**: `resolveTint(tone, fallback?)` returns the three token references for a tone; unknown or missing tones return the `neutral` set (or the given fallback tone).
- **Style hook**: components apply a tint by setting one custom property on their root (`--fk-surface-tint`) to the resolver's result; the glass rule of §2.5 reads it.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| resolveTint | (tone?: ToneName, fallback?: ToneName) => { rgb: string; soft: string; ring: string } | | Token references, never literal colours. |
| isToneName | (value: unknown) => boolean | | Validation for host input. |
| toneNames | readonly ToneName[] | | Ordered list for pickers and tests. |

## States
Light and dark theme (token values swap, references do not); reduced transparency (tints fall back to the opaque surface with only the ring tint kept as a border colour); forced colours (tints ignored).

## Keyboard and ARIA
Not applicable. A tint never carries meaning on its own (§2.3: icon and word as well).

## Responsive, touch, motion, forced colours
- `prefers-reduced-transparency`: soft tint disabled, ring kept.
- `forced-colors: active`: the tint custom property is ignored and system colours apply.

## Acceptance tests
- Given `resolveTint('success')`, then the result references only `--fk-tint-success-*` custom properties and contains no literal colour.
- Given an unknown tone, then the neutral set is returned.
- Given the token stylesheet, then every tone name has all three tokens defined in both themes (static check).
- Given a categorical tone used on a table cell component, when linted, then the library's usage check flags it (categories restricted by §2.3).
- Given reduced transparency, when a tinted surface renders, then its background is the opaque surface token.
