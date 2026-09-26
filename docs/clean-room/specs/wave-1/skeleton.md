# Skeleton and PageLoadingState

Wave 1 · feedback · Status: specified

## Purpose
Placeholders that take the shape of the content being loaded, so the page keeps its layout and the reader knows what is coming (design direction §2.12: every loading state is a skeleton; no loose spinner).

## Anatomy
- **Block**: a single placeholder shape (text line, heading line, circle for an avatar, rectangle for media or a chart). Its fill and pulse come from SkeletonFill (`wave-4/skeleton-fill.md`), shared with every other placeholder.
- **Presets** composed from blocks:
  - text lines (three widths, as §2.12 asks);
  - stat tiles row (icon circle, value line, label line) with a configurable count and column count;
  - card grid (title, two text lines, footer line) with configurable count and columns;
  - section heading (icon circle, title line, subtitle line);
  - filter bar (a row of pill shapes, used for chip or region filters);
  - analysis panel (header plus a list of three item rows);
  - table rows (see DataTable).
- **PageLoadingState**: a page-level wrapper that renders a preset (or host-supplied skeleton) plus a status message.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| shape | 'line' \| 'heading' \| 'circle' \| 'rect' | 'line' | block form |
| width | 'short' \| 'medium' \| 'long' \| 'full' \| CSS length | 'full' | block width |
| lines | number | 1 | stacked lines for text blocks, widths varied automatically |
| preset | 'stats' \| 'cards' \| 'section-heading' \| 'filters' \| 'analysis' | none | composed skeleton |
| count / columns | number / 1 to 4 | preset-specific | repetitions and grid columns for presets |
| label | string | from I18nAdapter ("Loading") | PageLoadingState: sentence announced in the status region, such as "Loading the catalogue" |
| compact | boolean | false | PageLoadingState inside a section instead of a full page |
| children | node | none | PageLoadingState: custom skeleton instead of a preset |

## States
- pulsing (default), static (reduced motion).

## Keyboard and ARIA
- APG: no widget pattern. RAC: none needed; custom.
- Blocks are hidden from assistive technology.
- The region being loaded is `aria-busy="true"`; PageLoadingState includes one `role="status"` element with `label`, so loading is announced once.
- Not focusable.

## Responsive, touch, motion, forced colours
- Presets reflow with the same breakpoints as the real content (§2.8), so no layout jump happens when data arrives.
- Pulse: opacity only, period 1.6 s (§2.12); stopped under `prefers-reduced-motion`.
- Colour from `--fk-surface-sunken` on the surface; radius matches the real element (`--fk-radius-control` for lines, `--fk-radius-card` for cards).
- Forced colours: blocks show as outlined shapes in `GrayText` so the layout remains perceivable, or are hidden; the status text remains.

## Acceptance tests
- Given PageLoadingState with label "Loading the catalogue", Then exactly one status element has that text and the region is `aria-busy`.
- Given any preset, Then no element inside is exposed to the accessibility tree except the status.
- Given preset stats with count 3 and columns 3, Then three tile skeletons render in one row at wide widths.
- Given reduced motion, Then no animation runs on blocks.
- Given `lines` 3, Then three lines render with at least two different widths.
