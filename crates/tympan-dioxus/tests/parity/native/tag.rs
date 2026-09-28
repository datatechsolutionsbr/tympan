//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn neutral() {
    fn app() -> Element {
        rsx! { elements::TyTag { instance: "i", "postgres" } }
    }
    common::assert_matches_fixture(app, "ty-tag/neutral.html");
}

#[test]
fn accent_small_icon() {
    fn app() -> Element {
        rsx! { elements::TyTag { tone: elements::TagTone::Accent, size: elements::TagSize::Small, test_id: "env", instance: "i", icon: rsx! { "◆" }, "production" } }
    }
    common::assert_matches_fixture(app, "ty-tag/accent-small-icon.html");
}

#[test]
fn category() {
    fn app() -> Element {
        rsx! { elements::TyTag { category_index: 3.0f64, instance: "i", "Stage 3" } }
    }
    common::assert_matches_fixture(app, "ty-tag/category.html");
}

#[test]
fn removable() {
    fn app() -> Element {
        rsx! { elements::TyTag { removable: true, remove_label: "Remove São Paulo", instance: "i", "São Paulo" } }
    }
    common::assert_matches_fixture(app, "ty-tag/removable.html");
}

#[test]
fn live_large() {
    fn app() -> Element {
        rsx! { elements::TyTag { live: true, size: elements::TagSize::Large, instance: "i", "Running" } }
    }
    common::assert_matches_fixture(app, "ty-tag/live-large.html");
}
