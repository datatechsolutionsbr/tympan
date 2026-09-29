//! Native port of `<ty-wheel-picker>`: a touch-friendly vertical scroller
//! that picks one value from an ordered list by centring it in a selection
//! band. The choices are data (a JSON array in `options`, or one entry per
//! wheel in `columns`), so the element owns its whole subtree — where the
//! custom element composed it in `#render`, the port renders it
//! declaratively from the parsed props: each wheel a `ty-wheel` (caption in
//! the multi-column form, viewport, selection band) around a focusable
//! `role="listbox"` of `option` rows, with the selection and the distance
//! emphasis the stylesheet reads (`data-selected`, `data-distance`,
//! `aria-activedescendant`). The state is the element's: each wheel's value
//! is seeded from `value` (or its column's), a controlled `value` change
//! glides the single wheel to the new row, a structural change (options,
//! columns, label, visible rows, disabled, test id) re-seeds and jumps.
//! ArrowUp/ArrowDown move one row, PageUp/PageDown move by `visible-rows`,
//! Home/End go to the ends and a printable character jumps to the next row
//! whose label starts with it; a tap chooses. What still needs the live DOM
//! — touch and pointer-drag scrolling with the 120 ms settle that reports
//! the centred row, the animated placement, the haptic tick, the tap
//! suppression after a drag and `data-focus-visible` — lives in the `wasm`
//! module, cfg-gated with a no-op twin.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// The wheel settled on a new value, or a row was activated (tap, arrows, PageUp/PageDown, Home/End, typeahead). `value` is the option's value, not its label; `column` is the wheel's index (0 for a single wheel).
#[derive(Clone, Debug, PartialEq)]
pub struct WheelPickerChange {
    pub value: String,
    pub column: f64,
}

/// One choice of a wheel (the element's `rowsOf`: a plain string, or
/// `{ "value", "label"? }` when the shown text differs from the value).
#[derive(Clone, Debug, PartialEq)]
struct Row {
    id: String,
    text: String,
}

/// One wheel of the model: its choices, seeded value, caption and width share.
#[derive(Clone, Debug)]
struct Wheel {
    label: String,
    rows: Vec<Row>,
    value: String,
    share: Option<f64>,
}

struct Model {
    /// The multi-column form: the wheels sit in a `group` named by `label`.
    grouped: bool,
    wheels: Vec<Wheel>,
}

/// A request to glide a wheel to its centre (a choice, or a controlled
/// value change); the DOM effect in `wasm` follows it.
#[cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]
#[derive(Clone, Copy, Debug)]
struct Placement {
    wheel: usize,
    animate: bool,
}

