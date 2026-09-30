# OrderDetail and ShipmentProgress

Wave 5 · commerce · data display · Status: specified

## Purpose
Show one placed order: right after purchase as a confirmation ("thank you" with the order number and what happens next), and later as the order's detail page with each shipment's progress, delivery and billing information, payment method and the money breakdown. One component with two modes and several arrangements; ShipmentProgress is the stage tracker it uses.

## Anatomy
- **Header**: PageHeader (wave 1) with title (host copy, for example a thank-you line in confirmation mode or "Order {number}"), placed date (`time`), optional status StatusPill (wave 1), and actions (invoice, reorder, request return, contact support: host-supplied).
- **Confirmation message** (confirmation mode): one paragraph from the host and, when available, the tracking number as a CopyIdentifier (wave 2) with a carrier link.
- **Hero media** (optional): a host image beside the header on wide screens (split arrangement).
- **Shipments**: the order's lines grouped by shipment (a single group when not split). Each group has:
  - CartLineItem rows in read-only mode (media, name, variant labels, quantity, unit price, line total, optional short description);
  - ShipmentProgress: the host's ordered stages (for example received, being prepared, shipped, delivered), the current stage, the date of the latest change, and optional tracking link;
  - delivery address (formatted with Formatters `formatAddress`) and contact for updates (masked e-mail and phone supplied by the host) with an optional edit action.
- **Billing block**: billing address, payment method (method name, card brand via ThirdPartyMarkSlot or text, last digits, expiry, installments), delivery method and estimate.
- **Money**: PriceBreakdown (from cart-view), read-only, including discounts with codes.
- **Next steps** (optional): a link list (keep browsing, go to my orders).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| mode | 'confirmation' \| 'detail' | 'detail' | Confirmation adds the message and tracking; detail emphasises progress. |
| order | { id; number; placedAt: ISO; status: OrderStatus; shipments: { id; lines: LineItem[]; stages: { id; label }[]; currentStageId; updatedAt?: ISO; tracking?: { number; carrier?; href? }; address: Address; contact?: { email?; phone? } }[]; billingAddress?: Address; payment: { method; brand?; last4?; expiry?; installments? }; delivery?: { method; estimate? }; totals: PriceBreakdown value } | required | Order data. |
| arrangement | 'stacked' \| 'split' \| 'large-media' | 'stacked' | Split: header and hero media side by side. Large-media: each line shows a large image with its progress. |
| actions | { id; label; href or onPress; emphasis? }[] | [] | Header actions. |
| onEditContact | (shipmentId) => void | none | Edit contact for updates. |
| title / message | string | from i18n | Header copy. |
| status | 'ready' \| 'loading' \| 'error' \| 'not-found' | 'ready' | View state. |
| renderMedia | (media) => node | none | Host images. |
| labels | object | from I18nAdapter | Order number, placed on, delivery address, billing address, payment, delivery method, tracking number, status, stage names fallback. |

OrderStatus: 'pending-payment' \| 'paid' \| 'processing' \| 'partially-shipped' \| 'shipped' \| 'delivered' \| 'cancelled' \| 'refunded' \| 'returned'; mapped to StatusPill tones through `toneForStatus` (Formatters).

### ShipmentProgress
| Name | Type | Default | Meaning |
|---|---|---|---|
| stages | { id; label }[] | required | Ordered stages from the host. |
| currentStageId | id | required | Current stage. |
| updatedAt | ISO | none | Date of the latest change. |
| problem | { label } | none | Exception (delayed, returned to sender): shown with a warning tone and word. |
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | Vertical on narrow screens by default. |

## States
Confirmation; detail; loading (Skeleton header, lines, blocks); error (ErrorState with retry); not found (EmptyState with a link to the order list); cancelled (progress replaced by a status line and reason); partially shipped (one ShipmentProgress per shipment); shipment exception (problem shown); payment pending (InlineNotice with the host's payment instructions, for example an instant-transfer code via CopyIdentifier and its expiry).

## Keyboard and ARIA
- The page heading is the header title; the order number is also exposed in text ("Order number {n}").
- Shipments are sections labelled "Shipment N of M" when there is more than one.
- ShipmentProgress: an ordered list of stages; completed stages carry a visually hidden "completed", the current one `aria-current="step"`; a visual bar, if drawn, is decorative and hidden; the written status line ("{stage} on {date}") precedes the list and is the primary carrier.
- Addresses use the `address` element; blocks use description lists.
- CopyIdentifier for tracking and payment codes announces "copied".
- Status changes while the page is open (host polling) are announced politely.

## Responsive, touch, motion, forced colours
- Wide screens: lines on the start side, address and progress beside them; billing and money blocks in two columns. Narrow: everything in one column, progress vertical.
- Large-media arrangement stacks media above the line text on narrow screens.
- No animation of the progress; the current stage is marked by weight, icon and word, not motion.
- Forced colours: stage markers use system colours with distinct shapes for done, current and upcoming.
- Right-to-left: horizontal progress runs from right to left.

## Acceptance tests
- Given `mode="confirmation"` and a tracking number, then the tracking number is copyable and its carrier link is present.
- Given four stages and the current stage third, then the list marks two completed, the third current and one upcoming, and the status line names the third stage with its date.
- Given two shipments, then two labelled sections each have their own progress.
- Given a cancelled order, then no progress list shows and the status reads cancelled with a word and icon.
- Given payment pending with an instant-transfer code, then a notice shows the code in a copyable control and its expiry formatted for the locale.
- Given totals in BRL and locale pt-BR, then every amount uses Brazilian formatting.
- Given `status="not-found"`, then an empty state links to the order list.
- Given axe, then no violations.

## Composition notes
Reuses PageHeader, StatusPill, Separator, Link, Button, Skeleton, InlineNotice, EmptyState, ErrorState (wave 1), CopyIdentifier, Formatters (wave 2), ThirdPartyMarkSlot (wave 4), CartLineItem and PriceBreakdown (cart-view). StepList (wave 2) is not reused for progress because shipment stages are not navigable; StepList's visual language may be shared through tokens.
