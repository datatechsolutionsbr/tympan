# DateRangeField

Wave 5 · forms · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Enter a start and end date, by typing into segmented date inputs or by picking in a Calendar popover. The range counterpart of DateField.

## Anatomy
- **Label**, optional **hint**, optional **error message**.
- **Group** holding two segmented date inputs (start, end) separated by a dash, and a **calendar button** at the end.
- **Popover** with a Calendar in `range` mode, optional **preset list** beside or above it, optional **apply and cancel** actions.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label | string | required | Field name. |
| value / defaultValue / onChange | { start; end } \| null | null | Calendar dates without time. |
| minValue / maxValue / isDateUnavailable | as Calendar | none | Constraints. |
| maxDays | number | none | Longest allowed range; longer ranges are invalid. |
| presets | { id; label; range }[] | none | Quick choices shown in the popover. |
| confirmation | 'immediate' \| 'apply' | 'immediate' | Immediate: the second pick commits and closes. Apply: the picks are a draft until Apply; Cancel restores. |
| visibleMonths | 1 \| 2 | 2 on wide screens, 1 on narrow | Months in the popover. |
| startName / endName | string | none | Form field names. |
| required / disabled / readOnly / errorMessage / hint | — | — | Standard states. |
| locale | string | from provider | Segment order and names. |

## States
Empty, partial (one side filled), complete, invalid (end before start, over `maxDays`, unavailable day inside, outside bounds), popover open, draft (apply mode), disabled, read-only.

## Keyboard and ARIA
- RAC `DateRangePicker` with two `DateInput`s, `Button`, `Popover`, `Dialog` and `RangeCalendar`; APG **Date Picker Dialog**.
- The group is named by the label; each input is named "Start date" and "End date" (from i18n) plus the label.
- Segments: typing fills and advances; Arrow Up and Down change the segment; Backspace clears it; Arrow Left and Right move between segments and across the two inputs.
- Alt+Arrow Down (and the calendar button) opens the popover; focus moves into the calendar on the start date (or today).
- In the popover, Escape closes and returns focus to the calendar button, discarding a draft.
- Presets are a list of buttons before the calendar in the tab order; choosing one sets the range (and closes in immediate mode).
- Errors are linked by `aria-describedby` and announced.

## Responsive, touch, motion, forced colours
- Below the small breakpoint the popover opens as a bottom Drawer with one month and the presets as a horizontal chip row.
- Segment and button hit areas meet `--ty-control-target`.
- Tokens as DateField and Calendar; popover `--ty-surface-raised-solid`, `--ty-shadow-floating`.
- Opening uses opacity with `--ty-dur-quick`, zero under reduced motion.
- Forced colours as Calendar; the group border in `CanvasText`.

## Acceptance tests
- Given an empty field, when "01032026" is typed into the start input (day-month-year locale), then the start is 1 March 2026 and focus moves to the end input.
- Given start 10 March and end 5 March typed, then the field is invalid with the "end before start" message.
- Given `maxDays` 31 and a 40-day range, then the field is invalid.
- Given the popover open in immediate mode, when two days are picked, then `onChange` fires with the range and the popover closes.
- Given apply mode, when two days are picked and Cancel is pressed, then the value is unchanged.
- Given a preset "Last 7 days", when chosen, then the range ends today and starts six days earlier.
- Given the popover open, when Escape is pressed, then focus returns to the calendar button.
- Given a narrow viewport, when the popover opens, then it is a Drawer with one month.
- Given `startName` and `endName`, when the form submits, then both dates are sent in ISO format.
