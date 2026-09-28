//! Native port of `<ty-action-menu>`: a list of commands opened from a
//! trigger button (mode `trigger`, the APG Menu Button pattern) or at a
//! pointer point over a target (mode `context`: secondary click, Shift+F10,
//! the ContextMenu key, or a touch long press). Where the custom element
//! composed the item rows of the `items` JSON into the anatomy's empty menu
//! on upgrade, the port renders them straight from the parsed prop — items,
//! separators and named sections are declarative here, so SSR carries the
//! composed menu too. Visibility stays controlled: every path only asks
//! (`on_open_change`), the host flips `open`. The keyboard contract is the
//! element's: opening focuses the first enabled item (ArrowUp from the
//! trigger: the last), ArrowDown/ArrowUp move with wrapping, Home/End jump,
//! a printable character type-aheads to the next matching item, Enter/Space
//! activate (`on_action`, then ask to close), Escape asks to close and
//! returns focus to the origin, Tab and an outside press ask to close
//! without stealing focus; disabled items are skipped. What still needs the
//! live DOM — the trigger's aria wiring and toggle (it may be the host's
//! own slotted control), the outside press, the fixed placement with its
//! viewport clamp and collision flip, the entering animation, the focus
//! moves and return, and the long-press timer — lives in `mod wasm`,
//! cfg-gated with a no-op non-wasm twin.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// `trigger`: opens from the trigger button; `context`: opens at a viewport point over the trigger slot's target.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ActionMenuMode {
    #[default]
    Trigger,
    Context,
}

impl ActionMenuMode {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            ActionMenuMode::Trigger => "trigger",
            ActionMenuMode::Context => "context",
        }
    }
}

/// An item was activated (pointer, Enter or Space); the element then asks to close. A disabled item never fires.
#[derive(Clone, Debug, PartialEq)]
pub struct ActionMenuAction {
    pub id: String,
}

/// The element asks the host to change visibility — `open: true` on a trigger activation or a context request (secondary click, Shift+F10, the ContextMenu key, a long press), `open: false` on Escape, Tab, an outside press or after an action. Controlled: the element does not toggle itself; the host flips `open`.
#[derive(Clone, Debug, PartialEq)]
pub struct ActionMenuOpenChange {
    pub open: bool,
}

/// One actionable entry of the `items` JSON (the element's `Item`, with the
/// icon reduced to a text glyph).
#[derive(Clone, Debug, PartialEq)]
struct Item {
    id: String,
    label: String,
    icon: Option<String>,
    tone: String,
    disabled: bool,
    shortcut: Option<String>,
}

/// One entry of the `items` JSON: an item, a separator, or a named section.
#[derive(Clone, Debug, PartialEq)]
enum Entry {
    Item(Item),
    Separator,
    Section { id: String, title: String, items: Vec<Item> },
}

/// A composed item row in document order, for the roving focus and
/// activation (the element's `Rendered`, without the DOM node).
#[derive(Clone, Debug, PartialEq)]
struct FlatItem {
    id: String,
    label: String,
    disabled: bool,
}

/// A row of the composed menu, in document order; item rows carry their
/// index into `flat`.
#[derive(Clone, Debug, PartialEq)]
enum Row {
    Item { index: usize, item: Item },
    Separator,
    Section { id: String, title: String, items: Vec<(usize, Item)> },
}

/// Which end of the menu the opening focus lands on (ArrowUp from the
/// trigger opens onto the last item).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum FocusEnd {
    First,
    Last,
}

/// Why the element asked to close; an outside press and Tab must not steal
/// focus back (the element's `CloseReason`). The `Outside` and `Trigger`
/// paths are taken by the wasm listeners only.
#[cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Reason {
    Escape,
    Action,
    Trigger,
    Outside,
    Tab,
}

/// The signals the DOM effects read: the mirrored controlled props and the
/// overlay session state (the element's private fields, as signals). Only
/// the wasm effects read the fields.
#[cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]
#[derive(Clone, Copy)]
struct MenuSignals {
    host: Signal<Option<Rc<MountedData>>>,
    open: Signal<bool>,
    mode: Signal<ActionMenuMode>,
    position: Signal<Option<String>>,
    on_open_change: Signal<Option<EventHandler<ActionMenuOpenChange>>>,
    point: Signal<(f64, f64)>,
    pending: Signal<FocusEnd>,
    close_reason: Signal<Option<Reason>>,
    entering: Signal<bool>,
}

/// What a composed row needs from the component: the state signals and the
/// event handlers, bundled so the row builders stay plain functions.
#[derive(Clone)]
struct RowCtx {
    focused: Signal<Option<usize>>,
    hovered: Signal<Option<usize>>,
    pressed: Signal<Option<usize>>,
    keyboard: Signal<bool>,
    close_reason: Signal<Option<Reason>>,
    on_action: Option<EventHandler<ActionMenuAction>>,
    on_open_change: Option<EventHandler<ActionMenuOpenChange>>,
}

/// The element asks the host to change visibility; the host flips `open`.
fn request_open(handler: Option<EventHandler<ActionMenuOpenChange>>, next: bool) {
    if let Some(handler) = handler {
        handler.call(ActionMenuOpenChange { open: next });
    }
}

