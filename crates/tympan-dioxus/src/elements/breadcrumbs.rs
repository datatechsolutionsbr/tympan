//! Native port of `<ty-breadcrumbs>`: the labelled navigation landmark with
//! the trail's ordered list and the compact bar, as in the custom element.
//! What the element composed in script the component renders from props:
//! the `items` JSON becomes the trail (a subtle link per ancestor, the
//! current page as static text marked `aria-current="page"`, decorative
//! chevrons between entries, the middle collapsed into a native `<details>`
//! overflow menu past `maxVisible`) and the compact bar's back link (to the
//! parent, or to `rootHref` with one item, named from the `backLabel`
//! template) with the current label as the centred title. `mode="auto"`
//! resolves live against the 640 px breakpoint: the resolved mode lands on
//! `data-mode` and the unused container is `hidden` (a signal fed by a
//! `matchMedia` listener; unresolved on the server, where both containers
//! render empty with the raw `data-mode`, as the element did before its
//! first composition). Activating a link calls `on_navigate` with the href
//! and prevents the native navigation — the cancelable `ty-navigate` of the
//! element, where providing a handler is the host preventing the default;
//! without a handler the native anchor navigates.

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// `auto` shows the trail at 640 px and above, the compact bar below; the element resolves it live.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum BreadcrumbsMode {
    Trail,
    Compact,
    #[default]
    Auto,
}

impl BreadcrumbsMode {
    pub const ALL: [BreadcrumbsMode; 3] = [BreadcrumbsMode::Trail, BreadcrumbsMode::Compact, BreadcrumbsMode::Auto];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            BreadcrumbsMode::Trail => "trail",
            BreadcrumbsMode::Compact => "compact",
            BreadcrumbsMode::Auto => "auto",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<BreadcrumbsMode> {
        BreadcrumbsMode::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// A trail, overflow or back link was activated; `href` is its destination. Cancelable: a host with a client-side router calls `preventDefault()` and navigates through its adapter; uncanceled, the native anchor navigates.
#[derive(Clone, Debug, PartialEq)]
pub struct BreadcrumbsNavigate {
    pub href: String,
}

/// One `{ "label": string, "href": string }` entry of the `items` JSON.
#[derive(Clone, Debug, PartialEq)]
struct BreadcrumbItem {
    label: String,
    href: String,
}

/// A trail position: one item, or the collapsed middle levels.
#[derive(Clone, Copy, Debug, PartialEq)]
enum TrailEntry {
    Item(usize),
    Overflow { start: usize, end: usize },
}

/// The trail entries with the middle collapsed into one overflow (the
/// element's `visibleEntries`): past `maxVisible`, the first and the last
/// `maxVisible - 1` stay visible.
fn visible_entries(len: usize, max_visible: Option<f64>) -> Vec<TrailEntry> {
    let max = max_visible.unwrap_or(0.0);
    if max.is_nan() || max < 2.0 || (len as f64) <= max {
        return (0..len).map(TrailEntry::Item).collect();
    }
    let tail_start = (len as f64 - (max - 1.0)).max(0.0) as usize;
    let mut entries = Vec::with_capacity(len - tail_start + 2);
    entries.push(TrailEntry::Item(0));
    entries.push(TrailEntry::Overflow { start: 1, end: tail_start });
    entries.extend((tail_start..len).map(TrailEntry::Item));
    entries
}

/// Parses the `items` JSON: an array of objects; entries without string
/// `label` and `href` are skipped, malformed JSON is an error (the element
/// warns and renders an empty trail).
fn parse_items(raw: &str) -> Result<Vec<BreadcrumbItem>, ()> {
    let mut parser = JsonParser { raw, pos: 0 };
    let Json::Array(values) = parser.value()? else { return Err(()) };
    parser.whitespace();
    if parser.pos != raw.len() {
        return Err(());
    }
    Ok(values
        .into_iter()
        .filter_map(|value| {
            let Json::Object(fields) = value else { return None };
            let string = |name: &str| {
                fields.iter().find_map(|(key, value)| {
                    if key == name {
                        if let Json::String(text) = value {
                            return Some(text.clone());
                        }
                    }
                    None
                })
            };
            match (string("label"), string("href")) {
                (Some(label), Some(href)) => Some(BreadcrumbItem { label, href }),
                _ => None,
            }
        })
        .collect())
}

enum Json {
    Array(Vec<Json>),
    Object(Vec<(String, Json)>),
    String(String),
    Other,
}

/// A minimal JSON parser: just enough to read the `items` attribute with
/// the same strictness as `JSON.parse`.
struct JsonParser<'a> {
    raw: &'a str,
    pos: usize,
}

impl JsonParser<'_> {
    fn whitespace(&mut self) {
        while self
            .raw
            .as_bytes()
            .get(self.pos)
            .is_some_and(|b| b" \t\n\r".contains(b))
        {
            self.pos += 1;
        }
    }

