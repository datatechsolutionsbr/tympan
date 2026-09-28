//! Native port of `<ty-toast>`, the self-rendering toast region: the
//! component owns the queue and the history in signals and renders the fixed
//! region landmark with its two live-region lists (errors in an assertive
//! `role="alert"` list, every other tone in a polite `role="status"` list,
//! not nested) — exactly the subtree the custom element builds on connect.
//! The element's imperative API (`show`, the `success`/`error`/`warning`/
//! `info` shortcuts, `dismiss(id)` and `history`) has no host element to
//! live on without `elements.js`, so the component provides it as a
//! [`ToastHandle`] through context ([`use_toast`]). The auto-dismiss timers
//! with their pause on hover, focus and a hidden window, F6 focus cycling
//! into the region and back out, and the focus return when the last focused
//! toast closes are DOM effects, cfg-gated in `mod wasm` with a no-op
//! non-wasm twin; Escape, the touch swipe and the action/dismiss buttons are
//! plain Dioxus events. Not ported: the arrival haptic
//! (`navigator.vibrate(8)` — cosmetic, silent before the first user gesture
//! and under reduced motion, with no state or markup footprint) and the
//! history records' `createdAt` timestamp (the queue order already is the
//! history order).

use std::rc::Rc;
use std::sync::atomic::{AtomicU64, Ordering};

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

static TOASTS: AtomicU64 = AtomicU64::new(0);

/// Region position (`data-placement`); `bottom-center` is recommended below 640 px.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ToastPlacement {
    #[default]
    TopEnd,
    TopCenter,
    BottomCenter,
}

impl ToastPlacement {
    pub const fn as_str(self) -> &'static str {
        match self {
            ToastPlacement::TopEnd => "top-end",
            ToastPlacement::TopCenter => "top-center",
            ToastPlacement::BottomCenter => "bottom-center",
        }
    }
}

/// The tone of a toast; errors live in the assertive live region and never auto-dismiss by default.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ToastTone {
    Success,
    Error,
    Warning,
    #[default]
    Info,
}

impl ToastTone {
    pub const fn as_str(self) -> &'static str {
        match self {
            ToastTone::Success => "success",
            ToastTone::Error => "error",
            ToastTone::Warning => "warning",
            ToastTone::Info => "info",
        }
    }
}

/// Auto-dismiss time, or persistent. Errors and toasts with an action default to persistent (WCAG 2.2.1).
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ToastDuration {
    Milliseconds(f64),
    Persistent,
}

impl ToastDuration {
    /// The duration a `show` without one gets: persistent with an action or
    /// for errors, else 5 s (success/info) or 8 s (warning).
    fn default_for(tone: ToastTone, has_action: bool) -> ToastDuration {
        if has_action {
            return ToastDuration::Persistent;
        }
        match tone {
            ToastTone::Success | ToastTone::Info => ToastDuration::Milliseconds(5000.0),
            ToastTone::Warning => ToastDuration::Milliseconds(8000.0),
            ToastTone::Error => ToastDuration::Persistent,
        }
    }

    /// The auto-dismiss time of a non-persistent toast; only the wasm timers read it.
    #[cfg(target_arch = "wasm32")]
    fn milliseconds(self) -> Option<f64> {
        match self {
            ToastDuration::Milliseconds(ms) => Some(ms),
            ToastDuration::Persistent => None,
        }
    }
}

/// One optional action, such as "Undo"; makes the toast persistent by default (WCAG 2.2.1).
#[derive(Clone, PartialEq)]
pub struct ToastAction {
    pub label: String,
    pub on_press: Option<EventHandler<()>>,
}

/// Options of [`ToastHandle::show`] and the tone shortcuts.
#[derive(Clone, Default, PartialEq)]
pub struct ToastOptions {
    /// The tone; `info` when unset.
    pub tone: Option<ToastTone>,
    pub title: String,
    pub message: Option<String>,
    /// One optional action, such as "Undo"; makes the toast persistent by default (WCAG 2.2.1).
    pub action: Option<ToastAction>,
    /// Auto-dismiss time, or persistent. Errors and toasts with an action default to persistent.
    pub duration: Option<ToastDuration>,
    /// A later call with the same id replaces this toast in place.
    pub id: Option<String>,
}

