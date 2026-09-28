//! Native port of `<ty-notification-center>`: the history the host feeds
//! through `notices` is parsed in Rust (a small JSON reader, malformed
//! entries skipped, as the element did) and composed into the anatomy — the
//! unseen-count badge on the bell (flashing on a rise), the entries of the
//! drawer's list (tone glyph, tone word, title, message, relative time,
//! dismiss) and the hidden/empty states — instead of the element's DOM
//! building, so SSR carries the composed history too. Dismissals and a
//! clear are kept in a local ledger (dropped from the rendered history at
//! once, reported through `on_dismiss` / `on_clear`) until the host feeds
//! the next `notices`; opening marks everything seen. The modal contract is
//! the element's: the drawer is controlled (`on_open_change` asks, the host
//! flips `open`), focus moves into the drawer on open, is trapped while
//! open (Escape asks to close, Tab wraps) and returns to the bell on close;
//! after a dismissal focus lands on the next entry's dismiss button (or the
//! previous one, or the heading when the list became empty), and clear all
//! moves it to the heading and announces the `cleared_label` politely. The
//! page behind is inert and scroll-locked while open. The DOM-only parts
//! (focus, inert, scroll lock, the entering animation) live in the `wasm`
//! module, cfg-gated with a no-op twin.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// The element asks the host to change visibility — `open: true` on a bell press, `open: false` on Escape, the close button, a backdrop press or a second bell press. Controlled: the element does not toggle itself; the host flips `open`.
#[derive(Clone, Debug, PartialEq)]
pub struct NotificationCenterOpenChange {
    pub open: bool,
}

/// An entry's dismiss button was pressed. The element drops the entry from its rendered history at once; the host removes it from its own state.
#[derive(Clone, Debug, PartialEq)]
pub struct NotificationCenterDismiss {
    pub id: String,
}

/// One history entry, as the `notices` JSON carries it.
#[derive(Clone, Debug, PartialEq)]
struct Notice {
    id: String,
    tone: NoticeTone,
    title: String,
    message: Option<String>,
    created_at: f64,
}

/// The tone of one entry; anything unknown is `info`, as the element did.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum NoticeTone {
    Success,
    Error,
    Warning,
    Info,
}

impl NoticeTone {
    fn as_str(self) -> &'static str {
        match self {
            NoticeTone::Success => "success",
            NoticeTone::Error => "error",
            NoticeTone::Warning => "warning",
            NoticeTone::Info => "info",
        }
    }

    fn parse(value: Option<&Json>) -> Self {
        match value {
            Some(Json::String(tone)) => match tone.as_str() {
                "success" => NoticeTone::Success,
                "error" => NoticeTone::Error,
                "warning" => NoticeTone::Warning,
                _ => NoticeTone::Info,
            },
            _ => NoticeTone::Info,
        }
    }
}

/// Just enough JSON for the `notices` array (the host's own data).
#[derive(Clone, Debug, PartialEq)]
enum Json {
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Array(Vec<Json>),
    Object(Vec<(String, Json)>),
}

