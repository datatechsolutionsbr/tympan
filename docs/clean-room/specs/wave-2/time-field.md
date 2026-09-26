# TimeField

Wave 2 · form · Status: specified

## Purpose
Enter a time of day (hours and minutes, 24-hour) from a trigger that opens a small editor with a confirm action.

## Anatomy
- Trigger: clock glyph and the time as two-digit hours and minutes, or a placeholder.
- Popover: title, hours entry, separator, minutes entry, a message area for range errors, confirm button.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | { hours: number; minutes: number } or null | required | Current time. |
| onChange | (time) => void | required | Called only on confirm. |
| label | string | required | Accessible name of the field. |
| placeholder | string | host i18n "Select a time" | Trigger text when empty. |
| referenceDate | Date or null | none | The date this time belongs to. |
| disallowFuture | boolean | false | When true and `referenceDate` is today, times after now cannot be confirmed. |
| minuteStep | number | 1 | Granularity for arrow-key stepping. |
| disabled, isInvalid, errorText | as in TextField | none | Standard wiring. |

## Behaviour
- Opening seeds the draft from the value (or midnight) and places focus in the hours entry with its text selected.
- Entries accept digits only; hours clamp to the range of a day and minutes to the range of an hour; clearing an entry means zero.
- Enter in either entry confirms. Confirm is blocked, with a visible message, when the draft is in the future under `disallowFuture` on today.
- Escape discards the draft and closes; focus returns to the trigger.

## States
Trigger: empty, filled, focus-visible, open, disabled, invalid. Editor: valid draft, future-blocked draft (confirm disabled plus message).

## Keyboard and ARIA
- APG pattern: Dialog (non-modal popover) containing Spinbutton segments. Backed by RAC `TimeField` (segments are spinbuttons: ArrowUp/Down change the value, typing digits fills them, Tab moves between segments) inside a RAC `DialogTrigger` + `Popover`; or RAC `TimeField` inline without the popover where space allows.
- Each segment is labelled "Hours" and "Minutes". The blocked message is linked to the confirm button and announced politely.

## Responsive, touch, motion, forced colours
- Segments and confirm button at least 44 × 44; numeric keypad requested on mobile.
- Popover opacity at `--fk-dur-quick`, none with reduced motion; drawer below 640.
- Forced colours: focused segment uses system highlight.

## Acceptance tests
- Given value 9:05, When rendered, Then the trigger shows "09:05".
- Given the editor is open with no value, Then the draft is 00:00 and focus is in hours.
- Given "30" is typed in hours, Then the draft hours clamp to 23; "75" in minutes clamps to 59.
- Given letters are typed, Then they are ignored.
- Given Enter in minutes, Then onChange receives the draft and the popover closes.
- Given disallowFuture, referenceDate today and a draft one hour ahead, When confirm is pressed, Then nothing is reported and the message is shown.
- Given referenceDate is another day, Then future times are allowed.
