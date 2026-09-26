# DefinitionImportDialog

Wave 3 · overlay · Status: specified

## Purpose
A modal that accepts a flow definition file by drop or file picker, validates its structure, shows the result and imports the graph.

## Anatomy
- SectionedModal with title and explanation.
- Drop zone (before a file is chosen): instruction, hint about the accepted file type, and a real file-picker button inside it.
- Result view (after a file is chosen): file name, "Choose another" control, then either a success notice with node and connector counts or an error notice listing every validation problem.
- Footer: Cancel and Import (primary; disabled until the file is valid).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Visibility. |
| onClose | () => void | required | Dismiss. |
| onImport | (graph: FlowGraph) => void | required | Receives the normalised graph; the dialog then closes. |
| labels | object of strings | required | All visible strings including every validation message template. |

## Validation rules
- Content must parse as structured data and its root must be an object.
- The graph may be at the root or under a "graph" key.
- Required: a nodes list, a connectors list, a viewport object.
- Each node needs an id, a kind and a position; each connector needs an id, a source and a target. Every problem is listed with its item index.
- Normalisation: missing node data becomes an empty label; missing port names become the default port; branch conditions are kept verbatim; missing viewport numbers default to origin and zoom one.

## States
- empty, drag-over (drop zone emphasised with border and text change, not colour only), valid, invalid, reading.

## Keyboard and ARIA
- The drop zone is not the interactive element; the file-picker button inside it is (RAC FileTrigger, or DropZone + FileTrigger). The fork gave the zone a button role without keyboard handling; that is not allowed.
- APG pattern: Dialog (Modal). Validation result is announced via a polite status region; the error list is a real list.
- Choose another returns focus to the file-picker button.

## Responsive, touch, motion, forced colours
- On touch devices the drop instruction is replaced by "Choose file".
- 44 px targets. No animation on drag-over under reduced motion.
- Forced colours: drag-over indicated by a thicker system-colour border.

## Acceptance tests
- Given a valid file, when it is dropped, then a success notice shows the node and connector counts and Import is enabled.
- Given a file that is not parseable, when chosen, then an error "invalid format" is listed and Import stays disabled.
- Given a node at index 2 without a position, when validated, then the error list names index 2 and position.
- Given a keyboard user, when they Tab into the dialog, then the file-picker button is reachable and Enter opens the file chooser.
- Given a valid file whose connector has a condition, when imported, then onImport receives the connector with that condition.
- Given a result is shown, when Choose another is activated, then the drop zone returns and focus is on the picker.
