//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn labelled_placeholder() {
    fn app() -> Element {
        rsx! { elements::TyNativeSelect { name: "region", placeholder: "Choose a region…", instance: "i", label: rsx! { "Region" }, "us-east-1" } }
    }
    common::assert_matches_fixture(app, "ty-native-select/labelled-placeholder.html");
}

#[test]
fn hint_required_value() {
    fn app() -> Element {
        rsx! { elements::TyNativeSelect { name: "region", required: true, value: "us-east-1", instance: "i", label: rsx! { "Region" }, hint: rsx! { "Where the workflow runs" }, "us-east-1" } }
    }
    common::assert_matches_fixture(app, "ty-native-select/hint-required-value.html");
}

#[test]
fn invalid_error() {
    fn app() -> Element {
        rsx! { elements::TyNativeSelect { name: "region", instance: "i", label: rsx! { "Region" }, error: rsx! { "Pick a region" }, "us-east-1" } }
    }
    common::assert_matches_fixture(app, "ty-native-select/invalid-error.html");
}

#[test]
fn field_wired() {
    fn app() -> Element {
        rsx! { elements::TyNativeSelect { control_id: "field-3-control", described_by: "field-3-description field-3-error", invalid: true, required: true, name: "region", test_id: "region", accessible_label: "Region", instance: "i", error: rsx! { "Required" }, "us-east-1" } }
    }
    common::assert_matches_fixture(app, "ty-native-select/field-wired.html");
}

#[test]
fn disabled_unlabelled() {
    fn app() -> Element {
        rsx! { elements::TyNativeSelect { disabled: true, accessible_label: "Region", instance: "i", "us-east-1" } }
    }
    common::assert_matches_fixture(app, "ty-native-select/disabled-unlabelled.html");
}
