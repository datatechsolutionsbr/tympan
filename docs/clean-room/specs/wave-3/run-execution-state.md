# RunExecutionState

Wave 3 · utility · Status: specified

## Purpose
Start and stop a flow run through host-supplied transport, follow its event stream, and project the events onto FlowEditorState so nodes and controls show live status without flicker.

## Contract
`useFlowExecution(flowId, startRun, openStream, cancelRun?)` returns `{ isRunning, start(inputs?), stop(), runId, streamStatus }`.
- `startRun(flowId, inputs?) => Promise<{ id }>`; `openStream` is the run-event transport of LiveReportView's run-event stream; `cancelRun(runId) => Promise<void>` is optional.
- `isRunning` is true from the moment `start` is called until run content says the run ended. It must not depend on the transport connection state (a dropped and resumed connection does not mean the run stopped).
- If `startRun` rejects, `isRunning` returns to false and the error is rethrown.
- `stop()` asks the backend to cancel first when `cancelRun` exists, then forgets the run and resets node results. Without `cancelRun`, the run keeps going server side; the UI must say "stopped following" rather than "stopped".
- Changing `flowId` resets everything.

`applyRunEvent(actions, event)` (pure):
| event | effect |
|---|---|
| run started | set running (never clears results: a suspended run that resumes sends it again) |
| node started | node → running |
| node completed, node restored | node → success with outputs and duration |
| node failed | node → error with message and duration |
| run completed, run failed | set not running |
| other | ignored |

`useRunProjection(events, streamStatus)`: applies only the events not yet applied (tracks a count); clears results only on a genuine reset (status idle, or the event list became shorter, meaning a new run); when the stream reaches a terminal status it forces not running, but never forces running.

`resetRunProjection(actions)`: clear results and set not running.

## Properties and events
Arguments and return values as listed in Contract.

## States
- Idle, launching (start requested, no event yet), running, ended (completed or failed), stopped following.
- Stream: idle, streaming, completed, failed, error.

## Keyboard and ARIA
Not applicable (state only). RunControls announces start, completion and failure through a polite live region fed by these events.

## Responsive, touch, motion, forced colours
Not applicable.

## Acceptance tests
- Given `start` was called and the start call resolved but no event arrived yet, then `isRunning` is true.
- Given a run-completed event while the stream status still says streaming, then `isRunning` is false.
- Given events [run started, node A completed, run started (resume)], then node A stays success.
- Given 5 events applied, when 2 more arrive, then only the 2 new ones are applied and no result is cleared.
- Given the event list shrinks to 0, then results are cleared.
- Given `cancelRun`, when `stop` is called, then `cancelRun(runId)` is called before local reset.
- Given `startRun` rejects, then `isRunning` is false and the promise rejects.
- Given a node-restored event, then that node shows success.
