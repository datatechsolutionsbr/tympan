//! Native port of `<ty-modal>`: the backdrop/panel anatomy comes from the
//! same `rsx!` the generated binding renders, and the modal behaviour the
//! custom element added is here in Rust instead. Visibility stays
//! controlled — the component only asks (`on_open_change`, `open: false`)
//! on Escape, the close button or an allowed backdrop press, never while
//! `busy`; the host flips `is_open`. A press that starts inside the panel
//! and is released on the backdrop (selecting text) does not dismiss, and
//! an `alertdialog` never dismisses through the backdrop. Focus moves into
//! the panel on open (a `[data-autofocus]` control, else the title, else an
//! alertdialog's first action — the least destructive, by convention — else
//! the first tabbable, else the panel itself), Tab and Shift+Tab wrap inside
//! it, and focus returns to the invoking element on close. The page behind
//! is inert and scroll-locked (a shared counter for stacked modals) while
//! open. The DOM-only parts (focus, inert, scroll lock, the entering
//! animation) live in the `wasm` module, cfg-gated with a no-op twin.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::{has_content, use_instance_id};

/// Maximum panel width step.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ModalWidth {
    Narrow,
    #[default]
    Regular,
    Wide,
    Xwide,
}

impl ModalWidth {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            ModalWidth::Narrow => "narrow",
            ModalWidth::Regular => "regular",
            ModalWidth::Wide => "wide",
            ModalWidth::Xwide => "xwide",
        }
    }
}

/// `alertdialog` for destructive or blocking confirmations: the backdrop never dismisses it and the close button is hidden, unless the props below say otherwise.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ModalRole {
    #[default]
    Dialog,
    Alertdialog,
}

impl ModalRole {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            ModalRole::Dialog => "dialog",
            ModalRole::Alertdialog => "alertdialog",
        }
    }
}

/// Where focus lands on open; a `[data-autofocus]` control inside wins either way. Unset on an `alertdialog`: the first action (the least destructive, by convention).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ModalInitialFocus {
    #[default]
    First,
    Title,
}

impl ModalInitialFocus {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            ModalInitialFocus::First => "first",
            ModalInitialFocus::Title => "title",
        }
    }
}

/// The element asks the host to change visibility — `open: false` on Escape, the close button or an allowed backdrop press. Controlled: the element does not close itself; the host flips `isOpen`.
#[derive(Clone, Debug, PartialEq)]
pub struct ModalOpenChange {
    pub open: bool,
}

/// What the initial-focus effect needs from the props. The element read the
/// `initial-focus` attribute to tell "unset" apart from an explicit `first`
/// (only an unset alertdialog starts on its first action); a Dioxus prop
/// cannot make that distinction, so an alertdialog with the default `First`
/// follows the documented "unset" rule.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct FocusPlan {
    role: ModalRole,
    initial_focus: ModalInitialFocus,
}

/// The element asks the host to close (`busy` vetoes); the host flips
/// `is_open` (controlled visibility).
fn request_close(handler: Option<EventHandler<ModalOpenChange>>, busy: bool) {
    if busy {
        return;
    }
    if let Some(handler) = handler {
        handler.call(ModalOpenChange { open: false });
    }
}

