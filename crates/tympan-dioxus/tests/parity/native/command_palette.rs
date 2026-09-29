//! SSR parity of the native port of `<ty-command-palette>`
//! (`tympan_dioxus::elements`). The definition has no examples — the rows
//! are composed from the JSON props at runtime, which the parity renderers
//! could not express — so there are no fixtures; what is asserted instead
//! (like the toast port's tests) is the SSR-representable states: the empty
//! host while closed, and the opened dialog exactly as the custom element
//! builds it on open — the field with its scope chip, the scope column, the
//! composed groups and options with the first row highlighted, the empty
//! view, the loading skeletons, the footer hints and the status region.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn closed() {
    fn app() -> Element {
        rsx! { elements::TyCommandPalette { instance: "i" } }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-command-palette data-ty-instance="i" recent-visible="5" recent-keep="12" label="Search and commands" placeholder="Search or type a command" empty-label="Type to search records, sources and screens." no-results-label="Nothing matches “{query}”." loading-label="Loading results" remove-scope-label="Remove scope {scope}" actions-for-label="Actions for {label}" recent-label="Recent" results-label="{count} results" scopes-label="Scopes" fallback-label="Other actions" hint-navigate="move" hint-select="open" hint-actions="actions" hint-back="back" hint-close="close"></ty-command-palette>"#
    );
}

#[test]
fn open_empty() {
    fn app() -> Element {
        rsx! { elements::TyCommandPalette { open: true, instance: "i" } }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-command-palette data-ty-instance="i" open="true" recent-visible="5" recent-keep="12" label="Search and commands" placeholder="Search or type a command" empty-label="Type to search records, sources and screens." no-results-label="Nothing matches “{query}”." loading-label="Loading results" remove-scope-label="Remove scope {scope}" actions-for-label="Actions for {label}" recent-label="Recent" results-label="{count} results" scopes-label="Scopes" fallback-label="Other actions" hint-navigate="move" hint-select="open" hint-actions="actions" hint-back="back" hint-close="close"><dialog class="ty-palette" aria-label="Search and commands"><div class="ty-palette__dialog"><div class="ty-palette__field"><svg class="ty-palette__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input class="ty-palette__input" role="combobox" aria-label="Search and commands" aria-autocomplete="list" aria-expanded="false" aria-controls="i-list" placeholder="Search or type a command" autocomplete="off" spellcheck="false" type="text"/></div><div class="ty-palette__main"><div class="ty-palette__results"><div class="ty-palette__list" id="i-list" role="listbox" aria-label="Search and commands"></div><p class="ty-palette__empty">Type to search records, sources and screens.</p></div></div><div class="ty-palette__footer" aria-hidden="true"><span><kbd class="ty-palette__kbd">↑↓</kbd> move</span><span><kbd class="ty-palette__kbd">↵</kbd> open</span><span><kbd class="ty-palette__kbd">→</kbd> actions</span><span><kbd class="ty-palette__kbd">←</kbd> back</span><span><kbd class="ty-palette__kbd">esc</kbd> close</span></div><span class="ty-visually-hidden" role="status"></span></div></dialog></ty-command-palette>"#
    );
}

