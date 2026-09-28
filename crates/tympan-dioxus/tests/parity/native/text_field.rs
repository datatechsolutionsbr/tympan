//! SSR parity of the native port (`elements::TyTextField`): every example
//! of the element, rendered by the native component, must match the same
//! reference HTML (tests/fixtures) the generated binding and the
//! TypeScript element are tested against — one anatomy, three renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn labelled() {
    fn app() -> Element {
        rsx! { elements::TyTextField { instance: "i", label: rsx! { "Name" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-field/labelled.html");
}

#[test]
fn hint_and_placeholder() {
    fn app() -> Element {
        rsx! { elements::TyTextField { name: "name", placeholder: "Ada Lovelace", auto_complete: "name", instance: "i", label: rsx! { "Name" }, hint: rsx! { "As on your badge" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-field/hint-and-placeholder.html");
}

#[test]
fn email_filled_leading() {
    fn app() -> Element {
        rsx! { elements::TyTextField { input_type: elements::TextFieldInputType::Email, appearance: elements::TextFieldAppearance::Filled, name: "email", auto_complete: "email", instance: "i", label: rsx! { "Email" }, leading: rsx! { "✉" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-field/email-filled-leading.html");
}

#[test]
fn search() {
    fn app() -> Element {
        rsx! { elements::TyTextField { mode: elements::TextFieldMode::Search, name: "q", value: "brazil", placeholder: "Search states", instance: "i", label: rsx! { "Search" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-field/search.html");
}

#[test]
fn password() {
    fn app() -> Element {
        rsx! { elements::TyTextField { mode: elements::TextFieldMode::Password, name: "password", auto_complete: "current-password", required: true, instance: "i", label: rsx! { "Password" }, hint: rsx! { "At least 12 characters" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-field/password.html");
}

#[test]
fn error() {
    fn app() -> Element {
        rsx! { elements::TyTextField { value: "ab", required: true, instance: "i", label: rsx! { "Code" }, error: rsx! { "Too short" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-field/error.html");
}

#[test]
fn counter() {
    fn app() -> Element {
        rsx! { elements::TyTextField { value: "Hello", max_length: 20.0f64, show_counter: true, instance: "i", label: rsx! { "Title" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-field/counter.html");
}

#[test]
fn success() {
    fn app() -> Element {
        rsx! { elements::TyTextField { input_type: elements::TextFieldInputType::Email, value: "ada@example.org", instance: "i", label: rsx! { "Email" }, success: rsx! { "Looks right" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-field/success.html");
}

#[test]
fn disabled_unlabelled() {
    fn app() -> Element {
        rsx! { elements::TyTextField { disabled: true, accessible_label: "Name", described_by: "external-hint", test_id: "name", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-text-field/disabled-unlabelled.html");
}
