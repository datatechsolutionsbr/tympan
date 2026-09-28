//! Native port of `<ty-tabs>`: the APG tabs pattern. Where the custom
//! element composed a `<button role="tab">` per entry of the `tabs` JSON
//! prop into the list and kept it in step with a MutationObserver, the port
//! renders the buttons straight from the parsed prop — repetition is
//! declarative here. On top it keeps the element's behaviour: selection
//! (uncontrolled from `default-selected-key`, else the first enabled tab;
//! the parent may move `selected-key` and the mirror re-syncs), one tab stop
//! (roving tabindex on the focused, else the selected tab), arrow keys along
//! the `orientation` axis wrapping and skipping disabled tabs, Home and End
//! jumps, Left/Right following the reading direction, and `activation`
//! deciding whether moving focus also selects. What still needs the live DOM
//! — focusing and scrolling a tab, the reading direction, and wiring the
//! panels (the host's own children, keyed by `data-panel`: role, id,
//! `aria-labelledby`/`aria-controls`, `hidden`/`data-inert` so only the
//! selected panel shows) — lives in `mod wasm` behind effects, with a no-op
//! twin for SSR.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Layout of the list and the arrow-key axis: Left/Right (following the reading direction), or Up/Down when vertical.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum TabsOrientation {
    #[default]
    Horizontal,
    Vertical,
}

impl TabsOrientation {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            TabsOrientation::Horizontal => "horizontal",
            TabsOrientation::Vertical => "vertical",
        }
    }
}

/// Automatic selects on focus; manual needs Enter or Space on the focused tab.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum TabsActivation {
    #[default]
    Automatic,
    Manual,
}

impl TabsActivation {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            TabsActivation::Automatic => "automatic",
            TabsActivation::Manual => "manual",
        }
    }
}

/// A different tab was selected (a click, or the keyboard per `activation`). Uncontrolled, the element has already applied it; controlled (`selected-key`), the host flips the attribute.
#[derive(Clone, Debug, PartialEq)]
pub struct TabsSelectionChange {
    pub key: String,
}

/// One entry of the `tabs` JSON prop.
#[derive(Clone, Debug, PartialEq)]
struct TabItem {
    id: String,
    label: String,
    count: Option<f64>,
    disabled: bool,
}

