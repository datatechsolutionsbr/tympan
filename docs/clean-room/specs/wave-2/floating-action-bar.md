# FloatingActionBar

Wave 2 · navigation · Status: specified

## Purpose
A floating bar of icon buttons pinned to one edge of the viewport, holding primary destinations and contextual actions, with an optional per-item menu and auto-hide. Kept for products that want it; design direction §5 says the Fakhir research app does not use it, so it is low priority.

## Anatomy
- **Bar**: a floating raised surface (§2.5 level 3) along the bottom, left, right or top edge.
- **Destination items**: icon buttons with a label tooltip, an active marker and optional count.
- **Separator** between destinations and contextual actions.
- **Contextual items**: account and page-specific actions.
- **Item menu**: a small menu of related links and actions, one may be destructive.
- **Placeholder**: a skeleton of the bar shown while items load.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| destinations | BarItem[] | required | `{ id; label; icon; href?; onPress; active?; count?; menu?: { label; href?; onPress?; icon?; tone?: 'neutral' \| 'danger' }[] }`. |
| contextual | BarItem[] | [] | Items after the separator. |
| edge | 'bottom' \| 'start' \| 'end' \| 'top' | 'start' | Edge on wide screens. Below 1024 the bar always moves to the bottom. |
| autoHide | boolean | false | Fades out after a period without pointer or focus activity; any focus inside or pointer near the edge brings it back. |
| loading | boolean | derived: true when both lists are empty | Shows the placeholder. |
| label | string | from I18nAdapter | Landmark name. |

## States
Item rest, hover (label tooltip), focus-visible (tooltip), active (persistent label or marker plus `aria-current`), with count, menu open, bar hidden (auto-hide), loading.

## Keyboard and ARIA
- The bar is a `nav` landmark (for destinations) containing a toolbar (APG Toolbar pattern, RAC `Toolbar`): one tab stop, arrow keys move between items along the bar's orientation, Home/End jump to ends.
- Destination items are links with `aria-current="page"` when active; contextual items are buttons.
- Items with a menu: APG Menu Button; RAC `MenuTrigger` + `Menu`. The menu opens with Enter or Down Arrow on a dedicated chevron, with the context-menu key, and with right-click; Escape closes and returns focus. Activating the item itself navigates and closes any open menu.
- A click outside closes the menu.
- Auto-hide never hides the bar while it contains focus; hidden bars are also inert.

## Responsive, touch, motion, forced colours
- Each item at least 44 × 44 px; the bar scrolls horizontally without a visible scrollbar when items overflow, keeping the focused item in view.
- Sits above the bottom safe-area inset; the page reserves space so the bar never covers content (design direction §5 notes the defect of a bar over data).
- Show/hide and menu transitions in `--fk-dur-quick`; reduced motion: instant.
- Forced colours: active item marked by a system border; separator visible.

## Acceptance tests
- Given 5 destinations, then one toolbar tab stop exists and Right Arrow moves focus between items.
- Given an active destination, then it has `aria-current="page"`.
- Given count 120, then "99+" is shown and the name includes 120.
- Given an item with a menu, when its chevron is activated with Enter, then the menu opens; when an item that only has an href is chosen, navigation occurs.
- Given a menu is open, when the pointer presses outside, then it closes.
- Given `autoHide` and focus inside the bar, then it stays visible.
- Given a viewport under 1024 with edge 'start', then the bar sits at the bottom.
- Given no items yet, then the placeholder is shown and is hidden from assistive technology except for a busy status.

## Open questions
- The fork opens item menus only on right-click, which is unreachable by keyboard and touch; the spec adds a chevron and the context-menu key.
