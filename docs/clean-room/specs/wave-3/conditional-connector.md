# ConditionalConnector

Wave 3 · canvas · Status: specified

## Purpose
The line joining two nodes; it shows branch labels, lets a person insert a step in the middle or delete the connection, and may attach to node borders instead of fixed ports.

## Anatomy
- **Path**: a curved line with an arrowhead at the target; its stroke may blend from the source kind's tone to the target kind's tone when unlabelled.
- **Wide hit path**: invisible, wider than the visible line, for hover and selection.
- **Branch label**: a small pill at the midpoint (true, false, loop, or a case name), with icon and word.
- **Control pill**: shown on hover or selection above the midpoint, with "insert step" and "delete connection".
- **Insert menu**: ConnectorInsertMenu, or a host picker.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| id, source, target | string | required | identity |
| sourcePort | string | none | label defaults from well-known branch outputs (true, false, loop) |
| label | string | derived | explicit branch label |
| condition | Condition | none | branch condition carried with the connector |
| insertableKinds | { kind, label }[] | a small default set of logic kinds | offered by the built-in insert menu |
| onInsertStep | (connectorId, kind, point) => void | none | performs the insertion |
| onOpenInsertPicker | (connectorId, point) => void | none | when set, replaces the built-in menu with the host's picker |
| floating | boolean | from catalog | attach to the closest border point of each node, sliding as nodes move; falls back to ports until nodes are measured |

Insertion splits the connector in two through the new node; the first half keeps the original label and condition, the second half is unconditional. Deletion removes only this connector. Both create one undo step.

## States
Idle (reduced emphasis), hover, selected (full emphasis), labelled, controls visible, insert menu open, locked (no controls).

## Keyboard and ARIA
No RAC primitive; custom. Connectors are reachable from the source node (Tab order: node, then its outgoing connectors) or from the list view. A focused connector is named "from A to B, branch true"; Delete removes it; Enter or the context menu opens the insert menu. Control pill buttons are RAC Buttons with names "Insert step between A and B" and "Delete connection from A to B". Labels never rely on colour (§2.3).

## Responsive, touch, motion, forced colours
- Control buttons 44 px; on touch, controls appear on tap-select.
- Reduced motion: no flowing dash animation on connectors; controls appear instantly.
- Forced colours: stroke in CanvasText, selected stroke thicker; label pills bordered.

## Acceptance tests
- Given a connector from a true output, when rendered, then the label "true" is shown with its icon.
- Given hover, when the pointer moves from the line to the control pill, then the pill stays visible.
- Given insert with kind "compute", when chosen, then the old connector is replaced by two through the new node and the first keeps the condition.
- Given onOpenInsertPicker, when insert is activated, then the host callback receives the id and midpoint and no built-in menu opens.
- Given the canvas is locked, when hovering, then no controls appear.
- Given floating mode, when a node moves around its neighbour, then the attachment point slides along the border.
