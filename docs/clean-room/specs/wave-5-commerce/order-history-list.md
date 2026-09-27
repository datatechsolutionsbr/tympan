# OrderHistoryList

Wave 5 · commerce · data display · Status: specified

## Purpose
Let a signed-in shopper see past orders, check each one's status and reach the order detail, the invoice, the products again, returns or a reorder. One component with four arrangements: a card per order with its items, a table per order, a compact list per order, and a list with per-item quick actions.

## Anatomy
- **Header**: PageHeader (wave 1) or SectionHeading with title and a short intro from the host; optional period filter (SegmentedControl or NativeSelect, wave 1) and search (FilterField, wave 2) for long histories.
- **Order group** (one per order):
  - **Order header**: order number, placed date, total (Price), status StatusPill, and order actions: open order, invoice (host links), and an overflow ActionMenu (wave 1) that holds the same actions on narrow screens.
  - **Items**: per arrangement:
    - `cards`: each item with media, name, price, optional short description, a delivery status line (icon, word and date), and item actions (open product, reorder);
    - `table`: DataTable (wave 1) with columns product (media and name), price, status, and an action column; on narrow screens the price folds under the name and the status column hides behind a row-level disclosure;
    - `list`: compact rows with media, name, variant labels and price;
    - `quick-actions`: rows with item-level buttons (reorder, open product, request return) always visible.
- **Paging**: Pagination (wave 1) or a load-more button at the end.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| orders | { id; number; placedAt: ISO; total: Money; status: OrderStatus; statusDate?: ISO; href; invoiceHref?; items: { id; product: ProductSummary; quantity; price: Money; variantLabels?; itemStatus?: { status: OrderStatus; date?: ISO } }[] }[] | required | History. |
| arrangement | 'cards' \| 'table' \| 'list' \| 'quick-actions' | 'cards' | Layout of each order. |
| orderActions | (order) => { id; label; href or onPress; icon? }[] | view, invoice | Actions per order. |
| itemActions | (order, item) => action[] | open product, reorder | Actions per item. |
| onBuyAgain | (order, item?) => void \| Promise | none | Adds the item (or the whole order) to the cart; pending per button. |
| maxItemsPerOrder | number | none | Longer orders show the first items and "and N more" linking to the detail. |
| filters | { period?; query? } with change handlers | none | Optional narrowing. |
| pagination | Pagination props or load-more props | none | Paging. |
| status | 'ready' \| 'loading' \| 'empty' \| 'error' | 'ready' | View state. |
| renderMedia | (media) => node | none | Host images. |
| labels | object | from I18nAdapter | Order number, order date, order total, status, open order, invoice, reorder, more actions for order {n}, and more. |

## States
Ready; loading (Skeleton order groups); empty (EmptyState "no orders yet" with a start-shopping action); filtered empty (EmptyState with clear filters); error (ErrorState with retry); reorder pending, done ("added" and a polite message), failed (Toast with host message); order with problem status (warning StatusPill with word).

## Keyboard and ARIA
- Each order is a `section` (or `article`) labelled "Order of {date}" and described by the order number, so a screen reader list of regions is scannable.
- Order summary fields use description lists (term and value).
- Action names are unique across the page: "Open order {number}", "Invoice of order {number}", "Reorder {product}".
- Overflow: APG **Menu Button** named "More actions, order {number}".
- Table arrangement: DataTable semantics (caption naming the order; column headers; action column labelled).
- Dates use `time` elements; statuses use StatusPill (icon and word).
- Load more moves focus to the first new order's heading.

## Responsive, touch, motion, forced colours
- Wide screens: order header in one row (fields then actions); narrow screens: fields stack, actions collapse into the overflow menu except the primary "open order".
- Cards arrangement: item media beside text on wide screens, above on narrow ones.
- Table arrangement: price and status fold under the product name on narrow screens instead of scrolling horizontally.
- No motion besides DataTable's standard states.
- Forced colours: group boundaries drawn with system borders.
- Right-to-left: actions move to the left side; menus open toward the start side.

## Acceptance tests
- Given two orders, then two regions labelled with their placed dates render, each with number, date and total.
- Given a narrow viewport, then order-level actions except "open order" move into a menu named with the order number.
- Given `arrangement="table"`, then each order renders a table whose caption names the order and whose rows are items.
- Given reorder pending, then only that button is pending; on success a polite message names the product.
- Given `maxItemsPerOrder` 2 and an order with five items, then two show and a link says three more.
- Given no orders, then an empty state with the host's action shows.
- Given every action on the page, then no two actions share the same accessible name.
- Given BRL totals with locale en, then English separators are used and the real sign is kept.

## Composition notes
Reuses PageHeader, SectionHeading, DataTable, ActionMenu, StatusPill, Pagination, SegmentedControl, NativeSelect, Button, Link, Skeleton, EmptyState, ErrorState, Toast (wave 1), FilterField, Formatters (wave 2), and Price (commerce primitives). The detail page for one order is OrderDetail.
