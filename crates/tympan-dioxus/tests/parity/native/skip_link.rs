//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn default() {
    fn app() -> Element {
        rsx! { elements::TySkipLink { instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-skip-link/default.html");
}

#[test]
fn translated() {
    fn app() -> Element {
        rsx! { elements::TySkipLink { target_id: "conteudo", label: "Ir para o conteúdo", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-skip-link/translated.html");
}
