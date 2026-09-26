Wave 2 · Utility · Status: specified

# Formatters

## Purpose
Locale-aware formatting of money, percentages, dates and addresses, returning a placeholder for missing values.

## Contract
- `formatMoney(value, currency, locale?)`: currency format; locale defaults to the I18nAdapter locale (not inferred from the currency).
- `formatPercent(value, locale, options?)`: input in percentage points (12.5 means 12.5 %), two fraction digits by default, sign shown except for zero.
- `formatDateTime(input, { locale, withTimeZone? })`: accepts an ISO string or `{ value: string }`; short date and time, or date, time and short zone name.
- `formatAddress(fields, countryCode)`: fills a per-country template; unknown country joins non-empty fields with commas; empty placeholders never leave doubled separators.
- Country registry: `getCountry(code)`, `registerCountry(config)`, `listCountries()`; a config has currency (symbol, position, separators, precision), locale, address template and fields, languages and tax labels.
- Missing, null or invalid input returns the placeholder (a localisable string; §2.13 forbids the dash as decoration, so the default is an empty-value word such as "not informed", provided by i18n).
- Status-to-tone mapping (`toneForStatus`) returns a semantic tone name (`positive`, `pending`, `negative`, `neutral`), never style classes.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | number or null or undefined | required | Input. |
| locale | string | adapter locale | Output conventions. |
| placeholder | string | from i18n | Output for missing values. |

## States
Not applicable.

## Keyboard and ARIA
Not applicable. Callers render numbers with tabular figures in tables (§2.9).

## Responsive, touch, motion, forced colours
Not applicable.

## Acceptance tests
- Given 1234.5, 'BRL', 'pt-BR', then a Brazilian real string with comma decimals is returned.
- Given null, then the placeholder is returned.
- Given 12.5 and 'en-US', then "+12.50%" is returned; given 0, no sign.
- Given `{ value: iso }`, then it formats like the plain ISO string.
- Given an invalid date string, then the placeholder is returned.
- Given an address with an empty middle field, then no ", ," appears.
- Given status "rejected", then `toneForStatus` returns `negative`.

## Open questions
- The fork's two money formatters (by currency and by country) are merged; the country form is `formatMoney(value, country.currency.code, country.locale)`.
- Country data itself (30 countries) is specified in `wave-4/country-profile-data.md` (currency presentation derived from the locale, not stored).
