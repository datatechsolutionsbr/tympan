# StatStrip

Wave 4 · data display · Status: specified

Written by the implementer from the overview storyboard and design direction
§2.2, §2.5, §3.5. No fork counterpart.

## Purpose
A row of headline numbers with their labels, separated by hairlines, with no
cards: "94 registros · 512 provadas · 145 pendentes · 7 refutadas".

## Anatomy
- **Item**: value (serif, tabular), label (`label`), optional detail (`meta`),
  optional proof or tone marker (icon and word, never colour alone), optional
  link (every number links to the view that produces it, §3.5).
- **Hairline** between items (a border, not a separator role).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| items | Array<{ id; value: number \| string; label; detail?; href?; proof?: ProofState; format?: Intl.NumberFormatOptions }> | required | Stats. |
| label | string | required | Name of the group. |
| locale | string | adapter | Number formatting. |

## Keyboard and ARIA
- A description list (`dl`) labelled by `label`: term = label, definition =
  value then detail. Linked values are links whose name is "value label".
- Proof markers are ProofBadge `inline`.

## Responsive, touch, motion, forced colours
- Wraps to two columns below 640 px, keeping the hairlines between items in
  the same row only.
- No motion. Forced colours: hairlines in `CanvasText`.

## Acceptance tests
- Given three items, then a description list with three terms and three values is rendered, labelled by `label`.
- Given 1234 and locale pt-BR, then the value reads "1.234".
- Given an href, then the value is a link named with value and label.
- Given a proof state, then the word of the state is present.