#[test]
fn open_groups() {
    fn app() -> Element {
        let groups = r#"[{"id":"records","heading":"Records","items":[{"id":"rec-1","label":"Customers","description":"All customer records","icon":"@","keywords":["clients"],"hint":"Records","shortcut":"GC","actions":[{"id":"rec-1-new","label":"New customer","shortcut":"N"}]},{"id":"rec-2","label":"Orders","hint":"Records"}]},{"id":"screens","heading":"Screens","items":[{"id":"scr-1","label":"Dashboard"}]}]"#;
        let scopes = r#"[{"id":"records","label":"Records","icon":"*"},{"id":"screens","label":"Screens"}]"#;
        rsx! {
            elements::TyCommandPalette {
                open: true,
                groups: groups,
                scopes: scopes,
                active_scope: "records",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-command-palette data-ty-instance="i" open="true" groups="[{&#34;id&#34;:&#34;records&#34;,&#34;heading&#34;:&#34;Records&#34;,&#34;items&#34;:[{&#34;id&#34;:&#34;rec-1&#34;,&#34;label&#34;:&#34;Customers&#34;,&#34;description&#34;:&#34;All customer records&#34;,&#34;icon&#34;:&#34;@&#34;,&#34;keywords&#34;:[&#34;clients&#34;],&#34;hint&#34;:&#34;Records&#34;,&#34;shortcut&#34;:&#34;GC&#34;,&#34;actions&#34;:[{&#34;id&#34;:&#34;rec-1-new&#34;,&#34;label&#34;:&#34;New customer&#34;,&#34;shortcut&#34;:&#34;N&#34;}]},{&#34;id&#34;:&#34;rec-2&#34;,&#34;label&#34;:&#34;Orders&#34;,&#34;hint&#34;:&#34;Records&#34;}]},{&#34;id&#34;:&#34;screens&#34;,&#34;heading&#34;:&#34;Screens&#34;,&#34;items&#34;:[{&#34;id&#34;:&#34;scr-1&#34;,&#34;label&#34;:&#34;Dashboard&#34;}]}]" scopes="[{&#34;id&#34;:&#34;records&#34;,&#34;label&#34;:&#34;Records&#34;,&#34;icon&#34;:&#34;*&#34;},{&#34;id&#34;:&#34;screens&#34;,&#34;label&#34;:&#34;Screens&#34;}]" active-scope="records" recent-visible="5" recent-keep="12" label="Search and commands" placeholder="Search or type a command" empty-label="Type to search records, sources and screens." no-results-label="Nothing matches “{query}”." loading-label="Loading results" remove-scope-label="Remove scope {scope}" actions-for-label="Actions for {label}" recent-label="Recent" results-label="{count} results" scopes-label="Scopes" fallback-label="Other actions" hint-navigate="move" hint-select="open" hint-actions="actions" hint-back="back" hint-close="close"><dialog class="ty-palette" aria-label="Search and commands"><div class="ty-palette__dialog"><div class="ty-palette__field"><button class="ty-palette__chip" type="button" aria-label="Remove scope Records">Records<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button><svg class="ty-palette__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input class="ty-palette__input" role="combobox" aria-label="Search and commands" aria-autocomplete="list" aria-expanded="true" aria-controls="i-list" aria-activedescendant="i-records-rec-1" placeholder="Search or type a command" autocomplete="off" spellcheck="false" type="text"/></div><div class="ty-palette__main"><div class="ty-palette__scopes" role="group" aria-label="Scopes"><button class="ty-palette__scope" type="button" aria-pressed="true" tabindex="-1"><span aria-hidden="true">*</span>Records</button><button class="ty-palette__scope" type="button" aria-pressed="false" tabindex="-1">Screens</button></div><div class="ty-palette__results"><div class="ty-palette__list" id="i-list" role="listbox" aria-label="Search and commands"><div class="ty-palette__group" role="group" aria-labelledby="i-records"><div class="ty-palette__heading" id="i-records" role="presentation">Records</div><div class="ty-palette__option" id="i-records-rec-1" role="option" aria-selected="true" data-kind="item" data-highlighted=""><span class="ty-palette__icon" aria-hidden="true">@</span><span class="ty-palette__text"><span class="ty-palette__label">Customers</span><span class="ty-palette__description">All customer records</span></span><span class="ty-palette__hint">Records</span><kbd class="ty-palette__kbd">GC</kbd><span class="ty-palette__chevron" aria-hidden="true"><svg class="ty-mirror-rtl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"></path></svg></span></div><div class="ty-palette__option" id="i-records-rec-2" role="option" aria-selected="false" data-kind="item"><span class="ty-palette__text"><span class="ty-palette__label">Orders</span></span><span class="ty-palette__hint">Records</span></div></div></div></div></div><div class="ty-palette__footer" aria-hidden="true"><span><kbd class="ty-palette__kbd">↑↓</kbd> move</span><span><kbd class="ty-palette__kbd">↵</kbd> open</span><span><kbd class="ty-palette__kbd">→</kbd> actions</span><span><kbd class="ty-palette__kbd">←</kbd> back</span><span><kbd class="ty-palette__kbd">esc</kbd> close</span></div><span class="ty-visually-hidden" role="status"></span></div></dialog></ty-command-palette>"#
    );
}

#[test]
fn loading() {
    fn app() -> Element {
        rsx! { elements::TyCommandPalette { open: true, loading: true, instance: "i" } }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-command-palette data-ty-instance="i" open="true" loading="" recent-visible="5" recent-keep="12" label="Search and commands" placeholder="Search or type a command" empty-label="Type to search records, sources and screens." no-results-label="Nothing matches “{query}”." loading-label="Loading results" remove-scope-label="Remove scope {scope}" actions-for-label="Actions for {label}" recent-label="Recent" results-label="{count} results" scopes-label="Scopes" fallback-label="Other actions" hint-navigate="move" hint-select="open" hint-actions="actions" hint-back="back" hint-close="close"><dialog class="ty-palette" aria-label="Search and commands"><div class="ty-palette__dialog"><div class="ty-palette__field"><svg class="ty-palette__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input class="ty-palette__input" role="combobox" aria-label="Search and commands" aria-autocomplete="list" aria-expanded="false" aria-controls="i-list" placeholder="Search or type a command" autocomplete="off" spellcheck="false" type="text"/></div><div class="ty-palette__main"><div class="ty-palette__results"><div class="ty-palette__loading" aria-hidden="true"><span class="ty-skeleton" data-shape="line"></span><span class="ty-skeleton" data-shape="line"></span><span class="ty-skeleton" data-shape="line"></span></div><div class="ty-palette__list" id="i-list" role="listbox" aria-label="Search and commands"></div></div></div><div class="ty-palette__footer" aria-hidden="true"><span><kbd class="ty-palette__kbd">↑↓</kbd> move</span><span><kbd class="ty-palette__kbd">↵</kbd> open</span><span><kbd class="ty-palette__kbd">→</kbd> actions</span><span><kbd class="ty-palette__kbd">←</kbd> back</span><span><kbd class="ty-palette__kbd">esc</kbd> close</span></div><span class="ty-visually-hidden" role="status">Loading results</span></div></dialog></ty-command-palette>"#
    );
}

// The `iconPath` rendering, as an exact SSR string: a single path, subpaths
// separated by " | " as one `<path>` each, and `iconPath` winning over the
// `icon` text glyph.
#[test]
fn icon_path_renders_an_svg_icon() {
    fn app() -> Element {
        let groups = r#"[{"id":"records","heading":"Records","items":[{"id":"edit","label":"Edit","icon":"✎","iconPath":"M12 20h9"},{"id":"split","label":"Split","iconPath":"M18 6 6 18 | m6 6 12 12"},{"id":"plain","label":"Plain"}]}]"#;
        rsx! { elements::TyCommandPalette { open: true, groups: groups, instance: "i" } }
    }
    assert_eq!(
        common::render(app),
        r#"<ty-command-palette data-ty-instance="i" open="true" groups="[{&#34;id&#34;:&#34;records&#34;,&#34;heading&#34;:&#34;Records&#34;,&#34;items&#34;:[{&#34;id&#34;:&#34;edit&#34;,&#34;label&#34;:&#34;Edit&#34;,&#34;icon&#34;:&#34;✎&#34;,&#34;iconPath&#34;:&#34;M12 20h9&#34;},{&#34;id&#34;:&#34;split&#34;,&#34;label&#34;:&#34;Split&#34;,&#34;iconPath&#34;:&#34;M18 6 6 18 | m6 6 12 12&#34;},{&#34;id&#34;:&#34;plain&#34;,&#34;label&#34;:&#34;Plain&#34;}]}]" recent-visible="5" recent-keep="12" label="Search and commands" placeholder="Search or type a command" empty-label="Type to search records, sources and screens." no-results-label="Nothing matches “{query}”." loading-label="Loading results" remove-scope-label="Remove scope {scope}" actions-for-label="Actions for {label}" recent-label="Recent" results-label="{count} results" scopes-label="Scopes" fallback-label="Other actions" hint-navigate="move" hint-select="open" hint-actions="actions" hint-back="back" hint-close="close"><dialog class="ty-palette" aria-label="Search and commands"><div class="ty-palette__dialog"><div class="ty-palette__field"><svg class="ty-palette__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input class="ty-palette__input" role="combobox" aria-label="Search and commands" aria-autocomplete="list" aria-expanded="true" aria-controls="i-list" aria-activedescendant="i-records-edit" placeholder="Search or type a command" autocomplete="off" spellcheck="false" type="text"/></div><div class="ty-palette__main"><div class="ty-palette__results"><div class="ty-palette__list" id="i-list" role="listbox" aria-label="Search and commands"><div class="ty-palette__group" role="group" aria-labelledby="i-records"><div class="ty-palette__heading" id="i-records" role="presentation">Records</div><div class="ty-palette__option" id="i-records-edit" role="option" aria-selected="true" data-kind="item" data-highlighted=""><span class="ty-palette__icon" aria-hidden="true"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20h9"></path></svg></span><span class="ty-palette__text"><span class="ty-palette__label">Edit</span></span></div><div class="ty-palette__option" id="i-records-split" role="option" aria-selected="false" data-kind="item"><span class="ty-palette__icon" aria-hidden="true"><svg class="ty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></span><span class="ty-palette__text"><span class="ty-palette__label">Split</span></span></div><div class="ty-palette__option" id="i-records-plain" role="option" aria-selected="false" data-kind="item"><span class="ty-palette__text"><span class="ty-palette__label">Plain</span></span></div></div></div></div></div><div class="ty-palette__footer" aria-hidden="true"><span><kbd class="ty-palette__kbd">↑↓</kbd> move</span><span><kbd class="ty-palette__kbd">↵</kbd> open</span><span><kbd class="ty-palette__kbd">→</kbd> actions</span><span><kbd class="ty-palette__kbd">←</kbd> back</span><span><kbd class="ty-palette__kbd">esc</kbd> close</span></div><span class="ty-visually-hidden" role="status"></span></div></dialog></ty-command-palette>"#
    );
}
