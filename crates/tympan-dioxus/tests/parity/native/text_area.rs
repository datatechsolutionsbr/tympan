//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn labelled() {
    fn app() -> Element {
        rsx! { elements::TyTextArea { instance: "i", label: rsx! { "Notes" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-area/labelled.html");
}

#[test]
fn hint_and_placeholder() {
    fn app() -> Element {
        rsx! { elements::TyTextArea { name: "notes", placeholder: "Write a summary", instance: "i", label: rsx! { "Notes" }, hint: rsx! { "Shown on the canvas" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-area/hint-and-placeholder.html");
}

#[test]
fn error() {
    fn app() -> Element {
        rsx! { elements::TyTextArea { value: "Draft", instance: "i", label: rsx! { "Abstract" }, error: rsx! { "Required" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-area/error.html");
}

#[test]
fn counter() {
    fn app() -> Element {
        rsx! { elements::TyTextArea { value: "Hello", max_length: 500.0f64, show_counter: true, instance: "i", label: rsx! { "Bio" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-area/counter.html");
}

#[test]
fn monospace_read_only() {
    fn app() -> Element {
        rsx! { elements::TyTextArea { monospace: true, resize: elements::TextAreaResize::None, read_only: true, value: "{{ \"a\": 1 }}", instance: "i", label: rsx! { "JSON" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-area/monospace-read-only.html");
}

#[test]
fn auto_grow() {
    fn app() -> Element {
        rsx! { elements::TyTextArea { auto_grow: true, max_rows: 6.0f64, rows: 2.0f64, instance: "i", label: rsx! { "Log" }, } }
    }
    common::assert_matches_fixture(app, "ty-text-area/auto-grow.html");
}

#[test]
fn disabled_unlabelled() {
    fn app() -> Element {
        rsx! { elements::TyTextArea { disabled: true, accessible_label: "Notes", described_by: "external-hint", test_id: "notes", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-text-area/disabled-unlabelled.html");
}
