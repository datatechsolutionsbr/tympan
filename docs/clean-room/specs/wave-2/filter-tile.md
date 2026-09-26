# FilterTile

Wave 2 · form · Status: specified

## Purpose
A large tappable tile that turns one filter on or off and shows how many items it matches; also a small heading that introduces a group of tiles.

## Anatomy
- Tile: icon well, title, secondary line (count or short description), selected check mark.
- Group heading: small icon well and a level-3 heading text.

## Properties and events
Tile:
| Name | Type | Default | Meaning |
|---|---|---|---|
| selected | boolean | required | Whether the filter is on. |
| onToggle | () => void | required | Called on activation. |
| label | string | required | Title and accessible name. |
| detail | string | none | Secondary line, e.g. "42 records". Included in the accessible description. |
| icon | Icon or image | required | Leading glyph or logo. |
| iconSurface | "tinted" or "neutral" | "tinted" | "neutral" places full-colour logos on a plain light well in both themes so they stay legible. |
| tone | categorical token | neutral | Tint of the icon well only (§2.3); selection itself uses the accent. |
| disabled | boolean | false | Not operable. |

Group heading:
| Name | Type | Default | Meaning |
|---|---|---|---|
| label | string | required | Heading text. |
| icon | Icon | required | Decorative glyph. |
| level | 2, 3 or 4 | 3 | Heading level. |

## States
Rest, hover, focus-visible, pressed, selected (accent-soft background plus check mark and a stronger border, never colour alone), disabled.

## Keyboard and ARIA
- APG pattern: Checkbox (two-state). Backed by RAC `ToggleButton`, exposed with `aria-pressed`; within a group of tiles, wrap in RAC `ToggleButtonGroup` with `selectionMode="multiple"`.
- Space and Enter toggle. Tab moves between tiles.
- Accessible name is `label`; `detail` is the description.

## Responsive, touch, motion, forced colours
- Tiles form a responsive grid (two columns on phones, more above 640).
- The whole tile is the target, at least 44 × 44.
- Selection change: colour transition at `--fk-dur-instant`; no lift or scale (§2.7).
- Reduced transparency: opaque surface.
- Forced colours: selected tile shows a thick system-highlight border and the check mark stays visible.

## Acceptance tests
- Given an unselected tile "Brazil", When the person presses Space, Then onToggle is called once.
- Given selected=true, When rendered, Then the tile reports pressed and a check mark is visible.
- Given detail "42 records", When inspected, Then the tile's description includes "42 records".
- Given a group heading with level 3, When rendered, Then a level-3 heading with its label exists.
- Given forced colours, When a tile is selected, Then the selected state is distinguishable without colour.

## Open questions
- The fork offered a free list of hue names per tile; this spec restricts hues to the categorical tokens and uses the accent for selection.
