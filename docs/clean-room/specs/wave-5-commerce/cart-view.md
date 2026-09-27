# CartView, CartLineItem and PriceBreakdown

Wave 5 · commerce · form and overlay · Status: specified

## Purpose
Show what the shopper intends to buy, let them change quantities or remove lines, show the money breakdown, and lead to checkout. The same content appears in four presentations: a full page (one or two columns), a side drawer, a modal dialog, and a small popover from the header's cart button. CartLineItem (one line) and PriceBreakdown (the totals block) are defined here and reused by CheckoutForm and OrderDetail.

## Anatomy
- **CartView**
  - **Title** with the item count.
  - **Line list**: CartLineItem per line.
  - **Notices** (optional): InlineNotice (wave 1) for cart-level messages from the host (price changed, item removed because unavailable, minimum order not reached).
  - **Promo code** (optional): TextField (wave 1) plus apply Button; applied codes listed as removable Tags.
  - **Summary**: PriceBreakdown, followed by the checkout Button and an optional "keep browsing" Link or close action.
  - **Footnote** (optional): one line telling that delivery cost and taxes appear in the next step, supplied by labels.
  - **Suggestions** (page presentation, optional): a ProductGrid slot after the cart.
- **CartLineItem**
  - media (host), product name (link to product), variant labels (colour, size), unit price and line total (Price), StockStatus with lead time when not plainly in stock, QuantityStepper (stepper or select presentation) or a read-only quantity, remove action, optional edit action (reopens variant choice, host-driven), optional save-for-later action, optional line notice.
- **PriceBreakdown**
  - rows of label and amount: subtotal, discounts (each with its code shown as a Tag and a negative amount), delivery (amount, "free", or "calculated at next step"), taxes (amount or estimated), other fees; each label may carry an info Popover (wave 1) explaining how it is calculated; a total row, emphasised.

## Properties and events
### CartView
| Name | Type | Default | Meaning |
|---|---|---|---|
| lines | LineItem[] | required | Cart content. |
| totals | PriceBreakdown value | required | Money summary computed by the host (the component never computes taxes or delivery). |
| presentation | 'page' \| 'drawer' \| 'dialog' \| 'popover' | 'page' | Container. |
| pageLayout | 'two-column' \| 'single-column' \| 'extended-summary' | 'two-column' | Page only: two columns puts the summary beside lines on wide screens; single column stacks; extended summary adds promo code, notes and benefit strip under the summary. |
| open / onOpenChange | boolean / handler | none | For drawer, dialog and popover. |
| onQuantityChange | (lineId, quantity) => void \| Promise | none | Quantity edits; a promise marks that line pending. |
| onRemove | (lineId) => void \| Promise | none | Removal. |
| undoRemoval | boolean | true | After removal, the line collapses to a one-line "removed, undo" row until the next change or a host-set timeout. |
| onUndoRemove | (lineId) => void | none | Undo. |
| onEditLine / onSaveForLater | (lineId) => void | none | Optional line actions. |
| promo | { codes: string[]; onApply(code): Promise; onRemove(code) } | none | Promo codes; `onApply` rejection shows the host's error on the field. |
| checkout | { label?; href or onPress; disabled?; disabledReason? } | required | Checkout action. |
| continueShopping | { href or onPress } | none | Secondary action (in overlays it closes). |
| notices | { id; tone; text }[] | [] | Cart-level messages. |
| maxLinesInPopover | number | 3 | Popover shows the first lines and "and N more". |
| status | 'ready' \| 'loading' \| 'empty' \| 'error' | 'ready' | View state. |
| emptyAction | { label; href } | none | Action in the empty state. |
| suggestions | node | none | Slot after the cart (page). |
| labels | object | from I18nAdapter | Cart title, items count (plural rules), remove, removed, undo, checkout, keep browsing, promo code, apply, edit, save for later, close, taxes note, and more. |

### PriceBreakdown
| Name | Type | Default | Meaning |
|---|---|---|---|
| subtotal | Money | required | Sum of lines. |
| discounts | { code?; label; amount: Money }[] | [] | Negative rows. |
| delivery | Money \| 'free' \| 'pending' | 'pending' | Delivery row. |
| taxes | { label; amount: Money; estimated?: boolean; included?: boolean }[] | [] | Tax rows; `included` shows "includes {amount} in taxes" under the total (common in Brazil and the EU) instead of a separate row. |
| fees | { label; amount: Money }[] | [] | Other rows. |
| total | Money | required | Grand total. |
| infoFor | Record<rowKey, { text; href? }> | none | Explanations shown in an info popover next to a row label. |
| density | 'regular' \| 'compact' | 'regular' | Compact for drawers and popovers. |
| collapsible | boolean | false | Narrow-screen form: only the total shows, with a Disclosure that reveals the rows (used by CheckoutForm). |

