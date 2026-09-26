# AppLauncherGrid

Wave 2 · navigation · Status: specified

## Purpose
A home-screen style grid of large tiles, one per area of the app, plus an optional group of action tiles (profile, settings, sign out) below a labelled divider. Tiles can offer a short menu of shortcuts.

## Anatomy
- **Page tiles**: icon tile, name (as a heading), optional description, optional count and optional alert count in the corner.
- **Profile tile** (optional): shows the person's picture or initial and role word instead of an icon.
- **Divider with label**: separates page tiles from action tiles when both exist.
- **Action tiles**: same shape, for commands rather than places.
- **Shortcut menu**: per tile, a LongPressMenu / ActionMenu listing shortcuts.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| pages | LauncherTile[] | required | `{ id; label; href; icon; description?; count?; alertCount?; shortcuts?: { label; href?; onPress?; icon? }[]; onPress? }`. |
| actions | LauncherTile[] | [] | Command tiles; when empty, one uniform grid is shown. |
| order | string[] | pages order | Preferred order of page ids; unknown ids go last. |
| actionsLabel | string | from I18nAdapter | Text of the divider. |
| person | { name?; email?; pictureUrl?; roleLabel? } | none | Data for the profile tile. |
| ready | boolean | true | When false, the profile tile shows a neutral placeholder (before session data arrives). |
| onOpen | (tile: LauncherTile) => void | navigate to href | Activation of a page tile without its own `onPress`. |
| onPrefetch | (href: string) => void | none | On hover or focus. |

## States
Tile rest, hover (no lift, §2.7), focus-visible, pressed, with count, with alert count (capped, for example "99+"), shortcut menu open.

## Keyboard and ARIA
- The grid is a list of links (page tiles, RAC `Link`) and buttons (action tiles, RAC `Button`), each a tab stop; optionally a RAC `GridList` for arrow-key movement.
- Tile name is the accessible name, with counts appended ("Sources, 3 new").
- Shortcut menu: opened by a visible "more" button on the tile, by Shift+F10 / the context-menu key, and by long-press on touch (APG Menu Button; RAC `MenuTrigger` + `Menu`). It is never the only route to the destination.
- External destinations (not starting with "/") open through `onOpen` so the host decides how.

## Responsive, touch, motion, forced colours
- Columns reduce with width; at 320 wide two columns fit with the 16 px gutter.
- Each tile far exceeds 44 × 44 px; the "more" button is at least 44 × 44 px.
- Counts meet the 12 px text floor (§2.2).
- No entrance stagger (§2.7). Reduced motion: no scale on press.
- Forced colours: tiles have system borders; counts keep text.

## Acceptance tests
- Given `order` [c, a] and pages a, b, c, then tiles appear c, a, b.
- Given count 150, then the corner shows "99+" and the name includes "150".
- Given actions exist, then the divider label is shown and action tiles follow it.
- Given a page tile focused, when Enter is pressed, then `onOpen` receives that tile.
- Given a tile with `onPress`, when activated, then `onPress` runs and `onOpen` does not.
- Given a person with name "ana" and role label "Researcher", when ready, then the profile tile shows "A" and "Researcher"; when not ready, a neutral placeholder.
- Given a tile's "more" button, when activated, then its shortcuts are listed as menu items.

## Open questions
- The fork uses a focusable element with a button role wrapping a heading and exposes shortcuts only by a pressure/long-press gesture; the spec requires links or buttons and a visible menu trigger.
