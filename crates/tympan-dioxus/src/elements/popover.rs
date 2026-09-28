//! Native port of `<ty-popover>`: a non-modal floating panel anchored to a
//! trigger, controlled by the host — the component only asks to toggle
//! through `on_open_change` (a trigger activation asks for `!open`; Escape,
//! an outside press or focus leaving the panel ask for `false`) and the host
//! flips `open`. The DOM-only parts live in the `wasm` module, cfg-gated with
//! a no-op twin: the trigger wiring (`aria-haspopup`/`aria-expanded`/
//! `aria-controls`, the panel's id and accessible name), the slotted
//! trigger's activation listener (the built-in info button asks through its
//! own Dioxus `onclick`), the while-open listeners (outside `pointerdown`,
//! `focusout` leaving the host, resize/scroll repositioning) and the fixed
//! placement of the panel — the shared placement model (side preference,
//! collision flip, viewport clamp, arrow inset in the gap) ported from
//! `model.ts`. Not a focus trap: content that needs one is a dialog.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::{has_content, use_instance_id};

/// Preferred side; `start`/`end` follow the reading direction. Flips when there is no room.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum PopoverPlacement {
    Top,
    End,
    #[default]
    Bottom,
    Start,
}

impl PopoverPlacement {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            PopoverPlacement::Top => "top",
            PopoverPlacement::End => "end",
            PopoverPlacement::Bottom => "bottom",
            PopoverPlacement::Start => "start",
        }
    }
}

/// Alignment along the chosen side.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum PopoverAlign {
    Start,
    #[default]
    Center,
    End,
}

impl PopoverAlign {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            PopoverAlign::Start => "start",
            PopoverAlign::Center => "center",
            PopoverAlign::End => "end",
        }
    }
}

/// The element asks the host to change visibility — `open: false` on Escape, an outside press or focus leaving the panel, `open: true` on a trigger activation. Controlled: the element does not toggle itself; the host flips `open`.
#[derive(Clone, Debug, PartialEq)]
pub struct PopoverOpenChange {
    pub open: bool,
}

/// What the runtime wiring reflects on the trigger and the panel (read only
/// on wasm; the SSR markup carries none of it, as the element's did not).
#[cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]
#[derive(Clone, Debug, PartialEq)]
struct Wiring {
    open: bool,
    label: Option<String>,
    panel_id: String,
}

/// The element asks the host to change visibility; the host flips `open`.
fn request_open(handler: Option<EventHandler<PopoverOpenChange>>, next: bool) {
    if let Some(handler) = handler {
        handler.call(PopoverOpenChange { open: next });
    }
}

