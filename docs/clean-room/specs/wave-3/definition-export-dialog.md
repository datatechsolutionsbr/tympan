# DefinitionExportDialog

Wave 3 · overlay · Status: specified

## Purpose
A modal that shows a flow's portable definition (metadata plus graph) and lets the person copy it or download it as a file.

## Anatomy
- SectionedModal with title and explanation.
- Metadata grid: name, version, node count, connector count.
- Preview: read-only, monospace, scrollable text of the definition, truncated to a configurable number of lines with an ellipsis line when longer.
- Footer: Copy (secondary; switches to a "Copied" confirmation for a short time) and Download (primary).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Visibility. |
| onClose | () => void | required | Dismiss. |
| flow | { name: string; description?: string; version: number } | required | Metadata. |
| graph | { nodes; connectors; viewport } | required | Graph to export. |
| previewLineLimit | number | host constant | Lines shown in the preview. |
| labels | object of strings | required | Title, description, metadata names, preview, copy, copied, download. |

## Behaviour rules
- Definition = name, description, version, export timestamp (ISO) and the graph (nodes, connectors with their conditions, viewport), serialised with stable indentation.
- Copy uses the asynchronous clipboard; if unavailable, a fallback selection copy is used; on total failure an error message is shown (the fork claimed success).
- Download saves a file named from the flow name and version with a structured-data media type, sanitising characters not allowed in file names.

## States
- idle; copied (temporary); copy failed.

## Keyboard and ARIA
- APG pattern: Dialog (Modal). RAC: Modal, Dialog, Button.
- Preview is a focusable, labelled region so keyboard users can scroll it.
- The "Copied" confirmation is announced via a polite status region without moving focus.

## Responsive, touch, motion, forced colours
- Full-screen on phones; preview takes remaining height.
- 44 px buttons. No motion except the modal entry.
- Forced colours: preview has a system-colour border.

## Acceptance tests
- Given a flow with 3 nodes and 2 connectors, when the dialog opens, then the metadata shows 3 and 2.
- Given a definition longer than the line limit, when the preview renders, then it shows the limit plus an ellipsis line.
- Given clipboard access, when Copy is activated, then the full definition (not the truncated preview) is written and "Copied" is announced.
- Given Download is activated for flow "Pricing" version 2, then a file named from "Pricing" and 2 is saved.
- Given a connector with a branch condition, when exported, then the condition is present in the definition.
