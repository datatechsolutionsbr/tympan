Wave 2 · Utility · Status: specified

# I18nAdapter

## Purpose
Supplies translated strings, the current locale and locale-aware formatting to all components through one context, independent of the app's i18n library.

## Contract
- A provider receives `{ locale, translate(namespace) => t, messages? }`.
- `useTranslations(namespace)` returns `t(key, params?)` plus `t.raw(key)` for structured values. Its identity is stable while locale, messages and namespace are unchanged.
- Messages support ICU MessageFormat (plural, select, number and date arguments). A message that fails to parse falls back to simple `{name}` substitution; it never breaks rendering.
- A helper builds the context value from a nested messages object and a locale.
- Without a provider: `t` returns the inline default passed as the reserved `_` parameter if present, otherwise `namespace.key` with parameters substituted.
- `useLocale()` returns the locale (BCP 47).
- `useFormatter()` returns `dateTime`, `number` and `relativeTime` functions bound to the locale, using the platform Intl APIs; relative time picks seconds, minutes, hours or days by magnitude.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value.locale | string | required | Current locale. |
| value.translate | (namespace?: string) => TranslateFn | required | Namespace-bound translator. |
| value.messages | nested record | none | Raw catalogue for `t.raw`. |

## States
With provider; without provider (fallback).

## Keyboard and ARIA
Not applicable. Components set the `lang` attribute only when showing text in a language other than the page's (e.g. locale names in LocalePicker).

## Responsive, touch, motion, forced colours
Not applicable.

## Acceptance tests
- Given a plural message and count 1 and 2, then the correct singular and plural forms are returned.
- Given a malformed message with `{name}`, then the output substitutes the parameter and does not throw.
- Given no provider and `_` default, then the default is returned.
- Given the same inputs across renders, then `t` keeps its identity.
- Given `relativeTime` of 90 minutes ago, then an hours-based phrase is returned.
