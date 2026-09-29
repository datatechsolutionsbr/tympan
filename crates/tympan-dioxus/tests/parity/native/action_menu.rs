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
        rsx! { elements::TyActionMenu { label: "Item actions", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-action-menu/closed.html");
}

#[test]
fn own_trigger() {
    fn app() -> Element {
        rsx! { elements::TyActionMenu { label: "Run actions", instance: "i", trigger: rsx! { "More" }, } }
    }
    common::assert_matches_fixture(app, "ty-action-menu/own-trigger.html");
}

#[test]
fn context() {
    fn app() -> Element {
        rsx! { elements::TyActionMenu { mode: elements::ActionMenuMode::Context, label: "File actions", instance: "i", trigger: rsx! { "report.csv" }, } }
    }
    common::assert_matches_fixture(app, "ty-action-menu/context.html");
}

#[test]
fn translated() {
    fn app() -> Element {
        rsx! { elements::TyActionMenu { label: "Ações do item", trigger_label: "Mais ações", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-action-menu/translated.html");
}

// The composed rows never reach the fixtures (the parity renderers cannot
// produce them), so — like the command palette's tests — the `iconPath`
// rendering is asserted as an exact SSR string: a single path, subpaths
// separated by " | " as one `<path>` each, and `iconPath` winning over the
// `icon` text glyph.
#[test]
fn icon_path_renders_an_svg_icon() {
    fn app() -> Element {
        let items = r#"[{"id":"edit","label":"Edit","icon":"✎","iconPath":"M12 20h9"},{"id":"split","label":"Split","iconPath":"M18 6 6 18 | m6 6 12 12"},{"id":"plain","label":"Plain"}]"#;
        rsx! { elements::TyActionMenu { open: true, label: "Item actions", items: items, instance: "i", } }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-action-menu data-ty-instance="i" open="true" mode="trigger" label="Item actions" trigger-label="More actions" items="[{&#34;id&#34;:&#34;edit&#34;,&#34;label&#34;:&#34;Edit&#34;,&#34;icon&#34;:&#34;✎&#34;,&#34;iconPath&#34;:&#34;M12 20h9&#34;},{&#34;id&#34;:&#34;split&#34;,&#34;label&#34;:&#34;Split&#34;,&#34;iconPath&#34;:&#34;M18 6 6 18 | m6 6 12 12&#34;},{&#34;id&#34;:&#34;plain&#34;,&#34;label&#34;:&#34;Plain&#34;}]"><span class="ty-action-menu__target" data-mode="trigger"><button class="ty-button ty-action-menu__trigger" type="button" aria-label="More actions" aria-haspopup="menu" data-variant="quiet" data-icon-only=""><span class="ty-button__icon" aria-hidden="true"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle class="ty-action-menu__glyph" cx="12" cy="12" r="1"></circle><circle class="ty-action-menu__glyph" cx="19" cy="12" r="1"></circle><circle class="ty-action-menu__glyph" cx="5" cy="12" r="1"></circle></svg></span></button><div class="ty-action-menu" data-mode="trigger"><div class="ty-action-menu__menu" id="i-menu" role="menu" aria-label="Item actions" aria-orientation="vertical" tabindex="-1"><div class="ty-action-menu__item" role="menuitem" tabindex="-1" data-tone="default"><span class="ty-action-menu__icon" aria-hidden="true"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20h9"></path></svg></span><span class="ty-action-menu__label">Edit</span></div><div class="ty-action-menu__item" role="menuitem" tabindex="-1" data-tone="default"><span class="ty-action-menu__icon" aria-hidden="true"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></span><span class="ty-action-menu__label">Split</span></div><div class="ty-action-menu__item" role="menuitem" tabindex="-1" data-tone="default"><span class="ty-action-menu__label">Plain</span></div></div></div></span></ty-action-menu>"#
    );
}
