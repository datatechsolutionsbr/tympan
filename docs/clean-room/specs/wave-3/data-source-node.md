# DataSourceNode

Wave 3 · canvas · Status: specified

## Purpose
A node that reads rows from a connected data source (database table or similar) and summarises what it will read.

## Anatomy
- GraphNodeCard.
- **Source mark**: a neutral database glyph plus the source dialect as a text badge (third-party logos are not required; if a host supplies a logo it is decorative next to the text).
- **Title** and, when detailed, a line "source name · table".
- **Connection indicator**: read-only "connected" state.
- **Meta row**: dialect badge, "sample" badge for read-only sample sources, counts (selected columns, filters, row limit).
- **Remove action**; one input port and one output port; NodeRunIndicator.
- **Not configured state**: problem card with the label and an explanation.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| id | string | required | node id |
| config | { sourceId, dialect?, table, selectedColumns?, filters?, limit } or null | required | reading configuration |
| source | { name } | none | resolved source for display; falls back to the source id |
| label | string | localised | title |
| readOnly | boolean | false | sample source: no connection indicator, shows "sample" |
| density | 'detailed' or 'compact' | 'detailed' | compact hides the second line and meta row |
| onConfigure | (id) => void | none | when absent the card is not interactive |
| onRemove | (id) => void | none | remove action |

Summary format: counts appear only when greater than zero, joined with a separator, and the limit reads as "up to N rows".

## States
Configured, not configured (problem), read-only sample, compact, selected, focus-visible, locked.

## Keyboard and ARIA
Interactive card is a RAC Button (APG Button) named "data source: title, table". The connection indicator is text plus an icon (status, not a switch: the fork's disabled switch is replaced by a StatusPill-like mark). Remove is a sibling RAC Button.

## Responsive, touch, motion, forced colours
44 px targets for the card action and remove. Text at least 12 px. Forced colours: badges keep borders; counts are text.

## Acceptance tests
- Given a configured node with 3 columns, 2 filters and limit 100, when rendered detailed, then the meta row reads the three counts in that order.
- Given zero filters, when rendered, then no filter count appears.
- Given no configuration, when rendered, then the problem card is shown with both ports.
- Given readOnly, when rendered, then "sample" is shown and no connection indicator.
- Given no onConfigure, when rendered, then the card is not focusable as a button.

## Open questions
- Whether the host should supply dialect logos at all; the default is text only.