/// Touch-friendly vertical scroller that picks one value from an ordered list by centring it in a selection band (drag or flick scrolls and snaps, a tap selects, the keyboard moves by row, page or ends). With `columns`, several wheels sit side by side for compound values (day, month, year), each with its own width share.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyWheelPicker(
    /// JSON array of the ordered choices: plain strings, or { "value", "label" } objects when the shown text differs from the reported value.
    #[props(into)]
    options: Option<String>,
    /// Selected value. A value no option holds centres the first row and reports nothing until the wheel moves; programmatic changes animate the wheel to the new row.
    #[props(into)]
    value: Option<String>,
    /// Accessible name of the wheel; with `columns`, of the whole group.
    #[props(into)]
    label: Option<String>,
    /// Rows visible at once; an even number rounds up to the next odd one (minimum 3).
    #[props(default = 5.0f64)]
    visible_rows: f64,
    /// Shown but not changeable: the wheel stays focusable, taps, scrolling and keys do not select.
    #[props(default)]
    disabled: bool,
    /// Multi-column form: JSON array of { "label", "options", "value", "share"? }, one wheel per entry; `share` is its relative width. Wins over `options` and `value`.
    #[props(into)]
    columns: Option<String>,
    /// Test hook on the wheel (`data-testid`).
    #[props(into)]
    test_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The wheel settled on a new value, or a row was activated (tap, arrows, PageUp/PageDown, Home/End, typeahead). `value` is the option's value, not its label; `column` is the wheel's index (0 for a single wheel).
    on_change: Option<EventHandler<WheelPickerChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let model = build_model(
        options.as_deref(),
        value.as_deref(),
        label.as_deref(),
        columns.as_deref(),
    );
    let visible = visible_count(visible_rows);

    // The element rebuilt its subtree when a structural attribute changed;
    // the mirror re-seeds the wheels the same way.
    let structure = [
        options.as_deref().unwrap_or_default(),
        columns.as_deref().unwrap_or_default(),
        label.as_deref().unwrap_or_default(),
        &js_number(visible_rows),
        if disabled { "1" } else { "0" },
        test_id.as_deref().unwrap_or_default(),
    ]
    .join("\u{0}");

    let mut mirrored_structure = use_signal(|| structure.clone());
    let mut current = use_signal(|| seed_values(&model));
    let mut centre = use_signal(|| seed_centres(&model));
    let mut mirrored_value = use_signal(|| value.clone());
    let mut rows_state = use_signal(|| model_rows(&model));
    let mut disabled_state = use_signal(|| disabled);
    let mut lists = use_signal(Vec::<Option<Rc<MountedData>>>::new);
    let mut placement = use_signal(|| None::<Placement>);
    let mut mirrored_on_change = use_signal(|| on_change);

    if structure != *mirrored_structure.peek() {
        mirrored_structure.set(structure.clone());
        current.set(seed_values(&model));
        centre.set(seed_centres(&model));
        rows_state.set(model_rows(&model));
        disabled_state.set(disabled);
        mirrored_value.set(value.clone());
    }

    // A value-only change glides the single wheel to the new row, as the
    // element's `changed`; a column's value lives in `columns`, structural.
    if value != *mirrored_value.peek() {
        mirrored_value.set(value.clone());
        if let Some(wheel) = model.wheels.first().filter(|_| !model.grouped) {
            let next = value.clone().unwrap_or_default();
            let index = wheel.rows.iter().position(|row| row.id == next).unwrap_or(0);
            current.with_mut(|values| {
                if let Some(slot) = values.first_mut() {
                    *slot = next;
                }
            });
            centre.with_mut(|centres| {
                if let Some(slot) = centres.first_mut() {
                    *slot = index;
                }
            });
            placement.set(Some(Placement {
                wheel: 0,
                animate: true,
            }));
        }
    }

    if lists.peek().len() != model.wheels.len() {
        lists.with_mut(|mounted| mounted.resize(model.wheels.len(), None));
    }
    if *mirrored_on_change.peek() != on_change {
        mirrored_on_change.set(on_change);
    }

    wasm::wire(
        lists,
        rows_state,
        centre,
        current,
        disabled_state,
        mirrored_on_change,
        placement,
        mirrored_structure,
    );

    // A user's choice of a row (the element's `#choose`): select, glide to
    // the row and report when the value moved.
    let choose = move |wheel: usize, index: usize| {
        let Some(row) = rows_state
            .peek()
            .get(wheel)
            .and_then(|rows| rows.get(index))
            .cloned()
        else {
            return;
        };
        let changed = current.peek().get(wheel) != Some(&row.id);
        current.with_mut(|values| {
            if let Some(slot) = values.get_mut(wheel) {
                *slot = row.id.clone();
            }
        });
        centre.with_mut(|centres| {
            if let Some(slot) = centres.get_mut(wheel) {
                *slot = index;
            }
        });
        placement.set(Some(Placement {
            wheel,
            animate: true,
        }));
        if changed {
            if let Some(handler) = on_change {
                handler.call(WheelPickerChange {
                    value: row.id,
                    column: wheel as f64,
                });
            }
        }
    };

    let values = current();
    let centres = centre();

    // One wheel's subtree (the element's `#wheel` plus the paint the first
    // placement applied): caption in the group form, viewport, band, and
    // the listbox with its rows' selection and distance emphasis.
    let render_wheel = |wheel: usize, with_test_hook: bool| {
        let model_wheel = &model.wheels[wheel];
        let selected = values.get(wheel).cloned().unwrap_or_default();
        let at = centres.get(wheel).copied().unwrap_or(0);
        let share = model_wheel
            .share
            .map(js_number)
            .unwrap_or_else(|| String::from("1"));
        rsx! {
            div {
                key: "wheel-{wheel}",
                class: "ty-wheel",
                style: "--ty-wheel-rows: {visible}; --ty-wheel-share: {share};",
                "data-disabled": disabled.then_some(""),
                "data-testid": if with_test_hook { test_id.as_deref().filter(|v| !v.is_empty()) } else { None },
                if model.grouped {
                    span {
                        class: "ty-wheel__caption",
                        "aria-hidden": Some("true"),
                        {model_wheel.label.clone()}
                    }
                }
                div {
                    class: "ty-wheel__viewport",
                    span {
                        class: "ty-wheel__band",
                        "aria-hidden": Some("true"),
                    }
                    div {
                        class: "ty-wheel__list",
                        "role": Some("listbox"),
                        tabindex: "0",
                        "aria-label": Some(model_wheel.label.clone()),
                        "aria-activedescendant": if model_wheel.rows.is_empty() { None } else { Some(format!("{instance}-wheel-{wheel}-option-{at}")) },
                        onmounted: move |event: MountedEvent| {
                            lists.with_mut(|mounted| {
                                if let Some(slot) = mounted.get_mut(wheel) {
                                    *slot = Some(event.data());
                                }
                            });
                        },
                        onkeydown: {
                            let rows = model_wheel.rows.clone();
                            let mut choose = choose;
                            move |event: KeyboardEvent| {
                                if rows.is_empty() {
                                    return;
                                }
                                let current_index = {
                                    let selected = current.peek().get(wheel).cloned().unwrap_or_default();
                                    rows.iter().position(|row| row.id == selected)
                                };
                                let last = rows.len() - 1;
                                let from = current_index.unwrap_or(0);
                                let target = match event.key() {
                                    Key::ArrowUp => Some(if current_index.is_none() { 0 } else { from.saturating_sub(1) }),
                                    Key::ArrowDown => Some(if current_index.is_none() { 0 } else { (from + 1).min(last) }),
                                    Key::PageUp => Some(from.saturating_sub(visible)),
                                    Key::PageDown => Some((from + visible).min(last)),
                                    Key::Home => Some(0),
                                    Key::End => Some(last),
                                    Key::Character(text) => {
                                        let modifiers = event.modifiers();
                                        if text.chars().count() == 1 && !modifiers.ctrl() && !modifiers.meta() && !modifiers.alt() {
                                            // Typeahead: the next row (wrapping,
                                            // after the current one) whose label
                                            // starts with the character.
                                            let needle = text.to_lowercase();
                                            let mut found = None;
                                            for step in 1..=rows.len() {
                                                let index = (from + step) % rows.len();
                                                if rows[index].text.to_lowercase().starts_with(&needle) {
                                                    found = Some(index);
                                                    break;
                                                }
                                            }
                                            found
                                        } else {
                                            None
                                        }
                                    }
                                    _ => None,
                                };
                                let Some(target) = target else { return };
                                event.prevent_default();
                                if disabled {
                                    return;
                                }
                                if current_index == Some(target) {
                                    return;
                                }
                                choose(wheel, target);
                            }
                        },
                        for (index, row) in model_wheel.rows.iter().enumerate() {
                            div {
                                key: "{index}",
                                class: "ty-wheel__row",
                                "role": Some("option"),
                                "id": Some(format!("{instance}-wheel-{wheel}-option-{index}")),
                                "aria-selected": Some(if row.id == selected { "true" } else { "false" }),
                                "data-selected": (row.id == selected).then_some(""),
                                "data-distance": Some(index.abs_diff(at).min(3).to_string()),
                                onclick: {
                                    let mut choose = choose;
                                    move |_| {
                                        if disabled {
                                            return;
                                        }
                                        choose(wheel, index);
                                    }
                                },
                                {row.text.clone()}
                            }
                        }
                    }
                }
            }
        }
    };

    rsx! {
        ty-wheel-picker {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "options": options.as_deref().filter(|v| !v.is_empty()),
            "value": value.as_deref().filter(|v| !v.is_empty()),
            "label": label.as_deref().filter(|v| !v.is_empty()),
            "visible-rows": Some(visible_rows.to_string()),
            "disabled": disabled.then_some("true"),
            "columns": columns.as_deref().filter(|v| !v.is_empty()),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            if model.grouped {
                div {
                    class: "ty-wheel-group",
                    "role": Some("group"),
                    "aria-label": Some(label.clone().unwrap_or_default()),
                    for wheel in 0..model.wheels.len() {
                        {render_wheel(wheel, false)}
                    }
                }
            } else {
                {render_wheel(0, true)}
            }
        }
    }
}

