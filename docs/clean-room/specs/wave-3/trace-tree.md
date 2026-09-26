# TraceTree (and dry-run client)

Wave 3 · data display · Status: specified

## Purpose
Show how an expression evaluated on sample data: one row per evaluated sub-expression, indented by depth, each with the value it produced; plus a small client that requests such a trace from the engine.

## Anatomy
- Truncation notice (caution): shown when the engine stopped recording frames; states frames recorded and the limit, and that the final result is still correct.
- Tree of rows. Each row has:
  - expand/collapse control when the row has children, or an equal-width spacer;
  - label: operation name in monospace for operation rows, or a Tag reading "reference" / "value" plus the label for leaves;
  - argument summary: comma-separated `key: value` of the operation's scalar arguments;
  - result preview button: a one-line summary (list with its length, object with its key count, scalars shortened with an ellipsis, "null", or a dash when absent).
- Result detail: full pretty-printed value under the row, toggled by the preview button.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| report | `{ trace: TraceSpan; truncated: boolean; frameCount: number; frameLimit: number }` | required | `TraceSpan = { kind: 'operation' \| 'ref' \| 'value'; label; args?; result; children? }`. Wire keys may be snake case; the adapter maps them. |
| defaultExpandDepth | `number` | 2 | Rows shallower than this start expanded. |
| labels | `TraceTreeLabels` | from i18n adapter | expand, collapse, view result, truncation message. |

Dry-run client `runDryRun(endpoint, request, fetchImpl?)`: posts `{ config, inputs?, nodeOutputs? }` as structured data, resolves `{ result, trace }`; rejects with a `DryRunFailure` carrying the HTTP status and server text on non-success, on network failure, and on an unreadable body. The endpoint is always supplied by the host.

## States
- Row collapsed/expanded; result detail open/closed (independent).
- Truncated or complete.

## Keyboard and ARIA
- Follows the APG Tree View pattern; back with RAC `Tree` (`TreeItem`). Up/Down move between visible rows, Right expands or moves to first child, Left collapses or moves to parent, Home/End jump, Enter toggles the result detail.
- Each item's accessible name: label, then "result: ‹preview›"; `aria-level`, `aria-expanded` set.
- The result detail is associated to its item (`aria-describedby` or a nested region labelled "Result of ‹label›").

## Responsive, touch, motion, forced colours
- Indentation step shrinks on narrow screens; depth also exposed as text for screen readers and via a level rail that does not rely on hue.
- Rows are at least 44 px tall on touch (compact density allowed on desktop per §2.9 with a 44 px hit area).
- Result detail scrolls horizontally inside itself. No motion.

## Acceptance tests
- Given a report nested three levels, then rows at depth 0 and 1 are visible and depth-2 children are collapsed by default.
- Given a collapsed row, when Right Arrow is pressed on it, then its children become visible.
- Given a row, when its result preview is activated, then the full value appears beneath it.
- Given `truncated` true, then the caution notice shows both counts; given false, no notice.
- Given a leaf of kind reference, then it is labelled with the reference Tag, not as an operation.
- Given a result that is a list of 12 items, then the preview reads as a list of length 12.
- Given the server answers 500 with text "boom", when `runDryRun` is called, then it rejects with status 500 and message "boom".
