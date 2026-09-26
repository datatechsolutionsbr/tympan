# MetricTile

Wave 2 · data display · Status: specified

## Purpose
Compact, read-only display of one metric with title, value, optional subtitle, optional trend and an optional icon; used for KPI rows in reports.

## Anatomy
- **Tile**: surface at elevation level 2 or a plain block inside a sheet (§2.5).
- **Title**: `label` type (§2.2).
- **Value**: serif KPI number, tabular numerals; long values wrap rather than overflow.
- **Subtitle** (optional): `meta` text.
- **Trend** (optional): a DeltaIndicator plus an optional comparison label ("vs last month").
- **Icon badge** (optional): icon in a small square; its tint follows `tone`.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | string | required | Metric name. |
| value | string, number or node | required | Value; may be a TweenedNumber. |
| subtitle | string | undefined | Extra context. |
| icon | node | undefined | Icon. |
| trend | `{ value: number; label?: string; format?: (n: number) => string }` | undefined | Change figure. Default format is signed percentage with one decimal via Formatters. |
| tone | `'neutral' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | Semantic tone (§2.3), always paired with icon and wording elsewhere. |

## States
- Rest only; read-only. Tone is visible at rest (icon badge), never only on hover.
- Trend: positive, negative, zero (zero shows the value with a neutral sign).

## Keyboard and ARIA
- Not focusable. Structured as a group whose accessible name is the title; value follows in reading order.
- Trend reads as text including direction ("up 10.5 percent"), not only as an arrow glyph.
- No APG pattern; no RAC primitive; custom.

## Responsive, touch, motion, forced colours
- Never overflows its container: value wraps or shrinks; no horizontal scroll at 320 px.
- No hover tint or lift (§2.7).
- Forced colours: tile border visible; tone icon still conveys meaning.

## Acceptance tests
- Given title and numeric value, when rendered, then both are in the group and the value uses tabular numerals.
- Given a trend of 10.5, when rendered, then text "+10.5%" (locale formatted) and an upward indicator appear.
- Given a trend of −5.2, when rendered, then a downward indicator and the negative value appear.
- Given a trend of 0, when rendered, then a neutral indicator appears.
- Given a custom trend format, when rendered, then that format is used.
- Given tone danger, when rendered, then the icon badge uses the error semantic colour and the tile has no hover-only styling.
- Given a very long value at 320 px, when rendered, then nothing overflows.
