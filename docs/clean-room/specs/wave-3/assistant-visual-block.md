# AssistantVisualBlock

Wave 3 · chart · Status: specified

## Purpose
Turn the loosely structured payload of the assistant's visualization tool into a report block (figures, charts, tables, prose, region map, flow graph card) rendered by the same engine as ReportView, so chat answers and reports look the same.

## Anatomy
- Report block: a ReportView of the converted spec (title, optional subtitle, stacked layout).
- Flow card (graph payloads): title plus an "open" action that opens the live canvas when the host supports it; plain title otherwise.

## Contract
`parseAssistantVisual(output) => Envelope | null`:
- Accepts an object marked as a visualization or carrying a type; returns null otherwise.
- Types: figures, bar, line, area, table, sections, prose, region map, flow graph. Aliases are normalized (map-like words become region map; short prose alias becomes prose). Portuguese and English key aliases are accepted for type, title, data and country, because the producer is a language model.
- Requires a title. Flow graph requires a graph object; prose requires a body; all other types need at least one data row. Non-object rows are dropped.
- Optional: subtitle, x key, y keys, value format (number, currency, percent), per-column formats, country (for region map; aliases accepted).

`envelopeToReport(envelope) => ReportSpec`:
- figures: one figure per row (label from title/label keys, value formatted by the row's or envelope's format).
- sections: rows with a type and data object pass through; unknown section types fall to ReportView's note fallback.
- prose: one markdown section with the body.
- region map: items with region code, label and value; rows without a region are dropped; default country from configuration.
- table: columns from the first row; numeric columns default to number format.
- bar/line/area: x key and y keys from the envelope, else inferred (first non-numeric column is x, numeric columns are series).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| envelope | `Envelope` | required | Parsed payload. |
| onOpen | `() => void` | undefined | Only honoured for flow graph payloads. |
| locale, currency | from I18nAdapter | project settings | Number and currency formatting (the fork hard-codes one locale and currency; not acceptable). |

## States
- Valid envelope, invalid (null: the chat shows the tool's text summary instead).
- Flow card with or without the open action.

## Keyboard and ARIA
- Block is a `figure` labelled by its title; charts follow the Chart spec (text alternative and data table toggle).
- Open action is a RAC `Button` named "Open ‹title› in canvas".

## Responsive, touch, motion, forced colours
- Fits the chat column; wide tables scroll horizontally inside the block; 44 px open action; no motion.

## Acceptance tests
- Given `{ type: "bar", title: "T", data: [{ uf: "SP", total: 3 }] }` with no keys, then x is "uf" and series is ["total"].
- Given Portuguese keys for type, title and data, then the envelope parses.
- Given a prose type without a body, then parse returns null.
- Given a flow type without a graph, then parse returns null.
- Given figures with value format percent, then values display as localized percentages.
- Given a region map row without region, then it is dropped.
- Given a flow card and `onOpen`, when "open" is activated, then `onOpen` is called; for a chart payload `onOpen` is ignored.
