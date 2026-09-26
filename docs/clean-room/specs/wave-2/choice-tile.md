# ChoiceTile

Wave 2 · form · Status: specified

## Purpose
The minimal toggle primitive behind every "tap to select" chip, tile or cell whose visual content is supplied by the caller.

## Anatomy
- One pressable region that wraps caller-provided content (flag, emoji, icon, multi-line text).
- No imposed shape; the caller chooses between the design direction's chip, control or card radii (§2.4).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| selected | boolean | required | Pressed state. |
| onPress | () => void | none | Activation handler. |
| label | string | none | Accessible name; required when the content is not text (icon-only). |
| disabled | boolean | false | Blocks activation and dims the tile. |
| shape | "pill", "control" or "card" | "control" | Radius step from §2.4. |
| haptic | boolean | true | Requests a light haptic tick on activation where supported (see Haptics). |
| children | node | required | Visible content. |

## States
Rest, hover, focus-visible, pressed (while pointer is down), selected, disabled. The selected treatment is supplied by the tile (accent-soft fill and accent border) unless the caller opts into their own, but it must never rely on colour alone.

## Keyboard and ARIA
- APG pattern: Button (toggle). Backed by RAC `ToggleButton` (role button with `aria-pressed`).
- Space and Enter toggle. In groups, the parent may use RAC `ToggleButtonGroup` for single or multiple selection with roving focus.
- An icon-only tile without `label` is a development-time error (warn in dev builds).

## Responsive, touch, motion, forced colours
- Hit area at least 44 × 44 even when the visible chip is smaller.
- Colour transition at `--fk-dur-instant`; none with reduced motion.
- Forced colours: selected tile has a system-highlight outline.

## Acceptance tests
- Given a tile with selected=false, When clicked, Then onPress is called once and a light haptic is requested.
- Given disabled=true, When clicked, Then onPress is not called.
- Given icon-only content and label "Portuguese", When rendered, Then the button is named "Portuguese".
- Given selected=true, When inspected, Then aria-pressed is true.
- Given a touch viewport and a pill tile, When measured, Then its hit area is at least 44 × 44 px.
