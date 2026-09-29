//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn minimal() {
    fn app() -> Element {
        rsx! { elements::TyPageHeader { title: "Sources", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-page-header/minimal.html");
}

#[test]
fn reading_summary() {
    fn app() -> Element {
        rsx! { elements::TyPageHeader { title: "Sources", eyebrow: "Datasets", summary: "Every dataset this workspace reads, and when each was last synced.", instance: "i", meta: rsx! { "Owner: Data team" }, } }
    }
    common::assert_matches_fixture(app, "ty-page-header/reading-summary.html");
}

#[test]
fn breadcrumbs_actions() {
    fn app() -> Element {
        rsx! { elements::TyPageHeader { title: "Sources", instance: "i", breadcrumbs: rsx! { "Datasets" }, actions: rsx! { "Add source" }, icon: rsx! { "◈" }, } }
    }
    common::assert_matches_fixture(app, "ty-page-header/breadcrumbs-actions.html");
}

#[test]
fn section_scale() {
    fn app() -> Element {
        rsx! { elements::TyPageHeader { title: "Connection", heading_level: elements::PageHeaderHeadingLevel::V2, scale: elements::PageHeaderScale::Section, instance: "i", "Status: connected" } }
    }
    common::assert_matches_fixture(app, "ty-page-header/section-scale.html");
}

#[test]
fn display() {
    fn app() -> Element {
        rsx! { elements::TyPageHeader { title: "Welcome to Alidade", scale: elements::PageHeaderScale::Display, summary: "Sign in to continue.", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-page-header/display.html");
}

#[test]
fn editable() {
    fn app() -> Element {
        rsx! { elements::TyPageHeader { editable: true, value: "Untitled report", title_placeholder: "Name the report", title_label: "Report title", instance: "i", actions: rsx! { "Share" }, } }
    }
    common::assert_matches_fixture(app, "ty-page-header/editable.html");
}

#[test]
fn editable_error() {
    fn app() -> Element {
        rsx! { elements::TyPageHeader { editable: true, title_placeholder: "Name the report", title_label: "Report title", instance: "i", error: rsx! { "A name is required." }, } }
    }
    common::assert_matches_fixture(app, "ty-page-header/editable-error.html");
}
