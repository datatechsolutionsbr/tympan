//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn ring() {
    fn app() -> Element {
        rsx! { elements::TySpinner { instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-spinner/ring.html");
}

#[test]
fn dots_labelled() {
    fn app() -> Element {
        rsx! { elements::TySpinner { shape: elements::SpinnerShape::Dots, label: "Saving", instance: "i", "Saving" } }
    }
    common::assert_matches_fixture(app, "ty-spinner/dots-labelled.html");
}

#[test]
fn large_accent() {
    fn app() -> Element {
        rsx! { elements::TySpinner { size: elements::SpinnerSize::Large, tone: elements::SpinnerTone::Accent, label: "Indexing", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-spinner/large-accent.html");
}

#[test]
fn small_on_accent() {
    fn app() -> Element {
        rsx! { elements::TySpinner { size: elements::SpinnerSize::Small, tone: elements::SpinnerTone::OnAccent, label: "Uploading", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-spinner/small-on-accent.html");
}

#[test]
fn dots_neutral() {
    fn app() -> Element {
        rsx! { elements::TySpinner { shape: elements::SpinnerShape::Dots, tone: elements::SpinnerTone::Neutral, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-spinner/dots-neutral.html");
}
