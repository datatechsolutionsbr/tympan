Wave 2 · Layout · Status: specified

# SafeAreaInset

## Purpose
Keeps content clear of device notches, rounded corners and home indicators by applying the environment's safe-area insets to chosen edges.

## Anatomy
- **Inset box**: wrapper that pads selected edges by the device inset.
- **Full-screen view**: pads all four edges.
- **Spacer**: an empty block whose height equals the top or bottom inset.
- **Bottom bar**: a fixed container at the bottom, padded by the bottom inset, with an optional glass surface (§2.5 level 3).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| edges | ('top' or 'bottom' or 'start' or 'end')[] | ['top', 'bottom'] | Edges that receive inset padding (start/end follow writing direction). |
| layout | 'block' or 'flex-column' | 'block' | Whether the box lays children as a column. |
| Spacer: position | 'top' or 'bottom' | required | Which inset to reserve. |
| Bottom bar: surface | 'glass' or 'none' | 'glass' | Background treatment. |

## States
None beyond the insets reported by the environment (zero on devices without them).

## Keyboard and ARIA
- Purely presentational; no roles added. The bottom bar gets a landmark only if the host passes one.
- No APG pattern.

## Responsive, touch, motion, forced colours
- Works when the host page declares viewport-fit cover; with zero insets nothing changes.
- The bottom bar must not hide focused elements: the page adds scroll padding equal to its height (§2.6 focus not obscured).
- Reduced transparency: bottom bar opaque. Forced colours: bottom bar top border in `CanvasText`.

## Acceptance tests
- Given edges top and bottom, then the rendered box pads exactly those edges with the environment inset expression.
- Given a right-to-left document and edge start, then the right side is padded.
- Given the bottom bar and a focused input under it, then the input scrolls into view above the bar.
- Given no inset support, then layout is unchanged.

## Open questions
- The fork's inset-measuring hook returns zeros; not carried over. If JS values are needed, measure a probe element.
