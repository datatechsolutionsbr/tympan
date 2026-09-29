//! Native port of `<ty-tag-field>`, the self-rendering pill field: where the
//! custom element built its whole subtree on connect and kept it in step with
//! a `#sync` pass, the port parses the `value` / `suggestions` /
//! `suggestion-labels` JSON in Rust (the same hand-rolled reader the other
//! ports carry — no dependency) and composes the anatomy declaratively in
//! `rsx!`: the caption, the well with its chip list and typing host, the
//! suggestion popup and the note/fault lines, so SSR carries the field too.
//! The element's behaviour is kept: the controlled value (every commit or
//! removal only reports the next list through `on_change`, as the element's
//! `ty-change`; the host writes it back to `value`), the entry gate in order
//! (trim, duplicate ignoring case, past `max`, unlisted with
//! `allow-free-text="false"`), Enter and comma committing the draft or the
//! highlighted option, Backspace on an empty entry removing the last pill,
//! the APG combobox with `aria-activedescendant` and wrap-around arrows,
//! options committing on mousedown with the default prevented, the popup
//! opening on typing, focus and a click on the well, Escape closing without
//! committing, and `category-index` normalised into the 1–8 categorical
//! tokens, winning over `tone` (as in `tag.rs`). What still needs the live
//! DOM — mirroring the draft into the input's value property after a commit
//! (a no-op while the user types, so the caret stays put, the `text_field.rs`
//! precedent), focusing the input after a removal, the focusout that closes
//! the popup only when focus leaves the field, and scrolling the highlighted
//! option into view — lives in `mod wasm`, cfg-gated with a no-op twin. Not
//! ported: the host-assigned `validate` property (a function, so it has no
//! attribute form and the generated binding carries no prop for it; the gate
//! keeps the trim, duplicate, `max` and free-text refusals) and the
//! locale-sensitive `localeCompare` equality and `toLocaleLowerCase` matching
//! (Rust's std has no ICU; the port compares on lowercased text, the
//! `command_palette.rs` precedent, so accented input still matches only
//! itself).

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Pill tint; `accent` fills with the theme accent.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum TagFieldTone {
    #[default]
    Neutral,
    Accent,
}

impl TagFieldTone {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            TagFieldTone::Neutral => "neutral",
            TagFieldTone::Accent => "accent",
        }
    }
}

/// A value was added or removed; `value` is the next list as a JSON array. Controlled: the host writes it back to the `value` attribute.
#[derive(Clone, Debug, PartialEq)]
pub struct TagFieldChange {
    pub value: String,
}

/// One option of the suggestion popup: the value and its display text.
#[derive(Clone, Debug, PartialEq)]
struct Offer {
    id: String,
    text: String,
}

/// Case-insensitive equality, the element's `same` (a localeCompare with
/// accent sensitivity; the port lowercases, so accents still distinguish).
fn same(a: &str, b: &str) -> bool {
    a.to_lowercase() == b.to_lowercase()
}

/// The display text of a value: its `suggestion-labels` entry, else itself.
fn shown<'a>(value: &'a str, labels: &'a [(String, String)]) -> &'a str {
    labels
        .iter()
        .find(|(key, _)| key == value)
        .map(|(_, text)| text.as_str())
        .unwrap_or(value)
}

/// Suggestions not yet chosen, matching the draft against value and display
/// text — the element's `#offers`.
fn offers_of(suggestions: &[String], held: &[String], labels: &[(String, String)], draft: &str) -> Vec<Offer> {
    let query = draft.trim().to_lowercase();
    suggestions
        .iter()
        .filter(|s| !held.iter().any(|h| same(h, s)))
        .map(|s| Offer {
            id: s.clone(),
            text: shown(s, labels).to_string(),
        })
        .filter(|offer| {
            query.is_empty()
                || offer.id.to_lowercase().contains(&query)
                || offer.text.to_lowercase().contains(&query)
        })
        .collect()
}

/// The gate every entry passes (the element's `#judge`): the value to
/// commit, or None to refuse.
fn judge(raw: &str, held: &[String], max: Option<f64>, free_text: bool, suggestions: &[String]) -> Option<String> {
    let bare = raw.trim();
    if bare.is_empty() {
        return None;
    }
    if held.iter().any(|h| same(h, bare)) {
        return None;
    }
    if max.is_some_and(|limit| held.len() as f64 >= limit) {
        return None;
    }
    if !suggestions.is_empty() && !free_text && !suggestions.iter().any(|s| s == bare) {
        return None;
    }
    Some(bare.to_string())
}