/// Sibling views of one object, one panel at a time (the APG tabs pattern). The tab list is one tab stop: the arrow keys move along the `orientation` axis, wrapping and skipping disabled tabs, Home and End jump, and Left/Right follow the reading direction. `activation` decides whether moving focus also selects. Selection is controlled with `selected-key` or uncontrolled from `default-selected-key` (the first enabled tab when neither is set); a different selection is reported with `ty-selection-change`.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyTabs(
    /// Controlled selection: the selected tab's id. The element asks for a change with `ty-selection-change`; the host flips the attribute.
    #[props(into)]
    selected_key: Option<String>,
    /// Initial selection of an uncontrolled list; the first enabled tab when unset.
    #[props(into)]
    default_selected_key: Option<String>,
    /// Layout of the list and the arrow-key axis: Left/Right (following the reading direction), or Up/Down when vertical.
    #[props(default)]
    orientation: TabsOrientation,
    /// Automatic selects on focus; manual needs Enter or Space on the focused tab.
    #[props(default)]
    activation: TabsActivation,
    /// Accessible name of the tab list (required).
    #[props(into)]
    label: Option<String>,
    /// JSON array of the tabs: [{ "id", "label", "count"?, "disabled"? }]. The count follows the label and joins the accessible name; a disabled tab cannot be selected and the arrow keys skip it. (The React component's decorative icon has no attribute form.)
    #[props(into)]
    tabs: Option<String>,
    /// Keep inactive panels in the DOM (hidden) to preserve their state. The element always keeps them — their nodes belong to the host — so the attribute only tells a wrapper it may unmount.
    #[props(default)]
    keep_mounted: bool,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The panels: one element per tab, keyed by `data-panel` (the tab's id). The element wires the role, id, `aria-labelledby` and visibility; only the selected panel shows.
    children: Element,
    /// A different tab was selected (a click, or the keyboard per `activation`). Uncontrolled, the element has already applied it; controlled (`selected-key`), the host flips the attribute.
    on_selection_change: Option<EventHandler<TabsSelectionChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let items = parse_tabs(tabs.as_deref());

    // Uncontrolled with a mirrored prop: the parent may move `selected-key`,
    // otherwise clicks and the keyboard drive the state. The element's
    // strictly controlled mode collapses into this: applying the selection
    // locally and reporting it is the Dioxus idiom (as in `checkbox.rs`).
    let mut state = use_signal(|| None::<String>);
    let mut mirrored_selected = use_signal(|| selected_key.clone());
    if selected_key != *mirrored_selected.peek() {
        mirrored_selected.set(selected_key.clone());
        state.set(selected_key.clone());
    }

    // The element's reconcile: the state wins while it names a known tab,
    // then `default-selected-key`, then the first enabled tab.
    let selected = state()
        .filter(|key| items.iter().any(|item| &item.id == key))
        .or_else(|| {
            default_selected_key
                .clone()
                .filter(|key| items.iter().any(|item| &item.id == key))
        })
        .or_else(|| items.iter().find(|item| !item.disabled).map(|item| item.id.clone()));
    let mut resolved = use_signal(|| None::<String>);
    if *resolved.peek() != selected {
        resolved.set(selected.clone());
    }

    // Roving focus: the focused tab while the list has focus, else the
    // selected one; a disabled tab never takes the tab stop.
    let mut focused = use_signal(|| None::<String>);
    let roving = focused()
        .filter(|key| items.iter().any(|item| &item.id == key && !item.disabled))
        .or_else(|| selected.clone());

    // Select a tab the user activated; a no-op for the current or a disabled
    // tab, as the element's `#select`.
    let on_select = {
        let items = items.clone();
        let selected = selected.clone();
        move |key: String| {
            if items
                .iter()
                .find(|item| item.id == key)
                .is_none_or(|item| item.disabled)
            {
                return;
            }
            if selected.as_ref() == Some(&key) {
                return;
            }
            state.set(Some(key.clone()));
            if let Some(handler) = on_selection_change {
                handler.call(TabsSelectionChange { key });
            }
        }
    };

    let mut root = use_signal(|| None::<Rc<MountedData>>);
    let mut list = use_signal(|| None::<Rc<MountedData>>);
    wasm::wire_panels(root, resolved, instance.clone());

    rsx! {
        ty-tabs {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "selected-key": selected_key.as_deref().filter(|v| !v.is_empty()),
            "default-selected-key": default_selected_key.as_deref().filter(|v| !v.is_empty()),
            "orientation": Some(orientation.as_str()),
            "activation": Some(activation.as_str()),
            "label": label.as_deref().filter(|v| !v.is_empty()),
            "tabs": tabs.as_deref().filter(|v| !v.is_empty()),
            "keep-mounted": keep_mounted.then_some(""),
            div {
                class: "ty-tabs",
                "data-orientation": Some(orientation.as_str()),
                onmounted: move |event: MountedEvent| root.set(Some(event.data())),
                div {
                    class: "ty-tabs__list",
                    "role": Some("tablist"),
                    "aria-label": label.as_deref().filter(|v| !v.is_empty()),
                    "aria-orientation": Some(orientation.as_str()),
                    "data-orientation": Some(orientation.as_str()),
                    onmounted: move |event: MountedEvent| list.set(Some(event.data())),
                    // Leaving the list hands the tab stop back to the selected
                    // tab; when focus stays in the list, the next tab's focus
                    // event re-sets `focused` right after.
                    onfocusout: move |_| focused.set(None),
                    onkeydown: {
                        let items = items.clone();
                        let selected = selected.clone();
                        let mut on_select = on_select.clone();
                        move |event: KeyboardEvent| {
                            let vertical = orientation == TabsOrientation::Vertical;
                            let movement = match event.key() {
                                Key::ArrowRight if !vertical => Some(Move::By(if wasm::is_rtl(list) { -1 } else { 1 })),
                                Key::ArrowLeft if !vertical => Some(Move::By(if wasm::is_rtl(list) { 1 } else { -1 })),
                                Key::ArrowDown if vertical => Some(Move::By(1)),
                                Key::ArrowUp if vertical => Some(Move::By(-1)),
                                Key::Home => Some(Move::Home),
                                Key::End => Some(Move::End),
                                _ => None,
                            };
                            let Some(movement) = movement else { return };
                            event.prevent_default();
                            let enabled: Vec<&TabItem> = items.iter().filter(|item| !item.disabled).collect();
                            if enabled.is_empty() {
                                return;
                            }
                            let current = focused().or_else(|| selected.clone());
                            let index = enabled.iter().position(|item| Some(&item.id) == current.as_ref()).unwrap_or(0);
                            let next = match movement {
                                Move::Home => enabled[0],
                                Move::End => enabled[enabled.len() - 1],
                                Move::By(delta) => enabled[(index as isize + delta).rem_euclid(enabled.len() as isize) as usize],
                            };
                            let next = next.id.clone();
                            focused.set(Some(next.clone()));
                            // An overflowing list scrolls the tab into view
                            // instead of wrapping.
                            wasm::focus_tab(list, &next);
                            if activation == TabsActivation::Automatic {
                                on_select(next);
                            }
                        }
                    },
                    for item in &items {
                        button {
                            key: "{item.id}",
                            class: "ty-tabs__tab",
                            "type": "button",
                            "role": "tab",
                            "id": "{instance}-tab-{safe(&item.id)}",
                            "data-tab-key": "{item.id}",
                            "aria-selected": if selected.as_ref() == Some(&item.id) { "true" } else { "false" },
                            "data-selected": (selected.as_ref() == Some(&item.id)).then_some(""),
                            "data-disabled": item.disabled.then_some(""),
                            disabled: item.disabled,
                            tabindex: if roving.as_ref() == Some(&item.id) && !item.disabled { "0" } else { "-1" },
                            onclick: {
                                let key = item.id.clone();
                                let mut on_select = on_select.clone();
                                move |_| on_select(key.clone())
                            },
                            onfocus: {
                                let key = item.id.clone();
                                move |_| focused.set(Some(key.clone()))
                            },
                            span {
                                class: "ty-tabs__label",
                                "{item.label}"
                            }
                            if let Some(count) = item.count {
                                " "
                                span {
                                    class: "ty-tabs__count",
                                    "{count_text(count)}"
                                }
                            }
                        }
                    }
                }
                {children.clone()}
            }
        }
    }
}

