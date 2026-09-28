//! Native port of `<ty-link>`: a native `<a>` inside, so focus, keyboard
//! activation and opening in a new context are the platform's, as in the
//! custom element. The element's only script filled the external link's
//! screen-reader hint (` {new-tab-label}`) into `.ty-link__hint` on upgrade;
//! here that fill is a DOM effect — wasm only, like the element's own
//! script, so SSR renders the same markup as the generated binding. The
//! element also inferred `external` from absolute URLs to another origin,
//! but that reads `window.location.origin` at upgrade and a Dioxus prop has
//! no "attribute absent" state to infer into, so a host renders `external`
//! explicitly, as the definition already asks.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// `subtle` hides the underline at rest (only where the context makes the link obvious).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum LinkEmphasis {
    #[default]
    Underlined,
    Subtle,
}

impl LinkEmphasis {
    pub const fn as_str(self) -> &'static str {
        match self {
            LinkEmphasis::Underlined => "underlined",
            LinkEmphasis::Subtle => "subtle",
        }
    }
}

/// Moves to another location. A native <a> inside, so focus, keyboard activation and opening in a new context are the platform's; an external destination opens in a new context with a safe rel, an icon and a screen-reader hint.
#[component]
pub fn TyLink(
    /// Destination. The element is a navigation link; an inline action without one is a plain <button class="ty-link" data-action="">
    #[props(into)]
    href: Option<String>,
    /// `subtle` hides the underline at rest (only where the context makes the link obvious).
    #[props(default)]
    emphasis: LinkEmphasis,
    /// Opens in a new context with `rel="noopener noreferrer"`, an icon and a screen-reader hint. Inferred on upgrade from absolute URLs to another origin; hosts render it explicitly.
    #[props(default)]
    external: bool,
    /// Marks the link as the current page (`aria-current="page"`).
    #[props(default)]
    current: bool,
    /// Standalone links (lists, footers) get a 44 px tall hit area; inline prose links do not.
    #[props(default)]
    standalone: bool,
    /// Screen-reader hint appended to an external link's name on upgrade; translate through this attribute.
    #[props(into, default = String::from("(opens in a new tab)"))]
    new_tab_label: String,
    /// Accessible name when the visible text is not enough (`aria-label`).
    #[props(into)]
    accessible_label: Option<String>,
    /// Id of an element describing the link (`aria-describedby`).
    #[props(into)]
    described_by: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The link text.
    children: Element,
    /// The native click of the anchor.
    onclick: Option<EventHandler<MouseEvent>>,
) -> Element {
    let instance = use_instance_id(instance);

    // Mirrored prop: the parent may move `new_tab_label`, and the hint text
    // follows it.
    let mut label = use_signal(|| new_tab_label.clone());
    let mut mirrored_new_tab_label = use_signal(|| new_tab_label.clone());
    if new_tab_label != *mirrored_new_tab_label.peek() {
        mirrored_new_tab_label.set(new_tab_label.clone());
        label.set(new_tab_label.clone());
    }

    let mut hint = use_signal(|| None::<Rc<MountedData>>);
    wasm::fill_hint(hint, label);

    rsx! {
        ty-link {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "href": href.as_deref().filter(|v| !v.is_empty()),
            "emphasis": Some(emphasis.as_str()),
            "external": external.then_some(""),
            "current": current.then_some(""),
            "standalone": standalone.then_some(""),
            "new-tab-label": (!new_tab_label.is_empty()).then_some(new_tab_label.as_str()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "described-by": described_by.as_deref().filter(|v| !v.is_empty()),
            a {
                class: "ty-link",
                "href": href.as_deref().filter(|v| !v.is_empty()),
                "target": if external { Some("_blank") } else { None },
                "rel": if external { Some("noopener noreferrer") } else { None },
                "aria-current": if current { Some("page") } else { None },
                "aria-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
                "aria-describedby": described_by.as_deref().filter(|v| !v.is_empty()),
                "data-emphasis": Some(emphasis.as_str()),
                "data-standalone": (standalone).then_some(""),
                onclick: move |event| { if let Some(handler) = onclick { handler.call(event) } },
                {children.clone()}
                if external {
                    svg {
                        class: "ty-icon ty-mirror-rtl ty-link__external",
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
                        path {
                            "d": Some("M15 3h6v6"),
                        }
                        path {
                            "d": Some("M10 14 21 3"),
                        }
                        path {
                            "d": Some("M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"),
                        }
                    }
                }
                if external {
                    span {
                        class: "ty-visually-hidden ty-link__hint",
                        onmounted: move |event| hint.set(Some(event.data())),
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

    pub fn fill_hint(_hint: Signal<Option<Rc<MountedData>>>, _label: Signal<String>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    /// The screen-reader hint is a text fill, not part of the SSR markup —
    /// the element set `.ty-link__hint`'s text on upgrade, so the port sets
    /// it from an effect, only where script runs.
    pub fn fill_hint(hint: Signal<Option<Rc<MountedData>>>, label: Signal<String>) {
        use_effect(move || {
            let text = format!(" {}", label());
            let Some(element) = hint().and_then(|mounted| mounted.downcast::<web_sys::Element>().cloned()) else {
                return;
            };
            if element.text_content().as_deref() != Some(text.as_str()) {
                element.set_text_content(Some(&text));
            }
        });
    }
}
