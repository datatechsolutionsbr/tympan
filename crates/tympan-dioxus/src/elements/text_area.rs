//! Native port of `<ty-text-area>`: a native `<textarea>` inside, so typing,
//! keyboard and form participation are the platform's, as in the custom
//! element. The component mirrors the controlled `value` into the area
//! without disturbing the caret (a no-op while the user types, as the
//! element's own `area.value !== value` guard did), applies `default-value`
//! once as the `defaultValue` a form reset returns to, keeps the character
//! counter and the over-limit state (past `max-length` the area is invalid,
//! never cut off) and grows the area with its content up to `max-rows` when
//! `auto-grow` is set. The value application, the counter text, the `rows`
//! measurement and the live `data-*` state are DOM effects — wasm only, like
//! the custom element's own script; SSR renders the same markup as the
//! generated binding.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// The native resize handle; `autoGrow` always disables it.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum TextAreaResize {
    #[default]
    Vertical,
    None,
}

impl TextAreaResize {
    pub const ALL: [TextAreaResize; 2] = [TextAreaResize::Vertical, TextAreaResize::None];

    pub const fn as_str(self) -> &'static str {
        match self {
            TextAreaResize::Vertical => "vertical",
            TextAreaResize::None => "none",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<TextAreaResize> {
        TextAreaResize::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// The native input of the textarea; `value` is the whole text.
#[derive(Clone, Debug, PartialEq)]
pub struct TextAreaInput {
    pub value: String,
}

/// Multi-line text entry. A native <textarea> inside, so input, keyboard and form participation are the platform's; the element adds the character counter, the over-limit state and auto-grow.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyTextArea(
    /// Controlled text; the element mirrors it into the textarea (while the user types, the live value is the textarea's own).
    #[props(into)]
    value: Option<String>,
    /// Initial text of an uncontrolled area, applied once on connect; a form reset returns to it.
    #[props(into)]
    default_value: Option<String>,
    /// Initial visible lines.
    #[props(default = 3.0f64)]
    rows: f64,
    /// Grows with the content up to `maxRows`, then scrolls.
    #[props(default)]
    auto_grow: bool,
    /// Growth limit of `autoGrow`; past it the area scrolls (`data-scrolling`).
    max_rows: Option<f64>,
    /// The native resize handle; `autoGrow` always disables it.
    #[props(default)]
    resize: TextAreaResize,
    /// Counted for the counter and the over-limit state; typing is not cut off.
    max_length: Option<f64>,
    /// A character counter under the area (needs `maxLength`).
    #[props(default)]
    show_counter: bool,
    /// Counter template; `{count}` and `{max}` are filled in.
    #[props(into, default = String::from("{count} of {max} characters"))]
    counter_label: String,
    /// Counter template past the limit; `{over}` is the excess.
    #[props(into, default = String::from("{count} of {max} characters, {over} over the limit"))]
    over_limit_label: String,
    /// Mono family for code, keys or JSON.
    #[props(default)]
    monospace: bool,
    /// Native required.
    #[props(default)]
    required: bool,
    /// Native disabled.
    #[props(default)]
    disabled: bool,
    /// Shown but not changeable.
    #[props(default)]
    read_only: bool,
    /// Painted and announced as invalid without an error message (a surrounding field marks it).
    #[props(default)]
    invalid: bool,
    /// Form field name.
    #[props(into)]
    name: Option<String>,
    /// Native placeholder.
    #[props(into)]
    placeholder: Option<String>,
    /// Accessible name when there is no visible label.
    #[props(into)]
    accessible_label: Option<String>,
    /// `aria-labelledby` from a surrounding field (used when there is no visible label and no `accessibleLabel`).
    #[props(into)]
    labelled_by: Option<String>,
    /// `aria-describedby` from a surrounding field, joined before the area's own parts.
    #[props(into)]
    described_by: Option<String>,
    /// Explicit id of the control (a surrounding field's control id); `<instance>-input` otherwise.
    #[props(into)]
    control_id: Option<String>,
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
    /// The visible label, targeting the area.
    label: Option<Element>,
    /// Help text under the area, announced as the description.
    hint: Option<Element>,
    /// The error message; marks the area invalid and is announced.
    error: Option<Element>,
    /// The native input of the textarea; `value` is the whole text.
    oninput: Option<EventHandler<TextAreaInput>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_label = label.is_some();
    let slot_hint = hint.is_some();
    let slot_error = error.is_some();

    // Uncontrolled with a mirrored prop: the parent may move `value`,
    // otherwise the user's own typing drives the state.
    let mut text = use_signal(|| {
        value
            .clone()
            .filter(|v| !v.is_empty())
            .or_else(|| default_value.clone())
            .unwrap_or_default()
    });
    let mut mirrored_value = use_signal(|| value.clone());
    if value != *mirrored_value.peek() {
        mirrored_value.set(value.clone());
        if let Some(new) = value.as_deref().filter(|v| !v.is_empty()) {
            text.set(new.to_string());
        }
    }

    let mut area = use_signal(|| None::<Rc<MountedData>>);
    wasm::apply_value(
        area,
        text,
        default_value.clone(),
        value.as_deref().is_some_and(|v| !v.is_empty()),
    );
    wasm::update_state(
        area,
        text,
        max_length,
        counter_label.clone(),
        over_limit_label.clone(),
        invalid,
        slot_error,
    );
    wasm::measure(area, text, auto_grow, rows, max_rows);

    rsx! {
        ty-text-area {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "value": value.as_deref().filter(|v| !v.is_empty()),
            "default-value": default_value.as_deref().filter(|v| !v.is_empty()),
            "rows": Some(rows.to_string()),
            "auto-grow": auto_grow.then_some(""),
            "max-rows": max_rows.map(|v| v.to_string()),
            "resize": Some(resize.as_str()),
            "max-length": max_length.map(|v| v.to_string()),
            "show-counter": show_counter.then_some(""),
            "counter-label": (!counter_label.is_empty()).then_some(counter_label.as_str()),
            "over-limit-label": (!over_limit_label.is_empty()).then_some(over_limit_label.as_str()),
            "monospace": monospace.then_some(""),
            "required": required.then_some("true"),
            "disabled": disabled.then_some("true"),
            "read-only": read_only.then_some(""),
            "invalid": invalid.then_some(""),
            "name": name.as_deref().filter(|v| !v.is_empty()),
            "placeholder": placeholder.as_deref().filter(|v| !v.is_empty()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "labelled-by": labelled_by.as_deref().filter(|v| !v.is_empty()),
            "described-by": described_by.as_deref().filter(|v| !v.is_empty()),
            "control-id": control_id.as_deref().filter(|v| !v.is_empty()),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            div {
                class: "ty-text-area",
                "data-resize": Some(resize.as_str()),
                "data-monospace": (monospace).then_some(""),
                "data-auto-grow": (auto_grow).then_some(""),
                "data-invalid": if invalid || slot_error { Some("") } else { None },
                "data-readonly": (read_only).then_some(""),
                "data-disabled": (disabled).then_some(""),
                "data-testid": test_id.as_deref().filter(|v| !v.is_empty()),
                if slot_label {
                    label {
                        class: "ty-text-area__label",
                        "for": control_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-input"))),
                        {label.clone()}
                    }
                }
                if slot_hint {
                    p {
                        class: "ty-text-area__hint",
                        "id": Some(format!("{instance}-hint")),
                        {hint.clone()}
                    }
                }
                textarea {
                    class: "ty-text-area__input",
                    "id": control_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-input"))),
                    "rows": Some(rows.to_string()),
                    "name": name.as_deref().filter(|v| !v.is_empty()),
                    "placeholder": placeholder.as_deref().filter(|v| !v.is_empty()),
                    disabled: disabled,
                    readonly: read_only,
                    required: required,
                    "aria-label": if !(slot_label) { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                    "aria-labelledby": if !(slot_label) && !(accessible_label.as_deref().is_some_and(|v| !v.is_empty())) { labelled_by.as_deref().filter(|v| !v.is_empty()) } else { None },
                    "aria-describedby": { let ids: Vec<String> = [described_by.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()), if slot_hint { Some(format!("{instance}-hint")) } else { None }, if slot_error { Some(format!("{instance}-error")) } else { None }, if show_counter && max_length.is_some() { Some(format!("{instance}-counter")) } else { None }].into_iter().flatten().collect(); (!ids.is_empty()).then_some(ids.join(" ")) },
                    "aria-invalid": if invalid || slot_error { Some("true") } else { None },
                    onmounted: move |event| area.set(Some(event.data())),
                    oninput: move |event: FormEvent| {
                        text.set(event.value());
                        if let Some(handler) = oninput {
                            handler.call(TextAreaInput { value: event.value() });
                        }
                    },
                }
                if slot_error {
                    p {
                        class: "ty-text-area__error",
                        "id": Some(format!("{instance}-error")),
                        svg {
                            class: "ty-icon",
                            "aria-hidden": Some("true"),
                            "focusable": Some("false"),
                            "width": Some("24"),
                            "height": Some("24"),
                            "viewBox": Some("0 0 24 24"),
                            "fill": Some("none"),
                            "stroke": Some("currentColor"),
                            "stroke-width": Some("2"),
                            "stroke-linecap": Some("round"),
                            "stroke-linejoin": Some("round"),
                            circle {
                                "cx": Some("12"),
                                "cy": Some("12"),
                                "r": Some("10"),
                            }
                            line {
                                "x1": Some("12"),
                                "y1": Some("8"),
                                "x2": Some("12"),
                                "y2": Some("12"),
                            }
                            line {
                                "x1": Some("12"),
                                "y1": Some("16"),
                                "x2": Some("12.01"),
                                "y2": Some("16"),
                            }
                        }
                        span {
                            {error.clone()}
                        }
                    }
                }
                if show_counter && max_length.is_some() {
                    p {
                        class: "ty-text-area__counter",
                        "id": Some(format!("{instance}-counter")),
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

    pub fn apply_value(
        _area: Signal<Option<Rc<MountedData>>>,
        _text: Signal<String>,
        _default_value: Option<String>,
        _controlled: bool,
    ) {
    }

    pub fn update_state(
        _area: Signal<Option<Rc<MountedData>>>,
        _text: Signal<String>,
        _max_length: Option<f64>,
        _counter_label: String,
        _over_limit_label: String,
        _invalid: bool,
        _has_error: bool,
    ) {
    }

    pub fn measure(
        _area: Signal<Option<Rc<MountedData>>>,
        _text: Signal<String>,
        _auto_grow: bool,
        _rows: f64,
        _max_rows: Option<f64>,
    ) {
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::JsCast;

    /// Controlled text in, without disturbing the caret while typing: the
    /// equality guard makes the write a no-op when the change came from the
    /// user's own typing. Uncontrolled, `default-value` is applied once as
    /// the `defaultValue`, so a form reset returns to it natively.
    pub fn apply_value(
        area: Signal<Option<Rc<MountedData>>>,
        text: Signal<String>,
        default_value: Option<String>,
        controlled: bool,
    ) {
        let mut applied = use_signal(|| false);
        use_effect(move || {
            let value = text();
            let Some(element) = area_element(area) else { return };
            if !controlled && !*applied.peek() {
                applied.set(true);
                if let Some(initial) = default_value.as_deref().filter(|v| !v.is_empty()) {
                    let _ = element.set_default_value(initial);
                }
            }
            if element.value() != value {
                element.set_value(&value);
            }
        });
    }

    /// The counter text and the over-limit state (also without a counter):
    /// past `max-length` the area is invalid, never cut off.
    pub fn update_state(
        area: Signal<Option<Rc<MountedData>>>,
        text: Signal<String>,
        max_length: Option<f64>,
        counter_label: String,
        over_limit_label: String,
        invalid: bool,
        has_error: bool,
    ) {
        use_effect(move || {
            let text = text();
            let Some(element) = area_element(area) else { return };
            let Some(root) = element.parent_element() else { return };
            // JS string length counts UTF-16 code units.
            let count = text.encode_utf16().count() as f64;
            let over = max_length.is_some_and(|max| count > max);
            if let Some(max) = max_length {
                if let Ok(Some(counter)) = root.query_selector(".ty-text-area__counter") {
                    let template = if over { over_limit_label.as_str() } else { counter_label.as_str() };
                    let content = template
                        .replace("{count}", &count.to_string())
                        .replace("{max}", &max.to_string())
                        .replace("{over}", &(count - max).to_string());
                    if counter.text_content().as_deref() != Some(content.as_str()) {
                        counter.set_text_content(Some(&content));
                    }
                    let _ = counter.toggle_attribute_with_force("data-over-limit", over);
                }
            }
            let invalid_now = over || invalid || has_error;
            let _ = root.toggle_attribute_with_force("data-invalid", invalid_now);
            if invalid_now {
                let _ = element.set_attribute("aria-invalid", "true");
            } else {
                let _ = element.remove_attribute("aria-invalid");
            }
        });
    }

    /// Auto-grow: hard lines, plus soft-wrapped lines where they can be
    /// measured, clamped to `max-rows`; past it the area scrolls
    /// (`data-scrolling`).
    pub fn measure(
        area: Signal<Option<Rc<MountedData>>>,
        text: Signal<String>,
        auto_grow: bool,
        rows: f64,
        max_rows: Option<f64>,
    ) {
        use_effect(move || {
            let _ = text();
            if !auto_grow {
                return;
            }
            let Some(element) = area_element(area) else { return };
            let lines = element.value().split('\n').count() as f64;
            let mut measured = 0.0f64;
            if let Some(window) = web_sys::window() {
                if let Ok(Some(style)) = window.get_computed_style(&element) {
                    if let Ok(line_height) = style.get_property_value("line-height") {
                        if let Some(line_height) = parse_float_prefix(&line_height) {
                            if line_height != 0.0 {
                                let previous = element.rows();
                                element.set_rows(1);
                                measured =
                                    ((f64::from(element.scroll_height()) - 0.5) / line_height).ceil();
                                element.set_rows(previous);
                            }
                        }
                    }
                }
            }
            let wanted = rows.max(lines).max(measured);
            let visible = max_rows.map_or(wanted, |max| wanted.min(max));
            if f64::from(element.rows()) != visible {
                element.set_rows(visible as u32);
            }
            if let Some(root) = element.parent_element() {
                let scrolling = max_rows.is_some_and(|max| wanted > max);
                let _ = root.toggle_attribute_with_force("data-scrolling", scrolling);
            }
        });
    }

    /// JS `parseFloat`: the longest prefix that parses as a number
    /// (`"24px"` is 24, `"normal"` is nothing).
    fn parse_float_prefix(value: &str) -> Option<f64> {
        let value = value.trim_start();
        (1..=value.len())
            .rev()
            .filter(|i| value.is_char_boundary(*i))
            .find_map(|i| value[..i].parse::<f64>().ok())
    }

    fn area_element(
        area: Signal<Option<Rc<MountedData>>>,
    ) -> Option<web_sys::HtmlTextAreaElement> {
        area()?
            .downcast::<web_sys::Element>()
            .cloned()?
            .dyn_into::<web_sys::HtmlTextAreaElement>()
            .ok()
    }
}
