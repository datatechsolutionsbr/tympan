# Calendar

Wave 5 · forms · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
A month grid for picking a date or a date range directly on the page (booking panels, report periods, scheduling). Also the grid used inside DateField and DateRangeField popovers, now exported.

## Anatomy
- **Header**: previous-period button, month and year title (or month and year pickers), next-period button.
- **Month grid(s)**: weekday header row, optional week-number column, day cells.
- **Day cell** states: today, selected, range start, range middle, range end, outside the visible month, unavailable, disabled, focused.
- **Footer** slot (optional): host content such as presets ("Last 7 days") or a note.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| mode | 'single' \| 'range' | 'single' | Single date or start-to-end range. |
| value / defaultValue / onChange | date, or { start; end } in range mode | null | Selection. Dates are calendar dates without time or time zone. |
| minValue / maxValue | date | none | Days outside are disabled and navigation stops at their months. |
| isDateUnavailable | (date) => boolean | none | Marks days that cannot be chosen (booked, holidays). |
| allowsNonContiguousRanges | boolean | false | Range mode: allow a range that spans unavailable days (they are excluded, not selected). |
| visibleMonths | 1 \| 2 \| 3 | 1 | Months shown side by side; paging moves by the whole set. |
| pageBehavior | 'visible' \| 'single' | 'visible' | Paging moves by the visible set or by one month. |
| headerMode | 'title' \| 'pickers' | 'title' | Title text, or month and year pickers (ListboxSelect) for far jumps. |
| showWeekNumbers | boolean | false | Adds an ISO or locale week-number column. |
| firstDayOfWeek | weekday | from locale | Overrides the locale. |
| showOutsideDays | boolean | true | Shows days of neighbouring months in the grid (not selectable when `visibleMonths` > 1). |
| focusedValue / onFocusChange | date | today or selection | Which day holds focus and which month shows. |
| renderDay | (date, state) => node | none | Adds content under the day number (a price, a dot). Must not replace the number. |
| footer | node | none | Footer slot. |
| label | string | required | Accessible name of the calendar. |
| disabled / readOnly / errorMessage | — | — | Standard states. |

## States
Idle, day focused, single selected, range selecting (start chosen, hovering or moving over candidate end), range selected, invalid (selection hits an unavailable day), disabled, read-only.

## Keyboard and ARIA
- RAC `Calendar` and `RangeCalendar` (`CalendarGrid`, `CalendarCell`, `CalendarHeading`); APG **Date Picker Dialog** grid behaviour.
- The grid is a `grid` labelled by the calendar label plus the visible month(s); day cells are buttons with full date names ("Monday, 3 March 2026") and `aria-selected`; today is marked with `aria-current="date"`.
- Arrows move by day and week (horizontal follows reading direction); Page Up and Page Down move by month; Shift with Page Up and Page Down by year; Home and End go to the week's start and end.
- Enter or Space selects. In range mode the first selection sets the start, focus movement previews the range, and the second selection sets the end (earlier end dates swap).
- Escape during range selection cancels the pending start.
- Previous and next buttons have names that include the target month; they are disabled at `minValue` and `maxValue`.
- A live region announces the new month when paging.

## Responsive, touch, motion, forced colours
- Day cells are at least `--ty-control-target` on touch; when two or three months do not fit, they stack vertically below the small breakpoint.
- Today: outline in `--ty-line-strong` plus weight; selected: `--ty-accent` with `--ty-on-cta` text; range middle: `--ty-accent-soft`; unavailable: `--ty-ink-3` with a strike-through (never colour alone).
- Month change slides only when motion is allowed, with `--ty-dur-base` and `--ty-ease-out`; under reduced motion it swaps instantly.
- Forced colours: selected days in `Highlight` / `HighlightText`, today with a `CanvasText` outline, unavailable in `GrayText` plus strike-through.

## Acceptance tests
- Given focus on 10 March, when Arrow Down is pressed, then 17 March is focused.
- Given focus on 31 January, when Page Down is pressed, then the last day of February is focused and the heading reads February.
- Given range mode, when 5 and then 2 are selected, then the range is 2 to 5.
- Given range mode with the start chosen, when Escape is pressed, then no start is kept.
- Given `isDateUnavailable` for Sundays, when a Sunday is activated, then nothing is selected and the cell is announced as unavailable.
- Given a range across an unavailable day and `allowsNonContiguousRanges` false, then the range is invalid and `errorMessage` shows.
- Given `visibleMonths` 2, then two grids show consecutive months and Next moves by two months (or one with `pageBehavior="single"`).
- Given `maxValue` in April, then Next is disabled while April is visible.
- Given `headerMode="pickers"`, when a year is chosen from the year picker, then the grid shows that year and focus stays in the picker.
- Given `showWeekNumbers`, then each row starts with a non-interactive week number.
- Given a Portuguese locale, then weekday names and the first day of the week follow that locale.
