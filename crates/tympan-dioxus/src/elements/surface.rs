//! Native port of `<ty-surface>`: a bounded container at a chosen
//! elevation. The anatomy is purely presentational; the behaviour the
//! custom element added is the pressable card — a press anywhere on the
//! surface, outside a nested control and outside a text selection, is
//! forwarded to the title's primary control (the link with `href`, the
//! button otherwise), so keyboard activation and context menus stay that
//! control's own. The forwarding needs the real DOM (the click target,
//! `closest`, the selection), so it runs as a native click listener on the
//! host, added and removed with the mount exactly as the element did.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::{has_content, use_instance_id};

/// Level 1 (sheet glass), 2 (raised card), 3 (floating) or 0 (flat).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SurfaceElevation {
    #[default]
    Sheet,
    Raised,
    Floating,
    Flat,
}

impl SurfaceElevation {
    pub const ALL: [SurfaceElevation; 4] = [SurfaceElevation::Sheet, SurfaceElevation::Raised, SurfaceElevation::Floating, SurfaceElevation::Flat];

    pub const fn as_str(self) -> &'static str {
        match self {
            SurfaceElevation::Sheet => "sheet",
            SurfaceElevation::Raised => "raised",
            SurfaceElevation::Floating => "floating",
            SurfaceElevation::Flat => "flat",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SurfaceElevation> {
        SurfaceElevation::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Internal padding step.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SurfacePadding {
    None,
    #[default]
    Regular,
    Roomy,
}

impl SurfacePadding {
    pub const ALL: [SurfacePadding; 3] = [SurfacePadding::None, SurfacePadding::Regular, SurfacePadding::Roomy];

    pub const fn as_str(self) -> &'static str {
        match self {
            SurfacePadding::None => "none",
            SurfacePadding::Regular => "regular",
            SurfacePadding::Roomy => "roomy",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SurfacePadding> {
        SurfacePadding::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Heading level of the title.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SurfaceTitleLevel {
    H2,
    #[default]
    H3,
    H4,
}

impl SurfaceTitleLevel {
    pub const ALL: [SurfaceTitleLevel; 3] = [SurfaceTitleLevel::H2, SurfaceTitleLevel::H3, SurfaceTitleLevel::H4];

    pub const fn as_str(self) -> &'static str {
        match self {
            SurfaceTitleLevel::H2 => "h2",
            SurfaceTitleLevel::H3 => "h3",
            SurfaceTitleLevel::H4 => "h4",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SurfaceTitleLevel> {
        SurfaceTitleLevel::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Bounded container at a chosen elevation. A titled surface is a region named by its title; a pressable one forwards presses anywhere on it to the single primary control in the title (a link with `href`, a button otherwise).
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TySurface(
    /// Level 1 (sheet glass), 2 (raised card), 3 (floating) or 0 (flat).
    #[props(default)]
    elevation: SurfaceElevation,
    /// Internal padding step.
    #[props(default)]
    padding: SurfacePadding,
    /// Heading level of the title.
    #[props(default)]
    title_level: SurfaceTitleLevel,
    /// The whole surface is one press target that forwards to the title's primary control; set it when `onclick` is wired. Implied by `href`.
    #[props(default)]
    pressable: bool,
    /// Makes the surface a whole-card link: the title's primary control is an anchor and its hit area stretches over the card.
    #[props(into)]
    href: Option<String>,
    /// A chosen card (accent-soft state).
    #[props(default)]
    selected: bool,
    /// Pressable surfaces only: inert primary control, no forwarding.
    #[props(default)]
    disabled: bool,
    /// Accessible name of the region when there is no visible title.
    #[props(into)]
    accessible_label: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The body.
    children: Element,
    /// The header title (a heading). Required on a pressable surface: it holds the primary control.
    title: Option<Element>,
    /// A secondary line under the title.
    description: Option<Element>,
    /// The footer region, usually actions.
    footer: Option<Element>,
    /// A press of the primary control (directly, or forwarded from anywhere on the surface).
    onclick: Option<EventHandler<MouseEvent>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_default = has_content(&children);
    let slot_title = title.is_some();
    let slot_description = description.is_some();
    let slot_footer = footer.is_some();

    let has_href = href.as_deref().is_some_and(|v| !v.is_empty());
    let is_pressable = pressable || has_href;

    // The click listener is attached once and lives across re-renders, so
    // the props it consults are mirrored into signals it can read at click
    // time, re-synced here whenever the props change.
    let mut mirrored_pressable = use_signal(|| is_pressable);
    if is_pressable != *mirrored_pressable.peek() {
        mirrored_pressable.set(is_pressable);
    }
    let mut mirrored_disabled = use_signal(|| disabled);
    if disabled != *mirrored_disabled.peek() {
        mirrored_disabled.set(disabled);
    }
    let mut mirrored_titled = use_signal(|| slot_title);
    if slot_title != *mirrored_titled.peek() {
        mirrored_titled.set(slot_title);
    }

    let mut host = use_signal(|| None::<Rc<MountedData>>);
    wasm::forward_presses(host, mirrored_pressable, mirrored_disabled);
    wasm::warn_pressable_without_primary(mirrored_pressable, mirrored_titled);

    rsx! {
        ty-surface {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "elevation": Some(elevation.as_str()),
            "padding": Some(padding.as_str()),
            "title-level": Some(title_level.as_str()),
            "pressable": pressable.then_some(""),
            "href": href.as_deref().filter(|v| !v.is_empty()),
            "selected": selected.then_some("true"),
            "disabled": disabled.then_some("true"),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            onmounted: move |event| host.set(Some(event.data())),
            section {
                class: "ty-surface",
                "aria-labelledby": if slot_title { Some(format!("{instance}-title")) } else { None },
                "aria-label": if !(slot_title) { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                "data-elevation": Some(elevation.as_str()),
                "data-padding": Some(padding.as_str()),
                "data-pressable": if is_pressable { Some("") } else { None },
                "data-selected": (selected).then_some(""),
                "data-disabled": if is_pressable && disabled { Some("") } else { None },
                if slot_title || slot_description {
                    header {
                        class: "ty-surface__header",
                        if slot_title && title_level == SurfaceTitleLevel::H2 {
                            h2 {
                                class: "ty-surface__title",
                                "id": Some(format!("{instance}-title")),
                                if has_href {
                                    a {
                                        class: "ty-surface__primary",
                                        "href": if !(disabled) { href.as_deref().filter(|v| !v.is_empty()) } else { None },
                                        "aria-disabled": (disabled).then_some("true"),
                                        onclick: move |event| { if let Some(handler) = onclick { handler.call(event) } },
                                        {title.clone()}
                                    }
                                }
                                if !(has_href) && pressable {
                                    button {
                                        class: "ty-surface__primary",
                                        "type": Some("button"),
                                        disabled: disabled,
                                        onclick: move |event| { if let Some(handler) = onclick { handler.call(event) } },
                                        {title.clone()}
                                    }
                                }
                                if !(has_href) && !(pressable) {
                                    {title.clone()}
                                }
                            }
                        }
                        if slot_title && title_level == SurfaceTitleLevel::H3 {
                            h3 {
                                class: "ty-surface__title",
                                "id": Some(format!("{instance}-title")),
                                if has_href {
                                    a {
                                        class: "ty-surface__primary",
                                        "href": if !(disabled) { href.as_deref().filter(|v| !v.is_empty()) } else { None },
                                        "aria-disabled": (disabled).then_some("true"),
                                        onclick: move |event| { if let Some(handler) = onclick { handler.call(event) } },
                                        {title.clone()}
                                    }
                                }
                                if !(has_href) && pressable {
                                    button {
                                        class: "ty-surface__primary",
                                        "type": Some("button"),
                                        disabled: disabled,
                                        onclick: move |event| { if let Some(handler) = onclick { handler.call(event) } },
                                        {title.clone()}
                                    }
                                }
                                if !(has_href) && !(pressable) {
                                    {title.clone()}
                                }
                            }
                        }
                        if slot_title && title_level == SurfaceTitleLevel::H4 {
                            h4 {
                                class: "ty-surface__title",
                                "id": Some(format!("{instance}-title")),
                                if has_href {
                                    a {
                                        class: "ty-surface__primary",
                                        "href": if !(disabled) { href.as_deref().filter(|v| !v.is_empty()) } else { None },
                                        "aria-disabled": (disabled).then_some("true"),
                                        onclick: move |event| { if let Some(handler) = onclick { handler.call(event) } },
                                        {title.clone()}
                                    }
                                }
                                if !(has_href) && pressable {
                                    button {
                                        class: "ty-surface__primary",
                                        "type": Some("button"),
                                        disabled: disabled,
                                        onclick: move |event| { if let Some(handler) = onclick { handler.call(event) } },
                                        {title.clone()}
                                    }
                                }
                                if !(has_href) && !(pressable) {
                                    {title.clone()}
                                }
                            }
                        }
                        if slot_description {
                            div {
                                class: "ty-surface__description",
                                {description.clone()}
                            }
                        }
                    }
                }
                if slot_default {
                    div {
                        class: "ty-surface__body",
                        {children.clone()}
                    }
                }
                if slot_footer {
                    footer {
                        class: "ty-surface__footer",
                        {footer.clone()}
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

    pub fn forward_presses(
        _host: Signal<Option<Rc<MountedData>>>,
        _pressable: Signal<bool>,
        _disabled: Signal<bool>,
    ) {
    }

    pub fn warn_pressable_without_primary(_pressable: Signal<bool>, _titled: Signal<bool>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    /// Same selector as the element: a press that lands on a nested control
    /// belongs to that control, not to the surface.
    const INTERACTIVE: &str = "a[href],button,input,select,textarea,summary,[role=\"button\"],[role=\"link\"],[role=\"checkbox\"],[role=\"switch\"],[tabindex]:not([tabindex=\"-1\"])";

    /// The element's `click` listener on the host: forward a press that did
    /// not land on the primary control itself, on a nested control or in a
    /// text selection to the primary control, so activation (keyboard,
    /// context menu) stays the control's own. Removed when the component
    /// unmounts, like `disconnected()`.
    pub fn forward_presses(
        host: Signal<Option<Rc<MountedData>>>,
        pressable: Signal<bool>,
        disabled: Signal<bool>,
    ) {
        struct Listener {
            target: web_sys::EventTarget,
            closure: Closure<dyn FnMut(web_sys::Event)>,
        }
        impl Drop for Listener {
            fn drop(&mut self) {
                let _ = self
                    .target
                    .remove_event_listener_with_callback("click", self.closure.as_ref().unchecked_ref());
            }
        }

        let mut listener = use_signal(|| None::<Rc<Listener>>);
        use_effect(move || {
            if listener.peek().is_some() {
                return;
            }
            let Some(element) = host_element(host) else { return };
            let surface = element.clone();
            let target: web_sys::EventTarget = element.into();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                if !pressable() || disabled() {
                    return;
                }
                let Some(pressed) = event
                    .target()
                    .and_then(|target| target.dyn_into::<web_sys::Element>().ok())
                else {
                    return;
                };
                let Ok(Some(primary)) = surface.query_selector(".ty-surface__primary") else {
                    return;
                };
                if primary.contains(Some(pressed.unchecked_ref())) {
                    return;
                }
                if let Ok(Some(interactive)) = pressed.closest(INTERACTIVE) {
                    if surface.contains(Some(interactive.unchecked_ref())) {
                        return;
                    }
                }
                if !selection_text().is_empty() {
                    return;
                }
                if let Some(control) = primary.dyn_ref::<web_sys::HtmlElement>() {
                    control.click();
                }
            });
            if target
                .add_event_listener_with_callback("click", closure.as_ref().unchecked_ref())
                .is_ok()
            {
                listener.set(Some(Rc::new(Listener { target, closure })));
            }
        });
    }

    /// The element's `connected()` warning: a pressable surface without a
    /// title has no primary control to forward to.
    pub fn warn_pressable_without_primary(pressable: Signal<bool>, titled: Signal<bool>) {
        let mut warned = use_signal(|| false);
        use_effect(move || {
            if pressable() && !titled() && !*warned.peek() {
                warned.set(true);
                web_sys::console::warn_1(
                    &"<ty-surface>: a pressable surface needs a title, which becomes its primary control.".into(),
                );
            }
        });
    }

    /// `window.getSelection().toString()`: web-sys does not bind
    /// `Selection::toString`, so call it through reflection.
    fn selection_text() -> String {
        let Some(selection) = web_sys::window().and_then(|window| window.get_selection().ok().flatten())
        else {
            return String::new();
        };
        js_sys::Reflect::get(selection.as_ref(), &"toString".into())
            .ok()
            .and_then(|method| method.dyn_into::<js_sys::Function>().ok())
            .and_then(|method| method.call0(selection.as_ref()).ok())
            .and_then(|text| text.as_string())
            .unwrap_or_default()
    }

    fn host_element(host: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        host()?.downcast::<web_sys::Element>().cloned()
    }
}
