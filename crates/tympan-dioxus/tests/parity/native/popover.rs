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
        rsx! { elements::TyPopover { trigger_label: "Details", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-popover/closed.html");
}

#[test]
fn info_open() {
    fn app() -> Element {
        rsx! { elements::TyPopover { open: true, trigger_label: "About this", title: "What this means", instance: "i", "A short explanation." } }
    }
    common::assert_matches_fixture(app, "ty-popover/info-open.html");
}

#[test]
fn own_trigger() {
    fn app() -> Element {
        rsx! { elements::TyPopover { open: true, placement: elements::PopoverPlacement::Top, align: elements::PopoverAlign::Start, instance: "i", trigger: rsx! { "Open" }, "Anchored above, aligned to the start." } }
    }
    common::assert_matches_fixture(app, "ty-popover/own-trigger.html");
}

#[test]
fn no_arrow() {
    fn app() -> Element {
        rsx! { elements::TyPopover { open: true, trigger_label: "Where", title: "Somewhere", show_arrow: "false", instance: "i", "Without a pointer." } }
    }
    common::assert_matches_fixture(app, "ty-popover/no-arrow.html");
}

#[test]
fn offset_4() {
    fn app() -> Element {
        rsx! { elements::TyPopover { open: true, trigger_label: "Gap", title: "Further away", offset: "4", instance: "i", "A wider gap." } }
    }
    common::assert_matches_fixture(app, "ty-popover/offset-4.html");
}
