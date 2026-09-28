import type { ElementDefinition } from '../definition.ts'

/**
 * `<ty-data-table>`: the DataTable's single source (spec: wave-1/data-table.md).
 *
 * A data-driven composite — records as rows, attributes as columns — so the
 * element is self-rendering (the theme palette's precedent): the host
 * framework renders an empty host and passes the data as JSON attributes
 * (`columns`, `rows`, `selected-keys`), and the element owns the whole
 * subtree: the caption, the sortable header, the selection column, the
 * skeleton rows, the empty state and the data rows themselves. The dynamic
 * parts (sort cycle, selection set, loading and empty states, row
 * activation) are events the element emits and controlled props the host
 * writes back, the same contract as `<ty-popover>`'s `open`.
 *
 * There is no declarative anatomy (the tree depends on the data, which the
 * definition language cannot express) and no examples (the parity renderers
 * could not produce data-driven output); behaviour is covered by
 * packages/ui/test/elements/data-table.test.tsx.
 */
export const dataTableDefinition = {
  tag: 'ty-data-table',
  name: 'TyDataTable',
  kind: 'self-rendering',
  doc: 'Records as rows and attributes as columns, with sorting, optional row selection, row navigation, loading and empty states, in three densities. Data arrives as JSON attributes; sort, selection and row activation are controlled: the element emits `ty-sort-change`, `ty-selection-change` and `ty-row-action`, and the host writes the new `sort-column`/`sort-direction`/`selected-keys` back.',
  props: {
    caption: { type: 'string', attribute: 'caption', doc: 'Accessible name of the table (required); visually hidden unless `captionVisible`.' },
    captionVisible: { type: 'boolean', attribute: 'caption-visible', doc: 'Show the caption above the table; it always names the table.' },
    columns: { type: 'string', attribute: 'columns', doc: 'JSON array of column definitions: { id, header, sortable?, align?: "start"|"end", numeric? }. `numeric` implies end alignment and tabular figures.' },
    rows: { type: 'string', attribute: 'rows', doc: 'JSON array of rows: { id, cells: { "<columnId>": "<text>" }, href?, label? }. `href` makes the whole row the target (one link per row in the tab order); `label` names the row link.' },
    density: { type: 'enum', values: ['comfortable', 'standard', 'compact'], default: 'standard', attribute: 'density', doc: 'Row height and cell padding: comfortable 52 px, standard 44 px, compact 36 px.' },
    sortColumn: { type: 'string', attribute: 'sort-column', doc: 'The currently sorted column id (controlled).' },
    sortDirection: { type: 'enum', values: ['ascending', 'descending'], attribute: 'sort-direction', doc: 'Direction of `sortColumn` (controlled); unset: no sort.' },
    selectionMode: { type: 'enum', values: ['none', 'multiple'], default: 'none', attribute: 'selection-mode', doc: '`multiple` adds a checkbox column and a select-all header checkbox.' },
    selectedKeys: { type: 'string', attribute: 'selected-keys', doc: 'JSON array of the selected row ids (controlled).' },
    loading: { type: 'boolean', attribute: 'loading', doc: 'Show skeleton rows instead of data; the table is `aria-busy` and a polite status announces `loadingLabel`.' },
    loadingRowCount: { type: 'number', default: 10, attribute: 'loading-row-count', doc: 'Number of skeleton rows while loading.' },
    loadingLabel: { type: 'string', default: 'Loading the list', attribute: 'loading-label', doc: 'Polite status announced while loading.' },
    emptyLabel: { type: 'string', default: 'No rows to show', attribute: 'empty-label', doc: 'Title of the built-in empty state, shown in a single cell spanning all columns when not loading and rows are empty.' },
    emptyDescription: { type: 'string', attribute: 'empty-description', doc: 'Optional description under the empty title.' },
    selectAllLabel: { type: 'string', default: 'Select all rows', attribute: 'select-all-label', doc: 'Accessible name of the header checkbox.' },
    selectRowLabel: { type: 'string', default: 'Select {label}', attribute: 'select-row-label', doc: 'Accessible name template of a row checkbox; `{label}` is the row label.' },
    actionable: { type: 'boolean', attribute: 'actionable', doc: 'Rows are activatable: Enter or a press on a row without `href` emits `ty-row-action` (the presence of the spec\'s `onRowAction`).' },
    stickyFirstColumn: { type: 'string', attribute: 'sticky-first-column', doc: '`true` or `false`; unset: the first column stays visible while scrolling horizontally.' },
    showColumnLines: { type: 'boolean', attribute: 'show-column-lines', doc: 'Vertical dividers between columns.' },
    maxBlockSize: { type: 'string', attribute: 'max-block-size', doc: 'Maximum height of the scroll container, enabling the sticky header.' },
  },
  events: [
    { type: 'ty-sort-change', kind: 'custom', detail: { column: 'string', direction: 'string' }, reactProp: 'onSortChange', rustProp: 'on_sort_change', doc: 'A sortable header cycled (none → ascending → descending → none). `direction` is `ascending`, `descending` or null when the sort cleared (the Rust binding reads an empty string for the cleared state). Controlled: the host writes `sort-column`/`sort-direction`.' },
    { type: 'ty-selection-change', kind: 'custom', detail: { keys: 'string' }, reactProp: 'onSelectionChange', rustProp: 'on_selection_change', doc: 'The selection changed (a row checkbox, the select-all header checkbox, or Space on a focused row); `keys` is a JSON array of the selected row ids. Controlled: the host writes `selected-keys`.' },
    { type: 'ty-row-action', kind: 'custom', detail: { id: 'string' }, reactProp: 'onRowAction', rustProp: 'on_row_action', doc: 'A row without `href` was activated (Enter or a press).' },
  ],
  examples: [],
} as const satisfies ElementDefinition
