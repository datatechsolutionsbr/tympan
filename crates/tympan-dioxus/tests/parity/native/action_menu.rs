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
        rsx! { elements::TyActionMenu { label: "Item actions", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-action-menu/closed.html");
}

#[test]
fn own_trigger() {
    fn app() -> Element {
        rsx! { elements::TyActionMenu { label: "Run actions", instance: "i", trigger: rsx! { "More" }, } }
    }
    common::assert_matches_fixture(app, "ty-action-menu/own-trigger.html");
}

#[test]
fn context() {
    fn app() -> Element {
        rsx! { elements::TyActionMenu { mode: elements::ActionMenuMode::Context, label: "File actions", instance: "i", trigger: rsx! { "report.csv" }, } }
    }
    common::assert_matches_fixture(app, "ty-action-menu/context.html");
}

#[test]
fn translated() {
    fn app() -> Element {
        rsx! { elements::TyActionMenu { label: "Ações do item", trigger_label: "Mais ações", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-action-menu/translated.html");
}
