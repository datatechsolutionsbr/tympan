# DataTable

Wave 1 · data display · Status: specified

## Purpose
Show records as rows and attributes as columns, with sorting, optional row selection, row navigation, loading and empty states, in three densities.

## Anatomy
- **Scroll container**: horizontal scroll when columns exceed the width.
- **Header row**: column headers; sortable headers carry a sort button and direction indicator.
- **Body rows**: cells; optional leading selection checkbox; optional row link.
- **Sticky parts**: header row (vertical scroll) and first column (horizontal scroll).
- **Loading rows**: skeleton rows shaped like real rows.
- **Empty row**: one full-width cell holding an EmptyState.
- **Caption**: visible or visually hidden table name.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| caption | string | required | accessible name of the table |
| columns | Array<{ id; header: node; sortable?: boolean; align?: 'start' \| 'end'; numeric?: boolean }> | required | column definitions; numeric implies end alignment and tabular figures |
| rows | Array<{ id: string; cells: Record<columnId, node>; href?: string; label?: string }> | required | data; `label` names the row link |
| density | 'comfortable' \| 'standard' \| 'compact' | per screen | row height and cell padding (see below) |
| sortColumn / sortDirection | string / 'ascending' \| 'descending' \| null | none | current sort |
| onSortChange | (column: string, direction: 'ascending' \| 'descending' \| null) => void | none | sort cycle: none, ascending, descending, none |
| selectionMode | 'none' \| 'multiple' | 'none' | adds a checkbox column and a select-all header checkbox |
| selectedKeys / onSelectionChange | Set<string> / (keys) => void | empty | selected rows |
| loading | boolean | false | show skeleton rows instead of data |
| loadingRowCount | number | page size | number of skeleton rows |
| emptyState | node | EmptyState with a default message | shown when not loading and rows are empty |
| stickyFirstColumn | boolean | true | keep the record name visible while scrolling horizontally |
| showColumnLines | boolean | false | vertical dividers between columns |
| onRowAction | (id: string) => void | none | row activation when there is no href |

Densities (design direction §2.9): **comfortable** row 52 px, cell padding 14 × 16, text 14/22; **standard** row 44 px, padding 10 × 14, text 14/20; **compact** row 36 px, padding 6 × 12, text 13/18. The person's preferred density is stored per device by the host.

## States
- row: idle, hover, focus-visible, selected, pressed (when actionable).
- header: sortable idle, hover, focus-visible, sorted ascending, sorted descending.
- table: loading (`aria-busy`), empty, filled.
- Cells never wrap beyond two lines; overflow shows an ellipsis and the full value on hover and to assistive tech.

## Keyboard and ARIA
- APG pattern: **Table** for read-only data; **Grid** when rows are selectable or actionable. RAC primitive: `Table`, `TableHeader`, `Column` (with `allowsSorting`), `TableBody`, `Row`, `Cell`, `Checkbox` slots for selection, `renderEmptyState` for the empty row.
- Sortable headers expose `aria-sort` on the column; activation by Enter/Space on the header button.
- Header cells have column scope; the first cell of each row is a row header.
- Grid mode: Arrow keys move between cells, Home/End within a row, Ctrl+Home/End to corners, Space toggles selection, Enter activates the row (navigates to `href` or calls `onRowAction`). One tab stop for the grid.
- Row links: the whole row is the target, but only one link per row is in the tab order and it is named by `label`.
- Loading state announces a polite status message ("Loading the list") supplied by the host.

## Responsive, touch, motion, forced colours
- Below 1024 px the compact density is not used for touch-first layouts unless each control keeps a 44 × 44 px hit area (§2.10); checkboxes always have a 44 px hit area.
- Header uses `--fk-surface-sunken`, `label` type style, no forced upper case, and stays fixed while scrolling (§2.9). Rows are separated by `--fk-line` dividers, never zebra stripes.
- Selected rows use `--fk-accent-soft`; focused rows use an inset focus ring (§2.6).
- No entrance animations for rows; skeleton pulse stops with reduced motion (§2.12).
- Forced colours: dividers, focus ring and selected state remain visible via system colours.

## Acceptance tests
- Given a caption and three columns, Then a table named by the caption has three column headers.
- Given a sortable column not sorted, When its header is activated three times, Then `onSortChange` receives ascending, descending, then null.
- Given the table sorted descending by Date, Then that column has `aria-sort="descending"` and no other column has an aria-sort other than none.
- Given `loading`, Then skeleton rows render with the density's row height, the table is `aria-busy`, and no data rows are present.
- Given no rows and not loading, Then the empty state is visible inside a single cell spanning all columns.
- Given multiple selection, When the header checkbox is activated, Then all rows are selected; When one row is then deselected, Then the header checkbox is indeterminate.
- Given a row with `href`, When Enter is pressed on the focused row, Then the host navigates to it.
- Given density compact, Then row height is 36 px; comfortable, 52 px.
- Given horizontal scroll, Then the first column remains visible.
