# MonthField

Wave 2 · form · Status: specified

## Purpose
Pick one month (year and month) from those for which data exists, typically to choose a reporting period.

## Anatomy
- Trigger: calendar glyph and the long month-and-year text, or a placeholder; the caller may replace the trigger content (card-style trigger).
- Popover: previous-year control, year heading, next-year control, grid of twelve months, optional row of year chips (only when data spans more than one year).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | string ("YYYY-MM") | required | Selected month, "" for none. |
| onChange | (value: string) => void | required | Called when an available month is chosen. |
| availableMonths | string[] ("YYYY-MM") | required | Months that can be chosen. |
| label | string | required | Accessible name. |
| placeholder | string | host i18n "Select a month" | Trigger text when empty. |
| triggerContent | node | none | Replaces the default trigger content; the accessible name still comes from `label` plus the value. |
| embedded | boolean | false | Trigger without its own border, for use inside a composite bar. |
| placement | "top", "right", "bottom", "left" | "bottom" | Preferred side; flips when space is short. |

## Behaviour
- The popover opens on the year of the value, else the newest year with data, else the current year.
- Months not in `availableMonths` are shown but disabled.
- Year controls are disabled when there is no data in that direction. Year chips list data years newest first.
- Choosing a month reports "YYYY-MM" and closes; focus returns to the trigger.

## States
Trigger: empty, filled, focus-visible, open. Month cell: available, unavailable, selected, focus-visible. Year chip: current, other.

## Keyboard and ARIA
- APG pattern: Dialog (popover) containing a Grid. Backed by RAC `DialogTrigger` + `Popover` with a RAC `GridList` (layout grid) for months: arrows move, Enter selects, PageUp/PageDown change year, Escape closes.
- Year controls are buttons named "Previous year" / "Next year"; the year heading is a live region.

## Responsive, touch, motion, forced colours
- Cells, chips and controls at least 44 × 44; drawer below 640.
- Opacity-only opening at `--fk-dur-quick`; none with reduced motion.
- Forced colours: selected month uses system highlight; unavailable months use GrayText.

## Acceptance tests
- Given no value, When rendered, Then the placeholder is shown.
- Given value "2026-03", When rendered, Then the trigger shows the localised "March 2026".
- Given available months only in 2025 and 2026, When opened with no value, Then 2026 is shown and months without data are disabled.
- Given an available month is chosen, Then onChange receives its "YYYY-MM" and the popover closes.
- Given the viewed year is the oldest with data, Then "Previous year" is disabled.
- Given data in a single year, Then no year chips are shown.
