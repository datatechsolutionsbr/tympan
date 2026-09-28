//! Native port of `<ty-status-pill>`: a static badge — icon, word and
//! semantic tone — with the custom element's status map in Rust. A known
//! `status` supplies the tone, busy state and label the host left out (an
//! explicit `tone`, `busy` or rendered label wins), and an empty label
//! falls back to the `label` prop, the map's label, then the status key —
//! so a plain-HTML host gets the same pill the element would fill in,
//! without `elements.js`.

use dioxus::prelude::*;

use crate::runtime::{has_content, use_instance_id};

/// The semantic tone (`data-tone`); left out, the status map decides (server renderings pass it themselves).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum StatusPillTone {
    Neutral,
    Info,
    Success,
    Warning,
    Danger,
}

impl StatusPillTone {
    pub const fn as_str(self) -> &'static str {
        match self {
            StatusPillTone::Neutral => "neutral",
            StatusPillTone::Info => "info",
            StatusPillTone::Success => "success",
            StatusPillTone::Warning => "warning",
            StatusPillTone::Danger => "danger",
        }
    }
}

/// Pill size.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum StatusPillSize {
    Small,
    #[default]
    Regular,
}

impl StatusPillSize {
    pub const fn as_str(self) -> &'static str {
        match self {
            StatusPillSize::Small => "small",
            StatusPillSize::Regular => "regular",
        }
    }
}

/// What the built-in status map knows about a common status: its tone,
/// busy state and English default label (the element's `STATUS_MAP`).
#[derive(Clone, Copy)]
struct StatusEntry {
    tone: StatusPillTone,
    busy: bool,
    label: &'static str,
}

fn status_map(status: &str) -> Option<StatusEntry> {
    let entry = match status {
        "pending" => StatusEntry { tone: StatusPillTone::Warning, busy: false, label: "Pending" },
        "approved" => StatusEntry { tone: StatusPillTone::Success, busy: false, label: "Approved" },
        "rejected" => StatusEntry { tone: StatusPillTone::Danger, busy: false, label: "Rejected" },
        "active" => StatusEntry { tone: StatusPillTone::Success, busy: false, label: "Active" },
        "inactive" => StatusEntry { tone: StatusPillTone::Neutral, busy: false, label: "Inactive" },
        "processing" => StatusEntry { tone: StatusPillTone::Info, busy: true, label: "Processing" },
        "error" => StatusEntry { tone: StatusPillTone::Danger, busy: false, label: "Error" },
        "success" => StatusEntry { tone: StatusPillTone::Success, busy: false, label: "Success" },
        _ => return None,
    };
    Some(entry)
}

/// Current state of an item as icon, word and semantic tone. Nothing interactive inside; a known `status` takes its tone and busy state from the element's status map unless `tone` overrides.
#[component]
pub fn TyStatusPill(
    /// The status key (`data-status`); the built-in map colours the common ones (`pending`, `approved`, `processing`, …) while `tone` is absent.
    #[props(into)] status: Option<String>,
    /// The semantic tone (`data-tone`); left out, the status map decides (server renderings pass it themselves).
    #[props(default)] tone: Option<StatusPillTone>,
    /// Pill size.
    #[props(default)] size: StatusPillSize,
    /// In-progress: the icon spins (static under reduced motion).
    #[props(default)] busy: bool,
    /// Announce changes politely (`role="status"`); off by default, so tables of pills create no live regions.
    #[props(default)] announce: bool,
    /// Plain-HTML label text; the default slot (what frameworks render) wins, then the status map's label, then the status key.
    #[props(into)] label: Option<String>,
    /// Accessible name of the pill (`aria-label`), e.g. "Status: Running" on an announced badge.
    #[props(into)] accessible_label: Option<String>,
    /// Test hook on the pill (`data-testid`).
    #[props(into)] test_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)] instance: Option<String>,
    #[props(into)] id: Option<String>,
    #[props(into, default)] class: String,
    /// The status word.
    children: Element,
    /// The status icon (decorative); spins while busy.
    icon: Option<Element>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_default = has_content(&children);
    let slot_icon = icon.is_some();

    // The element's status map, applied to what the host left out: an
    // explicit `tone` or `busy` wins, and an empty label falls back to
    // the `label` prop, the map's label, then the status key. Nothing is
    // interactive, so there is no local state to mirror — the props
    // drive every render.
    let status_key = status.as_deref().filter(|v| !v.is_empty());
    let entry = status_key.and_then(status_map);
    let effective_tone = tone.or(entry.map(|e| e.tone));
    let effective_busy = busy || entry.is_some_and(|e| e.busy);
    let fallback_label = label
        .as_deref()
        .filter(|v| !v.is_empty())
        .or_else(|| entry.map(|e| e.label))
        .or(status_key);

    wasm::warn_unknown_status(status_key, label.is_some(), entry.is_some());

    rsx! {
        ty-status-pill {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "status": status.as_deref().filter(|v| !v.is_empty()),
            "tone": tone.map(|v| v.as_str()),
            "size": Some(size.as_str()),
            "busy": busy.then_some(""),
            "announce": announce.then_some(""),
            "label": label.as_deref().filter(|v| !v.is_empty()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            span {
                class: "ty-status",
                "role": if announce { Some("status") } else { None },
                "aria-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
                "data-tone": effective_tone.map(|v| v.as_str()),
                "data-size": Some(size.as_str()),
                "data-busy": effective_busy.then_some(""),
                "data-status": status.as_deref().filter(|v| !v.is_empty()),
                "data-testid": test_id.as_deref().filter(|v| !v.is_empty()),
                if slot_icon {
                    span {
                        class: "ty-status__icon",
                        "aria-hidden": Some("true"),
                        {icon.clone()}
                    }
                }
                span {
                    class: "ty-status__label",
                    if slot_default {
                        {children.clone()}
                    } else if let Some(text) = fallback_label {
                        {text}
                    }
                }
            }
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    pub fn warn_unknown_status(_status: Option<&str>, _labelled: bool, _known: bool) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    /// The element's `console.warn` for a status the map does not know.
    pub fn warn_unknown_status(status: Option<&str>, labelled: bool, known: bool) {
        if let (Some(status), false, false) = (status, labelled, known) {
            web_sys::console::warn_1(&wasm_bindgen::JsValue::from_str(&format!(
                "ty-status-pill: unknown status \"{status}\"; showing it as a neutral pill."
            )));
        }
    }
}
