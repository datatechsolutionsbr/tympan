# TickerCard

Wave 4 · data display · Status: specified

## Purpose
A small card listing a handful of named entries, each with a qualifier, a current value and its change, for side-by-side comparison of the same quantity across entities (for example the same indicator across comparable cases or jurisdictions). It is a read-only summary, not a table: for more than a short list, or when sorting is needed, use DataTable.

## Anatomy
- **Header**: lucide icon (decorative) and title.
- **Entry rows**: name (truncates with the full name available as a tooltip and to assistive technology), qualifier in `meta` (for example distance, period or unit), value with tabular numerals, change as a DeltaIndicator (sign, icon and word or percentage; never colour alone, §2.3).
- **Footer** (optional): as-of line in `meta` and an optional "see all" link.
- **Empty state**: one line saying there are no entries.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | string | required | Card title. |
| icon | icon component | none | Header icon. |
| entries | { id; name; qualifier?: string; value: string; change?: { value: string; direction: 'up' \| 'down' \| 'flat'; sentiment?: 'positive' \| 'negative' \| 'neutral' } }[] | required | Rows. |
| asOf | string | none | Freshness line. |
| seeAll | { label: string; href: string } | none | Link to the full view. |
| maxEntries | number | host choice | Rows beyond this are not shown; the see-all link is expected. |
| onEntryPress | (id: string) => void | none | Makes each row a button. |
| labels | object of strings | from I18nAdapter | Column names for assistive technology, empty text. |

Direction (up, down, flat) and sentiment (good, bad, neutral) are separate: a rise can be bad.

## States
Populated; empty; loading (Skeleton rows matching the row height of the current table density, §2.9); interactive rows.

## Keyboard and ARIA
- Rendered as a list of rows; each row's accessible text reads name, qualifier, value and change in that order with the column labels ("value", "change") supplied by labels.
- With `onEntryPress`: each row is a RAC `Button`; otherwise nothing but the see-all link is focusable.

## Responsive, touch, motion, forced colours
- Names truncate before values; values and changes never wrap.
- Rows at least 44 px tall when interactive.
- No live ticking animation; a host that refreshes values replaces them without motion.
- Forced colours: change keeps its arrow icon and sign.

## Acceptance tests
- Given three entries, when rendered, then three rows appear in the given order.
- Given a change with direction up and sentiment negative, when rendered, then the arrow points up and the negative semantic colour and word are used.
- Given a long name, when truncated, then the full name is still the accessible name of the row.
- Given no entries, when rendered, then the empty line appears.
- Given onEntryPress, when a row is activated with Enter, then it is called with the row id.
