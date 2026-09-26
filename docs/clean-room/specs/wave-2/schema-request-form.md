# SchemaRequestForm

Wave 2 · form · Status: specified

## Purpose
Renders a form from a small field schema so a person can answer a paused run's request for input (approve with values, or reject with a reason). In Fakhir this backs human verification tasks (design direction §5).

## Anatomy
- **Surface**: sheet or card with a tone accent (info by default).
- **Prompt**: heading stating what is asked; optional description below.
- **Fields**: one Field per schema entry, label above, help below the label, error below the control (§2.10).
- **Error notice**: InlineNotice (danger) when submission fails.
- **Actions**: secondary "reject" button (optional) and primary "submit" button.
- **Resolution line**: after success, replaces actions with a StatusPill and sentence (approved and resumed / rejected and closed).

## Field kinds
| Kind | Control | Extra settings |
|---|---|---|
| text | TextField | placeholder, default |
| number | TextField in numeric mode | min, max, step, default |
| longText | TextArea | rows, default |
| choice | NativeSelect or ListboxSelect with an empty prompt option | options (value, label), default |
| boolean | Checkbox | default |
Common to all: key (also the payload key), label, required, help.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| runId | string | required | Run being answered. |
| request | `{ stepId; prompt; description?; fields; submitLabel?; rejectLabel?: string \| null; tone? }` | required | Schema. `rejectLabel` null hides reject. |
| submit | `(runId, stepId, decision: { approved: boolean; payload?: object; reason?: string }) => Promise<void>` | required | Host call. |
| onResolved | `(result: { approved: boolean; payload: object }) => void` | undefined | After success. |

## Behaviour
- Initial values come from defaults; fields without defaults start empty.
- Submit (button or Enter in a single-line field): validates required fields and number bounds; on success sends approved true with the payload, dropping empty strings.
- Reject: sends approved false with the value of a field keyed `reason` if present, otherwise a generic reason; required-field validation does not block rejection.
- While sending: all controls disabled, primary shows a Spinner and "sending"; double activation is ignored.
- After success: form is read-only; no further submissions.
- On failure: error message shown, controls re-enabled, values kept.

## Keyboard and ARIA
- Native `form` with RAC `Form`; invalid fields get `aria-invalid` and `aria-describedby` to their error; focus moves to the first invalid field.
- Resolution and error are announced via `role="status"` / `role="alert"`.
- Buttons follow APG Button pattern.

## Responsive, touch, motion, forced colours
- Actions stack full-width under 640 px, primary last in DOM and visually on the end side on wide screens.
- Controls 44 px tall on touch. No animation beyond focus.
- Forced colours: tone accent replaced by border; error icon remains.

## Acceptance tests
- Given fields text (required) and number (min 0), when submitting empty, then the text field is invalid, focus moves there and `submit` is not called.
- Given valid values, when submitted, then `submit` receives approved true and a payload with the keys.
- Given a `reason` field and reject, when activated, then `submit` receives approved false and that reason.
- Given `rejectLabel` null, when rendered, then no reject button exists.
- Given `submit` rejects, when submitted, then an alert shows the message and fields are editable again.
- Given success, when rendered, then a status sentence replaces the buttons and `onResolved` was called once.
