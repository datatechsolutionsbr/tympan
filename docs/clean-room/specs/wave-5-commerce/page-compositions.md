# Commerce page compositions

Wave 5 · commerce · layout · Status: specified

## Purpose
Describe the seven store page types as arrangements of the wave-5 components and existing Tympan parts: which regions each page has, in what order, how they reflow, and what data the host supplies. These are composition recipes (documented examples and gallery pages), not new components; the only new part is StorePage, a thin frame that places header, main and footer and wires the skip link.

## Anatomy
### StorePage (frame)
- SkipLink (wave 1) to the main region.
- StoreHeader (optional utility bar).
- Main region (`main` landmark) with the page's regions below, in the page's content width (layout tokens: `wide` for storefront, category and product pages, `reading` for order pages, `form` for checkout).
- StoreFooter (checkout may use a minimal footer: legal line only).
- Global overlays mounted once: CartView drawer, ProductQuickView, Toast region (wave 1).

### 1. Storefront (home)
Order of regions:
1. PromoBanner, `size="hero"`, heading level 1 (background or tiles arrangement), optionally with its offer strip above.
2. CategoryShowcase (mosaic or scroll row).
3. ProductGrid "trending" in scroll-row layout with a see-all link.
4. PromoBanner (section size) for a collection or sale, optionally with customer quotes.
5. ProductFeatureSection or a second CategoryShowcase (split) for a featured collection.
6. BenefitStrip (row).
7. Newsletter lives in StoreFooter.
Reflow: every region is full width and stacks; scroll rows stay horizontal on narrow screens.
Host data: campaigns, categories with media, product summaries, benefits.

### 2. Category (product listing)
1. Breadcrumbs (optional).
2. Category header: PageHeader (wave 1) with title and description; or a PromoBanner (compact, background) when the category has media.
3. FacetedFilterBar: popovers or panel layout above the grid, or sidebar layout beside it.
4. Result line: count and view switch (part of the filter bar).
5. ProductGrid (grid layout; bordered density for dense catalogues).
6. Pagination (wave 1) or load more.
7. Optional BenefitStrip or PromoBanner at the end.
Reflow: sidebar layout puts filters in a start column on wide screens; on narrow screens filters move into the filter sheet and the grid takes two columns.
Host data: facets with counts, applied filters and sort (usually from the address), product page, total count, categories for subcategory links.

### 3. Product
1. Breadcrumbs.
2. ProductDetail (gallery arrangement per product type; detail sections as disclosures or tabs).
3. BenefitStrip inline (delivery, returns), inside or right after ProductDetail.
4. ProductFeatureSection (specs or feature stories).
5. ReviewSummary beside ReviewList (or inside a ProductDetail tab).
6. ProductGrid "related" or "also bought" in scroll-row layout, with add-to-cart or quick-view card actions.
Reflow: two columns (media, purchase) collapse to one; the optional sticky purchase bar appears on narrow screens.
Host data: product, options, variants with stock, detail sections, reviews and aggregate, related products.

### 4. Shopping cart
1. PageHeader with title and item count.
2. CartView `presentation="page"`: two-column (lines and summary), single column, or extended summary.
3. BenefitStrip (grid) as a policy grid under the cart.
4. ProductGrid suggestions (scroll row).
Reflow: summary follows lines on narrow screens with an optional sticky total and checkout bar.
Host data: lines with stock and limits, totals (subtotal, discounts, delivery estimate, taxes), promo handling, suggestions.

### 5. Checkout
1. Minimal header variant: StoreHeader with only the brand and an optional "secure checkout" note (no mega menus, no search) so the shopper is not pulled away; a back-to-cart link.
2. CheckoutForm in single-page, stepped or split flow; the summary column contains CartLineItem rows and PriceBreakdown.
3. Minimal footer (legal line, policy links).
Reflow: summary collapses into a disclosure bar at the top on narrow screens; submit at the bottom.
Host data: draft values, countries and templates, postal-code lookup, delivery options (after address), payment methods and the provider's secure-field slot, totals, validation and submit.

