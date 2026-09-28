//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn off() {
    fn app() -> Element {
        rsx! { elements::TyCheckbox { instance: "i", "Notify me" } }
    }
    common::assert_matches_fixture(app, "ty-checkbox/off.html");
}

#[test]
fn on_with_description() {
    fn app() -> Element {
        rsx! { elements::TyCheckbox { checked: true, name: "notify", value: "email", instance: "i", description: rsx! { "By email" }, "Notify me" } }
    }
    common::assert_matches_fixture(app, "ty-checkbox/on-with-description.html");
}

#[test]
fn bare() {
    fn app() -> Element {
        rsx! { elements::TyCheckbox { appearance: elements::CheckboxAppearance::Bare, test_id: "newsletter", instance: "i", "Newsletter" } }
    }
    common::assert_matches_fixture(app, "ty-checkbox/bare.html");
}

#[test]
fn indeterminate() {
    fn app() -> Element {
        rsx! { elements::TyCheckbox { indeterminate: true, instance: "i", "Select all" } }
    }
    common::assert_matches_fixture(app, "ty-checkbox/indeterminate.html");
}

#[test]
fn invalid_required() {
    fn app() -> Element {
        rsx! { elements::TyCheckbox { required: true, instance: "i", error: rsx! { "Required" }, "I accept the terms" } }
    }
    common::assert_matches_fixture(app, "ty-checkbox/invalid-required.html");
}

#[test]
fn disabled_unlabelled() {
    fn app() -> Element {
        rsx! { elements::TyCheckbox { disabled: true, accessible_label: "Notifications", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-checkbox/disabled-unlabelled.html");
}
