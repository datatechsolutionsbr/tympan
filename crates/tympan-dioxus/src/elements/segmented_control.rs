//! Native port of `<ty-segmented-control>`: the track (the labelled radio
//! group with its size, width and disabled states) renders exactly as the
//! anatomy; the segments — a dynamic repetition the declarative anatomy
//! cannot express — are composed on the client after mount, exactly when
//! the custom element composed them on upgrade, so SSR stays the track
//! alone, as the fixtures capture. The behaviour is the element's: a press
//! selects the segment and re-selecting the selected one does nothing;
//! with `value` the control is controlled (the host answers `on_change`),
//! without it the selection is kept and mirrored into the host's `value`
//! attribute on commit; one tab stop on the selected segment, the arrow
//! keys move the selection and the focus (wrapping, Left/Right following
//! the reading direction), Home/End jump, and a haptic tick fires on touch
//! devices. The nodes the element reused to keep focus are simply
//! Dioxus's: the recomposed segments patch in place.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Visible height; the hit area stays at least 44 px on every size.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SegmentedControlSize {
    Compact,
    #[default]
    Regular,
    Large,
}

impl SegmentedControlSize {
    pub const fn as_str(self) -> &'static str {
        match self {
            SegmentedControlSize::Compact => "compact",
            SegmentedControlSize::Regular => "regular",
            SegmentedControlSize::Large => "large",
        }
    }
}

/// The selection changed; `value` is the new value. Only real changes fire it — re-selecting the selected segment does nothing.
#[derive(Clone, Debug, PartialEq)]
pub struct SegmentedControlChange {
    pub value: String,
}

/// One segment of the control: a string option is both value and label.
#[derive(Clone, Debug, PartialEq)]
struct Segment {
    value: String,
    label: String,
    /// The `d` of a 24×24 stroke path (lucide style).
    icon: Option<String>,
}

/// A parsed JSON value, only as deep as the `options` shape needs.
enum Json {
    String(String),
    Array(Vec<Json>),
    Object(Vec<(String, Json)>),
    Other,
}

struct Parser<'a> {
    text: &'a [u8],
    pos: usize,
}

impl<'a> Parser<'a> {
    fn new(text: &'a str) -> Self {
        Self {
            text: text.as_bytes(),
            pos: 0,
        }
    }

    fn ws(&mut self) {
        while matches!(self.text.get(self.pos), Some(b' ' | b'\t' | b'\n' | b'\r')) {
            self.pos += 1;
        }
    }

    fn value(&mut self) -> Option<Json> {
        self.ws();
        match *self.text.get(self.pos)? {
            b'"' => Some(Json::String(self.string()?)),
            b'[' => self.array(),
            b'{' => self.object(),
            b't' => self.literal("true"),
            b'f' => self.literal("false"),
            b'n' => self.literal("null"),
            _ => self.number(),
        }
    }

    fn literal(&mut self, literal: &str) -> Option<Json> {
        if self.text[self.pos..].starts_with(literal.as_bytes()) {
            self.pos += literal.len();
            Some(Json::Other)
        } else {
            None
        }
    }

    fn number(&mut self) -> Option<Json> {
        let start = self.pos;
        while matches!(
            self.text.get(self.pos),
            Some(b'0'..=b'9' | b'-' | b'+' | b'.' | b'e' | b'E')
        ) {
            self.pos += 1;
        }
        (self.pos > start).then_some(Json::Other)
    }

    fn string(&mut self) -> Option<String> {
        self.pos += 1; // the opening quote
        let mut out = String::new();
        loop {
            match *self.text.get(self.pos)? {
                b'"' => {
                    self.pos += 1;
                    return Some(out);
                }
                b'\\' => {
                    self.pos += 1;
                    match *self.text.get(self.pos)? {
                        b'"' => out.push('"'),
                        b'\\' => out.push('\\'),
                        b'/' => out.push('/'),
                        b'b' => out.push('\u{8}'),
                        b'f' => out.push('\u{c}'),
                        b'n' => out.push('\n'),
                        b'r' => out.push('\r'),
                        b't' => out.push('\t'),
                        b'u' => {
                            self.pos += 1;
                            let high = self.hex4()?;
                            let code = if (0xD800..0xDC00).contains(&high) {
                                if self.text.get(self.pos) == Some(&b'\\')
                                    && self.text.get(self.pos + 1) == Some(&b'u')
                                {
                                    self.pos += 2;
                                    let low = self.hex4()?;
                                    0x10000 + ((high - 0xD800) << 10) + (low.checked_sub(0xDC00)?)
                                } else {
                                    return None;
                                }
                            } else {
                                high
                            };
                            out.push(char::from_u32(code)?);
                        }
                        _ => return None,
                    }
                    self.pos += 1;
                }
                byte if byte < 0x20 => return None,
                _ => {
                    let rest = std::str::from_utf8(&self.text[self.pos..]).ok()?;
                    let ch = rest.chars().next()?;
                    out.push(ch);
                    self.pos += ch.len_utf8();
                }
            }
        }
    }

