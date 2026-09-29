//! Native port of `<ty-native-select>`: a native `<select>` inside, so the
//! picker (the platform's own on touch devices), keyboard, screen-reader
//! support and form participation — submit, reset, validation — are the
//! platform's, as in the custom element. The port keeps the one thing the
//! element did in script: mirror the controlled `value` into the select's
//! value property on mount and whenever the prop moves (a no-op while it
//! already matches, so an open picker is never disturbed); while the user
//! chooses, the live value is the control's own.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// The native change of the select; `value` is the new value.
#[derive(Clone, Debug, PartialEq)]
pub struct NativeSelectChange {
    pub value: String,
}

/// One value from a short list with the platform select. A native <select> inside, so the picker on touch devices, keyboard, screen-reader support and form participation are the platform's. The options are the host's children.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyNativeSelect(
    /// The selected value; the element mirrors it into the control (while the user chooses, the live value is the control's own).
    #[props(into)]
    value: Option<String>,
    /// Text of the empty, disabled first option, shown while nothing is selected.
    #[props(into)]
    placeholder: Option<String>,
    /// Form field name; the selected value is sent.
    #[props(into)]
    name: Option<String>,
    /// Native required; the form will not submit while the empty option is the selection.
    #[props(default)]
    required: bool,
    /// Native disabled.
    #[props(default)]
    disabled: bool,
    /// Painted and announced as invalid without an error message (a surrounding field marks it).
    #[props(default)]
    invalid: bool,
    /// Accessible name when there is no visible label.
    #[props(into)]
    accessible_label: Option<String>,
    /// `aria-labelledby` from a surrounding field (used when there is no visible label and no `accessibleLabel`).
    #[props(into)]
    labelled_by: Option<String>,
    /// `aria-describedby` from a surrounding field, joined before the select's own parts.
    #[props(into)]
    described_by: Option<String>,
    /// Explicit id of the control (a surrounding field's control id); `<instance>-control` otherwise.
    #[props(into)]
    control_id: Option<String>,
    /// Test hook on the native select (`data-testid`).
    #[props(into)]
    test_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The `<option>` and `<optgroup>` children.
    children: Element,
    /// The visible label above the control.
    label: Option<Element>,
    /// Help text between the label and the control, announced as the description.
    hint: Option<Element>,
    /// The error message; marks the control invalid and is announced.
    error: Option<Element>,
    /// The native change of the select; `value` is the new value.
    onchange: Option<EventHandler<NativeSelectChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_label = label.is_some();
    let slot_hint = hint.is_some();
    let slot_error = error.is_some();

    // Controlled value in: the parent may move `value`, otherwise the
    // select's own choice stands — the state is never written back.
    let mut state = use_signal(|| value.clone());
    let mut mirrored_value = use_signal(|| value.clone());
    if value != *mirrored_value.peek() {
        mirrored_value.set(value.clone());
        state.set(value.clone());
    }

    let mut select = use_signal(|| None::<Rc<MountedData>>);
    wasm::apply_value(select, state);

    rsx! {
        ty-native-select {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "value": value.as_deref().filter(|v| !v.is_empty()),
            "placeholder": placeholder.as_deref().filter(|v| !v.is_empty()),
            "name": name.as_deref().filter(|v| !v.is_empty()),
            "required": required.then_some("true"),
            "disabled": disabled.then_some("true"),
            "invalid": invalid.then_some(""),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "labelled-by": labelled_by.as_deref().filter(|v| !v.is_empty()),
            "described-by": described_by.as_deref().filter(|v| !v.is_empty()),
            "control-id": control_id.as_deref().filter(|v| !v.is_empty()),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            div {
                class: "ty-native-select",
                "data-invalid": if invalid || slot_error { Some("") } else { None },
                "data-disabled": disabled.then_some(""),
                if slot_label {
                    label {
                        class: "ty-native-select__label",
                        "for": control_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-control"))),
                        {label.clone()}
                    }
                }
                if slot_hint {
                    p {
                        class: "ty-native-select__hint",
                        "id": Some(format!("{instance}-hint")),
                        {hint.clone()}
                    }
                }
                div {
                    class: "ty-native-select__frame",
                    select {
                        class: "ty-native-select__control",
                        "id": control_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-control"))),
                        "name": name.as_deref().filter(|v| !v.is_empty()),
                        required: required,
                        disabled: disabled,
                        "aria-label": if !(slot_label) { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                        "aria-labelledby": if !(slot_label) && !(accessible_label.as_deref().is_some_and(|v| !v.is_empty())) { labelled_by.as_deref().filter(|v| !v.is_empty()) } else { None },
                        "aria-describedby": { let ids: Vec<String> = [described_by.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()), if slot_hint { Some(format!("{instance}-hint")) } else { None }, if slot_error { Some(format!("{instance}-error")) } else { None }].into_iter().flatten().collect(); (!ids.is_empty()).then_some(ids.join(" ")) },
                        "aria-invalid": if invalid || slot_error { Some("true") } else { None },
                        "data-testid": test_id.as_deref().filter(|v| !v.is_empty()),
                        onmounted: move |event| select.set(Some(event.data())),
                        onchange: move |event: FormEvent| { if let Some(handler) = onchange { handler.call(NativeSelectChange { value: event.value() }) } },
                        if placeholder.as_deref().is_some_and(|v| !v.is_empty()) {
                            option {
                                class: "ty-native-select__placeholder",
                                "label": placeholder.as_deref().filter(|v| !v.is_empty()),
                                "value": Some(""),
                                "disabled": Some("true"),
                            }
                        }
                        {children.clone()}
                    }
                    svg {
                        class: "ty-icon ty-native-select__chevron",
                        "viewBox": Some("0 0 24 24"),
                        "fill": Some("none"),
                        "stroke": Some("currentColor"),
                        "stroke-width": Some("2"),
                        "stroke-linecap": Some("round"),
                        "stroke-linejoin": Some("round"),
                        "aria-hidden": Some("true"),
                        "focusable": Some("false"),
                        path {
                            class: "ty-native-select__chevron-path",
                            "d": Some("m6 9 6 6 6-6"),
                        }
                    }
                }
                if slot_error {
                    p {
                        class: "ty-native-select__error",
                        "id": Some(format!("{instance}-error")),
                        "role": Some("alert"),
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
                                class: "ty-native-select__error-glyph",
                                "d": Some("M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 8v4M12 16h.01"),
                            }
                        }
                        span {
                            class: "ty-native-select__error-text",
                            {error.clone()}
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

    pub fn apply_value(
        _select: Signal<Option<Rc<MountedData>>>,
        _state: Signal<Option<String>>,
    ) {
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::JsCast;

    /// The select's value is a property, not an attribute: mirror the state
    /// in on mount and whenever the prop moves — a no-op while the control
    /// already matches, so an open picker is never disturbed, exactly the
    /// element's own `select.value !== value` guard.
    pub fn apply_value(select: Signal<Option<Rc<MountedData>>>, state: Signal<Option<String>>) {
        use_effect(move || {
            let Some(element) = select_element(select) else { return };
            let state = state();
            // An absent/empty `value` attribute leaves the control alone.
            let Some(value) = state.as_deref().filter(|v| !v.is_empty()) else {
                return;
            };
            if element.value() != value {
                element.set_value(value);
            }
        });
    }

    fn select_element(
        select: Signal<Option<Rc<MountedData>>>,
    ) -> Option<web_sys::HtmlSelectElement> {
        select()?
            .downcast::<web_sys::Element>()
            .cloned()?
            .dyn_into::<web_sys::HtmlSelectElement>()
            .ok()
    }
}
