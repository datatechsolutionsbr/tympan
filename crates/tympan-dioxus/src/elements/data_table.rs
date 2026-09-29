//! Native port of `<ty-data-table>`: records as rows and attributes as
//! columns, with sorting, optional row selection, row navigation, loading and
//! empty states, in three densities. Where the custom element owned the whole
//! subtree and rebuilt it on every attribute change (restoring focus by
//! `data-focus-key`), the port parses the `columns` / `rows` /
//! `selected-keys` JSON in Rust (the same tolerant hand-rolled reader the
//! other ports carry) and composes the anatomy declaratively in `rsx!` — the
//! caption, the sortable header, the selection column, the skeleton rows, the
//! empty state and the data rows — so SSR carries the composed table and
//! Dioxus's DOM diffing keeps focus across re-renders without the element's
//! focus-restore pass. Sort and selection keep the element's controlled
//! contract, with the wave's mirrored-prop idiom: the sort cycle (none →
//! ascending → descending → none) and the selection set update the local
//! state and are reported with `on_sort_change` / `on_selection_change` (an
//! empty `direction` is the cleared sort, as the generated binding reads it),
//! and a host that writes `sort_column` / `sort_direction` / `selected_keys`
//! back stays in charge. The keyboard contract is the element's: once rows
//! are selectable, linked or actionable the table is a grid — rows are
//! focusable, the arrow keys, Home and End move between them, Enter activates
//! (following the row link, or `on_row_action` for a row without `href`) and
//! Space selects; nested controls keep their native keys and presses. What
//! still needs the live DOM — the select-all checkbox's `indeterminate`
//! property, the row focus moves and the programmatic row-link click — lives
//! in `mod wasm`, cfg-gated with a no-op twin. Row ids are matched against
//! attributes instead of the element's `CSS.escape`d selectors.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Row height and cell padding: comfortable 52 px, standard 44 px, compact 36 px.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum DataTableDensity {
    Comfortable,
    #[default]
    Standard,
    Compact,
}

impl DataTableDensity {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            DataTableDensity::Comfortable => "comfortable",
            DataTableDensity::Standard => "standard",
            DataTableDensity::Compact => "compact",
        }
    }
}

/// Direction of `sortColumn` (controlled); unset: no sort.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum DataTableSortDirection {
    Ascending,
    Descending,
}

impl DataTableSortDirection {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            DataTableSortDirection::Ascending => "ascending",
            DataTableSortDirection::Descending => "descending",
        }
    }
}

/// `multiple` adds a checkbox column and a select-all header checkbox.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum DataTableSelectionMode {
    #[default]
    None,
    Multiple,
}

impl DataTableSelectionMode {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            DataTableSelectionMode::None => "none",
            DataTableSelectionMode::Multiple => "multiple",
        }
    }
}

/// A sortable header cycled (none → ascending → descending → none). `direction` is `ascending`, `descending` or null when the sort cleared (the Rust binding reads an empty string for the cleared state). Controlled: the host writes `sort-column`/`sort-direction`.
#[derive(Clone, Debug, PartialEq)]
pub struct DataTableSortChange {
    pub column: String,
    pub direction: String,
}

/// The selection changed (a row checkbox, the select-all header checkbox, or Space on a focused row); `keys` is a JSON array of the selected row ids. Controlled: the host writes `selected-keys`.
#[derive(Clone, Debug, PartialEq)]
pub struct DataTableSelectionChange {
    pub keys: String,
}

/// A row without `href` was activated (Enter or a press).
#[derive(Clone, Debug, PartialEq)]
pub struct DataTableRowAction {
    pub id: String,
}

/// One column of the `columns` JSON (the element's `ColumnDef`).
#[derive(Clone, Debug, PartialEq)]
struct ColumnDef {
    id: String,
    header: String,
    sortable: bool,
    align: Option<String>,
    numeric: bool,
}

impl ColumnDef {
    /// `numeric` implies end alignment, as the element's `data-align`.
    fn align(&self) -> &'static str {
        if self.numeric || self.align.as_deref() == Some("end") {
            "end"
        } else {
            "start"
        }
    }
}

/// One row of the `rows` JSON (the element's `RowDef`).
#[derive(Clone, Debug, PartialEq)]
struct RowDef {
    id: String,
    cells: Vec<(String, String)>,
    href: Option<String>,
    label: Option<String>,
}

/// The cell text of one column (missing or non-string reads as empty).
fn cell_value<'a>(row: &'a RowDef, column: &str) -> Option<&'a str> {
    row.cells
        .iter()
        .find(|(key, _)| key == column)
        .map(|(_, value)| value.as_str())
}

/// The row's accessible name: its `label`, else the first column's cell, else
/// the row id (the element's `#rowLabel`).
fn row_label(row: &RowDef, columns: &[ColumnDef]) -> String {
    if let Some(label) = &row.label {
        return label.clone();
    }
    if let Some(first) = columns.first() {
        if let Some(value) = cell_value(row, &first.id) {
            return value.to_string();
        }
    }
    row.id.clone()
}

