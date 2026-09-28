//! Native port of `<ty-text-field>`: a native `<input>` inside, so typing,
//! keyboard, autofill and form participation (submit, reset, validation)
//! are the platform's, as in the custom element. On top of that the port
//! keeps what the element added in script: the controlled `value` mirrored
//! into the input's value property (a no-op while the user types, so the
//! caret stays put), `default-value` applied once (the value a form reset
//! returns to), the clear action (its button, or Escape in search mode —
//! emptying the value, reporting the native input and `ty-clear`, focus
//! back on the input), the password reveal (the input's type, the action's
//! `aria-pressed` and name), the character counter and the over-limit
//! state. The counter text, the over-limit styling hooks and the clear
//! action's visibility are painted onto the DOM after mount, exactly as
//! the element did after the first paint, so SSR stays the rendered
//! anatomy.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// `search` adds the magnifier and the clear action (Escape clears); `password` adds the reveal action.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum TextFieldMode {
    #[default]
    Text,
    Search,
    Password,
}

impl TextFieldMode {
    pub const fn as_str(self) -> &'static str {
        match self {
            TextFieldMode::Text => "text",
            TextFieldMode::Search => "search",
            TextFieldMode::Password => "password",
        }
    }
}

/// Native type for `mode="text"` (`text` when unset); `mode` wins when both are set.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum TextFieldInputType {
    Text,
    Email,
    Url,
    Tel,
    Number,
}

impl TextFieldInputType {
    pub const fn as_str(self) -> &'static str {
        match self {
            TextFieldInputType::Text => "text",
            TextFieldInputType::Email => "email",
            TextFieldInputType::Url => "url",
            TextFieldInputType::Tel => "tel",
            TextFieldInputType::Number => "number",
        }
    }
}

/// Surface treatment of the group.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum TextFieldAppearance {
    #[default]
    Outlined,
    Filled,
}

impl TextFieldAppearance {
    pub const fn as_str(self) -> &'static str {
        match self {
            TextFieldAppearance::Outlined => "outlined",
            TextFieldAppearance::Filled => "filled",
        }
    }
}

/// The native input of the field; `value` is the whole text.
#[derive(Clone, Debug, PartialEq)]
pub struct TextFieldInput {
    pub value: String,
}

/// The clear action: empty the value, report the native input and
/// `ty-clear`, and return focus to the input — no-op while the field is
/// empty, disabled or read-only, as in the element.
fn clear_field(
    mut state: Signal<String>,
    input: Signal<Option<Rc<MountedData>>>,
    disabled: bool,
    read_only: bool,
    oninput: Option<EventHandler<TextFieldInput>>,
    on_clear: Option<EventHandler<()>>,
) {
    if disabled || read_only || state.peek().is_empty() {
        return;
    }
    state.set(String::new());
    if let Some(handler) = oninput {
        handler.call(TextFieldInput { value: String::new() });
    }
    if let Some(handler) = on_clear {
        handler.call(());
    }
    wasm::focus_input(input);
}

