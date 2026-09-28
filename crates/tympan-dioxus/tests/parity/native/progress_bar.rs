//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn determinate() {
    fn app() -> Element {
        rsx! { elements::TyProgressBar { value: 40.0f64, label: "Upload", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-progress-bar/determinate.html");
}

#[test]
fn custom_value_label() {
    fn app() -> Element {
        rsx! { elements::TyProgressBar { value: 3.0f64, max_value: 8.0f64, value_label: "3 of 8 steps", label: "Setup", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-progress-bar/custom-value-label.html");
}

#[test]
fn indeterminate() {
    fn app() -> Element {
        rsx! { elements::TyProgressBar { indeterminate: true, label: "Import", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-progress-bar/indeterminate.html");
}

#[test]
fn complete_success_thin() {
    fn app() -> Element {
        rsx! { elements::TyProgressBar { value: 100.0f64, label: "Upload", tone: elements::ProgressBarTone::Success, size: elements::ProgressBarSize::Thin, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-progress-bar/complete-success-thin.html");
}

#[test]
fn unlabelled_hidden_value() {
    fn app() -> Element {
        rsx! { elements::TyProgressBar { value: 20.0f64, accessible_label: "Storage used", show_value: "false", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-progress-bar/unlabelled-hidden-value.html");
}
