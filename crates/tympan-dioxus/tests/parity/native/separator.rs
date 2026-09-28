//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn decorative() {
    fn app() -> Element {
        rsx! { elements::TySeparator { instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-separator/decorative.html");
}

#[test]
fn semantic() {
    fn app() -> Element {
        rsx! { elements::TySeparator { semantic: true, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-separator/semantic.html");
}

#[test]
fn semantic_vertical() {
    fn app() -> Element {
        rsx! { elements::TySeparator { semantic: true, orientation: elements::SeparatorOrientation::Vertical, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-separator/semantic-vertical.html");
}

#[test]
fn soft_roomy() {
    fn app() -> Element {
        rsx! { elements::TySeparator { emphasis: elements::SeparatorEmphasis::Soft, spacing: elements::SeparatorSpacing::Roomy, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-separator/soft-roomy.html");
}

#[test]
fn caption() {
    fn app() -> Element {
        rsx! { elements::TySeparator { instance: "i", caption: rsx! { "or" }, } }
    }
    common::assert_matches_fixture(app, "ty-separator/caption.html");
}
