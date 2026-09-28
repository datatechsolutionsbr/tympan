//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn title() {
    fn app() -> Element {
        rsx! { elements::TySectionHeading { title: "Members", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-section-heading/title.html");
}

#[test]
fn level_3_subtitle() {
    fn app() -> Element {
        rsx! { elements::TySectionHeading { title: "API keys", level: elements::SectionHeadingLevel::V3, subtitle: "Keys of every integration", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-section-heading/level-3-subtitle.html");
}

#[test]
fn icon_trailing() {
    fn app() -> Element {
        rsx! { elements::TySectionHeading { title: "Webhooks", instance: "i", icon: rsx! { "⚡" }, trailing: rsx! { "Add" }, } }
    }
    common::assert_matches_fixture(app, "ty-section-heading/icon-trailing.html");
}

#[test]
fn truncate() {
    fn app() -> Element {
        rsx! { elements::TySectionHeading { title: "A section name that runs well past the width of its container", truncate: true, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-section-heading/truncate.html");
}

#[test]
fn extra() {
    fn app() -> Element {
        rsx! { elements::TySectionHeading { title: "Filters", instance: "i", trailing: rsx! { "Clear all" }, "Status: active" } }
    }
    common::assert_matches_fixture(app, "ty-section-heading/extra.html");
}
