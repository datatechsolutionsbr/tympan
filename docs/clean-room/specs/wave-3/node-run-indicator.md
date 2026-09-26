# NodeRunIndicator

Wave 3 · canvas · Status: specified

## Purpose
A small badge on a node that shows its state in the current or inspected run: pending, running, succeeded or failed, with duration when finished.

## Anatomy
- **State mark**: pending mark, running mark, success mark or failure mark, placed at the top end corner of the node.
- **Duration badge**: after completion, elapsed time.
- **Running outline**: an accent ring around the node while running, tinted with the node kind's run accent (NodeKindCatalog).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| nodeId | string | required | reads the node's result from shared run state (FlowEditorState) |
| kind | string | from node | selects the run accent; passed explicitly, not inferred from the DOM |

Result fields read: status (pending, running, success, error), durationMs, error message.

Duration format: under one second as whole milliseconds; otherwise seconds with one decimal, localised.

## States
No result (renders nothing); pending; running; success (with duration); error (with duration and the error message available); run finished and inspected later (same visuals).

## Keyboard and ARIA
No RAC primitive; custom status. The mark is not separately focusable; its state word and duration are part of the node's accessible name ("running", "succeeded in 1.2 s", "failed: message"). Changes in state for the node that has focus are announced through a polite live region owned by the editor, not one region per node. Error text is reachable on focus (tooltip via RAC TooltipTrigger on the focused node) and in the run panel.

## Responsive, touch, motion, forced colours
- Marks use icon plus colour; semantics per §2.3 (success, pending, error), never the accent.
- Reduced motion: the running mark does not spin; a static running glyph is used and the ring does not pulse.
- Forced colours: marks are glyphs in CanvasText; the running ring becomes a system-colour outline.

## Acceptance tests
- Given no result for a node, when rendered, then nothing is shown.
- Given status success and 340 ms, when rendered, then a success mark and "340 ms" are shown.
- Given status error, 2500 ms and message "timeout", when the node is focused, then its accessible name contains "failed" and "timeout" and the badge shows "2.5 s".
- Given status running and reduced motion, when rendered, then no rotating animation runs.
- Given a result that changes from running to success while the node has focus, when it changes, then the editor's live region announces the new state once.
- Given forced colours, when a node fails, then the failure glyph remains visible.