/// A list of commands opened from a trigger button (mode `trigger`, the APG Menu Button pattern) or at a pointer position over a target (mode `context`: secondary click, Shift+F10, the ContextMenu key, or a long press on touch). Opening moves focus to the first enabled item (ArrowUp from the trigger: the last); ArrowDown/ArrowUp move with wrapping, Home/End jump, typing a character moves to the next enabled item starting with it, Enter/Space activate, Escape closes and returns focus to the origin, Tab and an outside press close. Disabled items are skipped and announced as disabled. In context mode the surface is clamped so it never overflows the viewport. Visibility is controlled: the element asks with `ty-open-change`, the host flips `open`.
#[allow(clippy::too_many_arguments)]
// `MenuEffects` is `Copy` off-wasm but an `Rc` on wasm, where the clones matter.
#[cfg_attr(not(target_arch = "wasm32"), allow(clippy::clone_on_copy))]
#[component]
pub fn TyActionMenu(
    /// Shown (controlled). The anatomy stays mounted but `hidden` while closed, so nothing reaches the accessibility tree.
    #[props(default)] open: bool,
    /// `trigger`: opens from the trigger button; `context`: opens at a viewport point over the trigger slot's target.
    #[props(default)] mode: ActionMenuMode,
    /// Accessible name of the menu (required by the spec).
    #[props(into)] label: Option<String>,
    /// Accessible name of the built-in icon-only trigger (the React messages.moreActions default), used in trigger mode when the trigger slot is empty.
    #[props(into, default = String::from("More actions"))] trigger_label: String,
    /// JSON array of entries in order: an item `{ id, label, icon?, tone?, disabled?, shortcut? }` (`icon` a decorative text glyph, `tone` "danger" marks a destructive command, `shortcut` a displayed hint only), `{ "type": "separator" }`, or `{ "type": "section", "id", "title", "items": [...] }`. The element composes the rows on upgrade.
    #[props(into)] items: Option<String>,
    /// Context mode: the viewport point the menu opens at, "x,y" in CSS pixels (controlled); the last context-request point when unset. Clamped so the menu stays inside the viewport.
    #[props(into)] position: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)] instance: Option<String>,
    #[props(into)] id: Option<String>,
    #[props(into, default)] class: String,
    /// Trigger mode: the host's own toggle — any single focusable element, wired with aria-haspopup="menu" and aria-expanded. Context mode: the target that receives the context request (secondary click, Shift+F10, long press). Empty in trigger mode: the built-in ellipsis button named by `triggerLabel`.
    trigger: Option<Element>,
    /// An item was activated (pointer, Enter or Space); the element then asks to close. A disabled item never fires.
    on_action: Option<EventHandler<ActionMenuAction>>,
    /// The element asks the host to change visibility — `open: true` on a trigger activation or a context request (secondary click, Shift+F10, the ContextMenu key, a long press), `open: false` on Escape, Tab, an outside press or after an action. Controlled: the element does not toggle itself; the host flips `open`.
    on_open_change: Option<EventHandler<ActionMenuOpenChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_trigger = trigger.is_some();

    // The rows the element composed into the empty menu on upgrade,
    // flattened in document order for the roving focus.
    let mut flat: Vec<FlatItem> = Vec::new();
    let mut rows: Vec<Row> = Vec::new();
    for entry in parse_items(items.as_deref()) {
        match entry {
            Entry::Separator => rows.push(Row::Separator),
            Entry::Item(item) => {
                flat.push(FlatItem {
                    id: item.id.clone(),
                    label: item.label.clone(),
                    disabled: item.disabled,
                });
                rows.push(Row::Item {
                    index: flat.len() - 1,
                    item,
                });
            }
            Entry::Section { id, title, items } => {
                let mut section_items = Vec::with_capacity(items.len());
                for item in items {
                    flat.push(FlatItem {
                        id: item.id.clone(),
                        label: item.label.clone(),
                        disabled: item.disabled,
                    });
                    section_items.push((flat.len() - 1, item));
                }
                rows.push(Row::Section {
                    id,
                    title,
                    items: section_items,
                });
            }
        }
    }

    // The controlled `open`, mirrored so the effects see the flip (the
    // element's `#reconcile`).
    let mut was_open = use_signal(|| false);
    if open != *was_open.peek() {
        was_open.set(open);
    }

    // Mirrored props the DOM closures re-read, as the element re-read its
    // attributes.
    let mut mirrored_mode = use_signal(|| mode);
    if mode != *mirrored_mode.peek() {
        mirrored_mode.set(mode);
    }
    let mut mirrored_position = use_signal(|| position.clone());
    if position != *mirrored_position.peek() {
        mirrored_position.set(position.clone());
    }
    let mut mirrored_on_open_change = use_signal(|| on_open_change);
    if *mirrored_on_open_change.peek() != on_open_change {
        mirrored_on_open_change.set(on_open_change);
    }

    // The overlay's session state (the element's private fields).
    let mut point = use_signal(|| (0.0, 0.0));
    let mut pending = use_signal(|| FocusEnd::First);
    let mut close_reason = use_signal(|| None::<Reason>);
    let mut entering = use_signal(|| false);
    let mut focused = use_signal(|| None::<usize>);
    let hovered = use_signal(|| None::<usize>);
    let mut pressed = use_signal(|| None::<usize>);
    // Modality of the last interaction, for `data-focus-visible`.
    let mut keyboard = use_signal(|| true);

    let mut host = use_signal(|| None::<Rc<MountedData>>);
    let effects = wasm::use_menu_effects();
    let signals = MenuSignals {
        host,
        open: was_open,
        mode: mirrored_mode,
        position: mirrored_position,
        on_open_change: mirrored_on_open_change,
        point,
        pending,
        close_reason,
        entering,
    };
    wasm::wire(effects.clone(), signals);

    // A context request at a viewport point: remember it (an open menu
    // re-anchors through the placement effect) and ask to open when closed —
    // the element's `#askContext`.
    let ask_context = {
        let effects = effects.clone();
        move |at: (f64, f64)| {
            effects.capture_origin();
            point.set(at);
            if !open {
                pending.set(FocusEnd::First);
                request_open(on_open_change, true);
            }
        }
    };

    let ctx = RowCtx {
        focused,
        hovered,
        pressed,
        keyboard,
        close_reason,
        on_action,
        on_open_change,
    };

    rsx! {
        ty-action-menu {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "open": open.then_some("true"),
            "mode": Some(mode.as_str()),
            "label": label.as_deref().filter(|v| !v.is_empty()),
            "trigger-label": (!trigger_label.is_empty()).then_some(trigger_label.as_str()),
            "items": items.as_deref().filter(|v| !v.is_empty()),
            "position": position.as_deref().filter(|v| !v.is_empty()),
            onmounted: move |event: MountedEvent| host.set(Some(event.data())),
            onpointerdown: move |_| keyboard.set(false),
            onpointerup: move |_| pressed.set(None),
            onkeydown: {
                let mut ask_context = ask_context.clone();
                move |event: KeyboardEvent| {
                    keyboard.set(true);
                    let key = event.key();
                    if mode == ActionMenuMode::Context
                        && ((event.modifiers().shift() && key == Key::F10) || key == Key::ContextMenu)
                    {
                        event.prevent_default();
                        ask_context(wasm::context_point(host));
                        return;
                    }
                    if mode == ActionMenuMode::Trigger && (key == Key::ArrowDown || key == Key::ArrowUp) {
                        // The trigger is the only focusable child outside the
                        // surface; an already open menu swallows the key.
                        event.prevent_default();
                        if !open {
                            pending.set(if key == Key::ArrowUp { FocusEnd::Last } else { FocusEnd::First });
                            request_open(on_open_change, true);
                        }
                    }
                }
            },
            oncontextmenu: {
                let mut ask_context = ask_context.clone();
                move |event: MouseEvent| {
                    if mode != ActionMenuMode::Context {
                        return;
                    }
                    event.prevent_default();
                    let at = event.client_coordinates();
                    ask_context((at.x, at.y));
                }
            },
            span {
                class: "ty-action-menu__target",
                "data-mode": Some(mode.as_str()),
                if !(slot_trigger) && mode == ActionMenuMode::Trigger {
                    button {
                        class: "ty-button ty-action-menu__trigger",
                        "type": Some("button"),
                        "aria-label": (!trigger_label.is_empty()).then_some(trigger_label.as_str()),
                        "aria-haspopup": Some("menu"),
                        "data-variant": Some("quiet"),
                        "data-icon-only": Some(""),
                        span {
                            class: "ty-button__icon",
                            "aria-hidden": Some("true"),
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
                                    class: "ty-action-menu__glyph",
                                    "cx": Some("12"),
                                    "cy": Some("12"),
                                    "r": Some("1"),
                                }
                                circle {
                                    class: "ty-action-menu__glyph",
                                    "cx": Some("19"),
                                    "cy": Some("12"),
                                    "r": Some("1"),
                                }
                                circle {
                                    class: "ty-action-menu__glyph",
                                    "cx": Some("5"),
                                    "cy": Some("12"),
                                    "r": Some("1"),
                                }
                            }
                        }
                    }
                }
                if slot_trigger {
                    {trigger.clone()}
                }
                div {
                    class: "ty-action-menu",
                    "hidden": if !(open) { Some("true") } else { None },
                    "data-mode": Some(mode.as_str()),
                    "data-entering": (open && entering()).then_some(""),
                    onclick: move |event: MouseEvent| event.stop_propagation(),
                    oncontextmenu: move |event: MouseEvent| {
                        // A secondary click inside the menu is not a new
                        // context request, but the browser menu stays away.
                        event.prevent_default();
                        event.stop_propagation();
                    },
                    onanimationend: move |_| entering.set(false),
                    onkeydown: {
                        let flat = flat.clone();
                        move |event: KeyboardEvent| {
                            keyboard.set(true);
                            let key = event.key();
                            let enabled: Vec<usize> = flat
                                .iter()
                                .enumerate()
                                .filter(|(_, item)| !item.disabled)
                                .map(|(index, _)| index)
                                .collect();
                            let current = focused()
                                .and_then(|now| enabled.iter().position(|&index| index == now));
                            if key == Key::ArrowDown || key == Key::ArrowUp {
                                event.prevent_default();
                                if enabled.is_empty() {
                                    return;
                                }
                                let step: isize = if key == Key::ArrowDown { 1 } else { -1 };
                                let next = match current {
                                    None => {
                                        if step == 1 { 0 } else { enabled.len() - 1 }
                                    }
                                    Some(position) => (position as isize + step)
                                        .rem_euclid(enabled.len() as isize)
                                        as usize,
                                };
                                focused.set(Some(enabled[next]));
                                wasm::focus_enabled(host, next);
                                return;
                            }
                            if key == Key::Home || key == Key::End {
                                event.prevent_default();
                                if enabled.is_empty() {
                                    return;
                                }
                                let next = if key == Key::End { enabled.len() - 1 } else { 0 };
                                focused.set(Some(enabled[next]));
                                wasm::focus_enabled(host, next);
                                return;
                            }
                            let activate =
                                key == Key::Enter || matches!(&key, Key::Character(text) if text == " ");
                            if activate {
                                event.prevent_default();
                                let Some(now) = focused() else { return };
                                let item = &flat[now];
                                // A disabled item neither fires nor closes.
                                if item.disabled {
                                    return;
                                }
                                if let Some(handler) = on_action {
                                    handler.call(ActionMenuAction { id: item.id.clone() });
                                }
                                close_reason.set(Some(Reason::Action));
                                request_open(on_open_change, false);
                                return;
                            }
                            if key == Key::Escape {
                                event.prevent_default();
                                event.stop_propagation();
                                close_reason.set(Some(Reason::Escape));
                                request_open(on_open_change, false);
                                return;
                            }
                            if key == Key::Tab {
                                // Focus moves on naturally; the menu only asks to close.
                                close_reason.set(Some(Reason::Tab));
                                request_open(on_open_change, false);
                                return;
                            }
                            if key == Key::ContextMenu || (event.modifiers().shift() && key == Key::F10) {
                                // Not a new context request from inside the menu.
                                event.stop_propagation();
                                return;
                            }
                            if let Key::Character(text) = &key {
                                let modifiers = event.modifiers();
                                if text.chars().count() == 1
                                    && !modifiers.ctrl()
                                    && !modifiers.meta()
                                    && !modifiers.alt()
                                {
                                    event.prevent_default();
                                    if enabled.is_empty() {
                                        return;
                                    }
                                    // Type-ahead: the next enabled item
                                    // (wrapping, after the current one) whose
                                    // label starts with the character.
                                    let needle = text.to_lowercase();
                                    let start = current.map(|position| position as isize).unwrap_or(-1);
                                    for step in 1..=enabled.len() {
                                        let next = (start + step as isize)
                                            .rem_euclid(enabled.len() as isize)
                                            as usize;
                                        if flat[enabled[next]]
                                            .label
                                            .trim()
                                            .to_lowercase()
                                            .starts_with(&needle)
                                        {
                                            focused.set(Some(enabled[next]));
                                            wasm::focus_enabled(host, next);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    },
                    div {
                        class: "ty-action-menu__menu",
                        "id": Some(format!("{instance}-menu")),
                        "role": Some("menu"),
                        "aria-label": label.as_deref().filter(|v| !v.is_empty()),
                        "aria-orientation": Some("vertical"),
                        "tabindex": Some("-1"),
                        for row in &rows {
                            {render_row(&ctx, &instance, row)}
                        }
                    }
                }
            }
        }
    }
}

/// One composed row of the menu (a separator, an item, or a named section
/// with its items), as the element's `#compose` built them.
fn render_row(ctx: &RowCtx, instance: &str, row: &Row) -> Element {
    match row {
        Row::Separator => rsx! {
            div {
                class: "ty-action-menu__separator",
                "role": Some("separator"),
            }
        },
        Row::Item { index, item } => item_row(ctx, *index, item),
        Row::Section { id, title, items } => rsx! {
            div {
                class: "ty-action-menu__section",
                "role": Some("group"),
                "aria-labelledby": Some(format!("{instance}-section-{id}")),
                div {
                    class: "ty-action-menu__section-title",
                    "id": Some(format!("{instance}-section-{id}")),
                    {title.clone()}
                }
                for (index, item) in items {
                    {item_row(ctx, *index, item)}
                }
            }
        },
    }
}

/// One item row (the element's `#row`): role menuitem, tone and disabled as
/// data/aria, the icon glyph, the label and the decorative shortcut hint,
/// plus the hover/press/focus state markers the stylesheet keys on.
fn item_row(ctx: &RowCtx, index: usize, item: &Item) -> Element {
    let mut focused = ctx.focused;
    let mut hovered = ctx.hovered;
    let mut pressed = ctx.pressed;
    let keyboard = ctx.keyboard;
    let mut close_reason = ctx.close_reason;
    let on_action = ctx.on_action;
    let on_open_change = ctx.on_open_change;
    let id = item.id.clone();
    let disabled = item.disabled;
    rsx! {
        div {
            class: "ty-action-menu__item",
            "role": Some("menuitem"),
            "tabindex": Some("-1"),
            "data-tone": Some(item.tone.clone()),
            "aria-disabled": disabled.then_some("true"),
            "data-disabled": disabled.then_some(""),
            "data-focused": (focused() == Some(index)).then_some(""),
            "data-focus-visible": (focused() == Some(index) && keyboard()).then_some(""),
            "data-hovered": (hovered() == Some(index)).then_some(""),
            "data-pressed": (pressed() == Some(index)).then_some(""),
            onclick: move |event: MouseEvent| {
                event.stop_propagation();
                if disabled {
                    return;
                }
                if let Some(handler) = on_action {
                    handler.call(ActionMenuAction { id: id.clone() });
                }
                close_reason.set(Some(Reason::Action));
                request_open(on_open_change, false);
            },
            onfocus: move |_| focused.set(Some(index)),
            onfocusout: move |_| {
                if *focused.peek() == Some(index) {
                    focused.set(None);
                }
            },
            onpointerover: move |_| hovered.set(Some(index)),
            onpointerout: move |_| {
                if *hovered.peek() == Some(index) {
                    hovered.set(None);
                }
                if *pressed.peek() == Some(index) {
                    pressed.set(None);
                }
            },
            onpointerdown: move |_| pressed.set(Some(index)),
            if let Some(icon) = item.icon.clone() {
                span {
                    class: "ty-action-menu__icon",
                    "aria-hidden": Some("true"),
                    {icon}
                }
            }
            span {
                class: "ty-action-menu__label",
                {item.label.clone()}
            }
            if let Some(shortcut) = item.shortcut.clone() {
                kbd {
                    class: "ty-action-menu__shortcut",
                    "aria-hidden": Some("true"),
                    {shortcut}
                }
            }
        }
    }
}

/// The `items` prop: a JSON array of items, separators and sections, parsed
/// by hand (the port adds no dependency); a document that is not valid JSON
/// warns and yields no rows, as the element.
fn parse_items(raw: Option<&str>) -> Vec<Entry> {
    let Some(raw) = raw.filter(|value| !value.trim().is_empty()) else {
        return Vec::new();
    };
    let Some(Json::Array(entries)) = JsonParser::new(raw).finish() else {
        #[cfg(target_arch = "wasm32")]
        web_sys::console::warn_1(&wasm_bindgen::JsValue::from_str(
            "ty-action-menu: `items` is not valid JSON.",
        ));
        return Vec::new();
    };
    entries.iter().filter_map(entry).collect()
}

fn entry(json: &Json) -> Option<Entry> {
    let Json::Object(fields) = json else { return None };
    let field = |name: &str| {
        fields
            .iter()
            .find(|(key, _)| key == name)
            .map(|(_, value)| value)
    };
    match field("type") {
        Some(Json::String(kind)) if kind == "separator" => Some(Entry::Separator),
        Some(Json::String(kind)) if kind == "section" => {
            let items = match field("items") {
                Some(Json::Array(items)) => items.iter().filter_map(item).collect(),
                _ => Vec::new(),
            };
            Some(Entry::Section {
                id: json_text(field("id")),
                title: json_text(field("title")),
                items,
            })
        }
        _ => item(json).map(Entry::Item),
    }
}

fn item(json: &Json) -> Option<Item> {
    let Json::Object(fields) = json else { return None };
    let field = |name: &str| {
        fields
            .iter()
            .find(|(key, _)| key == name)
            .map(|(_, value)| value)
    };
    Some(Item {
        id: json_text(field("id")),
        label: json_text(field("label")),
        icon: json_text_opt(field("icon")),
        tone: match field("tone") {
            Some(Json::String(tone)) if !tone.is_empty() => tone.clone(),
            _ => String::from("default"),
        },
        disabled: matches!(field("disabled"), Some(Json::Bool(true))),
        shortcut: json_text_opt(field("shortcut")),
    })
}

/// A text field of a parsed entry: strings as-is, numbers stringified (the
/// element's `String(value ?? '')`).
fn json_text(value: Option<&Json>) -> String {
    match value {
        Some(Json::String(text)) => text.clone(),
        Some(Json::Number(number)) => number_text(*number),
        _ => String::new(),
    }
}

/// An optional text field, absent when empty (the element's truthy check).
fn json_text_opt(value: Option<&Json>) -> Option<String> {
    let text = json_text(value);
    (!text.is_empty()).then_some(text)
}

/// A number as the element stringified it (`String(count)`): integers
/// without a fraction, anything else in the shortest form.
fn number_text(number: f64) -> String {
    if number.fract() == 0.0 && number.abs() < 1e15 {
        format!("{}", number as i64)
    } else {
        format!("{number}")
    }
}

/// Minimal JSON value: enough for the entries of the `items` prop.
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

    use super::MenuSignals;

    #[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
    pub struct MenuEffects;

    impl MenuEffects {
        pub fn capture_origin(&self) {}
    }

    pub fn use_menu_effects() -> MenuEffects {
        MenuEffects
    }

    pub fn wire(_effects: MenuEffects, _signals: MenuSignals) {}

    pub fn focus_enabled(_host: Signal<Option<Rc<MountedData>>>, _nth: usize) {}

    pub fn context_point(_host: Signal<Option<Rc<MountedData>>>) -> (f64, f64) {
        (0.0, 0.0)
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::cell::RefCell;
    use std::rc::{Rc, Weak};

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    use super::{request_open, ActionMenuMode, FocusEnd, MenuSignals, Reason};

    /// Pixels kept between the surface and every viewport edge in context mode (ActionMenu.tsx's GUTTER).
    const GUTTER: f64 = 8.0;
    /// Gap between trigger and surface in trigger mode (ActionMenu.tsx's Popover offset).
    const TRIGGER_OFFSET: f64 = 8.0;
    /// Touch: a press held this long over the target is a context request (ActionMenu.tsx's LONG_PRESS_MS).
    const LONG_PRESS_MS: i32 = 500;
    /// Pixels kept between the surface and every viewport edge in trigger mode (the shared placement model's margin).
    const VIEWPORT_MARGIN: f64 = 16.0;

    /// An axis-aligned rectangle in viewport pixels.
    #[derive(Clone, Copy)]
    struct Rect {
        x: f64,
        y: f64,
        width: f64,
        height: f64,
    }

    /// A width and height in pixels.
    #[derive(Clone, Copy)]
    struct Size {
        width: f64,
        height: f64,
    }

    /// The controlled `position` ("x,y" in CSS pixels), when it holds two finite numbers.
    fn parse_position(raw: &str) -> Option<(f64, f64)> {
        let mut parts = raw.split(',');
        let x = parts.next()?.trim().parse::<f64>().ok()?;
        let y = parts.next()?.trim().parse::<f64>().ok()?;
        (x.is_finite() && y.is_finite()).then_some((x, y))
    }

    /// Keep the surface `VIEWPORT_MARGIN` from the edges; a surface larger than the viewport pins to the leading margin.
    fn clamp_axis(start: f64, panel_len: f64, viewport_len: f64) -> f64 {
        let max = viewport_len - VIEWPORT_MARGIN - panel_len;
        start.clamp(VIEWPORT_MARGIN, max.max(VIEWPORT_MARGIN))
    }

    /// The surface next to the trigger: below it, aligned to its end,
    /// flipping up on collision and clamped to the viewport (the shared
    /// placement model with preferred `bottom`, align `end`).
    fn place_anchored(anchor: Rect, panel: Size, viewport: Size) -> (f64, f64, &'static str) {
        let below = viewport.height - (anchor.y + anchor.height) - VIEWPORT_MARGIN;
        let side = if below >= TRIGGER_OFFSET + panel.height {
            "bottom"
        } else {
            let above = anchor.y - VIEWPORT_MARGIN;
            if above > below {
                "top"
            } else {
                "bottom"
            }
        };
        let raw_x = anchor.x + anchor.width - panel.width;
        let raw_y = if side == "top" {
            anchor.y - TRIGGER_OFFSET - panel.height
        } else {
            anchor.y + anchor.height + TRIGGER_OFFSET
        };
        (
            clamp_axis(raw_x, panel.width, viewport.width),
            clamp_axis(raw_y, panel.height, viewport.height),
            side,
        )
    }

    /// A DOM listener removed on drop (the element's AbortController).
    struct Listener {
        target: web_sys::EventTarget,
        event: &'static str,
        capture: bool,
        closure: Closure<dyn FnMut(web_sys::Event)>,
    }

    impl Drop for Listener {
        fn drop(&mut self) {
            let _ = self.target.remove_event_listener_with_callback_and_bool(
                self.event,
                self.closure.as_ref().unchecked_ref(),
                self.capture,
            );
        }
    }

    fn listen(
        target: web_sys::EventTarget,
        event: &'static str,
        capture: bool,
        passive: bool,
        closure: Closure<dyn FnMut(web_sys::Event)>,
    ) -> Option<Listener> {
        let added = if capture || passive {
            let options = web_sys::AddEventListenerOptions::new();
            options.set_capture(capture);
            options.set_passive(passive);
            target.add_event_listener_with_callback_and_add_event_listener_options(
                event,
                closure.as_ref().unchecked_ref(),
                &options,
            )
        } else {
            target.add_event_listener_with_callback(event, closure.as_ref().unchecked_ref())
        };
        added.is_ok().then_some(Listener {
            target,
            event,
            capture,
            closure,
        })
    }

    /// The overlay's DOM session: the host element, the mirrored signals,
    /// the host listeners (attached once), the while-open document/window
    /// listeners (the element's AbortController session), the pending frame
    /// and long-press timer, and the origin focus returns to. Dropping
    /// tears down like the element's `disconnected` did — no focus return
    /// on unmount.
    #[derive(Default)]
    struct Inner {
        host: Option<web_sys::Element>,
        signals: Option<MenuSignals>,
        me: Weak<RefCell<Inner>>,
        host_listeners: Vec<Listener>,
        session: Vec<Listener>,
        open: bool,
        attached: bool,
        origin: Option<web_sys::Element>,
        frame_id: i32,
        frame: Option<Closure<dyn FnMut()>>,
        long_press: Option<(i32, Closure<dyn FnMut()>)>,
    }

    impl Drop for Inner {
        fn drop(&mut self) {
            self.cancel_frame();
            self.cancel_long_press();
            // The listeners remove themselves.
        }
    }

    impl Inner {
        /// The host listeners the element attached on connect: the trigger
        /// toggle and the touch long press with its cancels.
        fn attach(&mut self, element: web_sys::Element, signals: MenuSignals, me: Weak<RefCell<Inner>>) {
            self.me = me;
            self.signals = Some(signals);
            let target: web_sys::EventTarget = element.clone().into();

            let weak = self.me.clone();
            if let Some(listener) = listen(
                target.clone(),
                "click",
                false,
                false,
                Closure::<dyn FnMut(web_sys::Event)>::new(move |event| {
                    let Some(rc) = weak.upgrade() else { return };
                    rc.borrow_mut().on_click(&event);
                }),
            ) {
                self.host_listeners.push(listener);
            }

            let weak = self.me.clone();
            if let Some(listener) = listen(
                target.clone(),
                "pointerdown",
                false,
                false,
                Closure::<dyn FnMut(web_sys::Event)>::new(move |event| {
                    let Some(rc) = weak.upgrade() else { return };
                    rc.borrow_mut().on_pointer_down(&event);
                }),
            ) {
                self.host_listeners.push(listener);
            }
            for event_name in ["pointerup", "pointercancel", "pointermove"] {
                let weak = self.me.clone();
                if let Some(listener) = listen(
                    target.clone(),
                    event_name,
                    false,
                    false,
                    Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                        let Some(rc) = weak.upgrade() else { return };
                        rc.borrow_mut().cancel_long_press();
                    }),
                ) {
                    self.host_listeners.push(listener);
                }
            }

            self.host = Some(element);
            self.attached = true;
        }

        /// The trigger toggles (trigger mode only); a press that lands on
        /// the surface is the rows' own business (plain Dioxus clicks).
        fn on_click(&mut self, event: &web_sys::Event) {
            let Some(host) = self.host.clone() else { return };
            let Some(mut signals) = self.signals else { return };
            let Some(target) = event
                .target()
                .and_then(|target| target.dyn_into::<web_sys::Element>().ok())
            else {
                return;
            };
            if let Ok(Some(surface)) = host.query_selector(".ty-action-menu") {
                if surface.contains(Some(&target)) {
                    return;
                }
            }
            if *signals.mode.peek() != ActionMenuMode::Trigger {
                return;
            }
            let Some(trigger) = find_trigger(&host) else { return };
            if !trigger.is_same_node(Some(&target)) && !trigger.contains(Some(&target)) {
                return;
            }
            // The host's own button already handles its activation
            // semantics; the element only asks for the toggle.
            event.prevent_default();
            if *signals.open.peek() {
                signals.close_reason.set(Some(Reason::Trigger));
                request_open(*signals.on_open_change.peek(), false);
            } else {
                signals.pending.set(FocusEnd::First);
                self.origin = Some(trigger);
                request_open(*signals.on_open_change.peek(), true);
            }
        }

        /// A touch held over the target is a context request after the wait.
        fn on_pointer_down(&mut self, event: &web_sys::Event) {
            let Some(signals) = self.signals else { return };
            if *signals.mode.peek() != ActionMenuMode::Context {
                return;
            }
            let Some(pointer) = event.dyn_ref::<web_sys::PointerEvent>() else { return };
            if pointer.pointer_type() != "touch" {
                return;
            }
            let Some(host) = self.host.clone() else { return };
            let target = event
                .target()
                .and_then(|target| target.dyn_into::<web_sys::Node>().ok());
            if let (Some(target), Ok(Some(surface))) = (target, host.query_selector(".ty-action-menu")) {
                if surface.contains(Some(&target)) {
                    return;
                }
            }
            let point = (pointer.client_x() as f64, pointer.client_y() as f64);
            self.cancel_long_press();
            let Some(window) = web_sys::window() else { return };
            let weak = self.me.clone();
            let closure = Closure::<dyn FnMut()>::new(move || {
                let Some(rc) = weak.upgrade() else { return };
                rc.borrow_mut().fire_context(point);
            });
            if let Ok(id) = window.set_timeout_with_callback_and_timeout_and_arguments_0(
                closure.as_ref().unchecked_ref(),
                LONG_PRESS_MS,
            ) {
                self.long_press = Some((id, closure));
            }
        }

        /// The long press fired: a context request at the held point (the
        /// element's `#askContext`).
        fn fire_context(&mut self, point: (f64, f64)) {
            let Some(mut signals) = self.signals else { return };
            self.capture_origin();
            signals.point.set(point);
            if *signals.open.peek() {
                // An open menu only re-anchors (the placement effect follows `point`).
                return;
            }
            signals.pending.set(FocusEnd::First);
            request_open(*signals.on_open_change.peek(), true);
        }

        /// The menu opened: remember the origin, listen for an outside press
        /// and viewport changes, and after a frame place the surface, play
        /// the entering animation and focus the pending item — the element's
        /// `#activate`.
        fn activate(&mut self) {
            self.open = true;
            let Some(host) = self.host.clone() else { return };
            let Some(signals) = self.signals else { return };
            if self.origin.is_none() {
                self.capture_origin();
            }
            // A press that starts outside closes; one that starts inside does not.
            let weak = self.me.clone();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                let Some(rc) = weak.upgrade() else { return };
                let mut inner = rc.borrow_mut();
                let (Some(host), Some(mut signals)) = (inner.host.clone(), inner.signals) else {
                    return;
                };
                let inside = event
                    .target()
                    .and_then(|target| target.dyn_into::<web_sys::Node>().ok())
                    .is_some_and(|target| host.contains(Some(&target)));
                if !inside {
                    signals.close_reason.set(Some(Reason::Outside));
                    request_open(*signals.on_open_change.peek(), false);
                }
            });
            if let Some(document) = document() {
                let target: web_sys::EventTarget = document.into();
                if let Some(listener) = listen(target, "pointerdown", false, false, closure) {
                    self.session.push(listener);
                }
            }
            // The placement follows the viewport while open.
            if let Some(window) = web_sys::window() {
                let target: web_sys::EventTarget = window.into();
                for (event_name, capture, passive) in [("resize", false, false), ("scroll", true, true)] {
                    let weak = self.me.clone();
                    let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event| {
                        let Some(rc) = weak.upgrade() else { return };
                        rc.borrow().place();
                    });
                    if let Some(listener) = listen(target.clone(), event_name, capture, passive, closure)
                    {
                        self.session.push(listener);
                    }
                }
            }
            // The anatomy may land a beat after the `open` attribute, so
            // placement, the entering animation and the initial focus wait a
            // frame, as the element's requestAnimationFrame did.
            let weak = self.me.clone();
            let frame = Closure::<dyn FnMut()>::new(move || {
                let Some(rc) = weak.upgrade() else { return };
                let mut inner = rc.borrow_mut();
                inner.frame_id = 0;
                let (Some(host), Some(mut signals)) = (inner.host.clone(), inner.signals) else {
                    return;
                };
                if !host.is_connected() || !*signals.open.peek() {
                    return;
                }
                inner.place();
                signals.entering.set(true);
                let pending = *signals.pending.peek();
                signals.pending.set(FocusEnd::First);
                focus_initial(&host, pending == FocusEnd::Last);
            });
            if let Some(window) = web_sys::window() {
                if let Ok(id) = window.request_animation_frame(frame.as_ref().unchecked_ref()) {
                    self.frame_id = id;
                    self.frame = Some(frame);
                }
            }
        }

        /// The menu closed: drop the session, clear the surface's placement
        /// and return focus to the origin — unless the press outside or the
        /// Tab that closed it owns focus now (the element's `#deactivate`).
        fn deactivate(&mut self) {
            if !self.open {
                return;
            }
            self.open = false;
            self.session.clear();
            self.cancel_frame();
            self.cancel_long_press();
            if let Some(host) = self.host.clone() {
                if let Ok(Some(surface)) = host.query_selector(".ty-action-menu") {
                    if let Some(html) = surface.dyn_ref::<web_sys::HtmlElement>() {
                        let style = html.style();
                        let _ = style.remove_property("position");
                        let _ = style.remove_property("left");
                        let _ = style.remove_property("top");
                    }
                    let _ = surface.remove_attribute("data-entering");
                    let _ = surface.remove_attribute("data-side");
                }
            }
            let reason = self.signals.and_then(|mut signals| {
                let reason = *signals.close_reason.peek();
                signals.close_reason.set(None);
                reason
            });
            let origin = self.origin.take();
            if matches!(reason, Some(Reason::Outside) | Some(Reason::Tab)) {
                return;
            }
            let Some(origin) = origin.filter(|origin| origin.is_connected()) else {
                return;
            };
            // The return waits a frame: the framework keeps owning focus
            // across the commit that closed the menu (the modal's pattern).
            let frame = Closure::<dyn FnMut()>::once(move || {
                if origin.is_connected() {
                    if let Some(html) = origin.dyn_ref::<web_sys::HtmlElement>() {
                        let _ = html.focus();
                    }
                }
            });
            if let Some(window) = web_sys::window() {
                let _ = window.request_animation_frame(frame.as_ref().unchecked_ref());
            }
            frame.forget();
        }

        /// Where focus returns on close: the element that had it inside the
        /// host (outside the surface), else the trigger — the element's
        /// `#askOpen`/`#askContext` origin.
        fn capture_origin(&mut self) {
            let Some(host) = self.host.clone() else { return };
            let active = document().and_then(|document| document.active_element());
            let surface = host.query_selector(".ty-action-menu").ok().flatten();
            self.origin = match active {
                Some(active)
                    if host.contains(Some(&active))
                        && !surface
                            .as_ref()
                            .is_some_and(|surface| surface.contains(Some(&active))) =>
                {
                    Some(active)
                }
                _ => find_trigger(&host),
            };
        }

        /// The surface is `position: fixed`: in context mode at the
        /// requested point clamped inside the viewport; in trigger mode
        /// below the trigger through the shared placement model — the
        /// element's `#place`.
        fn place(&self) {
            let Some(host) = self.host.clone() else { return };
            let Some(signals) = self.signals else { return };
            if !*signals.open.peek() {
                return;
            }
            let Ok(Some(surface)) = host.query_selector(".ty-action-menu") else { return };
            let Some(html) = surface.dyn_ref::<web_sys::HtmlElement>() else { return };
            let Some(window) = web_sys::window() else { return };
            let size = Size {
                width: html.offset_width() as f64,
                height: html.offset_height() as f64,
            };
            let viewport = Size {
                width: window
                    .inner_width()
                    .ok()
                    .and_then(|value| value.as_f64())
                    .unwrap_or(0.0),
                height: window
                    .inner_height()
                    .ok()
                    .and_then(|value| value.as_f64())
                    .unwrap_or(0.0),
            };
            let style = html.style();
            let _ = style.set_property("position", "fixed");
            if *signals.mode.peek() == ActionMenuMode::Context {
                let point = signals
                    .position
                    .peek()
                    .as_deref()
                    .and_then(parse_position)
                    .unwrap_or_else(|| *signals.point.peek());
                // Clamped so the whole menu stays inside the viewport.
                let left = point
                    .0
                    .min(viewport.width - size.width - GUTTER)
                    .max(GUTTER)
                    .round();
                let top = point
                    .1
                    .min(viewport.height - size.height - GUTTER)
                    .max(GUTTER)
                    .round();
                let _ = style.set_property("left", &format!("{left}px"));
                let _ = style.set_property("top", &format!("{top}px"));
                return;
            }
            let Some(trigger) = find_trigger(&host) else { return };
            let rect = trigger.get_bounding_client_rect();
            let anchor = Rect {
                x: rect.x(),
                y: rect.y(),
                width: rect.width(),
                height: rect.height(),
            };
            let (x, y, side) = place_anchored(anchor, size, viewport);
            let _ = style.set_property("left", &format!("{}px", x.round()));
            let _ = style.set_property("top", &format!("{}px", y.round()));
            let _ = surface.set_attribute("data-side", side);
        }

        fn cancel_frame(&mut self) {
            if self.frame_id != 0 {
                if let Some(window) = web_sys::window() {
                    let _ = window.cancel_animation_frame(self.frame_id);
                }
                self.frame_id = 0;
            }
            self.frame = None;
        }

        fn cancel_long_press(&mut self) {
            if let Some((id, _)) = self.long_press.take() {
                if let Some(window) = web_sys::window() {
                    window.clear_timeout_with_handle(id);
                }
            }
        }
    }

    /// The menu's DOM effects, held by the component; the listeners and
    /// timers it owns stop and drop with it.
    #[derive(Clone)]
    pub struct MenuEffects(Rc<RefCell<Inner>>);

    impl MenuEffects {
        /// Remember where focus returns on close (a context request names
        /// its origin at ask time).
        pub fn capture_origin(&self) {
            self.0.borrow_mut().capture_origin();
        }
    }

    pub fn use_menu_effects() -> MenuEffects {
        use_hook(|| MenuEffects(Rc::new(RefCell::new(Inner::default()))))
    }

    /// The effects behind the overlay: the host listeners attach once the
    /// anatomy is mounted; open and close follow the controlled prop; the
    /// placement follows the context point, `position` and mode while open;
    /// the trigger reflects the open state and controls the menu (the
    /// element's `#wireTrigger`).
    pub fn wire(effects: MenuEffects, signals: MenuSignals) {
        {
            let effects = effects.clone();
            use_effect(move || {
                let Some(element) = host_element(signals.host) else { return };
                let mut inner = effects.0.borrow_mut();
                if inner.attached {
                    return;
                }
                inner.attach(element, signals, Rc::downgrade(&effects.0));
                if *signals.open.peek() {
                    inner.activate();
                }
            });
        }

        {
            let effects = effects.clone();
            use_effect(move || {
                let open = (signals.open)();
                let mut inner = effects.0.borrow_mut();
                if !inner.attached || open == inner.open {
                    return;
                }
                if open {
                    inner.activate();
                } else {
                    inner.deactivate();
                }
            });
        }

        {
            let effects = effects.clone();
            use_effect(move || {
                let _ = ((signals.point)(), (signals.position)(), (signals.mode)());
                if !(signals.open)() {
                    return;
                }
                let inner = effects.0.borrow();
                if inner.attached {
                    inner.place();
                }
            });
        }

        use_effect(move || {
            let open = (signals.open)();
            let Some(element) = host_element(signals.host) else { return };
            let Some(trigger) = find_trigger(&element) else { return };
            let _ = trigger.set_attribute("aria-haspopup", "menu");
            let _ = trigger.set_attribute("aria-expanded", if open { "true" } else { "false" });
            if let Ok(Some(menu)) = element.query_selector(".ty-action-menu__menu") {
                let id = menu.id();
                if !id.is_empty() {
                    let _ = trigger.set_attribute("aria-controls", &id);
                }
            }
        });
    }

    /// Move DOM focus to the `nth` enabled item row (the roving focus the
    /// keyboard handlers compute), as the element's `#step`/`#typeahead`.
    pub fn focus_enabled(host: Signal<Option<Rc<MountedData>>>, nth: usize) {
        let Some(element) = host_element(host) else { return };
        let rows = enabled_rows(&element);
        if let Some(html) = rows.get(nth).and_then(|row| row.dyn_ref::<web_sys::HtmlElement>()) {
            let _ = html.focus();
        }
    }

    /// The viewport point a keyboard context request opens at: the focused
    /// element's bottom-left corner inside the host (outside the surface),
    /// else the trigger's — the element's Shift+F10 branch.
    pub fn context_point(host: Signal<Option<Rc<MountedData>>>) -> (f64, f64) {
        let Some(element) = host_element(host) else { return (0.0, 0.0) };
        let surface = element.query_selector(".ty-action-menu").ok().flatten();
        let active = document().and_then(|document| document.active_element());
        let target = match active {
            Some(active)
                if element.contains(Some(&active))
                    && !surface
                        .as_ref()
                        .is_some_and(|surface| surface.contains(Some(&active))) =>
            {
                Some(active)
            }
            _ => find_trigger(&element),
        };
        target
            .map(|target| {
                let rect = target.get_bounding_client_rect();
                (rect.left(), rect.bottom())
            })
            .unwrap_or((0.0, 0.0))
    }

    /// The toggle: the built-in trigger, else the trigger slot's first
    /// element (the context-mode target) — the element's `#trigger`.
    fn find_trigger(host: &web_sys::Element) -> Option<web_sys::Element> {
        if let Ok(Some(built_in)) = host.query_selector(".ty-action-menu__trigger") {
            return Some(built_in);
        }
        let Ok(Some(target)) = host.query_selector(".ty-action-menu__target") else {
            return None;
        };
        let children = target.children();
        for index in 0..children.length() {
            let Some(child) = children.item(index) else { continue };
            if child.class_list().contains("ty-action-menu") {
                continue;
            }
            return Some(child);
        }
        None
    }

    /// The enabled item rows, in document order.
    fn enabled_rows(host: &web_sys::Element) -> Vec<web_sys::Element> {
        let mut rows = Vec::new();
        let Ok(nodes) =
            host.query_selector_all(".ty-action-menu__item:not([aria-disabled=\"true\"])")
        else {
            return rows;
        };
        for index in 0..nodes.length() {
            if let Some(element) = nodes
                .item(index)
                .and_then(|node| node.dyn_into::<web_sys::Element>().ok())
            {
                rows.push(element);
            }
        }
        rows
    }

    /// Opening moves focus to the first enabled item (ArrowUp from the
    /// trigger: the last); with no enabled items the menu itself takes it.
    fn focus_initial(host: &web_sys::Element, last: bool) {
        let rows = enabled_rows(host);
        let target = if rows.is_empty() {
            host.query_selector(".ty-action-menu__menu").ok().flatten()
        } else if last {
            rows.last().cloned()
        } else {
            rows.first().cloned()
        };
        if let Some(html) = target.and_then(|target| target.dyn_into::<web_sys::HtmlElement>().ok())
        {
            let _ = html.focus();
        }
    }

    fn document() -> Option<web_sys::Document> {
        web_sys::window().and_then(|window| window.document())
    }

    fn host_element(host: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        host()?.downcast::<web_sys::Element>().cloned()
    }
}
