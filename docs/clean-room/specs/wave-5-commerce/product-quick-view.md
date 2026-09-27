# ProductQuickView

Wave 5 · commerce · overlay · Status: specified

## Purpose
Let a shopper inspect a product and add it to the cart from a listing without leaving the page: a modal dialog with the product's main image, name, price, rating, a short description, the variant choice and the add action, plus a link to the full product page.

## Anatomy
- **Dialog frame**: ModalDialog (wave 1) at a large size, with a close button.
- **Media**: the main product image (single) or a compact thumbnails gallery, on the start side on wide screens.
- **Content**: product name as the dialog title, Price, RatingDisplay with a link to all reviews, optional short description, VariantPicker (colour and size, or a large grid of size boxes), StockStatus, optional QuantityStepper, add-to-cart Button, and a Link to the full product page.
- All content parts are the same parts as ProductDetail; this spec defines only the dialog behaviour and the reduced set.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open / onOpenChange | boolean / handler | required | Controlled visibility. |
| product, options, variants | as ProductDetail | required | Data; may arrive after opening (see loading). |
| selection / onSelectionChange | as ProductDetail | none | Variant state. |
| onAddToCart | as ProductDetail | required | Add action. |
| closeOnAdd | boolean | true | Closes after a successful add (the host then opens the cart drawer or shows a toast). |
| detailsHref | string | product.href | Full page link. |
| show | { description?; rating?; quantity?; gallery? } | { rating: true } | Optional parts. |
| sizeLayout | 'row' \| 'grid' | 'row' | Size values as a row or a large grid. |
| status | 'ready' \| 'loading' \| 'error' | 'ready' | Content state. |
| labels | object | from I18nAdapter | Close, open product page, read every review, plus ProductDetail labels. |

## States
Closed; opening with data (content visible); loading (dialog opens at once with Skeleton content so focus management is not delayed); error (ErrorState inside the dialog with retry and the full-page link); adding; added (closes if `closeOnAdd`, else shows "added" and a "go to cart" link); add failed (InlineNotice in the dialog).

## Keyboard and ARIA
- APG **Dialog (modal)**: RAC `Modal` and `Dialog`; labelled by the product name; described by the price line.
- On open, focus moves to the dialog title (not the close button) so the product name is read first; Tab order: title, rating link, options, quantity, add, product page link, close button last in the DOM but visually in the corner.
- Escape and the close button close; focus returns to the element that opened it (the card's quick-view button). When closed after an add, focus still returns there and a polite message confirms the add.
- Variant, quantity and add behave as in ProductDetail.
- Background is inert while open.

## Responsive, touch, motion, forced colours
- Wide screens: media and content side by side. Narrow screens: the dialog becomes a full-height sheet with the image on top and content scrolling beneath; the add action stays visible at the bottom of the sheet.
- Opening uses the ModalDialog motion (opacity and a short scale from tokens); reduced motion removes the scale.
- Touch: tap outside closes on wide screens only; on narrow full-height sheets only the close button and Escape close.
- Forced colours: dialog border in `CanvasText`.
- Right-to-left: media moves to the right side; the close button to the top-left corner.

## Acceptance tests
- Given the quick-view button on a card is activated, then the dialog opens and focus is on the product name heading.
- Given Escape, then the dialog closes and focus returns to that card's quick-view button.
- Given `status="loading"`, then the dialog is open with skeletons and the title region is still labelled (from the product name if known, or a loading label).
- Given a complete selection and add pressed with `closeOnAdd`, then after success the dialog closes and a polite message names the product.
- Given an unavailable size, then its box is marked and announced as unavailable.
- Given a narrow viewport, then the dialog fills the screen and the add action remains visible while content scrolls.
- Given axe with the dialog open, then no violations and the page behind is inert.

## Composition notes
Reuses ModalDialog, Button, Link, Skeleton, ErrorState, InlineNotice (wave 1) and every ProductDetail part. Opened from ProductGrid's `onQuickView`.
