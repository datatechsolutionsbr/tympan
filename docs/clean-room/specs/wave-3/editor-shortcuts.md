# EditorShortcuts (history, clipboard, keys)

Wave 3 · utility · Status: specified

## Purpose
Give the flow editor its keyboard shortcuts plus stand-alone undo/redo and copy/paste helpers usable outside the shared store.

## Contract
- `useEditorHistory(nodes, edges, setNodes, setEdges, bound?)` → `{ undo, redo, canUndo, canRedo, snapshot }`. Same rules as FlowEditorState history; `canUndo`/`canRedo` must be reactive (the fork's version is not; fix it).
- `useEditorClipboard(nodes, edges, setNodes, setEdges, snapshot)` → `{ copy, paste, hasCopied }`. Same rules as FlowEditorState copy/paste; `hasCopied` reactive.
- `useEditorShortcuts(handlers, options)` registers the key map below. `handlers` supplies each action; `options.scope` is the canvas element (listening is scoped to it, not the whole document); `options.enabled` turns the map off.

Key map ("Mod" = Command on Apple platforms, Control elsewhere):
| keys | action | notes |
|---|---|---|
| Escape | deselect all | also closes an open canvas menu first |
| V | select tool (pointer mode) | single-key |
| H | pan tool (hand mode) | single-key |
| G | toggle background grid | single-key |
| M | toggle minimap | single-key |
| Shift+1 | zoom to 100% | |
| Shift+5 | zoom to 50% | |
| Mod+G | group selected nodes | |
| Mod+Shift+G | ungroup selected groups | |
| Mod+Z | undo | only when possible; otherwise the browser default is kept |
| Mod+Shift+Z, Mod+Y | redo | only when possible |
| Mod+C | copy selection | |
| Mod+V | paste | |
| Mod+A | select all nodes | |
| Mod+D | duplicate selection | |
| Mod+1, Mod+Shift+F | fit graph to view | |
| Mod+minus | zoom out | |
| Mod+plus / Mod+equals | zoom in | |
| Delete, Backspace | delete selected nodes and connectors | refused when locked |

Rules:
- Ignore all shortcuts while focus is in a text input, text area, select, or editable content, and while a dialog is open.
- Shortcuts that act call `preventDefault`; those that do nothing leave the event alone.
- Single-character shortcuts (V, H, G, M) must satisfy WCAG 2.1.4: they are active only while the canvas has focus, and the host can turn them off (`options.singleKey: false`).
- The key map is exported as data (`editorKeyMap`) so the shortcuts panel and ToolbarTrigger tooltips show the same list, localized.

## Properties and events
`handlers`: one callback per action in the key map. `options`: `{ scope: Element; enabled?: boolean (true); singleKey?: boolean (true) }`. History and clipboard helpers: arguments as listed in Contract.

## States
- Enabled or disabled; single-key shortcuts on or off.
- Suspended while text entry or a dialog has focus.
- Undo/redo availability drives whether their keys act.

## Keyboard and ARIA
- The canvas region announces the availability of shortcuts through `aria-keyshortcuts` on the related toolbar buttons and a "Keyboard shortcuts" panel (dialog) toggled from the command bar.
- Escape leaves the canvas focus trap: a second Escape with nothing selected moves focus to the canvas's container toolbar (design direction §5, "foco preso no canvas").

## Responsive, touch, motion, forced colours
- Not applicable for keys; every shortcut action is also reachable from a visible control or menu for touch and switch users.

## Acceptance tests
- Given focus in a text field on the canvas page, when Mod+A is pressed, then the field's text is selected and nodes are not.
- Given nothing to undo, when Mod+Z is pressed, then the event is not prevented.
- Given two nodes selected and focus on the canvas, when Mod+G is pressed, then a group is created.
- Given focus outside the canvas, when V is pressed, then the control mode is unchanged.
- Given `singleKey: false`, when H is pressed on the canvas, then nothing happens.
- Given the canvas is locked, when Delete is pressed, then the selection is not removed.
- Given a clipboard, when Mod+V is pressed twice, then two cascaded copies exist.
- Given nothing selected, when Escape is pressed twice, then focus moves to the editor toolbar.