impl ToastOptions {
    /// Options of a toast with `title`; every other field takes its default.
    pub fn new(title: impl Into<String>) -> ToastOptions {
        ToastOptions {
            title: title.into(),
            ..ToastOptions::default()
        }
    }
}

/// A queued or past toast.
#[derive(Clone, PartialEq)]
pub struct ToastRecord {
    pub id: String,
    pub tone: ToastTone,
    pub title: String,
    pub message: Option<String>,
    pub action: Option<ToastAction>,
    pub duration: ToastDuration,
}

/// A toast was dismissed — timeout, dismiss button, Escape, swipe, its action, or a `dismiss(id)` call; the detail carries its id (the spec's `onDismiss`).
#[derive(Clone, Debug, PartialEq)]
pub struct ToastToastDismiss {
    pub id: String,
}

/// A toast's action was pressed; its `onPress` ran too and the toast dismissed itself. Lets hosts that cannot pass a callback still react to the action.
#[derive(Clone, Debug, PartialEq)]
pub struct ToastToastAction {
    pub id: String,
}

/// The imperative API of the nearest `<ty-toast>` ancestor: the element's
/// `show`/`success`/`error`/`warning`/`info`/`dismiss`/`history`, reachable
/// through [`use_toast`] instead of a host ref.
#[derive(Clone, PartialEq)]
pub struct ToastHandle {
    queue: Signal<Vec<ToastRecord>>,
    history: Signal<Vec<ToastRecord>>,
    max_visible: Signal<f64>,
    history_limit: Signal<f64>,
    on_dismiss: Signal<Option<EventHandler<ToastToastDismiss>>>,
    on_action: Signal<Option<EventHandler<ToastToastAction>>>,
    effects: wasm::RegionEffects,
}

impl ToastHandle {
    /// Queue a toast (or replace it, on an existing `id`); returns the id.
    pub fn show(&self, options: ToastOptions) -> String {
        let tone = options.tone.unwrap_or_default();
        let id = options
            .id
            .filter(|id| !id.is_empty())
            .unwrap_or_else(|| format!("ty-toast-{}", TOASTS.fetch_add(1, Ordering::Relaxed) + 1));
        let duration = options
            .duration
            .unwrap_or_else(|| ToastDuration::default_for(tone, options.action.is_some()));
        let record = ToastRecord {
            id: id.clone(),
            tone,
            title: options.title,
            message: options.message.filter(|message| !message.is_empty()),
            action: options.action,
            duration,
        };
        let mut queue = self.queue;
        let mut queue = queue.write();
        if let Some(existing) = queue.iter_mut().find(|toast| toast.id == id) {
            *existing = record.clone();
        } else {
            queue.push(record.clone());
        }
        drop(queue);
        let limit = (*self.history_limit.peek()).max(0.0) as usize;
        let mut history = self.history;
        let mut history = history.write();
        history.retain(|toast| toast.id != id);
        history.insert(0, record);
        history.truncate(limit);
        id
    }

    /// Queue a success toast.
    pub fn success(&self, title: impl Into<String>, options: ToastOptions) -> String {
        self.shortcut(ToastTone::Success, title, options)
    }

    /// Queue an error toast (persistent by default).
    pub fn error(&self, title: impl Into<String>, options: ToastOptions) -> String {
        self.shortcut(ToastTone::Error, title, options)
    }

    /// Queue a warning toast.
    pub fn warning(&self, title: impl Into<String>, options: ToastOptions) -> String {
        self.shortcut(ToastTone::Warning, title, options)
    }

    /// Queue an info toast.
    pub fn info(&self, title: impl Into<String>, options: ToastOptions) -> String {
        self.shortcut(ToastTone::Info, title, options)
    }

    fn shortcut(&self, tone: ToastTone, title: impl Into<String>, mut options: ToastOptions) -> String {
        options.tone = Some(tone);
        options.title = title.into();
        self.show(options)
    }

    /// Remove a toast (no-op for an unknown id) and announce the dismissal.
    pub fn dismiss(&self, id: &str) {
        dismiss_toast(self.queue, self.max_visible, self.on_dismiss, &self.effects, id);
    }

    /// Past toasts, newest first (feeds the notification history).
    pub fn history(&self) -> Vec<ToastRecord> {
        self.history.read().clone()
    }

