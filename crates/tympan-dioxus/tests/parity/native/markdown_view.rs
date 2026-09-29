//! SSR parity of the native port of `<ty-markdown-view>`
//! (`tympan_dioxus::elements`). The definition has no examples — the whole
//! subtree is parsed from the `text` Markdown source, which the parity
//! renderers could not express — so there are no fixtures; what is asserted
//! instead (like the toast and command-palette ports' tests) is the
//! SSR-representable states: the empty host, and the parsed subtree exactly
//! as the custom element builds it on connect — paragraphs with their inline
//! code, strong, emphasis and safe links (the external `<ty-link>` anatomy),
//! real headings offset by `heading-base`, lists, and sunken code blocks
//! with their language tag. The overflowing-code-block scroll region is a
//! runtime measurement, so SSR renders the passive code block.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn empty() {
    fn app() -> Element {
        rsx! { elements::TyMarkdownView { instance: "i" } }
    }
    assert_eq!(
        common::render(app),
        r##"<ty-markdown-view data-ty-instance="i" heading-base="3" density="regular" code-block-label="Code block" code-block-language-label="Code block, {language}" new-tab-label="(opens in a new tab)"></ty-markdown-view>"##
    );
}

#[test]
fn paragraphs_and_inlines() {
    fn app() -> Element {
        rsx! {
            elements::TyMarkdownView {
                text: "A **bold** and *em* with `code` and a [link](https://example.com).",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r##"<ty-markdown-view data-ty-instance="i" text="A **bold** and *em* with `code` and a [link](https://example.com)." heading-base="3" density="regular" code-block-label="Code block" code-block-language-label="Code block, {language}" new-tab-label="(opens in a new tab)"><div class="ty-markdown" data-density="regular"><p class="ty-markdown__paragraph" dir="auto">A <strong>bold</strong> and <em>em</em> with <code class="ty-markdown__code-span">code</code> and a <a class="ty-link" href="https://example.com" target="_blank" rel="noopener noreferrer" data-emphasis="underlined">link<svg class="ty-icon ty-mirror-rtl ty-link__external" aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg><span class="ty-visually-hidden ty-link__hint"> (opens in a new tab)</span></a>.</p></div></ty-markdown-view>"##
    );
}

#[test]
fn headings_offset_and_capped() {
    fn app() -> Element {
        rsx! {
            elements::TyMarkdownView {
                text: "# One\n\n#### Four",
                heading_base: 4.0,
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r##"<ty-markdown-view data-ty-instance="i" text="# One

#### Four" heading-base="4" density="regular" code-block-label="Code block" code-block-language-label="Code block, {language}" new-tab-label="(opens in a new tab)"><div class="ty-markdown" data-density="regular"><h4 class="ty-markdown__heading" data-depth="1" dir="auto">One</h4><h6 class="ty-markdown__heading" data-depth="4" dir="auto">Four</h6></div></ty-markdown-view>"##
    );
}

#[test]
fn lists() {
    fn app() -> Element {
        rsx! {
            elements::TyMarkdownView {
                text: "- a\n- b\n\n1. c\n2) d",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r##"<ty-markdown-view data-ty-instance="i" text="- a
- b

1. c
2) d" heading-base="3" density="regular" code-block-label="Code block" code-block-language-label="Code block, {language}" new-tab-label="(opens in a new tab)"><div class="ty-markdown" data-density="regular"><ul class="ty-markdown__list"><li dir="auto">a</li><li dir="auto">b</li></ul><ol class="ty-markdown__list"><li dir="auto">c</li><li dir="auto">d</li></ol></div></ty-markdown-view>"##
    );
}

#[test]
fn code_block() {
    fn app() -> Element {
        let text = "```rust\nfn main() {}\n```";
        rsx! {
            elements::TyMarkdownView {
                text: text,
                density: elements::MarkdownViewDensity::Compact,
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r##"<ty-markdown-view data-ty-instance="i" text="```rust
fn main() {}
```" heading-base="3" density="compact" code-block-label="Code block" code-block-language-label="Code block, {language}" new-tab-label="(opens in a new tab)"><div class="ty-markdown" data-density="compact"><div class="ty-markdown__code-block"><span class="ty-markdown__language" aria-hidden="true">rust</span><pre class="ty-markdown__pre" dir="ltr" data-language="rust"><code>fn main() {}</code></pre></div></div></ty-markdown-view>"##
    );
}

#[test]
fn raw_markup_stays_text() {
    fn app() -> Element {
        rsx! {
            elements::TyMarkdownView {
                text: "<b>not html</b> [bad](javascript:alert(1))",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        r##"<ty-markdown-view data-ty-instance="i" text="&#60;b&#62;not html&#60;/b&#62; [bad](javascript:alert(1))" heading-base="3" density="regular" code-block-label="Code block" code-block-language-label="Code block, {language}" new-tab-label="(opens in a new tab)"><div class="ty-markdown" data-density="regular"><p class="ty-markdown__paragraph" dir="auto">&#60;b&#62;not html&#60;/b&#62; [bad](javascript:alert(1))</p></div></ty-markdown-view>"##
    );
}
