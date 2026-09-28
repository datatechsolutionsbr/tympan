//! Native port of `<ty-drawer>`: the modal panel sliding in from an edge of
//! the viewport — backdrop, panel anchored to the bottom (sheet) or end
//! (side panel) edge, header with handle/title/close, scrolling body and a
//! bottom safe-area inset — with the element's modal contract in Rust.
//! Visibility is controlled: `open` is a prop and every dismissal (Escape,
//! the close button, an allowed backdrop press, a drag past the threshold)
//! only emits `on_open_change` for the host to flip `open`. On open, focus
//! moves into the panel (a `[data-autofocus]` control, else the first
//! tabbable, else the dialog), Tab wraps inside it, the page behind is
//! inert and scroll-locked (a shared counter for stacked drawers); on close
//! focus returns to what had it and the page is released — unmounting
//! releases it too. The bottom sheet drags from the header: the panel
//! follows the pointer down while the backdrop fades, and a release past
//! the distance or velocity threshold asks to close, anything else snaps
//! back. `max-height` is a CSS length, applied to the panel's inline style
//! like the element's upgrade did. The DOM-only parts (focus, inert, the
//! scroll lock, the entering animation, the drag styles) live in the
//! `wasm` module, cfg-gated with a no-op twin.

use std::rc::Rc;

use dioxus::html::input_data::MouseButton;
use dioxus::prelude::*;

use crate::runtime::{has_content, use_instance_id};

/// The edge the panel attaches to; `end` follows the reading direction.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum DrawerPlacement {
    #[default]
    Bottom,
    End,
}

impl DrawerPlacement {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            DrawerPlacement::Bottom => "bottom",
            DrawerPlacement::End => "end",
        }
    }
}

/// Maximum width step of an end-placed panel.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum DrawerWidth {
    #[default]
    Medium,
    Large,
    Wide,
}

impl DrawerWidth {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            DrawerWidth::Medium => "medium",
            DrawerWidth::Large => "large",
            DrawerWidth::Wide => "wide",
        }
    }
}

/// The element asks the host to change visibility — `open: false` on Escape, the close button, an allowed backdrop press or a drag past the threshold. Controlled: the element does not close itself; the host flips `open`.
#[derive(Clone, Debug, PartialEq)]
pub struct DrawerOpenChange {
    pub open: bool,
}

/// Distance (px) or velocity (px/ms) past which a released drag closes the drawer.
const DRAG_DISTANCE: f64 = 120.0;
const DRAG_VELOCITY: f64 = 0.6;

/// The current Unix time in ms, on either target (the drag's velocity clock).
#[cfg(target_arch = "wasm32")]
fn now_ms() -> f64 {
    js_sys::Date::now()
}

/// The current Unix time in ms, on either target (the drag's velocity clock).
#[cfg(not(target_arch = "wasm32"))]
fn now_ms() -> f64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|since| since.as_secs_f64() * 1000.0)
        .unwrap_or(0.0)
}

/// Ask the host to close; the host flips `open` (controlled visibility).
fn request_close(handler: Option<EventHandler<DrawerOpenChange>>) {
    if let Some(handler) = handler {
        handler.call(DrawerOpenChange { open: false });
    }
}

