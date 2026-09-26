# StatTile

Wave 2 · data display · Status: specified

## Purpose
A single headline figure with its label, used in a small row of summary figures; optionally acts as a filter toggle for the content below it.

## Anatomy
- **Tile**: card at elevation level 2 (§2.5); a tile exists only when it is interactive or when it heads a section, never as a row of identical decorative cards (design direction Phase 3).
- **Icon**: small leading icon (lucide, §4.4).
- **Value**: the figure, serif `h2`-scale per §2.2 (KPI main number), tabular numerals.
- **Label**: what the figure counts.
- **Qualifier** (optional): pill with a short period or scope (for example the month).
- **Explain button** (optional): opens a Popover describing how the figure was computed (query, source).
- **Filter marker** (optional): the word "filtered" when the figure reflects active filters.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | string or number | required | Figure (already formatted by the host or via Formatters). |
| label | string | required | What is counted. |
| icon | node | undefined | Leading icon. |
| qualifier | string | undefined | Period or scope pill. |
| explanation | `{ title?: string; body?: string; blocks?: { label: string; text: string }[] }` | undefined | Content of the explain popover; blocks render in mono. |
| tone | `'neutral' \| 'attention'` | `'neutral'` | `attention` marks a figure needing action (pending semantic colour plus an icon and word, §2.3). |
| filtered | boolean | false | Shows the filter marker. |
| selected | boolean | false | Pressed state when used as a filter toggle. |
| onPress | `() => void` | undefined | Makes the tile a toggle button. |
| live | boolean | false | Announce value changes politely. |

## States
- Static; interactive (hover, focus-visible, pressed/selected); attention; filtered; live-updating.

## Keyboard and ARIA
- With `onPress`: the tile is a toggle button (RAC `ToggleButton`, APG Button pattern) with `aria-pressed` equal to `selected`; name = label plus value.
- Without `onPress`: plain group; not a live region unless `live`.
- The explain button is a separate focusable control (RAC `DialogTrigger` + `Popover`), never nested inside the toggle button; place it beside it.
- `live`: the value alone is wrapped in a polite, atomic live region.

## Responsive, touch, motion, forced colours
- Whole tile is the target (≥ 44 px). Selected state shown by accent border and a check or close icon, not colour fill alone.
- No lift on hover (§2.7). No animated gradient.
- Forced colours: selected tile gets a thicker system-colour border.

## Acceptance tests
- Given `onPress`, when the tile is activated with Enter, then `onPress` fires and the tile exposes `aria-pressed`.
- Given `selected`, when rendered, then `aria-pressed` is true and a non-colour indicator is visible.
- Given `explanation`, when the explain button is activated, then a popover with the title and blocks opens and Esc closes it returning focus.
- Given `live` and the value changes, when observed by a screen reader, then the new value is announced once.
- Given `filtered`, when rendered, then the word "filtered" (from i18n) is visible.

## Open questions
- The fork puts an interactive popover trigger inside a clickable container with a status role; this spec separates them.
