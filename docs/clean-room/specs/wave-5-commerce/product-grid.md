# ProductGrid and ProductCard

Wave 5 · commerce · data display · Status: specified

## Purpose
Show a set of products as cards so a shopper can scan them and open one, in a wrapping grid or a horizontally scrolling row, with an optional section header and a "see all" destination. Used on category pages, on the storefront (trending, favourites), below a product (related items) and in the cart (suggestions).

## Anatomy
- **Section header** (optional): SectionHeading (wave 1) with title and an optional trailing "see all" Link. On narrow screens the link may move below the list (`seeAllPlacement`).
- **List**: a list of cards; grid or scroll row.
- **ProductCard**:
  - **Media**: first product image (host media), with a fixed aspect ratio chosen from a short set (`square`, `portrait`, `landscape`), so rows align.
  - **Badges** (optional): Tag (wave 1) items such as "new" or "sale", written by the host.
  - **Title**: the product name, which is the card's single link; the link's hit area is stretched to cover the whole card so the card is one target without nesting interactive elements.
  - **Variant hint** (optional): short line (colour or option count).
  - **Description** (optional): one or two lines, truncated with the full text available to assistive tech.
  - **Price**: Price from commerce primitives, with compare-at when on sale, or a range.
  - **Rating** (optional): RatingDisplay.
  - **Swatches** (optional): a read-only list of available colours named in text for assistive tech; or, when `swatchesInteractive`, a SwatchGroup that switches the card's media and price to that variant.
  - **Stock line** (optional): StockStatus when not plainly in stock.
  - **Card action** (optional): an add-to-cart Button (wave 1) below the media or revealed over the media on hover and always visible on touch and on keyboard focus; or a quick-view Button that opens ProductQuickView.
  - **Favourite toggle** (optional): icon toggle button with a pressed state.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| products | ProductSummary[] | required | Cards to show. |
| title | string | none | Section title; the list is labelled by it. |
| headingLevel | 2 to 4 | 2 | Document level of the title. |
| seeAll | { label; href or onPress } | none | "See all" destination. |
| seeAllPlacement | 'header' \| 'footer' \| 'responsive' | 'responsive' | Responsive puts it in the header on wide screens and after the list on narrow ones. |
| layout | 'grid' \| 'scroll-row' | 'grid' | Wrapping grid or single horizontally scrolling row. |
| columns | { narrow; medium; wide } | { 2, 3, 4 } | Cards per row by container width (grid). |
| density | 'regular' \| 'bordered' \| 'compact' | 'regular' | Bordered draws cell rules between cards (catalogue look); compact reduces text. |
| mediaAspect | 'square' \| 'portrait' \| 'landscape' | 'square' | Media frame shape. |
| show | { rating?; description?; variantHint?; swatches?; stock?; badges? } | { variantHint } | Which optional parts appear. |
| cardAction | 'none' \| 'add-to-cart' \| 'quick-view' \| 'link' | 'none' | Action under or over each card. |
| actionPlacement | 'below' \| 'overlay' | 'below' | Overlay reveals on hover and focus, always shown on touch. |
| onAddToCart | (product) => void \| Promise | none | Called by the add action; a promise shows pending on that card only. |
| onQuickView | (product) => void | none | Called by the quick-view action. |
| onFavouriteChange | (product, on) => void | none | Enables the favourite toggle. |
| favourites | Set of ids | none | Controlled favourite state. |
| swatchesInteractive | boolean | false | Swatch choice switches media and price on the card. |
| status | 'ready' \| 'loading' \| 'empty' \| 'error' | 'ready' | Region state. |
| skeletonCount | number | columns.wide | Placeholders while loading. |
| emptyState / errorState | EmptyState / ErrorState props | from i18n | Content of those states. |
| onRetry | () => void | none | Retry in the error state. |
| renderMedia | (media, context) => node | none | Host image renderer. |
| labels | object | from I18nAdapter | Add, added, quick view, favourite, see all, colours available. |

## States
Ready; loading (Skeleton cards with media, two text lines and a price line, same count and shape as the final grid, §2.12); empty (EmptyState, wave 1, distinguishing "no products yet" from "no results for these filters", with a clear-filters action supplied by the host); error (ErrorState, wave 1, with retry); card hover (media tint only, no lift, §2.7); card focus-visible (ring around the whole card, §2.6); add action pending (in-button spinner); added (button shows a check and "added" for a moment, then returns; the cart count update is the host's); out of stock (action disabled and StockStatus shown); favourite on and off.

## Keyboard and ARIA
- The grid is a list (`ul` semantics) labelled by the section title; each card is a list item containing an `article` labelled by the product name.
- Tab order per card: title link (covering the card), then the card action, then the favourite toggle. The stretched link never wraps the other controls.
- Add and quick-view buttons have names that include the product ("Add {product} to cart").
- Favourite: APG **Button** with `aria-pressed`.
- Scroll row: the scroller is a focusable region named by the title so keyboard users can scroll with arrow keys; cards remain in tab order; optional previous and next buttons scroll by one page of cards and are hidden from assistive tech when the ends are reached. No automatic scrolling.
- Read-only swatches: a list named "available colours" whose items are the colour names.
- After adding, a polite live message says "{product} added to cart" (from i18n).

## Responsive, touch, motion, forced colours
- Column count follows container width (container queries), not viewport width, so a grid inside a sidebar layout reflows correctly.
- Scroll row snaps to card starts; on narrow screens the next card peeks so scrolling is discoverable; the row respects the page gutter.
- Overlay actions are always visible on touch devices (no hover dependency) and whenever focus is inside the card.
- Motion: media crossfade on swatch change only with opacity, removed under reduced motion; no hover zoom.
- Forced colours: bordered density draws rules in `CanvasText`; card focus ring uses `Highlight`.
- Right-to-left: scroll row starts at the right edge; previous and next buttons and arrow glyphs mirror.

## Acceptance tests
- Given six products and `columns.wide` 4 in a wide container, when rendered, then two rows show four and two cards.
- Given a card, when the person clicks anywhere on it except its buttons, then it navigates to the product's `href`.
- Given `cardAction="add-to-cart"` and `onAddToCart` returns a pending promise, when pressed, then only that card's button is pending and others stay enabled.
- Given the add promise resolves, then a polite announcement names the product.
- Given a product with `stock.status` out-of-stock, then its add button is disabled and the stock word is shown.
- Given `actionPlacement="overlay"` on a touch device, then the action is visible without hover.
- Given keyboard focus moves into a card with an overlay action, then the action becomes visible.
- Given `status="loading"`, then skeletons with the same count as `skeletonCount` show and no live region announces them individually.
- Given `status="empty"` with a filters-applied reason, then the empty state offers the host's clear-filters action.
- Given `layout="scroll-row"`, when the region is focused and Right Arrow pressed (left-to-right), then the row scrolls.
- Given a product on sale, then the compare-at price is struck through and announced as the original price.
- Given `swatchesInteractive` and a second colour chosen, then the card's media and price switch to that variant and the title link includes the variant parameter supplied by the host.
- Given axe, then no card contains nested interactive elements.

## Composition notes
Reuses SectionHeading, Link, Tag, Button, Skeleton, EmptyState, ErrorState (wave 1) and Price, RatingDisplay, StockStatus, SwatchGroup (commerce primitives). Pagination (wave 1) goes below a grid on category pages; this component does not page itself.

## Open questions
- Whether "load more" (append) should be a built-in footer or left to the host with Pagination.
