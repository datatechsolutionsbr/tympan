//! SSR parity of the native `TyWheelPicker`. The element is
//! `kind: "self-rendering"` with `examples: []` in its definition — the
//! wheels are runtime data no renderer can express up front — so, like the
//! toast, command-palette and theme-palette ports, there are no fixtures
//! and the tests assert the exact SSR string of the states SSR can
//! represent: the composed wheels as the element's first placement painted
//! them (selection, distance emphasis, `aria-activedescendant`), in the
//! single and the multi-column form.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn single_wheel() {
    fn app() -> Element {
        rsx! {
            elements::TyWheelPicker {
                instance: "i",
                options: r#"["10","11","12"]"#,
                value: "11",
                label: "Hour",
            }
        }
    }
    assert_eq!(common::render(app), SINGLE);
}

#[test]
fn columns() {
    fn app() -> Element {
        rsx! {
            elements::TyWheelPicker {
                instance: "i",
                label: "Date",
                columns: r#"[{{"label":"Day","options":["1","2","3"],"value":"2","share":2}},{{"label":"Month","options":[{{"value":"jan","label":"January"}},{{"value":"feb","label":"February"}}]}}]"#,
            }
        }
    }
    assert_eq!(common::render(app), COLUMNS);
}

#[test]
fn object_options_disabled() {
    fn app() -> Element {
        rsx! {
            elements::TyWheelPicker {
                instance: "i",
                options: r#"[{{"value":"s","label":"Small"}},{{"value":"m","label":"Medium"}},{{"value":"l","label":"Large"}},{{"value":"xl","label":"Extra large"}}]"#,
                value: "xxl",
                label: "Size",
                visible_rows: 4.0,
                disabled: true,
                test_id: "size-wheel",
            }
        }
    }
    assert_eq!(common::render(app), OBJECT_OPTIONS_DISABLED);
}

#[test]
fn empty() {
    fn app() -> Element {
        rsx! { elements::TyWheelPicker { instance: "i" } }
    }
    assert_eq!(common::render(app), EMPTY);
}

// The value names the second row: it is selected and centred.
const SINGLE: &str = r#"<ty-wheel-picker data-ty-instance="i" options="[&#34;10&#34;,&#34;11&#34;,&#34;12&#34;]" value="11" label="Hour" visible-rows="5"><div class="ty-wheel" style="--ty-wheel-rows: 5; --ty-wheel-share: 1;"><div class="ty-wheel__viewport"><span class="ty-wheel__band" aria-hidden="true"></span><div class="ty-wheel__list" role="listbox" tabindex="0" aria-label="Hour" aria-activedescendant="i-wheel-0-option-1"><div class="ty-wheel__row" role="option" id="i-wheel-0-option-0" aria-selected="false" data-distance="1">10</div><div class="ty-wheel__row" role="option" id="i-wheel-0-option-1" aria-selected="true" data-selected="" data-distance="0">11</div><div class="ty-wheel__row" role="option" id="i-wheel-0-option-2" aria-selected="false" data-distance="1">12</div></div></div></div></ty-wheel-picker>"#;

// Two captioned wheels in a group named by `label`; the second column's
// empty value selects nothing and centres the first row.
const COLUMNS: &str = r#"<ty-wheel-picker data-ty-instance="i" label="Date" visible-rows="5" columns="[{&#34;label&#34;:&#34;Day&#34;,&#34;options&#34;:[&#34;1&#34;,&#34;2&#34;,&#34;3&#34;],&#34;value&#34;:&#34;2&#34;,&#34;share&#34;:2},{&#34;label&#34;:&#34;Month&#34;,&#34;options&#34;:[{&#34;value&#34;:&#34;jan&#34;,&#34;label&#34;:&#34;January&#34;},{&#34;value&#34;:&#34;feb&#34;,&#34;label&#34;:&#34;February&#34;}]}]"><div class="ty-wheel-group" role="group" aria-label="Date"><div class="ty-wheel" style="--ty-wheel-rows: 5; --ty-wheel-share: 2;"><span class="ty-wheel__caption" aria-hidden="true">Day</span><div class="ty-wheel__viewport"><span class="ty-wheel__band" aria-hidden="true"></span><div class="ty-wheel__list" role="listbox" tabindex="0" aria-label="Day" aria-activedescendant="i-wheel-0-option-1"><div class="ty-wheel__row" role="option" id="i-wheel-0-option-0" aria-selected="false" data-distance="1">1</div><div class="ty-wheel__row" role="option" id="i-wheel-0-option-1" aria-selected="true" data-selected="" data-distance="0">2</div><div class="ty-wheel__row" role="option" id="i-wheel-0-option-2" aria-selected="false" data-distance="1">3</div></div></div></div><div class="ty-wheel" style="--ty-wheel-rows: 5; --ty-wheel-share: 1;"><span class="ty-wheel__caption" aria-hidden="true">Month</span><div class="ty-wheel__viewport"><span class="ty-wheel__band" aria-hidden="true"></span><div class="ty-wheel__list" role="listbox" tabindex="0" aria-label="Month" aria-activedescendant="i-wheel-1-option-0"><div class="ty-wheel__row" role="option" id="i-wheel-1-option-0" aria-selected="false" data-distance="0">January</div><div class="ty-wheel__row" role="option" id="i-wheel-1-option-1" aria-selected="false" data-distance="1">February</div></div></div></div></div></ty-wheel-picker>"#;

// A value no option holds selects nothing and centres the first row; an
// even `visible-rows` rounds up to the next odd one (the distance emphasis
// caps at 3), and the single wheel carries the test hook.
const OBJECT_OPTIONS_DISABLED: &str = r#"<ty-wheel-picker data-ty-instance="i" options="[{&#34;value&#34;:&#34;s&#34;,&#34;label&#34;:&#34;Small&#34;},{&#34;value&#34;:&#34;m&#34;,&#34;label&#34;:&#34;Medium&#34;},{&#34;value&#34;:&#34;l&#34;,&#34;label&#34;:&#34;Large&#34;},{&#34;value&#34;:&#34;xl&#34;,&#34;label&#34;:&#34;Extra large&#34;}]" value="xxl" label="Size" visible-rows="4" disabled="true" test-id="size-wheel"><div class="ty-wheel" style="--ty-wheel-rows: 5; --ty-wheel-share: 1;" data-disabled="" data-testid="size-wheel"><div class="ty-wheel__viewport"><span class="ty-wheel__band" aria-hidden="true"></span><div class="ty-wheel__list" role="listbox" tabindex="0" aria-label="Size" aria-activedescendant="i-wheel-0-option-0"><div class="ty-wheel__row" role="option" id="i-wheel-0-option-0" aria-selected="false" data-distance="0">Small</div><div class="ty-wheel__row" role="option" id="i-wheel-0-option-1" aria-selected="false" data-distance="1">Medium</div><div class="ty-wheel__row" role="option" id="i-wheel-0-option-2" aria-selected="false" data-distance="2">Large</div><div class="ty-wheel__row" role="option" id="i-wheel-0-option-3" aria-selected="false" data-distance="3">Extra large</div></div></div></div></ty-wheel-picker>"#;

// No data: one wheel with an empty listbox and no active descendant.
const EMPTY: &str = r#"<ty-wheel-picker data-ty-instance="i" visible-rows="5"><div class="ty-wheel" style="--ty-wheel-rows: 5; --ty-wheel-share: 1;"><div class="ty-wheel__viewport"><span class="ty-wheel__band" aria-hidden="true"></span><div class="ty-wheel__list" role="listbox" tabindex="0" aria-label=""></div></div></div></ty-wheel-picker>"#;
