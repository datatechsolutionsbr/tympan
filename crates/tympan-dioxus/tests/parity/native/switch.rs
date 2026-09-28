//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn off() {
    fn app() -> Element {
        rsx! { elements::TySwitch { instance: "i", "Autosave" } }
    }
    common::assert_matches_fixture(app, "ty-switch/off.html");
}

#[test]
fn on_with_description() {
    fn app() -> Element {
        rsx! { elements::TySwitch { checked: true, name: "autosave", instance: "i", description: rsx! { "Save every change" }, "Autosave" } }
    }
    common::assert_matches_fixture(app, "ty-switch/on-with-description.html");
}

#[test]
fn tile_large() {
    fn app() -> Element {
        rsx! { elements::TySwitch { layout: elements::SwitchLayout::Tile, size: elements::SwitchSize::Large, value: "yes", test_id: "notifications", instance: "i", "Notifications" } }
    }
    common::assert_matches_fixture(app, "ty-switch/tile-large.html");
}

#[test]
fn read_only() {
    fn app() -> Element {
        rsx! { elements::TySwitch { checked: true, read_only: true, instance: "i", "Managed by your organization" } }
    }
    common::assert_matches_fixture(app, "ty-switch/read-only.html");
}

#[test]
fn disabled_unlabelled() {
    fn app() -> Element {
        rsx! { elements::TySwitch { disabled: true, accessible_label: "Dark mode", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-switch/disabled-unlabelled.html");
}
