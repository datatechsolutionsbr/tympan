//! SSR parity of the native port of `<ty-status-pill>`
//! (`tympan_dioxus::elements::TyStatusPill`): every example, rendered by
//! the native component, must match the same reference HTML
//! (tests/fixtures) the generated binding and the TypeScript element are
//! tested against — one anatomy, three renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn success() {
    fn app() -> Element {
        rsx! { elements::TyStatusPill { status: "active", tone: elements::StatusPillTone::Success, instance: "i", icon: rsx! { "✓" }, "Active" } }
    }
    common::assert_matches_fixture(app, "ty-status-pill/success.html");
}

#[test]
fn busy_info() {
    fn app() -> Element {
        rsx! { elements::TyStatusPill { status: "processing", tone: elements::StatusPillTone::Info, busy: true, instance: "i", icon: rsx! { "↻" }, "Processing" } }
    }
    common::assert_matches_fixture(app, "ty-status-pill/busy-info.html");
}

#[test]
fn small_warning() {
    fn app() -> Element {
        rsx! { elements::TyStatusPill { status: "pending", tone: elements::StatusPillTone::Warning, size: elements::StatusPillSize::Small, instance: "i", "Pending" } }
    }
    common::assert_matches_fixture(app, "ty-status-pill/small-warning.html");
}

#[test]
fn announced_danger() {
    fn app() -> Element {
        rsx! { elements::TyStatusPill { status: "error", tone: elements::StatusPillTone::Danger, announce: true, accessible_label: "Status: Error", test_id: "status-badge-error", instance: "i", "Error" } }
    }
    common::assert_matches_fixture(app, "ty-status-pill/announced-danger.html");
}

#[test]
fn unknown_neutral() {
    fn app() -> Element {
        rsx! { elements::TyStatusPill { status: "archived", instance: "i", "archived" } }
    }
    common::assert_matches_fixture(app, "ty-status-pill/unknown-neutral.html");
}
