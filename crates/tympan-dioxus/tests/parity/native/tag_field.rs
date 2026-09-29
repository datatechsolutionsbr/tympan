//! SSR parity of the native port of `<ty-tag-field>` (`tympan_dioxus::elements`).
//! The definition has no examples — the field is data-driven and stateful
//! (the draft, the popup, the highlight), which the parity renderers could
//! not express — so there are no fixtures; what is asserted instead (like the
//! toast and command-palette ports' tests) is the SSR-representable states,
//! exactly the subtree the custom element builds on connect: the pills per
//! committed value, the entry (a combobox with suggestions), the closed
//! popup, the caption, note and fault lines.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn free_text_entry() {
    fn app() -> Element {
        rsx! { elements::TyTagField { label: "Tags", placeholder: "Add a tag", instance: "i" } }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-tag-field data-ty-instance="i" tone="neutral" label="Tags" placeholder="Add a tag" remove-label="Remove {value}" chosen-label="{field}: chosen values" suggestions-label="Suggestions"><div class="ty-tag-field" data-tone="neutral"><label class="ty-tag-field__caption" for="i-input">Tags</label><div class="ty-tag-field__frame"><div class="ty-tag-field__well"><span class="ty-tag-field__chips"><span class="ty-tag-field__chip-list" role="list" aria-label="Tags: chosen values"></span></span><span class="ty-tag-field__typing-host"><input class="ty-tag-field__typing" id="i-input" type="text" autocomplete="off" placeholder="Add a tag"/></span></div><div class="ty-tag-field__menu-layer" hidden=true><ul class="ty-tag-field__menu" id="i-listbox" role="listbox" aria-label="Suggestions"></ul></div></div><p class="ty-tag-field__note" id="i-note" hidden=true></p><p class="ty-tag-field__fault" id="i-fault" hidden=true></p></div></ty-tag-field>"#
    );
}

