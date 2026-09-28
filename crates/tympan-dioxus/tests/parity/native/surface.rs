//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn sheet() {
    fn app() -> Element {
        rsx! { elements::TySurface { instance: "i", title: rsx! { "Runs" }, description: rsx! { "Last 24 hours" }, "Body" } }
    }
    common::assert_matches_fixture(app, "ty-surface/sheet.html");
}

#[test]
fn raised_roomy() {
    fn app() -> Element {
        rsx! { elements::TySurface { elevation: elements::SurfaceElevation::Raised, padding: elements::SurfacePadding::Roomy, instance: "i", "Body" } }
    }
    common::assert_matches_fixture(app, "ty-surface/raised-roomy.html");
}

#[test]
fn flat_none_footer() {
    fn app() -> Element {
        rsx! { elements::TySurface { elevation: elements::SurfaceElevation::Flat, padding: elements::SurfacePadding::None, instance: "i", footer: rsx! { "Actions" }, "Body" } }
    }
    common::assert_matches_fixture(app, "ty-surface/flat-none-footer.html");
}

#[test]
fn pressable() {
    fn app() -> Element {
        rsx! { elements::TySurface { pressable: true, instance: "i", title: rsx! { "Open workflow" }, "Body" } }
    }
    common::assert_matches_fixture(app, "ty-surface/pressable.html");
}

#[test]
fn link_selected() {
    fn app() -> Element {
        rsx! { elements::TySurface { href: "/runs/1", selected: true, instance: "i", title: rsx! { "Nightly sync" }, "Body" } }
    }
    common::assert_matches_fixture(app, "ty-surface/link-selected.html");
}

#[test]
fn pressable_disabled() {
    fn app() -> Element {
        rsx! { elements::TySurface { pressable: true, disabled: true, instance: "i", title: rsx! { "Archived" }, "Body" } }
    }
    common::assert_matches_fixture(app, "ty-surface/pressable-disabled.html");
}

#[test]
fn title_level() {
    fn app() -> Element {
        rsx! { elements::TySurface { title_level: elements::SurfaceTitleLevel::H2, instance: "i", title: rsx! { "Settings" }, } }
    }
    common::assert_matches_fixture(app, "ty-surface/title-level.html");
}
