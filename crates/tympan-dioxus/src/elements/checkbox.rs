//! Native port of `<ty-checkbox>`: a native checkbox inside a `<label>`
//! row, so the label names it, Space toggles it and forms submit it — the
//! platform's behaviour, as in the custom element. On top of that the
//! component mirrors the state the stylesheet reads: `data-selected` /
//! `data-indeterminate` on the row, the host's `checked` reflection, the
//! input's `indeterminate` property (cleared by the next toggle, like the
//! element) and a form reset restores the initial state.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::{has_content, use_instance_id};

/// `tile` draws a surface around the row; `bare` is indicator plus text.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum CheckboxAppearance {
    #[default]
    Tile,
    Bare,
}

impl CheckboxAppearance {
    pub const fn as_str(self) -> &'static str {
        match self {
            CheckboxAppearance::Tile => "tile",
            CheckboxAppearance::Bare => "bare",
        }
    }
}

/// The native change of the checkbox; `checked` is the new state.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct CheckboxChange {
    pub checked: bool,
}

#[component]
pub fn TyCheckbox(
    /// On; the initial state, and the state a form reset restores.
    #[props(default)]
    checked: bool,
    /// Mixed state for "select all" rows (the input's `indeterminate`
    /// property); cleared by the next toggle.
    #[props(default)]
    indeterminate: bool,
    /// Native disabled.
    #[props(default)]
    disabled: bool,
    /// Native required; the form will not submit while off.
    #[props(default)]
    required: bool,
    /// Form field name; the value is sent while on.
    #[props(into)]
    name: Option<String>,
    /// Form value sent while on (the browser sends "on" without one).
    #[props(into)]
    value: Option<String>,
    #[props(default)]
    appearance: CheckboxAppearance,
    /// Accessible name when there is no visible label.
    #[props(into)]
    accessible_label: Option<String>,
    /// Test hook on the native checkbox (`data-testid`).
    #[props(into)]
    test_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The visible label.
    children: Element,
    /// A secondary line, announced as the description.
    description: Option<Element>,
    /// The error message; marks the checkbox invalid (`aria-invalid`,
    /// `aria-errormessage`).
    error: Option<Element>,
    /// The native change of the checkbox; `checked` is the new state.
    onchange: Option<EventHandler<CheckboxChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_default = has_content(&children);
    let slot_description = description.is_some();
    let slot_error = error.is_some();

    // Uncontrolled with a mirrored prop: the parent may move `checked` or
    // `indeterminate`, otherwise the input's own toggles drive the state.
    let mut state = use_signal(|| checked);
    let mut mirrored_checked = use_signal(|| checked);
    if checked != *mirrored_checked.peek() {
        mirrored_checked.set(checked);
        state.set(checked);
    }
    let mut mixed = use_signal(|| indeterminate);
    let mut mirrored_mixed = use_signal(|| indeterminate);
    if indeterminate != *mirrored_mixed.peek() {
        mirrored_mixed.set(indeterminate);
        mixed.set(indeterminate);
    }

    let mut input = use_signal(|| None::<Rc<MountedData>>);
    wasm::mirror_indeterminate(input, mixed);
    wasm::follow_form_reset(input, state, mixed);

    rsx! {
        ty-checkbox {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "checked": state().then_some("true"),
            "indeterminate": mixed().then_some(""),
            "disabled": disabled.then_some("true"),
            "required": required.then_some("true"),
            "name": name.as_deref().filter(|v| !v.is_empty()),
            "value": value.as_deref().filter(|v| !v.is_empty()),
            "appearance": Some(appearance.as_str()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            div {
                class: "ty-checkbox",
                "data-appearance": Some(appearance.as_str()),
                label {
                    class: "ty-checkbox__row",
                    "data-selected": state().then_some(""),
                    "data-indeterminate": mixed().then_some(""),
                    "data-disabled": disabled.then_some(""),
                    input {
                        class: "ty-visually-hidden",
                        "type": Some("checkbox"),
                        "name": name.as_deref().filter(|v| !v.is_empty()),
                        "value": value.as_deref().filter(|v| !v.is_empty()),
                        checked: state(),
                        disabled: disabled,
                        required: required,
                        "aria-label": if !slot_default { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                        "aria-labelledby": if slot_default { Some(format!("{instance}-label")) } else { None },
                        "aria-describedby": if slot_description { Some(format!("{instance}-description")) } else { None },
                        "aria-invalid": if slot_error { Some("true") } else { None },
                        "aria-errormessage": if slot_error { Some(format!("{instance}-error")) } else { None },
                        "data-testid": test_id.as_deref().filter(|v| !v.is_empty()),
                        onmounted: move |event| input.set(Some(event.data())),
                        onchange: move |event: FormEvent| {
                            let checked = event.checked();
                            state.set(checked);
                            mixed.set(false);
                            if let Some(handler) = onchange {
                                handler.call(CheckboxChange { checked });
                            }
                        },
                    }
                    span {
                        class: "ty-checkbox__indicator",
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
                            path {
                                class: "ty-checkbox__check",
                                "d": Some("M20 6 9 17l-5-5"),
                            }
                            path {
                                class: "ty-checkbox__minus",
                                "d": Some("M5 12h14"),
                            }
                        }
                    }
                    if slot_default || slot_description {
                        span {
                            class: "ty-checkbox__text",
                            if slot_default {
                                span {
                                    class: "ty-checkbox__label",
                                    "id": Some(format!("{instance}-label")),
                                    {children.clone()}
                                }
                            }
                            if slot_description {
                                span {
                                    class: "ty-checkbox__description",
                                    "id": Some(format!("{instance}-description")),
                                    {description.clone()}
                                }
                            }
                        }
                    }
                }
                if slot_error {
                    p {
                        class: "ty-checkbox__error",
                        "id": Some(format!("{instance}-error")),
                        "aria-live": Some("polite"),
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
                                class: "ty-checkbox__error-glyph",
                                "d": Some("M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 8v4M12 16h.01"),
                            }
                        }
                        span {
                            class: "ty-checkbox__error-text",
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

    pub fn mirror_indeterminate(_input: Signal<Option<Rc<MountedData>>>, _mixed: Signal<bool>) {}

    pub fn follow_form_reset(
        _input: Signal<Option<Rc<MountedData>>>,
        _state: Signal<bool>,
        _mixed: Signal<bool>,
    ) {
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    /// The input's `indeterminate` is a property, not an attribute — only
    /// script can set it, exactly why the custom element existed.
    pub fn mirror_indeterminate(input: Signal<Option<Rc<MountedData>>>, mixed: Signal<bool>) {
        use_effect(move || {
            let Some(element) = input_element(input) else { return };
            element.set_indeterminate(mixed());
        });
    }

    /// A form reset restores the input from its `checked` attribute; read
    /// the restored state after the reset task, as the element did.
    pub fn follow_form_reset(
        input: Signal<Option<Rc<MountedData>>>,
        mut state: Signal<bool>,
        mut mixed: Signal<bool>,
    ) {
        struct Listener {
            target: web_sys::EventTarget,
            closure: Closure<dyn FnMut(web_sys::Event)>,
        }
        impl Drop for Listener {
            fn drop(&mut self) {
                let _ = self
                    .target
                    .remove_event_listener_with_callback("reset", self.closure.as_ref().unchecked_ref());
            }
        }

        let mut listener = use_signal(|| None::<Rc<Listener>>);
        use_effect(move || {
            if listener.peek().is_some() {
                return;
            }
            let Some(element) = input_element(input) else { return };
            let Some(form) = element.form() else { return };
            let target: web_sys::EventTarget = form.into();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                let window = web_sys::window().expect("window");
                let tick = Closure::<dyn FnMut()>::new(move || {
                    if let Some(element) = input_element(input) {
                        state.set(element.checked());
                        mixed.set(false);
                    }
                });
                let _ = window.set_timeout_with_callback_and_timeout_and_arguments_0(
                    tick.as_ref().unchecked_ref(),
                    0,
                );
                tick.forget();
            });
            if target
                .add_event_listener_with_callback("reset", closure.as_ref().unchecked_ref())
                .is_ok()
            {
                listener.set(Some(Rc::new(Listener { target, closure })));
            }
        });
    }

    fn input_element(
        input: Signal<Option<Rc<MountedData>>>,
    ) -> Option<web_sys::HtmlInputElement> {
        input()?
            .downcast::<web_sys::Element>()
            .cloned()?
            .dyn_into::<web_sys::HtmlInputElement>()
            .ok()
    }
}
