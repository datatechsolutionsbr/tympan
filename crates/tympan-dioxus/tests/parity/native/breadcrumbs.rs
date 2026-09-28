//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn auto_empty() {
    fn app() -> Element {
        rsx! { elements::TyBreadcrumbs { instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-breadcrumbs/auto-empty.html");
}

#[test]
fn trail_empty() {
    fn app() -> Element {
        rsx! { elements::TyBreadcrumbs { mode: elements::BreadcrumbsMode::Trail, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-breadcrumbs/trail-empty.html");
}

#[test]
fn compact_bar() {
    fn app() -> Element {
        rsx! { elements::TyBreadcrumbs { mode: elements::BreadcrumbsMode::Compact, instance: "i", center: rsx! { "Sources" }, actions: rsx! { "Share" }, } }
    }
    common::assert_matches_fixture(app, "ty-breadcrumbs/compact-bar.html");
}
