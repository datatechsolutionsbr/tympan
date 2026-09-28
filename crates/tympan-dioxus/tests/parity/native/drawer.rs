//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn closed() {
    fn app() -> Element {
        rsx! { elements::TyDrawer { instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-drawer/closed.html");
}

#[test]
fn bottom() {
    fn app() -> Element {
        rsx! { elements::TyDrawer { open: true, instance: "i", title: rsx! { "Language" }, "Pick a locale." } }
    }
    common::assert_matches_fixture(app, "ty-drawer/bottom.html");
}

#[test]
fn end_wide() {
    fn app() -> Element {
        rsx! { elements::TyDrawer { open: true, placement: elements::DrawerPlacement::End, width: elements::DrawerWidth::Wide, instance: "i", title: rsx! { "Run details" }, "Timeline." } }
    }
    common::assert_matches_fixture(app, "ty-drawer/end-wide.html");
}

#[test]
fn no_handle() {
    fn app() -> Element {
        rsx! { elements::TyDrawer { open: true, show_handle: "false", instance: "i", title: rsx! { "Filters" }, "Filter rows." } }
    }
    common::assert_matches_fixture(app, "ty-drawer/no-handle.html");
}

#[test]
fn not_dismissible() {
    fn app() -> Element {
        rsx! { elements::TyDrawer { open: true, dismissible: "false", instance: "i", title: rsx! { "Required step" }, "Finish the form." } }
    }
    common::assert_matches_fixture(app, "ty-drawer/not-dismissible.html");
}

#[test]
fn max_height() {
    fn app() -> Element {
        rsx! { elements::TyDrawer { open: true, max_height: "60dvh", instance: "i", title: rsx! { "Shortcuts" }, "Keys." } }
    }
    common::assert_matches_fixture(app, "ty-drawer/max-height.html");
}