/// The element's `changed()`: finite values clamp to 1 and wrap into the 1–8
/// categorical tokens; a non-finite value drops the attribute (as `tag.rs`).
fn normalise_category(category_index: Option<f64>) -> Option<i64> {
    let n = category_index?;
    if !n.is_finite() {
        return None;
    }
    Some(((n.round().max(1.0) as i64 - 1) % 8) + 1)
}

/// The chip list's accessible name once `{field}` is filled: an empty field
/// leaves a ": " prefix the element strips (`chosen.replace(/^:\s*/, '')`).
fn strip_field_prefix(chosen: &str) -> &str {
    match chosen.strip_prefix(':') {
        Some(rest) => rest.trim_start(),
        None => chosen,
    }
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

/// The next list as `on_change` reports it: `JSON.stringify(next)`.
fn json_list(values: &[String]) -> String {
    let mut out = String::from("[");
    for (index, value) in values.iter().enumerate() {
        if index > 0 {
            out.push(',');
        }
        out.push_str(&json_string(value));
    }
    out.push(']');
    out
}

/// A JSON array of strings (`value`, `suggestions`); anything broken or
/// non-string reads as empty, as the element's `#json`.
fn parse_string_list(raw: Option<&str>) -> Vec<String> {
    let Some(raw) = raw.filter(|v| !v.is_empty()) else {
        return Vec::new();
    };
    match JsonParser::new(raw).finish() {
        Some(Json::Array(items)) => items
            .into_iter()
            .filter_map(|item| match item {
                Json::String(text) => Some(text),
                _ => None,
            })
            .collect(),
        _ => Vec::new(),
    }
}

/// A JSON object of display text per value (`suggestion-labels`); anything
/// broken or non-string reads as empty.
fn parse_label_map(raw: Option<&str>) -> Vec<(String, String)> {
    let Some(raw) = raw.filter(|v| !v.is_empty()) else {
        return Vec::new();
    };
    match JsonParser::new(raw).finish() {
        Some(Json::Object(fields)) => fields
            .into_iter()
            .filter_map(|(key, value)| match value {
                Json::String(text) => Some((key, text)),
                _ => None,
            })
            .collect(),
        _ => Vec::new(),
    }
}

/// Minimal JSON value: enough for the collection props (the same hand-rolled
/// reader the other ports carry). Only strings are read back out; the scalar
/// payloads exist so the grammar stays complete.
#[allow(dead_code)]
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

/// Short values typed into removable pills, optionally assisted by (or restricted to) a suggestion list. Enter or comma commits the draft (or the highlighted suggestion), Backspace on an empty entry removes the last pill; duplicates (case-insensitive), values past `max` and — with `allow-free-text="false"` — values outside `suggestions` are refused. With suggestions the entry is an APG combobox with list autocomplete (active descendant, wrap-around arrows).
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyTagField(
    /// JSON array of the committed values (controlled); the element asks for changes with `ty-change`, it never writes its own.
    #[props(into)]
    value: Option<String>,
    /// JSON array of known values; turns the entry into a combobox.
    #[props(into)]
    suggestions: Option<String>,
    /// JSON object of display text per value, used in the popup and on the pills.
    #[props(into)]
    suggestion_labels: Option<String>,
    /// `true` or `false`; unset: free text is allowed. `false`: only values present in `suggestions` are accepted (the `show-arrow` precedent for a default-true switch).
    #[props(into)]
    allow_free_text: Option<String>,
    /// Maximum pills; the entry is disabled at the limit and re-enabled when one is removed.
    max: Option<f64>,
    /// Disables the entry and every remove control.
    #[props(default)]
    disabled: bool,
    /// Pill tint; `accent` fills with the theme accent.
    #[props(default)]
    tone: TagFieldTone,
    /// A categorical token (1 to 8) as the pill tint, shown as a small colour square; normalised into range on upgrade, wins over `tone`.
    category_index: Option<f64>,
    /// Visible label above the field, targeting the entry; if absent, `accessibleLabel` is required.
    #[props(into)]
    label: Option<String>,
    /// Accessible name of the entry when there is no visible label.
    #[props(into)]
    accessible_label: Option<String>,
    /// Hint in the entry.
    #[props(into)]
    placeholder: Option<String>,
    /// Help text below the field, linked as the entry's description.
    #[props(into)]
    helper_text: Option<String>,
    /// Marks the field invalid; shown below the helper text and linked as description.
    #[props(into)]
    error_text: Option<String>,
    /// Accessible name template of each remove control; `{value}` is the pill's display text.
    #[props(into, default = String::from("Remove {value}"))]
    remove_label: String,
    /// Accessible name template of the pill list; `{field}` is the label (or accessible label).
    #[props(into, default = String::from("{field}: chosen values"))]
    chosen_label: String,
    /// Accessible name of the suggestion popup.
    #[props(into, default = String::from("Suggestions"))]
    suggestions_label: String,
    /// Test hook on the root (`data-testid`).
    #[props(into)]
    test_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// A value was added or removed; `value` is the next list as a JSON array. Controlled: the host writes it back to the `value` attribute.
    on_change: Option<EventHandler<TagFieldChange>>,
) -> Element {
    let instance = use_instance_id(instance);

    let held = parse_string_list(value.as_deref());
    let suggestion_list = parse_string_list(suggestions.as_deref());
    let label_map = parse_label_map(suggestion_labels.as_deref());
    let free_text = allow_free_text.as_deref() != Some("false");
    let category = normalise_category(category_index);
    let has_suggestions = !suggestion_list.is_empty();

    // The field state the element kept in private fields: the draft, the
    // popup and the highlight. The value itself stays controlled — only
    // `on_change` asks the host for the next list.
    let mut draft = use_signal(String::new);
    let mut open = use_signal(|| false);
    let mut active = use_signal(|| None::<usize>);

    let mut root = use_signal(|| None::<Rc<MountedData>>);
    let mut input = use_signal(|| None::<Rc<MountedData>>);
    wasm::mirror_draft(input, draft);
    wasm::wire_focusout(root, open, active);

    let error = error_text.clone().unwrap_or_default();
    let helper = helper_text.clone().unwrap_or_default();
    let label_text = label.clone().unwrap_or_default();
    let at_max = max.is_some_and(|limit| held.len() as f64 >= limit);
    let offers = offers_of(&suggestion_list, &held, &label_map, &draft());
    let list_open = has_suggestions && open() && !offers.is_empty();

    // The highlight as an option id (the combobox's active descendant);
    // scrolled into view once the render that moved it has landed.
    let active_now = active();
    let active_id = if list_open {
        active_now
            .filter(|&index| index < offers.len())
            .map(|index| format!("{instance}-option-{index}"))
    } else {
        None
    };
    let mut mirrored_highlight = use_signal(|| None::<String>);
    if active_id != *mirrored_highlight.peek() {
        mirrored_highlight.set(active_id.clone());
    }
    wasm::follow_highlight(root, mirrored_highlight);

    // Ask the host for the next list (controlled), as the element's
    // `#request` emitting `ty-change`.
    let request = {
        move |next: Vec<String>| {
            if let Some(handler) = on_change {
                handler.call(TagFieldChange {
                    value: json_list(&next),
                });
            }
        }
    };

    // A successful commit also resets the draft and closes the popup — the
    // element's `#commit`.
    let commit = {
        let held = held.clone();
        let suggestion_list = suggestion_list.clone();
        move |raw: String| {
            let Some(take) = judge(&raw, &held, max, free_text, &suggestion_list) else {
                return;
            };
            let mut next = held.clone();
            next.push(take);
            request(next);
            draft.set(String::new());
            open.set(false);
            active.set(None);
        }
    };

    // A remove control: ask for the list without the value, focus back on
    // the entry — the element's `#drop`.
    let drop_value = {
        let held = held.clone();
        move |dropped: String| {
            if disabled || !held.contains(&dropped) {
                return;
            }
            request(held.iter().filter(|value| **value != dropped).cloned().collect());
            wasm::focus_input(input);
        }
    };

    // The pill list's accessible name: `{field}` is the label (or the
    // accessible label); an empty field strips the ": " prefix.
    let field_name = if !label_text.is_empty() {
        label_text.clone()
    } else {
        accessible_label.clone().unwrap_or_default()
    };
    let chosen = chosen_label.replace("{field}", &field_name);
    let chips_name = if field_name.is_empty() {
        strip_field_prefix(&chosen).to_string()
    } else {
        chosen
    };

    let describedby: Vec<String> = [
        (!helper.is_empty()).then(|| format!("{instance}-note")),
        (!error.is_empty()).then(|| format!("{instance}-fault")),
    ]
    .into_iter()
    .flatten()
    .collect();

    rsx! {
        ty-tag-field {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "value": value.as_deref().filter(|v| !v.is_empty()),
            "suggestions": suggestions.as_deref().filter(|v| !v.is_empty()),
            "suggestion-labels": suggestion_labels.as_deref().filter(|v| !v.is_empty()),
            "allow-free-text": allow_free_text.as_deref().filter(|v| !v.is_empty()),
            "max": max.map(|v| v.to_string()),
            "disabled": disabled.then_some("true"),
            "tone": Some(tone.as_str()),
            "category-index": category.map(|v| v.to_string()),
            "label": label.as_deref().filter(|v| !v.is_empty()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "placeholder": placeholder.as_deref().filter(|v| !v.is_empty()),
            "helper-text": helper_text.as_deref().filter(|v| !v.is_empty()),
            "error-text": error_text.as_deref().filter(|v| !v.is_empty()),
            "remove-label": (!remove_label.is_empty()).then_some(remove_label.as_str()),
            "chosen-label": (!chosen_label.is_empty()).then_some(chosen_label.as_str()),
            "suggestions-label": (!suggestions_label.is_empty()).then_some(suggestions_label.as_str()),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            div {
                class: "ty-tag-field",
                "data-tone": if category.is_some() { "category" } else { tone.as_str() },
                style: category.map(|n| format!("--ty-tag-field-tint: var(--ty-categorical-{n})")),
                "data-invalid": (!error.is_empty()).then_some(""),
                "data-testid": test_id.as_deref().filter(|v| !v.is_empty()),
                onmounted: move |event: MountedEvent| root.set(Some(event.data())),
                label {
                    class: "ty-tag-field__caption",
                    "for": "{instance}-input",
                    hidden: label_text.is_empty(),
                    "{label_text}"
                }
                div {
                    class: "ty-tag-field__frame",
                    div {
                        class: "ty-tag-field__well",
                        "data-disabled": disabled.then_some(""),
                        // A click on the entry re-opens the suggestions:
                        // focus alone does not re-fire on an input that never
                        // lost focus.
                        onclick: {
                            let offers = offers.clone();
                            move |_| {
                                if !has_suggestions || *open.peek() {
                                    return;
                                }
                                open.set(true);
                                if active.peek().is_none() {
                                    active.set((!offers.is_empty()).then_some(0));
                                }
                            }
                        },
                        span {
                            class: "ty-tag-field__chips",
                            span {
                                class: "ty-tag-field__chip-list",
                                "role": "list",
                                "aria-label": chips_name.clone(),
                                for held_value in &held {
                                    span {
                                        key: "{held_value}",
                                        class: "ty-tag-field__chip",
                                        "role": "listitem",
                                        span {
                                            class: "ty-tag-field__chip-text",
                                            "{shown(held_value, &label_map)}"
                                        }
                                        button {
                                            class: "ty-tag-field__drop",
                                            "type": "button",
                                            "aria-label": remove_label.replace("{value}", shown(held_value, &label_map)),
                                            "data-value": "{held_value}",
                                            disabled: disabled,
                                            onclick: {
                                                let dropped = held_value.clone();
                                                let drop_value = drop_value.clone();
                                                move |_| drop_value(dropped.clone())
                                            },
                                            svg {
                                                class: "ty-icon",
                                                "viewBox": "0 0 24 24",
                                                "fill": "none",
                                                "stroke": "currentColor",
                                                "stroke-width": "2",
                                                "stroke-linecap": "round",
                                                "stroke-linejoin": "round",
                                                "aria-hidden": "true",
                                                "focusable": "false",
                                                path { "d": "M18 6 6 18" }
                                                path { "d": "m6 6 12 12" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        span {
                            class: "ty-tag-field__typing-host",
                            input {
                                class: "ty-tag-field__typing",
                                "id": "{instance}-input",
                                "type": "text",
                                "autocomplete": "off",
                                "placeholder": placeholder.as_deref().filter(|v| !v.is_empty()),
                                disabled: disabled || at_max,
                                "aria-invalid": (!error.is_empty()).then_some("true"),
                                "aria-label": if label_text.is_empty() { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                                "aria-describedby": (!describedby.is_empty()).then(|| describedby.join(" ")),
                                "role": has_suggestions.then_some("combobox"),
                                "aria-expanded": has_suggestions.then_some(if list_open { "true" } else { "false" }),
                                "aria-controls": has_suggestions.then(|| format!("{instance}-listbox")),
                                "aria-autocomplete": has_suggestions.then_some("list"),
                                "aria-activedescendant": active_id.clone(),
                                onmounted: move |event: MountedEvent| input.set(Some(event.data())),
                                oninput: {
                                    let suggestion_list = suggestion_list.clone();
                                    let held = held.clone();
                                    let label_map = label_map.clone();
                                    move |event: FormEvent| {
                                        let text = event.value();
                                        draft.set(text.clone());
                                        if has_suggestions {
                                            open.set(true);
                                        }
                                        // The first offer is highlighted while
                                        // typing, so Enter commits the filtered
                                        // match without an arrow key first.
                                        active.set(
                                            (!offers_of(&suggestion_list, &held, &label_map, &text).is_empty())
                                                .then_some(0),
                                        );
                                    }
                                },
                                onfocus: {
                                    let offers = offers.clone();
                                    move |_| {
                                        if !has_suggestions {
                                            return;
                                        }
                                        open.set(true);
                                        if active.peek().is_none() {
                                            active.set((!offers.is_empty()).then_some(0));
                                        }
                                    }
                                },
                                onkeydown: {
                                    let offers = offers.clone();
                                    let held = held.clone();
                                    let mut commit = commit.clone();
                                    move |event: KeyboardEvent| {
                                        if disabled {
                                            return;
                                        }
                                        let key = event.key();
                                        // The commit keys are always ours (a
                                        // comma never reaches the text).
                                        let commit_key = matches!(key, Key::Enter)
                                            || matches!(&key, Key::Character(text) if text == ",");
                                        if commit_key {
                                            event.prevent_default();
                                            let picked = if *open.peek() {
                                                active.peek().and_then(|index| offers.get(index))
                                            } else {
                                                None
                                            };
                                            let raw = picked
                                                .map(|offer| offer.id.clone())
                                                .unwrap_or_else(|| draft.peek().clone());
                                            commit(raw);
                                            return;
                                        }
                                        match key {
                                            Key::Backspace => {
                                                if !draft.peek().is_empty() || held.is_empty() {
                                                    return;
                                                }
                                                event.prevent_default();
                                                request(held[..held.len() - 1].to_vec());
                                            }
                                            Key::ArrowDown | Key::ArrowUp => {
                                                if !has_suggestions || offers.is_empty() {
                                                    return;
                                                }
                                                event.prevent_default();
                                                let count = offers.len();
                                                let next = if key == Key::ArrowDown {
                                                    match *active.peek() {
                                                        None => 0,
                                                        Some(index) => (index + 1) % count,
                                                    }
                                                } else {
                                                    match *active.peek() {
                                                        None | Some(0) => count - 1,
                                                        Some(index) => index - 1,
                                                    }
                                                };
                                                active.set(Some(next));
                                                open.set(true);
                                            }
                                            Key::Escape => {
                                                if !*open.peek() {
                                                    return;
                                                }
                                                event.prevent_default();
                                                open.set(false);
                                                active.set(None);
                                            }
                                            _ => {}
                                        }
                                    }
                                },
                            }
                        }
                    }
                    div {
                        class: "ty-tag-field__menu-layer",
                        hidden: !list_open,
                        ul {
                            class: "ty-tag-field__menu",
                            "id": "{instance}-listbox",
                            "role": "listbox",
                            "aria-label": suggestions_label.clone(),
                            if list_open {
                                for (index, offer) in offers.iter().enumerate() {
                                    li {
                                        key: "{offer.id}",
                                        class: "ty-tag-field__choice",
                                        "role": "option",
                                        "id": "{instance}-option-{index}",
                                        "data-value": "{offer.id}",
                                        "aria-selected": if active_now == Some(index) { "true" } else { "false" },
                                        "data-focused": (active_now == Some(index)).then_some(""),
                                        // Options commit on mousedown with the
                                        // default prevented, so the entry never
                                        // loses focus.
                                        onmousedown: {
                                            let id = offer.id.clone();
                                            let mut commit = commit.clone();
                                            move |event: MouseEvent| {
                                                event.prevent_default();
                                                commit(id.clone());
                                            }
                                        },
                                        "{offer.text}"
                                    }
                                }
                            }
                        }
                    }
                }
                p {
                    class: "ty-tag-field__note",
                    "id": "{instance}-note",
                    hidden: helper.is_empty(),
                    "{helper}"
                }
                p {
                    class: "ty-tag-field__fault",
                    "id": "{instance}-fault",
                    hidden: error.is_empty(),
                    "{error}"
                }
            }
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    pub fn mirror_draft(_input: Signal<Option<Rc<MountedData>>>, _draft: Signal<String>) {}

    pub fn wire_focusout(
        _root: Signal<Option<Rc<MountedData>>>,
        _open: Signal<bool>,
        _active: Signal<Option<usize>>,
    ) {
    }

    pub fn follow_highlight(_root: Signal<Option<Rc<MountedData>>>, _highlight: Signal<Option<String>>) {}

    pub fn focus_input(_input: Signal<Option<Rc<MountedData>>>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    /// The draft is the input's own text, a property rather than an
    /// attribute: mirror the state in without disturbing the caret (a no-op
    /// while the user types); after a commit the draft is empty and the
    /// input follows.
    pub fn mirror_draft(input: Signal<Option<Rc<MountedData>>>, draft: Signal<String>) {
        use_effect(move || {
            let Some(field) = input_element(input) else { return };
            let text = draft();
            if field.value() != text {
                field.set_value(&text);
            }
        });
    }

    /// The popup closes when focus leaves the field — the element's
    /// `#onFocusOut`, which only the live DOM can judge (the related target).
    pub fn wire_focusout(
        root: Signal<Option<Rc<MountedData>>>,
        mut open: Signal<bool>,
        mut active: Signal<Option<usize>>,
    ) {
        struct Listener {
            target: web_sys::EventTarget,
            closure: Closure<dyn FnMut(web_sys::Event)>,
        }
        impl Drop for Listener {
            fn drop(&mut self) {
                let _ = self
                    .target
                    .remove_event_listener_with_callback("focusout", self.closure.as_ref().unchecked_ref());
            }
        }

        let mut registered = use_signal(|| None::<Rc<Listener>>);
        use_effect(move || {
            if registered.peek().is_some() {
                return;
            }
            let Some(element) = host_element(root) else { return };
            let host = element.clone();
            let target: web_sys::EventTarget = element.into();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                let next = event
                    .dyn_ref::<web_sys::FocusEvent>()
                    .and_then(|focus| focus.related_target())
                    .and_then(|target| target.dyn_into::<web_sys::Node>().ok());
                if next.as_ref().is_some_and(|node| host.contains(Some(node))) {
                    return;
                }
                if !*open.peek() {
                    return;
                }
                open.set(false);
                active.set(None);
            });
            if target
                .add_event_listener_with_callback("focusout", closure.as_ref().unchecked_ref())
                .is_ok()
            {
                registered.set(Some(Rc::new(Listener { target, closure })));
            }
        });
    }

    /// Scroll the highlighted option into view (`block: "nearest"`) once the
    /// render that moved the highlight has landed, as the element did after
    /// its `#sync`.
    pub fn follow_highlight(root: Signal<Option<Rc<MountedData>>>, highlight: Signal<Option<String>>) {
        use_effect(move || {
            let Some(id) = highlight() else { return };
            if host_element(root).is_none() {
                return;
            }
            let Some(target) = web_sys::window()
                .and_then(|window| window.document())
                .and_then(|document| document.get_element_by_id(&id))
            else {
                return;
            };
            let options = web_sys::ScrollIntoViewOptions::new();
            options.set_block(web_sys::ScrollLogicalPosition::Nearest);
            target.scroll_into_view_with_scroll_into_view_options(&options);
        });
    }

    /// Focus back on the input after a remove control ran.
    pub fn focus_input(input: Signal<Option<Rc<MountedData>>>) {
        if let Some(field) = input_element(input) {
            let _ = field.focus();
        }
    }

    fn input_element(input: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::HtmlInputElement> {
        input()?
            .downcast::<web_sys::Element>()
            .cloned()?
            .dyn_into::<web_sys::HtmlInputElement>()
            .ok()
    }

    fn host_element(root: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        root()?.downcast::<web_sys::Element>().cloned()
    }
}
