# SkeletonFill (shimmer utility)

Wave 4 · utility (token API) · Status: specified

## Purpose
The single fill used by every placeholder shape while content loads, so that Skeleton (wave 1), table skeleton rows, card placeholders and any host-made placeholder pulse identically. It replaces two exported class strings of the fork with a token plus a small utility API.

## Anatomy
- **Fill tokens**: `--fk-skeleton-fill` (placeholder colour on a normal surface) and `--fk-skeleton-fill-on-accent` (placeholder on a saturated surface such as the CTA area or an accent band). Both derive from `--fk-line` and `--fk-accent-ink` of §2.3 with alpha; no new hues.
- **Pulse**: an opacity pulse whose period is the one given in §2.12, eased with `--fk-ease`. Opacity only, no moving gradient sweep (a sweep is lateral motion, which §2.7 excludes for decoration).
- **Utility**: `skeletonFill(variant)` returns the style hook (a data attribute or a class name chosen by the implementer) for 'surface' or 'on-accent'; a `SkeletonBlock` primitive applies it with a shape ('line', 'block', 'circle', 'pill') and a size from the spacing scale.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| variant | 'surface' \| 'on-accent' | 'surface' | Which fill token. |
| shape (SkeletonBlock) | 'line' \| 'block' \| 'circle' \| 'pill' | 'line' | Radius from §2.4 (control, card, pill). |
| width, height (SkeletonBlock) | spacing token or percentage | line: full width, body line height | Size. |
| animated | boolean | true | Allows turning the pulse off for static previews. |

## States
Pulsing; static (reduced motion, `animated` false, or print).

## Keyboard and ARIA
- Every placeholder is `aria-hidden`. The loading announcement belongs to the region (`aria-busy` plus one status sentence, §2.12), provided by Skeleton or PageLoadingState, never by each block.

## Responsive, touch, motion, forced colours
- `prefers-reduced-motion`: pulse stops, fill stays at its mid opacity (§2.12).
- `forced-colors: active`: the fill becomes a `GrayText` outline so the shape remains visible.
- Placeholder heights for table rows follow the current density of §2.9.

## Acceptance tests
- Given a SkeletonBlock, when inspected, then it is hidden from assistive technology.
- Given reduced motion, when rendered, then no animation is running and the block is visible.
- Given variant on-accent over the CTA area, when rendered, then the contrast between block and background is at least the non-text minimum of 3:1 in both themes.
- Given forced colours, then the block outline is visible.
- Given two skeletons from different components, when compared, then they share the same fill token and pulse period.