/// A key made safe for the id of an aria reference (a space would split an idrefs list).
fn safe(key: &str) -> String {
    key.chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '_' || c == '-' {
                c
            } else {
                '-'
            }
        })
        .collect()
}

/// The count as the element rendered it (`String(count)`): integers without
/// a fraction, anything else in the shortest form.
fn count_text(count: f64) -> String {
    if count.fract() == 0.0 && count.abs() < 1e15 {
        format!("{}", count as i64)
    } else {
        format!("{count}")
    }
}

/// The `tabs` prop: a JSON array of `{ id, label, count?, disabled? }`,
/// parsed by hand (the port adds no dependency); invalid entries are
/// skipped and an invalid document warns and yields no tabs, as the element.
fn parse_tabs(raw: Option<&str>) -> Vec<TabItem> {
    let Some(raw) = raw.filter(|value| !value.is_empty()) else {
        return Vec::new();
    };
    let Some(Json::Array(entries)) = JsonParser::new(raw).finish() else {
        #[cfg(target_arch = "wasm32")]
        web_sys::console::warn_1(&wasm_bindgen::JsValue::from_str(
            "ty-tabs: `tabs` must be a JSON array of { id, label, count?, disabled? }.",
        ));
        return Vec::new();
    };
    entries.iter().filter_map(tab_item).collect()
}

fn tab_item(entry: &Json) -> Option<TabItem> {
    let Json::Object(fields) = entry else { return None };
    let field = |name: &str| {
        fields
            .iter()
            .find(|(key, _)| key == name)
            .map(|(_, value)| value)
    };
    let id = match field("id") {
        Some(Json::String(id)) if !id.is_empty() => id.clone(),
        _ => return None,
    };
    let label = match field("label") {
        Some(Json::String(label)) => label.clone(),
        _ => return None,
    };
    let count = match field("count") {
        Some(Json::Number(count)) => Some(*count),
        _ => None,
    };
    let disabled = matches!(field("disabled"), Some(Json::Bool(true)));
    Some(TabItem {
        id,
        label,
        count,
        disabled,
    })
}

