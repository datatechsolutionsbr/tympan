# LiveReportView

Wave 2 · chart · Status: specified

## Purpose
Shows a run's report while the run executes: subscribes to the run-event stream, displays the run phase and per-step timeline, and fills the ReportView progressively. Also includes the reusable run-event stream hook.

## Anatomy
- **Phase pill**: StatusPill with the run phase.
- **Step strip**: horizontal list of steps seen so far, each with a state mark and step id (and kind in meta type); failed steps expose their error as a tooltip and in text.
- **Report**: ReportView fed by the accumulated report.
- **Waiting line**: when there is no report yet ("waiting for data" or "paused, waiting for input").
- **Error block**: InlineNotice (danger) with the failure message.

## Run-event stream (`useRunEventStream`)
Inputs: flow id, run id (either null means idle), and a host-provided `openStream(flowId, runId, callbacks, lastEventId)` returning a close function. Callbacks: connected, event, cursor (last event id), done (completed or failed), error.
Output: `{ events, status, error }` where status is `idle | streaming | completed | failed | error`.
Connection states and rules:
- idle → connecting → open; open → done on terminal event; any error → retry wait → connecting.
- Retries with exponential backoff capped at a few seconds, at most three consecutive retries; each reconnect resumes from the last cursor.
- Circuit breaker: more than a fixed number of attempts inside a short window stops retrying and reports `error`.
- Changing run id resets events and state; unmount always closes the connection. There is never more than one open connection per hook.

## Event reduction
- run started → phase running; step started → step running; step completed → step done and, if it produced report content, merge it; step error → step failed; run paused → phase paused, step paused, pause prompt appended as an inputRequest section; UI section emitted → appended; run completed → phase completed; run failed → phase failed with message.
- Terminal initial status (completed, failed, cancelled): do not subscribe; show the initial report.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| flowId, runId | string | required | Run to follow. |
| openStream | function as above | required | Transport. |
| initialReport | Report or null | null | Seed or final report. |
| initialStatus | string (case-insensitive run status) | undefined | Lets the view skip subscription for finished runs. |
| interactive | boolean | false | Allow answering input requests in place. |
| submitInput | `(runId, stepId, decision) => Promise<void>` | undefined | Required when interactive. |

## States
Phases: pending, running, paused, completed, failed, cancelled. After an input is submitted, the phase shows running optimistically until the stream moves past paused.

## Keyboard and ARIA
- Phase pill inside a polite live region: phase changes are announced; individual steps are not.
- Step strip is a list; each item's state is a word, not only a coloured dot.
- No APG pattern; no RAC primitive; custom.

## Responsive, touch, motion, forced colours
- Step strip wraps; never scrolls the page horizontally.
- Running indicator pulses only when motion is allowed; static otherwise.
- Forced colours: state marks keep distinct shapes.

## Acceptance tests
- Given initial status completed, when mounted, then `openStream` is never called and the initial report shows.
- Given events started, step A started, step A completed with a section, when reduced, then step A is done and the section is shown.
- Given run paused with a prompt, when reduced, then phase is paused and an input request appears.
- Given the stream errors four times in a row, when retrying, then status becomes error after three retries.
- Given run id changes, when re-rendered, then the old connection closes before the new opens and events reset.
- Given run failed with "timeout", when reduced, then an error block shows "timeout".