/// The element's `#visibleRows`: floored, forced odd, at least 3.
fn visible_count(raw: f64) -> usize {
    let floored = if raw.is_finite() { raw.floor() as i32 } else { 5 };
    std::cmp::max(3, floored | 1) as usize
}

/// The wheels' seeded values (`value`, or each column's).
fn seed_values(model: &Model) -> Vec<String> {
    model.wheels.iter().map(|wheel| wheel.value.clone()).collect()
}

/// The wheels' seeded centres: the row the value names, else the first (the
/// element's `Math.max(0, findIndex(...))`).
fn seed_centres(model: &Model) -> Vec<usize> {
    model
        .wheels
        .iter()
        .map(|wheel| {
            wheel
                .rows
                .iter()
                .position(|row| row.id == wheel.value)
                .unwrap_or(0)
        })
        .collect()
}

fn model_rows(model: &Model) -> Vec<Vec<Row>> {
    model.wheels.iter().map(|wheel| wheel.rows.clone()).collect()
}

/// The model: the multi-column form when `columns` is a non-empty JSON
/// array of objects (it wins over `options` and `value`), else one wheel.
fn build_model(
    options: Option<&str>,
    value: Option<&str>,
    label: Option<&str>,
    columns: Option<&str>,
) -> Model {
    if let Some(columns) = parse_columns(columns) {
        return Model {
            grouped: true,
            wheels: columns
                .into_iter()
                .map(|column| Wheel {
                    label: column.label,
                    rows: column.rows,
                    value: column.value,
                    share: column.share,
                })
                .collect(),
        };
    }
    let parsed = parse_json(options);
    Model {
        grouped: false,
        wheels: vec![Wheel {
            label: label.unwrap_or_default().to_string(),
            rows: rows_of(parsed.as_ref()),
            value: value.unwrap_or_default().to_string(),
            share: None,
        }],
    }
}

