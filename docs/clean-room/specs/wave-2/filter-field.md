# FilterField

Wave 2 · form · Status: specified

## Purpose
A single-line text field that narrows a list or table on the same page as the person types.

## Anatomy
- Optional visible label, placed above the field (design direction §2.10).
- Field container with a leading search glyph (decorative).
- Text entry area with placeholder hint.
- Optional clear control, shown only when the field has text.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | string | required | Current filter text (controlled). |
| onChange | (value: string) => void | required | Fired on every edit, including clear. |
| label | string | none | Visible label. When absent, `placeholder` is not enough: an accessible name must still be supplied through `ariaLabel`. |
| ariaLabel | string | none | Accessible name when there is no visible label. |
| placeholder | string | none | Example of what can be typed; never the only name. |
| clearLabel | string | host i18n "Clear filter" | Accessible name of the clear control. |
| resultCountText | string | none | Optional live text such as "12 results", announced politely after typing pauses. |

## States
- Empty, filled (clear control visible), focus-visible, disabled, read-only.
- Hover changes only the border strength of the field (§2.3 line tokens).

## Keyboard and ARIA
- APG pattern: none specific; follows the native text input. Backed by RAC `SearchField` (which provides the clear button and Escape-to-clear).
- Role: searchbox. Escape clears the text when non-empty; a second Escape does nothing further (lets an enclosing overlay close).
- The clear control is a real button, reachable by pointer; keyboard users use Escape (RAC default excludes it from tab order, which is acceptable).
- `resultCountText` lives in a polite live region outside the field, debounced so each keystroke is not announced.

## Responsive, touch, motion, forced colours
- Field height follows §2.10 (40 on desktop, 44 below 1024); the clear control has a 44 × 44 hit area.
- Full width of its container on small screens.
- No motion besides colour change; nothing to reduce.
- Reduced transparency: the field background becomes opaque surface.
- Forced colours: field border drawn in system border colour; the search glyph uses the text colour.

## Acceptance tests
- Given a filter field with label "Filter members", When rendered, Then a searchbox named "Filter members" exists.
- Given no label and ariaLabel "Filter", When rendered, Then the searchbox is named "Filter" and the placeholder is not used as the name.
- Given the value "ana", When the person presses Escape, Then onChange is called with "".
- Given the value "", When rendered, Then no clear control is shown.
- Given resultCountText changes to "3 results", When typing pauses, Then a polite live region contains "3 results".
- Given a touch viewport, When measuring the clear control, Then its hit area is at least 44 × 44 px.

## Open questions
- The fork used the placeholder as the fallback accessible name; this spec requires a real name instead.
