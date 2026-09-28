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
        rsx! { elements::TyNotificationCenter { instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-notification-center/closed.html");
}

#[test]
fn open_empty() {
    fn app() -> Element {
        rsx! { elements::TyNotificationCenter { open: true, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-notification-center/open-empty.html");
}

#[test]
fn translated() {
    fn app() -> Element {
        rsx! { elements::TyNotificationCenter { open: true, bell_label: "Notificações", title_label: "Notificações", clear_all_label: "Limpar tudo", close_label: "Fechar", empty_label: "Não há notificações nesta sessão.", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-notification-center/translated.html");
}
