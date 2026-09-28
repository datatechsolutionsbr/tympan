//! SSR parity of the native port of `<ty-inline-notice>`
//! (`tympan_dioxus::elements::TyInlineNotice`): every example of the
//! element, rendered by the native component, must match the same
//! reference HTML (tests/fixtures) the generated binding and the
//! TypeScript element are tested against — one anatomy, three renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn info() {
    fn app() -> Element {
        rsx! { elements::TyInlineNotice { instance: "i", "Unseal the vault to run workflows that use credentials." } }
    }
    common::assert_matches_fixture(app, "ty-inline-notice/info.html");
}

#[test]
fn danger_title() {
    fn app() -> Element {
        rsx! { elements::TyInlineNotice { tone: elements::InlineNoticeTone::Danger, instance: "i", title: rsx! { "Vault sealed" }, "Unseal it to run workflows that use credentials." } }
    }
    common::assert_matches_fixture(app, "ty-inline-notice/danger-title.html");
}

#[test]
fn warning_heading() {
    fn app() -> Element {
        rsx! { elements::TyInlineNotice { tone: elements::InlineNoticeTone::Warning, title_as: elements::InlineNoticeTitleAs::H3, instance: "i", title: rsx! { "Two sources unavailable" }, "Results may be incomplete." } }
    }
    common::assert_matches_fixture(app, "ty-inline-notice/warning-heading.html");
}

#[test]
fn success_dismissible() {
    fn app() -> Element {
        rsx! { elements::TyInlineNotice { tone: elements::InlineNoticeTone::Success, dismissible: true, instance: "i", "Version 12 is live." } }
    }
    common::assert_matches_fixture(app, "ty-inline-notice/success-dismissible.html");
}

#[test]
fn centred_actions() {
    fn app() -> Element {
        rsx! { elements::TyInlineNotice { align: elements::InlineNoticeAlign::Centre, urgency: elements::InlineNoticeUrgency::None, instance: "i", actions: rsx! { "Help" }, "Nothing to review." } }
    }
    common::assert_matches_fixture(app, "ty-inline-notice/centred-actions.html");
}

#[test]
fn custom_icon() {
    fn app() -> Element {
        rsx! { elements::TyInlineNotice { instance: "i", icon: rsx! { "★" }, "Starred runs appear first." } }
    }
    common::assert_matches_fixture(app, "ty-inline-notice/custom-icon.html");
}