fn parse_json(input: &str) -> Option<Json> {
    struct Parser<'a> {
        input: &'a [u8],
        pos: usize,
    }

    impl Parser<'_> {
        fn peek(&self) -> Option<u8> {
            self.input.get(self.pos).copied()
        }

        fn skip_ws(&mut self) {
            while matches!(self.peek(), Some(b' ' | b'\t' | b'\n' | b'\r')) {
                self.pos += 1;
            }
        }

        fn value(&mut self, depth: u32) -> Option<Json> {
            if depth > 64 {
                return None;
            }
            self.skip_ws();
            match self.peek()? {
                b'{' => self.object(depth),
                b'[' => self.array(depth),
                b'"' => self.string().map(Json::String),
                b't' => self.literal("true").map(|_| Json::Bool(true)),
                b'f' => self.literal("false").map(|_| Json::Bool(false)),
                b'n' => self.literal("null").map(|_| Json::Null),
                _ => self.number().map(Json::Number),
            }
        }

        fn literal(&mut self, word: &str) -> Option<()> {
            if self.input[self.pos..].starts_with(word.as_bytes()) {
                self.pos += word.len();
                Some(())
            } else {
                None
            }
        }

        fn number(&mut self) -> Option<f64> {
            let start = self.pos;
            while matches!(
                self.peek(),
                Some(b'-' | b'+' | b'0'..=b'9' | b'.' | b'e' | b'E')
            ) {
                self.pos += 1;
            }
            std::str::from_utf8(self.input.get(start..self.pos)?)
                .ok()?
                .parse()
                .ok()
        }

        fn string(&mut self) -> Option<String> {
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
                        match self.peek()? {
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
                                    if self.peek() != Some(b'\\') {
                                        return None;
                                    }
                                    self.pos += 1;
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
                        self.pos += 1;
                    }
                    _ => {
                        let rest = std::str::from_utf8(self.input.get(self.pos..)?).ok()?;
                        let ch = rest.chars().next()?;
                        out.push(ch);
                        self.pos += ch.len_utf8();
                    }
                }
            }
        }

        fn hex4(&mut self) -> Option<u32> {
            if self.peek() != Some(b'u') {
                return None;
            }
            let digits = self.input.get(self.pos + 1..self.pos + 5)?;
            if digits.len() != 4 || !digits.iter().all(u8::is_ascii_hexdigit) {
                return None;
            }
            let value = u32::from_str_radix(std::str::from_utf8(digits).ok()?, 16).ok()?;
            self.pos += 5;
            Some(value)
        }

        fn array(&mut self, depth: u32) -> Option<Json> {
            self.pos += 1;
            let mut items = Vec::new();
            self.skip_ws();
            if self.peek() == Some(b']') {
                self.pos += 1;
                return Some(Json::Array(items));
            }
            loop {
                items.push(self.value(depth + 1)?);
                self.skip_ws();
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

        fn object(&mut self, depth: u32) -> Option<Json> {
            self.pos += 1;
            let mut fields = Vec::new();
            self.skip_ws();
            if self.peek() == Some(b'}') {
                self.pos += 1;
                return Some(Json::Object(fields));
            }
            loop {
                self.skip_ws();
                let key = self.string()?;
                self.skip_ws();
                if self.peek() != Some(b':') {
                    return None;
                }
                self.pos += 1;
                let value = self.value(depth + 1)?;
                fields.push((key, value));
                self.skip_ws();
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

    let mut parser = Parser {
        input: input.as_bytes(),
        pos: 0,
    };
    let value = parser.value(0)?;
    parser.skip_ws();
    (parser.pos == input.len()).then_some(value)
}

/// The parsed `notices` JSON (malformed entries are skipped, as the
/// element's `#notices` did).
fn parse_notices(raw: Option<&str>) -> Vec<Notice> {
    let Some(raw) = raw.filter(|v| !v.is_empty()) else {
        return Vec::new();
    };
    let Some(Json::Array(items)) = parse_json(raw) else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|item| {
            let Json::Object(fields) = item else {
                return None;
            };
            let field = |name: &str| {
                fields
                    .iter()
                    .find(|(key, _)| key == name)
                    .map(|(_, value)| value)
            };
            let id = match field("id") {
                Some(Json::String(id)) => id.clone(),
                Some(Json::Number(id)) => id.to_string(),
                _ => return None,
            };
            let title = match field("title") {
                Some(Json::String(title)) if !title.is_empty() => title.clone(),
                _ => return None,
            };
            let message = match field("message") {
                Some(Json::String(message)) if !message.is_empty() => Some(message.clone()),
                _ => None,
            };
            let created_at = match field("createdAt") {
                Some(Json::Number(at)) if at.is_finite() => *at,
                _ => 0.0,
            };
            Some(Notice {
                id,
                tone: NoticeTone::parse(field("tone")),
                title,
                message,
                created_at,
            })
        })
        .collect()
}

/// The current Unix time in ms, on either target.
#[cfg(target_arch = "wasm32")]
fn now_ms() -> f64 {
    js_sys::Date::now()
}

/// The current Unix time in ms, on either target.
#[cfg(not(target_arch = "wasm32"))]
fn now_ms() -> f64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|since| since.as_secs_f64() * 1000.0)
        .unwrap_or(0.0)
}

/// Localised "5 minutes ago" style phrase (the element's `#time`).
fn relative_time(
    created_at: f64,
    now: f64,
    just_now: &str,
    minutes_ago: &str,
    hours_ago: &str,
    days_ago: &str,
) -> String {
    let minutes = ((now - created_at).max(0.0) / 60000.0).floor() as u64;
    if minutes < 1 {
        return just_now.to_string();
    }
    if minutes < 60 {
        return minutes_ago.replace("{count}", &minutes.to_string());
    }
    let hours = minutes / 60;
    if hours < 24 {
        return hours_ago.replace("{count}", &hours.to_string());
    }
    days_ago.replace("{count}", &(hours / 24).to_string())
}

