//! Native port of `<ty-progress-bar>`. The anatomy is fully declarative —
//! the `progressbar` role, its name, the range and the in-range value all
//! render from the props, SSR-identical to the generated binding. What the
//! markup cannot express is the computed state the element applied after
//! the first paint: the clamped `aria-valuenow`, the value text
//! (`value-label` when given, the rounded percentage otherwise;
//! `in-progress-label` while indeterminate), `data-complete` at the maximum
//! and the fill's inline size. Those are a DOM effect (`mod wasm`), driven
//! by the props mirrored into a signal so a parent moving `value`
//! re-applies them, like the element's `sync()`; SSR never runs the effect,
//! so the rendered markup matches the fixtures.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Semantic tone of the fill; never the only signal (pair with value text or a status word).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ProgressBarTone {
    #[default]
    Accent,
    Success,
    Warning,
    Danger,
}

impl ProgressBarTone {
    pub const ALL: [ProgressBarTone; 4] = [ProgressBarTone::Accent, ProgressBarTone::Success, ProgressBarTone::Warning, ProgressBarTone::Danger];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            ProgressBarTone::Accent => "accent",
            ProgressBarTone::Success => "success",
            ProgressBarTone::Warning => "warning",
            ProgressBarTone::Danger => "danger",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<ProgressBarTone> {
        ProgressBarTone::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Track thickness.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ProgressBarSize {
    Thin,
    #[default]
    Regular,
}

impl ProgressBarSize {
    pub const ALL: [ProgressBarSize; 2] = [ProgressBarSize::Thin, ProgressBarSize::Regular];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            ProgressBarSize::Thin => "thin",
            ProgressBarSize::Regular => "regular",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<ProgressBarSize> {
        ProgressBarSize::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// The props the computed state derives from, mirrored into a signal so a
/// parent moving any of them re-applies the computed state (the element's
/// `sync()` on attribute change).
#[derive(Clone, Debug, PartialEq)]
struct ProgressInput {
    value: f64,
    min_value: f64,
    max_value: f64,
    indeterminate: bool,
    value_label: Option<String>,
    in_progress_label: String,
}

/// Determinate or indeterminate task progress (upload, batch run, profile completion). Not focusable; the host announces completion through a Toast or status message, not through the bar. Values outside the range are clamped on upgrade; the fill width changes with `--ty-dur-quick`, instantly under reduced motion, where the indeterminate sweep becomes a static partial fill with the label still stating "in progress".
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyProgressBar(
    /// Current value; clamped into the range on upgrade.
    #[props(default = 0.0f64)]
    value: f64,
    /// Start of the range.
    #[props(default = 0.0f64)]
    min_value: f64,
    /// End of the range; reaching it is the complete state.
    #[props(default = 100.0f64)]
    max_value: f64,
    /// Visible and accessible name (required unless `accessibleLabel` is given).
    #[props(into)]
    label: Option<String>,
    /// Accessible name when there is no visible label (`aria-label`).
    #[props(into)]
    accessible_label: Option<String>,
    /// Custom value text, such as "3 of 8 steps"; the computed percentage when unset.
    #[props(into)]
    value_label: Option<String>,
    /// `true` or `false`; unset: the value text shows. An indeterminate bar always shows its "in progress" text.
    #[props(into)]
    show_value: Option<String>,
    /// Unknown progress: no `aria-valuenow` and no percentage, the value text states "in progress".
    #[props(default)]
    indeterminate: bool,
    /// Value text of an indeterminate bar; translate through this attribute.
    #[props(into, default = String::from("In progress"))]
    in_progress_label: String,
    /// Semantic tone of the fill; never the only signal (pair with value text or a status word).
    #[props(default)]
    tone: ProgressBarTone,
    /// Track thickness.
    #[props(default)]
    size: ProgressBarSize,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
) -> Element {
    let instance = use_instance_id(instance);

    // The parent owns the value — nothing here diverges locally — but the
    // computed state must re-apply when the props move, so mirror them into
    // a signal the DOM effect subscribes to.
    let input = ProgressInput {
        value,
        min_value,
        max_value,
        indeterminate,
        value_label,
        in_progress_label,
    };
    let mut state = use_signal(|| input.clone());
    let mut mirrored_input = use_signal(|| input.clone());
    if input != *mirrored_input.peek() {
        mirrored_input.set(input.clone());
        state.set(input.clone());
    }

    let mut root = use_signal(|| None::<Rc<MountedData>>);
    wasm::apply_state(root, state);

    let ProgressInput {
        value,
        min_value,
        max_value,
        indeterminate,
        value_label,
        in_progress_label,
    } = input;

    rsx! {
        ty-progress-bar {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "value": Some(value.to_string()),
            "min-value": Some(min_value.to_string()),
            "max-value": Some(max_value.to_string()),
            "label": label.as_deref().filter(|v| !v.is_empty()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "value-label": value_label.as_deref().filter(|v| !v.is_empty()),
            "show-value": show_value.as_deref().filter(|v| !v.is_empty()),
            "indeterminate": indeterminate.then_some(""),
            "in-progress-label": (!in_progress_label.is_empty()).then_some(in_progress_label.as_str()),
            "tone": Some(tone.as_str()),
            "size": Some(size.as_str()),
            div {
                class: "ty-progress",
                "role": Some("progressbar"),
                "aria-labelledby": if label.as_deref().is_some_and(|v| !v.is_empty()) { Some(format!("{instance}-label")) } else { None },
                "aria-label": if !(label.as_deref().is_some_and(|v| !v.is_empty())) { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                "aria-valuemin": Some(min_value.to_string()),
                "aria-valuemax": Some(max_value.to_string()),
                "aria-valuenow": if !(indeterminate) { Some(value.to_string()) } else { None },
                "aria-valuetext": if !(indeterminate) { value_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                "data-tone": Some(tone.as_str()),
                "data-size": Some(size.as_str()),
                "data-indeterminate": (indeterminate).then_some(""),
                onmounted: move |event| root.set(Some(event.data())),
                if label.as_deref().is_some_and(|v| !v.is_empty()) || indeterminate || show_value.as_deref() != Some("false") {
                    div {
                        class: "ty-progress__header",
                        if label.as_deref().is_some_and(|v| !v.is_empty()) {
                            span {
                                class: "ty-progress__label",
                                "id": Some(format!("{instance}-label")),
                                {label.clone().unwrap_or_default()}
                            }
                        }
                        if indeterminate || show_value.as_deref() != Some("false") {
                            span {
                                class: "ty-progress__value",
                            }
                        }
                    }
                }
                div {
                    class: "ty-progress__track",
                    "aria-hidden": Some("true"),
                    div {
                        class: "ty-progress__fill",
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

    use super::ProgressInput;

    pub fn apply_state(_root: Signal<Option<Rc<MountedData>>>, _input: Signal<ProgressInput>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::JsCast;

    use super::ProgressInput;

    /// The computed state the anatomy cannot express declaratively, applied
    /// after the render like the element's first-pass update: the clamped
    /// `aria-valuenow` (in-range values never touch the rendered
    /// attribute), the value text (visible and `aria-valuetext`),
    /// `data-complete` while a determinate value reaches the maximum, and
    /// the fill's inline size (an indeterminate fill is the stylesheet's).
    pub fn apply_state(root: Signal<Option<Rc<MountedData>>>, input: Signal<ProgressInput>) {
        use_effect(move || {
            let input = input();
            let Some(root) = root_element(root) else { return };
            let clamped = input.value.max(input.min_value).min(input.max_value);
            let range = input.max_value - input.min_value;
            let percentage = if range > 0.0 {
                ((clamped - input.min_value) / range * 100.0).round()
            } else {
                100.0
            };
            let value_text = input
                .value_label
                .as_deref()
                .filter(|v| !v.is_empty())
                .map(str::to_string)
                .unwrap_or_else(|| format!("{percentage}%"));

            if input.indeterminate {
                let _ = root.remove_attribute("aria-valuenow");
                let _ = root.remove_attribute("aria-valuetext");
            } else {
                let now = clamped.to_string();
                if root.get_attribute("aria-valuenow").as_deref() != Some(now.as_str()) {
                    let _ = root.set_attribute("aria-valuenow", &now);
                }
                if root.get_attribute("aria-valuetext").as_deref() != Some(value_text.as_str()) {
                    let _ = root.set_attribute("aria-valuetext", &value_text);
                }
            }
            let _ = root.toggle_attribute_with_force(
                "data-complete",
                !input.indeterminate && clamped >= input.max_value,
            );

            if let Ok(Some(value)) = root.query_selector(".ty-progress__value") {
                let text = if input.indeterminate {
                    input.in_progress_label.clone()
                } else {
                    value_text.clone()
                };
                if value.text_content().as_deref() != Some(text.as_str()) {
                    value.set_text_content(Some(&text));
                }
            }
            if let Ok(Some(fill)) = root.query_selector(".ty-progress__fill") {
                if let Ok(fill) = fill.dyn_into::<web_sys::HtmlElement>() {
                    let size = if input.indeterminate {
                        String::new()
                    } else {
                        format!("{percentage}%")
                    };
                    let style = fill.style();
                    if style.get_property_value("inline-size").unwrap_or_default() != size {
                        let _ = style.set_property("inline-size", &size);
                    }
                }
            }
        });
    }

    fn root_element(root: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        root()?.downcast::<web_sys::Element>().cloned()
    }
}
