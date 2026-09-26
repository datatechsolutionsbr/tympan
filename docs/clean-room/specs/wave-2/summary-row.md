# SummaryRow

Wave 2 · data display · Status: specified

## Purpose
The presentational core shared by rows and cards: an icon tile, a title, an optional subtitle and a wrap-around line of short label and value pairs.

## Anatomy
- **Icon tile**: a fixed square tile holding a decorative icon.
- **Title**: one line, truncated with an ellipsis; full text available as a tooltip or title.
- **Subtitle**: one line in `meta` style (§2.2), truncated.
- **Metadata line**: pairs of label (in `meta`) and value (in `meta`, weight 600), wrapping onto more lines as needed.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | ReactNode | required | Main text. |
| subtitle | ReactNode | none | Secondary text. |
| icon | ReactNode | none | Decorative icon; the tile is omitted when absent. |
| metadata | { label: string; value: ReactNode }[] | [] | Pairs. |
| titleLevel | 'none' \| 3 \| 4 | 'none' | Renders the title as a heading when the row starts a section. |
| iconTone | 'accent' \| 'neutral' | 'neutral' | Tile background from §2.3 (`--fk-accent-soft` or `--fk-surface-sunken`). |

Styling overrides per part are not part of the API; appearance comes from tokens.

## States
Static only. Truncated state exposes the full text.

## Keyboard and ARIA
- No interactive parts; no RAC primitive (plain content).
- Metadata is a description list: each label is a term and each value its definition, so screen readers read "Status: open".
- The icon tile is hidden from assistive technology.
- Truncated text keeps its full value in the accessibility tree (truncation is visual only).

## Responsive, touch, motion, forced colours
- The text column shrinks before the icon; nothing overflows horizontally at 320 wide.
- Numbers in values use tabular figures (§2.2).
- No motion. Forced colours: the tile keeps a border so it is not lost.

## Acceptance tests
- Given metadata with two pairs, then a description list with two terms and two definitions is exposed.
- Given a title longer than the width, then it shows on one line with an ellipsis and the full title is readable by a screen reader.
- Given no icon, then no empty tile is rendered.
- Given `titleLevel` 3, then the title is a level-3 heading.
