//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn line() {
    fn app() -> Element {
        rsx! { elements::TySkeleton { instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-skeleton/line.html");
}

#[test]
fn heading_short() {
    fn app() -> Element {
        rsx! { elements::TySkeleton { shape: elements::SkeletonShape::Heading, width: "short", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-skeleton/heading-short.html");
}

#[test]
fn circle() {
    fn app() -> Element {
        rsx! { elements::TySkeleton { shape: elements::SkeletonShape::Circle, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-skeleton/circle.html");
}

#[test]
fn rect_medium() {
    fn app() -> Element {
        rsx! { elements::TySkeleton { shape: elements::SkeletonShape::Rect, width: "medium", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-skeleton/rect-medium.html");
}

#[test]
fn announced() {
    fn app() -> Element {
        rsx! { elements::TySkeleton { label: "Loading the catalogue", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-skeleton/announced.html");
}