    /// A toast's action was pressed; announced before the toast dismisses
    /// itself, like the element's `ty-toast-action`.
    fn notify_action(&self, id: &str) {
        if let Some(handler) = *self.on_action.peek() {
            handler.call(ToastToastAction { id: id.to_string() });
        }
    }
}

/// The [`ToastHandle`] of the nearest `<ty-toast>` ancestor; panics without
/// one, like any missing context.
pub fn use_toast() -> ToastHandle {
    use_context()
}

/// Remove a toast and announce the dismissal; shared by [`ToastHandle::dismiss`]
/// and the wasm timers, which cannot hold the handle (it would keep the
/// region's effects alive past unmount).
fn dismiss_toast(
    mut queue: Signal<Vec<ToastRecord>>,
    max_visible: Signal<f64>,
    on_dismiss: Signal<Option<EventHandler<ToastToastDismiss>>>,
    effects: &wasm::RegionEffects,
    id: &str,
) {
    if !queue.peek().iter().any(|toast| toast.id == id) {
        return;
    }
    let visible = (*max_visible.peek()).max(0.0) as usize;
    let was_last_visible = queue.peek().iter().take(visible).count() == 1;
    effects.before_dismiss(was_last_visible);
    queue.write().retain(|toast| toast.id != id);
    if let Some(handler) = *on_dismiss.peek() {
        handler.call(ToastToastDismiss { id: id.to_string() });
    }
    effects.after_dismiss();
}

/// Brief, non-blocking confirmation or warning after an action, shown in a fixed landmark region with one live-region politeness per tone (errors assertive, the rest polite). The element owns the queue and the history; toasts arrive through its imperative API (`show`, `success`/`error`/`warning`/`info`, `dismiss`, `history`), reachable through the host ref. Auto-dismiss pauses on hover, focus and a hidden window; errors and toasts with an action stay until dismissed.
#[allow(clippy::too_many_arguments)]
// `RegionEffects` is `Copy` off-wasm but an `Rc` on wasm, where the clones matter.
#[cfg_attr(not(target_arch = "wasm32"), allow(clippy::clone_on_copy))]
#[component]
pub fn TyToast(
    /// Region position (`data-placement`); `bottom-center` is recommended below 640 px.
    #[props(default)]
    placement: ToastPlacement,
    /// Toasts shown at once; the rest wait in the queue and appear as earlier ones dismiss.
    #[props(default = 3.0f64)]
    max_visible: f64,
    /// How many past toasts the history keeps (newest first); feeds the notification history.
    #[props(default = 50.0f64)]
    history_limit: f64,
    /// Accessible name of the region landmark (the I18nAdapter's toast.region in React).
    #[props(into, default = String::from("Notifications"))]
    region_label: String,
    /// Accessible name of each toast's dismiss button.
    #[props(into, default = String::from("Dismiss notification"))]
    dismiss_label: String,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// A toast was dismissed — timeout, dismiss button, Escape, swipe, its action, or a `dismiss(id)` call; the detail carries its id (the spec's `onDismiss`).
    on_dismiss: Option<EventHandler<ToastToastDismiss>>,
    /// A toast's action was pressed; its `onPress` ran too and the toast dismissed itself. Lets hosts that cannot pass a callback still react to the action.
    on_action: Option<EventHandler<ToastToastAction>>,
) -> Element {
    let instance = use_instance_id(instance);
    let effects = wasm::use_region_effects();

    let queue = use_signal(Vec::new);
    let history = use_signal(Vec::new);

    // Mirrored props: the imperative API and the effects read the latest
    // values through signals, as the element re-read its attributes.
    let mut mirrored_max_visible = use_signal(|| max_visible);
    if max_visible != *mirrored_max_visible.peek() {
        mirrored_max_visible.set(max_visible);
    }
    let mut mirrored_history_limit = use_signal(|| history_limit);
    if history_limit != *mirrored_history_limit.peek() {
        mirrored_history_limit.set(history_limit);
    }
    let mut mirrored_on_dismiss = use_signal(|| on_dismiss);
    if *mirrored_on_dismiss.peek() != on_dismiss {
        mirrored_on_dismiss.set(on_dismiss);
    }
    let mut mirrored_on_action = use_signal(|| on_action);
    if *mirrored_on_action.peek() != on_action {
        mirrored_on_action.set(on_action);
    }

    let handle = ToastHandle {
        queue,
        history,
        max_visible: mirrored_max_visible,
        history_limit: mirrored_history_limit,
        on_dismiss: mirrored_on_dismiss,
        on_action: mirrored_on_action,
        effects: effects.clone(),
    };
    use_context_provider(|| handle.clone());

    let mut region = use_signal(|| None::<Rc<MountedData>>);
    wasm::wire(effects.clone(), region, handle.clone());

    let visible_toasts: Vec<ToastRecord> = queue
        .read()
        .iter()
        .take(max_visible.max(0.0) as usize)
        .cloned()
        .collect();

    rsx! {
        ty-toast {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "placement": Some(placement.as_str()),
            "max-visible": Some(max_visible.to_string()),
            "history-limit": Some(history_limit.to_string()),
            "region-label": (!region_label.is_empty()).then_some(region_label.as_str()),
            "dismiss-label": (!dismiss_label.is_empty()).then_some(dismiss_label.as_str()),
            section {
                class: "ty-toast-region",
                "aria-label": Some(region_label.clone()),
                "data-placement": Some(placement.as_str()),
                onmounted: move |event: MountedEvent| region.set(Some(event.data())),
                onpointerenter: {
                    let effects = effects.clone();
                    move |_| effects.pause("hover")
                },
                onpointerleave: {
                    let effects = effects.clone();
                    move |_| effects.resume("hover")
                },
                div {
                    class: "ty-toast-region__list",
                    "role": Some("alert"),
                    "aria-live": Some("assertive"),
                    "aria-atomic": Some("false"),
                    for toast in visible_toasts.iter().filter(|toast| toast.tone == ToastTone::Error) {
                        ToastItem {
                            key: "{toast.id}",
                            record: toast.clone(),
                            dismiss_label: dismiss_label.clone(),
                            handle: handle.clone(),
                        }
                    }
                }
                div {
                    class: "ty-toast-region__list",
                    "role": Some("status"),
                    "aria-live": Some("polite"),
                    "aria-atomic": Some("false"),
                    for toast in visible_toasts.iter().filter(|toast| toast.tone != ToastTone::Error) {
                        ToastItem {
                            key: "{toast.id}",
                            record: toast.clone(),
                            dismiss_label: dismiss_label.clone(),
                            handle: handle.clone(),
                        }
                    }
                }
            }
        }
    }
}

