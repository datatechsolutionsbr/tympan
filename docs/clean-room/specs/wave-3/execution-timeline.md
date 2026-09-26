# ExecutionTimeline

Wave 3 · data display · Status: specified

## Purpose
Inspect a finished or running flow execution step by step: a vertical list of steps with status and timing, and a detail pane for the selected step (timing, model usage, model calls, tool calls, inputs, outputs, error).

## Anatomy
- Step list (left or top): one entry per executed node with ordinal, node id, node kind, StatusPill, duration and start time; a connector between entries.
- Inspector (right or below): header with node id, optional "restored" Tag (output carried from an earlier run), StatusPill and host-supplied actions; a facts list (started, finished, duration, status); model metrics (provider and model, tokens in and out, cost); error block; model calls section; tool calls section; inputs and outputs as formatted structured text.
- Model call entry: a disclosure whose summary shows turn number, agent name, tokens in/out, cache reads/writes when present, cost, time to first token, duration and stop reason; its body shows the model input and output transcripts as readable text (text blocks as text, other blocks as structured text).
- Tool call entry: status, tool name, turn and duration.
- Empty state when there are no steps.
- Helper `attachAuditEvents(entries, events)`: returns new entries with model-call and tool-call events attached to their node in sequence order; ignores unknown nodes and other event kinds; returns the input untouched when there is nothing to attach.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| entries | `TimelineEntry[]` | required | `{ nodeId; nodeKind; status: 'completed'\|'running'\|'failed'\|'pending'\|'skipped'; startedAt; completedAt; durationMs; inputs?; outputs?; error?; metrics?; modelCalls?; toolCalls?; restored? }` |
| selectedNodeId | `string` | undefined | Controlled selection (for example synced with the URL). |
| onSelect | `(nodeId) => void` | undefined | Selection change. |
| inspectorActions | `(entry) => ReactNode` | undefined | Extra actions (for example "rewind from here"). |
| labels | `TimelineLabels` | from i18n adapter | All strings; omitting `restored` hides that Tag. |

## States
- Default selection (uncontrolled): the first failed entry if any, else the first entry. This extends the fork, which always picked the first entry; design direction §5 asks failures to be salient.
- Step statuses map to the proof-neutral status vocabulary of StatusPill (icon + word): completed, running, failed, pending, skipped.
- Actor attribution: when an entry is produced by an agent, the inspector header shows ActorIdentity before the time (§2.11).

## Keyboard and ARIA
- Step list follows APG Listbox (single select) with roving focus; back with RAC `ListBox`. Selection follows focus is off; Enter/Space selects.
- Inspector is a region labelled "Details of ‹node id›"; changing selection announces the node id politely.
- Model call entries use APG Disclosure (native details/summary or RAC `Disclosure`).
- Durations and costs use tabular numbers and localized formatting from the i18n adapter.

## Responsive, touch, motion, forced colours
- Two columns from the large breakpoint; stacked below, with the inspector following the list and a "back to steps" link.
- 44 px step targets; no motion; status never by colour alone.

## Acceptance tests
- Given no entries, then only the empty message is shown.
- Given three successful entries and no selection, then the first is selected and its details show.
- Given `selectedNodeId` "b", then entry "b" is selected; when entry "c" is activated, then `onSelect("c")` fires.
- Given an entry with `restored` and a restored label, then the Tag is shown.
- Given model-call and tool-call events for node "a", when `attachAuditEvents` runs, then entry "a" gains them in order and other entries are unchanged objects.
- Given a model call with cache usage, then its summary includes cache reads and writes.
- Given a failed run, when opened, then the failed step is selected.