/// Modal panel sliding in from an edge of the viewport for a secondary task: a backdrop, a panel anchored to the bottom (sheet) or end (side panel) edge, a header with the title and an always-present close button, an optional grab handle, a scrolling body and a bottom safe-area inset. Controlled through `open`; the element asks to close with `ty-open-change` (Escape, close button, an allowed backdrop press, a drag past the threshold) and the host flips `open`. Focus moves into the panel on open, is trapped while open, and returns to the invoking element on close; the page behind is inert and does not scroll.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyDrawer(
    /// Shown (controlled). The anatomy stays mounted but `hidden` while closed, so nothing reaches the accessibility tree.
    #[props(default)]
    open: bool,
    /// The edge the panel attaches to; `end` follows the reading direction.
    #[props(default)]
    placement: DrawerPlacement,
    /// Maximum width step of an end-placed panel.
    #[props(default)]
    width: DrawerWidth,
    /// Maximum height of a bottom-placed panel (a CSS length, e.g. `85dvh`); applied to the panel on upgrade.
    #[props(into)]
    max_height: Option<String>,
    /// `true` or `false`; unset: the grab handle shows on bottom placement.
    #[props(into)]
    show_handle: Option<String>,
    /// `true` or `false`; unset (or `true`): a backdrop press and a drag past the threshold dismiss. Escape and the close button always work.
    #[props(into)]
    dismissible: Option<String>,
    /// Accessible name of the close button.
    #[props(into, default = String::from("Close"))]
    close_label: String,
    /// Accessible name of the dialog when the title slot is empty.
    #[props(into)]
    accessible_label: Option<String>,
    /// Test hook on the panel (`data-testid`).
    #[props(into)]
    panel_test_id: Option<String>,
    /// Test hook on the backdrop (`data-testid`).
    #[props(into)]
    backdrop_test_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The visible heading; also the accessible name (`accessibleLabel` when empty).
    title: Option<Element>,
    /// The body; scrolls when long.
    children: Element,
    /// The element asks the host to change visibility — `open: false` on Escape, the close button, an allowed backdrop press or a drag past the threshold. Controlled: the element does not close itself; the host flips `open`.
    on_open_change: Option<EventHandler<DrawerOpenChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_title = title.is_some();
    let slot_default = has_content(&children);

    // `open` stays controlled; the mirror only lets the modal effects react.
    let mut was_open = use_signal(|| false);
    if open != *was_open.peek() {
        was_open.set(open);
    }

    // The panel's `max-block-size`: the `max-height` of a bottom placement,
    // a CSS length an attribute binding cannot carry — applied inline, as
    // the element's upgrade did.
    let panel_max_height = if placement == DrawerPlacement::Bottom {
        max_height.clone().unwrap_or_default()
    } else {
        String::new()
    };
    let mut max_block_size = use_signal(String::new);
    if panel_max_height != *max_block_size.peek() {
        max_block_size.set(panel_max_height);
    }

    // Unset (or `true`): a backdrop press and a drag past the threshold
    // dismiss; Escape and the close button always work.
    let can_dismiss = dismissible.as_deref() != Some("false");

    let mut press_on_backdrop = use_signal(|| false);
    // The drag in flight: the press's clientY and start time (ms).
    let mut drag = use_signal(|| None::<(f64, f64)>);

    let mut host = use_signal(|| None::<Rc<MountedData>>);
    wasm::follow_open(host, was_open);
    wasm::follow_max_height(host, max_block_size);

    rsx! {
        ty-drawer {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "open": open.then_some("true"),
            "placement": Some(placement.as_str()),
            "width": Some(width.as_str()),
            "max-height": max_height.as_deref().filter(|v| !v.is_empty()),
            "show-handle": show_handle.as_deref().filter(|v| !v.is_empty()),
            "dismissible": dismissible.as_deref().filter(|v| !v.is_empty()),
            "close-label": (!close_label.is_empty()).then_some(close_label.as_str()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "panel-test-id": panel_test_id.as_deref().filter(|v| !v.is_empty()),
            "backdrop-test-id": backdrop_test_id.as_deref().filter(|v| !v.is_empty()),
            onmounted: move |event: MountedEvent| host.set(Some(event.data())),
            onkeydown: move |event: KeyboardEvent| {
                let key = event.key();
                if key == Key::Escape {
                    if event.is_composing() {
                        return;
                    }
                    event.prevent_default();
                    event.stop_propagation();
                    request_close(on_open_change);
                    return;
                }
                if key != Key::Tab {
                    return;
                }
                event.prevent_default();
                event.stop_propagation();
                wasm::cycle_focus(host, event.modifiers().shift());
            },
            onpointermove: move |event: PointerEvent| {
                let Some((start_y, _)) = *drag.peek() else { return };
                let distance = (event.client_coordinates().y - start_y).max(0.0);
                wasm::drag_move(host, distance);
            },
            onpointerup: move |event: PointerEvent| {
                let Some((start_y, start_t)) = *drag.peek() else { return };
                let distance = (event.client_coordinates().y - start_y).max(0.0);
                let elapsed = (now_ms() - start_t).max(1.0);
                drag.set(None);
                wasm::drag_end(host);
                if distance >= DRAG_DISTANCE || distance / elapsed >= DRAG_VELOCITY {
                    request_close(on_open_change);
                }
            },
            onpointercancel: move |_| {
                if drag.peek().is_some() {
                    drag.set(None);
                    wasm::drag_end(host);
                }
            },
            div {
                class: "ty-drawer__backdrop",
                "hidden": if !(open) { Some("true") } else { None },
                "data-placement": Some(placement.as_str()),
                "data-testid": backdrop_test_id.as_deref().filter(|v| !v.is_empty()),
                onmousedown: move |event: MouseEvent| {
                    press_on_backdrop.set(true);
                    // Keep focus inside the dialog: a press on the backdrop
                    // must not move focus to the body.
                    event.prevent_default();
                },
                onclick: move |_| {
                    if *press_on_backdrop.peek() && can_dismiss {
                        request_close(on_open_change);
                    }
                    press_on_backdrop.set(false);
                },
                onanimationend: move |_| wasm::clear_entering(host),
                div {
                    class: "ty-drawer",
                    "data-placement": Some(placement.as_str()),
                    "data-width": Some(width.as_str()),
                    onmousedown: move |event: MouseEvent| {
                        // A press that starts inside the panel is not a
                        // backdrop press (selecting text released outside).
                        press_on_backdrop.set(false);
                        event.stop_propagation();
                    },
                    onclick: move |event: MouseEvent| event.stop_propagation(),
                    onanimationend: move |_| wasm::clear_entering(host),
                    div {
                        class: "ty-drawer__dialog",
                        "role": Some("dialog"),
                        "aria-modal": Some("true"),
                        "tabindex": Some("-1"),
                        "aria-labelledby": if slot_title { Some(format!("{instance}-title")) } else { None },
                        "aria-label": if !(slot_title) { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                        "data-testid": panel_test_id.as_deref().filter(|v| !v.is_empty()),
                        header {
                            class: "ty-drawer__header",
                            onpointerdown: move |event: PointerEvent| {
                                // The header is the grab area (never a
                                // control inside it — the close button stops
                                // the press); only the bottom sheet drags.
                                if !open || !can_dismiss || placement != DrawerPlacement::Bottom {
                                    return;
                                }
                                if event
                                    .trigger_button()
                                    .is_some_and(|button| button != MouseButton::Primary)
                                {
                                    return;
                                }
                                drag.set(Some((event.client_coordinates().y, now_ms())));
                                wasm::capture_pointer(host, event.pointer_id());
                            },
                            if placement == DrawerPlacement::Bottom && !(show_handle.as_deref() == Some("false")) {
                                span {
                                    class: "ty-drawer__handle",
                                    "aria-hidden": Some("true"),
                                }
                            }
                            if slot_title {
                                h2 {
                                    class: "ty-drawer__title",
                                    "id": Some(format!("{instance}-title")),
                                    {title.clone()}
                                }
                            }
                            button {
                                class: "ty-button ty-drawer__close",
                                "type": Some("button"),
                                "aria-label": (!close_label.is_empty()).then_some(close_label.as_str()),
                                "title": (!close_label.is_empty()).then_some(close_label.as_str()),
                                "data-variant": Some("quiet"),
                                "data-size": Some("compact"),
                                "data-shape": Some("circle"),
                                "data-icon-only": Some(""),
                                onpointerdown: move |event: PointerEvent| event.stop_propagation(),
                                onclick: move |_| request_close(on_open_change),
                                span {
                                    class: "ty-button__icon",
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
                                            class: "ty-drawer__glyph",
                                            "d": Some("M18 6 6 18"),
                                        }
                                        path {
                                            class: "ty-drawer__glyph",
                                            "d": Some("m6 6 12 12"),
                                        }
                                    }
                                }
                            }
                        }
                        if slot_default {
                            div {
                                class: "ty-drawer__body",
                                {children.clone()}
                            }
                        }
                        if placement == DrawerPlacement::Bottom {
                            div {
                                class: "ty-drawer__inset",
                                "aria-hidden": Some("true"),
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

    pub fn follow_open(_host: Signal<Option<Rc<MountedData>>>, _was_open: Signal<bool>) {}

    pub fn follow_max_height(_host: Signal<Option<Rc<MountedData>>>, _value: Signal<String>) {}

    pub fn cycle_focus(_host: Signal<Option<Rc<MountedData>>>, _backwards: bool) {}

    pub fn clear_entering(_host: Signal<Option<Rc<MountedData>>>) {}

    pub fn capture_pointer(_host: Signal<Option<Rc<MountedData>>>, _pointer_id: i32) {}

    pub fn drag_move(_host: Signal<Option<Rc<MountedData>>>, _distance: f64) {}

    pub fn drag_end(_host: Signal<Option<Rc<MountedData>>>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::cell::{Cell, RefCell};
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    /// Elements that may take keyboard focus inside the panel.
    const FOCUSABLE: &str = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

    /// Marker of the elements this component made inert (a host's own inert is left alone).
    const INERT_MARK: &str = "data-ty-drawer-inert";

    /// Panel travel over which the backdrop fades to its dimmest still-visible opacity.
    const DRAG_FADE: f64 = 400.0;

    thread_local! {
        /// Open drawers share one page scroll lock; the last one to close releases it.
        static SCROLL_LOCKS: Cell<u32> = const { Cell::new(0) };
    }

    /// The modal contract, driven by the controlled `open`: on open, lock the
    /// page scroll, inert the page behind, move focus into the panel and play
    /// the entering animation after the first frame; on close, undo it all
    /// and return focus to what had it when the drawer opened. Unmounting
    /// releases the page like a close did.
    pub fn follow_open(host: Signal<Option<Rc<MountedData>>>, was_open: Signal<bool>) {
        struct Modal {
            return_focus: Option<web_sys::Element>,
            inerted: Vec<web_sys::Element>,
            was_open: bool,
        }

        impl Modal {
            fn deactivate(&mut self, restore_focus: bool) {
                if !self.was_open {
                    return;
                }
                self.was_open = false;
                unlock_scroll();
                for element in self.inerted.drain(..) {
                    if element.has_attribute(INERT_MARK) {
                        let _ = element.remove_attribute("inert");
                        let _ = element.remove_attribute(INERT_MARK);
                    }
                }
                let target = self.return_focus.take();
                if restore_focus && target.as_ref().is_some_and(|t| t.is_connected()) {
                    if let Some(target) = target {
                        after_frame(move || {
                            if target.is_connected() {
                                if let Some(html) = target.dyn_ref::<web_sys::HtmlElement>() {
                                    let _ = html.focus();
                                }
                            }
                        });
                    }
                }
            }
        }

        impl Drop for Modal {
            fn drop(&mut self) {
                self.deactivate(true);
            }
        }

        let modal = use_signal(|| {
            Rc::new(RefCell::new(Modal {
                return_focus: None,
                inerted: Vec::new(),
                was_open: false,
            }))
        });
        use_effect(move || {
            let open = was_open();
            let Some(element) = host_element(host) else { return };
            let guard = modal.peek();
            let mut state = guard.borrow_mut();
            if open == state.was_open {
                return;
            }
            if !open {
                state.deactivate(true);
                return;
            }
            state.was_open = true;
            // Focus returns to what had it, if that was outside the drawer.
            let active = document().and_then(|doc| doc.active_element());
            state.return_focus = match active {
                Some(active) if !contains(&element, &active) => Some(active),
                _ => None,
            };
            lock_scroll();
            state.inerted = apply_inert(&element);
            // The anatomy may land a beat after the `open` attribute, so
            // focus and the entering animation wait a frame, as the element's
            // requestAnimationFrame did.
            let host = element.clone();
            after_frame(move || {
                if !host.is_connected() || !host.has_attribute("open") {
                    return;
                }
                focus_initial(&host);
                if let Ok(parts) =
                    host.query_selector_all(".ty-drawer__backdrop, .ty-drawer")
                {
                    for index in 0..parts.length() {
                        if let Some(part) = element_at(&parts, index) {
                            let _ = part.set_attribute("data-entering", "");
                        }
                    }
                }
            });
        });
    }

    /// The panel's `max-block-size`: a CSS length an attribute binding cannot
    /// carry, applied inline as the element's `#applyMaxHeight` did.
    pub fn follow_max_height(host: Signal<Option<Rc<MountedData>>>, value: Signal<String>) {
        use_effect(move || {
            let value = value();
            let Some(element) = host_element(host) else { return };
            let Ok(Some(panel)) = element.query_selector(".ty-drawer") else {
                return;
            };
            let Some(html) = panel.dyn_ref::<web_sys::HtmlElement>() else {
                return;
            };
            if value.is_empty() {
                let _ = html.style().remove_property("max-block-size");
            } else {
                let _ = html.style().set_property("max-block-size", &value);
            }
        });
    }

    /// Tab wraps around the dialog's tabbables (the trap).
    pub fn cycle_focus(host: Signal<Option<Rc<MountedData>>>, backwards: bool) {
        let Some(element) = host_element(host) else { return };
        let Ok(Some(dialog)) = element.query_selector(".ty-drawer__dialog") else {
            return;
        };
        let tabbables = tabbables(&dialog);
        if tabbables.is_empty() {
            if let Some(html) = dialog.dyn_ref::<web_sys::HtmlElement>() {
                let _ = html.focus();
            }
            return;
        }
        let active = document().and_then(|doc| doc.active_element());
        let current = active
            .and_then(|active| tabbables.iter().position(|node| node.is_same_node(Some(&active))));
        let next = match current {
            None => {
                if backwards {
                    tabbables.len() - 1
                } else {
                    0
                }
            }
            Some(current) => {
                (current as isize + if backwards { -1 } else { 1 })
                    .rem_euclid(tabbables.len() as isize) as usize
            }
        };
        if let Some(html) = tabbables[next].dyn_ref::<web_sys::HtmlElement>() {
            let _ = html.focus();
        }
    }

    /// The entering animation ended; the marker goes away, as the element's
    /// animationend listener did.
    pub fn clear_entering(host: Signal<Option<Rc<MountedData>>>) {
        let Some(element) = host_element(host) else { return };
        if let Ok(parts) = element.query_selector_all(".ty-drawer__backdrop, .ty-drawer") {
            for index in 0..parts.length() {
                if let Some(part) = element_at(&parts, index) {
                    let _ = part.remove_attribute("data-entering");
                }
            }
        }
    }

    /// The header keeps the drag's pointer events (capture), as the element's
    /// setPointerCapture did.
    pub fn capture_pointer(host: Signal<Option<Rc<MountedData>>>, pointer_id: i32) {
        let Some(element) = host_element(host) else { return };
        let Ok(Some(header)) = element.query_selector(".ty-drawer__header") else {
            return;
        };
        let _ = header.set_pointer_capture(pointer_id);
    }

    /// The drag follows the pointer down at full speed while the backdrop
    /// fades with the distance.
    pub fn drag_move(host: Signal<Option<Rc<MountedData>>>, distance: f64) {
        let Some(element) = host_element(host) else { return };
        if let Ok(Some(panel)) = element.query_selector(".ty-drawer") {
            if let Some(html) = panel.dyn_ref::<web_sys::HtmlElement>() {
                let style = html.style();
                let _ = style.set_property("transition", "none");
                if distance > 0.0 {
                    let _ = style.set_property("transform", &format!("translateY({distance}px)"));
                    let _ = panel.set_attribute("data-dragging", "");
                } else {
                    let _ = style.remove_property("transform");
                    let _ = panel.remove_attribute("data-dragging");
                }
            }
        }
        if let Ok(Some(backdrop)) = element.query_selector(".ty-drawer__backdrop") {
            if let Some(html) = backdrop.dyn_ref::<web_sys::HtmlElement>() {
                let opacity = (1.0 - distance / DRAG_FADE).max(0.2);
                let _ = html.style().set_property("opacity", &opacity.to_string());
            }
        }
    }

    /// End the drag: clearing the inline styles lets the CSS transition snap
    /// the panel back.
    pub fn drag_end(host: Signal<Option<Rc<MountedData>>>) {
        let Some(element) = host_element(host) else { return };
        if let Ok(Some(panel)) = element.query_selector(".ty-drawer") {
            if let Some(html) = panel.dyn_ref::<web_sys::HtmlElement>() {
                let style = html.style();
                let _ = style.remove_property("transition");
                let _ = style.remove_property("transform");
            }
            let _ = panel.remove_attribute("data-dragging");
        }
        if let Ok(Some(backdrop)) = element.query_selector(".ty-drawer__backdrop") {
            if let Some(html) = backdrop.dyn_ref::<web_sys::HtmlElement>() {
                let _ = html.style().remove_property("opacity");
            }
        }
    }

    fn document() -> Option<web_sys::Document> {
        web_sys::window().and_then(|window| window.document())
    }

    fn lock_scroll() {
        SCROLL_LOCKS.with(|locks| {
            let count = locks.get() + 1;
            locks.set(count);
            if count == 1 {
                if let Some(root) = document().and_then(|doc| doc.document_element()) {
                    let _ = root.set_attribute("data-ty-drawer-open", "");
                }
            }
        });
    }

    fn unlock_scroll() {
        SCROLL_LOCKS.with(|locks| {
            let count = locks.get();
            if count == 0 {
                return;
            }
            locks.set(count - 1);
            if count == 1 {
                if let Some(root) = document().and_then(|doc| doc.document_element()) {
                    let _ = root.remove_attribute("data-ty-drawer-open");
                }
            }
        });
    }

    /// Whether `ancestor` is `node` or one of its ancestors.
    fn contains(ancestor: &web_sys::Element, node: &web_sys::Element) -> bool {
        let mut current = Some(node.clone());
        while let Some(element) = current {
            if ancestor.is_same_node(Some(&element)) {
                return true;
            }
            current = element.parent_element();
        }
        false
    }

    /// Everything between the host and `<body>` gets inert siblings.
    fn apply_inert(host: &web_sys::Element) -> Vec<web_sys::Element> {
        let body: Option<web_sys::Element> = document().and_then(|doc| doc.body()).map(Into::into);
        let mut inerted = Vec::new();
        let mut node = Some(host.clone());
        while let Some(current) = node {
            if body
                .as_ref()
                .is_some_and(|body| body.is_same_node(Some(&current)))
            {
                break;
            }
            let Some(parent) = current.parent_element() else {
                break;
            };
            let children = parent.children();
            for index in 0..children.length() {
                let Some(sibling) = children.item(index) else {
                    continue;
                };
                if sibling.is_same_node(Some(&current)) || sibling.has_attribute("inert") {
                    continue;
                }
                let _ = sibling.set_attribute("inert", "");
                let _ = sibling.set_attribute(INERT_MARK, "");
                inerted.push(sibling);
            }
            node = Some(parent);
        }
        inerted
    }

    /// The dialog's tabbables, skipping anything inside a `hidden` part.
    fn tabbables(dialog: &web_sys::Element) -> Vec<web_sys::Element> {
        let Ok(nodes) = dialog.query_selector_all(FOCUSABLE) else {
            return Vec::new();
        };
        let mut out = Vec::new();
        for index in 0..nodes.length() {
            if let Some(node) = element_at(&nodes, index) {
                if node.closest("[hidden]").ok().flatten().is_none() {
                    out.push(node);
                }
            }
        }
        out
    }

    /// A NodeList entry as an element (query results always are).
    fn element_at(nodes: &web_sys::NodeList, index: u32) -> Option<web_sys::Element> {
        nodes
            .item(index)
            .and_then(|node| node.dyn_into::<web_sys::Element>().ok())
    }

    /// On open, focus moves to a `[data-autofocus]` control, else the first
    /// tabbable element, else the dialog itself.
    fn focus_initial(host: &web_sys::Element) {
        let Ok(Some(dialog)) = host.query_selector(".ty-drawer__dialog") else {
            return;
        };
        if let Some(active) = document().and_then(|doc| doc.active_element()) {
            if contains(&dialog, &active) {
                return;
            }
        }
        let chosen = dialog.query_selector("[data-autofocus]").ok().flatten();
        let target = chosen
            .or_else(|| tabbables(&dialog).into_iter().next())
            .unwrap_or(dialog);
        if let Some(html) = target.dyn_ref::<web_sys::HtmlElement>() {
            let _ = html.focus();
        }
    }

    fn after_frame(f: impl FnOnce() + 'static) {
        let window = web_sys::window().expect("window");
        let frame = Closure::<dyn FnMut()>::once(f);
        let _ = window.request_animation_frame(frame.as_ref().unchecked_ref());
        frame.forget();
    }

    fn host_element(host: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        host()?.downcast::<web_sys::Element>().cloned()
    }
}
