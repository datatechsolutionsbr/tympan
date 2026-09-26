# FloatingActionBar (full feature)

Wave 4 · navigation · Status: specified · Supersedes `wave-2/floating-action-bar.md`

## Purpose
A floating bar of icon buttons pinned to one edge of the viewport, holding primary destinations and contextual actions, each optionally with a menu of related links and actions, with optional auto-hide. This version is the full feature with a complete keyboard path (reaching the bar, moving inside it, opening item menus, leaving it) and an overflow menu. Design direction §5 notes the Fakhir research app does not use a dock over data; the component is kept for other products and for full-screen canvases, and it must never cover content (see Responsive).

## Anatomy
- **Bar**: floating raised surface (§2.5 level 3) along the bottom, start, end or top edge.
- **Destination items**: icon buttons that navigate; label tooltip; active marker; optional CountBadge (wave 2).
- **Separator** between destinations and contextual items.
- **Contextual items**: actions for the account and the current page.
- **Menu chevron**: a small secondary button attached to items that have a menu.
- **Item menu**: related links and actions, one of which may be destructive (confirmed through ConfirmService).
- **Overflow item**: a "more" button that appears when items do not fit; its menu lists the hidden items in order.
- **Placeholder**: Skeleton shaped like the bar while items load.
- **Reserved space**: the bar publishes its thickness as a CSS custom property on the document root (`--fk-action-bar-inset-<edge>`) so the page and AppFrame can pad content.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| destinations | BarItem[] | required | `{ id; label; icon; href?; onPress?; active?; count?; menu?: MenuEntry[]; shortcut?: string }` |
| contextual | BarItem[] | [] | Items after the separator. |
| edge | 'bottom' \| 'start' \| 'end' \| 'top' | 'start' | Edge on wide screens; below 1024 always bottom. |
| autoHide | boolean | false | Fades out after inactivity; see States. |
| loading | boolean | true while both lists are empty | Placeholder. |
| focusShortcut | string \| null | host-configurable, default a single documented chord | Moves focus into the bar; null disables. |
| label | string | from I18nAdapter | Landmark name. |
| labels | object of strings | from I18nAdapter | More, open menu of ‹item›, count wording. |
| onMenuAction | (itemId, entryId) => void | none | Menu entry without href. |

`MenuEntry = { id; label; icon?; href?; tone?: 'neutral' | 'danger'; confirm?: ConfirmOptions }`.

## States
Item rest, hover (tooltip), focus-visible (tooltip), active (marker plus `aria-current="page"`), with count, menu open, overflowed, bar hidden (auto-hide), bar revealed, loading.

Auto-hide rules: the bar hides only when no pointer or focus activity has occurred inside it or near its edge for a while, and never while it contains focus, has a menu open, or the person uses reduced motion (then it is simply always visible). A hidden bar is inert and removed from the tab order, and the shortcut reveals it.

## Keyboard and ARIA
The full keyboard path:

1. **Reaching the bar.** Three ways: (a) Tab order: the bar sits after the main landmark in the DOM, so it is reached by Tab after the page content; (b) the `focusShortcut` moves focus to the active item (or the first item) and remembers where focus was; (c) SkipLink (wave 1) gets an extra target "go to action bar". The bar is a `nav` landmark, so landmark navigation in screen readers also reaches it.
2. **Inside the bar.** APG Toolbar (RAC `Toolbar`): one tab stop; arrow keys along the bar's orientation (Left and Right for horizontal, Up and Down for vertical; reversed in right-to-left for horizontal) move between items and wrap; Home and End jump to the ends. Menu chevrons are skipped by the arrows and reached with the item: Down Arrow (horizontal bar) or Right Arrow (vertical bar at start edge) on an item with a menu opens its menu.
3. **Item menus.** APG Menu Button (RAC `MenuTrigger` plus `Menu`). Opened by the chevron (click or Enter or Space), by Shift+F10 or the context-menu key on the item, by right-click, and by long press on touch (LongPressMenu, wave 2). First entry focused; arrows move; Enter activates; Escape closes and returns focus to the item. Activating the item itself navigates and closes any open menu.
4. **Overflow.** Hidden items are listed in the "more" menu in bar order; it follows the same menu rules. The active item is never moved into overflow.
5. **Leaving the bar.** Tab or Shift+Tab leave normally. Escape (with no menu open) returns focus to where it was before the shortcut, if focus came by the shortcut; otherwise it does nothing.
6. **Items with their own shortcut** (`shortcut`): registered through EditorShortcuts or the host, exposed with `aria-keyshortcuts` and shown in the tooltip.

ARIA: destinations are links (`aria-current="page"` when active); contextual items are buttons; each item's name is its label plus the count in words ("3 pending"); tooltips appear on hover and focus, are dismissable with Escape without moving focus, and stay while hovered (WCAG 1.4.13).

## Responsive, touch, motion, forced colours
- Each item at least 44 × 44 px.
- Below 1024 the bar moves to the bottom and sits above the bottom safe-area inset (SafeAreaInset); the reserved-space property makes AppFrame pad the page so the bar never covers data (design direction §5 defect).
- Overflow instead of hidden scrollbars: when items exceed the available length, trailing contextual items move into "more" first, then trailing destinations.
- Show, hide and menu transitions in `--fk-dur-quick`; reduced motion: instant, and auto-hide disabled.
- Forced colours: active item marked by a thick system border and the marker shape; separator visible; count keeps its text.

## Acceptance tests
- Given five destinations, then the bar is one tab stop and Right Arrow moves focus through the items, wrapping at the end.
- Given focus in the page, when the focus shortcut is pressed, then focus lands on the active item; when Escape is pressed, then focus returns to the previous element.
- Given the SkipLink list, then it contains a target to the action bar.
- Given an item with a menu, when Down Arrow is pressed on it in a horizontal bar, then the menu opens with its first entry focused; Escape returns focus to the item.
- Given an item with a menu, when Shift+F10 is pressed, then the menu opens.
- Given a destructive entry with confirm options, when chosen, then ConfirmService asks before onMenuAction is called.
- Given ten items in a narrow viewport, then a "more" item appears, lists the hidden items in order, and the active item is still in the bar.
- Given autoHide and focus inside the bar, then it stays visible; given reduced motion, then it never hides.
- Given count 120, then the badge shows the capped form and the name includes 120.
- Given a viewport under 1024 with edge start, then the bar is at the bottom and the page has bottom padding equal to the published inset.
- Given no items yet, then the placeholder is shown, hidden from assistive technology except for a busy status.