    fn literal(&mut self, text: &str) -> Result<(), ()> {
        if self.raw[self.pos..].starts_with(text) {
            self.pos += text.len();
            Ok(())
        } else {
            Err(())
        }
    }

    fn value(&mut self) -> Result<Json, ()> {
        self.whitespace();
        match self.raw.as_bytes().get(self.pos) {
            Some(b'[') => {
                self.pos += 1;
                self.whitespace();
                let mut values = Vec::new();
                if self.raw.as_bytes().get(self.pos) == Some(&b']') {
                    self.pos += 1;
                    return Ok(Json::Array(values));
                }
                loop {
                    values.push(self.value()?);
                    self.whitespace();
                    match self.raw.as_bytes().get(self.pos) {
                        Some(b',') => self.pos += 1,
                        Some(b']') => {
                            self.pos += 1;
                            return Ok(Json::Array(values));
                        }
                        _ => return Err(()),
                    }
                }
            }
            Some(b'{') => {
                self.pos += 1;
                self.whitespace();
                let mut fields = Vec::new();
                if self.raw.as_bytes().get(self.pos) == Some(&b'}') {
                    self.pos += 1;
                    return Ok(Json::Object(fields));
                }
                loop {
                    self.whitespace();
                    let key = self.string()?;
                    self.whitespace();
                    if self.raw.as_bytes().get(self.pos) != Some(&b':') {
                        return Err(());
                    }
                    self.pos += 1;
                    let value = self.value()?;
                    fields.push((key, value));
                    self.whitespace();
                    match self.raw.as_bytes().get(self.pos) {
                        Some(b',') => self.pos += 1,
                        Some(b'}') => {
                            self.pos += 1;
                            return Ok(Json::Object(fields));
                        }
                        _ => return Err(()),
                    }
                }
            }
            Some(b'"') => Ok(Json::String(self.string()?)),
            Some(b't') => {
                self.literal("true")?;
                Ok(Json::Other)
            }
            Some(b'f') => {
                self.literal("false")?;
                Ok(Json::Other)
            }
            Some(b'n') => {
                self.literal("null")?;
                Ok(Json::Other)
            }
            Some(b) if *b == b'-' || b.is_ascii_digit() => {
                let start = self.pos;
                while self
                    .raw
                    .as_bytes()
                    .get(self.pos)
                    .is_some_and(|b| b.is_ascii_digit() || b"+-.eE".contains(b))
                {
                    self.pos += 1;
                }
                if self.raw[start..self.pos].parse::<f64>().is_ok() {
                    Ok(Json::Other)
                } else {
                    Err(())
                }
            }
            _ => Err(()),
        }
    }

    fn string(&mut self) -> Result<String, ()> {
        if self.raw.as_bytes().get(self.pos) != Some(&b'"') {
            return Err(());
        }
        self.pos += 1;
        let mut out = String::new();
        let mut chunk = self.pos;
        loop {
            let Some(&b) = self.raw.as_bytes().get(self.pos) else { return Err(()) };
            match b {
                b'"' => {
                    out.push_str(&self.raw[chunk..self.pos]);
                    self.pos += 1;
                    return Ok(out);
                }
                b'\\' => {
                    out.push_str(&self.raw[chunk..self.pos]);
                    self.pos += 1;
                    let Some(&escape) = self.raw.as_bytes().get(self.pos) else { return Err(()) };
                    self.pos += 1;
                    match escape {
                        b'"' => out.push('"'),
                        b'\\' => out.push('\\'),
                        b'/' => out.push('/'),
                        b'b' => out.push('\u{8}'),
                        b'f' => out.push('\u{c}'),
                        b'n' => out.push('\n'),
                        b'r' => out.push('\r'),
                        b't' => out.push('\t'),
                        b'u' => {
                            let high = self.hex4()?;
                            let code = if (0xD800..0xDC00).contains(&high) {
                                if self.raw[self.pos..].starts_with("\\u") {
                                    self.pos += 2;
                                    let low = self.hex4()?;
                                    if !(0xDC00..0xE000).contains(&low) {
                                        return Err(());
                                    }
                                    0x10000 + ((high - 0xD800) << 10) + (low - 0xDC00)
                                } else {
                                    return Err(());
                                }
                            } else {
                                high
                            };
                            out.push(char::from_u32(code).ok_or(())?);
                        }
                        _ => return Err(()),
                    }
                    chunk = self.pos;
                }
                0x00..=0x1F => return Err(()),
                _ => self.pos += 1,
            }
        }
    }