const SORT_ASCENDING: &[&str] = &["m5 12 7-7 7 7", "M12 19V5"];
const SORT_DESCENDING: &[&str] = &["M12 5v14", "m19 12-7 7-7-7"];
const SORT_NONE: &[&str] = &["m21 16-4 4-4-4", "M17 20V4", "m3 8 4-4 4 4", "M7 4v16"];
const CHECK: &[&str] = &["M20 6 9 17l-5-5"];
const MINUS: &[&str] = &["M5 12h14"];
const INBOX: &[&str] = &[
    "M22 12h-6l-2 3h-4l-2-3H2",
    "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
];

/// The direction icon of a sortable header (the element's `SORT_ICONS`).
fn sort_icon(direction: Option<DataTableSortDirection>) -> &'static [&'static str] {
    match direction {
        Some(DataTableSortDirection::Ascending) => SORT_ASCENDING,
        Some(DataTableSortDirection::Descending) => SORT_DESCENDING,
        None => SORT_NONE,
    }
}

/// A decorative lucide icon (ISC, THIRD_PARTY_NOTICES): strokes only.
fn icon(class_name: &str, paths: &[&str]) -> Element {
    rsx! {
        svg {
            class: class_name.to_string(),
            "viewBox": Some("0 0 24 24"),
            "fill": Some("none"),
            "stroke": Some("currentColor"),
            "stroke-width": Some("2"),
            "stroke-linecap": Some("round"),
            "stroke-linejoin": Some("round"),
            "aria-hidden": Some("true"),
            "focusable": Some("false"),
            for d in paths {
                path {
                    key: "{d}",
                    "d": Some(*d),
                }
            }
        }
    }
}

/// The truncating cell content (the element's `.ty-table__clamp`).
fn clamp_span(value: &str) -> Element {
    rsx! {
        span {
            class: "ty-table__clamp",
            title: value.to_string(),
            {value.to_string()}
        }
    }
}

/// The decorative box the stylesheet draws from the input's state.
fn checkbox_box() -> Element {
    rsx! {
        span {
            class: "ty-table__checkbox-box",
            "aria-hidden": Some("true"),
            {icon("ty-table__check", CHECK)}
            {icon("ty-table__minus", MINUS)}
        }
    }
}

/// The parsed `columns` JSON: entries without a string `id` are skipped, as
/// the element's filter.
fn parse_columns(raw: Option<&str>) -> Vec<ColumnDef> {
    let Some(Json::Array(entries)) = parse_list(raw) else {
        return Vec::new();
    };
    entries
        .iter()
        .filter_map(|entry| {
            let fields = fields_of(entry)?;
            Some(ColumnDef {
                id: text_field(fields, "id")?,
                header: text_field(fields, "header").unwrap_or_default(),
                sortable: bool_field(fields, "sortable"),
                align: text_field(fields, "align"),
                numeric: bool_field(fields, "numeric"),
            })
        })
        .collect()
}

/// The parsed `rows` JSON: entries without a string `id` are skipped, as the
/// element's filter.
fn parse_rows(raw: Option<&str>) -> Vec<RowDef> {
    let Some(Json::Array(entries)) = parse_list(raw) else {
        return Vec::new();
    };
    entries
        .iter()
        .filter_map(|entry| {
            let fields = fields_of(entry)?;
            Some(RowDef {
                id: text_field(fields, "id")?,
                cells: match field(fields, "cells") {
                    Some(Json::Object(pairs)) => pairs
                        .iter()
                        .filter_map(|(key, value)| match value {
                            Json::String(text) => Some((key.clone(), text.clone())),
                            _ => None,
                        })
                        .collect(),
                    _ => Vec::new(),
                },
                href: text_field(fields, "href"),
                label: text_field(fields, "label"),
            })
        })
        .collect()
}

/// The parsed `selected-keys` JSON (strings only, in order).
fn parse_selected_keys(raw: Option<&str>) -> Vec<String> {
    let Some(Json::Array(entries)) = parse_list(raw) else {
        return Vec::new();
    };
    entries
        .iter()
        .filter_map(|entry| match entry {
            Json::String(key) => Some(key.clone()),
            _ => None,
        })
        .collect()
}

/// The selection as the `ty-selection-change` detail carries it: a JSON array
/// of row ids.
fn keys_json(keys: &[String]) -> String {
    let mut out = String::from("[");
    for (index, key) in keys.iter().enumerate() {
        if index > 0 {
            out.push(',');
        }
        out.push_str(&json_string(key));
    }
    out.push(']');
    out
}

