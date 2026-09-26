# FeatureTile

Wave 4 · data display · Status: specified

## Purpose
A compact block on a public page that names one capability with an icon, a title and one or two sentences. Unlike FeatureShowcaseCard it has no media area and is usually shown in a list of three to six.

## Anatomy
- **Icon badge**: a lucide icon (§4.4) inside a small square using `--fk-accent-soft` as background and `--fk-accent` as icon colour. Same colour for every tile: no per-tile hue.
- **Title**: `h3` step (§2.2).
- **Description**: `body` step, reading measure.
- **Container**: no card by default; tiles are separated by RuledGrid rules or by spacing. A raised variant exists for isolated use.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| icon | icon component | required | Lucide icon. |
| title | string | required | Capability name. |
| description | node | required | Explanation. |
| headingLevel | 2 \| 3 \| 4 | 3 | Level of the title. |
| surface | 'none' \| 'raised' | 'none' | Card or not. |
| href | string | none | Optional link; the title becomes the link and its hit area covers the tile. |

## States
Static; with `href`: hover (title underline), focus-visible (ring around the tile), pressed.

## Keyboard and ARIA
- Icon is decorative (`aria-hidden`).
- With `href`: one tab stop named by the title (APG Link, RAC `Link`).
- A set of tiles should be passed as a list by the host (RuledGrid with list semantics).

## Responsive, touch, motion, forced colours
- One column below 640, two from 640, three from 1024 (§2.8).
- No entrance animation, no lift (§2.7).
- Forced colours: icon badge draws a system border; icon uses `CanvasText`.

## Acceptance tests
- Given three tiles, when rendered, then every icon badge uses the same accent tokens.
- Given `href`, when tabbed, then one tab stop exists per tile, named by its title.
- Given no `href`, then the tile is not focusable.
- Given forced colours, then the icon badge outline is visible.