    fn hex4(&mut self) -> Result<u32, ()> {
        let end = self.pos + 4;
        if end > self.raw.len() {
            return Err(());
        }
        let value = u32::from_str_radix(&self.raw[self.pos..end], 16).map_err(|_| ())?;
        self.pos = end;
        Ok(value)
    }
}

/// Shows where the current page sits in the hierarchy and goes up one or more levels. A trail at 640 px and above, a compact back link (with optional centred title and trailing actions) below. The last item is the current page — static text marked `aria-current="page"`, never a link; separators are decorative. Long labels truncate with an ellipsis, the full label kept in `title` and as the accessible name. Activating a link emits a cancelable `ty-navigate`: a host with a client-side router prevents the default and navigates through its adapter.
#[component]
pub fn TyBreadcrumbs(
    /// JSON array of `{ "label": string, "href": string }`, ancestors first and the current page last. Composed by the element on upgrade (the theme palette's `theme-labels` precedent).
    #[props(into)]
    items: Option<String>,
    /// Accessible name of the navigation landmark (the I18n adapter's default); translate through this attribute.
    #[props(into, default = String::from("Breadcrumb"))]
    label: String,
    /// `auto` shows the trail at 640 px and above, the compact bar below; the element resolves it live.
    #[props(default)]
    mode: BreadcrumbsMode,
    /// Parent href of the compact back link when there is only one item.
    #[props(into)]
    root_href: Option<String>,
    /// Parent label of the compact back link when there is only one item (with `rootHref`).
    #[props(into)]
    root_label: Option<String>,
    /// Collapses middle items into an overflow menu when the trail exceeds this many entries (the first and the last `maxVisible - 1` stay visible).
    max_visible: Option<f64>,
    /// Accessible-name template of the compact back link; `{parent}` is filled with the parent's label.
    #[props(into, default = String::from("Back to {parent}"))]
    back_label: String,
    /// Accessible name of the overflow menu's toggle; translate through this attribute.
    #[props(into, default = String::from("Show hidden levels"))]
    overflow_label: String,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// Replaces the centred title of the compact bar (the current page's label when empty).
    center: Option<Element>,
    /// Trailing actions of the compact bar (narrow screens use it as a top bar).
    actions: Option<Element>,
    /// A trail, overflow or back link was activated; `href` is its destination. Cancelable: a host with a client-side router calls `preventDefault()` and navigates through its adapter; uncanceled, the native anchor navigates.
    on_navigate: Option<EventHandler<BreadcrumbsNavigate>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_center = center.is_some();
    let slot_actions = actions.is_some();

    let trail = match items.as_deref().filter(|v| !v.is_empty()) {
        Some(raw) => parse_items(raw).unwrap_or_else(|()| {
            wasm::warn_invalid_items();
            Vec::new()
        }),
        None => Vec::new(),
    };
    let entries = visible_entries(trail.len(), max_visible);

    // `auto` resolves against the small breakpoint (§2.8); `None` until the
    // media query answers, so the server renders the raw anatomy — both
    // containers, no `hidden`, the raw `data-mode` — as the element did
    // before its first composition.
    let media_compact = use_signal(|| None::<bool>);
    wasm::resolve_auto(media_compact);
    let compact = match mode {
        BreadcrumbsMode::Trail => Some(false),
        BreadcrumbsMode::Compact => Some(true),
        BreadcrumbsMode::Auto => media_compact(),
    };

    // The compact bar's back link: the parent, or `rootHref` with one item.
    let back_parent = if trail.len() > 1 {
        let parent = &trail[trail.len() - 2];
        Some((parent.href.clone(), parent.label.clone()))
    } else {
        root_href
            .as_deref()
            .filter(|v| !v.is_empty())
            .map(|href| (href.to_string(), root_label.clone().unwrap_or_default()))
    };

    // A composed link's activation goes through the host's router adapter
    // (the element's cancelable `ty-navigate`): with a handler the host
    // navigates and the native anchor is prevented; without one the native
    // anchor navigates.
    let navigate = move |href: String| {
        move |event: MouseEvent| {
            if let Some(handler) = on_navigate {
                handler.call(BreadcrumbsNavigate { href: href.clone() });
                event.prevent_default();
            }
        }
    };

    rsx! {
        ty-breadcrumbs {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "items": items.as_deref().filter(|v| !v.is_empty()),
            "label": (!label.is_empty()).then_some(label.as_str()),
            "mode": Some(mode.as_str()),
            "root-href": root_href.as_deref().filter(|v| !v.is_empty()),
            "root-label": root_label.as_deref().filter(|v| !v.is_empty()),
            "max-visible": max_visible.map(|v| v.to_string()),
            "back-label": (!back_label.is_empty()).then_some(back_label.as_str()),
            "overflow-label": (!overflow_label.is_empty()).then_some(overflow_label.as_str()),
            nav {
                class: "ty-breadcrumbs",
                "aria-label": (!label.is_empty()).then_some(label.as_str()),
                "data-mode": compact.map(|c| if c { "compact" } else { "trail" }).unwrap_or(mode.as_str()),
                if !(mode == BreadcrumbsMode::Compact) {
                    ol {
                        class: "ty-breadcrumbs__list",
                        "hidden": (compact == Some(true)).then_some(""),
                        if compact == Some(false) {
                            for (position, entry) in entries.iter().enumerate() {
                                li {
                                    key: "{position}",
                                    class: "ty-breadcrumbs__item",
                                    {match entry {
                                        TrailEntry::Item(index) if *index + 1 == trail.len() => rsx! {
                                            span {
                                                class: "ty-breadcrumbs__current",
                                                "aria-current": Some("page"),
                                                "title": Some(trail[*index].label.clone()),
                                                {trail[*index].label.clone()}
                                            }
                                        },
                                        TrailEntry::Item(index) => rsx! {
                                            a {
                                                class: "ty-link ty-breadcrumbs__link",
                                                href: trail[*index].href.clone(),
                                                "data-emphasis": Some("subtle"),
                                                onclick: navigate(trail[*index].href.clone()),
                                                span {
                                                    class: "ty-breadcrumbs__label",
                                                    "title": Some(trail[*index].label.clone()),
                                                    {trail[*index].label.clone()}
                                                }
                                            }
                                        },
                                        TrailEntry::Overflow { start, end } => rsx! {
                                            details {
                                                class: "ty-breadcrumbs__overflow",
                                                summary {
                                                    class: "ty-breadcrumbs__overflow-toggle",
                                                    "aria-label": Some(overflow_label.clone()),
                                                    svg {
                                                        class: "ty-icon",
                                                        "viewBox": Some("0 0 24 24"),
                                                        "fill": Some("none"),
                                                        "stroke": Some("currentColor"),
                                                        "stroke-width": Some("2"),
                                                        "stroke-linecap": Some("round"),
                                                        "stroke-linejoin": Some("round"),
                                                        "aria-hidden": Some("true"),
                                                        "focusable": Some("false"),
                                                        circle {
                                                            "cx": Some("12"),
                                                            "cy": Some("12"),
                                                            "r": Some("1"),
                                                        }
                                                        circle {
                                                            "cx": Some("19"),
                                                            "cy": Some("12"),
                                                            "r": Some("1"),
                                                        }
                                                        circle {
                                                            "cx": Some("5"),
                                                            "cy": Some("12"),
                                                            "r": Some("1"),
                                                        }
                                                    }
                                                }
                                                ul {
                                                    class: "ty-breadcrumbs__overflow-list",
                                                    for item in trail[*start..*end].iter() {
                                                        li {
                                                            key: "{item.href}",
                                                            class: "ty-breadcrumbs__overflow-item",
                                                            a {
                                                                class: "ty-link",
                                                                href: item.href.clone(),
                                                                "data-emphasis": Some("subtle"),
                                                                "title": Some(item.label.clone()),
                                                                onclick: navigate(item.href.clone()),
                                                                {item.label.clone()}
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                    }}
                                    if position + 1 < entries.len() {
                                        svg {
                                            class: "ty-icon ty-mirror-rtl ty-breadcrumbs__separator",
                                            "viewBox": Some("0 0 24 24"),
                                            "fill": Some("none"),
                                            "stroke": Some("currentColor"),
                                            "stroke-width": Some("2"),
                                            "stroke-linecap": Some("round"),
                                            "stroke-linejoin": Some("round"),
                                            "aria-hidden": Some("true"),
                                            "focusable": Some("false"),
                                            path {
                                                "d": Some("m9 18 6-6-6-6"),
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if mode == BreadcrumbsMode::Compact || mode == BreadcrumbsMode::Auto {
                    div {
                        class: "ty-breadcrumbs__bar",
                        "hidden": (compact == Some(false)).then_some(""),
                        div {
                            class: "ty-breadcrumbs__back",
                            if compact == Some(true) {
                                if let Some((href, name)) = back_parent.clone() {
                                    a {
                                        class: "ty-link",
                                        href: href.clone(),
                                        "data-emphasis": Some("subtle"),
                                        "data-standalone": Some(""),
                                        "aria-label": Some(back_label.replace("{parent}", &name)),
                                        onclick: navigate(href.clone()),
                                        svg {
                                            class: "ty-icon ty-mirror-rtl",
                                            "viewBox": Some("0 0 24 24"),
                                            "fill": Some("none"),
                                            "stroke": Some("currentColor"),
                                            "stroke-width": Some("2"),
                                            "stroke-linecap": Some("round"),
                                            "stroke-linejoin": Some("round"),
                                            "aria-hidden": Some("true"),
                                            "focusable": Some("false"),
                                            path {
                                                "d": Some("m12 19-7-7 7-7"),
                                            }
                                            path {
                                                "d": Some("M19 12H5"),
                                            }
                                        }
                                        span {
                                            class: "ty-breadcrumbs__back-label",
                                            {name.clone()}
                                        }
                                    }
                                }
                            }
                        }
                        if slot_center || slot_actions {
                            div {
                                class: "ty-breadcrumbs__center",
                                if slot_center {
                                    {center.clone()}
                                }
                                if !(slot_center) {
                                    span {
                                        class: "ty-breadcrumbs__title",
                                        "aria-current": Some("page"),
                                        if compact == Some(true) {
                                            {trail.last().map(|item| item.label.clone()).unwrap_or_default()}
                                        }
                                    }
                                }
                            }
                        }
                        if slot_actions {
                            div {
                                class: "ty-breadcrumbs__actions",
                                {actions.clone()}
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    use dioxus::prelude::*;

    pub fn resolve_auto(_media_compact: Signal<Option<bool>>) {}

    pub fn warn_invalid_items() {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    /// `auto` resolves against the 640 px breakpoint (§2.8): the answer
    /// lands in the signal once the media query answers and follows its
    /// changes, as the element's `matchMedia` listener re-composed.
    pub fn resolve_auto(mut media_compact: Signal<Option<bool>>) {
        struct Listener {
            target: web_sys::EventTarget,
            closure: Closure<dyn FnMut(web_sys::Event)>,
        }
        impl Drop for Listener {
            fn drop(&mut self) {
                let _ = self
                    .target
                    .remove_event_listener_with_callback("change", self.closure.as_ref().unchecked_ref());
            }
        }

        let mut listener = use_signal(|| None::<Rc<Listener>>);
        use_effect(move || {
            if listener.peek().is_some() {
                return;
            }
            let media = web_sys::window().and_then(|window| window.match_media("(min-width: 640px)").ok().flatten());
            let Some(media) = media else {
                // No media query, no compact bar: the element's `?? true`.
                media_compact.set(Some(false));
                return;
            };
            media_compact.set(Some(!media.matches()));
            let target: web_sys::EventTarget = media.clone().into();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                media_compact.set(Some(!media.matches()));
            });
            if target
                .add_event_listener_with_callback("change", closure.as_ref().unchecked_ref())
                .is_ok()
            {
                listener.set(Some(Rc::new(Listener { target, closure })));
            }
        });
    }

    /// Malformed `items` warns and renders an empty trail, as the element's
    /// `parseItems` did.
    pub fn warn_invalid_items() {
        web_sys::console::warn_1(&"ty-breadcrumbs: `items` is not a JSON array of { label, href }.".into());
    }
}
