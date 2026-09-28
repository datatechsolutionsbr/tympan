//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn secondary() {
    fn app() -> Element {
        rsx! { elements::TyButton { instance: "i", "Cancel" } }
    }
    common::assert_matches_fixture(app, "ty-button/secondary.html");
}

#[test]
fn primary_large() {
    fn app() -> Element {
        rsx! { elements::TyButton { variant: elements::ButtonVariant::Primary, size: elements::ButtonSize::Large, instance: "i", "Save" } }
    }
    common::assert_matches_fixture(app, "ty-button/primary-large.html");
}

#[test]
fn submit() {
    fn app() -> Element {
        rsx! { elements::TyButton { variant: elements::ButtonVariant::Primary, r#type: elements::ButtonType::Submit, name: "intent", value: "publish", instance: "i", "Publish" } }
    }
    common::assert_matches_fixture(app, "ty-button/submit.html");
}

#[test]
fn busy() {
    fn app() -> Element {
        rsx! { elements::TyButton { variant: elements::ButtonVariant::Primary, busy: true, instance: "i", "Saving" } }
    }
    common::assert_matches_fixture(app, "ty-button/busy.html");
}

#[test]
fn danger_disabled() {
    fn app() -> Element {
        rsx! { elements::TyButton { variant: elements::ButtonVariant::Danger, disabled: true, instance: "i", "Delete" } }
    }
    common::assert_matches_fixture(app, "ty-button/danger-disabled.html");
}

#[test]
fn icon_only() {
    fn app() -> Element {
        rsx! { elements::TyButton { variant: elements::ButtonVariant::Quiet, icon_only: true, shape: elements::ButtonShape::Circle, accessible_label: "Close", instance: "i", icon: rsx! { "×" }, } }
    }
    common::assert_matches_fixture(app, "ty-button/icon-only.html");
}

#[test]
fn full_width_pill() {
    fn app() -> Element {
        rsx! { elements::TyButton { full_width: true, shape: elements::ButtonShape::Pill, instance: "i", trailing_icon: rsx! { "→" }, "Continue" } }
    }
    common::assert_matches_fixture(app, "ty-button/full-width-pill.html");
}

#[test]
fn toggle() {
    fn app() -> Element {
        rsx! { elements::TyButton { variant: elements::ButtonVariant::Quiet, pressed: "false", expanded: "false", controls: "panel", haspopup: "dialog", test_id: "toggle", instance: "i", "Filters" } }
    }
    common::assert_matches_fixture(app, "ty-button/toggle.html");
}
