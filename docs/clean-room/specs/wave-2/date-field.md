# DateField

Wave 2 · form · Status: specified

## Purpose
Choose a single calendar date from a trigger that opens a calendar, with a quick switch to a month-and-year view for distant dates.

## Anatomy
- Trigger: calendar glyph and the formatted date (long, localised) or a placeholder.
- Popover with two views:
  - Day view: previous-month control, month-and-year heading (activates the month view), next-month control, weekday header row, day grid, "Today" shortcut.
  - Month view: previous-year control, year heading, next-year control, grid of twelve months, row of recent years for quick jumping, "Back to days" action.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | Date or null | required | Selected date. |
| onChange | (date: Date or null) => void | required | Called when a day is chosen. |
| label | string | required | Accessible (and optionally visible) label. |
| placeholder | string | host i18n "Select a date" | Trigger text when empty. |
| minValue | Date | none | Earliest selectable date. |
| maxValue | Date | none | Latest selectable date. |
| disallowFuture | boolean | false | Shorthand for maxValue = today. |
| yearRange | { from: number; to: number } | a decade back to a few years ahead, clamped by min/max | Years offered in the quick-jump row. |
| locale | string | from I18nAdapter | Month names, weekday names, first day of week and date format. |
| isInvalid, errorText, disabled | as in TextField | none | Standard field wiring. |

## Behaviour
- Opening always shows the month of the current value, or of today, in day view.
- Choosing a day reports it and closes the popover; focus returns to the trigger.
- Today's date is marked (outline and a hidden "today" word), distinct from the selected date.
- In month view, choosing a month returns to day view on that month; year controls and year chips change the viewed year only.
- Dates, months and years outside the allowed range are shown but not selectable.

## States
Trigger: empty, filled, focus-visible, open, invalid, disabled. Cells: rest, hover, focus-visible, selected, today, outside range (disabled), outside current month.

## Keyboard and ARIA
- APG pattern: Date Picker Dialog (Dialog + Grid). Backed by RAC `DatePicker` with `Dialog` and `Calendar` (day view). The month view is a custom RAC `Dialog` panel with a `GridList` of months.
- Day grid: arrows move by day and week, Home/End to week start/end, PageUp/PageDown by month, Shift+PageUp/PageDown by year, Enter or Space selects, Escape closes without change.
- Navigation controls have names such as "Previous month", "Next year".
- The heading is a live region so month changes are announced.

## Responsive, touch, motion, forced colours
- Day cells and controls at least 44 × 44 on touch; the popover becomes a bottom drawer below 640.
- Popover open: opacity at `--fk-dur-quick`; none with reduced motion.
- Reduced transparency: opaque popover.
- Forced colours: selected day uses system highlight; today keeps a visible outline; disabled days use GrayText.

## Acceptance tests
- Given value 2026-03-10, When opened, Then March 2026 is shown with the 10th selected.
- Given the day view, When a day is chosen, Then onChange receives that date and the popover closes.
- Given focus on a day, When ArrowRight is pressed, Then focus moves to the next day, crossing month boundaries.
- Given disallowFuture, When the calendar shows the current month, Then days after today are disabled and future months are disabled in month view.
- Given the heading is activated, When a month is chosen, Then day view shows that month.
- Given "Today" is activated, Then onChange receives today (unless today is outside range, in which case the shortcut is disabled).
- Given a reopen after navigating away, Then the view resets to the value's month.

## Open questions
- The fork's calendar used plain toggle buttons without grid navigation; this spec requires the APG grid keyboard model.