/// Non-modal floating panel anchored to a trigger, for short explanations or arbitrary small content (help text, a mini form, a brand menu). The trigger is the host's own focusable element in the trigger slot — or the built-in info button when the slot is empty and `triggerLabel` names it. The element wires aria-expanded on the trigger, places the panel with the shared placement model (side preference, collision flip, viewport clamp, arrow inset), and asks to close with `ty-open-change` on Escape, an outside press, or focus leaving the panel; the host flips `open`. Not a focus trap — content that needs one is a dialog, not a popover.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyPopover(
    /// Shown (controlled). The anatomy stays mounted but `hidden` while closed, so nothing reaches the accessibility tree.
    #[props(default)]
    open: bool,
    /// Accessible name of the built-in info trigger (required when the trigger slot is empty).
    #[props(into)]
    trigger_label: Option<String>,
    /// Heading at the top of the panel; also its accessible name.
    #[props(into)]
    title: Option<String>,
    /// Preferred side; `start`/`end` follow the reading direction. Flips when there is no room.
    #[props(default)]
    placement: PopoverPlacement,
    /// Alignment along the chosen side.
    #[props(default)]
    align: PopoverAlign,
    /// Gap between trigger and panel as a step of the spacing scale (0–9); the arrow's inset is added to it.
    #[props(into, default = String::from("2"))]
    offset: String,
    /// `true` or `false`; unset: the arrow shows.
    #[props(into)]
    show_arrow: Option<String>,
    /// Test hook on the panel (`data-testid`).
    #[props(into)]
    panel_test_id: Option<String>,
    /// Accessible name of the panel when `title` is empty.
    #[props(into)]
    accessible_label: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)] id: Option<String>,
    #[props(into, default)] class: String,
    /// The host's own toggle — any single focusable element; wired to the panel (aria-expanded, activation). Empty: the built-in info button.
    trigger: Option<Element>,
    /// The panel body.
    children: Element,
    /// The element asks the host to change visibility — `open: false` on Escape, an outside press or focus leaving the panel, `open: true` on a trigger activation. Controlled: the element does not toggle itself; the host flips `open`.
    on_open_change: Option<EventHandler<PopoverOpenChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_trigger = trigger.is_some();
    let slot_default = has_content(&children);

    // `open` is controlled — the component only asks, never toggles itself.
    // `was_open` tracks the last rendered value so the runtime activates and
    // tears down on the flip, as the element's `changed()` did.
    let mut was_open = use_signal(|| open);
    if open != *was_open.peek() {
        was_open.set(open);
    }

    let panel_id = format!("{instance}-panel");
    let panel_label = title
        .clone()
        .filter(|v| !v.is_empty())
        .or_else(|| accessible_label.clone().filter(|v| !v.is_empty()));
    let mut wiring = use_signal(|| Wiring {
        open,
        label: panel_label.clone(),
        panel_id: panel_id.clone(),
    });
    let current = Wiring {
        open,
        label: panel_label,
        panel_id,
    };
    if *wiring.peek() != current {
        wiring.set(current);
    }

    let mut latest = use_signal(|| on_open_change);
    if *latest.peek() != on_open_change {
        latest.set(on_open_change);
    }

    let mut host = use_signal(|| None::<Rc<MountedData>>);
    wasm::wire_trigger(host, wiring);
    wasm::listen_activation(host, latest);
    wasm::follow_open(host, was_open, latest);

    rsx! {
        ty-popover {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "open": open.then_some("true"),
            "trigger-label": trigger_label.as_deref().filter(|v| !v.is_empty()),
            "title": title.as_deref().filter(|v| !v.is_empty()),
            "placement": Some(placement.as_str()),
            "align": Some(align.as_str()),
            "offset": (!offset.is_empty()).then_some(offset.as_str()),
            "show-arrow": show_arrow.as_deref().filter(|v| !v.is_empty()),
            "panel-test-id": panel_test_id.as_deref().filter(|v| !v.is_empty()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            onmounted: move |event: MountedEvent| host.set(Some(event.data())),
            onkeydown: move |event: KeyboardEvent| {
                if event.key() != Key::Escape || event.is_composing() || !open {
                    return;
                }
                event.stop_propagation();
                request_open(on_open_change, false);
            },
            div {
                class: "ty-popover__anchor",
                if !(slot_trigger) {
                    button {
                        class: "ty-button ty-popover__trigger",
                        "type": Some("button"),
                        "aria-label": trigger_label.as_deref().filter(|v| !v.is_empty()),
                        "aria-haspopup": Some("dialog"),
                        "data-variant": Some("quiet"),
                        "data-size": Some("compact"),
                        "data-shape": Some("circle"),
                        "data-icon-only": Some(""),
                        onclick: move |_| request_open(on_open_change, !open),
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
                                circle {
                                    class: "ty-popover__glyph",
                                    "cx": Some("12"),
                                    "cy": Some("12"),
                                    "r": Some("10"),
                                }
                                path {
                                    class: "ty-popover__glyph",
                                    "d": Some("M12 16v-4"),
                                }
                                path {
                                    class: "ty-popover__glyph",
                                    "d": Some("M12 8h.01"),
                                }
                            }
                        }
                    }
                }
                if slot_trigger {
                    {trigger.clone()}
                }
                div {
                    class: "ty-popover",
                    "hidden": if !(open) { Some("true") } else { None },
                    "role": Some("dialog"),
                    "data-placement": Some(placement.as_str()),
                    "data-testid": panel_test_id.as_deref().filter(|v| !v.is_empty()),
                    onanimationend: move |_| wasm::clear_entering(host),
                    if !(show_arrow.as_deref() == Some("false")) {
                        div {
                            class: "ty-popover__arrow",
                            "aria-hidden": Some("true"),
                        }
                    }
                    div {
                        class: "ty-popover__dialog",
                        if title.as_deref().is_some_and(|v| !v.is_empty()) {
                            h3 {
                                class: "ty-popover__title",
                                {title.clone().unwrap_or_default()}
                            }
                        }
                        if slot_default {
                            div {
                                class: "ty-popover__content",
                                {children.clone()}
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

    use super::{PopoverOpenChange, Wiring};

    pub fn wire_trigger(_host: Signal<Option<Rc<MountedData>>>, _wiring: Signal<Wiring>) {}

    pub fn listen_activation(
        _host: Signal<Option<Rc<MountedData>>>,
        _handler: Signal<Option<EventHandler<PopoverOpenChange>>>,
    ) {
    }

    pub fn follow_open(
        _host: Signal<Option<Rc<MountedData>>>,
        _was_open: Signal<bool>,
        _handler: Signal<Option<EventHandler<PopoverOpenChange>>>,
    ) {
    }

    pub fn clear_entering(_host: Signal<Option<Rc<MountedData>>>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::cell::Cell;
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    use super::{PopoverOpenChange, Wiring};

    /// Pixels kept between the panel and every viewport edge (the spec's 16 px gutter).
    const VIEWPORT_MARGIN: f64 = 16.0;

    /// Spacing scale steps in px (the `offset` prop is a step index).
    const SPACE_STEPS: [f64; 10] = [0.0, 4.0, 8.0, 12.0, 16.0, 24.0, 32.0, 48.0, 64.0, 96.0];

    /// The physical side of the trigger the panel sits on.
    #[derive(Clone, Copy, PartialEq, Eq)]
    enum Side {
        Top,
        Bottom,
        Left,
        Right,
    }

    impl Side {
        fn as_str(self) -> &'static str {
            match self {
                Side::Top => "top",
                Side::Bottom => "bottom",
                Side::Left => "left",
                Side::Right => "right",
            }
        }

        fn opposite(self) -> Side {
            match self {
                Side::Top => Side::Bottom,
                Side::Bottom => Side::Top,
                Side::Left => Side::Right,
                Side::Right => Side::Left,
            }
        }

        fn is_vertical(self) -> bool {
            matches!(self, Side::Top | Side::Bottom)
        }
    }

    /// An axis-aligned rectangle in viewport pixels.
    #[derive(Clone, Copy)]
    struct Rect {
        x: f64,
        y: f64,
        width: f64,
        height: f64,
    }

    /// A width and height in pixels.
    #[derive(Clone, Copy)]
    struct Size {
        width: f64,
        height: f64,
    }

    /// The geometry the placement model computes (the arrow inset feeds the
    /// gap, not a rendered offset, so only x/y and the resolved side apply).
    struct Placed {
        x: f64,
        y: f64,
        side: Side,
    }

    /// The gap in px for an `offset` step; the arrow adds 6 px.
    fn offset_px(step: f64, show_arrow: bool) -> f64 {
        let index = step.trunc();
        let base = if index >= 0.0 && index < SPACE_STEPS.len() as f64 {
            SPACE_STEPS[index as usize]
        } else {
            8.0
        };
        base + if show_arrow { 6.0 } else { 0.0 }
    }

    /// The logical `placement` as a physical side in the current reading direction.
    fn physical_side(placement: &str, rtl: bool) -> Side {
        match placement {
            "top" => Side::Top,
            "end" => {
                if rtl {
                    Side::Left
                } else {
                    Side::Right
                }
            }
            "start" => {
                if rtl {
                    Side::Right
                } else {
                    Side::Left
                }
            }
            _ => Side::Bottom,
        }
    }

    /// Free space between the anchor and the viewport edge on `side`, after the margin.
    fn space(anchor: Rect, viewport: Size, side: Side) -> f64 {
        match side {
            Side::Top => anchor.y - VIEWPORT_MARGIN,
            Side::Bottom => viewport.height - (anchor.y + anchor.height) - VIEWPORT_MARGIN,
            Side::Left => anchor.x - VIEWPORT_MARGIN,
            Side::Right => viewport.width - (anchor.x + anchor.width) - VIEWPORT_MARGIN,
        }
    }

    /// The preferred side when the panel fits, the opposite when it has more room, else the preferred.
    fn resolve_side(
        anchor: Rect,
        panel: Size,
        viewport: Size,
        preferred: Side,
        offset: f64,
    ) -> Side {
        let needed = offset
            + if preferred.is_vertical() {
                panel.height
            } else {
                panel.width
            };
        let preferred_space = space(anchor, viewport, preferred);
        if preferred_space >= needed {
            return preferred;
        }
        let opposite = preferred.opposite();
        if space(anchor, viewport, opposite) > preferred_space {
            opposite
        } else {
            preferred
        }
    }

    fn cross_start(anchor_start: f64, anchor_len: f64, panel_len: f64, align: &str) -> f64 {
        match align {
            "start" => anchor_start,
            "end" => anchor_start + anchor_len - panel_len,
            _ => anchor_start + (anchor_len - panel_len) / 2.0,
        }
    }

    /// Keep the panel `VIEWPORT_MARGIN` from the edges; a panel larger than the viewport pins to the leading margin.
    fn clamp_axis(start: f64, panel_len: f64, viewport_len: f64) -> f64 {
        let max = viewport_len - VIEWPORT_MARGIN - panel_len;
        start.clamp(VIEWPORT_MARGIN, max.max(VIEWPORT_MARGIN))
    }

    /// Place `panel` next to `anchor` inside `viewport`.
    fn place(
        anchor: Rect,
        panel: Size,
        viewport: Size,
        preferred: Side,
        align: &str,
        offset: f64,
    ) -> Placed {
        let side = resolve_side(anchor, panel, viewport, preferred, offset);
        let (raw_x, raw_y) = match side {
            Side::Top => (
                cross_start(anchor.x, anchor.width, panel.width, align),
                anchor.y - offset - panel.height,
            ),
            Side::Bottom => (
                cross_start(anchor.x, anchor.width, panel.width, align),
                anchor.y + anchor.height + offset,
            ),
            Side::Left => (
                anchor.x - offset - panel.width,
                cross_start(anchor.y, anchor.height, panel.height, align),
            ),
            Side::Right => (
                anchor.x + anchor.width + offset,
                cross_start(anchor.y, anchor.height, panel.height, align),
            ),
        };
        Placed {
            x: clamp_axis(raw_x, panel.width, viewport.width),
            y: clamp_axis(raw_y, panel.height, viewport.height),
            side,
        }
    }

    /// A DOM listener removed on drop (the element's AbortController).
    struct Listener {
        target: web_sys::EventTarget,
        event: &'static str,
        capture: bool,
        closure: Closure<dyn FnMut(web_sys::Event)>,
    }

    impl Drop for Listener {
        fn drop(&mut self) {
            let _ = self.target.remove_event_listener_with_callback_and_bool(
                self.event,
                self.closure.as_ref().unchecked_ref(),
                self.capture,
            );
        }
    }

    fn listen(
        target: web_sys::EventTarget,
        event: &'static str,
        capture: bool,
        passive: bool,
        closure: Closure<dyn FnMut(web_sys::Event)>,
    ) -> Option<Listener> {
        let added = if capture || passive {
            let options = web_sys::AddEventListenerOptions::new();
            options.set_capture(capture);
            options.set_passive(passive);
            target.add_event_listener_with_callback_and_add_event_listener_options(
                event,
                closure.as_ref().unchecked_ref(),
                &options,
            )
        } else {
            target.add_event_listener_with_callback(event, closure.as_ref().unchecked_ref())
        };
        added.is_ok().then_some(Listener {
            target,
            event,
            capture,
            closure,
        })
    }

    /// The while-open listeners and the pending frame; dropping tears down
    /// like the element's `#teardown` did.
    struct Active {
        listeners: Vec<Listener>,
        raf: Rc<Cell<i32>>,
        panel: Option<web_sys::Element>,
    }

    impl Drop for Active {
        fn drop(&mut self) {
            if let Some(window) = web_sys::window() {
                let _ = window.cancel_animation_frame(self.raf.get());
            }
            if let Some(panel) = self
                .panel
                .as_ref()
                .and_then(|p| p.dyn_ref::<web_sys::HtmlElement>())
            {
                let _ = panel.style().remove_property("inset");
            }
            self.listeners.clear();
        }
    }

    /// The control that toggles the panel: the trigger slot's first element,
    /// else the built-in info button.
    fn find_trigger(host: &web_sys::Element) -> Option<web_sys::Element> {
        if let Ok(Some(builtin)) = host.query_selector(".ty-popover__trigger") {
            return Some(builtin);
        }
        let anchor = host.query_selector(".ty-popover__anchor").ok()??;
        let children = anchor.children();
        for index in 0..children.length() {
            let child = children.item(index)?;
            if child.class_list().contains("ty-popover") {
                continue;
            }
            return Some(child);
        }
        None
    }

    fn find_panel(host: &web_sys::Element) -> Option<web_sys::Element> {
        host.query_selector(".ty-popover").ok().flatten()
    }

    /// The trigger reflects open state and points at the panel; the panel's
    /// name comes from `title` or `accessibleLabel` (runtime only, as the
    /// element's `#wireTrigger` — the SSR markup carries none of it).
    pub fn wire_trigger(host: Signal<Option<Rc<MountedData>>>, wiring: Signal<Wiring>) {
        use_effect(move || {
            let wiring = wiring();
            let Some(host) = host_element(host) else {
                return;
            };
            let Some(trigger) = find_trigger(&host) else {
                return;
            };
            let Some(panel) = find_panel(&host) else {
                return;
            };
            let _ = trigger.set_attribute("aria-haspopup", "dialog");
            let _ =
                trigger.set_attribute("aria-expanded", if wiring.open { "true" } else { "false" });
            if panel.get_attribute("aria-label").is_none() {
                if let Some(label) = wiring.label.as_deref() {
                    let _ = panel.set_attribute("aria-label", label);
                }
            }
            if panel.get_attribute("id").is_none() {
                let _ = panel.set_attribute("id", &wiring.panel_id);
            }
            if let Some(id) = panel.get_attribute("id") {
                let _ = trigger.set_attribute("aria-controls", &id);
            }
        });
    }

    /// A press on the slotted trigger asks for the toggle (the built-in info
    /// button asks through its own Dioxus `onclick`), as the element's
    /// host-level click listener did.
    pub fn listen_activation(
        host: Signal<Option<Rc<MountedData>>>,
        handler: Signal<Option<EventHandler<PopoverOpenChange>>>,
    ) {
        let mut listener = use_signal(|| None::<Rc<Listener>>);
        use_effect(move || {
            if listener.peek().is_some() {
                return;
            }
            let Some(element) = host_element(host) else {
                return;
            };
            let target: web_sys::EventTarget = element.clone().into();
            let host = element.clone();
            let closure =
                Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                    let Some(trigger) = find_trigger(&host) else {
                        return;
                    };
                    // The built-in button asks through its own Dioxus onclick.
                    if trigger.class_list().contains("ty-popover__trigger") {
                        return;
                    }
                    let inside = event
                        .target()
                        .and_then(|target| target.dyn_into::<web_sys::Node>().ok())
                        .is_some_and(|node| trigger.contains(Some(&node)));
                    if !inside {
                        return;
                    }
                    // The host's own control keeps its activation semantics; the
                    // component only asks for the toggle.
                    event.prevent_default();
                    let open = host.has_attribute("open");
                    if let Some(handler) = *handler.peek() {
                        handler.call(PopoverOpenChange { open: !open });
                    }
                });
            if let Some(active) = listen(target, "click", false, false, closure) {
                listener.set(Some(Rc::new(active)));
            }
        });
    }

    /// Driven by the controlled `open`: while open, a press that starts
    /// outside asks to close, focus leaving the host asks to close, the
    /// panel tracks the trigger on resize and scroll, and the first frame
    /// places it and plays the entering animation. Closing (or unmounting)
    /// tears it all down.
    pub fn follow_open(
        host: Signal<Option<Rc<MountedData>>>,
        was_open: Signal<bool>,
        handler: Signal<Option<EventHandler<PopoverOpenChange>>>,
    ) {
        let mut active = use_signal(|| None::<Active>);
        use_effect(move || {
            let open = was_open();
            let Some(element) = host_element(host) else {
                return;
            };
            if !open {
                active.set(None);
                return;
            }
            if active.peek().is_some() {
                return;
            }
            let raf = Rc::new(Cell::new(0));
            let mut listeners = Vec::new();
            // A press that starts outside closes; one that starts inside
            // (selecting text) does not.
            if let Some(document) = document() {
                let target: web_sys::EventTarget = document.into();
                let host = element.clone();
                let closure =
                    Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                        let inside = event
                            .target()
                            .and_then(|target| target.dyn_into::<web_sys::Node>().ok())
                            .is_some_and(|node| host.contains(Some(&node)));
                        if !inside {
                            if let Some(handler) = *handler.peek() {
                                handler.call(PopoverOpenChange { open: false });
                            }
                        }
                    });
                if let Some(listener) = listen(target, "pointerdown", false, false, closure) {
                    listeners.push(listener);
                }
            }
            // Focus leaving the panel (and not entering the trigger) closes.
            {
                let target: web_sys::EventTarget = element.clone().into();
                let host = element.clone();
                let closure =
                    Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                        let next = event
                            .dyn_ref::<web_sys::FocusEvent>()
                            .and_then(|focus| focus.related_target())
                            .and_then(|target| target.dyn_into::<web_sys::Node>().ok());
                        if next.as_ref().is_some_and(|node| host.contains(Some(node))) {
                            return;
                        }
                        if let Some(handler) = *handler.peek() {
                            handler.call(PopoverOpenChange { open: false });
                        }
                    });
                if let Some(listener) = listen(target, "focusout", false, false, closure) {
                    listeners.push(listener);
                }
            }
            // The panel's fixed position is recomputed while open.
            if let Some(window) = web_sys::window() {
                let target: web_sys::EventTarget = window.into();
                for (event, capture, passive) in [("resize", false, false), ("scroll", true, true)]
                {
                    let host = element.clone();
                    let raf = raf.clone();
                    let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                        place_panel(&host, raf.clone());
                    });
                    if let Some(listener) = listen(target.clone(), event, capture, passive, closure)
                    {
                        listeners.push(listener);
                    }
                }
            }
            // Place after the anatomy has had its frame (a framework commits
            // children and host attributes separately), then play the
            // entering animation, as the element's requestAnimationFrame did.
            let frame_host = element.clone();
            let frame_raf = raf.clone();
            raf.set(after_frame(move || {
                if !frame_host.is_connected() || !frame_host.has_attribute("open") {
                    return;
                }
                place_panel(&frame_host, frame_raf.clone());
                if let Ok(Some(panel)) = frame_host.query_selector(".ty-popover") {
                    let _ = panel.set_attribute("data-entering", "");
                }
            }));
            active.set(Some(Active {
                listeners,
                raf,
                panel: find_panel(&element),
            }));
        });
    }

    /// The entering animation ended; the marker goes away, as the element's
    /// animationend listener did.
    pub fn clear_entering(host: Signal<Option<Rc<MountedData>>>) {
        let Some(element) = host_element(host) else {
            return;
        };
        if let Ok(Some(panel)) = element.query_selector(".ty-popover") {
            let _ = panel.remove_attribute("data-entering");
        }
    }

    /// The panel is `position: fixed` at the geometry the shared placement
    /// model computes from the trigger's rectangle (side preference,
    /// collision flip, viewport clamp, arrow inset in the gap); the style
    /// lands on the next frame, as the element's `#place` did.
    fn place_panel(host: &web_sys::Element, raf: Rc<Cell<i32>>) {
        let Some(trigger) = find_trigger(host) else {
            return;
        };
        let Some(panel) = find_panel(host) else {
            return;
        };
        let Some(window) = web_sys::window() else {
            return;
        };
        let rect = trigger.get_bounding_client_rect();
        let anchor = Rect {
            x: rect.x(),
            y: rect.y(),
            width: rect.width(),
            height: rect.height(),
        };
        let Some(html_panel) = panel.dyn_ref::<web_sys::HtmlElement>() else {
            return;
        };
        // The panel measures itself at its natural size before placement.
        let style = window.get_computed_style(&panel).ok().flatten();
        let margin = |name: &str| {
            style
                .as_ref()
                .and_then(|style| style.get_property_value(name).ok())
                .and_then(|value| value.parse::<f64>().ok())
                .unwrap_or(0.0)
        };
        let size = Size {
            width: html_panel.offset_width() as f64
                + margin("margin-left")
                + margin("margin-right"),
            height: html_panel.offset_height() as f64
                + margin("margin-top")
                + margin("margin-bottom"),
        };
        let viewport = Size {
            width: document()
                .and_then(|doc| doc.document_element())
                .map(|root| root.client_width() as f64)
                .unwrap_or(0.0),
            height: window
                .inner_height()
                .ok()
                .and_then(|value| value.as_f64())
                .unwrap_or(0.0),
        };
        let rtl = window
            .get_computed_style(host)
            .ok()
            .flatten()
            .and_then(|style| style.get_property_value("direction").ok())
            .as_deref()
            == Some("rtl");
        let placement = host
            .get_attribute("placement")
            .unwrap_or_else(|| String::from("bottom"));
        let side = physical_side(&placement, rtl);
        let align = host
            .get_attribute("align")
            .unwrap_or_else(|| String::from("center"));
        let step = host
            .get_attribute("offset")
            .and_then(|value| value.parse::<f64>().ok())
            .unwrap_or(2.0);
        let show_arrow = host.get_attribute("show-arrow").as_deref() != Some("false");
        let offset = offset_px(step, show_arrow);
        let placed = place(anchor, size, viewport, side, &align, offset);
        let pending = raf.get();
        if pending != 0 {
            let _ = window.cancel_animation_frame(pending);
        }
        let panel = panel.clone();
        raf.set(after_frame(move || {
            let Some(html) = panel.dyn_ref::<web_sys::HtmlElement>() else {
                return;
            };
            let style = html.style();
            let _ = style.set_property("position", "fixed");
            let _ = style.set_property("left", &format!("{}px", js_round(placed.x)));
            let _ = style.set_property("top", &format!("{}px", js_round(placed.y)));
            let _ = style.set_property(
                "max-width",
                &format!("{}px", (viewport.width - 32.0).max(0.0)),
            );
            if let Ok(Some(arrow)) = panel.query_selector(".ty-popover__arrow") {
                let _ = arrow.set_attribute("data-side", placed.side.as_str());
            }
            let _ = panel.set_attribute("data-side", placed.side.as_str());
        }));
    }

    /// JavaScript's `Math.round`: half rounds toward +∞.
    fn js_round(value: f64) -> f64 {
        (value + 0.5).floor()
    }

    fn document() -> Option<web_sys::Document> {
        web_sys::window().and_then(|window| window.document())
    }

    fn after_frame(f: impl FnOnce() + 'static) -> i32 {
        let window = web_sys::window().expect("window");
        let frame = Closure::<dyn FnMut()>::once(f);
        let id = window
            .request_animation_frame(frame.as_ref().unchecked_ref())
            .unwrap_or(0);
        frame.forget();
        id
    }

    fn host_element(host: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        host()?.downcast::<web_sys::Element>().cloned()
    }
}
