# FlowEditorState

Wave 3 · utility · Status: specified

## Purpose
Hold the editor's shared state (graph, history, clipboard, panels, run results, lock) and a stack of editor dialogs, with fine-grained read hooks so each part of the editor re-renders only for the slice it uses.

## Contract
Graph store (one instance per editor; must be creatable per provider, not a module singleton):
| field | type | initial | meaning |
|---|---|---|---|
| nodes, edges | graph arrays | `[]` | Current graph. |
| past, future | snapshot stacks | `[]` | Undo/redo history; depth bounded (configurable). |
| clipboard | snapshot or null | null | Copied nodes plus edges between them. |
| editingNodeId | `string \| null` | null | Node whose config dialog is open. |
| contextMenu | `{ kind: 'node'\|'connector'\|'canvas'; position; targetId? } \| null` | null | Open canvas menu. |
| controlMode | `'select' \| 'pan'` | select | Pointer behaviour. |
| layoutDirection | `'down' \| 'right'` | down | AutoLayout direction. |
| panels | `{ variables; versions; run; minimap; grid; shortcuts; preview }` booleans | grid on, others off | Visibility toggles. |
| cardDensity | `'detailed' \| 'compact'` | detailed | Node card detail level. |
| isRunning | boolean | false | A live run is in progress. |
| nodeResults | `Record<nodeId, { status: 'pending'\|'running'\|'success'\|'error'; data?; error?; durationMs? }>` | `{}` | Per-node run state. |
| selectedRunId | `string \| null` | null | Past run being shown. |
| locked | boolean | false | Editing refused (a past run's trace is on screen). Distinct from isRunning. |

Actions: set nodes/edges (value or updater), take snapshot, undo, redo, copy, paste(offset), select all, deselect all, set editing node, set/close context menu, set control mode, set layout direction, toggle each panel, close shortcuts, toggle density, set running, set/clear node results, set selected run, set locked, reset.

Rules:
- Take snapshot deep-copies node data, pushes onto past (trimming the oldest beyond the bound) and clears future.
- Undo moves the current graph to future and restores the last past entry; redo is symmetric; both are no-ops on empty stacks.
- Copy keeps selected nodes and only edges whose both ends are selected; no-op with nothing selected.
- Paste snapshots first, assigns fresh ids, remaps edges, offsets positions diagonally, selects only the pasted nodes, and updates the clipboard so repeated pastes cascade.
- When locked, duplicate and delete actions are refused.

Dialog stack store: `active` (agent editor, node config, flow settings, or none) with its payload; opening a dialog pushes the current one; closing pops and restores the previous one; close-all clears.

Read hooks: can undo, can redo, has clipboard, context menu, editing node id, selected node count, is running, node results.

## Properties and events
Covered by the tables in Contract (fields and actions are the interface).

## States
- History: empty, has past, has future, bounded (oldest dropped).
- Clipboard: empty or filled.
- Run: idle, running, showing a past run (locked).
- Dialog stack: empty, one dialog, stacked dialogs.

## Keyboard and ARIA
Not applicable (state only). EditorShortcuts consumes these actions.

## Responsive, touch, motion, forced colours
Not applicable.

## Acceptance tests
- Given an empty history, then can-undo is false; after a snapshot and an edit, undo restores the earlier graph and can-redo becomes true.
- Given the history bound N, when N+5 snapshots are taken, then past length is N.
- Given a new snapshot after an undo, then future is cleared.
- Given nodes A,B selected and edges A→B and B→C, when copied and pasted, then two new nodes and one new edge exist with new ids, offset positions, and only the new nodes selected.
- Given two pastes, then the second copies are offset from the first copies.
- Given `locked`, when delete is requested, then the graph is unchanged.
- Given the agent dialog open, when the node dialog opens and then closes, then the agent dialog is active again with its payload.
- Given two editor instances on one page, then their states are independent.