## States
- CartView: ready; loading (Skeleton lines and summary); empty (EmptyState with a "start shopping" action from the host); error (ErrorState with retry); line pending (that line's controls disabled with an in-control spinner, totals marked as updating with a visually hidden "updating" and dimmed figures); line removed (undo row); quantity capped by stock (hint under the stepper); line out of stock (line notice, quantity locked, checkout disabled with reason or line excluded: host decides via `checkout.disabled` and `disabledReason`); promo applying, applied, rejected.
- Popover: shows compact lines without quantity editing and links to the full cart page.
- PriceBreakdown: regular; updating; with included taxes; collapsed and expanded.

## Keyboard and ARIA
- Page: `section` labelled "Cart"; lines are a list; each line is an `article` labelled by the product name.
- Drawer: APG **Dialog (modal)** through Drawer (wave 1) from the end edge; labelled by the title; focus goes to the title on open; Escape closes; focus returns to the cart button.
- Dialog: APG **Dialog (modal)** through ModalDialog (wave 1).
- Popover: non-modal Popover (wave 1) from the header's cart button, which is an APG **Disclosure**-style button with `aria-expanded`; Escape closes; Tab past the last element closes and continues on the page.
- Quantity: APG Spinbutton (or native select) named "Quantity, {product}".
- Remove: button named "Remove {product}"; after removal focus moves to the undo button in the collapsed row, and after undo back to the restored line's quantity; when the cart becomes empty focus moves to the empty state heading.
- Totals changes are announced politely once per settled change ("Total {amount}").
- PriceBreakdown uses description-list semantics (label, amount); discount amounts include a visually hidden "discount" word, not only a minus sign; info buttons open Popovers named "How {row} is calculated".
- Checkout, when disabled, stays focusable with `aria-disabled` and the reason as its description, so people learn why.

## Responsive, touch, motion, forced colours
- Page two-column: lines and summary side by side on wide screens; on narrow screens the summary follows the lines, and an optional sticky footer shows the total and checkout button (respects SafeAreaInset).
- Drawer: full width on narrow screens; a comfortable fixed share of the viewport on wide screens (layout token).
- Line layout: media, then text; controls wrap below the text on narrow widths rather than shrinking.
- Motion: removed line collapses with opacity and height transition from the motion tokens; reduced motion removes it instantly and still shows the undo row.
- Swipe to remove (SwipeRow, wave 2) is optional on touch, always with the visible remove button as the primary path.
- Forced colours: summary total row separated by a system-colour rule; disabled checkout remains readable with system `GrayText`.
- Right-to-left: drawer enters from the left; amounts align to the end side; continue-shopping arrow mirrors.

## Acceptance tests
- Given three lines and `presentation="drawer"`, when opened, then a modal dialog labelled with the cart title has focus on the title and three line articles.
- Given `onQuantityChange` returns a pending promise, then only that line's controls are disabled and the total is marked as updating.
- Given the promise resolves with new totals, then "Total {amount}" is announced once.
- Given a line with stock quantity 2, then its stepper maximum is 2 and a hint explains the limit.
- Given remove pressed, then the line collapses to an undo row and focus is on undo; given undo, then the line is restored and focus returns to its quantity.
- Given the last line removed, then the empty state appears and receives focus on its heading.
- Given a promo code rejected with a message, then the message shows as the field's error and is announced.
- Given `taxes` with `included`, then no tax row appears and a line under the total states the included amount.
- Given a discount row, then a screen reader hears the word discount and the amount, not only a minus sign.
- Given `checkout.disabled` with a reason, then the button is focusable, reports disabled and exposes the reason.
- Given pt-BR and BRL totals, then every amount uses Brazilian formatting; switching the adapter to en re-renders with English separators without changing amounts.
- Given `presentation="popover"` with five lines and `maxLinesInPopover` 3, then three lines show plus "and 2 more" and a link to the cart page.
- Given axe for each presentation, then no violations.

## Composition notes
Reuses Drawer, ModalDialog, Popover, Button, Link, TextField, Tag, InlineNotice, Skeleton, EmptyState, ErrorState (wave 1), SwipeRow, SafeAreaInset, Formatters (wave 2), BenefitStrip, ProductGrid (wave 5), and Price, QuantityStepper, StockStatus (commerce primitives).

## Open questions
- Whether "save for later" needs its own list component or is served by a ProductGrid slot.
