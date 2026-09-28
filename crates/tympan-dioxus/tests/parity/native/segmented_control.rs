//! SSR parity of the native ports (`tympan_dioxus::elements`): every
//! example of a ported element, rendered by the native component, must
//! match the same reference HTML (tests/fixtures) the generated binding
//! and the TypeScript element are tested against — one anatomy, three
//! renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn period_week() {
    fn app() -> Element {
        rsx! { elements::TySegmentedControl { label: "Period", options: "[\"Day\",\"Week\",\"Month\"]", value: "Week", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-segmented-control/period-week.html");
}

#[test]
fn objects_compact() {
    fn app() -> Element {
        rsx! { elements::TySegmentedControl { label: "View", size: elements::SegmentedControlSize::Compact, default_value: "chart", options: "[{{\"value\":\"table\",\"label\":\"Table\"}},{{\"value\":\"chart\",\"label\":\"Chart\"}}]", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-segmented-control/objects-compact.html");
}

#[test]
fn full_width_large() {
    fn app() -> Element {
        rsx! { elements::TySegmentedControl { label: "Mode", size: elements::SegmentedControlSize::Large, full_width: true, options: "[\"Preview\",\"Code\"]", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-segmented-control/full-width-large.html");
}

#[test]
fn disabled() {
    fn app() -> Element {
        rsx! { elements::TySegmentedControl { label: "Period", disabled: true, value: "Day", options: "[\"Day\",\"Week\"]", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-segmented-control/disabled.html");
}

#[test]
fn icon_only() {
    fn app() -> Element {
        rsx! { elements::TySegmentedControl { label: "Layout", icon_only: true, value: "grid", options: "[{{\"value\":\"list\",\"label\":\"List\",\"icon\":\"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01\"}},{{\"value\":\"grid\",\"label\":\"Grid\",\"icon\":\"M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z\"}}]", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-segmented-control/icon-only.html");
}
