//! Native port of `<ty-markdown-view>`, the self-rendering Markdown reader:
//! the component parses `text` with a port of the shared MarkdownView parser
//! (`components/markdown-view/parse.ts`) and renders the whole subtree
//! declaratively — node for node the tree the custom element builds on
//! connect and on every attribute change, mirroring the React MarkdownView.
//! Nothing here builds an HTML string: markup in the source can only ever
//! reach the page as escaped text, and links exist solely for absolute
//! http(s) URLs, each with the external `<ty-link>` anatomy
//! (`target="_blank"`, `rel="noopener noreferrer"`, the icon and the hidden
//! new-tab hint). The one behaviour that needs the live DOM — measuring
//! every code block and making an overflowing one a focusable, labelled
//! scroll region — is a DOM effect, cfg-gated in `mod wasm` with a no-op
//! non-wasm twin; SSR renders the passive code block, as the element does
//! before its script measures.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Spacing between blocks.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum MarkdownViewDensity {
    #[default]
    Regular,
    Compact,
}

impl MarkdownViewDensity {
    pub const ALL: [MarkdownViewDensity; 2] = [MarkdownViewDensity::Regular, MarkdownViewDensity::Compact];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            MarkdownViewDensity::Regular => "regular",
            MarkdownViewDensity::Compact => "compact",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<MarkdownViewDensity> {
        MarkdownViewDensity::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// One inline node of the parser's data tree.
#[derive(Clone, Debug, PartialEq)]
enum Inline {
    Text(String),
    Code(String),
    Strong(Vec<Inline>),
    Em(Vec<Inline>),
    Link { href: String, children: Vec<Inline> },
}

/// One block of the parser's data tree.
#[derive(Clone, Debug, PartialEq)]
enum Block {
    Paragraph(Vec<Inline>),
    Heading { depth: usize, content: Vec<Inline> },
    List { ordered: bool, items: Vec<Vec<Inline>> },
    Code { language: Option<String>, value: String },
}

/// Safely renders a small, product-relevant subset of Markdown written by people or produced by models, without ever interpreting raw HTML: paragraphs, lists, headings (real `h2`–`h6`, offset by `headingBase`), fenced code blocks, and inline code, strong, emphasis and http(s) links; everything else is literal text. Static — links are the only focusable content, plus a code block that overflows (a labelled scroll region).
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyMarkdownView(
    /// Markdown source (the supported subset; anything else renders as literal text). Empty renders nothing.
    #[props(into)]
    text: Option<String>,
    /// Level used for a Markdown level-1 heading (2 to 6); deeper levels follow, capped at 6.
    #[props(default = 3.0f64)]
    heading_base: f64,
    /// Spacing between blocks.
    #[props(default)]
    density: MarkdownViewDensity,
    /// Accessible name of a code block that overflows (a scroll region) when it has no language tag; translate through this attribute.
    #[props(into, default = String::from("Code block"))]
    code_block_label: String,
    /// Accessible name of an overflowing code block with a language tag; `{language}` is replaced by the tag.
    #[props(into, default = String::from("Code block, {language}"))]
    code_block_language_label: String,
    /// Screen-reader hint appended to every link (all links open in a new tab); translate through this attribute.
    #[props(into, default = String::from("(opens in a new tab)"))]
    new_tab_label: String,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
) -> Element {
    let instance = use_instance_id(instance);
    let source = text.clone().unwrap_or_default();
    let blocks = read_blocks(&source);

    // Mirrored props: the overflow effect re-reads the latest values through
    // signals, as the element re-read its attributes on every change.
    let mut mirrored_text = use_signal(|| source.clone());
    if source != *mirrored_text.peek() {
        mirrored_text.set(source.clone());
    }
    let mut mirrored_code_block_label = use_signal(|| code_block_label.clone());
    if code_block_label != *mirrored_code_block_label.peek() {
        mirrored_code_block_label.set(code_block_label.clone());
    }
    let mut mirrored_code_block_language_label = use_signal(|| code_block_language_label.clone());
    if code_block_language_label != *mirrored_code_block_language_label.peek() {
        mirrored_code_block_language_label.set(code_block_language_label.clone());
    }

    let mut root = use_signal(|| None::<Rc<MountedData>>);
    wasm::label_overflowing_code_blocks(
        root,
        mirrored_text,
        mirrored_code_block_label,
        mirrored_code_block_language_label,
    );

    rsx! {
        ty-markdown-view {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "text": text.as_deref().filter(|v| !v.is_empty()),
            "heading-base": Some(heading_base.to_string()),
            "density": Some(density.as_str()),
            "code-block-label": (!code_block_label.is_empty()).then_some(code_block_label.as_str()),
            "code-block-language-label": (!code_block_language_label.is_empty()).then_some(code_block_language_label.as_str()),
            "new-tab-label": (!new_tab_label.is_empty()).then_some(new_tab_label.as_str()),
            if !blocks.is_empty() {
                div {
                    class: "ty-markdown",
                    "data-density": Some(density.as_str()),
                    onmounted: move |event: MountedEvent| root.set(Some(event.data())),
                    for block in blocks.iter() {
                        {block_element(block, heading_base, new_tab_label.as_str())}
                    }
                }
            }
        }
    }
}

/// One block as elements: real headings offset by `heading_base` (clamped to
/// the spec range), lists, sunken code blocks with their language tag, and
/// paragraphs — the element's `#block`.
fn block_element(block: &Block, heading_base: f64, new_tab_label: &str) -> Element {
    match block {
        Block::Paragraph(content) => rsx! {
            p {
                class: "ty-markdown__paragraph",
                dir: "auto",
                {inlines_element(content, new_tab_label)}
            }
        },
        Block::Heading { depth, content } => {
            let level = heading_level(heading_base, *depth);
            let depth = depth.to_string();
            let inner = inlines_element(content, new_tab_label);
            match level {
                2 => rsx! {
                    h2 { class: "ty-markdown__heading", "data-depth": Some(depth), dir: "auto", {inner} }
                },
                3 => rsx! {
                    h3 { class: "ty-markdown__heading", "data-depth": Some(depth), dir: "auto", {inner} }
                },
                4 => rsx! {
                    h4 { class: "ty-markdown__heading", "data-depth": Some(depth), dir: "auto", {inner} }
                },
                5 => rsx! {
                    h5 { class: "ty-markdown__heading", "data-depth": Some(depth), dir: "auto", {inner} }
                },
                6 => rsx! {
                    h6 { class: "ty-markdown__heading", "data-depth": Some(depth), dir: "auto", {inner} }
                },
                _ => unreachable!("heading_level clamps to 2..=6"),
            }
        }
        Block::List { ordered, items } => {
            if *ordered {
                rsx! {
                    ol {
                        class: "ty-markdown__list",
                        for item in items.iter() {
                            li {
                                dir: "auto",
                                {inlines_element(item, new_tab_label)}
                            }
                        }
                    }
                }
            } else {
                rsx! {
                    ul {
                        class: "ty-markdown__list",
                        for item in items.iter() {
                            li {
                                dir: "auto",
                                {inlines_element(item, new_tab_label)}
                            }
                        }
                    }
                }
            }
        }
        Block::Code { language, value } => rsx! {
            div {
                class: "ty-markdown__code-block",
                if let Some(language) = language {
                    span {
                        class: "ty-markdown__language",
                        "aria-hidden": Some("true"),
                        "{language}"
                    }
                }
                pre {
                    class: "ty-markdown__pre",
                    dir: "ltr",
                    "data-language": language.clone(),
                    code {
                        "{value}"
                    }
                }
            }
        },
    }
}

/// Inline nodes as elements: text stays text; only the parser's own elements
/// are created — the element's `#inline`.
fn inlines_element(nodes: &[Inline], new_tab_label: &str) -> Element {
    rsx! {
        for node in nodes.iter() {
            {inline_element(node, new_tab_label)}
        }
    }
}

fn inline_element(node: &Inline, new_tab_label: &str) -> Element {
    match node {
        Inline::Text(value) => rsx! {
            "{value}"
        },
        Inline::Code(value) => rsx! {
            code {
                class: "ty-markdown__code-span",
                "{value}"
            }
        },
        Inline::Strong(children) => rsx! {
            strong {
                {inlines_element(children, new_tab_label)}
            }
        },
        Inline::Em(children) => rsx! {
            em {
                {inlines_element(children, new_tab_label)}
            }
        },
        // A safe link: the parser only produces absolute http(s) hrefs, and
        // every one opens in a new tab with no opener and no referrer, with
        // the external icon and the hidden hint — the external `<ty-link>`
        // anatomy.
        Inline::Link { href, children } => rsx! {
            a {
                class: "ty-link",
                href: Some(href.clone()),
                target: Some("_blank"),
                rel: Some("noopener noreferrer"),
                "data-emphasis": Some("underlined"),
                {inlines_element(children, new_tab_label)}
                svg {
                    class: "ty-icon ty-mirror-rtl ty-link__external",
                    "aria-hidden": Some("true"),
                    "focusable": Some("false"),
                    "width": Some("24"),
                    "height": Some("24"),
                    "viewBox": Some("0 0 24 24"),
                    "fill": Some("none"),
                    "stroke": Some("currentColor"),
                    "stroke-width": Some("2"),
                    "stroke-linecap": Some("round"),
                    "stroke-linejoin": Some("round"),
                    path { "d": Some("M15 3h6v6") }
                    path { "d": Some("M10 14 21 3") }
                    path { "d": Some("M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6") }
                }
                span {
                    class: "ty-visually-hidden ty-link__hint",
                    " {new_tab_label}"
                }
            }
        },
    }
}

/// `heading_base` clamped to the spec range (2 to 6), then the depth applied, capped at 6.
fn heading_level(heading_base: f64, depth: usize) -> usize {
    let base = if heading_base.is_finite() {
        heading_base.floor().clamp(2.0, 6.0) as usize
    } else {
        3
    };
    (base + depth - 1).min(6)
}

/// A fence line (` ``` ` with an optional language tag) and its language;
/// outer `None` is "not a fence".
fn fence_language(line: &str) -> Option<Option<String>> {
    let rest = line.trim().strip_prefix("```")?;
    let language = rest.trim();
    if language
        .chars()
        .all(|c| matches!(c, 'A'..='Z' | 'a'..='z' | '0'..='9' | '_' | '+' | '#' | '.' | '-'))
    {
        Some((!language.is_empty()).then(|| language.to_string()))
    } else {
        None
    }
}

/// A heading line (`#{1,4}`, whitespace, content, optional closing hashes):
/// the depth and the content. The content is the shortest non-empty prefix
/// whose remainder is whitespace and hashes only (the lazy `.+?` of the
/// grammar's HEADING rule).
fn heading(line: &str) -> Option<(usize, String)> {
    let hashes = line.chars().take_while(|&c| c == '#').count();
    if hashes == 0 || hashes > 4 {
        return None;
    }
    let rest = &line[hashes..];
    if !rest.starts_with(char::is_whitespace) {
        return None;
    }
    let after: Vec<char> = rest.trim_start().chars().collect();
    for end in 1..=after.len() {
        if trailer_matches(&after[end..]) {
            return Some((hashes, after[..end].iter().collect()));
        }
    }
    None
}

/// The `\s*#*\s*$` trailer of the HEADING rule.
fn trailer_matches(chars: &[char]) -> bool {
    let mut i = 0;
    while i < chars.len() && chars[i].is_whitespace() {
        i += 1;
    }
    while i < chars.len() && chars[i] == '#' {
        i += 1;
    }
    while i < chars.len() && chars[i].is_whitespace() {
        i += 1;
    }
    i == chars.len()
}

/// A bullet item line (`- ` or `* `, leading whitespace allowed): the item text.
fn bullet(line: &str) -> Option<String> {
    let rest = line
        .trim_start()
        .strip_prefix('-')
        .or_else(|| line.trim_start().strip_prefix('*'))?;
    if !rest.starts_with(char::is_whitespace) {
        return None;
    }
    Some(rest.trim_start().to_string())
}

/// A numbered item line (`1. ` or `1) `, leading whitespace allowed): the item text.
fn numbered(line: &str) -> Option<String> {
    let trimmed = line.trim_start();
    let digits = trimmed.chars().take_while(|c| c.is_ascii_digit()).count();
    if digits == 0 {
        return None;
    }
    let rest = trimmed[digits..]
        .strip_prefix('.')
        .or_else(|| trimmed[digits..].strip_prefix(')'))?;
    if !rest.starts_with(char::is_whitespace) {
        return None;
    }
    Some(rest.trim_start().to_string())
}

/// Splits the source into blocks. An unclosed fence takes the rest of the input as code.
fn read_blocks(source: &str) -> Vec<Block> {
    let normalized = source.replace("\r\n", "\n").replace('\r', "\n");
    let lines: Vec<&str> = normalized.split('\n').collect();
    let mut blocks: Vec<Block> = Vec::new();
    let mut paragraph: Vec<String> = Vec::new();
    let mut list: Option<(bool, Vec<String>)> = None;

    let mut n = 0;
    while n < lines.len() {
        let line = lines[n];
        if let Some(language) = fence_language(line) {
            close_paragraph(&mut blocks, &mut paragraph);
            close_list(&mut blocks, &mut list);
            let mut body: Vec<&str> = Vec::new();
            n += 1;
            while n < lines.len() && fence_language(lines[n]).is_none() {
                body.push(lines[n]);
                n += 1;
            }
            blocks.push(Block::Code {
                language,
                value: body.join("\n"),
            });
            n += 1;
            continue;
        }
        if line.trim().is_empty() {
            close_paragraph(&mut blocks, &mut paragraph);
            close_list(&mut blocks, &mut list);
            n += 1;
            continue;
        }
        if let Some((depth, content)) = heading(line) {
            close_paragraph(&mut blocks, &mut paragraph);
            close_list(&mut blocks, &mut list);
            blocks.push(Block::Heading {
                depth,
                content: read_inline(&content),
            });
            n += 1;
            continue;
        }
        let bullet_item = bullet(line);
        let numbered_item = if bullet_item.is_none() { numbered(line) } else { None };
        if bullet_item.is_some() || numbered_item.is_some() {
            close_paragraph(&mut blocks, &mut paragraph);
            let ordered = numbered_item.is_some();
            if list.as_ref().is_some_and(|(list_ordered, _)| *list_ordered != ordered) {
                close_list(&mut blocks, &mut list);
            }
            let item = bullet_item.or(numbered_item).unwrap_or_default();
            list.get_or_insert_with(|| (ordered, Vec::new())).1.push(item);
            n += 1;
            continue;
        }
        close_list(&mut blocks, &mut list);
        paragraph.push(line.trim().to_string());
        n += 1;
    }
    close_paragraph(&mut blocks, &mut paragraph);
    close_list(&mut blocks, &mut list);
    blocks
}

fn close_paragraph(blocks: &mut Vec<Block>, paragraph: &mut Vec<String>) {
    if !paragraph.is_empty() {
        blocks.push(Block::Paragraph(read_inline(&paragraph.join(" "))));
        paragraph.clear();
    }
}

fn close_list(blocks: &mut Vec<Block>, list: &mut Option<(bool, Vec<String>)>) {
    if let Some((ordered, items)) = list.take() {
        blocks.push(Block::List {
            ordered,
            items: items.iter().map(|item| read_inline(item)).collect(),
        });
    }
}

/// Inline scanner: code spans first (their content is literal), then emphasis and links.
fn read_inline(source: &str) -> Vec<Inline> {
    let chars: Vec<char> = source.chars().collect();
    let mut out: Vec<Inline> = Vec::new();
    let mut text = String::new();
    let mut i = 0;
    while i < chars.len() {
        let ch = chars[i];

        if ch == '`' {
            if let Some(end) = find_char(&chars, '`', i + 1) {
                flush(&mut out, &mut text);
                out.push(Inline::Code(chars[i + 1..end].iter().collect()));
                i = end + 1;
                continue;
            }
        }

        if ch == '*' && chars.get(i + 1) == Some(&'*') {
            if let Some(end) = find_pair(&chars, '*', i + 2) {
                if end > i + 2 {
                    flush(&mut out, &mut text);
                    let inner: String = chars[i + 2..end].iter().collect();
                    out.push(Inline::Strong(read_inline(&inner)));
                    i = end + 2;
                    continue;
                }
            }
        }

        if (ch == '*' || ch == '_') && chars.get(i + 1) != Some(&ch) && chars.get(i + 1) != Some(&' ') {
            if let Some(end) = find_char(&chars, ch, i + 1) {
                if end > i + 1 && chars[end - 1] != ' ' {
                    flush(&mut out, &mut text);
                    let inner: String = chars[i + 1..end].iter().collect();
                    out.push(Inline::Em(read_inline(&inner)));
                    i = end + 1;
                    continue;
                }
            }
        }

        if ch == '[' {
            if let Some((whole, label, href)) = link_match(&chars[i..]) {
                flush(&mut out, &mut text);
                if is_safe_href(&href) {
                    out.push(Inline::Link {
                        href,
                        children: read_inline(&label),
                    });
                } else {
                    out.push(Inline::Text(chars[i..i + whole].iter().collect()));
                }
                i += whole;
                continue;
            }
        }

        text.push(ch);
        i += 1;
    }
    flush(&mut out, &mut text);
    out
}

fn flush(out: &mut Vec<Inline>, text: &mut String) {
    if !text.is_empty() {
        out.push(Inline::Text(std::mem::take(text)));
    }
}

/// `source.indexOf(ch, from)`.
fn find_char(chars: &[char], ch: char, from: usize) -> Option<usize> {
    (from..chars.len()).find(|&i| chars[i] == ch)
}

/// `source.indexOf(ch + ch, from)`.
fn find_pair(chars: &[char], ch: char, from: usize) -> Option<usize> {
    (from..chars.len().saturating_sub(1)).find(|&i| chars[i] == ch && chars[i + 1] == ch)
}

/// The grammar's link rule (`[label](href)` at the start of `rest`): the
/// whole match's length in chars, the label and the href.
fn link_match(rest: &[char]) -> Option<(usize, String, String)> {
    if rest.first() != Some(&'[') {
        return None;
    }
    let close = 1 + rest[1..].iter().position(|&c| c == ']')?;
    if close == 1 || rest.get(close + 1) != Some(&'(') {
        return None;
    }
    let label: String = rest[1..close].iter().collect();
    let href_start = close + 2;
    let mut end = href_start;
    while end < rest.len() && rest[end] != ')' && !rest[end].is_whitespace() {
        end += 1;
    }
    if end == href_start || rest.get(end) != Some(&')') {
        return None;
    }
    let href: String = rest[href_start..end].iter().collect();
    Some((end + 1, label, href))
}

/// Only absolute http and https addresses become links.
fn is_safe_href(raw: &str) -> bool {
    let trimmed = raw.trim();
    let lower = trimmed.to_ascii_lowercase();
    let Some(rest) = lower
        .strip_prefix("http://")
        .or_else(|| lower.strip_prefix("https://"))
    else {
        return false;
    };
    // What `new URL(raw)` adds over the prefix check: a non-empty host
    // before any path, query or hash, without the characters a URL parser
    // rejects in one.
    let host = rest.split(['/', '?', '#']).next().unwrap_or_default();
    !host.is_empty()
        && !host
            .chars()
            .any(|c| c.is_control() || matches!(c, '<' | '>' | '[' | '\\' | ']' | '^' | '|'))
}

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    pub fn label_overflowing_code_blocks(
        _root: Signal<Option<Rc<MountedData>>>,
        _text: Signal<String>,
        _code_block_label: Signal<String>,
        _code_block_language_label: Signal<String>,
    ) {
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::JsCast;

    /// A code block that scrolls is a focusable region with an accessible
    /// name; one that fits stays passive. A measurement, so it can only run
    /// against the live DOM — the element did it after building the subtree,
    /// so the port does it from an effect after every render whose source or
    /// labels moved. The attributes are cleared first, as the element's
    /// re-render rebuilt the nodes.
    pub fn label_overflowing_code_blocks(
        root: Signal<Option<Rc<MountedData>>>,
        text: Signal<String>,
        code_block_label: Signal<String>,
        code_block_language_label: Signal<String>,
    ) {
        use_effect(move || {
            let _ = text();
            let block_label = code_block_label();
            let language_label = code_block_language_label();
            let Some(element) = root().and_then(|mounted| mounted.downcast::<web_sys::Element>().cloned()) else {
                return;
            };
            let Ok(pres) = element.query_selector_all("pre.ty-markdown__pre") else {
                return;
            };
            for index in 0..pres.length() {
                let Some(pre) = pres
                    .item(index)
                    .and_then(|node| node.dyn_into::<web_sys::Element>().ok())
                else {
                    continue;
                };
                let _ = pre.remove_attribute("tabindex");
                let _ = pre.remove_attribute("role");
                let _ = pre.remove_attribute("aria-label");
                if pre.scroll_width() <= pre.client_width() {
                    continue;
                }
                let label = match pre.get_attribute("data-language") {
                    Some(language) => language_label.replace("{language}", &language),
                    None => block_label.clone(),
                };
                let _ = pre.set_attribute("tabindex", "0");
                let _ = pre.set_attribute("role", "region");
                let _ = pre.set_attribute("aria-label", &label);
            }
        });
    }
}
