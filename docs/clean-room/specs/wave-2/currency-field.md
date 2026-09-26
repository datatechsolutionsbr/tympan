# CurrencyField

Wave 2 · form · Status: specified

## Purpose
A numeric field for money or counts that groups digits and uses the locale's separators while typing, yet reports a plain machine-readable number.

## Anatomy
- Label above the field (§2.10); hint below the label; error below the field.
- Field with an optional leading currency symbol and the number entry.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | string | required | Canonical value: digits with an optional dot and decimals, never grouped (e.g. "1500000.5"); "" when empty. |
| onValueChange | (value: string) => void | none | Receives the canonical value after every edit. |
| label | string | required | Field label. |
| currency | string (ISO 4217 code) | none | When set, the symbol is shown and the currency name is part of the accessible description. Omit for plain counts. |
| decimals | number | 2 | Maximum fraction digits; 0 means integers only. |
| locale | string | from I18nAdapter | Locale that decides group and decimal separators. |
| size | "small", "medium", "large", "display" | "medium" | Type scale step; "display" uses the KPI numeral style (§2.2). |
| hint, error, required, disabled, placeholder | as in TextField | none | Standard field wiring. |

## Behaviour
- As the person types, non-digits are ignored except the first locale decimal separator (only when decimals > 0). Extra fraction digits beyond `decimals` are dropped. Leading zeros in the integer part are removed.
- The display regroups the integer part with the locale separator on every edit, and the caret stays after the same digit it followed before regrouping.
- Changing locale changes only the display, never the canonical value.
- Mobile keyboards request numeric input when decimals is 0 and decimal input otherwise.

## States
Empty, filled, focus-visible, invalid (error icon plus text, `aria-invalid`), disabled, read-only.

## Keyboard and ARIA
- APG pattern: none (text input). Consider RAC `NumberField` with `formatOptions` (style currency) as the backing primitive; if its stepper and parsing do not match the live-grouping behaviour, use RAC `TextField` with this spec's parsing.
- No increment/decrement on arrow keys (avoids accidental changes to money).
- The currency symbol is visual; the accessible name or description states the currency (e.g. "Amount, Brazilian real").

## Responsive, touch, motion, forced colours
- Field height per §2.10; tabular numerals (§2.2).
- No motion.
- Forced colours: border and symbol use system text colours.

## Acceptance tests
- Given locale pt-BR and decimals 2, When the person types "1500000,5", Then the field shows "1.500.000,5" and onValueChange last receives "1500000.5".
- Given locale en-US and the same canonical value, When rendered, Then the field shows "1,500,000.5".
- Given decimals 0, When "12,34" is typed in pt-BR, Then the canonical value is "1234".
- Given decimals 2, When a third fraction digit is typed, Then it is ignored.
- Given the caret after the fourth digit, When a digit is inserted that causes regrouping, Then the caret stays after the inserted digit.
- Given currency "BRL", When the field is inspected, Then the currency is conveyed to assistive technology.
- Given error "Required", When rendered, Then the field is invalid and described by the error.

## Open questions
- The fork hid the currency symbol from assistive technology with no replacement; this spec requires the currency to be announced.
