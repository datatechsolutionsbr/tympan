//! Native port of `<ty-tag>`: a static pill with a text, an optional leading
//! icon or category square, and an optional native remove button (wired by
//! the caller through its native click), as in the custom element. The port
//! keeps what the element's script added: `category-index` is normalised
//! into the 1–8 categorical tokens before render, and on wasm an unlabelled
//! remove button is named "Remove <text>" from the tag's own text (the host
//! passes a translated `remove-label` to override).

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// `accent` fills with the theme accent.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum TagTone {
    #[default]
    Neutral,
    Accent,
}

impl TagTone {
    pub const fn as_str(self) -> &'static str {
        match self {
            TagTone::Neutral => "neutral",
            TagTone::Accent => "accent",
        }
    }
}

/// Text step; `small` never goes below the meta size.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum TagSize {
    Small,
    #[default]
    Regular,
    Large,
}

impl TagSize {
    pub const fn as_str(self) -> &'static str {
        match self {
            TagSize::Small => "small",
            TagSize::Regular => "regular",
            TagSize::Large => "large",
        }
    }
}

/// The element's `changed()`: finite values clamp to 1 and wrap into the 1–8
/// categorical tokens; a non-finite value drops the attribute.
fn normalise_category(category_index: Option<f64>) -> Option<i64> {
    let n = category_index?;
    if !n.is_finite() {
        return None;
    }
    Some(((n.round().max(1.0) as i64 - 1) % 8) + 1)
}

/// Small label for static metadata (a badge or chip), optionally removable; the remove button is a native <button>. An interactive tag (pressable or a link) is a plain styled native — <button class="ty-tag" data-interactive> or <a class="ty-tag" href> — not this element (see docs/html-contract.md).
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyTag(
    /// `accent` fills with the theme accent.
    #[props(default)]
    tone: TagTone,
    /// A categorical token (1 to 8) shown as a small colour square; normalised into range on upgrade.
    category_index: Option<f64>,
    /// Text step; `small` never goes below the meta size.
    #[props(default)]
    size: TagSize,
    /// Shows the remove button at the end.
    #[props(default)]
    removable: bool,
    /// Accessible name of the remove button; must include the tag text (defaults to "Remove <text>" on upgrade).
    #[props(into)]
    remove_label: Option<String>,
    /// A polite live region (`role="status"`) for a tag whose text updates dynamically.
    #[props(default)]
    live: bool,
    /// Test hook on the tag (`data-testid`).
    #[props(into)]
    test_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The text; truncates with an ellipsis.
    children: Element,
    /// A leading icon (decorative); wins over the category square.
    icon: Option<Element>,
    /// The remove button's native click (wired on that button).
    onclick: Option<EventHandler<MouseEvent>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_icon = icon.is_some();
    let category = normalise_category(category_index);

    let mut host = use_signal(|| None::<Rc<MountedData>>);
    wasm::default_remove_label(host);

    rsx! {
        ty-tag {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "tone": Some(tone.as_str()),
            "category-index": category.map(|v| v.to_string()),
            "size": Some(size.as_str()),
            "removable": removable.then_some(""),
            "remove-label": remove_label.as_deref().filter(|v| !v.is_empty()),
            "live": live.then_some(""),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            span {
                class: "ty-tag",
                "role": if live { Some("status") } else { None },
                "aria-live": if live { Some("polite") } else { None },
                "data-tone": Some(tone.as_str()),
                "data-size": Some(size.as_str()),
                "data-removable": (removable).then_some(""),
                "data-testid": test_id.as_deref().filter(|v| !v.is_empty()),
                onmounted: move |event| host.set(Some(event.data())),
                if slot_icon {
                    span {
                        class: "ty-tag__icon",
                        "aria-hidden": Some("true"),
                        {icon.clone()}
                    }
                }
                if !(slot_icon) && category.is_some() {
                    span {
                        class: "ty-tag__swatch",
                        "aria-hidden": Some("true"),
                        "data-category": category.map(|v| v.to_string()),
                    }
                }
                span {
                    class: "ty-tag__text",
                    {children.clone()}
                }
                if removable {
                    button {
                        class: "ty-tag__remove",
                        "type": Some("button"),
                        "aria-label": remove_label.as_deref().filter(|v| !v.is_empty()),
                        onclick: move |event| { if let Some(handler) = onclick { handler.call(event) } },
                        svg {
                            class: "ty-icon",
                            "aria-hidden": Some("true"),
                            "focusable": Some("false"),
                            "viewBox": Some("0 0 12 12"),
                            "fill": Some("none"),
                            "stroke": Some("currentColor"),
                            "stroke-width": Some("1.5"),
                            "stroke-linecap": Some("round"),
                            path {
                                "d": Some("M2.5 2.5l7 7M9.5 2.5l-7 7"),
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

    pub fn default_remove_label(_host: Signal<Option<Rc<MountedData>>>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    /// The element's `sync()`: a remove button without a label is named
    /// "Remove <text>" from the tag's own text — only the DOM knows the
    /// rendered text, so this stays an effect.
    pub fn default_remove_label(host: Signal<Option<Rc<MountedData>>>) {
        use_effect(move || {
            let Some(element) = host_element(host) else { return };
            let Ok(Some(button)) = element.query_selector(".ty-tag__remove") else {
                return;
            };
            if button.get_attribute("aria-label").is_some() {
                return;
            }
            let text = element
                .query_selector(".ty-tag__text")
                .ok()
                .flatten()
                .and_then(|span| span.text_content())
                .unwrap_or_default();
            let label = format!("Remove {}", text.trim());
            let _ = button.set_attribute("aria-label", label.trim());
        });
    }

    fn host_element(host: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        host()?.downcast::<web_sys::Element>().cloned()
    }
}
