# NodePalette

Wave 3 · canvas · Status: specified

## Purpose
A side panel listing everything that can be placed on the canvas (agents, rules, data sources, model providers and every catalog step kind), searchable and draggable onto the canvas.

## Anatomy
- **Search field** at the top, filtering every section.
- **Collapsible sections**, each with a header (icon, title, item count, optional "add" button): agents, rules, data sources, model providers, then step kinds grouped by category (control flow, data processing, AI, output, annotation, and any other catalog category).
- **Items**: icon in its tone bubble, name, one-line description; agents also show role and a tier mark (AgentIdentity); rules show a read-only on/off state; providers show configured state and model count and open their configuration when activated.
- **Empty messages** per section and for "no results".
- **Catalog list part** (reusable alone): just the draggable list of step kinds for hosts that compose their own palette.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| agents, rules, entities, modelProviders | arrays | [] | section content |
| onCreateAgent, onCreateRule, onCreateDataSource, onAddModelProvider | () => void | none | show the section's add button |
| onConfigureProvider | (providerId) => void | none | provider item activation |
| kinds (list part) | string[] | catalog minus picker kinds | kinds to list, in order |
| onPlace | (kind, payload, point?) => void | canvas drop | placement by keyboard or tap (see below) |
| emptyMessage | string | i18n | list part empty text |

Excluded from the step list: experimental kinds, deprecated kinds, and kinds placed through their own section (agent, rule, data source). Dragging carries the kind, the entity id, the display label and, for step kinds, the catalog default configuration (NodeKindCatalog factory).

## States
Loading catalog (list part shows its empty message); sections open or collapsed (remembered per person on the device); searching; no results; item hover, focus-visible, dragging.

## Keyboard and ARIA
- Section headers: APG Disclosure pattern (RAC Disclosure) with aria-expanded; the add button is a separate RAC Button named "Add agent".
- Item lists: RAC GridList (APG Grid for lists) with drag support (RAC drag and drop); every item also offers a keyboard alternative to dragging: Enter places the item at the centre of the visible canvas (or next to the selected node) via onPlace, and focus moves to the new node.
- Search: RAC SearchField; result counts announced politely.

## Responsive, touch, motion, forced colours
- Below 1024 px the palette is a drawer; items are placed by tap (onPlace) since drag across a drawer is unreliable.
- Items and buttons 44 px. Descriptions at least 12 px.
- Reduced motion: section collapse is instant. Forced colours: tone bubbles bordered; states in words.

## Acceptance tests
- Given a loaded catalog, when rendered, then step kinds appear grouped by category, excluding experimental, deprecated and picker kinds.
- Given "stock" typed, when filtering, then every section shows only matches and empty sections show their empty message.
- Given the agents section collapsed, when rendered, then its items are hidden and the header reports collapsed.
- Given onCreateRule is absent, when rendered, then the rules section has no add button.
- Given a step kind is dragged, when the drag starts, then the payload carries kind, label and default configuration.
- Given a focused item, when Enter is pressed, then onPlace is called and the new node receives focus.
- Given a provider item, when activated, then onConfigureProvider receives its id.
