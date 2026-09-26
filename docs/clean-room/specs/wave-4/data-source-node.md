# DataSourceNode (full feature)

Wave 4 · canvas · Status: specified · Supersedes `wave-3/data-source-node.md`

## Purpose
A node that reads rows from a connected data source (a database table, a file, a service) and summarises what it will read. This version resolves the open question on logos: the source mark is an **optional host-supplied logo slot** through ThirdPartyMarkSlot, and the dialect is **always written as text**, so the node is complete with no logos at all.

## Anatomy
- GraphNodeCard (wave 3) with state attributes from NodeStateStyles and kind tone from FlowPaletteTokens.
- **Source mark** in the icon bubble: ThirdPartyMarkSlot with category `datasource` and the dialect as mark key. Registered mark: shown decoratively. No mark: the neutral database glyph (lucide).
- **Dialect badge**: the dialect's display name as text (for example "PostgreSQL"), always present next to the title in detailed density and in the accessible name in both densities. The display name comes from the host's dialect list or, failing that, the dialect key with its first letter capitalised.
- **Title**: node label; when detailed, a second line "source name · table" (the separator is a middle dot, not a dash, §2.13).
- **Connection indicator**: a read-only status mark (icon and word "connected" or "not connected"), StatusPill-like, never a switch.
- **Meta row**: "sample" Tag for read-only sample sources; counts of selected columns, filters and the row limit.
- **Remove action**; one input port and one output port (ConnectionPorts); NodeRunIndicator.
- **Not configured state**: problem card with the title and an explanation, both ports still present.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| id | string | required | node id |
| config | { sourceId; dialect?; table; selectedColumns?; filters?; limit } or null | required | reading configuration |
| source | { name; connected?: boolean } | none | resolved source for display; falls back to the source id; `connected` undefined hides the indicator |
| dialects | { key; displayName }[] | [] | host list of known dialects for display names |
| label | string | localised | title |
| readOnly | boolean | false | sample source: no connection indicator, shows "sample" |
| density | 'detailed' or 'compact' | 'detailed' | compact hides the second line and meta row but keeps the dialect in the accessible name |
| onConfigure | (id) => void | none | when absent the card is not interactive |
| onRemove | (id) => void | none | remove action |

Marks are not a property of the node: the host registers them once in the mark registry (ThirdPartyMarkSlot) under dialect keys, sourcing them from an openly licensed set or its own licensed assets. The library ships none.

Summary format: counts appear only when greater than zero, in the order columns, filters, limit, joined by a middle dot; the limit reads as "up to N rows" (localised, pluralised).

## States
Configured; not configured (problem); read-only sample; connected or not connected; compact; selected; focus-visible; locked; running, succeeded, failed (NodeStateStyles); mark present or fallback glyph; mark image failed (fallback glyph).

## Keyboard and ARIA
- Interactive card is a RAC `Button` (APG Button) named "data source: ‹title›, ‹dialect display name›, ‹table›"; the connection state and counts are its description.
- The mark is `aria-hidden`; the dialect text carries the meaning.
- Remove is a sibling RAC `Button` named "remove ‹title›".
- Without `onConfigure` the card is not focusable as a button; its content remains readable.

## Responsive, touch, motion, forced colours
- 44 px targets for the card action and remove. Text at least 12 px (§2.2).
- No motion besides NodeRunIndicator's (stopped under reduced motion).
- Forced colours: badges keep borders; the mark renders in `CanvasText` (monochrome default of ThirdPartyMarkSlot); counts are text.

## Acceptance tests
- Given a configured node with 3 columns, 2 filters and limit 100, when rendered detailed, then the meta row reads the three counts in that order.
- Given zero filters, then no filter count appears.
- Given no configuration, then the problem card is shown with both ports.
- Given readOnly, then "sample" is shown and no connection indicator.
- Given no mark registered for the dialect, then the neutral database glyph and the dialect text are shown.
- Given a registered mark, then it is hidden from assistive technology and the dialect text is still visible.
- Given a mark image that fails to load, then the fallback glyph replaces it.
- Given compact density, then the accessible name still includes the dialect display name.
- Given no onConfigure, then the card is not focusable as a button.
- Given `source.connected` false, then the indicator reads "not connected" with its icon.
