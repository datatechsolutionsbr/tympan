# ChoiceGrid

Wave 2 · form · Status: specified

## Purpose
A titled grid of mutually exclusive options (currency, country, theme) where each option is a short label with a leading symbol.

## Anatomy
- Header: icon and title (acts as the group label).
- Grid of option cells (2, 3 or 4 columns). Each cell: leading symbol (flag, emoji or glyph) and label.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | string | required | Visible title and group name. |
| icon | Icon | none | Decorative header glyph. |
| options | { value: string; symbol?: string; label: string }[] | required | Choices. Symbols are decorative. |
| value | string | required | Selected value. |
| onChange | (value: string) => void | required | Called when a different option is chosen. |
| columns | 2, 3 or 4 | 2 | Columns at wide widths. |
| arrangement | "inline" or "stacked" | "inline" | Inline: symbol before label. Stacked: symbol above a centred label. |
| busy | boolean | false | While true, options are not operable and the group reports busy. |

## States
Option rest, hover, focus-visible, selected (accent-soft fill, accent border and check), busy (all options disabled, group `aria-busy`).

## Keyboard and ARIA
- APG pattern: Radio Group. Backed by RAC `RadioGroup` with custom-rendered `Radio` cells; the title is the group label.
- Arrow keys move focus and selection (in reading order across the grid), Tab enters on the selected option and leaves the group.
- Flag or emoji symbols are hidden from assistive technology; the label carries the meaning.

## Responsive, touch, motion, forced colours
- Below 640, columns collapse to at most 2.
- Every cell at least 44 × 44.
- No motion besides colour change.
- Forced colours: selected cell uses system-highlight border and the check glyph.

## Acceptance tests
- Given options BRL, USD, EUR with BRL selected, When rendered, Then a radio group named by the title has three radios and BRL is checked.
- Given focus on BRL, When ArrowRight is pressed, Then onChange receives "USD".
- Given busy=true, When the person clicks EUR, Then onChange is not called and the group reports busy.
- Given arrangement "stacked", When rendered, Then each symbol appears above its label.
- Given a symbol that is an emoji flag, When the accessibility tree is inspected, Then the flag is not announced.

## Open questions
- The fork rendered independent buttons without radio semantics; this spec requires Radio Group semantics.
