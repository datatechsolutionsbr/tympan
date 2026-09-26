# DataSourceNodeForm

Wave 3 · form · Status: specified

## Purpose
Configure a node that reads rows from a connected data source: pick the connection, the table, the columns, optional filters, the output variable and a row limit.

## Anatomy
Presented inside a SectionedModal with a section rail:
1. Connection: tiles for each available connection (name, dialect word, generic database icon).
2. Table: search field plus a list of tables of the chosen connection.
3. Columns: count "n of m selected", select-all / clear-all toggle, search field, list of columns each with a checkbox, name and a type Tag.
4. Filters: rows of column picker, operator picker, value field and remove action; an "add filter" action.
5. Output: output variable name, row limit, and a read-only summary (connection, table, columns, filter count).
- Dialog header: connection name (or generic title) and "dialect · table" subtitle.
- Footer: cancel and save (save enabled only with connection, table and at least one column).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| open | `boolean` | required | Dialog visibility. |
| value | `DataSourceNodeConfig` | required | `{ sourceId, dialect, table, columns[], filters[], outputVariable, limit }`. |
| sources | `{ id; name; dialect }[]` | required | Available connections. |
| loadTables | `(sourceId) => Promise<string[]>` | required | Host fetch. |
| loadColumns | `(sourceId, table) => Promise<{ name; type; nullable? }[]>` | required | Host fetch. |
| readOnly | `boolean` | false | View-only; no footer; pickers disabled except the current choice. |
| onSave / onCancel | callbacks | required | Save emits the cleaned config. |
| labels | `DataSourceNodeFormLabels` | from i18n adapter | All strings. |

Filter operators (concepts): equals, not equals, less than, at most, greater than, at least, pattern match, member of list. "Member of list" takes a comma-separated value stored as a list; switching to it wraps a single value; switching away keeps the first element. Values may be references to flow inputs.

## States
- Changing connection clears table, columns and filters; changing table clears columns and filters.
- Loading tables or columns: skeleton rows inside the section; load failure: inline danger notice with retry.
- Picking a connection advances to Table; picking a table advances to Columns.
- Legacy filter map (variable → column) is converted on load into equals rows, and the legacy key is removed on save.
- Filters with no column are dropped on save.

## Keyboard and ARIA
- Section rail follows APG Tabs (vertical); RAC `Tabs` with `orientation="vertical"`.
- Connection tiles: APG Radio Group (RAC `RadioGroup`). Tables: APG Listbox single select (RAC `ListBox`). Columns: APG Listbox multi-select or checkbox group (RAC `CheckboxGroup`), each item exposing checked state and type in its description.
- Search fields filter their list and announce "n results" politely.
- Filter rows are fieldsets labelled "Filter ‹n›"; each picker and value field has a real label.

## Responsive, touch, motion, forced colours
- Below the medium breakpoint the rail becomes a top tab strip; dialog is full screen.
- 44 px targets for tiles, rows, checkboxes and remove actions.
- Selected tile and rows use a check icon plus emphasis, not colour alone; type Tags carry text.

## Acceptance tests
- Given a chosen table, when another connection is picked, then table, columns and filters are cleared and the Table section is active.
- Given columns loaded, when select-all is pressed, then all columns are checked and the label switches to clear-all.
- Given a filter with operator equals and value "SP", when switched to member-of-list, then the value becomes ["SP"].
- Given member-of-list value text "SP, RJ ,", then the stored value is ["SP","RJ"].
- Given no column selected, then save is disabled.
- Given a legacy variable map, when saved, then filters contain equivalent equals rows and the legacy key is absent.
- Given `readOnly`, then no footer is shown and inputs are not editable.

## Open questions
- Source shows vendor logos per dialect; the clean version uses a neutral icon plus the dialect name (no third-party marks).
- The maximum row limit should come from the contract rather than a constant in the UI.
