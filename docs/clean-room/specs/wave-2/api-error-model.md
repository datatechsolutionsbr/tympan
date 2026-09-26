Wave 2 · Utility · Status: specified

# ApiErrorModel

## Purpose
A shared error shape for API failures and the run-domain types that live-run components consume.

## Contract
- `ApiError`: an Error with `status` (HTTP code) and `code` (stable machine string), serialisable to `{ message, code, status }`.
- `HttpResponseError`: an `ApiError` for non-2xx responses; `code` fixed to an HTTP-response code, `status` defaults to 500.
- A problem+json variant carries `type`, `title`, `detail` (RFC 9457), since §2.12 shows the problem `type` to people.
- Guards and readers: `isApiError(e)`, `statusOf(e)` (500 when unknown), `codeOf(e)` ("unknown" when unknown).
- Run domain types: node status (`pending`, `running`, `success`, `error`, `skipped`), run status (`pending`, `running`, `completed`, `failed`, `cancelled`), a JSON-like variable value, and an execution event `{ type, runId, nodeId?, nodeType?, status?, outputs?, error?, durationMs?, timestamp }`.
- Event `type` is open-ended: known kinds are run started, node started, completed, error, skipped, restored, retry, run paused, completed, failed, model generation, tool execution, agent stream, UI render; consumers must ignore unknown kinds without failing.
- These types must be generated from, or checked against, the Fakhir OpenAPI contract.

## Properties and events
Not applicable (types and pure functions).

## States
Not applicable.

## Keyboard and ARIA
Not applicable. Error-state components map `status` to a plain-language sentence (§2.12).

## Responsive, touch, motion, forced colours
Not applicable.

## Acceptance tests
- Given an `HttpResponseError` with 404, then `isApiError` is true and `statusOf` is 404.
- Given a plain Error, then `statusOf` is 500 and `codeOf` is "unknown".
- Given serialisation, then message, code and status are present.
- Given an event with an unknown type, then the run-event consumer skips it without throwing.