/// The element's `rowsOf`: plain strings, or `{ value, label? }` objects
/// (the label defaults to the value); rows with an empty value drop out.
fn rows_of(options: Option<&Json>) -> Vec<Row> {
    let Some(Json::Array(entries)) = options else {
        return Vec::new();
    };
    let mut rows = Vec::new();
    for entry in entries {
        let row = match entry {
            Json::String(text) => Row {
                id: text.clone(),
                text: text.clone(),
            },
            Json::Object(fields) => {
                let Some(value) = field(fields, "value") else {
                    continue;
                };
                let id = js_string(value);
                let text = match field(fields, "label") {
                    Some(Json::Null) | None => id.clone(),
                    Some(label) => js_string(label),
                };
                Row { id, text }
            }
            _ => continue,
        };
        if !row.id.is_empty() {
            rows.push(row);
        }
    }
    rows
}

struct ColumnData {
    label: String,
    rows: Vec<Row>,
    value: String,
    share: Option<f64>,
}

/// The `columns` prop: a JSON array of `{ "label", "options", "value",
/// "share"? }`; non-objects are skipped and anything but a non-empty array
/// is no columns at all, as the element's `#columns`.
fn parse_columns(raw: Option<&str>) -> Option<Vec<ColumnData>> {
    let parsed = parse_json(raw)?;
    let Json::Array(entries) = &parsed else {
        return None;
    };
    let columns: Vec<ColumnData> = entries
        .iter()
        .filter_map(|entry| {
            let Json::Object(fields) = entry else {
                return None;
            };
            Some(ColumnData {
                label: field(fields, "label")
                    .filter(|value| !matches!(value, Json::Null))
                    .map(js_string)
                    .unwrap_or_default(),
                rows: rows_of(field(fields, "options")),
                value: field(fields, "value")
                    .filter(|value| !matches!(value, Json::Null))
                    .map(js_string)
                    .unwrap_or_default(),
                share: match field(fields, "share") {
                    Some(Json::Number(share)) if share.is_finite() => Some(*share),
                    _ => None,
                },
            })
        })
        .collect();
    (!columns.is_empty()).then_some(columns)
}

fn field<'a>(fields: &'a [(String, Json)], name: &str) -> Option<&'a Json> {
    fields
        .iter()
        .find(|(key, _)| key == name)
        .map(|(_, value)| value)
}

fn parse_json(raw: Option<&str>) -> Option<Json> {
    JsonParser::new(raw?).finish()
}

/// A JSON scalar as `String(...)` rendered it (options and columns are
/// data; the element stringified whatever it found).
fn js_string(value: &Json) -> String {
    match value {
        Json::Null => String::from("null"),
        Json::Bool(value) => value.to_string(),
        Json::Number(value) => js_number(*value),
        Json::String(value) => value.clone(),
        _ => String::new(),
    }
}

/// A number as `String(...)` renders it: integers without a fraction,
/// anything else in the shortest form.
fn js_number(value: f64) -> String {
    if value.fract() == 0.0 && value.abs() < 1e15 {
        format!("{}", value as i64)
    } else {
        format!("{value}")
    }
}

/// Minimal JSON value: enough for the arrays and flat objects of the
/// `options` and `columns` props.
enum Json {
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Array(Vec<Json>),
    Object(Vec<(String, Json)>),
}

struct JsonParser<'a> {
    source: &'a [u8],
    pos: usize,
}

impl<'a> JsonParser<'a> {
    fn new(source: &'a str) -> Self {
        Self {
            source: source.as_bytes(),
            pos: 0,
        }
    }

    fn finish(mut self) -> Option<Json> {
        let value = self.value()?;
        self.whitespace();
        (self.pos == self.source.len()).then_some(value)
    }

    fn whitespace(&mut self) {
        while matches!(self.source.get(self.pos), Some(b' ' | b'\t' | b'\n' | b'\r')) {
            self.pos += 1;
        }
    }

    fn peek(&self) -> Option<u8> {
        self.source.get(self.pos).copied()
    }

    fn value(&mut self) -> Option<Json> {
        self.whitespace();
        match self.peek()? {
            b'{' => self.object(),
            b'[' => self.array(),
            b'"' => self.string().map(Json::String),
            b't' => self.literal(b"true", Json::Bool(true)),
            b'f' => self.literal(b"false", Json::Bool(false)),
            b'n' => self.literal(b"null", Json::Null),
            _ => self.number(),
        }
    }