/// A JSON string literal with the escapes JSON requires.
fn json_string(value: &str) -> String {
    let mut out = String::from("\"");
    for c in value.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// A tolerant JSON list parse: anything broken reads as empty.
fn parse_list(raw: Option<&str>) -> Option<Json> {
    let raw = raw.filter(|v| !v.is_empty())?;
    match parse_json(raw) {
        Some(Json::Array(items)) => Some(Json::Array(items)),
        _ => None,
    }
}

fn fields_of(entry: &Json) -> Option<&[(String, Json)]> {
    match entry {
        Json::Object(fields) => Some(fields),
        _ => None,
    }
}

fn field<'a>(fields: &'a [(String, Json)], name: &str) -> Option<&'a Json> {
    fields.iter().find(|(key, _)| key == name).map(|(_, value)| value)
}

fn text_field(fields: &[(String, Json)], name: &str) -> Option<String> {
    match field(fields, name) {
        Some(Json::String(value)) => Some(value.clone()),
        _ => None,
    }
}

fn bool_field(fields: &[(String, Json)], name: &str) -> bool {
    matches!(field(fields, name), Some(Json::Bool(true)))
}

/// Just enough JSON for the data props (the host's own data), the same
/// hand-rolled reader the other ports carry.
#[derive(Clone, Debug, PartialEq)]
enum Json {
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Array(Vec<Json>),
    Object(Vec<(String, Json)>),
}

fn parse_json(input: &str) -> Option<Json> {
    struct Parser<'a> {
        input: &'a [u8],
        pos: usize,
    }

    impl Parser<'_> {
        fn peek(&self) -> Option<u8> {
            self.input.get(self.pos).copied()
        }

        fn skip_ws(&mut self) {
            while matches!(self.peek(), Some(b' ' | b'\t' | b'\n' | b'\r')) {
                self.pos += 1;
            }
        }

        fn value(&mut self, depth: u32) -> Option<Json> {
            if depth > 64 {
                return None;
            }
            self.skip_ws();
            match self.peek()? {
                b'{' => self.object(depth),
                b'[' => self.array(depth),
                b'"' => self.string().map(Json::String),
                b't' => self.literal("true").map(|_| Json::Bool(true)),
                b'f' => self.literal("false").map(|_| Json::Bool(false)),
                b'n' => self.literal("null").map(|_| Json::Null),
                _ => self.number().map(Json::Number),
            }
        }

        fn literal(&mut self, word: &str) -> Option<()> {
            if self.input[self.pos..].starts_with(word.as_bytes()) {
                self.pos += word.len();
                Some(())
            } else {
                None
            }
        }

        fn number(&mut self) -> Option<f64> {
            let start = self.pos;
            while matches!(
                self.peek(),
                Some(b'-' | b'+' | b'0'..=b'9' | b'.' | b'e' | b'E')
            ) {
                self.pos += 1;
            }
            std::str::from_utf8(self.input.get(start..self.pos)?)
                .ok()?
                .parse()
                .ok()
        }

        fn string(&mut self) -> Option<String> {
            if self.peek() != Some(b'"') {
                return None;
            }
            self.pos += 1;
            let mut out = String::new();
            loop {
                match self.peek()? {
                    b'"' => {
                        self.pos += 1;
                        return Some(out);
                    }
                    b'\\' => {
                        self.pos += 1;
                        match self.peek()? {
                            b'"' => out.push('"'),
                            b'\\' => out.push('\\'),
                            b'/' => out.push('/'),
                            b'b' => out.push('\u{8}'),
                            b'f' => out.push('\u{c}'),
                            b'n' => out.push('\n'),
                            b'r' => out.push('\r'),
                            b't' => out.push('\t'),
                            b'u' => {
                                let first = self.hex4()?;
                                let code = if (0xD800..0xDC00).contains(&first) {
                                    if self.peek() != Some(b'\\') {
                                        return None;
                                    }
                                    self.pos += 1;
                                    let second = self.hex4()?;
                                    if !(0xDC00..0xE000).contains(&second) {
                                        return None;
                                    }
                                    0x10000 + ((first - 0xD800) << 10) + (second - 0xDC00)
                                } else {
                                    first
                                };
                                out.push(char::from_u32(code)?);
                            }
                            _ => return None,
                        }
                        self.pos += 1;
                    }
                    _ => {
                        let rest = std::str::from_utf8(self.input.get(self.pos..)?).ok()?;
                        let ch = rest.chars().next()?;
                        out.push(ch);
                        self.pos += ch.len_utf8();
                    }
                }
            }
        }

        fn hex4(&mut self) -> Option<u32> {
            if self.peek() != Some(b'u') {
                return None;
            }
            let digits = self.input.get(self.pos + 1..self.pos + 5)?;
            if digits.len() != 4 || !digits.iter().all(u8::is_ascii_hexdigit) {
                return None;
            }
            let value = u32::from_str_radix(std::str::from_utf8(digits).ok()?, 16).ok()?;
            self.pos += 5;
            Some(value)
        }

        fn array(&mut self, depth: u32) -> Option<Json> {
            self.pos += 1;
            let mut items = Vec::new();
            self.skip_ws();
            if self.peek() == Some(b']') {
                self.pos += 1;
                return Some(Json::Array(items));
            }
            loop {
                items.push(self.value(depth + 1)?);
                self.skip_ws();
                match self.peek()? {
                    b',' => self.pos += 1,
                    b']' => {
                        self.pos += 1;
                        return Some(Json::Array(items));
                    }
                    _ => return None,
                }
            }
        }

        fn object(&mut self, depth: u32) -> Option<Json> {
            self.pos += 1;
            let mut fields = Vec::new();
            self.skip_ws();
            if self.peek() == Some(b'}') {
                self.pos += 1;
                return Some(Json::Object(fields));
            }
            loop {
                self.skip_ws();
                let key = self.string()?;
                self.skip_ws();
                if self.peek() != Some(b':') {
                    return None;
                }
                self.pos += 1;
                let value = self.value(depth + 1)?;
                fields.push((key, value));
                self.skip_ws();
                match self.peek()? {
                    b',' => self.pos += 1,
                    b'}' => {
                        self.pos += 1;
                        return Some(Json::Object(fields));
                    }
                    _ => return None,
                }
            }
        }
    }

    let mut parser = Parser {
        input: input.as_bytes(),
        pos: 0,
    };
    let value = parser.value(0)?;
    parser.skip_ws();
    (parser.pos == input.len()).then_some(value)
}

