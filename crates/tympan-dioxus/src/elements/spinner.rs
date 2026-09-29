//! Native port of `<ty-spinner>`: an indeterminate progressbar named by
//! `label`, drawn by the stylesheet as a CSS ring or three pulsing dots. All
//! presentation lives in markup and the stylesheet; what only script can do
//! is follow `prefers-reduced-motion` — a still indicator says nothing by
//! itself, so while motion is reduced the component reflects
//! `data-reduced-motion` on the anatomy root and reveals the label as text,
//! as the custom element did.

use dioxus::prelude::*;

use crate::runtime::{has_content, use_instance_id};

/// Diameter step (`small` follows the text size).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SpinnerSize {
    Small,
    #[default]
    Medium,
    Large,
}

impl SpinnerSize {
    pub const ALL: [SpinnerSize; 3] = [SpinnerSize::Small, SpinnerSize::Medium, SpinnerSize::Large];

    pub const fn as_str(self) -> &'static str {
        match self {
            SpinnerSize::Small => "small",
            SpinnerSize::Medium => "medium",
            SpinnerSize::Large => "large",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SpinnerSize> {
        SpinnerSize::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// The drawing: a border-arc ring or three pulsing dots.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SpinnerShape {
    #[default]
    Ring,
    Dots,
}

impl SpinnerShape {
    pub const ALL: [SpinnerShape; 2] = [SpinnerShape::Ring, SpinnerShape::Dots];

    pub const fn as_str(self) -> &'static str {
        match self {
            SpinnerShape::Ring => "ring",
            SpinnerShape::Dots => "dots",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SpinnerShape> {
        SpinnerShape::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Colour; `inherit` takes the current text colour.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SpinnerTone {
    #[default]
    Inherit,
    Accent,
    OnAccent,
    Neutral,
}

impl SpinnerTone {
    pub const ALL: [SpinnerTone; 4] = [SpinnerTone::Inherit, SpinnerTone::Accent, SpinnerTone::OnAccent, SpinnerTone::Neutral];

    pub const fn as_str(self) -> &'static str {
        match self {
            SpinnerTone::Inherit => "inherit",
            SpinnerTone::Accent => "accent",
            SpinnerTone::OnAccent => "on-accent",
            SpinnerTone::Neutral => "neutral",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SpinnerTone> {
        SpinnerTone::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Indeterminate work indicator: an indeterminate progressbar named by `label`, drawn as a CSS ring or three pulsing dots (never announced). Under reduced motion the animation stops (the stylesheet) and the element reveals the label as text.
#[component]
pub fn TySpinner(
    /// Accessible name; the visible caption should say the same.
    #[props(into, default = String::from("Loading"))]
    label: String,
    /// Diameter step (`small` follows the text size).
    #[props(default)]
    size: SpinnerSize,
    /// The drawing: a border-arc ring or three pulsing dots.
    #[props(default)]
    shape: SpinnerShape,
    /// Colour; `inherit` takes the current text colour.
    #[props(default)]
    tone: SpinnerTone,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The visible label next to the indicator (keep it the same text as `label`; it is decorative, the progressbar is named by `label`).
    children: Element,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_default = has_content(&children);

    // SSR has no media query, so motion is never reduced there; the wasm
    // effect tracks `(prefers-reduced-motion: reduce)` after mount.
    let reduced = use_signal(|| false);
    wasm::follow_reduced_motion(reduced);

    rsx! {
        ty-spinner {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "label": (!label.is_empty()).then_some(label.as_str()),
            "size": Some(size.as_str()),
            "shape": Some(shape.as_str()),
            "tone": Some(tone.as_str()),
            span {
                class: "ty-spinner",
                "role": Some("progressbar"),
                "aria-label": (!label.is_empty()).then_some(label.as_str()),
                "data-size": Some(size.as_str()),
                "data-shape": Some(shape.as_str()),
                "data-tone": Some(tone.as_str()),
                "data-reduced-motion": reduced().then_some(""),
                if shape == SpinnerShape::Ring {
                    span {
                        class: "ty-spinner__ring",
                        "aria-hidden": Some("true"),
                    }
                }
                if shape == SpinnerShape::Dots {
                    span {
                        class: "ty-spinner__dots",
                        "aria-hidden": Some("true"),
                        span {
                            class: "ty-spinner__dot",
                        }
                        span {
                            class: "ty-spinner__dot",
                        }
                        span {
                            class: "ty-spinner__dot",
                        }
                    }
                }
                if slot_default {
                    span {
                        class: "ty-spinner__label",
                        "aria-hidden": Some("true"),
                        {children.clone()}
                    }
                }
                if !slot_default && reduced() {
                    span {
                        class: "ty-spinner__label",
                        "aria-hidden": Some("true"),
                        {label.clone()}
                    }
                }
            }
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    use dioxus::prelude::*;

    pub fn follow_reduced_motion(_reduced: Signal<bool>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    /// Follow `(prefers-reduced-motion: reduce)`: the stylesheet stops the
    /// animation and the indicator reveals its label as text, exactly why
    /// the custom element existed.
    pub fn follow_reduced_motion(mut reduced: Signal<bool>) {
        struct Listener {
            media: web_sys::MediaQueryList,
            closure: Closure<dyn FnMut(web_sys::Event)>,
        }
        impl Drop for Listener {
            fn drop(&mut self) {
                let _ = self
                    .media
                    .remove_event_listener_with_callback("change", self.closure.as_ref().unchecked_ref());
            }
        }

        let mut listener = use_signal(|| None::<Rc<Listener>>);
        use_effect(move || {
            if listener.peek().is_some() {
                return;
            }
            let Some(window) = web_sys::window() else { return };
            let Ok(Some(media)) = window.match_media("(prefers-reduced-motion: reduce)") else {
                return;
            };
            reduced.set(media.matches());
            let queried = media.clone();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                reduced.set(queried.matches());
            });
            if media
                .add_event_listener_with_callback("change", closure.as_ref().unchecked_ref())
                .is_ok()
            {
                listener.set(Some(Rc::new(Listener { media, closure })));
            }
        });
    }
}