/// The tone glyph of one entry (the element's lucide paths).
fn tone_paths(tone: NoticeTone) -> Element {
    match tone {
        NoticeTone::Success => rsx! {
            path {
                class: "ty-notification-center__glyph",
                "d": Some("M21.801 10A10 10 0 1 1 17 3.335"),
            }
            path {
                class: "ty-notification-center__glyph",
                "d": Some("m9 11 3 3L22 4"),
            }
        },
        NoticeTone::Error => rsx! {
            circle {
                class: "ty-notification-center__glyph",
                "cx": Some("12"),
                "cy": Some("12"),
                "r": Some("10"),
            }
            line {
                class: "ty-notification-center__glyph",
                "x1": Some("12"),
                "x2": Some("12"),
                "y1": Some("8"),
                "y2": Some("12"),
            }
            line {
                class: "ty-notification-center__glyph",
                "x1": Some("12"),
                "x2": Some("12.01"),
                "y1": Some("16"),
                "y2": Some("16"),
            }
        },
        NoticeTone::Warning => rsx! {
            path {
                class: "ty-notification-center__glyph",
                "d": Some("m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"),
            }
            path {
                class: "ty-notification-center__glyph",
                "d": Some("M12 9v4"),
            }
            path {
                class: "ty-notification-center__glyph",
                "d": Some("M12 17h.01"),
            }
        },
        NoticeTone::Info => rsx! {
            circle {
                class: "ty-notification-center__glyph",
                "cx": Some("12"),
                "cy": Some("12"),
                "r": Some("10"),
            }
            path {
                class: "ty-notification-center__glyph",
                "d": Some("M12 16v-4"),
            }
            path {
                class: "ty-notification-center__glyph",
                "d": Some("M12 8h.01"),
            }
        },
    }
}

/// The element asks the host to change visibility; the host flips `open`.
fn request_open(handler: Option<EventHandler<NotificationCenterOpenChange>>, next: bool) {
    if let Some(handler) = handler {
        handler.call(NotificationCenterOpenChange { open: next });
    }
}

