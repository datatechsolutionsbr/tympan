# CategoryShowcase

Wave 5 · commerce · navigation · Status: specified

## Purpose
Invite shoppers into the store's main categories or collections from the storefront or a landing page: a titled set of large, image-led tiles, each a single link to a category. One component with five arrangements: an uneven mosaic of tiles, equal columns, one wide banner, a horizontally scrolling row, and a two-tile split.

## Anatomy
- **Header**: SectionHeading (wave 1) with title and an optional "all categories" Link.
- **Tiles**: each tile has host media, a name, an optional short description, and an optional call-to-action word. The name is the tile's only link and its hit area covers the tile (stretched link). The call-to-action word is decorative (hidden from assistive tech) because the link already names the destination.
- **Scrim**: when text sits over media, a scrim built from the backdrop token guarantees text contrast; text can also sit below the media (`textPlacement`).
- **Footer link**: the "all categories" link repeated after the tiles on narrow screens when the header link is hidden.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | string | required | Section title. |
| headingLevel | 2 to 4 | 2 | Document level. |
| items | { id; name; href; media?: Media; description?: string; cta?: string }[] | required | Tiles. |
| arrangement | 'mosaic' \| 'columns' \| 'banner' \| 'scroll-row' \| 'split' | 'columns' | Mosaic: first tile spans two rows on wide screens. Banner: one item, wide media with overlaid title, description and a Button-styled link. Split: two items side by side. |
| textPlacement | 'overlay' \| 'below' | 'overlay' for mosaic, banner and split; 'below' otherwise | Where the name sits. |
| browseAll | { label; href } | none | Header and footer link. |
| mediaAspect | 'square' \| 'portrait' \| 'landscape' | per arrangement | Frame shape. |
| status | 'ready' \| 'loading' \| 'error' | 'ready' | Region state. |
| renderMedia | (media) => node | none | Host image renderer. |
| labels | object | from I18nAdapter | All categories, scroll previous and next. |

## States
Ready; loading (Skeleton tiles of the same arrangement, §2.12); error (the section hides by default, or shows a compact InlineNotice when the host asks, since a missing promotional section should not break the storefront); tile hover (scrim deepens slightly, no scale); tile focus-visible (ring around the tile); tile without media (neutral frame, text placed below).

## Keyboard and ARIA
- `section` labelled by the title; tiles form a list; each tile's name is a link (Link, wave 1) and the only tab stop in the tile.
- The media inside a tile is decorative when the name already describes it (empty alternative text), unless the host marks it as informative.
- Scroll row: same rules as ProductGrid's scroll row (focusable, named scroller; optional previous and next buttons; no auto-advance).
- Banner: the call to action is the link; the heading precedes it in reading order.

## Responsive, touch, motion, forced colours
- Mosaic and columns become a single column on narrow screens, or a scroll row when `arrangement="scroll-row"`.
- Split stacks vertically on narrow screens.
- Overlay text must meet contrast on the scrim at every width; the scrim strength comes from tokens, not from the media.
- No parallax, no zoom on hover; reduced motion changes nothing else because there is no motion beyond opacity.
- Forced colours: scrims are removed and text sits on `Canvas` with `CanvasText`; tile boundaries get a system border.
- Right-to-left: the scroll row and the mosaic's large tile start on the right.

## Acceptance tests
- Given three items and `arrangement="columns"`, then three list items render, each with exactly one link named by the item's name.
- Given `arrangement="mosaic"` on a wide container, then the first tile spans the height of two others.
- Given a narrow container, then tiles stack in one column and the browse-all link appears after them.
- Given an item without media, then the name is placed below a neutral frame and no broken image is shown.
- Given overlaid text, when contrast is checked against the scrim token, then it meets WCAG AA.
- Given forced colours, then tile text is readable without the scrim.
- Given axe, then there are no duplicate link names pointing to different destinations.

## Composition notes
Reuses SectionHeading, Link, Button, Skeleton, InlineNotice (wave 1) and the media contract of commerce primitives. For product (not category) tiles use ProductGrid.
