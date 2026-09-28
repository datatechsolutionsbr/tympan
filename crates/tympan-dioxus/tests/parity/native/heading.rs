//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn page_title() {
    fn app() -> Element {
        rsx! { elements::TyHeading { instance: "i", "Sources" } }
    }
    common::assert_matches_fixture(app, "ty-heading/page-title.html");
}

#[test]
fn level_3() {
    fn app() -> Element {
        rsx! { elements::TyHeading { level: elements::HeadingLevel::V3, instance: "i", "Field mapping" } }
    }
    common::assert_matches_fixture(app, "ty-heading/level-3.html");
}

#[test]
fn small_level_big_step() {
    fn app() -> Element {
        rsx! { elements::TyHeading { level: elements::HeadingLevel::V2, appearance: elements::HeadingAppearance::H1, instance: "i", "Workspace" } }
    }
    common::assert_matches_fixture(app, "ty-heading/small-level-big-step.html");
}

#[test]
fn eyebrow() {
    fn app() -> Element {
        rsx! { elements::TyHeading { level: elements::HeadingLevel::V2, eyebrow: "Datasets", instance: "i", "Revenue by state" } }
    }
    common::assert_matches_fixture(app, "ty-heading/eyebrow.html");
}

#[test]
fn label_step() {
    fn app() -> Element {
        rsx! { elements::TyHeading { level: elements::HeadingLevel::V4, appearance: elements::HeadingAppearance::Label, instance: "i", "Owner" } }
    }
    common::assert_matches_fixture(app, "ty-heading/label-step.html");
}

#[test]
fn subheading() {
    fn app() -> Element {
        rsx! { elements::TyHeading { level: elements::HeadingLevel::V2, appearance: elements::HeadingAppearance::H3, instance: "i", "Recent runs" } }
    }
    common::assert_matches_fixture(app, "ty-heading/subheading.html");
}