/// Records as rows and attributes as columns, with sorting, optional row selection, row navigation, loading and empty states, in three densities. Data arrives as JSON attributes; sort, selection and row activation are controlled: the element emits `ty-sort-change`, `ty-selection-change` and `ty-row-action`, and the host writes the new `sort-column`/`sort-direction`/`selected-keys` back.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyDataTable(
    /// Accessible name of the table (required); visually hidden unless `captionVisible`.
    #[props(into)] caption: Option<String>,
    /// Show the caption above the table; it always names the table.
    #[props(default)] caption_visible: bool,
    /// JSON array of column definitions: { id, header, sortable?, align?: "start"|"end", numeric? }. `numeric` implies end alignment and tabular figures.
    #[props(into)] columns: Option<String>,
    /// JSON array of rows: { id, cells: { "<columnId>": "<text>" }, href?, label? }. `href` makes the whole row the target (one link per row in the tab order); `label` names the row link.
    #[props(into)] rows: Option<String>,
    /// Row height and cell padding: comfortable 52 px, standard 44 px, compact 36 px.
    #[props(default)] density: DataTableDensity,
    /// The currently sorted column id (controlled).
    #[props(into)] sort_column: Option<String>,
    /// Direction of `sortColumn` (controlled); unset: no sort.
    #[props(default)] sort_direction: Option<DataTableSortDirection>,
    /// `multiple` adds a checkbox column and a select-all header checkbox.
    #[props(default)] selection_mode: DataTableSelectionMode,
    /// JSON array of the selected row ids (controlled).
    #[props(into)] selected_keys: Option<String>,
    /// Show skeleton rows instead of data; the table is `aria-busy` and a polite status announces `loadingLabel`.
    #[props(default)] loading: bool,
    /// Number of skeleton rows while loading.
    #[props(default = 10.0f64)] loading_row_count: f64,
    /// Polite status announced while loading.
    #[props(into, default = String::from("Loading the list"))] loading_label: String,
    /// Title of the built-in empty state, shown in a single cell spanning all columns when not loading and rows are empty.
    #[props(into, default = String::from("No rows to show"))] empty_label: String,
    /// Optional description under the empty title.
    #[props(into)] empty_description: Option<String>,
    /// Accessible name of the header checkbox.
    #[props(into, default = String::from("Select all rows"))] select_all_label: String,
    /// Accessible name template of a row checkbox; `{label}` is the row label.
    #[props(into, default = String::from("Select {label}"))] select_row_label: String,
    /// Rows are activatable: Enter or a press on a row without `href` emits `ty-row-action` (the presence of the spec's `onRowAction`).
    #[props(default)] actionable: bool,
    /// `true` or `false`; unset: the first column stays visible while scrolling horizontally.
    #[props(into)] sticky_first_column: Option<String>,
    /// Vertical dividers between columns.
    #[props(default)] show_column_lines: bool,
    /// Maximum height of the scroll container, enabling the sticky header.
    #[props(into)] max_block_size: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)] instance: Option<String>,
    #[props(into)] id: Option<String>,
    #[props(into, default)] class: String,
    /// A sortable header cycled (none → ascending → descending → none). `direction` is `ascending`, `descending` or null when the sort cleared (the Rust binding reads an empty string for the cleared state). Controlled: the host writes `sort-column`/`sort-direction`.
    on_sort_change: Option<EventHandler<DataTableSortChange>>,
    /// The selection changed (a row checkbox, the select-all header checkbox, or Space on a focused row); `keys` is a JSON array of the selected row ids. Controlled: the host writes `selected-keys`.
    on_selection_change: Option<EventHandler<DataTableSelectionChange>>,
    /// A row without `href` was activated (Enter or a press).
    on_row_action: Option<EventHandler<DataTableRowAction>>,
) -> Element {
    let instance = use_instance_id(instance);

    let columns_data = parse_columns(columns.as_deref());
    let rows_data = parse_rows(rows.as_deref());

    let selectable = selection_mode == DataTableSelectionMode::Multiple;
    let interactive = selectable || actionable || rows_data.iter().any(|row| row.href.is_some());
    let col_span = columns_data.len() + usize::from(selectable);

    // The sort, uncontrolled with a mirrored prop: the sort buttons cycle
    // none → ascending → descending → none and report with `on_sort_change`;
    // a host that moves `sort-column` / `sort-direction` re-syncs the state
    // (the element's controlled contract).
    let mut sort_column_state = use_signal(|| sort_column.clone().filter(|v| !v.is_empty()));
    let mut sort_direction_state = use_signal(|| sort_direction);
    let mut mirrored_sort = use_signal(|| (sort_column.clone(), sort_direction));
    if (sort_column.clone(), sort_direction) != *mirrored_sort.peek() {
        mirrored_sort.set((sort_column.clone(), sort_direction));
        sort_column_state.set(sort_column.clone().filter(|v| !v.is_empty()));
        sort_direction_state.set(sort_direction);
    }

    // The selection, uncontrolled with a mirrored prop: the checkboxes, the
    // row presses and Space drive the set and report it with
    // `on_selection_change`; a host that moves `selected-keys` re-syncs it.
    let parsed_selected = parse_selected_keys(selected_keys.as_deref());
    let mut selected_state = use_signal(|| parsed_selected.clone());
    let mut mirrored_selected = use_signal(|| parsed_selected.clone());
    if parsed_selected != *mirrored_selected.peek() {
        mirrored_selected.set(parsed_selected.clone());
        selected_state.set(parsed_selected);
    }

    let sort_column_now = sort_column_state();
    let sort_direction_now = sort_direction_state();
    let selected_now = selected_state();

    let all_selected = !rows_data.is_empty() && rows_data.iter().all(|row| selected_now.contains(&row.id));
    let some_selected = !all_selected && rows_data.iter().any(|row| selected_now.contains(&row.id));

    let mut mirrored_some = use_signal(|| some_selected);
    if some_selected != *mirrored_some.peek() {
        mirrored_some.set(some_selected);
    }

    let mut host = use_signal(|| None::<Rc<MountedData>>);
    let mut select_all_input = use_signal(|| None::<Rc<MountedData>>);
    wasm::mirror_indeterminate(select_all_input, mirrored_some);

    // A sortable header cycled: the element's `nextDirection` over the
    // current state, reported with the cleared sort as an empty direction.
    let request_sort = move |column: String| {
        let current = if sort_column_state.peek().as_deref() == Some(column.as_str()) {
            *sort_direction_state.peek()
        } else {
            None
        };
        let next = match current {
            None => Some(DataTableSortDirection::Ascending),
            Some(DataTableSortDirection::Ascending) => Some(DataTableSortDirection::Descending),
            Some(DataTableSortDirection::Descending) => None,
        };
        sort_column_state.set(next.map(|_| column.clone()));
        sort_direction_state.set(next);
        if let Some(handler) = on_sort_change {
            handler.call(DataTableSortChange {
                column,
                direction: next.map(|direction| direction.as_str()).unwrap_or_default().to_string(),
            });
        }
    };

    // One row's checkbox, a row press in selection mode, or Space on the row
    // (the element's `#toggleRow`): the set keeps insertion order, as the
    // element's `Set`.
    let toggle_row = move |id: String| {
        let mut keys = selected_state.peek().clone();
        if let Some(at) = keys.iter().position(|key| key == &id) {
            keys.remove(at);
        } else {
            keys.push(id);
        }
        selected_state.set(keys.clone());
        if let Some(handler) = on_selection_change {
            handler.call(DataTableSelectionChange {
                keys: keys_json(&keys),
            });
        }
    };

    // The select-all header checkbox (the element's `#toggleAll`): every row
    // when not all are selected, none when they are.
    let toggle_all = {
        let rows_data = rows_data.clone();
        move || {
            let keys = selected_state.peek().clone();
            let all = !rows_data.is_empty() && rows_data.iter().all(|row| keys.contains(&row.id));
            let next: Vec<String> = if all {
                Vec::new()
            } else {
                rows_data.iter().map(|row| row.id.clone()).collect()
            };
            selected_state.set(next.clone());
            if let Some(handler) = on_selection_change {
                handler.call(DataTableSelectionChange {
                    keys: keys_json(&next),
                });
            }
        }
    };

    // Row activation (the element's `#activate`): a row with `href` follows
    // its link; a row without one asks for an action.
    let activate = {
        let rows_data = rows_data.clone();
        move |id: String| {
            if let Some(row) = rows_data.iter().find(|row| row.id == id) {
                if row.href.is_some() {
                    wasm::click_row_link(host, &id);
                    return;
                }
            }
            if actionable {
                if let Some(handler) = on_row_action {
                    handler.call(DataTableRowAction { id });
                }
            }
        }
    };

    let caption_text = caption.clone().unwrap_or_default();
    let caption_id = format!("{instance}-caption");
    let sticky_first = sticky_first_column.as_deref() != Some("false");
    let skeleton_count = loading_row_count.max(0.0).floor() as usize;

    rsx! {
        ty-data-table {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "caption": caption.as_deref().filter(|v| !v.is_empty()),
            "caption-visible": caption_visible.then_some(""),
            "columns": columns.as_deref().filter(|v| !v.is_empty()),
            "rows": rows.as_deref().filter(|v| !v.is_empty()),
            "density": Some(density.as_str()),
            "sort-column": sort_column.as_deref().filter(|v| !v.is_empty()),
            "sort-direction": sort_direction.map(|v| v.as_str()),
            "selection-mode": Some(selection_mode.as_str()),
            "selected-keys": selected_keys.as_deref().filter(|v| !v.is_empty()),
            "loading": loading.then_some(""),
            "loading-row-count": Some(loading_row_count.to_string()),
            "loading-label": (!loading_label.is_empty()).then_some(loading_label.as_str()),
            "empty-label": (!empty_label.is_empty()).then_some(empty_label.as_str()),
            "empty-description": empty_description.as_deref().filter(|v| !v.is_empty()),
            "select-all-label": (!select_all_label.is_empty()).then_some(select_all_label.as_str()),
            "select-row-label": (!select_row_label.is_empty()).then_some(select_row_label.as_str()),
            "actionable": actionable.then_some(""),
            "sticky-first-column": sticky_first_column.as_deref().filter(|v| !v.is_empty()),
            "show-column-lines": show_column_lines.then_some(""),
            "max-block-size": max_block_size.as_deref().filter(|v| !v.is_empty()),
            onmounted: move |event: MountedEvent| host.set(Some(event.data())),
            div {
                class: "ty-table-wrap",
                "data-density": Some(density.as_str()),
                "data-sticky-first": sticky_first.then_some(""),
                "data-column-lines": show_column_lines.then_some(""),
                "data-selectable": selectable.then_some(""),
                if caption_visible {
                    div {
                        class: "ty-table__caption",
                        "id": Some(caption_id.clone()),
                        {caption_text.clone()}
                    }
                }
                if loading {
                    span {
                        class: "ty-visually-hidden",
                        "role": Some("status"),
                        {loading_label.clone()}
                    }
                }
                div {
                    class: "ty-table-scroll",
                    style: max_block_size
                        .as_ref()
                        .filter(|v| !v.is_empty())
                        .map(|size| format!("max-block-size: {size}")),
                    table {
                        class: "ty-table",
                        "role": interactive.then_some("grid"),
                        "aria-labelledby": caption_visible.then_some(caption_id.clone()),
                        "aria-busy": loading.then_some("true"),
                        if !caption_visible {
                            caption {
                                class: "ty-visually-hidden",
                                {caption_text.clone()}
                            }
                        }
                        thead {
                            class: "ty-table__head",
                            tr {
                                class: "ty-table__row ty-table__row--head",
                                if selectable {
                                    th {
                                        class: "ty-table__column ty-table__column--select",
                                        "scope": Some("col"),
                                        label {
                                            class: "ty-table__checkbox",
                                            input {
                                                class: "ty-table__checkbox-input",
                                                "type": Some("checkbox"),
                                                "aria-label": Some(select_all_label.clone()),
                                                checked: all_selected,
                                                disabled: loading || rows_data.is_empty(),
                                                "data-select-all": Some(""),
                                                "data-focus-key": Some("select:all"),
                                                onmounted: move |event| select_all_input.set(Some(event.data())),
                                                onchange: {
                                                    let mut toggle_all = toggle_all.clone();
                                                    move |_| toggle_all()
                                                },
                                            }
                                            {checkbox_box()}
                                        }
                                    }
                                }
                                for column in &columns_data {
                                    {
                                        let direction = if sort_column_now.as_deref() == Some(column.id.as_str()) {
                                            sort_direction_now
                                        } else {
                                            None
                                        };
                                        rsx! {
                                            th {
                                                key: "{column.id}",
                                                class: "ty-table__column",
                                                "scope": Some("col"),
                                                "data-align": Some(column.align()),
                                                "aria-sort": column.sortable.then(|| direction.map(|d| d.as_str()).unwrap_or("none")),
                                                if column.sortable {
                                                    button {
                                                        class: "ty-table__sort",
                                                        "type": Some("button"),
                                                        "data-column": Some(column.id.clone()),
                                                        "data-focus-key": Some(format!("sort:{}", column.id)),
                                                        onclick: {
                                                            let id = column.id.clone();
                                                            let mut request_sort = request_sort;
                                                            move |_| request_sort(id.clone())
                                                        },
                                                        span {
                                                            {column.header.clone()}
                                                        }
                                                        {icon("ty-table__sort-icon", sort_icon(direction))}
                                                    }
                                                } else {
                                                    {column.header.clone()}
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        tbody {
                            class: "ty-table__body",
                            if loading {
                                for _ in 0..skeleton_count {
                                    tr {
                                        class: "ty-table__row",
                                        "data-loading": Some("true"),
                                        "aria-hidden": Some("true"),
                                        if selectable {
                                            td {
                                                class: "ty-table__cell ty-table__cell--select",
                                                span {
                                                    class: "ty-table__checkbox-box",
                                                    "aria-hidden": Some("true"),
                                                }
                                            }
                                        }
                                        for column in &columns_data {
                                            td {
                                                key: "{column.id}",
                                                class: "ty-table__cell",
                                                span {
                                                    class: "ty-skeleton",
                                                    "data-shape": Some("line"),
                                                    "data-width": Some(if column.numeric { "short" } else { "long" }),
                                                }
                                            }
                                        }
                                    }
                                }
                            } else if rows_data.is_empty() {
                                tr {
                                    class: "ty-table__row ty-table__row--empty",
                                    td {
                                        class: "ty-table__cell ty-table__cell--empty",
                                        "colspan": Some(col_span.to_string()),
                                        div {
                                            class: "ty-empty",
                                            "data-framing": Some("inline"),
                                            {icon("ty-empty__icon", INBOX)}
                                            h4 {
                                                class: "ty-empty__title",
                                                {empty_label.clone()}
                                            }
                                            if let Some(description) = empty_description.clone().filter(|v| !v.is_empty()) {
                                                p {
                                                    class: "ty-empty__description",
                                                    {description}
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                for (row_index, row) in rows_data.iter().enumerate() {
                                    {
                                        let id = row.id.clone();
                                        let is_selected = selected_now.contains(&row.id);
                                        let is_actionable = row.href.is_some() || actionable;
                                        let label_text = row_label(row, &columns_data);
                                        let checkbox_label = select_row_label.replacen("{label}", &label_text, 1);
                                        rsx! {
                                            tr {
                                                key: "{row.id}",
                                                class: "ty-table__row",
                                                "data-row-id": Some(id.clone()),
                                                "data-selected": is_selected.then_some(""),
                                                "data-actionable": is_actionable.then_some(""),
                                                "tabindex": interactive.then_some("0"),
                                                "data-focus-key": interactive.then_some(format!("row:{id}")),
                                                "aria-selected": (interactive && selectable).then_some(if is_selected { "true" } else { "false" }),
                                                onclick: {
                                                    let id = id.clone();
                                                    let mut toggle_row = toggle_row;
                                                    let activate = activate.clone();
                                                    move |_| {
                                                        if selectable {
                                                            toggle_row(id.clone());
                                                        } else {
                                                            activate(id.clone());
                                                        }
                                                    }
                                                },
                                                onkeydown: {
                                                    let row_ids: Vec<String> = rows_data.iter().map(|row| row.id.clone()).collect();
                                                    let id = id.clone();
                                                    let mut toggle_row = toggle_row;
                                                    let activate = activate.clone();
                                                    move |event: KeyboardEvent| {
                                                        let to = match event.key() {
                                                            Key::ArrowDown => Some((row_index + 1).min(row_ids.len().saturating_sub(1))),
                                                            Key::ArrowUp => Some(row_index.saturating_sub(1)),
                                                            Key::Home => Some(0),
                                                            Key::End => Some(row_ids.len().saturating_sub(1)),
                                                            Key::Enter => {
                                                                // The row itself; nested
                                                                // controls keep their native
                                                                // keys (they stop the press
                                                                // from reaching the row).
                                                                event.prevent_default();
                                                                activate(id.clone());
                                                                None
                                                            }
                                                            Key::Character(key) if key == " " => {
                                                                if selectable {
                                                                    event.prevent_default();
                                                                    toggle_row(id.clone());
                                                                }
                                                                None
                                                            }
                                                            _ => None,
                                                        };
                                                        if let Some(to) = to {
                                                            event.prevent_default();
                                                            if let Some(target) = row_ids.get(to) {
                                                                wasm::focus_row(host, &format!("row:{target}"));
                                                            }
                                                        }
                                                    }
                                                },
                                                if selectable {
                                                    td {
                                                        class: "ty-table__cell ty-table__cell--select",
                                                        label {
                                                            class: "ty-table__checkbox",
                                                            // The native control handles
                                                            // itself; the row press must not
                                                            // toggle a second time.
                                                            onclick: move |event: MouseEvent| event.stop_propagation(),
                                                            input {
                                                                class: "ty-table__checkbox-input",
                                                                "type": Some("checkbox"),
                                                                "aria-label": Some(checkbox_label.clone()),
                                                                checked: is_selected,
                                                                "data-row-id": Some(id.clone()),
                                                                "data-focus-key": Some(format!("select:{id}")),
                                                                onkeydown: move |event: KeyboardEvent| {
                                                                    match event.key() {
                                                                        Key::Enter => event.stop_propagation(),
                                                                        Key::Character(key) if key == " " => event.stop_propagation(),
                                                                        _ => {}
                                                                    }
                                                                },
                                                                onchange: {
                                                                    let id = id.clone();
                                                                    let mut toggle_row = toggle_row;
                                                                    move |_| toggle_row(id.clone())
                                                                },
                                                            }
                                                            {checkbox_box()}
                                                        }
                                                    }
                                                }
                                                for (cell_index, column) in columns_data.iter().enumerate() {
                                                    {
                                                        let value = cell_value(row, &column.id).unwrap_or("").to_string();
                                                        if cell_index == 0 {
                                                            rsx! {
                                                                th {
                                                                    key: "{column.id}",
                                                                    class: "ty-table__cell ty-table__cell--row-header",
                                                                    "scope": Some("row"),
                                                                    "data-align": Some(column.align()),
                                                                    "data-numeric": column.numeric.then_some(""),
                                                                    if let Some(href) = row.href.clone() {
                                                                        a {
                                                                            class: "ty-table__row-link",
                                                                            href: Some(href),
                                                                            "aria-label": Some(label_text.clone()),
                                                                            onclick: move |event: MouseEvent| event.stop_propagation(),
                                                                            onkeydown: move |event: KeyboardEvent| {
                                                                                match event.key() {
                                                                                    Key::Enter => event.stop_propagation(),
                                                                                    Key::Character(key) if key == " " => event.stop_propagation(),
                                                                                    _ => {}
                                                                                }
                                                                            },
                                                                            {clamp_span(&value)}
                                                                        }
                                                                    } else {
                                                                        {clamp_span(&value)}
                                                                    }
                                                                }
                                                            }
                                                        } else {
                                                            rsx! {
                                                                td {
                                                                    key: "{column.id}",
                                                                    class: "ty-table__cell",
                                                                    "data-align": Some(column.align()),
                                                                    "data-numeric": column.numeric.then_some(""),
                                                                    {clamp_span(&value)}
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    pub fn mirror_indeterminate(_input: Signal<Option<Rc<MountedData>>>, _some: Signal<bool>) {}

    pub fn focus_row(_host: Signal<Option<Rc<MountedData>>>, _key: &str) {}

    pub fn click_row_link(_host: Signal<Option<Rc<MountedData>>>, _row_id: &str) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::JsCast;

    /// The select-all checkbox's `indeterminate` is a property, not an
    /// attribute — only script can set it, exactly why the custom element
    /// existed.
    pub fn mirror_indeterminate(input: Signal<Option<Rc<MountedData>>>, some: Signal<bool>) {
        use_effect(move || {
            let Some(element) = input_element(input) else { return };
            element.set_indeterminate(some());
        });
    }

    /// Move the row focus (ArrowDown/ArrowUp/Home/End): the row carrying
    /// `data-focus-key`, as the element's `#onKeydown` move.
    pub fn focus_row(host: Signal<Option<Rc<MountedData>>>, key: &str) {
        let Some(element) = host_element(host) else { return };
        let Ok(nodes) = element.query_selector_all("[data-focus-key]") else {
            return;
        };
        for index in 0..nodes.length() {
            let Some(node) = nodes.item(index) else { continue };
            let Some(candidate) = node.dyn_ref::<web_sys::Element>() else {
                continue;
            };
            if candidate.get_attribute("data-focus-key").as_deref() == Some(key) {
                if let Some(html) = candidate.dyn_ref::<web_sys::HtmlElement>() {
                    let _ = html.focus();
                }
                return;
            }
        }
    }

    /// Forward a row activation to the row's link (the element's `#activate`:
    /// the host navigates from the real anchor click).
    pub fn click_row_link(host: Signal<Option<Rc<MountedData>>>, row_id: &str) {
        let Some(element) = host_element(host) else { return };
        let Ok(rows) = element.query_selector_all("tr.ty-table__row[data-row-id]") else {
            return;
        };
        for index in 0..rows.length() {
            let Some(node) = rows.item(index) else { continue };
            let Some(row) = node.dyn_ref::<web_sys::Element>() else {
                continue;
            };
            if row.get_attribute("data-row-id").as_deref() != Some(row_id) {
                continue;
            }
            if let Ok(Some(link)) = row.query_selector(".ty-table__row-link") {
                if let Some(html) = link.dyn_ref::<web_sys::HtmlElement>() {
                    html.click();
                }
            }
            return;
        }
    }

    fn input_element(input: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::HtmlInputElement> {
        input()?
            .downcast::<web_sys::Element>()
            .cloned()?
            .dyn_into::<web_sys::HtmlInputElement>()
            .ok()
    }

    fn host_element(host: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        host()?.downcast::<web_sys::Element>().cloned()
    }
}