/// A keyboard move along the list: Home/End jump, the arrows step.
enum Move {
    Home,
    End,
    By(isize),
}

/// Minimal JSON value: enough for the flat objects of the `tabs` prop.
enum Json {
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Array(Vec<Json>),
    Object(Vec<(String, Json)>),
}

struct JsonParser<'a> {
    source: &'a [u8],
    pos: usize,
}

impl<'a> JsonParser<'a> {
    fn new(source: &'a str) -> Self {
        Self {
            source: source.as_bytes(),
            pos: 0,
        }
    }

    fn finish(mut self) -> Option<Json> {
        let value = self.value()?;
        self.whitespace();
        (self.pos == self.source.len()).then_some(value)
    }

    fn whitespace(&mut self) {
        while matches!(self.source.get(self.pos), Some(b' ' | b'\t' | b'\n' | b'\r')) {
            self.pos += 1;
        }
    }

    fn peek(&self) -> Option<u8> {
        self.source.get(self.pos).copied()
    }

    fn value(&mut self) -> Option<Json> {
        self.whitespace();
        match self.peek()? {
            b'{' => self.object(),
            b'[' => self.array(),
            b'"' => self.string().map(Json::String),
            b't' => self.literal(b"true", Json::Bool(true)),
            b'f' => self.literal(b"false", Json::Bool(false)),
            b'n' => self.literal(b"null", Json::Null),
            _ => self.number(),
        }
    }

    fn literal(&mut self, word: &'static [u8], value: Json) -> Option<Json> {
        if self.source.get(self.pos..self.pos + word.len()) == Some(word) {
            self.pos += word.len();
            Some(value)
        } else {
            None
        }
    }

    fn number(&mut self) -> Option<Json> {
        let start = self.pos;
        if self.peek() == Some(b'-') {
            self.pos += 1;
        }
        while matches!(self.peek(), Some(b'0'..=b'9')) {
            self.pos += 1;
        }
        if self.peek() == Some(b'.') {
            self.pos += 1;
            while matches!(self.peek(), Some(b'0'..=b'9')) {
                self.pos += 1;
            }
        }
        if matches!(self.peek(), Some(b'e' | b'E')) {
            self.pos += 1;
            if matches!(self.peek(), Some(b'+' | b'-')) {
                self.pos += 1;
            }
            while matches!(self.peek(), Some(b'0'..=b'9')) {
                self.pos += 1;
            }
        }
        std::str::from_utf8(self.source.get(start..self.pos)?)
            .ok()?
            .parse::<f64>()
            .ok()
            .map(Json::Number)
    }

    fn string(&mut self) -> Option<String> {
        self.whitespace();
        if self.peek() != Some(b'"') {
            return None;
        }
        self.pos += 1;
        let mut out = String::new();
        loop {
            match self.peek()? {
                b'"' => {
                    self.pos += 1;
                    return Some(out);
                }
                b'\\' => {
                    self.pos += 1;
                    let escaped = self.peek()?;
                    self.pos += 1;
                    match escaped {
                        b'"' => out.push('"'),
                        b'\\' => out.push('\\'),
                        b'/' => out.push('/'),
                        b'b' => out.push('\u{8}'),
                        b'f' => out.push('\u{c}'),
                        b'n' => out.push('\n'),
                        b'r' => out.push('\r'),
                        b't' => out.push('\t'),
                        b'u' => {
                            let first = self.hex4()?;
                            let code = if (0xD800..0xDC00).contains(&first) {
                                if self.source.get(self.pos..self.pos + 2) != Some(b"\\u") {
                                    return None;
                                }
                                self.pos += 2;
                                let second = self.hex4()?;
                                if !(0xDC00..0xE000).contains(&second) {
                                    return None;
                                }
                                0x10000 + ((first - 0xD800) << 10) + (second - 0xDC00)
                            } else {
                                first
                            };
                            out.push(char::from_u32(code)?);
                        }
                        _ => return None,
                    }
                }
                _ => {
                    let rest = std::str::from_utf8(self.source.get(self.pos..)?).ok()?;
                    let c = rest.chars().next()?;
                    out.push(c);
                    self.pos += c.len_utf8();
                }
            }
        }
    }

