# RunDrawer

Wave 3 · overlay · Status: specified

## Purpose
A docked drawer beside the editor that consolidates everything about execution: the live run, the run history, summary metrics, model token usage, tools called and a per-node breakdown.

## Anatomy
- Header: run-kind icon, title, run status word (idle, running, completed, failed), running indicator, close control.
- Tabs: Live and History.
- History list (History tab, nothing selected): one row per run with status, start time and total duration.
- Run detail (Live tab, or a selected history run): back control to the list (History only), metrics row, token section, tools section, per-node section.
- Metrics: total duration, node count, succeeded count, error count (error count uses the error tone only when above zero).
- Token section: input, output and total tokens, or an "not reported" hint.
- Tools section: tool names with call counts, or a "not reported" hint.
- Per-node row: status icon and word, label, kind, duration, error text, expandable output.
- Idle hint on the Live tab before any activity.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Rendered only when true. |
| onClose | () => void | required | Close request. |
| flowId | string | required | Flow whose runs are listed. |
| isRunning | boolean | required | A run is active. |
| runStatus | string | required | Engine status of the current run, normalised to idle, running, completed or failed. |
| loadRuns | (flowId: string) => Promise<Run[]> | required | Host loader; a rejection shows the error state (the fork silently showed an empty list). |
| labels | object of strings | required | Every visible string, including tab names, metric names and empty hints. |

## Behaviour rules
- When a run starts, the drawer switches to Live and clears any history selection.
- History loads when the drawer is open and the History tab is active.
- Live rows come from the editor state (notes excluded); history rows come from the selected run.
- Total duration: the run's own total when reported, otherwise the sum of node durations.
- Tokens and tools are extracted best-effort from node outputs (common usage and tool-call shapes) and summed; if none are found the section shows its hint rather than zeros.

## States
- idle, running, completed, failed; tab Live or History; history loading, empty, error; run selected; node output expanded.

## Keyboard and ARIA
- Drawer is a `complementary` landmark labelled by its title (non-modal: the canvas stays usable).
- Tabs: APG Tabs pattern, RAC Tabs (arrow keys move between tabs, automatic activation). The fork used current-page semantics; that is replaced by proper tab semantics.
- History rows are buttons; back control returns focus to the previously selected row.
- Status changes announced through a polite live region.

## Responsive, touch, motion, forced colours
- Pushes the canvas at wide widths, overlays as a drawer at medium widths, full-screen sheet on phones (§2.8).
- 44 px targets on tabs, rows and controls.
- Base duration for opening; no slide under reduced motion.
- Failed runs open with the error tone band and the failing node expanded (design direction §5 defects list).

## Acceptance tests
- Given the drawer is on History with a run selected, when a new run starts, then the Live tab becomes active and the selection is cleared.
- Given node outputs report input 10 and output 5 tokens on two nodes, when the Live tab renders, then the token section reads 20, 10 and 30.
- Given no node output reports tokens, when the section renders, then the "not reported" hint is shown.
- Given focus on the Live tab, when Right Arrow is pressed, then History is focused and selected.
- Given loadRuns rejects, when History opens, then an error message with retry appears.
- Given one node failed, when metrics render, then the error count reads 1 with icon and word.