/// Single-line text entry: plain, search and password. A native <input> inside, so typing, keyboard, autofill and form participation are the platform's; the element adds the clear action (search mode, or `clearable`), the reveal action (password mode), the character counter and the over-limit state.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyTextField(
    /// `search` adds the magnifier and the clear action (Escape clears); `password` adds the reveal action.
    #[props(default)]
    mode: TextFieldMode,
    /// Native type for `mode="text"` (`text` when unset); `mode` wins when both are set.
    #[props(default)]
    input_type: Option<TextFieldInputType>,
    /// Controlled text; the element mirrors it into the input (while the user types, the live value is the input's own).
    #[props(into)]
    value: Option<String>,
    /// Initial text of an uncontrolled field, applied once on connect; a form reset returns to it.
    #[props(into)]
    default_value: Option<String>,
    /// Surface treatment of the group.
    #[props(default)]
    appearance: TextFieldAppearance,
    /// The clear action outside search mode (search always has it); shown while the field is non-empty and editable.
    #[props(default)]
    clearable: bool,
    /// Accessible name of the clear action.
    #[props(into, default = String::from("Clear"))]
    clear_label: String,
    /// Accessible name of the reveal action while the password is hidden.
    #[props(into, default = String::from("Show password"))]
    show_password_label: String,
    /// Accessible name of the reveal action while the password is shown.
    #[props(into, default = String::from("Hide password"))]
    hide_password_label: String,
    /// Counted for the counter and the over-limit state; typing is not cut off.
    max_length: Option<f64>,
    /// A character counter under the field (needs `maxLength`).
    #[props(default)]
    show_counter: bool,
    /// Counter template; `{count}` and `{max}` are filled in.
    #[props(into, default = String::from("{count} of {max} characters"))]
    counter_label: String,
    /// Counter template past the limit; `{over}` is the excess.
    #[props(into, default = String::from("{count} of {max} characters, {over} over the limit"))]
    over_limit_label: String,
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
    /// Native autocomplete hint.
    #[props(into)]
    auto_complete: Option<String>,
    /// Accessible name when there is no visible label.
    #[props(into)]
    accessible_label: Option<String>,
    /// `aria-labelledby` from a surrounding field (used when there is no visible label and no `accessibleLabel`).
    #[props(into)]
    labelled_by: Option<String>,
    /// `aria-describedby` from a surrounding field, joined before the field's own parts.
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
    /// The visible label, targeting the input.
    label: Option<Element>,
    /// Help text above the group, announced as the description.
    hint: Option<Element>,
    /// The error message; marks the field invalid and is announced.
    error: Option<Element>,
    /// Confirmation of a valid value; only without an error, and hidden while over the limit.
    success: Option<Element>,
    /// A decorative leading icon; wins over the search magnifier.
    leading: Option<Element>,
    /// The native input of the field; `value` is the whole text.
    oninput: Option<EventHandler<TextFieldInput>>,
    /// The clear action ran (its button, or Escape in search mode); the value is already empty and focus is back on the input.
    on_clear: Option<EventHandler<()>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_label = label.is_some();
    let slot_hint = hint.is_some();
    let slot_error = error.is_some();
    let slot_success = success.is_some();
    let slot_leading = leading.is_some();

    // Uncontrolled with a mirrored prop: the parent may move `value`,
    // otherwise the input's own typing drives the state; `default-value`
    // is only the seed of an uncontrolled field.
    let mut state = use_signal(|| {
        value
            .clone()
            .or_else(|| default_value.clone())
            .unwrap_or_default()
    });
    let mut mirrored_value = use_signal(|| value.clone());
    if value != *mirrored_value.peek() {
        mirrored_value.set(value.clone());
        if let Some(text) = value.clone() {
            state.set(text);
        }
    }
    let mut revealed = use_signal(|| false);

    let mut root = use_signal(|| None::<Rc<MountedData>>);
    let mut input = use_signal(|| None::<Rc<MountedData>>);
    wasm::mirror_value(input, state, default_value.clone());
    wasm::track_state(
        root,
        input,
        state,
        max_length,
        invalid,
        slot_error,
        disabled,
        read_only,
        counter_label.clone(),
        over_limit_label.clone(),
    );

    let reveal_label = if revealed() {
        hide_password_label.as_str()
    } else {
        show_password_label.as_str()
    };

    rsx! {
        ty-text-field {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "mode": Some(mode.as_str()),
            "input-type": input_type.map(|v| v.as_str()),
            "value": value.as_deref().filter(|v| !v.is_empty()),
            "default-value": default_value.as_deref().filter(|v| !v.is_empty()),
            "appearance": Some(appearance.as_str()),
            "clearable": clearable.then_some(""),
            "clear-label": (!clear_label.is_empty()).then_some(clear_label.as_str()),
            "show-password-label": (!show_password_label.is_empty()).then_some(show_password_label.as_str()),
            "hide-password-label": (!hide_password_label.is_empty()).then_some(hide_password_label.as_str()),
            "max-length": max_length.map(|v| v.to_string()),
            "show-counter": show_counter.then_some(""),
            "counter-label": (!counter_label.is_empty()).then_some(counter_label.as_str()),
            "over-limit-label": (!over_limit_label.is_empty()).then_some(over_limit_label.as_str()),
            "required": required.then_some("true"),
            "disabled": disabled.then_some("true"),
            "read-only": read_only.then_some(""),
            "invalid": invalid.then_some(""),
            "name": name.as_deref().filter(|v| !v.is_empty()),
            "placeholder": placeholder.as_deref().filter(|v| !v.is_empty()),
            "autocomplete": auto_complete.as_deref().filter(|v| !v.is_empty()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "labelled-by": labelled_by.as_deref().filter(|v| !v.is_empty()),
            "described-by": described_by.as_deref().filter(|v| !v.is_empty()),
            "control-id": control_id.as_deref().filter(|v| !v.is_empty()),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            div {
                class: "ty-text-field",
                "data-appearance": Some(appearance.as_str()),
                "data-mode": Some(mode.as_str()),
                "data-invalid": if invalid || slot_error { Some("") } else { None },
                "data-readonly": read_only.then_some(""),
                "data-disabled": disabled.then_some(""),
                "data-testid": test_id.as_deref().filter(|v| !v.is_empty()),
                onmounted: move |event| root.set(Some(event.data())),
                if slot_label {
                    label {
                        class: "ty-text-field__label",
                        "for": control_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-input"))),
                        {label.clone()}
                    }
                }
                if slot_hint {
                    p {
                        class: "ty-text-field__hint",
                        "id": Some(format!("{instance}-hint")),
                        {hint.clone()}
                    }
                }
                div {
                    class: "ty-text-field__group",
                    if slot_leading {
                        span {
                            class: "ty-text-field__leading",
                            "aria-hidden": Some("true"),
                            {leading.clone()}
                        }
                    }
                    if mode == TextFieldMode::Search && !slot_leading {
                        span {
                            class: "ty-text-field__leading",
                            "aria-hidden": Some("true"),
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
                                circle {
                                    class: "ty-text-field__glyph",
                                    "cx": Some("11"),
                                    "cy": Some("11"),
                                    "r": Some("8"),
                                }
                                path {
                                    class: "ty-text-field__glyph",
                                    "d": Some("m21 21-4.34-4.34"),
                                }
                            }
                        }
                    }
                    input {
                        class: "ty-text-field__input",
                        "id": control_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-input"))),
                        "type": if mode == TextFieldMode::Password && revealed() { Some("text") } else { match input_type { Some(TextFieldInputType::Text) => Some("text"), Some(TextFieldInputType::Email) => Some("email"), Some(TextFieldInputType::Url) => Some("url"), Some(TextFieldInputType::Tel) => Some("tel"), Some(TextFieldInputType::Number) => Some("number"), None => match mode { TextFieldMode::Text => Some("text"), TextFieldMode::Search => Some("search"), TextFieldMode::Password => Some("password") } } },
                        "name": name.as_deref().filter(|v| !v.is_empty()),
                        "placeholder": placeholder.as_deref().filter(|v| !v.is_empty()),
                        "autocomplete": auto_complete.as_deref().filter(|v| !v.is_empty()),
                        disabled: disabled,
                        readonly: read_only,
                        required: required,
                        "aria-label": if !slot_label { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                        "aria-labelledby": if !slot_label && !(accessible_label.as_deref().is_some_and(|v| !v.is_empty())) { labelled_by.as_deref().filter(|v| !v.is_empty()) } else { None },
                        "aria-describedby": { let ids: Vec<String> = [described_by.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()), if slot_hint { Some(format!("{instance}-hint")) } else { None }, if slot_error { Some(format!("{instance}-error")) } else { None }, if slot_success && !slot_error { Some(format!("{instance}-success")) } else { None }, if show_counter && max_length.is_some() { Some(format!("{instance}-counter")) } else { None }].into_iter().flatten().collect(); (!ids.is_empty()).then_some(ids.join(" ")) },
                        "aria-invalid": if invalid || slot_error { Some("true") } else { None },
                        onmounted: move |event| input.set(Some(event.data())),
                        oninput: move |event: FormEvent| {
                            let text = event.value();
                            state.set(text.clone());
                            if let Some(handler) = oninput {
                                handler.call(TextFieldInput { value: text });
                            }
                        },
                        onkeydown: move |event: KeyboardEvent| {
                            if mode == TextFieldMode::Search && event.key() == Key::Escape {
                                clear_field(state, input, disabled, read_only, oninput, on_clear);
                            }
                        },
                    }
                    if clearable || mode == TextFieldMode::Search {
                        button {
                            class: "ty-text-field__clear ty-text-field__action",
                            "type": Some("button"),
                            "aria-label": (!clear_label.is_empty()).then_some(clear_label.as_str()),
                            onclick: move |_| {
                                clear_field(state, input, disabled, read_only, oninput, on_clear);
                            },
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
                                    class: "ty-text-field__glyph",
                                    "d": Some("M18 6 6 18"),
                                }
                                path {
                                    class: "ty-text-field__glyph",
                                    "d": Some("m6 6 12 12"),
                                }
                            }
                        }
                    }
                    if mode == TextFieldMode::Password {
                        button {
                            class: "ty-text-field__reveal ty-text-field__action",
                            "type": Some("button"),
                            "aria-label": (!reveal_label.is_empty()).then_some(reveal_label),
                            "aria-pressed": if revealed() { Some("true") } else { Some("false") },
                            disabled: disabled,
                            onclick: move |_| {
                                revealed.set(!revealed());
                            },
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
                                g {
                                    class: "ty-text-field__eye",
                                    path {
                                        class: "ty-text-field__glyph",
                                        "d": Some("M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"),
                                    }
                                    circle {
                                        class: "ty-text-field__glyph",
                                        "cx": Some("12"),
                                        "cy": Some("12"),
                                        "r": Some("3"),
                                    }
                                }
                                g {
                                    class: "ty-text-field__eye-off",
                                    path {
                                        class: "ty-text-field__glyph",
                                        "d": Some("M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"),
                                    }
                                    path {
                                        class: "ty-text-field__glyph",
                                        "d": Some("M14.084 14.158a3 3 0 0 1-4.242-4.242"),
                                    }
                                    path {
                                        class: "ty-text-field__glyph",
                                        "d": Some("M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"),
                                    }
                                    path {
                                        class: "ty-text-field__glyph",
                                        "d": Some("m2 2 20 20"),
                                    }
                                }
                            }
                        }
                    }
                    if slot_success && !slot_error {
                        svg {
                            class: "ty-icon ty-text-field__success-mark",
                            "viewBox": Some("0 0 24 24"),
                            "fill": Some("none"),
                            "stroke": Some("currentColor"),
                            "stroke-width": Some("2"),
                            "stroke-linecap": Some("round"),
                            "stroke-linejoin": Some("round"),
                            "aria-hidden": Some("true"),
                            "focusable": Some("false"),
                            circle {
                                class: "ty-text-field__glyph",
                                "cx": Some("12"),
                                "cy": Some("12"),
                                "r": Some("10"),
                            }
                            path {
                                class: "ty-text-field__glyph",
                                "d": Some("m16 9-5.5 5.5L8 12"),
                            }
                        }
                    }
                }
                if slot_error {
                    p {
                        class: "ty-text-field__error",
                        "id": Some(format!("{instance}-error")),
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
                            circle {
                                class: "ty-text-field__glyph",
                                "cx": Some("12"),
                                "cy": Some("12"),
                                "r": Some("10"),
                            }
                            line {
                                class: "ty-text-field__glyph",
                                "x1": Some("12"),
                                "y1": Some("8"),
                                "x2": Some("12"),
                                "y2": Some("12"),
                            }
                            line {
                                class: "ty-text-field__glyph",
                                "x1": Some("12"),
                                "y1": Some("16"),
                                "x2": Some("12.01"),
                                "y2": Some("16"),
                            }
                        }
                        span {
                            class: "ty-text-field__error-text",
                            {error.clone()}
                        }
                    }
                }
                if slot_success && !slot_error {
                    p {
                        class: "ty-text-field__success",
                        "id": Some(format!("{instance}-success")),
                        {success.clone()}
                    }
                }
                if show_counter && max_length.is_some() {
                    p {
                        class: "ty-text-field__counter",
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

    pub fn mirror_value(
        _input: Signal<Option<Rc<MountedData>>>,
        _state: Signal<String>,
        _default_value: Option<String>,
    ) {
    }

    #[allow(clippy::too_many_arguments)]
    pub fn track_state(
        _root: Signal<Option<Rc<MountedData>>>,
        _input: Signal<Option<Rc<MountedData>>>,
        _state: Signal<String>,
        _max_length: Option<f64>,
        _invalid: bool,
        _slot_error: bool,
        _disabled: bool,
        _read_only: bool,
        _counter_label: String,
        _over_limit_label: String,
    ) {
    }

    pub fn focus_input(_input: Signal<Option<Rc<MountedData>>>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::JsCast;

    /// The input's text is a property, not an attribute: mirror the state
    /// in without disturbing the caret (a no-op while the user types), and
    /// apply `default-value` once — it is what a form reset returns to.
    pub fn mirror_value(
        input: Signal<Option<Rc<MountedData>>>,
        state: Signal<String>,
        default_value: Option<String>,
    ) {
        let mut applied = use_signal(|| false);
        use_effect(move || {
            let Some(field) = input_element(input) else { return };
            if !*applied.peek() {
                applied.set(true);
                if let Some(initial) = default_value.as_deref().filter(|v| !v.is_empty()) {
                    field.set_default_value(initial);
                }
            }
            let text = state();
            if field.value() != text {
                field.set_value(&text);
            }
        });
    }

    /// The counter, the over-limit state, the success parts and the clear
    /// action's visibility — painted onto the DOM after mount, as the
    /// element did after the first paint, so SSR never carries them.
    #[allow(clippy::too_many_arguments)]
    pub fn track_state(
        root: Signal<Option<Rc<MountedData>>>,
        input: Signal<Option<Rc<MountedData>>>,
        state: Signal<String>,
        max_length: Option<f64>,
        invalid: bool,
        slot_error: bool,
        disabled: bool,
        read_only: bool,
        counter_label: String,
        over_limit_label: String,
    ) {
        use_effect(move || {
            let Some(root) = root_element(root) else { return };
            let count = state().encode_utf16().count() as f64;
            let over = max_length.is_some_and(|max| count > max);
            if let Some(max) = max_length {
                if let Ok(Some(counter)) = root.query_selector(".ty-text-field__counter") {
                    let template = if over { &over_limit_label } else { &counter_label };
                    let text = template
                        .replace("{count}", &count.to_string())
                        .replace("{max}", &max.to_string())
                        .replace("{over}", &(count - max).to_string());
                    if counter.text_content().as_deref() != Some(text.as_str()) {
                        counter.set_text_content(Some(&text));
                    }
                    toggle(&counter, "data-over-limit", over);
                }
            }
            let invalid_now = over || invalid || slot_error;
            toggle(&root, "data-invalid", invalid_now);
            if let Some(field) = input_element(input) {
                if invalid_now {
                    let _ = field.set_attribute("aria-invalid", "true");
                } else {
                    let _ = field.remove_attribute("aria-invalid");
                }
            }
            // An over-limit field is not a success.
            for selector in [".ty-text-field__success", ".ty-text-field__success-mark"] {
                if let Ok(Some(part)) = root.query_selector(selector) {
                    toggle(&part, "hidden", over);
                }
            }
            // The clear action only while there is something to clear and the field is editable.
            if let Ok(Some(clear)) = root.query_selector(".ty-text-field__clear") {
                toggle(&clear, "hidden", count == 0.0 || disabled || read_only);
            }
        });
    }

    /// Focus back on the input after the clear action ran.
    pub fn focus_input(input: Signal<Option<Rc<MountedData>>>) {
        if let Some(field) = input_element(input) {
            let _ = field.focus();
        }
    }

    fn toggle(element: &web_sys::Element, name: &str, on: bool) {
        if on {
            let _ = element.set_attribute(name, "");
        } else {
            let _ = element.remove_attribute(name);
        }
    }

    fn input_element(input: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::HtmlInputElement> {
        input()?
            .downcast::<web_sys::Element>()
            .cloned()?
            .dyn_into::<web_sys::HtmlInputElement>()
            .ok()
    }

    fn root_element(root: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        root()?.downcast::<web_sys::Element>().cloned()
    }
}