    fn literal(&mut self, word: &'static [u8], value: Json) -> Option<Json> {
        if self.source.get(self.pos..self.pos + word.len()) == Some(word) {
            self.pos += word.len();
            Some(value)
        } else {
            None
        }
    }

    fn number(&mut self) -> Option<Json> {
        let start = self.pos;
        if self.peek() == Some(b'-') {
            self.pos += 1;
        }
        while matches!(self.peek(), Some(b'0'..=b'9')) {
            self.pos += 1;
        }
        if self.peek() == Some(b'.') {
            self.pos += 1;
            while matches!(self.peek(), Some(b'0'..=b'9')) {
                self.pos += 1;
            }
        }
        if matches!(self.peek(), Some(b'e' | b'E')) {
            self.pos += 1;
            if matches!(self.peek(), Some(b'+' | b'-')) {
                self.pos += 1;
            }
            while matches!(self.peek(), Some(b'0'..=b'9')) {
                self.pos += 1;
            }
        }
        std::str::from_utf8(self.source.get(start..self.pos)?)
            .ok()?
            .parse::<f64>()
            .ok()
            .map(Json::Number)
    }

    fn string(&mut self) -> Option<String> {
        self.whitespace();
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
                    let escaped = self.peek()?;
                    self.pos += 1;
                    match escaped {
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
                                if self.source.get(self.pos..self.pos + 2) != Some(b"\\u") {
                                    return None;
                                }
                                self.pos += 2;
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
                }
                _ => {
                    let rest = std::str::from_utf8(self.source.get(self.pos..)?).ok()?;
                    let c = rest.chars().next()?;
                    out.push(c);
                    self.pos += c.len_utf8();
                }
            }
        }
    }

    fn hex4(&mut self) -> Option<u32> {
        let hex = std::str::from_utf8(self.source.get(self.pos..self.pos + 4)?).ok()?;
        let code = u32::from_str_radix(hex, 16).ok()?;
        self.pos += 4;
        Some(code)
    }

    fn array(&mut self) -> Option<Json> {
        self.pos += 1;
        let mut items = Vec::new();
        self.whitespace();
        if self.peek() == Some(b']') {
            self.pos += 1;
            return Some(Json::Array(items));
        }
        loop {
            items.push(self.value()?);
            self.whitespace();
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

    fn object(&mut self) -> Option<Json> {
        self.pos += 1;
        let mut fields = Vec::new();
        self.whitespace();
        if self.peek() == Some(b'}') {
            self.pos += 1;
            return Some(Json::Object(fields));
        }
        loop {
            let key = self.string()?;
            self.whitespace();
            if self.peek() != Some(b':') {
                return None;
            }
            self.pos += 1;
            let value = self.value()?;
            fields.push((key, value));
            self.whitespace();
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

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    use super::{Placement, Row, WheelPickerChange};

    #[allow(clippy::too_many_arguments)]
    pub fn wire(
        _lists: Signal<Vec<Option<Rc<MountedData>>>>,
        _rows: Signal<Vec<Vec<Row>>>,
        _centre: Signal<Vec<usize>>,
        _current: Signal<Vec<String>>,
        _disabled: Signal<bool>,
        _on_change: Signal<Option<EventHandler<WheelPickerChange>>>,
        _placement: Signal<Option<Placement>>,
        _structure: Signal<String>,
    ) {
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::cell::RefCell;
    use std::rc::{Rc, Weak};

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::{JsCast, JsValue};

    use super::{Placement, Row, WheelPickerChange};

    /// 120 ms after the last scroll the wheel settles and reports.
    const SETTLE_MS: i32 = 120;
    /// A programmatic scroll glides; after this its settle is not reported.
    const PROGRAM_MS: i32 = 400;
    /// Row height before layout (the element's DEFAULT_ROW).
    const DEFAULT_ROW: f64 = 44.0;

    struct Listener {
        target: web_sys::EventTarget,
        event: &'static str,
        closure: Closure<dyn FnMut(web_sys::Event)>,
    }

    impl Drop for Listener {
        fn drop(&mut self) {
            let _ = self
                .target
                .remove_event_listener_with_callback(self.event, self.closure.as_ref().unchecked_ref());
        }
    }

    fn listen(
        target: &web_sys::EventTarget,
        event: &'static str,
        closure: Closure<dyn FnMut(web_sys::Event)>,
    ) -> Option<Listener> {
        target
            .add_event_listener_with_callback(event, closure.as_ref().unchecked_ref())
            .ok()?;
        Some(Listener {
            target: target.clone(),
            event,
            closure,
        })
    }

    /// A capture-phase listener: the tap suppression after a drag runs ahead
    /// of Dioxus's delegated click.
    fn listen_capture(
        target: &web_sys::EventTarget,
        event: &'static str,
        closure: Closure<dyn FnMut(web_sys::Event)>,
    ) -> Option<Listener> {
        let options = web_sys::AddEventListenerOptions::new();
        options.set_capture(true);
        target
            .add_event_listener_with_callback_and_add_event_listener_options(
                event,
                closure.as_ref().unchecked_ref(),
                &options,
            )
            .ok()?;
        Some(Listener {
            target: target.clone(),
            event,
            closure,
        })
    }

    /// A `setTimeout` whose handle clears on drop (replaced or unmounted).
    struct Timer {
        handle: i32,
        _closure: Closure<dyn FnMut()>,
    }

    impl Timer {
        fn schedule(ms: i32, closure: Closure<dyn FnMut()>) -> Option<Timer> {
            let window = web_sys::window()?;
            let handle = window
                .set_timeout_with_callback_and_timeout_and_arguments_0(
                    closure.as_ref().unchecked_ref(),
                    ms,
                )
                .ok()?;
            Some(Timer {
                handle,
                _closure: closure,
            })
        }
    }

    impl Drop for Timer {
        fn drop(&mut self) {
            if let Some(window) = web_sys::window() {
                window.clear_timeout_with_handle(self.handle);
            }
        }
    }

    #[derive(Default)]
    struct WheelDom {
        list: Option<web_sys::Element>,
        listeners: Vec<Listener>,
        programmatic: bool,
        placed: bool,
        /// True once, right after a drag ended (the following tap is ignored).
        swallow_click: bool,
        settle: Option<Timer>,
        program: Option<Timer>,
    }

    struct Drag {
        wheel: usize,
        y: f64,
        top: f64,
        moved: bool,
    }

    #[derive(Default)]
    struct Inner {
        structure: String,
        wheels: Vec<WheelDom>,
        window_listeners: Vec<Listener>,
        drag: Option<Drag>,
    }

    impl Inner {
        /// Centre `index` without reporting (the element's `#place`): a jump
        /// on the first placement or under reduced motion, a glide otherwise.
        fn place(&mut self, weak: &Weak<RefCell<Inner>>, index: usize, centre: usize, animate: bool) {
            let Some(list) = self.wheels[index].list.clone() else {
                return;
            };
            self.wheels[index].placed = true;
            self.wheels[index].settle = None;
            self.wheels[index].programmatic = true;
            let options = web_sys::ScrollToOptions::new();
            options.set_top(centre as f64 * row_height(&list));
            options.set_behavior(if animate && !reduced_motion() {
                web_sys::ScrollBehavior::Smooth
            } else {
                web_sys::ScrollBehavior::Instant
            });
            list.scroll_to_with_scroll_to_options(&options);
            let timer = weak.clone();
            let closure = Closure::<dyn FnMut()>::new(move || {
                let Some(inner) = timer.upgrade() else { return };
                let mut guard = inner.borrow_mut();
                if let Some(wheel) = guard.wheels.get_mut(index) {
                    wheel.programmatic = false;
                }
            });
            self.wheels[index].program = Timer::schedule(PROGRAM_MS, closure);
        }
    }

    /// The DOM side of the wheels: per-list listeners (scroll with its
    /// settle report, pointer-drag start, focus ring, tap suppression) and
    /// the window-level drag tracking, plus the placements the state
    /// requests. Held by the component; the closures hold a `Weak`, so
    /// everything stops and drops with it.
    #[allow(clippy::too_many_arguments)]
    pub fn wire(
        lists: Signal<Vec<Option<Rc<MountedData>>>>,
        rows: Signal<Vec<Vec<Row>>>,
        centre: Signal<Vec<usize>>,
        current: Signal<Vec<String>>,
        disabled: Signal<bool>,
        on_change: Signal<Option<EventHandler<WheelPickerChange>>>,
        placement: Signal<Option<Placement>>,
        structure: Signal<String>,
    ) {
        let inner = use_hook(|| Rc::new(RefCell::new(Inner::default())));
        use_effect(move || {
            let handles = lists();
            let request = placement();
            let signature = structure();
            let centres = centre.peek().clone();
            let weak = Rc::downgrade(&inner);
            let mut guard = inner.borrow_mut();
            let inner = &mut *guard;
            if signature != inner.structure {
                // The element rebuilt its subtree: pending settles and glides
                // die with it and every wheel's first placement jumps.
                inner.structure = signature;
                for wheel in &mut inner.wheels {
                    wheel.settle = None;
                    wheel.program = None;
                    wheel.programmatic = false;
                    wheel.placed = false;
                }
            }
            inner.wheels.resize_with(handles.len(), WheelDom::default);
            for (index, handle) in handles.iter().enumerate() {
                let Some(list) = handle
                    .as_ref()
                    .and_then(|mounted| mounted.downcast::<web_sys::Element>().cloned())
                else {
                    continue;
                };
                let wired = inner.wheels[index]
                    .list
                    .as_ref()
                    .is_some_and(|known| known.is_same_node(Some(&list)));
                if !wired {
                    inner.wheels[index].list = Some(list.clone());
                    inner.wheels[index].listeners =
                        attach(&weak, index, &list, rows, centre, current, disabled, on_change);
                    if inner.window_listeners.is_empty() {
                        inner.window_listeners = attach_window(&weak);
                    }
                }
                let first = !inner.wheels[index].placed;
                let requested = request
                    .as_ref()
                    .is_some_and(|place| place.wheel == index);
                if first || requested {
                    let animate = request
                        .as_ref()
                        .is_some_and(|place| place.wheel == index && place.animate);
                    inner.place(&weak, index, centres.get(index).copied().unwrap_or(0), animate);
                }
            }
        });
    }

    /// The per-list listeners (the element's `#onScroll`, the drag start,
    /// the focus ring and the `#onTap` guard).
    #[allow(clippy::too_many_arguments)]
    fn attach(
        weak: &Weak<RefCell<Inner>>,
        index: usize,
        list: &web_sys::Element,
        rows: Signal<Vec<Vec<Row>>>,
        mut centre: Signal<Vec<usize>>,
        mut current: Signal<Vec<String>>,
        disabled: Signal<bool>,
        on_change: Signal<Option<EventHandler<WheelPickerChange>>>,
    ) -> Vec<Listener> {
        let mut listeners = Vec::new();
        let target: web_sys::EventTarget = list.clone().into();

        // Scroll recentres the emphasis and ticks as a row crosses the
        // band; SETTLE_MS after the last scroll the wheel reports the
        // centred row if it changed (a programmatic glide does not).
        {
            let list = list.clone();
            let weak = weak.clone();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                let count = rows.peek().get(index).map(Vec::len).unwrap_or(0);
                if count == 0 {
                    return;
                }
                let at = ((list.scroll_top() as f64 / row_height(&list)).round() as i64)
                    .clamp(0, count as i64 - 1) as usize;
                let programmatic = weak
                    .upgrade()
                    .and_then(|inner| inner.borrow().wheels.get(index).map(|wheel| wheel.programmatic))
                    .unwrap_or(false);
                let previous = centre.peek().get(index).copied().unwrap_or(0);
                if at != previous {
                    if !programmatic {
                        tick();
                    }
                    centre.with_mut(|centres| {
                        if let Some(slot) = centres.get_mut(index) {
                            *slot = at;
                        }
                    });
                }
                if programmatic {
                    return;
                }
                let Some(inner) = weak.upgrade() else { return };
                let settle = Closure::<dyn FnMut()>::new(move || {
                    let Some(row) = rows
                        .peek()
                        .get(index)
                        .and_then(|rows| rows.get(at))
                        .cloned()
                    else {
                        return;
                    };
                    if current.peek().get(index) == Some(&row.id) || *disabled.peek() {
                        return;
                    }
                    current.with_mut(|values| {
                        if let Some(slot) = values.get_mut(index) {
                            *slot = row.id.clone();
                        }
                    });
                    tick();
                    if let Some(handler) = *on_change.peek() {
                        handler.call(WheelPickerChange {
                            value: row.id,
                            column: index as f64,
                        });
                    }
                });
                let mut guard = inner.borrow_mut();
                if let Some(wheel) = guard.wheels.get_mut(index) {
                    wheel.settle = Timer::schedule(SETTLE_MS, settle);
                }
            });
            listeners.extend(listen(&target, "scroll", closure));
        }

        // Pointer-drag scrolling starts here for mouse and pen (touch
        // scrolls natively); the move and end are tracked on the window.
        {
            let list = list.clone();
            let weak = weak.clone();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                let Some(pointer) = event.dyn_ref::<web_sys::PointerEvent>() else {
                    return;
                };
                if pointer.pointer_type() == "touch" {
                    return;
                }
                let Some(inner) = weak.upgrade() else { return };
                let mut guard = inner.borrow_mut();
                if let Some(wheel) = guard.wheels.get_mut(index) {
                    wheel.swallow_click = false;
                }
                guard.drag = Some(Drag {
                    wheel: index,
                    y: pointer.client_y() as f64,
                    top: list.scroll_top() as f64,
                    moved: false,
                });
            });
            listeners.extend(listen(&target, "pointerdown", closure));
        }

        // The tap that ends a drag is not a choice: swallow that one click,
        // ahead of Dioxus's delegated handler (the element's `moved`).
        {
            let weak = weak.clone();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                let Some(inner) = weak.upgrade() else { return };
                let mut guard = inner.borrow_mut();
                let Some(wheel) = guard.wheels.get_mut(index) else { return };
                if wheel.swallow_click {
                    wheel.swallow_click = false;
                    event.stop_propagation();
                }
            });
            listeners.extend(listen_capture(&target, "click", closure));
        }

        // `data-focus-visible` while the list has the visible focus ring.
        {
            let list = list.clone();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                if list.matches(":focus-visible").unwrap_or(false) {
                    let _ = list.set_attribute("data-focus-visible", "");
                }
            });
            listeners.extend(listen(&target, "focus", closure));
        }
        {
            let list = list.clone();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                let _ = list.remove_attribute("data-focus-visible");
            });
            listeners.extend(listen(&target, "blur", closure));
        }
        listeners
    }

    /// The drag's move and end, tracked on the window so a drag leaving the
    /// list still scrolls and still ends (the element's `#drag`).
    fn attach_window(weak: &Weak<RefCell<Inner>>) -> Vec<Listener> {
        let Some(window) = web_sys::window() else {
            return Vec::new();
        };
        let target: web_sys::EventTarget = window.into();
        let mut listeners = Vec::new();
        {
            let weak = weak.clone();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                let Some(pointer) = event.dyn_ref::<web_sys::PointerEvent>() else {
                    return;
                };
                let Some(inner) = weak.upgrade() else { return };
                let mut guard = inner.borrow_mut();
                let Some(drag) = guard.drag.as_mut() else { return };
                let dy = pointer.client_y() as f64 - drag.y;
                let crossed = dy.abs() > 4.0 && !drag.moved;
                if crossed {
                    drag.moved = true;
                }
                let wheel_index = drag.wheel;
                let top = drag.top;
                let moved = drag.moved;
                if crossed {
                    if let Some(wheel) = wheel_element(&guard, wheel_index) {
                        let _ = wheel.set_attribute("data-dragging", "");
                    }
                }
                if moved {
                    if let Some(list) = guard
                        .wheels
                        .get(wheel_index)
                        .and_then(|wheel| wheel.list.clone())
                    {
                        list.set_scroll_top((top - dy) as i32);
                    }
                }
            });
            listeners.extend(listen(&target, "pointermove", closure));
        }
        {
            let weak = weak.clone();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                let Some(inner) = weak.upgrade() else { return };
                let mut guard = inner.borrow_mut();
                let Some(drag) = guard.drag.take() else { return };
                if let Some(wheel) = wheel_element(&guard, drag.wheel) {
                    let _ = wheel.remove_attribute("data-dragging");
                }
                if drag.moved {
                    if let Some(wheel) = guard.wheels.get_mut(drag.wheel) {
                        wheel.swallow_click = true;
                    }
                }
            });
            listeners.extend(listen(&target, "pointerup", closure));
        }
        listeners
    }

    /// The `.ty-wheel` wrapper of a wheel's list (for `data-dragging`).
    fn wheel_element(inner: &Inner, index: usize) -> Option<web_sys::Element> {
        inner.wheels.get(index)?.list.as_ref()?.closest(".ty-wheel").ok().flatten()
    }

    /// The height of a row, the first option's or the default (the element's
    /// `#rowHeight`).
    fn row_height(list: &web_sys::Element) -> f64 {
        let height = list
            .query_selector("[role=\"option\"]")
            .ok()
            .flatten()
            .and_then(|row| row.dyn_into::<web_sys::HtmlElement>().ok())
            .map(|row| row.offset_height())
            .unwrap_or(0);
        if height > 0 {
            height as f64
        } else {
            DEFAULT_ROW
        }
    }

    /// A light selection tick; silent without the Vibration API, under
    /// reduced motion and before any user gesture (the element's `tick`,
    /// reflective like `segmented_control.rs`'s `haptic_tick`).
    fn tick() {
        if reduced_motion() {
            return;
        }
        let Some(window) = web_sys::window() else { return };
        let window: JsValue = window.into();
        let Ok(navigator) = js_sys::Reflect::get(&window, &JsValue::from_str("navigator")) else {
            return;
        };
        if let Ok(activation) = js_sys::Reflect::get(&navigator, &JsValue::from_str("userActivation")) {
            if !activation.is_undefined() {
                let active = js_sys::Reflect::get(&activation, &JsValue::from_str("hasBeenActive"))
                    .ok()
                    .and_then(|value| value.as_bool())
                    .unwrap_or(true);
                if !active {
                    return;
                }
            }
        }
        let Ok(vibrate) = js_sys::Reflect::get(&navigator, &JsValue::from_str("vibrate")) else {
            return;
        };
        let Ok(vibrate) = vibrate.dyn_into::<js_sys::Function>() else {
            return;
        };
        let _ = vibrate.call1(&navigator, &JsValue::from_f64(8.0));
    }

    fn reduced_motion() -> bool {
        web_sys::window()
            .and_then(|window| {
                window
                    .match_media("(prefers-reduced-motion: reduce)")
                    .ok()
                    .flatten()
            })
            .is_some_and(|media| media.matches())
    }
}
