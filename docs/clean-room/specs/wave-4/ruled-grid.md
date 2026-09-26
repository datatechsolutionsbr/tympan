# RuledGrid (RuledGrid, RuledGridRow, RuledGridCell)

Wave 4 · layout · Status: specified

## Purpose
A layout grid whose rows and cells are separated by hairline rules instead of card borders, with optional small cross marks where rules meet. It frames logos, figures or short facts on public pages without putting each item in a card, following design direction §2.5 ("the rest is a divider").

## Anatomy
- **RuledGrid**: vertical stack of rows, each separated by a horizontal rule in `--fk-line`.
- **RuledGridRow**: a row of cells laid out on a column template supplied by the host; vertical rules between cells.
- **RuledGridCell**: one cell; padding from the spacing scale of §2.1.
- **Intersection marks** (optional): a small cross drawn in `--fk-line-strong` at each point where a horizontal and a vertical rule meet, and at the outer corners.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| marks (grid) | boolean | false | Draw intersection marks. |
| outerRules (grid) | boolean | true | Draw rules along the outer edges too. |
| columns (row) | number or template | auto-fit | Column template for this row. |
| as (row, cell) | element name | row: div; cell: div | Allows list semantics (list and listitem) when cells are a list. |
| children | node | required | Rows or cells. |

## States
Static layout only.

## Keyboard and ARIA
- No roles by default; the host can pass `as` so the grid is a list of items. Rules and marks are drawn decoratively and are not in the accessibility tree.
- Nothing focusable except the cells' own content.

## Responsive, touch, motion, forced colours
- Below 640 each row collapses to one column; vertical rules become horizontal rules between stacked cells; marks follow the new intersections or are hidden if they would crowd (host choice through `marks`).
- No motion.
- Forced colours: rules draw in `CanvasText`; marks are dropped (rules alone carry the structure).

## Acceptance tests
- Given two rows of three cells with marks, when rendered at wide width, then rules separate rows and cells and marks appear at each inner intersection and the corners.
- Given a phone width, when rendered, then each row is a single column and no horizontal scroll occurs.
- Given `as` list on the row and listitem on cells, when inspected, then assistive technology announces a list with three items.
- Given forced colours, when rendered, then the rules are visible and the marks are not.