#[test]
fn pills_with_display_labels() {
    fn app() -> Element {
        let value = r#"["rust","dioxus"]"#;
        let labels = r#"{"rust":"Rust"}"#;
        rsx! {
            elements::TyTagField {
                value: value,
                suggestion_labels: labels,
                label: "Tags",
                helper_text: "Comma separates values",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-tag-field data-ty-instance="i" value="[&#34;rust&#34;,&#34;dioxus&#34;]" suggestion-labels="{&#34;rust&#34;:&#34;Rust&#34;}" tone="neutral" label="Tags" helper-text="Comma separates values" remove-label="Remove {value}" chosen-label="{field}: chosen values" suggestions-label="Suggestions"><div class="ty-tag-field" data-tone="neutral"><label class="ty-tag-field__caption" for="i-input">Tags</label><div class="ty-tag-field__frame"><div class="ty-tag-field__well"><span class="ty-tag-field__chips"><span class="ty-tag-field__chip-list" role="list" aria-label="Tags: chosen values"><span class="ty-tag-field__chip" role="listitem"><span class="ty-tag-field__chip-text">Rust</span><button class="ty-tag-field__drop" type="button" aria-label="Remove Rust" data-value="rust"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></span><span class="ty-tag-field__chip" role="listitem"><span class="ty-tag-field__chip-text">dioxus</span><button class="ty-tag-field__drop" type="button" aria-label="Remove dioxus" data-value="dioxus"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></span></span></span><span class="ty-tag-field__typing-host"><input class="ty-tag-field__typing" id="i-input" type="text" autocomplete="off" aria-describedby="i-note"/></span></div><div class="ty-tag-field__menu-layer" hidden=true><ul class="ty-tag-field__menu" id="i-listbox" role="listbox" aria-label="Suggestions"></ul></div></div><p class="ty-tag-field__note" id="i-note">Comma separates values</p><p class="ty-tag-field__fault" id="i-fault" hidden=true></p></div></ty-tag-field>"#
    );
}

#[test]
fn error_and_helper() {
    fn app() -> Element {
        rsx! {
            elements::TyTagField {
                label: "Tags",
                helper_text: "Comma separates values",
                error_text: "At least one tag is required",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-tag-field data-ty-instance="i" tone="neutral" label="Tags" helper-text="Comma separates values" error-text="At least one tag is required" remove-label="Remove {value}" chosen-label="{field}: chosen values" suggestions-label="Suggestions"><div class="ty-tag-field" data-tone="neutral" data-invalid=""><label class="ty-tag-field__caption" for="i-input">Tags</label><div class="ty-tag-field__frame"><div class="ty-tag-field__well"><span class="ty-tag-field__chips"><span class="ty-tag-field__chip-list" role="list" aria-label="Tags: chosen values"></span></span><span class="ty-tag-field__typing-host"><input class="ty-tag-field__typing" id="i-input" type="text" autocomplete="off" aria-invalid="true" aria-describedby="i-note i-fault"/></span></div><div class="ty-tag-field__menu-layer" hidden=true><ul class="ty-tag-field__menu" id="i-listbox" role="listbox" aria-label="Suggestions"></ul></div></div><p class="ty-tag-field__note" id="i-note">Comma separates values</p><p class="ty-tag-field__fault" id="i-fault">At least one tag is required</p></div></ty-tag-field>"#
    );
}

#[test]
fn suggestions_combobox_closed() {
    fn app() -> Element {
        let value = r#"["alpha"]"#;
        let suggestions = r#"["alpha","beta","gamma"]"#;
        rsx! {
            elements::TyTagField {
                value: value,
                suggestions: suggestions,
                accessible_label: "Tags",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-tag-field data-ty-instance="i" value="[&#34;alpha&#34;]" suggestions="[&#34;alpha&#34;,&#34;beta&#34;,&#34;gamma&#34;]" tone="neutral" accessible-label="Tags" remove-label="Remove {value}" chosen-label="{field}: chosen values" suggestions-label="Suggestions"><div class="ty-tag-field" data-tone="neutral"><label class="ty-tag-field__caption" for="i-input" hidden=true></label><div class="ty-tag-field__frame"><div class="ty-tag-field__well"><span class="ty-tag-field__chips"><span class="ty-tag-field__chip-list" role="list" aria-label="Tags: chosen values"><span class="ty-tag-field__chip" role="listitem"><span class="ty-tag-field__chip-text">alpha</span><button class="ty-tag-field__drop" type="button" aria-label="Remove alpha" data-value="alpha"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></span></span></span><span class="ty-tag-field__typing-host"><input class="ty-tag-field__typing" id="i-input" type="text" autocomplete="off" aria-label="Tags" role="combobox" aria-expanded="false" aria-controls="i-listbox" aria-autocomplete="list"/></span></div><div class="ty-tag-field__menu-layer" hidden=true><ul class="ty-tag-field__menu" id="i-listbox" role="listbox" aria-label="Suggestions"></ul></div></div><p class="ty-tag-field__note" id="i-note" hidden=true></p><p class="ty-tag-field__fault" id="i-fault" hidden=true></p></div></ty-tag-field>"#
    );
}

#[test]
fn unnamed_field() {
    fn app() -> Element {
        let value = r#"["a"]"#;
        rsx! { elements::TyTagField { value: value, instance: "i" } }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-tag-field data-ty-instance="i" value="[&#34;a&#34;]" tone="neutral" remove-label="Remove {value}" chosen-label="{field}: chosen values" suggestions-label="Suggestions"><div class="ty-tag-field" data-tone="neutral"><label class="ty-tag-field__caption" for="i-input" hidden=true></label><div class="ty-tag-field__frame"><div class="ty-tag-field__well"><span class="ty-tag-field__chips"><span class="ty-tag-field__chip-list" role="list" aria-label="chosen values"><span class="ty-tag-field__chip" role="listitem"><span class="ty-tag-field__chip-text">a</span><button class="ty-tag-field__drop" type="button" aria-label="Remove a" data-value="a"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></span></span></span><span class="ty-tag-field__typing-host"><input class="ty-tag-field__typing" id="i-input" type="text" autocomplete="off"/></span></div><div class="ty-tag-field__menu-layer" hidden=true><ul class="ty-tag-field__menu" id="i-listbox" role="listbox" aria-label="Suggestions"></ul></div></div><p class="ty-tag-field__note" id="i-note" hidden=true></p><p class="ty-tag-field__fault" id="i-fault" hidden=true></p></div></ty-tag-field>"#
    );
}

#[test]
fn at_max_disables_entry() {
    fn app() -> Element {
        let value = r#"["a","b"]"#;
        rsx! {
            elements::TyTagField {
                value: value,
                max: 2.0,
                label: "Tags",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-tag-field data-ty-instance="i" value="[&#34;a&#34;,&#34;b&#34;]" max="2" tone="neutral" label="Tags" remove-label="Remove {value}" chosen-label="{field}: chosen values" suggestions-label="Suggestions"><div class="ty-tag-field" data-tone="neutral"><label class="ty-tag-field__caption" for="i-input">Tags</label><div class="ty-tag-field__frame"><div class="ty-tag-field__well"><span class="ty-tag-field__chips"><span class="ty-tag-field__chip-list" role="list" aria-label="Tags: chosen values"><span class="ty-tag-field__chip" role="listitem"><span class="ty-tag-field__chip-text">a</span><button class="ty-tag-field__drop" type="button" aria-label="Remove a" data-value="a"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></span><span class="ty-tag-field__chip" role="listitem"><span class="ty-tag-field__chip-text">b</span><button class="ty-tag-field__drop" type="button" aria-label="Remove b" data-value="b"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></span></span></span><span class="ty-tag-field__typing-host"><input class="ty-tag-field__typing" id="i-input" type="text" autocomplete="off" disabled=true/></span></div><div class="ty-tag-field__menu-layer" hidden=true><ul class="ty-tag-field__menu" id="i-listbox" role="listbox" aria-label="Suggestions"></ul></div></div><p class="ty-tag-field__note" id="i-note" hidden=true></p><p class="ty-tag-field__fault" id="i-fault" hidden=true></p></div></ty-tag-field>"#
    );
}

#[test]
fn disabled_field() {
    fn app() -> Element {
        let value = r#"["a"]"#;
        rsx! {
            elements::TyTagField {
                value: value,
                disabled: true,
                label: "Tags",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-tag-field data-ty-instance="i" value="[&#34;a&#34;]" disabled="true" tone="neutral" label="Tags" remove-label="Remove {value}" chosen-label="{field}: chosen values" suggestions-label="Suggestions"><div class="ty-tag-field" data-tone="neutral"><label class="ty-tag-field__caption" for="i-input">Tags</label><div class="ty-tag-field__frame"><div class="ty-tag-field__well" data-disabled=""><span class="ty-tag-field__chips"><span class="ty-tag-field__chip-list" role="list" aria-label="Tags: chosen values"><span class="ty-tag-field__chip" role="listitem"><span class="ty-tag-field__chip-text">a</span><button class="ty-tag-field__drop" type="button" aria-label="Remove a" data-value="a" disabled=true><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></span></span></span><span class="ty-tag-field__typing-host"><input class="ty-tag-field__typing" id="i-input" type="text" autocomplete="off" disabled=true/></span></div><div class="ty-tag-field__menu-layer" hidden=true><ul class="ty-tag-field__menu" id="i-listbox" role="listbox" aria-label="Suggestions"></ul></div></div><p class="ty-tag-field__note" id="i-note" hidden=true></p><p class="ty-tag-field__fault" id="i-fault" hidden=true></p></div></ty-tag-field>"#
    );
}

#[test]
fn category_tint() {
    fn app() -> Element {
        let value = r#"["a"]"#;
        rsx! {
            elements::TyTagField {
                value: value,
                category_index: 3.0,
                label: "Tags",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-tag-field data-ty-instance="i" value="[&#34;a&#34;]" tone="neutral" category-index="3" label="Tags" remove-label="Remove {value}" chosen-label="{field}: chosen values" suggestions-label="Suggestions"><div class="ty-tag-field" data-tone="category" style="--ty-tag-field-tint: var(--ty-categorical-3)"><label class="ty-tag-field__caption" for="i-input">Tags</label><div class="ty-tag-field__frame"><div class="ty-tag-field__well"><span class="ty-tag-field__chips"><span class="ty-tag-field__chip-list" role="list" aria-label="Tags: chosen values"><span class="ty-tag-field__chip" role="listitem"><span class="ty-tag-field__chip-text">a</span><button class="ty-tag-field__drop" type="button" aria-label="Remove a" data-value="a"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></span></span></span><span class="ty-tag-field__typing-host"><input class="ty-tag-field__typing" id="i-input" type="text" autocomplete="off"/></span></div><div class="ty-tag-field__menu-layer" hidden=true><ul class="ty-tag-field__menu" id="i-listbox" role="listbox" aria-label="Suggestions"></ul></div></div><p class="ty-tag-field__note" id="i-note" hidden=true></p><p class="ty-tag-field__fault" id="i-fault" hidden=true></p></div></ty-tag-field>"#
    );
}