/// Focused modal window for a decision or a short form: a backdrop and a panel (title, optional description, scrolling body, actions row, optional close button). Controlled through `open`; the element asks to close with `ty-open-change` (Escape, the close button, an allowed backdrop press) and the host flips `open`. Focus moves into the panel on open, is trapped while open, and returns to the invoking element on close; the page behind is inert and does not scroll.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyModal(
    /// Shown (controlled). The anatomy stays mounted but `hidden` while closed, so nothing reaches the accessibility tree.
    #[props(default)]
    is_open: bool,
    /// Maximum panel width step.
    #[props(default)]
    width: ModalWidth,
    /// `alertdialog` for destructive or blocking confirmations: the backdrop never dismisses it and the close button is hidden, unless the props below say otherwise.
    #[props(default)]
    role: ModalRole,
    /// `true` or `false`; unset: the backdrop dismisses a `dialog`, never an `alertdialog`.
    #[props(into)]
    dismiss_on_backdrop: Option<String>,
    /// `true` or `false`; unset: shown on a `dialog`, hidden on an `alertdialog`.
    #[props(into)]
    show_close_button: Option<String>,
    /// Where focus lands on open; a `[data-autofocus]` control inside wins either way. Unset on an `alertdialog`: the first action (the least destructive, by convention).
    #[props(default)]
    initial_focus: ModalInitialFocus,
    /// An action is pending: closing (Escape, the backdrop, the close button) is disabled and the panel is `aria-busy`.
    #[props(default)]
    busy: bool,
    /// Accessible name of the close button.
    #[props(into, default = String::from("Close"))]
    close_label: String,
    /// Accessible name of the panel when the title slot is empty and no `labelledBy` is given.
    #[props(into)]
    accessible_label: Option<String>,
    /// `aria-labelledby` of the panel (a host that renders its own title element), joined before the title slot's heading.
    #[props(into)]
    labelled_by: Option<String>,
    /// `aria-describedby` of the panel, joined before the description slot's paragraph.
    #[props(into)]
    described_by: Option<String>,
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
    /// The accessible name, rendered as the panel's heading (required by the spec; `accessibleLabel` or `labelledBy` names the panel when it is empty).
    title: Option<Element>,
    /// Accessible description under the header.
    description: Option<Element>,
    /// The body; scrolls when long while the header and the actions stay visible.
    children: Element,
    /// The actions row (primary last on the end side). Pressing an action runs its own handler; the dialog stays open unless the host flips `isOpen`.
    actions: Option<Element>,
    /// The element asks the host to change visibility — `open: false` on Escape, the close button or an allowed backdrop press. Controlled: the element does not close itself; the host flips `isOpen`.
    on_open_change: Option<EventHandler<ModalOpenChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_title = title.is_some();
    let slot_description = description.is_some();
    let slot_default = has_content(&children);
    let slot_actions = actions.is_some();

    // Visibility is controlled: `is_open` is only mirrored so the DOM effect
    // can follow it.
    let mut was_open = use_signal(|| false);
    if is_open != *was_open.peek() {
        was_open.set(is_open);
    }
    let mut plan = use_signal(|| FocusPlan {
        role,
        initial_focus,
    });
    let next_plan = FocusPlan {
        role,
        initial_focus,
    };
    if *plan.peek() != next_plan {
        plan.set(next_plan);
    }

    // The backdrop press dismisses a dialog unless told otherwise; an
    // alertdialog never.
    let backdrop_dismisses = dismiss_on_backdrop
        .as_deref()
        .map(|value| value != "false")
        .unwrap_or(role != ModalRole::Alertdialog);

    // A press is a backdrop press only when it starts on the backdrop; the
    // panel stops propagation so a press inside it never counts.
    let mut press_on_backdrop = use_signal(|| false);

    let mut host = use_signal(|| None::<Rc<MountedData>>);
    wasm::follow_open(host, was_open, plan);

    rsx! {
        ty-modal {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "open": is_open.then_some("true"),
            "width": Some(width.as_str()),
            "dialog-role": Some(role.as_str()),
            "dismiss-on-backdrop": dismiss_on_backdrop.as_deref().filter(|v| !v.is_empty()),
            "show-close-button": show_close_button.as_deref().filter(|v| !v.is_empty()),
            "initial-focus": Some(initial_focus.as_str()),
            "busy": busy.then_some(""),
            "close-label": (!close_label.is_empty()).then_some(close_label.as_str()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "labelled-by": labelled_by.as_deref().filter(|v| !v.is_empty()),
            "described-by": described_by.as_deref().filter(|v| !v.is_empty()),
            "panel-test-id": panel_test_id.as_deref().filter(|v| !v.is_empty()),
            "backdrop-test-id": backdrop_test_id.as_deref().filter(|v| !v.is_empty()),
            onmounted: move |event: MountedEvent| host.set(Some(event.data())),
            onkeydown: move |event: KeyboardEvent| {
                let key = event.key();
                if key == Key::Escape {
                    if event.is_composing() || busy || !is_open {
                        return;
                    }
                    event.prevent_default();
                    event.stop_propagation();
                    request_close(on_open_change, busy);
                    return;
                }
                if key != Key::Tab || !is_open {
                    return;
                }
                event.prevent_default();
                event.stop_propagation();
                wasm::cycle_focus(host, event.modifiers().shift());
            },
            div {
                class: "ty-modal-dialog__backdrop",
                "hidden": if !(is_open) { Some("true") } else { None },
                "data-testid": backdrop_test_id.as_deref().filter(|v| !v.is_empty()),
                onmousedown: move |event: MouseEvent| {
                    press_on_backdrop.set(true);
                    // Keep focus inside the dialog: a press on the backdrop
                    // must not move focus to the body.
                    event.prevent_default();
                },
                onclick: move |_| {
                    if *press_on_backdrop.peek() && backdrop_dismisses {
                        request_close(on_open_change, busy);
                    }
                    press_on_backdrop.set(false);
                },
                onanimationend: move |_| wasm::clear_entering(host),
                div {
                    class: "ty-modal-dialog",
                    "data-width": Some(width.as_str()),
                    onmousedown: move |event: MouseEvent| event.stop_propagation(),
                    onclick: move |event: MouseEvent| event.stop_propagation(),
                    onanimationend: move |_| wasm::clear_entering(host),
                    div {
                        class: "ty-modal-dialog__panel",
                        "role": Some(role.as_str()),
                        "aria-modal": Some("true"),
                        "tabindex": Some("-1"),
                        "aria-labelledby": { let ids: Vec<String> = [labelled_by.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()), if slot_title { Some(format!("{instance}-title")) } else { None }].into_iter().flatten().collect(); (!ids.is_empty()).then_some(ids.join(" ")) },
                        "aria-describedby": { let ids: Vec<String> = [described_by.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()), if slot_description { Some(format!("{instance}-description")) } else { None }].into_iter().flatten().collect(); (!ids.is_empty()).then_some(ids.join(" ")) },
                        "aria-label": if !(slot_title) && !(labelled_by.as_deref().is_some_and(|v| !v.is_empty())) { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                        "data-busy": (busy).then_some(""),
                        "data-testid": panel_test_id.as_deref().filter(|v| !v.is_empty()),
                        div {
                            class: "ty-modal-dialog__inner",
                            "aria-busy": (busy).then_some("true"),
                            if (slot_title || show_close_button.as_deref() == Some("true") || !(role == ModalRole::Alertdialog)) && (slot_title || !(show_close_button.as_deref() == Some("false"))) {
                                header {
                                    class: "ty-modal-dialog__header",
                                    if slot_title {
                                        h2 {
                                            class: "ty-modal-dialog__title",
                                            "id": Some(format!("{instance}-title")),
                                            "tabindex": Some("-1"),
                                            {title.clone()}
                                        }
                                    }
                                    if !(show_close_button.as_deref() == Some("false")) && (show_close_button.as_deref() == Some("true") || !(role == ModalRole::Alertdialog)) {
                                        button {
                                            class: "ty-button ty-modal-dialog__close",
                                            "type": Some("button"),
                                            "aria-label": (!close_label.is_empty()).then_some(close_label.as_str()),
                                            "title": (!close_label.is_empty()).then_some(close_label.as_str()),
                                            disabled: busy,
                                            "data-variant": Some("quiet"),
                                            "data-size": Some("compact"),
                                            "data-shape": Some("circle"),
                                            "data-icon-only": Some(""),
                                            onclick: move |_| request_close(on_open_change, busy),
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
                                                        class: "ty-modal-dialog__glyph",
                                                        "d": Some("M18 6 6 18"),
                                                    }
                                                    path {
                                                        class: "ty-modal-dialog__glyph",
                                                        "d": Some("m6 6 12 12"),
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if slot_description {
                                p {
                                    class: "ty-modal-dialog__description",
                                    "id": Some(format!("{instance}-description")),
                                    {description.clone()}
                                }
                            }
                            if slot_default {
                                div {
                                    class: "ty-modal-dialog__body",
                                    {children.clone()}
                                }
                            }
                            if slot_actions {
                                footer {
                                    class: "ty-modal-dialog__actions",
                                    {actions.clone()}
                                }
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

    use super::FocusPlan;

    pub fn follow_open(
        _host: Signal<Option<Rc<MountedData>>>,
        _was_open: Signal<bool>,
        _plan: Signal<FocusPlan>,
    ) {
    }

    pub fn cycle_focus(_host: Signal<Option<Rc<MountedData>>>, _backwards: bool) {}

    pub fn clear_entering(_host: Signal<Option<Rc<MountedData>>>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::cell::{Cell, RefCell};
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    use super::{FocusPlan, ModalInitialFocus, ModalRole};

    /// Elements that may take keyboard focus inside the panel.
    const FOCUSABLE: &str = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

    /// Marker of the elements this component made inert (a host's own inert is left alone).
    const INERT_MARK: &str = "data-ty-modal-inert";

    thread_local! {
        /// Open modals share one page scroll lock; the last one to close releases it.
        static SCROLL_LOCKS: Cell<u32> = const { Cell::new(0) };
    }

    /// The modal contract, driven by the controlled `is_open`: on open, lock
    /// the page scroll, inert the page behind, move focus into the panel and
    /// play the entering animation after the first frame; on close, undo it
    /// all and return focus to what had it when the modal opened (if that
    /// was outside). Unmounting releases the page like a close did.
    pub fn follow_open(
        host: Signal<Option<Rc<MountedData>>>,
        was_open: Signal<bool>,
        plan: Signal<FocusPlan>,
    ) {
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
                // A framework keeps owning focus across the commit that
                // closed the modal, so the return waits a frame; a modal
                // opened in between still wins, its own frame callback
                // running later.
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
            // Focus returns to what had it, if that was outside the panel.
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
            let plan = *plan.peek();
            after_frame(move || {
                if !host.is_connected() || !host.has_attribute("open") {
                    return;
                }
                focus_initial(&host, plan);
                if let Ok(parts) =
                    host.query_selector_all(".ty-modal-dialog__backdrop, .ty-modal-dialog")
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

    /// Tab wraps around the panel's tabbables (the trap).
    pub fn cycle_focus(host: Signal<Option<Rc<MountedData>>>, backwards: bool) {
        let Some(element) = host_element(host) else { return };
        let Ok(Some(panel)) = element.query_selector(".ty-modal-dialog__panel") else {
            return;
        };
        let tabbables = tabbables(&panel);
        if tabbables.is_empty() {
            if let Some(html) = panel.dyn_ref::<web_sys::HtmlElement>() {
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
        if let Ok(parts) =
            element.query_selector_all(".ty-modal-dialog__backdrop, .ty-modal-dialog")
        {
            for index in 0..parts.length() {
                if let Some(part) = element_at(&parts, index) {
                    let _ = part.remove_attribute("data-entering");
                }
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
                    let _ = root.set_attribute("data-ty-modal-open", "");
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
                    let _ = root.remove_attribute("data-ty-modal-open");
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

    /// The panel's tabbables, skipping anything inside a `hidden` part.
    fn tabbables(panel: &web_sys::Element) -> Vec<web_sys::Element> {
        let Ok(nodes) = panel.query_selector_all(FOCUSABLE) else {
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

    fn focus(element: &web_sys::Element) {
        if let Some(html) = element.dyn_ref::<web_sys::HtmlElement>() {
            let _ = html.focus();
        }
    }

    /// Where focus lands on open: a `[data-autofocus]` control wins, else the
    /// title (`initial_focus: Title`), else an alertdialog's first action
    /// (the least destructive, by convention), else the first tabbable, else
    /// the panel itself.
    fn focus_initial(host: &web_sys::Element, plan: FocusPlan) {
        let Ok(Some(panel)) = host.query_selector(".ty-modal-dialog__panel") else {
            return;
        };
        if let Some(active) = document().and_then(|doc| doc.active_element()) {
            if contains(&panel, &active) {
                return;
            }
        }
        if let Ok(Some(chosen)) = panel.query_selector("[data-autofocus]") {
            focus(&chosen);
            return;
        }
        if plan.initial_focus == ModalInitialFocus::Title {
            if let Ok(Some(title)) = panel.query_selector(".ty-modal-dialog__title") {
                focus(&title);
            }
            return;
        }
        if plan.role == ModalRole::Alertdialog {
            if let Ok(Some(action)) =
                panel.query_selector(".ty-modal-dialog__actions button:not([disabled])")
            {
                focus(&action);
                return;
            }
        }
        let tabbables = tabbables(&panel);
        let target = tabbables.first().cloned().unwrap_or(panel);
        focus(&target);
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
