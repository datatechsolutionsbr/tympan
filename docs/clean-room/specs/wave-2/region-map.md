# RegionMap

Wave 2 · chart · Status: specified

## Purpose
Interactive map of a country's subdivisions that places count markers on regions with items, lets people toggle regions as filters and inspect the items of a region; includes zoom controls, a legend and a state hook.

## Anatomy
- **Map canvas**: subdivision shapes loaded from a host-supplied geographic file, projected (Mercator, or an equal-area projection suited to the country), coloured with categorical tokens (§2.3, maps are an allowed use).
- **Markers**: one per region with items, sized by count in a few steps, showing the count.
- **Hover/focus panel**: host-rendered content for the region under the pointer or keyboard focus.
- **Counter**: optional sentence summarising totals and active selection.
- **Zoom controls**: zoom in, zoom out, current zoom as a percentage.
- **Legend**: top regions by count with colour swatch (or flag image) and label, plus "and N more".
- **Region list alternative**: a list of regions with counts and toggle buttons, always available (visually or as a toggleable view).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| items | T[] | required | Data items. |
| getRegionCode | `(item: T) => string` | required | Region of an item. |
| regionCentres | `Record<code, [lon, lat]>` | required | Marker positions; items of unknown regions are ignored. |
| shapesUrl | string | required | Geographic shapes; region code read from a property. |
| regionProperty | string | `'code'` | Property holding the code. |
| projection | `'mercator' \| 'equal-area'` | `'mercator'` | Projection. |
| getRegionName | `(code) => string` | code | Human name. |
| getRegionTone | `(code) => token` | categorical sequence | Region colour. |
| isRegionActive / onRegionToggle | `(code) => boolean` / `(code) => void` | undefined | Filter selection. |
| renderRegionDetail | `(code, items) => node` | undefined | Panel content. |
| formatCounter | `(totals) => string` | undefined | Counter sentence. |
| labels | `{ map; zoomIn; zoomOut; legendTitle; more }` | from i18n | Strings. |

## State hook (`useRegionMapState`)
Groups items by region (sorted by count, descending), holds zoom (bounded range, fixed step), pan offset and hovered region, and computes marker size that shrinks as zoom grows so markers stay legible.

## States
- Loading shapes: skeleton; shapes failed: the map area shows an error and the region list alternative still works (partial state, §2.12).
- Region: idle, hovered, focused, active (selected as filter). Zoom at minimum or maximum disables the matching button.

## Keyboard and ARIA
- Canvas is a labelled group; regions with items are focusable toggle buttons (`aria-pressed`) in count order, one tab stop with arrow-key roving (APG Grid/Toolbar-like roving tabindex). Enter/Space toggles; focusing a region opens the detail panel; Esc closes it.
- Plus and minus keys zoom; arrow keys with a modifier pan. Esc leaves the map (design direction §5: focus never trapped).
- Zoom buttons: RAC `Button`, disabled at limits; zoom value announced politely.
- Legend and region list are lists; flags have the region name as alt text.

## Responsive, touch, motion, forced colours
- Drag to pan and pinch to zoom on touch; a drag never counts as a tap.
- Zoom buttons 44 × 44 px. Markers' hit areas at least 44 px on touch.
- Marker entrance without stagger (§2.7); zoom changes are instant under reduced motion.
- Forced colours: region borders and active regions use system highlight; markers keep count text.

## Acceptance tests
- Given items in two regions and one unknown, when rendered, then two markers appear and the unknown item is ignored.
- Given zoom at maximum, when rendered, then zoom-in is disabled.
- Given focus on the first region, when Enter is pressed, then `onRegionToggle` receives its code and `aria-pressed` updates.
- Given the shapes request fails, when rendered, then an error appears in the map area and the region list still toggles regions.
- Given seven regions and legend limit five, when rendered, then five legend items and "+2 more" appear.
- Given a drag gesture, when released over a region, then no toggle fires.

## Open questions
- The fork's map is pointer-only (no keyboard access, no text alternative); both are new requirements. Per-country identity data comes from `wave-4/region-theme-registry.md` and `wave-4/region-theme-data.md` (opt-in identity mode).
