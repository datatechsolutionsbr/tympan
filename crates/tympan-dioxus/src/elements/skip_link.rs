//! Native port of `<ty-skip-link>`: a native anchor to the target's
//! fragment, so keyboard activation and the accessibility tree are the
//! platform's; the stylesheet hides it until focus (never `display: none`)
//! and raises it above every layer when visible. On top of that the port
//! keeps what the element added in script: the derived `href` (`#` +
//! `target-id`) painted onto the anchor after mount, so SSR stays the
//! rendered anatomy, and the activation behaviour — focus moves to the
//! target (a temporary negative tabindex when the target is not natively
//! focusable, removed on blur, so the next Tab continues from there), the
//! target scrolls to the start, where the document's `scroll-padding-top`
//! keeps it clear of the sticky top bar, and the address bar's fragment is
//! updated without a history entry.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// First focusable element of the page: jumps past the navigation straight to the main content (WCAG 2.4.1 Bypass Blocks). A native anchor to the target's fragment, visually hidden until focused — never `display: none`, so it stays in the accessibility tree. On activation the element moves focus to the target (a temporary negative tabindex when the target is not natively focusable) and scrolls it clear of the sticky top bar.
#[component]
pub fn TySkipLink(
    /// Id of the main content element; the anchor's href is its fragment (`#main-content`).
    #[props(into, default = String::from("main-content"))]
    target_id: String,
    /// Link text (the I18n adapter's default); translate through this attribute.
    #[props(into, default = String::from("Skip to main content"))]
    label: String,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The native click of the anchor, before the focus move.
    onclick: Option<EventHandler<MouseEvent>>,
) -> Element {
    let instance = use_instance_id(instance);

    // Mirrored prop: the parent may move `target-id`; the painted href and
    // the activation follow the latest value.
    let mut target = use_signal(|| target_id.clone());
    let mut mirrored_target = use_signal(|| target_id.clone());
    if target_id != *mirrored_target.peek() {
        mirrored_target.set(target_id.clone());
        target.set(target_id.clone());
    }

    let mut link = use_signal(|| None::<Rc<MountedData>>);
    wasm::mirror_href(link, target);

    rsx! {
        ty-skip-link {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "target-id": (!target_id.is_empty()).then_some(target_id.as_str()),
            "label": (!label.is_empty()).then_some(label.as_str()),
            a {
                class: "ty-skip-link",
                onmounted: move |event| link.set(Some(event.data())),
                onclick: move |event| {
                    if let Some(handler) = onclick {
                        handler.call(event.clone());
                    }
                    wasm::activate(event, target.peek().clone());
                },
                {label.clone()}
            }
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    pub fn mirror_href(_link: Signal<Option<Rc<MountedData>>>, _target: Signal<String>) {}

    pub fn activate(_event: MouseEvent, _target_id: String) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    /// The fragment href is derived, which markup cannot express: painted
    /// onto the anchor after mount, as the element did after the first
    /// paint, so SSR never carries it.
    pub fn mirror_href(link: Signal<Option<Rc<MountedData>>>, target: Signal<String>) {
        use_effect(move || {
            let Some(anchor) = link_element(link) else { return };
            let href = format!("#{}", target());
            if anchor.get_attribute("href").as_deref() != Some(href.as_str()) {
                let _ = anchor.set_attribute("href", &href);
            }
        });
    }

    /// Move focus to the target (the React SkipLink's `focusSkipTarget`),
    /// then keep the fragment in the address bar without a history entry —
    /// so the default navigation is cancelled only when the focus move
    /// happened, as in the element.
    pub fn activate(event: MouseEvent, target_id: String) {
        let Some(window) = web_sys::window() else { return };
        let Some(document) = window.document() else { return };
        let Some(target) = document.get_element_by_id(&target_id) else {
            return;
        };
        let Ok(html) = target.clone().dyn_into::<web_sys::HtmlElement>() else {
            return;
        };
        let needs_tab_index = !target.has_attribute("tabindex") && html.tab_index() < 0;
        if needs_tab_index {
            let _ = target.set_attribute("tabindex", "-1");
            // Removed on blur, so the next Tab continues from the target.
            let blurred = target.clone();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                let _ = blurred.remove_attribute("tabindex");
            });
            let options = web_sys::AddEventListenerOptions::new();
            options.set_once(true);
            let _ = target.add_event_listener_with_callback_and_add_event_listener_options(
                "blur",
                closure.as_ref().unchecked_ref(),
                &options,
            );
            closure.forget();
        }
        let options = web_sys::FocusOptions::new();
        options.set_prevent_scroll(true);
        let _ = html.focus_with_options(&options);
        // scroll-padding-top on the document keeps the target clear of the
        // sticky top bar (§2.6).
        let options = web_sys::ScrollIntoViewOptions::new();
        options.set_block(web_sys::ScrollLogicalPosition::Start);
        target.scroll_into_view_with_scroll_into_view_options(&options);
        event.prevent_default();
        if let Ok(history) = window.history() {
            let state = history.state().unwrap_or(wasm_bindgen::JsValue::NULL);
            let _ = history.replace_state_with_url(&state, "", Some(&format!("#{target_id}")));
        }
    }

    fn link_element(link: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        link()?.downcast::<web_sys::Element>().cloned()
    }
}
