# ListPanel

Wave 2 · data display · Status: specified

## Purpose
A surface that stacks rows separated by dividers, for short lists inside a page (settings entries, feed entries, recent activity), where each row has leading, main and trailing content and may be activatable.

## Anatomy
- **Panel**: a surface (§2.5 level 1 or 2) with dividers between rows (§2.3 `--fk-line`).
- **Row**: leading slot (icon, avatar), main content, trailing slot (tag, value, chevron).
- **Feed entry**: a variant row used in activity feeds, rendered as a list item of an ordered or unordered list.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| children | ListPanelRow[] | required | Rows. |
| elevation | 'sheet' \| 'raised' | 'sheet' | Surface level. |
| label | string | none | Accessible name for the list. |
| as | 'list' \| 'feed' | 'list' | `feed` exposes the APG Feed semantics for long, streaming lists. |
| Row.leading | ReactNode | none | Leading visual. |
| Row.trailing | ReactNode | none | Trailing visual or secondary control. |
| Row.onAction | () => void | none | Makes the row activatable. |
| Row.href | string | none | Makes the row a link (through the RouterAdapter link). |
| Row.disabled | boolean | false | Not operable. |

## States
Row rest, hover (tint only, no lift, §2.7), pressed, focus-visible (inner ring, §2.6), disabled.

## Keyboard and ARIA
- Static rows: a list with list items.
- Activatable rows: RAC `GridList` (APG Grid pattern for interactive lists) when rows have secondary controls; otherwise each row is a single `Link` or `Button` filling the row. Enter activates; arrow keys move between rows in the GridList form.
- Feed form: APG Feed pattern (`role=feed`, each item an `article` with `aria-posinset` and `aria-setsize`); Page Down / Page Up move between articles.
- A trailing control inside an activatable row is its own focus stop; activating it does not also activate the row.

## Responsive, touch, motion, forced colours
- Activatable rows are at least 44 px tall.
- Press feedback is a background change only; no scale. Reduced motion: no transition.
- Optional haptic on activation, never required.
- Forced colours: dividers and focus ring use system colours; hover is not the only cue.

## Acceptance tests
- Given three static rows, then a list with three items is exposed and no row is focusable.
- Given a row with `onAction`, when the user focuses it and presses Enter, then `onAction` fires once.
- Given a row with `onAction` and a trailing button, when the trailing button is activated, then only the trailing handler fires.
- Given `as` 'feed' with 20 entries, then each entry reports its position and the set size.
- Given axe, then no violations in any state.

## Open questions
- In the fork an activatable row is a plain element with a click handler and no role or keyboard support; the new component must expose it as a button, link or grid row.
