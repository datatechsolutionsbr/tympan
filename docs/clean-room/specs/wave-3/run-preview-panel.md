# RunPreviewPanel

Wave 3 · data display · Status: specified

## Purpose
A floating panel that shows live node results while a run executes and, below them, the recent run history of the flow with drill-down to one node's output.

## Anatomy
- Header: title, close control.
- Live section (only while running): list of node results with status icon and word, node identifier and duration.
- Node detail (when a node result is selected): status word, duration, error text, outputs as formatted, read-only structured text; its own close control.
- History list: one button row per run with status icon and word, start time and total duration.
- Expanded run: its node results as selectable rows.
- Loading, empty and error states for the history.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Rendered only when true; history loads on open. |
| onClose | () => void | required | Close request. |
| flowId | string | required | Flow whose runs are listed. |
| loadRuns | (flowId: string) => Promise<Run[]> | required | Host loader for recent runs. |
| labels | object of strings | required | Title, section titles, status words, close, empty, loading, error. |

Reads isRunning and live node results from FlowEditorState.

## Behaviour rules
- History reloads when the panel opens and again when a run finishes (running changes to not running).
- Selecting a run row toggles it (select or collapse) and clears any node detail.
- Status words normalise engine spellings (e.g. completed or succeeded read as "completed"). Missing duration shows a dash-free "not reported" word (§2.13 forbids decorative dashes).

## States
- running / not running; history loading, empty, error, populated; run selected; node detail open.

## Keyboard and ARIA
- Panel: labelled `region`. Run rows: APG Disclosure (button with `aria-expanded`). Node rows: buttons that open the detail and move focus to the detail heading; closing the detail returns focus to the row. RAC: Disclosure for runs, Button for node rows.
- Live results region is `aria-live="polite"` summarising counts, not every tick.
- Output text is focusable and scrollable by keyboard.

## Responsive, touch, motion, forced colours
- Floats over the canvas on wide screens without covering the run controls; becomes a full-width bottom sheet on phones.
- All rows at least 44 px tall.
- Running icons rotate only when motion is allowed.
- Forced colours: selected run keeps a system-colour outline.

## Acceptance tests
- Given the panel opens, when loadRuns resolves with two runs, then two run rows appear with status words.
- Given a run is executing, when node B finishes with success, then B appears in the live section with the word "success".
- Given a run row is collapsed, when it is activated, then its node results appear and `aria-expanded` is true.
- Given a node row, when activated, then the detail shows its outputs and focus moves to the detail.
- Given a run just finished, when isRunning becomes false, then loadRuns is called again.

## Open questions
- The fork has both this panel and RunDrawer, which supersedes it. Keep only RunDrawer unless a host needs the floating variant.