    fn hex4(&mut self) -> Option<u32> {
        let hex = std::str::from_utf8(self.source.get(self.pos..self.pos + 4)?).ok()?;
        let code = u32::from_str_radix(hex, 16).ok()?;
        self.pos += 4;
        Some(code)
    }

    fn array(&mut self) -> Option<Json> {
        self.pos += 1;
        let mut items = Vec::new();
        self.whitespace();
        if self.peek() == Some(b']') {
            self.pos += 1;
            return Some(Json::Array(items));
        }
        loop {
            items.push(self.value()?);
            self.whitespace();
            match self.peek()? {
                b',' => self.pos += 1,
                b']' => {
                    self.pos += 1;
                    return Some(Json::Array(items));
                }
                _ => return None,
            }
        }
    }

    fn object(&mut self) -> Option<Json> {
        self.pos += 1;
        let mut fields = Vec::new();
        self.whitespace();
        if self.peek() == Some(b'}') {
            self.pos += 1;
            return Some(Json::Object(fields));
        }
        loop {
            let key = self.string()?;
            self.whitespace();
            if self.peek() != Some(b':') {
                return None;
            }
            self.pos += 1;
            let value = self.value()?;
            fields.push((key, value));
            self.whitespace();
            match self.peek()? {
                b',' => self.pos += 1,
                b'}' => {
                    self.pos += 1;
                    return Some(Json::Object(fields));
                }
                _ => return None,
            }
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    pub fn focus_tab(_list: Signal<Option<Rc<MountedData>>>, _key: &str) {}

    pub fn is_rtl(_list: Signal<Option<Rc<MountedData>>>) -> bool {
        false
    }

    pub fn wire_panels(
        _root: Signal<Option<Rc<MountedData>>>,
        _selected: Signal<Option<String>>,
        _instance: String,
    ) {
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    /// Move DOM focus to a tab (the roving tabindex already names it), as
    /// the element's `#focusTab`.
    pub fn focus_tab(list: Signal<Option<Rc<MountedData>>>, key: &str) {
        let Some(list) = element(list) else { return };
        let Some(tab) = find_tab(&list, key) else { return };
        let _ = tab.focus();
        let options = web_sys::ScrollIntoViewOptions::new();
        options.set_block(web_sys::ScrollLogicalPosition::Nearest);
        options.set_inline(web_sys::ScrollLogicalPosition::Nearest);
        tab.scroll_into_view_with_scroll_into_view_options(&options);
    }

    /// The reading direction: the nearest `dir` attribute, else the computed
    /// style, as the element's `#rtl`.
    pub fn is_rtl(list: Signal<Option<Rc<MountedData>>>) -> bool {
        let Some(mut node) = element(list) else { return false };
        loop {
            if let Some(dir) = node.get_attribute("dir") {
                return dir.eq_ignore_ascii_case("rtl");
            }
            let Some(parent) = node.parent_element() else { break };
            node = parent;
        }
        web_sys::window()
            .and_then(|window| window.get_computed_style(&node).ok().flatten())
            .and_then(|style| style.get_property_value("direction").ok())
            .is_some_and(|direction| direction.trim() == "rtl")
    }

    /// Wire the panels (the host's own children, opaque to the VDOM): role,
    /// id, `aria-labelledby`/`aria-controls`, and visibility — only the
    /// selected panel shows; the rest stay mounted, `hidden` and
    /// `data-inert`, so their state survives a switch. Re-runs on selection
    /// changes and, through a MutationObserver, when the panels change, as
    /// the element's `#reconcile`.
    pub fn wire_panels(
        root: Signal<Option<Rc<MountedData>>>,
        selected: Signal<Option<String>>,
        instance: String,
    ) {
        let revision = use_signal(|| 0u64);
        observe_panels(root, revision);
        use_effect(move || {
            revision();
            let Some(root) = element(root) else { return };
            wire(&root, selected().as_deref(), &instance);
        });
    }

    /// Panel additions and removals are the host's renders, which no signal
    /// reports; observe the child list and bump a revision the wiring effect
    /// reads.
    fn observe_panels(root: Signal<Option<Rc<MountedData>>>, mut revision: Signal<u64>) {
        struct Observer {
            observer: web_sys::MutationObserver,
            _closure: Closure<dyn FnMut(js_sys::Array, web_sys::MutationObserver)>,
        }
        impl Drop for Observer {
            fn drop(&mut self) {
                self.observer.disconnect();
            }
        }

        let mut registered = use_signal(|| None::<Rc<Observer>>);
        use_effect(move || {
            if registered.peek().is_some() {
                return;
            }
            let Some(root) = element(root) else { return };
            let closure = Closure::<dyn FnMut(js_sys::Array, web_sys::MutationObserver)>::new(
                move |_records, _observer| {
                    let next = *revision.peek() + 1;
                    revision.set(next);
                },
            );
            let Ok(observer) = web_sys::MutationObserver::new(closure.as_ref().unchecked_ref())
            else {
                return;
            };
            let options = web_sys::MutationObserverInit::new();
            options.set_child_list(true);
            options.set_subtree(true);
            if observer.observe_with_options(&root, &options).is_ok() {
                registered.set(Some(Rc::new(Observer {
                    observer,
                    _closure: closure,
                })));
            }
        });
    }

    fn wire(root: &web_sys::Element, selected: Option<&str>, instance: &str) {
        let panels = keyed(root, ":scope > [data-panel]", "data-panel");
        let tabs = keyed(root, ".ty-tabs__list .ty-tabs__tab", "data-tab-key");
        for (key, panel) in &panels {
            let _ = panel.class_list().add_1("ty-tabs__panel");
            let _ = panel.set_attribute("role", "tabpanel");
            if panel.id().is_empty() {
                panel.set_id(&format!("{instance}-panel-{}", super::safe(key)));
            }
            if let Some((_, tab)) = tabs.iter().find(|(tab_key, _)| tab_key == key) {
                if !tab.id().is_empty() {
                    let _ = panel.set_attribute("aria-labelledby", &tab.id());
                }
                if !panel.id().is_empty() {
                    let _ = tab.set_attribute("aria-controls", &panel.id());
                }
            }
            let shown = selected == Some(key.as_str());
            panel.set_hidden(!shown);
            if shown {
                // Tab from the list lands in the selected panel.
                let _ = panel.remove_attribute("data-inert");
                let _ = panel.set_attribute("tabindex", "0");
            } else {
                let _ = panel.set_attribute("data-inert", "");
                let _ = panel.remove_attribute("tabindex");
            }
        }
        for (key, tab) in &tabs {
            if !panels.iter().any(|(panel_key, _)| panel_key == key) {
                let _ = tab.remove_attribute("aria-controls");
            }
        }
    }

    fn find_tab(list: &web_sys::Element, key: &str) -> Option<web_sys::HtmlElement> {
        keyed(list, ".ty-tabs__tab", "data-tab-key")
            .into_iter()
            .find(|(tab_key, _)| tab_key == key)
            .map(|(_, tab)| tab)
    }

    /// The descendants matching `selector`, paired with their `attribute`.
    fn keyed(
        root: &web_sys::Element,
        selector: &str,
        attribute: &str,
    ) -> Vec<(String, web_sys::HtmlElement)> {
        let mut out = Vec::new();
        let Ok(nodes) = root.query_selector_all(selector) else {
            return out;
        };
        for index in 0..nodes.length() {
            let Some(node) = nodes.item(index) else { continue };
            let Ok(element) = node.dyn_into::<web_sys::HtmlElement>() else {
                continue;
            };
            let Some(key) = element.get_attribute(attribute) else {
                continue;
            };
            out.push((key, element));
        }
        out
    }

    fn element(mounted: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        mounted()?.downcast::<web_sys::Element>().cloned()
    }
}
