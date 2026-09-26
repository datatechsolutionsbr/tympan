# RunPanel

Wave 3 · data display · Status: specified

## Purpose
A docked panel showing the execution progress of the flow in the editor, one row per executable node, with Run and Stop controls.

## Anatomy
- Header: title, "running" status indicator (only while running), primary action (Run or Stop), close control.
- Node list: one row per node except notes, in canvas order.
- Row: status icon plus status word, node label, node kind, optional error text, optional duration.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Rendered only when true. |
| onClose | () => void | required | Close request. |
| onRun | () => void | required | Start a run. |
| onStop | () => void | required | Cancel the active run. |
| labels | object of strings | required | Title, running, run, stop, close, empty, status words. |

Reads from FlowEditorState: nodes, isRunning, per-node results { status, durationMs?, error? }.

## States
- idle, cannot run: Run is disabled when the flow has no configured start node or no end node; a hint explains why (the fork only disabled it; the hint is new).
- idle, can run: Run enabled.
- running: Stop replaces Run and uses the danger emphasis; a status message "running" is visible and announced.
- per-row status: pending, running, success, error; each has an icon and a word (§2.11 rule: colour never alone). Running icon rotates only when motion is allowed.
- empty: message when there are no executable nodes.
- durations: under one second shown in milliseconds, otherwise seconds with one decimal, formatted with the host locale.

## Keyboard and ARIA
- Panel is a labelled `region`. Buttons use RAC Button.
- Rows form a list; status changes of the whole run go through a polite live region; individual row changes are not announced one by one.
- Error text is associated with its row (`aria-describedby`).
- Escape closes the panel when focus is inside it.

## Responsive, touch, motion, forced colours
- Docked at the bottom of the editor on wide screens; full-width sheet on phones.
- 44 px targets on Run, Stop and Close.
- Reduced motion: spinner replaced by a static running icon.
- Forced colours: status icons remain visible with system colours; the word carries the state.

## Acceptance tests
- Given a flow with a configured start and an end node, when the panel opens, then Run is enabled.
- Given a flow without an end node, when the panel opens, then Run is disabled and the reason is shown.
- Given a running flow, when the panel renders, then Stop is shown instead of Run and a status reads "running".
- Given a node result with error "timeout", when the list renders, then that row shows the error word and the text "timeout".
- Given a note node on the canvas, when the list renders, then it has no row.
- Given a node took 1500 ms, when the row renders, then its duration reads as 1.5 seconds in the current locale.
