# Commerce primitives

Wave 5 · commerce · foundation · Status: specified

## Purpose
The small shared pieces every commerce component in this wave uses, so that price, quantity, rating, stock and product data behave the same everywhere: a data model the host fills, a money display, a quantity stepper, a rating display, a stock line and a variant swatch group. Nothing here holds product data, images or copy; the host supplies all of it.

This spec does not correspond to one family of the source kit; it collects behaviour the other wave-5 specs would otherwise repeat. Where another wave-5 spec says Price, QuantityStepper, RatingDisplay, StockStatus or SwatchGroup, it means the component defined here.

## Anatomy
- **Money model**: an amount and a currency code. Amounts are integers in the currency's minor unit (centavos, cents) so sums never drift; the formatter converts for display.
- **Price**: current price; optional compare-at (original) price shown struck through with a visually hidden "original price" word; optional unit note (per item, per month); optional range form (from lowest to highest).
- **QuantityStepper**: decrease button, number input, increase button, optional hint line (for example the remaining stock or the per-order limit).
- **RatingDisplay**: a row of glyphs filled to the average (half steps allowed), the average written as text, optional review count as a link or plain text.
- **StockStatus**: icon plus word for the stock state, optional lead time supplied by the host.
- **SwatchGroup**: a radio group of option values shown as colour discs, text boxes or host media thumbnails, with unavailable values marked.
- **Product media**: the host supplies each image as `{ src, alt }` or through a `renderMedia` function (to use its own image component, CDN sizing or lazy loading). The library ships no image assets and no placeholder pictures; missing media shows a neutral frame (surface-sunken token) with a decorative product glyph hidden from assistive tech.

## Properties and events

### Data model (types the host fills)
| Name | Shape | Meaning |
|---|---|---|
| Money | { amount: integer; currency: ISO 4217 code } | Minor units. BRL is the documented default example. |
| ProductSummary | { id; name; href?; media?: Media[]; price: Money; compareAtPrice?: Money; priceRange?: { min: Money; max: Money }; rating?: { average: number; count: number }; badges?: string[]; variantHint?: string; description?: string; swatches?: ProductOption; stock?: StockState } | What lists, grids and carts need. |
| Variant | { id; optionValues: Record<optionId, valueId>; price?: Money; compareAtPrice?: Money; stock: StockState; sku?: string; maxPerOrder?: number } | One purchasable combination. |
| ProductOption | { id; label; kind: 'colour' \| 'text' \| 'media'; values: { id; label; swatch?: string (colour supplied at runtime by the host); media?: Media; available?: boolean; note?: string }[] } | Selectable dimension (colour, size, capacity). |
| StockState | { status: 'in-stock' \| 'low' \| 'out-of-stock' \| 'backorder' \| 'preorder' \| 'discontinued'; quantity?: number; leadTime?: string } | Drives StockStatus and quantity limits. |
| LineItem | { id; product: ProductSummary; variantLabels?: string[]; quantity: number; unitPrice: Money; lineTotal: Money; stock?: StockState; minQuantity?: number; maxQuantity?: number; step?: number; editable?: boolean; removable?: boolean; notice?: string } | One line in a cart, checkout or order. |
| Media | { src: string; alt: string; width?: number; height?: number } | Intrinsic dimensions (data, not a style value) let the host reserve space and avoid layout shift. |

### Price
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | Money | required | Current price. |
| compareAt | Money | none | Original price; shown only when greater than `value`. |
| range | { min: Money; max: Money } | none | Shows "from … to …" using labels. |
| locale | string | adapter locale | Formatting locale (pt-BR, en, en-US and so on). |
| display | 'symbol' \| 'narrowSymbol' \| 'code' | 'symbol' | Passed to the number formatter as currency display. |
| size | 'small' \| 'regular' \| 'large' | 'regular' | Type step from the type-scale tokens. |
| zeroAsFree | boolean | false | A zero amount renders the "free" label instead of a zero figure. |

Formatting rule: every amount is shown through `Intl.NumberFormat(locale, { style: 'currency', currency })` via the Formatters contract (wave 2), after dividing by the currency's minor-unit factor, which is read from the formatter's resolved fraction digits and never hard-coded. Currency comes from the data and locale from the I18nAdapter; the two are independent (a BRL price can be read in English).

### QuantityStepper
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | number | required | Controlled quantity. |
| min | number | 1 | Lowest allowed. |
| max | number | none | Highest allowed: the lower of stock quantity and per-order limit. |
| step | number | 1 | Pack size. |
| onChange | (n: number) => void | required | Fires with a clamped, step-aligned value. |
| allowZeroToRemove | boolean | false | Decreasing from `min` asks the host to remove the line (`onRemoveRequest`). |
| onRemoveRequest | () => void | none | See above. |
| pending | boolean | false | Host is saving; buttons disabled, value kept. |
| presentation | 'stepper' \| 'select' | 'stepper' | 'select' renders a NativeSelect (wave 1) listing allowed quantities up to a host cap, for short ranges. |
| productName | string | required | Used in the accessible name ("Quantity, {product}"). |

### RatingDisplay
| Name | Type | Default | Meaning |
|---|---|---|---|
| average | number | required | Average rating, 0 to `scale`. |
| count | number | none | Number of reviews. |
| href / onPress | string / handler | none | Makes the count a link to the reviews. |
| scale | number | 5 | Maximum. |

