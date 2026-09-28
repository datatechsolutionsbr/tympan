//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn inline() {
    fn app() -> Element {
        rsx! { elements::TyLink { href: "/runs", instance: "i", "Runs" } }
    }
    common::assert_matches_fixture(app, "ty-link/inline.html");
}

#[test]
fn subtle_standalone() {
    fn app() -> Element {
        rsx! { elements::TyLink { href: "/runs/01HX", emphasis: elements::LinkEmphasis::Subtle, standalone: true, instance: "i", "Details" } }
    }
    common::assert_matches_fixture(app, "ty-link/subtle-standalone.html");
}

#[test]
fn external() {
    fn app() -> Element {
        rsx! { elements::TyLink { href: "https://example.org/report", external: true, instance: "i", "Report" } }
    }
    common::assert_matches_fixture(app, "ty-link/external.html");
}

#[test]
fn current() {
    fn app() -> Element {
        rsx! { elements::TyLink { href: "/overview", current: true, instance: "i", "Overview" } }
    }
    common::assert_matches_fixture(app, "ty-link/current.html");
}

#[test]
fn translated_hint() {
    fn app() -> Element {
        rsx! { elements::TyLink { href: "https://example.org/relatorio", external: true, new_tab_label: "(abre em nova aba)", described_by: "report-hint", instance: "i", "Relatório" } }
    }
    common::assert_matches_fixture(app, "ty-link/translated-hint.html");
}