/// Bell button with an unseen count and the session's notification history in a modal drawer (review, dismiss one, clear all). The host owns the history and feeds it through `notices` (JSON, newest first); the element composes the badge and the entries, asks to open or close with `ty-open-change` (controlled: the host flips `open`), and reports a dismiss (`ty-dismiss`) or a clear (`ty-clear`) so the host can update its own state. Focus moves into the drawer on open, is trapped while open, Escape asks to close, and focus returns to the bell; after a dismissal focus lands on the next entry's dismiss button (or the previous one, or the heading when the list became empty).
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyNotificationCenter(
    /// Drawer shown (controlled). The anatomy stays mounted but `hidden` while closed, so nothing reaches the accessibility tree.
    #[props(default)]
    open: bool,
    /// The history as a JSON array, newest first: `[{ "id", "tone", "title", "message"?, "createdAt" }]`, `tone` one of `success`/`error`/`warning`/`info`, `createdAt` a Unix ms timestamp. Left unset (not `"[]"`) while the history is empty. The element renders at most `historyLimit` entries; it never raises toasts itself — the same call that shows a toast feeds this list.
    #[props(into)]
    notices: Option<String>,
    /// Cap of the rendered history (the newest survive).
    #[props(default = 50.0f64)]
    history_limit: f64,
    /// Accessible name of the bell; with unseen entries the `unreadLabel` phrase is appended.
    #[props(into, default = String::from("Notifications"))]
    bell_label: String,
    /// Unseen phrase appended to the bell name and carried by the badge; `{count}` is replaced.
    #[props(into, default = String::from("{count} unread"))]
    unread_label: String,
    /// Heading of the drawer; also its accessible name (aria-labelledby).
    #[props(into, default = String::from("Notifications"))]
    title_label: String,
    /// Name of the clear-all button (shown only with entries).
    #[props(into, default = String::from("Clear all"))]
    clear_all_label: String,
    /// Accessible name of the close button.
    #[props(into, default = String::from("Close"))]
    close_label: String,
    /// Accessible name of an entry's dismiss button; `{title}` is replaced by the entry's title.
    #[props(into, default = String::from("Dismiss, {title}"))]
    dismiss_label: String,
    /// The empty view's sentence.
    #[props(into, default = String::from("There are no notifications in this session."))]
    empty_label: String,
    /// Announced politely after clear all (no confirmation: history only).
    #[props(into, default = String::from("Notifications cleared"))]
    cleared_label: String,
    /// Tone word of a success entry.
    #[props(into, default = String::from("Success"))]
    tone_success: String,
    /// Tone word of an error entry.
    #[props(into, default = String::from("Error"))]
    tone_error: String,
    /// Tone word of a warning entry.
    #[props(into, default = String::from("Warning"))]
    tone_warning: String,
    /// Tone word of an information entry.
    #[props(into, default = String::from("Information"))]
    tone_info: String,
    /// Relative time of an entry less than a minute old.
    #[props(into, default = String::from("just now"))]
    time_just_now: String,
    /// Relative time of an entry minutes old; `{count}` is replaced.
    #[props(into, default = String::from("{count} minutes ago"))]
    time_minutes_ago: String,
    /// Relative time of an entry hours old; `{count}` is replaced.
    #[props(into, default = String::from("{count} hours ago"))]
    time_hours_ago: String,
    /// Relative time of an entry days old; `{count}` is replaced.
    #[props(into, default = String::from("{count} days ago"))]
    time_days_ago: String,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The element asks the host to change visibility — `open: true` on a bell press, `open: false` on Escape, the close button, a backdrop press or a second bell press. Controlled: the element does not toggle itself; the host flips `open`.
    on_open_change: Option<EventHandler<NotificationCenterOpenChange>>,
    /// An entry's dismiss button was pressed. The element drops the entry from its rendered history at once; the host removes it from its own state.
    on_dismiss: Option<EventHandler<NotificationCenterDismiss>>,
    /// Clear all was pressed (no confirmation: history only). The element empties its rendered history and announces the `clearedLabel` politely; the host clears its own state.
    on_clear: Option<EventHandler<()>>,
) -> Element {
    let instance = use_instance_id(instance);

    // The removal ledger the element kept in fields: entries dismissed or
    // cleared here are dropped from the rendered history at once, waiting
    // for the host's next `notices`.
    let mut removed = use_signal(Vec::<String>::new);
    let mut cleared_at = use_signal(|| f64::NEG_INFINITY);
    // When the drawer last opened: entries created later are unseen.
    let mut seen_at = use_signal(|| f64::NEG_INFINITY);
    // Opening marks everything seen; `open` itself stays controlled.
    let mut was_open = use_signal(|| false);
    if open != *was_open.peek() {
        was_open.set(open);
        if open {
            seen_at.set(now_ms());
        }
    }

    let limit = if history_limit.is_finite() && history_limit >= 0.0 {
        history_limit.floor() as usize
    } else {
        50
    };
    let dismissed = removed();
    let cleared = cleared_at();
    let entries: Vec<Notice> = parse_notices(notices.as_deref())
        .into_iter()
        .filter(|entry| entry.created_at > cleared && !dismissed.contains(&entry.id))
        .take(limit)
        .collect();
    let has_entries = !entries.is_empty();
    // Entries created since the drawer last opened; none while it is open.
    let unseen = if open {
        0
    } else {
        entries
            .iter()
            .filter(|entry| entry.created_at > *seen_at.peek())
            .count()
    };

    // The badge flashes when the unseen count rises.
    let mut last_unseen = use_signal(|| None::<usize>);
    let mut badge_changed = use_signal(|| false);
    if *last_unseen.peek() != Some(unseen) {
        if last_unseen.peek().is_some_and(|previous| unseen > previous) {
            badge_changed.set(true);
        }
        last_unseen.set(Some(unseen));
    }

    let unread_phrase = unread_label.replace("{count}", &unseen.to_string());
    let bell_name = if unseen > 0 {
        format!("{bell_label}, {unread_phrase}")
    } else {
        bell_label.clone()
    };

    let status = use_signal(String::new);
    // Dismiss index to focus after the render it triggered (-1: the heading).
    let mut pending_focus = use_signal(|| None::<isize>);
    let mut press_on_backdrop = use_signal(|| false);

    let mut host = use_signal(|| None::<Rc<MountedData>>);
    wasm::follow_open(host, was_open);
    wasm::follow_pending_focus(host, pending_focus);

    rsx! {
        ty-notification-center {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "open": open.then_some("true"),
            "notices": notices.as_deref().filter(|v| !v.is_empty()),
            "history-limit": Some(history_limit.to_string()),
            "bell-label": (!bell_label.is_empty()).then_some(bell_label.as_str()),
            "unread-label": (!unread_label.is_empty()).then_some(unread_label.as_str()),
            "title-label": (!title_label.is_empty()).then_some(title_label.as_str()),
            "clear-all-label": (!clear_all_label.is_empty()).then_some(clear_all_label.as_str()),
            "close-label": (!close_label.is_empty()).then_some(close_label.as_str()),
            "dismiss-label": (!dismiss_label.is_empty()).then_some(dismiss_label.as_str()),
            "empty-label": (!empty_label.is_empty()).then_some(empty_label.as_str()),
            "cleared-label": (!cleared_label.is_empty()).then_some(cleared_label.as_str()),
            "tone-success": (!tone_success.is_empty()).then_some(tone_success.as_str()),
            "tone-error": (!tone_error.is_empty()).then_some(tone_error.as_str()),
            "tone-warning": (!tone_warning.is_empty()).then_some(tone_warning.as_str()),
            "tone-info": (!tone_info.is_empty()).then_some(tone_info.as_str()),
            "time-just-now": (!time_just_now.is_empty()).then_some(time_just_now.as_str()),
            "time-minutes-ago": (!time_minutes_ago.is_empty()).then_some(time_minutes_ago.as_str()),
            "time-hours-ago": (!time_hours_ago.is_empty()).then_some(time_hours_ago.as_str()),
            "time-days-ago": (!time_days_ago.is_empty()).then_some(time_days_ago.as_str()),
            onmounted: move |event: MountedEvent| host.set(Some(event.data())),
            onkeydown: move |event: KeyboardEvent| {
                let key = event.key();
                if key == Key::Escape {
                    if event.is_composing() || !open {
                        return;
                    }
                    event.prevent_default();
                    event.stop_propagation();
                    request_open(on_open_change, false);
                    return;
                }
                if key != Key::Tab || !open {
                    return;
                }
                event.prevent_default();
                event.stop_propagation();
                wasm::cycle_focus(host, event.modifiers().shift());
            },
            span {
                class: "ty-notification-center",
                span {
                    class: "ty-notification-center__bell",
                    button {
                        class: "ty-button ty-notification-center__trigger",
                        "type": Some("button"),
                        "aria-label": (!bell_name.is_empty()).then_some(bell_name.as_str()),
                        "aria-haspopup": Some("dialog"),
                        "aria-expanded": (open).then_some("true"),
                        "aria-controls": Some(format!("{instance}-dialog")),
                        "data-variant": Some("quiet"),
                        "data-icon-only": Some(""),
                        onclick: move |_| request_open(on_open_change, !open),
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
                                path {
                                    class: "ty-notification-center__glyph",
                                    "d": Some("M10.268 21a2 2 0 0 0 3.464 0"),
                                }
                                path {
                                    class: "ty-notification-center__glyph",
                                    "d": Some("M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"),
                                }
                            }
                        }
                    }
                    if unseen > 0 {
                        span {
                            class: "ty-count-badge",
                            "data-tone": Some("attention"),
                            "data-changed": badge_changed().then_some(""),
                            onanimationend: move |_| badge_changed.set(false),
                            span {
                                class: "ty-count-badge__value",
                                "aria-hidden": Some("true"),
                                {if unseen > 99 { String::from("99+") } else { unseen.to_string() }}
                            }
                            span {
                                class: "ty-visually-hidden",
                                {unread_phrase.clone()}
                            }
                        }
                    }
                }
                div {
                    class: "ty-notification-center__backdrop",
                    "hidden": if !(open) { Some("true") } else { None },
                    onmousedown: move |event: MouseEvent| {
                        press_on_backdrop.set(true);
                        // Keep focus inside the dialog: a press on the
                        // backdrop must not move focus to the body.
                        event.prevent_default();
                    },
                    onclick: move |_| {
                        if *press_on_backdrop.peek() {
                            request_open(on_open_change, false);
                        }
                        press_on_backdrop.set(false);
                    },
                    onanimationend: move |_| wasm::clear_entering(host),
                    div {
                        class: "ty-notification-center__drawer",
                        onmousedown: move |event: MouseEvent| event.stop_propagation(),
                        onclick: move |event: MouseEvent| event.stop_propagation(),
                        onanimationend: move |_| wasm::clear_entering(host),
                        div {
                            class: "ty-notification-center__dialog",
                            "role": Some("dialog"),
                            "aria-modal": Some("true"),
                            "tabindex": Some("-1"),
                            "id": Some(format!("{instance}-dialog")),
                            "aria-labelledby": Some(format!("{instance}-title")),
                            header {
                                class: "ty-notification-center__head",
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
                                    path {
                                        class: "ty-notification-center__glyph",
                                        "d": Some("M10.268 21a2 2 0 0 0 3.464 0"),
                                    }
                                    path {
                                        class: "ty-notification-center__glyph",
                                        "d": Some("M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"),
                                    }
                                }
                                h2 {
                                    class: "ty-notification-center__heading",
                                    "id": Some(format!("{instance}-title")),
                                    "tabindex": Some("-1"),
                                    {title_label.clone()}
                                }
                                button {
                                    class: "ty-button ty-notification-center__clear",
                                    "type": Some("button"),
                                    "hidden": if !has_entries { Some("true") } else { None },
                                    "data-variant": Some("quiet"),
                                    "data-size": Some("compact"),
                                    onclick: move |_| {
                                        cleared_at.set(now_ms());
                                        removed.write().clear();
                                        if let Some(handler) = on_clear {
                                            handler.call(());
                                        }
                                        pending_focus.set(Some(-1));
                                        wasm::announce(status, cleared_label.clone());
                                    },
                                    {clear_all_label.clone()}
                                }
                                button {
                                    class: "ty-button ty-notification-center__close",
                                    "type": Some("button"),
                                    "aria-label": (!close_label.is_empty()).then_some(close_label.as_str()),
                                    "title": (!close_label.is_empty()).then_some(close_label.as_str()),
                                    "data-variant": Some("quiet"),
                                    "data-size": Some("compact"),
                                    "data-shape": Some("circle"),
                                    "data-icon-only": Some(""),
                                    onclick: move |_| request_open(on_open_change, false),
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
                                            path {
                                                class: "ty-notification-center__glyph",
                                                "d": Some("M18 6 6 18"),
                                            }
                                            path {
                                                class: "ty-notification-center__glyph",
                                                "d": Some("m6 6 12 12"),
                                            }
                                        }
                                    }
                                }
                            }
                            div {
                                class: "ty-notification-center__empty",
                                "hidden": if has_entries { Some("true") } else { None },
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
                                    path {
                                        class: "ty-notification-center__glyph",
                                        "d": Some("M10.268 21a2 2 0 0 0 3.464 0"),
                                    }
                                    path {
                                        class: "ty-notification-center__glyph",
                                        "d": Some("M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742"),
                                    }
                                    path {
                                        class: "ty-notification-center__glyph",
                                        "d": Some("m2 2 20 20"),
                                    }
                                    path {
                                        class: "ty-notification-center__glyph",
                                        "d": Some("M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05"),
                                    }
                                }
                                p {
                                    class: "ty-notification-center__empty-text",
                                    {empty_label.clone()}
                                }
                            }
                            ul {
                                class: "ty-notification-center__list",
                                "hidden": if !has_entries { Some("true") } else { None },
                                for (index, entry) in entries.iter().enumerate() {
                                    li {
                                        key: "{entry.id}",
                                        class: "ty-notification-center__entry",
                                        "data-tone": Some(entry.tone.as_str()),
                                        svg {
                                            class: "ty-icon ty-notification-center__glyph",
                                            "viewBox": Some("0 0 24 24"),
                                            "fill": Some("none"),
                                            "stroke": Some("currentColor"),
                                            "stroke-width": Some("2"),
                                            "stroke-linecap": Some("round"),
                                            "stroke-linejoin": Some("round"),
                                            "aria-hidden": Some("true"),
                                            "focusable": Some("false"),
                                            {tone_paths(entry.tone)}
                                        }
                                        div {
                                            class: "ty-notification-center__text",
                                            p {
                                                class: "ty-notification-center__tone",
                                                {match entry.tone {
                                                    NoticeTone::Success => tone_success.clone(),
                                                    NoticeTone::Error => tone_error.clone(),
                                                    NoticeTone::Warning => tone_warning.clone(),
                                                    NoticeTone::Info => tone_info.clone(),
                                                }}
                                            }
                                            p {
                                                class: "ty-notification-center__title",
                                                {entry.title.clone()}
                                            }
                                            if let Some(message) = entry.message.clone() {
                                                p {
                                                    class: "ty-notification-center__message",
                                                    {message}
                                                }
                                            }
                                            p {
                                                class: "ty-notification-center__time",
                                                {relative_time(
                                                    entry.created_at,
                                                    now_ms(),
                                                    &time_just_now,
                                                    &time_minutes_ago,
                                                    &time_hours_ago,
                                                    &time_days_ago,
                                                )}
                                            }
                                        }
                                        button {
                                            class: "ty-button ty-notification-center__dismiss",
                                            "type": Some("button"),
                                            "aria-label": Some(dismiss_label.replace("{title}", &entry.title)),
                                            "data-variant": Some("quiet"),
                                            "data-size": Some("compact"),
                                            "data-shape": Some("circle"),
                                            "data-icon-only": Some(""),
                                            onclick: {
                                                let entry_id = entry.id.clone();
                                                move |_| {
                                                    removed.write().push(entry_id.clone());
                                                    if let Some(handler) = on_dismiss {
                                                        handler.call(NotificationCenterDismiss { id: entry_id.clone() });
                                                    }
                                                    pending_focus.set(Some(index as isize));
                                                }
                                            },
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
                                                    path {
                                                        class: "ty-notification-center__glyph",
                                                        "d": Some("M18 6 6 18"),
                                                    }
                                                    path {
                                                        class: "ty-notification-center__glyph",
                                                        "d": Some("m6 6 12 12"),
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                span {
                    class: "ty-visually-hidden ty-notification-center__status",
                    "role": Some("status"),
                    {status()}
                }
            }
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    pub fn follow_open(_host: Signal<Option<Rc<MountedData>>>, _was_open: Signal<bool>) {}

    pub fn follow_pending_focus(
        _host: Signal<Option<Rc<MountedData>>>,
        _pending: Signal<Option<isize>>,
    ) {
    }

    pub fn cycle_focus(_host: Signal<Option<Rc<MountedData>>>, _backwards: bool) {}

    pub fn clear_entering(_host: Signal<Option<Rc<MountedData>>>) {}

    pub fn announce(mut status: Signal<String>, text: String) {
        status.set(text);
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::cell::{Cell, RefCell};
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    /// Elements that may take keyboard focus inside the dialog.
    const FOCUSABLE: &str = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

    /// Marker of the elements this component made inert (a host's own inert is left alone).
    const INERT_MARK: &str = "data-ty-notification-center-inert";

    thread_local! {
        /// Open drawers share one page scroll lock; the last one to close releases it.
        static SCROLL_LOCKS: Cell<u32> = const { Cell::new(0) };
    }

    /// The modal contract, driven by the controlled `open`: on open, lock the
    /// page scroll, inert the page behind, move focus into the drawer and
    /// play the entering animation after the first frame; on close, undo it
    /// all and return focus to the bell (or to what had it, if that was
    /// outside). Unmounting releases the page like a close did.
    pub fn follow_open(host: Signal<Option<Rc<MountedData>>>, was_open: Signal<bool>) {
        struct Modal {
            return_focus: Option<web_sys::Element>,
            inerted: Vec<web_sys::Element>,
            was_open: bool,
        }

        impl Modal {
            fn deactivate(&mut self, restore_focus: bool) {
                if !self.was_open {
                    return;
                }
                self.was_open = false;
                unlock_scroll();
                for element in self.inerted.drain(..) {
                    if element.has_attribute(INERT_MARK) {
                        let _ = element.remove_attribute("inert");
                        let _ = element.remove_attribute(INERT_MARK);
                    }
                }
                let target = self.return_focus.take();
                if restore_focus && target.as_ref().is_some_and(|t| t.is_connected()) {
                    if let Some(target) = target {
                        after_frame(move || {
                            if target.is_connected() {
                                if let Some(html) = target.dyn_ref::<web_sys::HtmlElement>() {
                                    let _ = html.focus();
                                }
                            }
                        });
                    }
                }
            }
        }

        impl Drop for Modal {
            fn drop(&mut self) {
                self.deactivate(true);
            }
        }

        let modal = use_signal(|| {
            Rc::new(RefCell::new(Modal {
                return_focus: None,
                inerted: Vec::new(),
                was_open: false,
            }))
        });
        use_effect(move || {
            let open = was_open();
            let Some(element) = host_element(host) else { return };
            let guard = modal.peek();
            let mut state = guard.borrow_mut();
            if open == state.was_open {
                return;
            }
            if !open {
                state.deactivate(true);
                return;
            }
            state.was_open = true;
            // Focus returns to what had it, if that was outside the drawer.
            let active = document().and_then(|doc| doc.active_element());
            state.return_focus = match active {
                Some(active) if !contains(&element, &active) => Some(active),
                _ => element
                    .query_selector(".ty-notification-center__trigger")
                    .ok()
                    .flatten(),
            };
            lock_scroll();
            state.inerted = apply_inert(&element);
            // The anatomy may land a beat after the `open` attribute, so
            // focus and the entering animation wait a frame, as the element's
            // requestAnimationFrame did.
            let host = element.clone();
            after_frame(move || {
                if !host.is_connected() || !host.has_attribute("open") {
                    return;
                }
                focus_initial(&host);
                if let Ok(parts) = host.query_selector_all(
                    ".ty-notification-center__backdrop, .ty-notification-center__drawer",
                ) {
                    for index in 0..parts.length() {
                        if let Some(part) = element_at(&parts, index) {
                            let _ = part.set_attribute("data-entering", "");
                        }
                    }
                }
            });
        });
    }

    /// Focus after a dismissal (the next entry's dismiss button, else the
    /// previous one, else the heading) and after clear all (the heading),
    /// run once the recomposed list is on the DOM.
    pub fn follow_pending_focus(
        host: Signal<Option<Rc<MountedData>>>,
        mut pending: Signal<Option<isize>>,
    ) {
        use_effect(move || {
            let Some(index) = pending() else { return };
            pending.set(None);
            let Some(element) = host_element(host) else { return };
            let dismiss = if index >= 0 {
                element
                    .query_selector(".ty-notification-center__list")
                    .ok()
                    .flatten()
                    .and_then(|list| {
                        let children = list.children();
                        let last = children.length().saturating_sub(1);
                        children.item((index as u32).min(last)).and_then(|li| {
                            li.query_selector(".ty-notification-center__dismiss")
                                .ok()
                                .flatten()
                        })
                    })
            } else {
                None
            };
            let target = dismiss.or_else(|| {
                element
                    .query_selector(".ty-notification-center__heading")
                    .ok()
                    .flatten()
            });
            if let Some(html) = target.and_then(|t| t.dyn_into::<web_sys::HtmlElement>().ok()) {
                let _ = html.focus();
            }
        });
    }

    /// Tab wraps around the dialog's tabbables (the trap).
    pub fn cycle_focus(host: Signal<Option<Rc<MountedData>>>, backwards: bool) {
        let Some(element) = host_element(host) else { return };
        let Ok(Some(dialog)) = element.query_selector(".ty-notification-center__dialog") else {
            return;
        };
        let tabbables = tabbables(&dialog);
        if tabbables.is_empty() {
            if let Some(html) = dialog.dyn_ref::<web_sys::HtmlElement>() {
                let _ = html.focus();
            }
            return;
        }
        let active = document().and_then(|doc| doc.active_element());
        let current = active
            .and_then(|active| tabbables.iter().position(|node| node.is_same_node(Some(&active))));
        let next = match current {
            None => {
                if backwards {
                    tabbables.len() - 1
                } else {
                    0
                }
            }
            Some(current) => {
                (current as isize + if backwards { -1 } else { 1 })
                    .rem_euclid(tabbables.len() as isize) as usize
            }
        };
        if let Some(html) = tabbables[next].dyn_ref::<web_sys::HtmlElement>() {
            let _ = html.focus();
        }
    }

    /// The entering animation ended; the marker goes away, as the element's
    /// animationend listener did.
    pub fn clear_entering(host: Signal<Option<Rc<MountedData>>>) {
        let Some(element) = host_element(host) else { return };
        if let Ok(parts) = element.query_selector_all(
            ".ty-notification-center__backdrop, .ty-notification-center__drawer",
        ) {
            for index in 0..parts.length() {
                if let Some(part) = element_at(&parts, index) {
                    let _ = part.remove_attribute("data-entering");
                }
            }
        }
    }

    /// A fresh text node makes screen readers repeat an identical message:
    /// empty the status, then set the phrase after a task, as the element's
    /// queueMicrotask did.
    pub fn announce(mut status: Signal<String>, text: String) {
        status.set(String::new());
        let window = web_sys::window().expect("window");
        let tick = Closure::<dyn FnMut()>::once(move || status.set(text));
        let _ = window
            .set_timeout_with_callback_and_timeout_and_arguments_0(tick.as_ref().unchecked_ref(), 0);
        tick.forget();
    }

    fn document() -> Option<web_sys::Document> {
        web_sys::window().and_then(|window| window.document())
    }

    fn lock_scroll() {
        SCROLL_LOCKS.with(|locks| {
            let count = locks.get() + 1;
            locks.set(count);
            if count == 1 {
                if let Some(root) = document().and_then(|doc| doc.document_element()) {
                    let _ = root.set_attribute("data-ty-notification-center-open", "");
                }
            }
        });
    }

    fn unlock_scroll() {
        SCROLL_LOCKS.with(|locks| {
            let count = locks.get();
            if count == 0 {
                return;
            }
            locks.set(count - 1);
            if count == 1 {
                if let Some(root) = document().and_then(|doc| doc.document_element()) {
                    let _ = root.remove_attribute("data-ty-notification-center-open");
                }
            }
        });
    }

    /// Whether `ancestor` is `node` or one of its ancestors.
    fn contains(ancestor: &web_sys::Element, node: &web_sys::Element) -> bool {
        let mut current = Some(node.clone());
        while let Some(element) = current {
            if ancestor.is_same_node(Some(&element)) {
                return true;
            }
            current = element.parent_element();
        }
        false
    }

    /// Everything between the host and `<body>` gets inert siblings.
    fn apply_inert(host: &web_sys::Element) -> Vec<web_sys::Element> {
        let body: Option<web_sys::Element> = document().and_then(|doc| doc.body()).map(Into::into);
        let mut inerted = Vec::new();
        let mut node = Some(host.clone());
        while let Some(current) = node {
            if body
                .as_ref()
                .is_some_and(|body| body.is_same_node(Some(&current)))
            {
                break;
            }
            let Some(parent) = current.parent_element() else {
                break;
            };
            let children = parent.children();
            for index in 0..children.length() {
                let Some(sibling) = children.item(index) else {
                    continue;
                };
                if sibling.is_same_node(Some(&current)) || sibling.has_attribute("inert") {
                    continue;
                }
                let _ = sibling.set_attribute("inert", "");
                let _ = sibling.set_attribute(INERT_MARK, "");
                inerted.push(sibling);
            }
            node = Some(parent);
        }
        inerted
    }

    /// The dialog's tabbables, skipping anything inside a `hidden` part.
    fn tabbables(dialog: &web_sys::Element) -> Vec<web_sys::Element> {
        let Ok(nodes) = dialog.query_selector_all(FOCUSABLE) else {
            return Vec::new();
        };
        let mut out = Vec::new();
        for index in 0..nodes.length() {
            if let Some(node) = element_at(&nodes, index) {
                if node.closest("[hidden]").ok().flatten().is_none() {
                    out.push(node);
                }
            }
        }
        out
    }

    /// A NodeList entry as an element (query results always are).
    fn element_at(nodes: &web_sys::NodeList, index: u32) -> Option<web_sys::Element> {
        nodes
            .item(index)
            .and_then(|node| node.dyn_into::<web_sys::Element>().ok())
    }

    fn focus_initial(host: &web_sys::Element) {
        let Ok(Some(dialog)) = host.query_selector(".ty-notification-center__dialog") else {
            return;
        };
        if let Some(active) = document().and_then(|doc| doc.active_element()) {
            if contains(&dialog, &active) {
                return;
            }
        }
        let tabbables = tabbables(&dialog);
        let target = tabbables
            .first()
            .cloned()
            .or_else(|| {
                host.query_selector(".ty-notification-center__heading")
                    .ok()
                    .flatten()
            })
            .unwrap_or(dialog);
        if let Some(html) = target.dyn_ref::<web_sys::HtmlElement>() {
            let _ = html.focus();
        }
    }

    fn after_frame(f: impl FnOnce() + 'static) {
        let window = web_sys::window().expect("window");
        let frame = Closure::<dyn FnMut()>::once(f);
        let _ = window.request_animation_frame(frame.as_ref().unchecked_ref());
        frame.forget();
    }

    fn host_element(host: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        host()?.downcast::<web_sys::Element>().cloned()
    }
}