### StockStatus
| Name | Type | Default | Meaning |
|---|---|---|---|
| stock | StockState | required | State to show. |
| showQuantity | boolean | false | Shows "only N left" when status is `low`. |

### SwatchGroup
| Name | Type | Default | Meaning |
|---|---|---|---|
| option | ProductOption | required | Values to show. |
| value | valueId | none | Selected value (controlled). |
| onChange | (valueId) => void | required | Selection change. |
| unavailable | 'disable' \| 'mark' \| 'hide' | 'mark' | Unavailable values: disabled, selectable but marked (so the person can still see stock notices or join a wait list), or hidden. |
| layout | 'row' \| 'grid' | 'row' | Text boxes may wrap into a grid. |
| guide | { label; href or onPress } | none | Trailing link (for example a measurement chart). |
| showSelectedName | boolean | true for colour | Writes the chosen value's name next to the legend. |

## States
- Price: regular, on sale (compare-at shown), range, free, missing (placeholder word from Formatters).
- QuantityStepper: idle, at minimum (decrease disabled or turns into remove), at maximum (increase disabled and a hint explains why), pending, invalid typed value (reverts on blur to the nearest valid value and announces the limit).
- RatingDisplay: with rating; no rating yet (shows the "no reviews yet" label, no glyphs).
- StockStatus: each `status` with its own icon and word; never colour alone.
- SwatchGroup: none selected, selected, value unavailable, whole option disabled, loading (Skeleton, wave 1).

## Keyboard and ARIA
- Price: rendered as text; the compare-at price carries a visually hidden "original price" label and the current one "current price", so a screen reader never reads two bare figures. The formatted figure is bidi-isolated so the currency sign keeps its place inside right-to-left text.
- QuantityStepper: APG **Spinbutton** (RAC `NumberField`): Up and Down arrows change by `step`, Page Up and Page Down by ten steps, Home and End go to min and max; the buttons are named "decrease quantity of {product}" and "increase quantity of {product}". The new value is announced politely once typing settles.
- RatingDisplay: one element with image role named "Average rating {average} of {scale}" from i18n; glyphs are hidden.
- StockStatus: plain text with a decorative icon; a change after a variant switch is announced politely.
- SwatchGroup: APG **Radio Group** (RAC `RadioGroup`) labelled by the option label; arrow keys move and select; unavailable values keep their name plus an "unavailable" description; colour discs always carry the value name as accessible name.

## Responsive, touch, motion, forced colours
- Every button, swatch and stepper control meets the touch-target token (`--ty-control-target`) through padding or an invisible hit area.
- Swatch discs take the host-supplied colour at runtime through a custom property set in the style attribute, with a ring in the `line-strong` role so light values stay visible on light surfaces.
- No motion beyond opacity changes (`--ty-dur-*`); reduced motion removes those too.
- Forced colours: the struck-through compare-at price keeps its line; the selected swatch shows a system-colour outline plus a check glyph; unavailable swatches show a diagonal rule drawn as a border, not a colour.
- Right-to-left: the stepper keeps decrease on the start side and increase on the end side; the rating fills from the start side.
- Figures use tabular numerals (§2.9) inside tables and summaries.

## Acceptance tests
- Given `{ amount: 123450, currency: 'BRL' }` and locale pt-BR, when Price renders, then the text uses the real sign, a comma decimal separator and a dot thousands separator.
- Given the same amount and locale en, when Price renders, then the text uses a dot decimal separator and a comma thousands separator.
- Given a currency with no minor unit (JPY) and amount 500, when rendered, then no decimals appear and the value is not divided by one hundred.
- Given `compareAt` lower than or equal to `value`, when rendered, then no struck-through price appears.
- Given a QuantityStepper with `max` 3 and value 3, when increase is pressed, then nothing changes, the button is disabled and the limit hint is visible.
- Given a person types 7 with `max` 5 and leaves the field, then the value becomes 5 and the limit is announced.
- Given `step` 6 and a typed 8, when committed, then the value becomes the nearest allowed multiple and the change is announced.
- Given `allowZeroToRemove` and value 1, when decrease is pressed, then `onRemoveRequest` fires and `onChange` does not.
- Given a SwatchGroup with an unavailable value and `unavailable="mark"`, when read by a screen reader, then the value's name is followed by the unavailable description.
- Given colour swatches, when checked with axe, then every radio has a text name.
- Given RatingDisplay with average 4.5, then the accessible name is "Average rating 4.5 of 5" (from i18n) and each glyph is hidden.
- Given StockStatus `out-of-stock`, then an icon and a word are shown, and a greyscale rendering still distinguishes it from `in-stock`.
- Given `dir="rtl"`, when a Price is rendered inside right-to-left text, then the figure and its currency sign keep their internal order.

## Composition notes
- Money formatting reuses Formatters (`formatMoney`) and the I18nAdapter (wave 2). CurrencyField (wave 2) is the input counterpart where a person types an amount.
- NativeSelect (wave 1) backs the `select` presentation of QuantityStepper; Skeleton (wave 1) backs loading states.
- Labels live in the I18nAdapter under a `commerce.` namespace; each component also accepts a `labels` object that overrides keys.

## Open questions
- Whether a unit-price line (price per kilogram or litre, required by some consumer laws) belongs in Price or in the host's own copy.
