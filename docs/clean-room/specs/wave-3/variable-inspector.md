# VariableInspector

Wave 3 · data display · Status: specified

## Purpose
A side panel that shows, for each node in execution order, which variables it consumes and which it produces, so authors can trace data through the flow.

## Anatomy
- Header: title, close control.
- Node entries in topological order: expander button with node kind icon, node label and variable count.
- Expanded body: an "Inputs" group and an "Outputs" group; each variable shows its name (monospace) and an inferred type word.
- Empty body message when a node has no variables; panel-level empty message when there are no nodes.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Rendered only when true. |
| onClose | () => void | required | Close request. |
| labels | object of strings | required | Title, close, inputs, outputs, variables (count noun), no variables, no nodes. |

Reads nodes and connectors from FlowEditorState.

## Behaviour rules
- Order: topological sort of nodes by connectors; nodes not reachable in the sort (cycles, disconnected) are appended in canvas order. Notes are excluded.
- Inference per node kind: start publishes its declared input names; end consumes its declared outputs; a compute node consumes one input tagged with its root operation and produces one output; a branch node consumes each condition variable and produces true and false branch outputs; loop nodes consume the iterated collection and produce item and index; answer nodes consume a template and produce declared outputs. Unknown kinds show no variables.
- Types are informative words ("any", "array", "number", "boolean", "string").

## States
- collapsed (default) and expanded per entry; any number may be expanded.
- empty panel; entry with zero variables.

## Keyboard and ARIA
- APG pattern: Disclosure (each entry header is a button with `aria-expanded` controlling its body). RAC primitive: Disclosure / DisclosureGroup with multiple expansion allowed.
- Tab moves between entry headers; Enter or Space toggles.
- The panel is a labelled `region`; Escape closes when focus is inside.

## Responsive, touch, motion, forced colours
- Same placement rules as other editor side panels (§2.8).
- Entry headers are full-width targets of at least 44 px height.
- Expand and collapse use the quick duration; instant under reduced motion.
- Forced colours: chevron and group headings remain visible; input and output groups are distinguished by heading text, not colour.

## Acceptance tests
- Given nodes A→B→C connected in that order but created in reverse, when the panel opens, then entries appear A, B, C.
- Given a start node declaring "amount" and "term", when its entry expands, then two outputs named amount and term are listed.
- Given a branch node with a condition on "score", when expanded, then "score" is an input and two boolean branch outputs are listed.
- Given a collapsed entry, when Enter is pressed on its header, then `aria-expanded` becomes true and the body is visible.
- Given a note node, when the panel renders, then it has no entry.