### 6. Order history
1. PageHeader "Orders" with intro.
2. Optional period filter and search.
3. OrderHistoryList (cards, table, list or quick actions).
4. Pagination.
Reflow: order headers stack; actions collapse into menus.
Host data: orders with items and statuses, invoice links, buy-again handler.

### 7. Order detail and confirmation
1. OrderDetail in `confirmation` mode right after checkout (optionally split with a hero media), or `detail` mode from the history.
2. Next-step links; in confirmation mode, an optional ProductGrid of suggestions.
Reflow: blocks stack; shipment progress turns vertical.
Host data: the order (shipments, stages, addresses, payment, totals), tracking, payment instructions when pending.

## Properties and events
StorePage:
| Name | Type | Default | Meaning |
|---|---|---|---|
| header | StoreHeader props or node | required | Top. |
| footer | StoreFooter props or node | none | Bottom. |
| width | 'wide' \| 'reading' \| 'form' | 'wide' | Content width from layout tokens. |
| chrome | 'full' \| 'minimal' | 'full' | Minimal for checkout. |
| overlays | node | none | Cart drawer, quick view, toasts. |
| labels | object | from I18nAdapter | Skip link text. |

All other properties belong to the composed components.

## States
Each region owns its own loading, empty and error state; the page never shows one global spinner (§2.12). Recommended page-level rules:
- first paint shows the header, footer and region skeletons at once;
- a failing optional region (promo, suggestions, reviews) hides or shows a compact notice without blocking the purchase path;
- a failing required region (product not found, cart failed) uses HttpErrorPage (wave 2) or ErrorState in the main region.

## Keyboard and ARIA
- One `h1` per page (hero headline, category title, product name, "Cart", "Checkout", "Orders", order title); regions below use level 2 headings.
- Landmarks: header, main, footer; navigation regions labelled distinctly (main navigation, breadcrumbs, offers, pagination).
- The skip link moves focus to `main`.
- Overlays (cart drawer, quick view, filter sheet, store menu) are modal dialogs with focus return; only one is open at a time.
- Route changes (host router) move focus to the new page's `h1` and announce the title.

## Responsive, touch, motion, forced colours
- Wide, medium and narrow behaviour follows each component; page gutters and content widths come from layout tokens and container queries.
- Sticky bars (product purchase bar, cart total bar, checkout total bar) never stack: at most one sticky bottom bar per page, respecting SafeAreaInset.
- No page-level motion beyond route progress (RouteProgress, wave 2) when the host uses it.
- Forced colours and right-to-left: inherited from components; the page adds nothing that relies on colour alone.

## Acceptance tests
- Given each of the seven page examples rendered with sample host data in pt-BR and en, when checked with axe, then there are no violations.
- Given any page, then exactly one level-one heading exists and the skip link targets `main`.
- Given the category page on a narrow viewport, then filters are reachable only through the filter sheet and the grid shows two columns.
- Given the product page on a narrow viewport, then media precedes the purchase area and at most one sticky bottom bar is visible.
- Given the checkout page, then the header has no category navigation or search.
- Given the storefront with the promo region failing, then the rest of the page renders and no error blocks it.
- Given `dir="rtl"` on each page, then layout mirrors and prices keep their internal order.
- Given all example pages, then no product name, image or price is embedded in the components; all come from the example host data files.

## Composition notes
- Example host data for the gallery is written fresh for Tympan (neutral generic products with Portuguese and English names, BRL prices, images from an openly licensed set or plain frames), never copied from any source kit.
- Reuses SkipLink, PageHeader, Breadcrumbs, Pagination, Toast, ErrorState (wave 1), HttpErrorPage, RouteProgress, SafeAreaInset, RouterAdapter, I18nAdapter (wave 2).
