# ProductDetail

Wave 5 · commerce · form and data display · Status: specified

## Purpose
The purchase area of a product page: show the product's media, name, price, rating and description, let the shopper choose a variant (colour, size and so on) and a quantity, see stock for that choice, and add it to the cart; then offer the product's secondary information (details, care, shipping, returns, FAQ, licence) in collapsible sections or tabs. One component with several media and detail arrangements. Its parts are reused by ProductQuickView.

## Anatomy
- **Breadcrumbs** (optional): Breadcrumbs (wave 1) above the product.
- **MediaGallery**: one of
  - `thumbnails`: a main image with a row of thumbnail buttons that select it;
  - `grid`: two to four images shown at once in an uneven grid (first image large);
  - `stack`: images stacked vertically (wide screens) that become a swipeable row with PageDots (wave 2) on narrow screens;
  - `single`: one image.
  Every image comes from the host; zoom is an optional host-provided viewer opened from the main image.
- **Title block**: product name (the page's level-one heading by default), Price (with compare-at and a "sale" Tag when discounted), RatingDisplay linking to the reviews.
- **Short description**: host content rendered as plain text or through MarkdownView (wave 2); never raw HTML.
- **Highlights** (optional): a short bullet list.
- **VariantPicker**: one SwatchGroup per ProductOption (colour discs, text boxes, media thumbnails), each with a legend that names the selected value, and an optional guide link (measurement chart).
- **Stock line**: StockStatus for the selected variant (or a prompt to choose options when the choice is incomplete).
- **QuantityStepper** (optional): limited by stock and per-order limit.
- **Purchase actions**: primary add-to-cart Button; optional secondary buy-now Button; optional favourite toggle; optional "notify me" action replacing add-to-cart when out of stock.
- **Service notes** (optional): BenefitStrip in `inline` arrangement (delivery estimate, returns).
- **Detail sections**: either collapsible sections (APG disclosure, each with a title and a body of text or a list), or Tabs holding reviews, FAQ and licence text, or a plain stacked list; chosen by `detailsPresentation`.
- **Featured details** (optional): a short list of term and value pairs next to the media (split arrangement).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| product | ProductSummary plus { description?; highlights?: string[] } | required | Product data. |
| options | ProductOption[] | [] | Selectable dimensions. |
| variants | Variant[] | [] | Purchasable combinations; with none, the product is a single item. |
| selection | Record<optionId, valueId> | none | Controlled selection; uncontrolled starts from `defaultSelection` or the first available variant when `autoSelectFirstAvailable`. |
| onSelectionChange | (selection, variant or null) => void | none | Fires on every option change with the resolved variant, if the choice is complete. |
| quantity / onQuantityChange | number / handler | 1 | Quantity. |
| showQuantity | boolean | false | Shows the stepper. |
| onAddToCart | ({ variantId, quantity }) => void \| Promise | required | Add action; a promise puts the button in pending; a rejection shows an InlineNotice with the host's message. |
| onBuyNow | same | none | Secondary purchase action. |
| onNotifyMe | (variantId) => void | none | Offered when the chosen variant is out of stock. |
| favourite / onFavouriteChange | boolean / handler | none | Favourite toggle. |
| mediaLayout | 'thumbnails' \| 'grid' \| 'stack' \| 'single' | 'thumbnails' | Gallery arrangement. |
| layout | 'two-column' \| 'split-featured' | 'two-column' | Split-featured puts featured details beside the media. |
| featuredDetails | { term; value }[] | none | For `split-featured`. |
| detailSections | { id; title; content: text or string[] or node; defaultOpen? }[] | [] | Secondary information. |
| detailsPresentation | 'disclosure' \| 'tabs' \| 'list' | 'disclosure' | How sections render. |
| breadcrumbs | Breadcrumbs items | none | Trail above. |
| serviceNotes | BenefitStrip items | none | Inline benefits under the actions. |
| sizeGuide | { optionId; label; href or onPress } | none | Guide link on one option. |
| headingLevel | 1 to 2 | 1 | Level of the product name. |
| status | 'ready' \| 'loading' \| 'error' \| 'unavailable' | 'ready' | Unavailable means discontinued: purchase area replaced by a notice. |
| renderMedia | (media, context) => node | none | Host image renderer. |
| labels | object | from I18nAdapter | Add to cart, adding, added, buy now, notify me, choose option, favourite, measurement chart, image N of M, show image, sale, quantity, details. |

Price shown always follows the resolved variant (its price and compare-at) and falls back to the product's price or range while the choice is incomplete.

## States
- Selection incomplete: add-to-cart remains enabled; activating it moves focus to the first unchosen option and shows an inline error "choose a {option}" (preferred over a silently disabled button).
- Selection complete and available: price, stock and media (if the variant has its own) update.
- Value unavailable for the current other choices: marked in its SwatchGroup; choosing it shows out-of-stock and swaps the primary action to "notify me" when offered.
- Low stock: StockStatus shows the remaining quantity; the stepper max follows it.
- Adding (pending), added (button briefly shows a check and "added"; the host usually opens CartView as drawer), add failed (InlineNotice, button re-enabled).
- Loading: Skeleton for media, title lines, price and option rows (§2.12).
- Error: ErrorState with retry.
- Discontinued: purchase area replaced by an InlineNotice and optional link to similar products.

## Keyboard and ARIA
- Product name is the page heading (level configurable); sections below are labelled regions.
- Thumbnails gallery: APG **Tabs** pattern (thumbnails are tabs named "Image N of M" plus the image alternative text; the main image is the tab panel), manual activation not required; arrow keys move between thumbnails.
- Stack gallery on narrow screens: a scrollable region named "Product images" with PageDots as an optional control; each image carries alternative text.
- VariantPicker: one APG **Radio Group** per option (SwatchGroup), legend named by the option label; changes to price and stock are announced politely in one message ("{value} selected, {price}, {stock}").
- QuantityStepper: APG Spinbutton.
- Add to cart: native button in a `form`; Enter in the quantity field submits.
- Detail sections, disclosure form: APG **Disclosure** (button with `aria-expanded` inside a heading); tabs form: APG **Tabs**.
- Favourite: toggle button with `aria-pressed`.
- The description never injects host HTML; MarkdownView sanitises.

## Responsive, touch, motion, forced colours
- Two columns (media, then purchase area) on wide screens; one column on narrow screens with media first, then title block, options and actions.
- On narrow screens, an optional sticky bar at the bottom (`stickyPurchaseBar`) repeats price and the add action once the main button scrolls out of view; it respects SafeAreaInset (wave 2) and never covers focused content.
- Thumbnail row scrolls horizontally when there are more images than fit.
- Media changes crossfade (opacity only), removed under reduced motion.
- Forced colours: selected thumbnail has a system outline plus `aria-selected`; disclosure icons use `CanvasText`.
- Right-to-left: gallery and thumbnails mirror; the sticky bar's order mirrors.

## Acceptance tests
- Given two options and a matching variant, when both values are chosen, then `onSelectionChange` fires with that variant and the price shows the variant price.
- Given an incomplete selection, when add-to-cart is activated, then `onAddToCart` does not fire, focus moves to the first unchosen option and an error names it.
- Given a variant with `stock.status` out-of-stock and `onNotifyMe`, then the primary action is "notify me" and add-to-cart is not shown.
- Given a variant with low stock quantity 2, then the stepper max is 2 and the stock line says two remain.
- Given `onAddToCart` rejects with a message, then the message appears in an InlineNotice and the button is enabled again.
- Given the thumbnails gallery, when the third thumbnail is activated, then the main image changes and the thumbnail reports selected.
- Given a variant with its own media, when chosen, then the gallery shows that media first.
- Given detail sections with `detailsPresentation="disclosure"`, when a section title is activated, then its body toggles and `aria-expanded` reflects it.
- Given a description containing markup characters, then they render as text, not as elements.
- Given a narrow viewport and `stickyPurchaseBar`, when the main add button scrolls away, then the bar appears and its button adds the same selection.
- Given pt-BR and a BRL variant, then the price uses the Brazilian format; given en, the same amount uses the English separators.
- Given axe in loading, ready and error states, then no violations.

## Composition notes
Reuses Breadcrumbs, Button, Tag, Tabs, InlineNotice, Skeleton, ErrorState (wave 1), PageDots, MarkdownView, SafeAreaInset (wave 2), BenefitStrip (wave 5), and Price, RatingDisplay, StockStatus, SwatchGroup, QuantityStepper (commerce primitives). ReviewList sits in a Tabs panel or below the component.

## Open questions
- Whether variant selection should be reflected in the address (query string) by the component through RouterAdapter, or left to the host through `onSelectionChange` (current choice: host).