    fn hex4(&mut self) -> Option<u32> {
        let mut value = 0u32;
        for _ in 0..4 {
            let digit = match *self.text.get(self.pos)? {
                c @ b'0'..=b'9' => u32::from(c - b'0'),
                c @ b'a'..=b'f' => u32::from(c - b'a' + 10),
                c @ b'A'..=b'F' => u32::from(c - b'A' + 10),
                _ => return None,
            };
            value = value * 16 + digit;
            self.pos += 1;
        }
        Some(value)
    }

    fn array(&mut self) -> Option<Json> {
        self.pos += 1; // the opening bracket
        let mut items = Vec::new();
        self.ws();
        if self.text.get(self.pos) == Some(&b']') {
            self.pos += 1;
            return Some(Json::Array(items));
        }
        loop {
            items.push(self.value()?);
            self.ws();
            match *self.text.get(self.pos)? {
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
        self.pos += 1; // the opening brace
        let mut fields = Vec::new();
        self.ws();
        if self.text.get(self.pos) == Some(&b'}') {
            self.pos += 1;
            return Some(Json::Object(fields));
        }
        loop {
            self.ws();
            if self.text.get(self.pos) != Some(&b'"') {
                return None;
            }
            let key = self.string()?;
            self.ws();
            if self.text.get(self.pos) != Some(&b':') {
                return None;
            }
            self.pos += 1;
            let value = self.value()?;
            fields.push((key, value));
            self.ws();
            match *self.text.get(self.pos)? {
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

/// One array entry: a non-empty string is both value and label; an object
/// is `{ "value", "label", "icon"? }` with a non-empty string value and a
/// string label. Anything else is skipped, as the element's flatMap did.
fn segment_of(item: Json) -> Option<Segment> {
    match item {
        Json::String(value) if !value.is_empty() => Some(Segment {
            label: value.clone(),
            value,
            icon: None,
        }),
        Json::Object(fields) => {
            let field = |key: &str| fields.iter().find(|(name, _)| name == key).map(|(_, v)| v);
            let value = match field("value") {
                Some(Json::String(value)) if !value.is_empty() => value.clone(),
                _ => return None,
            };
            let label = match field("label") {
                Some(Json::String(label)) => label.clone(),
                _ => return None,
            };
            let icon = match field("icon") {
                Some(Json::String(icon)) => Some(icon.clone()),
                _ => None,
            };
            Some(Segment { value, label, icon })
        }
        _ => None,
    }
}

/// The parsed `options` JSON; an invalid value warns (on the client) and
/// renders nothing, as the element did. The flag is that invalid input.
fn parse_segments(raw: Option<&str>) -> (Vec<Segment>, bool) {
    let Some(raw) = raw else { return (Vec::new(), false) };
    let mut parser = Parser::new(raw);
    let parsed = parser.value().and_then(|json| {
        parser.ws();
        (parser.pos == parser.text.len()).then_some(json)
    });
    match parsed {
        Some(Json::Array(items)) => (items.into_iter().filter_map(segment_of).collect(), false),
        _ => (Vec::new(), true),
    }
}

/// Exactly one of a small set (two to five) of mutually exclusive options, changed in place — a radio group painted as segments. The segments are composed by the element from `options` (JSON); selecting the selected segment again does nothing. With `value` the control is controlled (the host answers `ty-change`); without it the element keeps the selection and mirrors it into the `value` attribute.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TySegmentedControl(
    /// The segments as a JSON array of `string` (both value and label) or `{ "value", "label", "icon"? }`; `icon` is the `d` of a 24×24 stroke path (lucide style).
    #[props(into)]
    options: Option<String>,
    /// The selected value (controlled). Unset, the element keeps the selection itself and mirrors it here.
    #[props(into)]
    value: Option<String>,
    /// The initially selected value when uncontrolled; the first option when unset.
    #[props(into)]
    default_value: Option<String>,
    /// Accessible name of the group (required).
    #[props(into)]
    label: Option<String>,
    /// Visible height; the hit area stays at least 44 px on every size.
    #[props(default)]
    size: SegmentedControlSize,
    /// The segments share the available width equally; labels truncate with the full label as the accessible name.
    #[props(default)]
    full_width: bool,
    /// The whole control disabled; the group is exposed as disabled and nothing selects.
    #[props(default)]
    disabled: bool,
    /// Hide the labels visually; each label stays the segment's accessible name.
    #[props(default)]
    icon_only: bool,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The selection changed; `value` is the new value. Only real changes fire it — re-selecting the selected segment does nothing.
    on_change: Option<EventHandler<SegmentedControlChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let options = options.as_deref().filter(|v| !v.is_empty());
    let (segments, invalid) = parse_segments(options);
    let mut warned = use_signal(|| false);
    if invalid && !*warned.peek() {
        warned.set(true);
        wasm::warn_invalid_options();
    }

    // Controlled from birth, as the element read `value` when it connected.
    let controlled = use_hook(|| value.is_some());

    // Uncontrolled with a mirrored prop: the parent may move `value`,
    // otherwise presses and keys drive the selection.
    let initial = value
        .clone()
        .or_else(|| default_value.clone())
        .or_else(|| segments.first().map(|segment| segment.value.clone()))
        .unwrap_or_default();
    let mut state = use_signal(|| initial);
    let mut mirrored_value = use_signal(|| value.clone());
    if value != *mirrored_value.peek() {
        mirrored_value.set(value.clone());
        if let Some(selected) = &value {
            state.set(selected.clone());
        }
    }

    // Uncontrolled, the element mirrored the selection into the host's
    // `value` attribute on commit; SSR has no attribute until then.
    let mut mirrored_selection = use_signal(|| None::<String>);

    // The custom element composed the segments on upgrade; the port renders
    // them once mounted on the client, so SSR stays the track alone.
    let upgraded = use_signal(|| false);
    wasm::compose_on_upgrade(upgraded);

    let mut host = use_signal(|| None::<Rc<MountedData>>);

    // Select `next`: `on_change` on a real change only, the uncontrolled
    // mirror as the element did; `move_focus` (the arrow keys) lands the
    // focus on the segment.
    let mut commit = move |next: String, move_focus: bool| {
        if disabled {
            return;
        }
        if next != *state.peek() {
            wasm::haptic_tick();
            if !controlled {
                state.set(next.clone());
                mirrored_selection.set(Some(next.clone()));
            }
            if let Some(handler) = on_change {
                handler.call(SegmentedControlChange { value: next.clone() });
            }
        }
        if move_focus {
            wasm::focus_segment(host, next);
        }
    };

    let current = state();
    let composed: Vec<(Segment, bool)> = if upgraded() {
        segments
            .iter()
            .map(|segment| (segment.clone(), segment.value == current))
            .collect()
    } else {
        Vec::new()
    };
    let values: Vec<String> = segments.iter().map(|segment| segment.value.clone()).collect();
    let mirrored = mirrored_selection();
    let host_value = if controlled {
        value.as_deref().filter(|v| !v.is_empty())
    } else {
        mirrored.as_deref()
    };

    rsx! {
        ty-segmented-control {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "options": options,
            "value": host_value,
            "default-value": default_value.as_deref().filter(|v| !v.is_empty()),
            "label": label.as_deref().filter(|v| !v.is_empty()),
            "size": Some(size.as_str()),
            "full-width": full_width.then_some(""),
            "disabled": disabled.then_some("true"),
            "icon-only": icon_only.then_some(""),
            div {
                class: "ty-segmented-control",
                "role": Some("radiogroup"),
                "aria-label": label.as_deref().filter(|v| !v.is_empty()),
                "aria-disabled": disabled.then_some("true"),
                "data-size": Some(size.as_str()),
                "data-full-width": full_width.then_some(""),
                "data-icon-only": icon_only.then_some(""),
                "data-disabled": disabled.then_some(""),
                onmounted: move |event| host.set(Some(event.data())),
                onkeydown: move |event: KeyboardEvent| {
                    if disabled || values.is_empty() {
                        return;
                    }
                    let key = event.key();
                    let rtl = wasm::is_rtl(host);
                    let delta: Option<isize> = match key {
                        Key::ArrowRight => Some(if rtl { -1 } else { 1 }),
                        Key::ArrowLeft => Some(if rtl { 1 } else { -1 }),
                        Key::ArrowDown => Some(1),
                        Key::ArrowUp => Some(-1),
                        _ => None,
                    };
                    let length = values.len() as isize;
                    let from = values
                        .iter()
                        .position(|v| *v == *state.peek())
                        .map(|index| index as isize)
                        .unwrap_or(0);
                    let to = if key == Key::Home {
                        0
                    } else if key == Key::End {
                        length - 1
                    } else if let Some(delta) = delta {
                        (from + delta + length) % length
                    } else {
                        return;
                    };
                    event.prevent_default();
                    commit(values[to as usize].clone(), true);
                },
                for (segment, selected) in composed {
                    button {
                        class: "ty-segmented-control__segment",
                        "type": Some("button"),
                        "role": Some("radio"),
                        "data-value": Some(segment.value.clone()),
                        "aria-checked": Some(if selected { "true" } else { "false" }),
                        "data-selected": selected.then_some(""),
                        disabled: disabled,
                        "data-disabled": disabled.then_some(""),
                        "tabindex": Some(if selected && !disabled { "0" } else { "-1" }),
                        "title": if full_width { Some(segment.label.clone()) } else { None },
                        "aria-label": if icon_only { Some(segment.label.clone()) } else { None },
                        onclick: move |_| commit(segment.value.clone(), false),
                        if let Some(icon) = &segment.icon {
                            svg {
                                class: "ty-icon",
                                "viewBox": Some("0 0 24 24"),
                                "fill": Some("none"),
                                "stroke": Some("currentColor"),
                                "stroke-width": Some("2"),
                                "stroke-linecap": Some("round"),
                                "stroke-linejoin": Some("round"),
                                "aria-hidden": Some("true"),
                                "focusable": Some("false"),
                                path {
                                    "d": Some(icon.clone()),
                                }
                            }
                        }
                        span {
                            class: if icon_only { "ty-visually-hidden" } else { "ty-segmented-control__label" },
                            {segment.label.clone()}
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

    pub fn compose_on_upgrade(_upgraded: Signal<bool>) {}

    pub fn focus_segment(_host: Signal<Option<Rc<MountedData>>>, _value: String) {}

    pub fn is_rtl(_host: Signal<Option<Rc<MountedData>>>) -> bool {
        false
    }

    pub fn haptic_tick() {}

    pub fn warn_invalid_options() {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::JsCast;
    use wasm_bindgen::JsValue;

    /// The element composed its segments on upgrade; effects do not run
    /// during SSR, so the flag flips after the first client render and
    /// hydration matches the script-free markup first.
    pub fn compose_on_upgrade(mut upgraded: Signal<bool>) {
        use_effect(move || upgraded.set(true));
    }

    /// Focus the segment for `value` — the arrow keys land the focus, as
    /// the element did after recomposing.
    pub fn focus_segment(host: Signal<Option<Rc<MountedData>>>, value: String) {
        let Some(root) = host_element(host) else { return };
        let Ok(segments) = root.query_selector_all(".ty-segmented-control__segment") else {
            return;
        };
        for index in 0..segments.length() {
            let Some(element) = segments
                .item(index)
                .and_then(|node| node.dyn_into::<web_sys::Element>().ok())
            else {
                continue;
            };
            if element.get_attribute("data-value").as_deref() == Some(value.as_str()) {
                if let Ok(segment) = element.dyn_into::<web_sys::HtmlElement>() {
                    let _ = segment.focus();
                }
                return;
            }
        }
    }

    /// The reading direction, from a `dir` attribute up the tree or the
    /// computed style, as the element resolved it.
    pub fn is_rtl(host: Signal<Option<Rc<MountedData>>>) -> bool {
        let Some(element) = host_element(host) else { return false };
        let dir = element
            .closest("[dir]")
            .ok()
            .flatten()
            .and_then(|ancestor| ancestor.get_attribute("dir"))
            .or_else(|| {
                web_sys::window()
                    .and_then(|window| window.document())
                    .and_then(|document| document.document_element())
                    .and_then(|root| root.get_attribute("dir"))
            });
        if let Some(dir) = dir {
            return dir.eq_ignore_ascii_case("rtl");
        }
        web_sys::window()
            .and_then(|window| window.get_computed_style(&element).ok().flatten())
            .and_then(|style| style.get_property_value("direction").ok())
            .is_some_and(|direction| direction == "rtl")
    }

    /// A short tick on touch devices, the React component's
    /// `requestHaptic('light')`, called from a user gesture. Reflective, so
    /// engines without the Vibration API simply do nothing.
    pub fn haptic_tick() {
        let Some(window) = web_sys::window() else { return };
        let window: JsValue = window.into();
        let Ok(navigator) = js_sys::Reflect::get(&window, &JsValue::from_str("navigator")) else {
            return;
        };
        let Ok(vibrate) = js_sys::Reflect::get(&navigator, &JsValue::from_str("vibrate")) else {
            return;
        };
        let Ok(vibrate) = vibrate.dyn_into::<js_sys::Function>() else { return };
        let _ = vibrate.call1(&navigator, &JsValue::from_f64(8.0));
    }

    /// The element's console warning for `options` that are not the JSON
    /// shape (it rendered nothing then too).
    pub fn warn_invalid_options() {
        web_sys::console::warn_1(&JsValue::from_str(
            "<ty-segmented-control>: options must be a JSON array of strings or { \"value\", \"label\", \"icon\"? } objects.",
        ));
    }

    fn host_element(host: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        host()?.downcast::<web_sys::Element>().cloned()
    }
}
