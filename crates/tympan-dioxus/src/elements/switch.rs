//! Native port of `<ty-switch>`: a native checkbox with `role="switch"`
//! inside a `<label>`, so the label names it, Space toggles it and forms
//! submit it — the platform's behaviour, as in the custom element. The port
//! keeps what the element added on top: Enter toggles as well as Space, a
//! read-only switch is shown but not changeable (its clicks are swallowed,
//! `aria-readonly` is set), the state is reflected to the host's `checked`
//! attribute and the row's `data-selected`, and a form reset restores the
//! initial state.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::{has_content, use_instance_id};

/// Track size.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SwitchSize {
    Small,
    #[default]
    Regular,
    Large,
}

impl SwitchSize {
    pub const fn as_str(self) -> &'static str {
        match self {
            SwitchSize::Small => "small",
            SwitchSize::Regular => "regular",
            SwitchSize::Large => "large",
        }
    }
}

/// `tile`: text at the start, control at the end, the whole row is the target.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SwitchLayout {
    #[default]
    Inline,
    Tile,
}

impl SwitchLayout {
    pub const fn as_str(self) -> &'static str {
        match self {
            SwitchLayout::Inline => "inline",
            SwitchLayout::Tile => "tile",
        }
    }
}

/// The native change of the checkbox; `checked` is the new state.
#[derive(Clone, Debug, PartialEq)]
pub struct SwitchChange {
    pub checked: bool,
}

/// On/off setting with immediate effect. A native checkbox with role="switch" inside a <label>, so labelling, keyboard and form participation are the platform's; Enter toggles as well as Space.
#[component]
pub fn TySwitch(
    /// On; the initial state, and the state a form reset restores.
    #[props(default)]
    checked: bool,
    /// Native disabled.
    #[props(default)]
    disabled: bool,
    /// Shown but not changeable (`aria-readonly`).
    #[props(default)]
    read_only: bool,
    /// Form field name; the value is sent while on.
    #[props(into)]
    name: Option<String>,
    /// Form value sent while on (the browser sends "on" without one).
    #[props(into)]
    value: Option<String>,
    /// Track size.
    #[props(default)]
    size: SwitchSize,
    /// `tile`: text at the start, control at the end, the whole row is the target.
    #[props(default)]
    layout: SwitchLayout,
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
    /// The native change of the checkbox; `checked` is the new state.
    onchange: Option<EventHandler<SwitchChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_default = has_content(&children);
    let slot_description = description.is_some();

    // Uncontrolled with a mirrored prop: the parent may move `checked`,
    // otherwise the input's own toggles drive the state.
    let mut state = use_signal(|| checked);
    let mut mirrored_checked = use_signal(|| checked);
    if checked != *mirrored_checked.peek() {
        mirrored_checked.set(checked);
        state.set(checked);
    }

    let mut input = use_signal(|| None::<Rc<MountedData>>);
    wasm::follow_form_reset(input, state);

    rsx! {
        ty-switch {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "checked": state().then_some("true"),
            "disabled": disabled.then_some("true"),
            "read-only": read_only.then_some(""),
            "name": name.as_deref().filter(|v| !v.is_empty()),
            "value": value.as_deref().filter(|v| !v.is_empty()),
            "size": Some(size.as_str()),
            "layout": Some(layout.as_str()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            label {
                class: "ty-switch",
                "data-layout": Some(layout.as_str()),
                "data-size": Some(size.as_str()),
                "data-selected": state().then_some(""),
                "data-disabled": disabled.then_some(""),
                "data-readonly": read_only.then_some(""),
                input {
                    class: "ty-visually-hidden",
                    "type": Some("checkbox"),
                    "role": Some("switch"),
                    "name": name.as_deref().filter(|v| !v.is_empty()),
                    "value": value.as_deref().filter(|v| !v.is_empty()),
                    checked: state(),
                    disabled: disabled,
                    "aria-readonly": read_only.then_some("true"),
                    "aria-label": if !slot_default { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                    "aria-labelledby": if slot_default { Some(format!("{instance}-label")) } else { None },
                    "aria-describedby": if slot_description { Some(format!("{instance}-description")) } else { None },
                    "data-testid": test_id.as_deref().filter(|v| !v.is_empty()),
                    onmounted: move |event| input.set(Some(event.data())),
                    onclick: move |event: MouseEvent| {
                        if read_only {
                            event.prevent_default();
                        }
                    },
                    onkeydown: move |event: KeyboardEvent| {
                        if event.key() == Key::Enter && !disabled && !read_only {
                            event.prevent_default();
                            wasm::click_input(input);
                        }
                    },
                    onchange: move |event: FormEvent| {
                        let checked = event.checked();
                        state.set(checked);
                        if let Some(handler) = onchange {
                            handler.call(SwitchChange { checked });
                        }
                    },
                }
                span {
                    class: "ty-switch__track",
                    "aria-hidden": Some("true"),
                    span {
                        class: "ty-switch__thumb",
                    }
                }
                if slot_default || slot_description {
                    span {
                        class: "ty-switch__text",
                        if slot_default {
                            span {
                                class: "ty-switch__label",
                                "id": Some(format!("{instance}-label")),
                                {children.clone()}
                            }
                        }
                        if slot_description {
                            span {
                                class: "ty-switch__description",
                                "id": Some(format!("{instance}-description")),
                                {description.clone()}
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

    pub fn click_input(_input: Signal<Option<Rc<MountedData>>>) {}

    pub fn follow_form_reset(_input: Signal<Option<Rc<MountedData>>>, _state: Signal<bool>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    /// Enter does not toggle a native checkbox; click the input so its
    /// change drives the state, as the element did.
    pub fn click_input(input: Signal<Option<Rc<MountedData>>>) {
        if let Some(element) = input_element(input) {
            element.click();
        }
    }

    /// A form reset restores the input from its `checked` attribute; read
    /// the restored state after the reset task, as the element did.
    pub fn follow_form_reset(input: Signal<Option<Rc<MountedData>>>, mut state: Signal<bool>) {
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