/// A toast: tone icon, title, optional message, optional action, dismiss
/// button (the element's `#build`). Escape and the touch swipe dismiss it;
/// the swipe's transform is a `style` attribute driven by a signal.
#[component]
fn ToastItem(record: ToastRecord, dismiss_label: String, handle: ToastHandle) -> Element {
    // The active swipe, as (start x, pointer id), and its current offset.
    let mut swipe = use_signal(|| None::<(f64, i32)>);
    let mut offset = use_signal(|| 0.0f64);

    let icon = match record.tone {
        ToastTone::Success => rsx! {
            circle { "cx": Some("12"), "cy": Some("12"), "r": Some("10") }
            path { "d": Some("m16 9-5.5 5.5L8 12") }
        },
        ToastTone::Error => rsx! {
            circle { "cx": Some("12"), "cy": Some("12"), "r": Some("10") }
            line { "x1": Some("12"), "x2": Some("12"), "y1": Some("8"), "y2": Some("12") }
            line { "x1": Some("12"), "x2": Some("12.01"), "y1": Some("16"), "y2": Some("16") }
        },
        ToastTone::Warning => rsx! {
            path { "d": Some("m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3") }
            path { "d": Some("M12 9v4") }
            path { "d": Some("M12 17h.01") }
        },
        ToastTone::Info => rsx! {
            circle { "cx": Some("12"), "cy": Some("12"), "r": Some("10") }
            path { "d": Some("M12 16v-4") }
            path { "d": Some("M12 8h.01") }
        },
    };

    rsx! {
        div {
            class: "ty-toast",
            "data-tone": Some(record.tone.as_str()),
            "tabindex": Some("0"),
            "role": Some("group"),
            "aria-labelledby": Some(format!("{}-title", record.id)),
            "aria-describedby": record.message.as_ref().map(|_| format!("{}-message", record.id)),
            style: (offset() > 0.0).then(|| format!("transform: translateX({}px)", offset())),
            onkeydown: {
                let handle = handle.clone();
                let id = record.id.clone();
                move |event: KeyboardEvent| {
                    if event.key() == Key::Escape {
                        event.stop_propagation();
                        handle.dismiss(&id);
                    }
                }
            },
            onpointerdown: move |event: PointerEvent| {
                if event.pointer_type() == "touch" {
                    swipe.set(Some((event.client_coordinates().x, event.pointer_id())));
                }
            },
            onpointermove: move |event: PointerEvent| {
                if let Some((start, id)) = *swipe.peek() {
                    if id == event.pointer_id() {
                        offset.set((event.client_coordinates().x - start).max(0.0));
                    }
                }
            },
            onpointerup: {
                let handle = handle.clone();
                let id = record.id.clone();
                move |_| {
                    if swipe.peek().is_some() {
                        if offset() > 80.0 {
                            handle.dismiss(&id);
                        }
                        swipe.set(None);
                        offset.set(0.0);
                    }
                }
            },
            onpointercancel: {
                let handle = handle.clone();
                let id = record.id.clone();
                move |_| {
                    if swipe.peek().is_some() {
                        if offset() > 80.0 {
                            handle.dismiss(&id);
                        }
                        swipe.set(None);
                        offset.set(0.0);
                    }
                }
            },
            svg {
                class: "ty-toast__icon",
                "viewBox": Some("0 0 24 24"),
                "fill": Some("none"),
                "stroke": Some("currentColor"),
                "stroke-width": Some("2"),
                "stroke-linecap": Some("round"),
                "stroke-linejoin": Some("round"),
                "aria-hidden": Some("true"),
                "focusable": Some("false"),
                {icon}
            }
            div {
                class: "ty-toast__body",
                p {
                    class: "ty-toast__title",
                    "id": Some(format!("{}-title", record.id)),
                    "{record.title}"
                }
                if let Some(message) = record.message.clone() {
                    p {
                        class: "ty-toast__message",
                        "id": Some(format!("{}-message", record.id)),
                        "{message}"
                    }
                }
                if let Some(action) = record.action.clone() {
                    div {
                        class: "ty-toast__actions",
                        button {
                            class: "ty-button",
                            "type": Some("button"),
                            "data-variant": Some("secondary"),
                            "data-size": Some("compact"),
                            onclick: {
                                let handle = handle.clone();
                                let id = record.id.clone();
                                move |_| {
                                    if let Some(on_press) = action.on_press {
                                        on_press.call(());
                                    }
                                    handle.notify_action(&id);
                                    handle.dismiss(&id);
                                }
                            },
                            span {
                                class: "ty-button__label",
                                "{action.label}"
                            }
                        }
                    }
                }
            }
            button {
                class: "ty-button ty-toast__dismiss",
                "type": Some("button"),
                "data-variant": Some("quiet"),
                "data-size": Some("compact"),
                "data-icon-only": Some(""),
                "aria-label": Some(dismiss_label.clone()),
                title: Some(dismiss_label.clone()),
                onclick: {
                    let handle = handle.clone();
                    let id = record.id.clone();
                    move |_| handle.dismiss(&id)
                },
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
                        path { "d": Some("M18 6 6 18") }
                        path { "d": Some("m6 6 12 12") }
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

    use super::ToastHandle;

    #[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
    pub struct RegionEffects;

    impl RegionEffects {
        pub fn before_dismiss(&self, _was_last_visible: bool) {}

        pub fn after_dismiss(&self) {}

        pub fn pause(&self, _reason: &'static str) {}

        pub fn resume(&self, _reason: &'static str) {}
    }

    pub fn use_region_effects() -> RegionEffects {
        RegionEffects
    }

    pub fn wire(_effects: RegionEffects, _region: Signal<Option<Rc<MountedData>>>, _handle: ToastHandle) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::cell::RefCell;
    use std::collections::{HashMap, HashSet};
    use std::rc::{Rc, Weak};

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    use super::{dismiss_toast, ToastHandle, ToastRecord, ToastToastDismiss};

    /// One auto-dismiss timer: the closure is re-used across pause/resume
    /// (a cleared timeout does not invalidate it), like the element's
    /// `TimerEntry` with its remaining-time bookkeeping.
    struct TimerEntry {
        closure: Closure<dyn FnMut()>,
        timeout: Option<i32>,
        remaining: f64,
        started_at: f64,
        duration: f64,
    }

    struct Listener {
        target: web_sys::EventTarget,
        event: &'static str,
        closure: Closure<dyn FnMut(web_sys::Event)>,
    }

    impl Drop for Listener {
        fn drop(&mut self) {
            let _ = self
                .target
                .remove_event_listener_with_callback(self.event, self.closure.as_ref().unchecked_ref());
        }
    }

    #[derive(Default)]
    struct Inner {
        timers: HashMap<String, TimerEntry>,
        pause_reasons: HashSet<&'static str>,
        region: Option<web_sys::Element>,
        return_focus: Option<web_sys::HtmlElement>,
        focus_restore_pending: bool,
        pending_tick: Option<(i32, Closure<dyn FnMut()>)>,
        listeners: Vec<Listener>,
        wired: bool,
    }

    impl Inner {
        /// Arm the timers of newly visible, non-persistent toasts and clear
        /// the ones whose toast left the visible queue or was replaced with
        /// another duration — the element's `#render`/`#clearTimer` pair.
        fn sync_timers(
            &mut self,
            toasts: &[ToastRecord],
            max_visible: usize,
            queue: Signal<Vec<ToastRecord>>,
            max_visible_signal: Signal<f64>,
            on_dismiss: Signal<Option<EventHandler<ToastToastDismiss>>>,
            weak: &Weak<RefCell<Inner>>,
        ) {
            let visible: Vec<&ToastRecord> = toasts.iter().take(max_visible).collect();
            let stale: Vec<String> = self
                .timers
                .iter()
                .filter(|(id, entry)| {
                    let current = visible
                        .iter()
                        .find(|toast| toast.id == **id)
                        .and_then(|toast| toast.duration.milliseconds());
                    current != Some(entry.duration)
                })
                .map(|(id, _)| id.clone())
                .collect();
            for id in stale {
                self.clear_timer(&id);
            }
            for toast in visible {
                let Some(ms) = toast.duration.milliseconds() else { continue };
                if self.timers.contains_key(&toast.id) {
                    continue;
                }
                self.arm(&toast.id, ms, queue, max_visible_signal, on_dismiss, weak);
            }
        }

        fn arm(
            &mut self,
            id: &str,
            ms: f64,
            queue: Signal<Vec<ToastRecord>>,
            max_visible: Signal<f64>,
            on_dismiss: Signal<Option<EventHandler<ToastToastDismiss>>>,
            weak: &Weak<RefCell<Inner>>,
        ) {
            let fire_id = id.to_string();
            let fire_weak = weak.clone();
            let closure = Closure::<dyn FnMut()>::new(move || {
                let Some(rc) = fire_weak.upgrade() else { return };
                let effects = RegionEffects(rc);
                dismiss_toast(queue, max_visible, on_dismiss, &effects, &fire_id);
            });
            let timeout = if self.pause_reasons.is_empty() {
                window()
                    .set_timeout_with_callback_and_timeout_and_arguments_0(
                        closure.as_ref().unchecked_ref(),
                        ms as i32,
                    )
                    .ok()
            } else {
                None
            };
            self.timers.insert(
                id.to_string(),
                TimerEntry {
                    closure,
                    timeout,
                    remaining: ms,
                    started_at: now(),
                    duration: ms,
                },
            );
        }

        fn clear_timer(&mut self, id: &str) {
            if let Some(entry) = self.timers.remove(id) {
                if let Some(timeout) = entry.timeout {
                    window().clear_timeout_with_handle(timeout);
                }
            }
        }

        /// The first pause reason freezes every running timer, keeping the
        /// remaining time; the last resume re-arms them all.
        fn pause(&mut self, reason: &'static str) {
            let was_running = self.pause_reasons.is_empty();
            self.pause_reasons.insert(reason);
            if !was_running {
                return;
            }
            let now = now();
            for entry in self.timers.values_mut() {
                if let Some(timeout) = entry.timeout.take() {
                    window().clear_timeout_with_handle(timeout);
                    entry.remaining = (entry.remaining - (now - entry.started_at)).max(0.0);
                }
            }
        }

        fn resume(&mut self, reason: &'static str) {
            if !self.pause_reasons.remove(reason) || !self.pause_reasons.is_empty() {
                return;
            }
            let now = now();
            for entry in self.timers.values_mut() {
                entry.started_at = now;
                entry.timeout = window()
                    .set_timeout_with_callback_and_timeout_and_arguments_0(
                        entry.closure.as_ref().unchecked_ref(),
                        entry.remaining as i32,
                    )
                    .ok();
            }
        }

        /// Remember whether the dismissed toast was the last visible one
        /// while focus was inside the region; `after_dismiss` restores it.
        fn before_dismiss(&mut self, was_last_visible: bool) {
            let focused_inside = self.region.as_ref().is_some_and(|region| {
                web_sys::window()
                    .and_then(|window| window.document())
                    .and_then(|document| document.active_element())
                    .is_some_and(|active| region.contains(Some(active.unchecked_ref())))
            });
            self.focus_restore_pending = was_last_visible && focused_inside;
        }

        /// The region and document listeners the element attached on
        /// connect: focus tracking (pause + where to return focus), F6
        /// cycling into the region and back out, and the hidden-window pause.
        fn attach(&mut self, region: web_sys::Element, weak: &Weak<RefCell<Inner>>) {
            self.region = Some(region.clone());

            let focus_weak = weak.clone();
            if let Some(listener) = listen(
                region.unchecked_ref(),
                "focusin",
                Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                    let Some(rc) = focus_weak.upgrade() else { return };
                    let Some(focus) = event.dyn_ref::<web_sys::FocusEvent>() else { return };
                    let mut inner = rc.borrow_mut();
                    let Some(region) = inner.region.clone() else { return };
                    if contains_node(&region, focus.related_target()) {
                        return;
                    }
                    if let Some(target) = focus
                        .related_target()
                        .and_then(|target| target.dyn_into::<web_sys::HtmlElement>().ok())
                    {
                        inner.return_focus = Some(target);
                    }
                    inner.pause("focus");
                }),
            ) {
                self.listeners.push(listener);
            }

            let blur_weak = weak.clone();
            if let Some(listener) = listen(
                region.unchecked_ref(),
                "focusout",
                Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                    let Some(rc) = blur_weak.upgrade() else { return };
                    let Some(focus) = event.dyn_ref::<web_sys::FocusEvent>() else { return };
                    let mut inner = rc.borrow_mut();
                    let Some(region) = inner.region.clone() else { return };
                    if !contains_node(&region, focus.related_target()) {
                        inner.resume("focus");
                    }
                }),
            ) {
                self.listeners.push(listener);
            }

            let Some(document) = web_sys::window().and_then(|window| window.document()) else {
                return;
            };
            let target: web_sys::EventTarget = document.into();

            let key_weak = weak.clone();
            if let Some(listener) = listen(
                &target,
                "keydown",
                Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                    let Some(keyboard) = event.dyn_ref::<web_sys::KeyboardEvent>() else { return };
                    if keyboard.key() != "F6" {
                        return;
                    }
                    let Some(rc) = key_weak.upgrade() else { return };
                    let mut inner = rc.borrow_mut();
                    let Some(region) = inner.region.clone() else { return };
                    let active = web_sys::window()
                        .and_then(|window| window.document())
                        .and_then(|document| document.active_element());
                    if active
                        .as_ref()
                        .is_some_and(|active| region.contains(Some(active.unchecked_ref())))
                    {
                        if let Some(target) = inner.return_focus.clone() {
                            let _ = target.focus();
                        }
                    } else if let Ok(Some(first)) = region.query_selector(".ty-toast") {
                        event.prevent_default();
                        inner.return_focus = active.and_then(|active| active.dyn_into::<web_sys::HtmlElement>().ok());
                        if let Ok(first) = first.dyn_into::<web_sys::HtmlElement>() {
                            let _ = first.focus();
                        }
                    }
                }),
            ) {
                self.listeners.push(listener);
            }

            let visibility_weak = weak.clone();
            if let Some(listener) = listen(
                &target,
                "visibilitychange",
                Closure::<dyn FnMut(web_sys::Event)>::new(move |_| {
                    let Some(rc) = visibility_weak.upgrade() else { return };
                    let hidden = web_sys::window()
                        .and_then(|window| window.document())
                        .is_some_and(|document| document.hidden());
                    let mut inner = rc.borrow_mut();
                    if hidden {
                        inner.pause("hidden");
                    } else {
                        inner.resume("hidden");
                    }
                }),
            ) {
                self.listeners.push(listener);
            }
        }
    }

    impl Drop for Inner {
        fn drop(&mut self) {
            let window = window();
            for entry in self.timers.values() {
                if let Some(timeout) = entry.timeout {
                    window.clear_timeout_with_handle(timeout);
                }
            }
            if let Some((timeout, _)) = &self.pending_tick {
                window.clear_timeout_with_handle(*timeout);
            }
        }
    }

    /// The region's DOM state: auto-dismiss timers, pause reasons, focus
    /// tracking and the listeners. Held strongly only by the component; the
    /// timer and listener closures hold a `Weak`, so everything stops and
    /// drops with the component.
    #[derive(Clone)]
    pub struct RegionEffects(Rc<RefCell<Inner>>);

    impl PartialEq for RegionEffects {
        fn eq(&self, other: &RegionEffects) -> bool {
            Rc::ptr_eq(&self.0, &other.0)
        }
    }

    impl RegionEffects {
        pub fn before_dismiss(&self, was_last_visible: bool) {
            self.0.borrow_mut().before_dismiss(was_last_visible);
        }

        /// When the last toast closes while focused, focus returns to where
        /// it was before entering the region, after the removal has settled.
        pub fn after_dismiss(&self) {
            {
                let mut inner = self.0.borrow_mut();
                if !inner.focus_restore_pending {
                    return;
                }
                inner.focus_restore_pending = false;
            }
            let weak = Rc::downgrade(&self.0);
            let tick = Closure::<dyn FnMut()>::new(move || {
                let Some(rc) = weak.upgrade() else { return };
                let target = rc.borrow().return_focus.clone();
                if let Some(target) = target {
                    if target.is_connected() {
                        let _ = target.focus();
                    }
                }
            });
            if let Ok(timeout) = window().set_timeout_with_callback_and_timeout_and_arguments_0(
                tick.as_ref().unchecked_ref(),
                0,
            ) {
                let mut inner = self.0.borrow_mut();
                if let Some((previous, _)) = inner.pending_tick.replace((timeout, tick)) {
                    window().clear_timeout_with_handle(previous);
                }
            }
        }

        pub fn pause(&self, reason: &'static str) {
            self.0.borrow_mut().pause(reason);
        }

        pub fn resume(&self, reason: &'static str) {
            self.0.borrow_mut().resume(reason);
        }
    }

    pub fn use_region_effects() -> RegionEffects {
        use_hook(|| RegionEffects(Rc::new(RefCell::new(Inner::default()))))
    }

    /// Keep the auto-dismiss timers in step with the visible queue and
    /// attach the region/document listeners once the region is mounted.
    pub fn wire(effects: RegionEffects, region: Signal<Option<Rc<MountedData>>>, handle: ToastHandle) {
        let queue = handle.queue;
        let max_visible = handle.max_visible;
        let on_dismiss = handle.on_dismiss;

        {
            let effects = effects.clone();
            use_effect(move || {
                let toasts = queue();
                let max = max_visible().max(0.0) as usize;
                let weak = Rc::downgrade(&effects.0);
                effects
                    .0
                    .borrow_mut()
                    .sync_timers(&toasts, max, queue, max_visible, on_dismiss, &weak);
            });
        }

        use_effect(move || {
            let mut inner = effects.0.borrow_mut();
            if inner.wired {
                return;
            }
            let Some(mounted) = region() else { return };
            let Some(element) = mounted.downcast::<web_sys::Element>().cloned() else {
                return;
            };
            let weak = Rc::downgrade(&effects.0);
            inner.attach(element, &weak);
            inner.wired = true;
        });
    }

    fn listen(
        target: &web_sys::EventTarget,
        event: &'static str,
        closure: Closure<dyn FnMut(web_sys::Event)>,
    ) -> Option<Listener> {
        target
            .add_event_listener_with_callback(event, closure.as_ref().unchecked_ref())
            .ok()?;
        Some(Listener {
            target: target.clone(),
            event,
            closure,
        })
    }

    fn contains_node(region: &web_sys::Element, target: Option<web_sys::EventTarget>) -> bool {
        target
            .and_then(|target| target.dyn_into::<web_sys::Node>().ok())
            .is_some_and(|node| region.contains(Some(&node)))
    }

    fn window() -> web_sys::Window {
        web_sys::window().expect("window")
    }

    fn now() -> f64 {
        js_sys::Date::now()
    }
}
