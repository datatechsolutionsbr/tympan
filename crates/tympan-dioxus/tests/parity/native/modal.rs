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
        rsx! { elements::TyModal { instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-modal/closed.html");
}

#[test]
fn open() {
    fn app() -> Element {
        rsx! { elements::TyModal { is_open: true, instance: "i", title: rsx! { "Delete file?" }, actions: rsx! { "Delete" }, "This cannot be undone." } }
    }
    common::assert_matches_fixture(app, "ty-modal/open.html");
}

#[test]
fn open_description() {
    fn app() -> Element {
        rsx! { elements::TyModal { is_open: true, instance: "i", title: rsx! { "Invite member" }, description: rsx! { "They get an email with a link." }, actions: rsx! { "Invite" }, "Form fields" } }
    }
    common::assert_matches_fixture(app, "ty-modal/open-description.html");
}

#[test]
fn alertdialog() {
    fn app() -> Element {
        rsx! { elements::TyModal { is_open: true, role: elements::ModalRole::Alertdialog, instance: "i", title: rsx! { "Discard changes?" }, actions: rsx! { "Discard" }, "Your edits are not saved." } }
    }
    common::assert_matches_fixture(app, "ty-modal/alertdialog.html");
}

#[test]
fn wide_busy() {
    fn app() -> Element {
        rsx! { elements::TyModal { is_open: true, width: elements::ModalWidth::Wide, busy: true, instance: "i", title: rsx! { "Publishing" }, "Uploading the bundle." } }
    }
    common::assert_matches_fixture(app, "ty-modal/wide-busy.html");
}

#[test]
fn no_close_button() {
    fn app() -> Element {
        rsx! { elements::TyModal { is_open: true, show_close_button: "false", instance: "i", title: rsx! { "Terms of service" }, actions: rsx! { "Accept" }, "Scroll to the end." } }
    }
    common::assert_matches_fixture(app, "ty-modal/no-close-button.html");
}
