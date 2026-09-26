# GenericNode

Wave 3 · canvas · Status: specified

## Purpose
Draws any node kind purely from NodeKindCatalog data, so a kind added on the backend appears on the canvas without new front-end code.

## Anatomy
- GraphNodeCard with header (icon, label, category) and meta row.
- **Ports** from the kind's topology, or per-instance outputs when the node defines its own branches (for example one output per configured case).
- **Branch labels** beside labelled outputs, with icon and word by tone (success, error, info, warning, neutral).
- **Hover toolbar** above the card: configure, duplicate, delete.
- NodeRunIndicator.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| id, kind | string | required | identity |
| label | string | catalog label | per-instance label; always wins over the catalog label |
| density | 'detailed' or 'compact' | 'detailed' | card density |
| dynamicOutputs | { id, label, tone? }[] | none | replaces the kind's static outputs for this instance |
| onConfigure | (id) => void | none | opens the configuration dialog; toolbar shows configure only when set |
| selected | boolean | false | selected look, toolbar visible |

Duplicate, delete and rename act directly on the shared editor state (FlowEditorState), each creating one undo step; duplicate places the copy offset from the original and selects only the copy; delete also removes attached connectors.

## States
Default; hover (toolbar appears, stays while the pointer crosses the gap to it); selected (toolbar visible); locked (no toolbar, no rename, no duplicate or delete even if called); compact; catalog not loaded (fallback icon).

## Keyboard and ARIA
- Card: APG Button pattern (RAC Button) when configurable; name "category: label".
- Toolbar: APG Toolbar pattern (RAC Toolbar) that also appears when the card has keyboard focus, not only on hover; each tool has a name that includes the node label.
- Rename per GraphNodeCard.
- Ports per ConnectionPorts; labelled outputs expose their label.

## Responsive, touch, motion, forced colours
- Toolbar buttons 44 px; on touch the toolbar shows on selection (tap), not hover.
- Reduced motion: toolbar appears without transition. Forced colours: branch tones carry words; toolbar keeps visible boundaries.

## Acceptance tests
- Given a kind known only to the catalog, when a node of that kind renders, then it shows the catalog icon, label and category.
- Given a renamed node, when rendered, then the per-instance label is shown instead of the catalog label.
- Given dynamicOutputs with three branches, when rendered, then three labelled output ports exist.
- Given the node is focused with the keyboard, when rendered, then the toolbar is reachable by Tab.
- Given duplicate is activated, when done, then a copy is selected, the original is not, and one undo removes the copy.
- Given the canvas is locked, when delete is triggered programmatically, then nothing changes.
