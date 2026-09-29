//! Native port of `<ty-command-palette>`: the global "jump to anything"
//! dialog. Where the custom element built the `<dialog>` and composed the
//! rows by hand on each open, the port parses the `groups` / `scopes` /
//! `fallback-actions` JSON in Rust (a small tolerant reader, as the other
//! ports use) and composes the anatomy declaratively in `rsx!`, so SSR
//! carries the opened palette too. The element's behaviour is kept: the
//! subsequence fuzzy match over label, description, keywords and group
//! heading (contiguous runs, word starts and early positions ranking
//! higher, only label matches marked), the recents section on an empty
//! query, the actions sub-list, the fallback actions with `{query}`
//! replaced, the scope chip and column, the stepped-back Escape (sub-list,
//! then scope, then close), Tab scope activation, Backspace scope removal,
//! RTL-mirrored inline keys, and the reset of query, highlight and
//! sub-list on each open. The modal itself is the element's native
//! `<dialog>`: `showModal` puts it in the top layer with the page inert and
//! Escape cancelling, so no manual inert or scroll lock is needed; what
//! still needs the live DOM (`showModal`, the initial focus, the focus
//! return, the cancel listener, scrolling the highlight into view, the
//! reading direction and the localStorage recents store) lives in
//! `mod wasm`, cfg-gated with a no-op twin. Closing stays controlled: a
//! choice, a press outside or the final Escape is reported with
//! `on_close` and the host flips `open`, as the element asked with
//! `ty-close`. Not ported: the grapheme segmentation and NFKD diacritic
//! folding of the TypeScript matcher (Rust's std has no ICU; the port
//! matches char by char on lowercased text, so accented or composed input
//! still matches only itself) and the locale-sensitive word breaks and
//! lower-casing (word starts follow alphanumeric boundaries instead).

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// A row was chosen: an item (`kind: "item"`, `id` the item id), a secondary action (`kind: "action"`, `id` the action id, `itemId` its item) or a fallback action (`kind: "fallback"`). `itemId` is empty except for actions. The palette then closes itself and asks the host with `ty-close`.
#[derive(Clone, Debug, PartialEq)]
pub struct CommandPaletteSelect {
    pub id: String,
    pub kind: String,
    pub item_id: String,
}

/// The active scope changed (a scope button, the chip, Tab or Backspace); `scope` is the scope id, empty when cleared. The element reflects it to the `active-scope` attribute.
#[derive(Clone, Debug, PartialEq)]
pub struct CommandPaletteScopeChange {
    pub scope: String,
}

/// A secondary or fallback action, as the `groups` / `fallback-actions` JSON carries it.
#[derive(Clone, Debug, PartialEq)]
struct CommandAction {
    id: String,
    label: String,
    icon: Option<String>,
    /// SVG path data (24×24, subpaths separated by " | "); wins over `icon`.
    icon_path: Option<String>,
    shortcut: Option<String>,
}

/// One command row, as the `groups` JSON carries it.
#[derive(Clone, Debug, PartialEq)]
struct CommandItem {
    id: String,
    label: String,
    description: Option<String>,
    icon: Option<String>,
    /// SVG path data (24×24, subpaths separated by " | "); wins over `icon`.
    icon_path: Option<String>,
    keywords: Vec<String>,
    hint: Option<String>,
    shortcut: Option<String>,
    scope_id: Option<String>,
    actions: Vec<CommandAction>,
}

/// A group of commands, as the `groups` JSON carries it.
#[derive(Clone, Debug, PartialEq)]
struct CommandGroup {
    id: String,
    heading: String,
    scope_id: Option<String>,
    items: Vec<CommandItem>,
}

/// A scope, as the `scopes` JSON carries it.
#[derive(Clone, Debug, PartialEq)]
struct CommandScope {
    id: String,
    label: String,
    icon: Option<String>,
}

/// A remembered choice of the recent store.
#[derive(Clone, Debug, PartialEq)]
struct ChoiceStat {
    id: String,
    count: f64,
    at: f64,
}

/// Most chosen first; ties go to the most recent, as the element's `orderChoices`.
fn order_choices(stats: &[ChoiceStat]) -> Vec<ChoiceStat> {
    let mut ordered = stats.to_vec();
    ordered.sort_by(|x, y| {
        if x.count == y.count {
            y.at.total_cmp(&x.at)
        } else {
            y.count.total_cmp(&x.count)
        }
    });
    ordered
}

/// What a row is, reported as `ty-select`'s `kind` and carried on `data-kind`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum RowKind {
    Item,
    Action,
    Fallback,
}

impl RowKind {
    fn as_str(self) -> &'static str {
        match self {
            RowKind::Item => "item",
            RowKind::Action => "action",
            RowKind::Fallback => "fallback",
        }
    }
}

/// One row of the list: an item, a secondary action of the sub-list, or a fallback action.
#[derive(Clone, Debug, PartialEq)]
struct Row {
    /// DOM-safe option key, unique in the list.
    key: String,
    kind: RowKind,
    /// `ty-select` detail: the chosen item or action id.
    id: String,
    /// `ty-select` detail: the parent item of an action (empty otherwise).
    item_id: String,
    label: String,
    /// The label split into plain and marked pieces; empty for a plain label.
    pieces: Vec<(String, bool)>,
    description: Option<String>,
    icon: Option<String>,
    /// SVG path data (24×24, subpaths separated by " | "); wins over `icon`.
    icon_path: Option<String>,
    hint: Option<String>,
    shortcut: Option<String>,
    /// The item behind an `item` row (its actions open the sub-list).
    item: Option<CommandItem>,
    /// The row's index in the flat list (the highlight's coordinate).
    index: usize,
}

/// One headed section of the list.
#[derive(Clone, Debug, PartialEq)]
struct Section {
    key: String,
    heading: String,
    rows: Vec<Row>,
}

/// A scored item on its way into the filtered sections.
type Scored<'a> = ((&'a CommandGroup, &'a CommandItem), i64, Vec<(String, bool)>);

/// The sections to show: the sub-list, the empty-query view or the filtered
/// view — the element's `#sections`, with the global ranking rule (every
/// group's scored items compete on score; consecutive same-group items share
/// one headed section).
#[allow(clippy::too_many_arguments)]
fn build_sections(
    groups: &[CommandGroup],
    scope: Option<&str>,
    query: &str,
    sub: Option<&CommandItem>,
    recent: &[ChoiceStat],
    recent_visible: usize,
    fallback_actions: &[CommandAction],
    actions_for_label: &str,
    recent_label: &str,
    fallback_label: &str,
) -> Vec<Section> {
    let in_scope = |group: &CommandGroup, item: &CommandItem| {
        scope.is_none_or(|active| {
            item.scope_id
                .as_deref()
                .or(group.scope_id.as_deref())
                .unwrap_or(group.id.as_str())
                == active
        })
    };
    let item_row = |item: &CommandItem, prefix: &str, pieces: Vec<(String, bool)>| Row {
        key: format!("{prefix}{}", item.id),
        kind: RowKind::Item,
        id: item.id.clone(),
        item_id: String::new(),
        label: item.label.clone(),
        pieces,
        description: item.description.clone(),
        icon: item.icon.clone(),
        icon_path: item.icon_path.clone(),
        hint: item.hint.clone(),
        shortcut: item.shortcut.clone(),
        item: Some(item.clone()),
        index: 0,
    };
    if let Some(sub) = sub {
        return vec![Section {
            key: String::from("sub"),
            heading: actions_for_label.replace("{label}", &sub.label),
            rows: sub
                .actions
                .iter()
                .map(|action| Row {
                    key: format!("action-{}", action.id),
                    kind: RowKind::Action,
                    id: action.id.clone(),
                    item_id: sub.id.clone(),
                    label: action.label.clone(),
                    pieces: Vec::new(),
                    description: None,
                    icon: action.icon.clone(),
                    icon_path: action.icon_path.clone(),
                    hint: None,
                    shortcut: action.shortcut.clone(),
                    item: None,
                    index: 0,
                })
                .collect(),
        }];
    }
    let q = query.trim();
    let mut sections: Vec<Section> = Vec::new();
    if q.is_empty() {
        // The recents view looks items up by id over the in-scope items;
        // a repeated id keeps the later entry, as the element's `byId` map.
        let mut by_id: std::collections::HashMap<&str, &CommandItem> = std::collections::HashMap::new();
        for group in groups {
            for item in &group.items {
                if in_scope(group, item) {
                    by_id.insert(item.id.as_str(), item);
                }
            }
        }
        let recent_rows: Vec<Row> = order_choices(recent)
            .iter()
            .filter_map(|stat| by_id.get(stat.id.as_str()).copied())
            .take(recent_visible)
            .map(|item| item_row(item, "recent-", Vec::new()))
            .collect();
        if !recent_rows.is_empty() {
            sections.push(Section {
                key: String::from("recent"),
                heading: recent_label.to_string(),
                rows: recent_rows,
            });
        }
        for group in groups {
            let rows: Vec<Row> = group
                .items
                .iter()
                .filter(|item| in_scope(group, item))
                .map(|item| item_row(item, &format!("{}-", group.id), Vec::new()))
                .collect();
            if !rows.is_empty() {
                sections.push(Section {
                    key: group.id.clone(),
                    heading: group.heading.clone(),
                    rows,
                });
            }
        }
        return sections;
    }
    let mut scored: Vec<Scored<'_>> = groups
        .iter()
        .flat_map(|group| {
            group
                .items
                .iter()
                .filter(|item| in_scope(group, item))
                .filter_map(|item| {
                    score_item(q, item, &group.heading).map(|(score, pieces)| ((group, item), score, pieces))
                })
                .collect::<Vec<_>>()
        })
        .collect();
    scored.sort_by_key(|entry| std::cmp::Reverse(entry.1));
    for ((group, item), _, pieces) in scored {
        let row = item_row(item, &format!("{}-", group.id), pieces);
        if let Some(last) = sections.last_mut() {
            if last.key == group.id {
                last.rows.push(row);
                continue;
            }
        }
        sections.push(Section {
            key: group.id.clone(),
            heading: group.heading.clone(),
            rows: vec![row],
        });
    }
    if sections.is_empty() && !fallback_actions.is_empty() {
        sections.push(Section {
            key: String::from("fallback"),
            heading: fallback_label.to_string(),
            rows: fallback_actions
                .iter()
                .map(|action| Row {
                    key: format!("fallback-{}", action.id),
                    kind: RowKind::Fallback,
                    id: action.id.clone(),
                    item_id: String::new(),
                    label: action.label.replace("{query}", q),
                    pieces: Vec::new(),
                    description: None,
                    icon: action.icon.clone(),
                    icon_path: action.icon_path.clone(),
                    hint: None,
                    shortcut: action.shortcut.clone(),
                    item: None,
                    index: 0,
                })
                .collect(),
        });
    }
    sections
}

/// Option ids are DOM-safe (`recent-` / group / action prefixes plus the host's ids).
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

/// One user-perceived character: its folded form, its byte range in the
/// source text and whether it starts a word.
struct Unit {
    key: String,
    from: usize,
    to: usize,
    word_start: bool,
}

/// Folds one character for matching: lowercased (the element also stripped
/// optional diacritics through NFKD, which Rust's std cannot do).
fn fold(c: char) -> String {
    c.to_lowercase().collect()
}

/// Splits text into char units, marking the ones that start a word (index 0
/// or after a non-alphanumeric character, the element's no-segmenter fallback).
fn units_of(text: &str) -> Vec<Unit> {
    let mut units = Vec::new();
    let mut previous: Option<char> = None;
    for (from, c) in text.char_indices() {
        let word_start = previous.is_none_or(|p| !p.is_alphanumeric());
        units.push(Unit {
            key: fold(c),
            from,
            to: from + c.len_utf8(),
            word_start,
        });
        previous = Some(c);
    }
    units
}

/// The matched units as plain and marked pieces of the source text.
fn pieces_of(text: &str, units: &[Unit], picked: &[usize]) -> Vec<(String, bool)> {
    let mut out: Vec<(String, bool)> = Vec::new();
    for (index, unit) in units.iter().enumerate() {
        let marked = picked.contains(&index);
        let piece = &text[unit.from..unit.to];
        if let Some(last) = out.last_mut() {
            if last.1 == marked {
                last.0.push_str(piece);
                continue;
            }
        }
        out.push((piece.to_string(), marked));
    }
    out
}

/// In-order match of the query's characters in the text: contiguous runs
/// first (scoring `1000 + len*12 + word-start bonus - position`), else a
/// greedy pick preferring word starts (`+4` each, `+16` adjacency, `+6` word
/// start, minus the first position) — the element's shared subsequence
/// scorer. Returns the score and the label pieces to mark.
fn fuzzy_hit(query_units: &[String], text: &str) -> Option<(i64, Vec<(String, bool)>)> {
    if query_units.is_empty() {
        return Some((0, Vec::new()));
    }
    let units = units_of(text);
    // Contiguous run first.
    if units.len() >= query_units.len() {
        for i in 0..=(units.len() - query_units.len()) {
            if query_units
                .iter()
                .enumerate()
                .all(|(j, k)| units[i + j].key == *k)
            {
                let picked: Vec<usize> = (i..i + query_units.len()).collect();
                let score = 1000 + query_units.len() as i64 * 12 + if units[i].word_start { 60 } else { 0 } - i as i64;
                return Some((score, pieces_of(text, &units, &picked)));
            }
        }
    }
    let mut picked: Vec<usize> = Vec::new();
    let mut cursor = 0;
    for k in query_units {
        let mut pick: Option<usize> = None;
        for (i, unit) in units.iter().enumerate().skip(cursor) {
            if unit.key != *k {
                continue;
            }
            if pick.is_none() {
                pick = Some(i);
            }
            if unit.word_start {
                pick = Some(i);
                break;
            }
        }
        let pick = pick?;
        picked.push(pick);
        cursor = pick + 1;
    }
    let mut score = 0i64;
    for (k, pos) in picked.iter().enumerate() {
        score += 4;
        // A tight match outranks scattered word initials (the fzf/VS Code
        // rule): adjacency is worth more than a word start.
        if k > 0 && Some(*pos) == picked.get(k - 1).map(|prev| prev + 1) {
            score += 16;
        }
        if units[*pos].word_start {
            score += 6;
        }
    }
    score -= picked.first().copied().unwrap_or(0) as i64;
    Some((score, pieces_of(text, &units, &picked)))
}

/// Best score of an item over its label, description, keywords and group
/// heading (the element's rule: other fields' hits count one less); only the
/// label match is marked.
fn score_item(query: &str, item: &CommandItem, heading: &str) -> Option<(i64, Vec<(String, bool)>)> {
    let query_units: Vec<String> = units_of(query).iter().map(|unit| unit.key.clone()).collect();
    let label = fuzzy_hit(&query_units, &item.label);
    let mut best = label.as_ref().map(|(score, _)| *score);
    let mut consider = |text: &str| {
        if let Some((score, _)) = fuzzy_hit(&query_units, text) {
            if best.is_none_or(|b| score - 1 > b) {
                best = Some(score - 1);
            }
        }
    };
    if let Some(description) = &item.description {
        consider(description);
    }
    for keyword in &item.keywords {
        consider(keyword);
    }
    consider(heading);
    best.map(|score| (score, label.map(|(_, pieces)| pieces).unwrap_or_default()))
}

/// The parsed `groups` JSON (malformed entries are skipped; anything broken
/// reads as empty, as the element's `parseList`).
fn parse_groups(raw: Option<&str>) -> Vec<CommandGroup> {
    let Some(Json::Array(entries)) = parse_list(raw) else {
        return Vec::new();
    };
    entries
        .iter()
        .filter_map(|entry| {
            let fields = fields_of(entry)?;
            Some(CommandGroup {
                id: text_field(fields, "id")?,
                heading: text_field(fields, "heading")?,
                scope_id: text_field(fields, "scopeId"),
                items: match field(fields, "items") {
                    Some(Json::Array(items)) => items.iter().filter_map(parse_item).collect(),
                    _ => Vec::new(),
                },
            })
        })
        .collect()
}

fn parse_item(entry: &Json) -> Option<CommandItem> {
    let fields = fields_of(entry)?;
    Some(CommandItem {
        id: text_field(fields, "id")?,
        label: text_field(fields, "label")?,
        description: text_field(fields, "description"),
        icon: text_field(fields, "icon"),
        icon_path: text_field(fields, "iconPath"),
        keywords: match field(fields, "keywords") {
            Some(Json::Array(words)) => words
                .iter()
                .filter_map(|word| match word {
                    Json::String(word) => Some(word.clone()),
                    _ => None,
                })
                .collect(),
            _ => Vec::new(),
        },
        hint: text_field(fields, "hint"),
        shortcut: text_field(fields, "shortcut"),
        scope_id: text_field(fields, "scopeId"),
        actions: match field(fields, "actions") {
            Some(Json::Array(actions)) => actions.iter().filter_map(parse_action).collect(),
            _ => Vec::new(),
        },
    })
}

/// The parsed `scopes` JSON; empty means no scoping.
fn parse_scopes(raw: Option<&str>) -> Vec<CommandScope> {
    let Some(Json::Array(entries)) = parse_list(raw) else {
        return Vec::new();
    };
    entries
        .iter()
        .filter_map(|entry| {
            let fields = fields_of(entry)?;
            Some(CommandScope {
                id: text_field(fields, "id")?,
                label: text_field(fields, "label")?,
                icon: text_field(fields, "icon"),
            })
        })
        .collect()
}

/// The parsed `fallback-actions` JSON.
fn parse_fallback_actions(raw: Option<&str>) -> Vec<CommandAction> {
    let Some(Json::Array(entries)) = parse_list(raw) else {
        return Vec::new();
    };
    entries.iter().filter_map(parse_action).collect()
}

fn parse_action(entry: &Json) -> Option<CommandAction> {
    let fields = fields_of(entry)?;
    Some(CommandAction {
        id: text_field(fields, "id")?,
        label: text_field(fields, "label")?,
        icon: text_field(fields, "icon"),
        icon_path: text_field(fields, "iconPath"),
        shortcut: text_field(fields, "shortcut"),
    })
}

/// The recent store's ledger (`{ id: [count, at] }`); entries that are not a
/// pair of numbers are dropped, as the element's `readLedger`.
#[cfg(target_arch = "wasm32")]
fn parse_ledger(text: &str) -> Vec<ChoiceStat> {
    let mut stats = Vec::new();
    if let Some(Json::Object(entries)) = parse_json(text) {
        for (id, pair) in entries {
            if let Json::Array(pair) = pair {
                if let [Json::Number(count), Json::Number(at)] = pair.as_slice() {
                    stats.push(ChoiceStat {
                        id,
                        count: *count,
                        at: *at,
                    });
                }
            }
        }
    }
    stats
}

/// The ledger back to its JSON form (`{"id":[count,at],...}`).
#[cfg(target_arch = "wasm32")]
fn ledger_json(stats: &[ChoiceStat]) -> String {
    let mut out = String::from("{");
    for (index, stat) in stats.iter().enumerate() {
        if index > 0 {
            out.push(',');
        }
        out.push_str(&json_string(&stat.id));
        out.push_str(&format!(":[{},{}]", stat.count, stat.at));
    }
    out.push('}');
    out
}

/// A JSON string literal with the escapes JSON requires.
#[cfg(target_arch = "wasm32")]
fn json_string(value: &str) -> String {
    let mut out = String::from("\"");
    for c in value.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// A tolerant JSON list parse: anything broken reads as empty.
fn parse_list(raw: Option<&str>) -> Option<Json> {
    let raw = raw.filter(|v| !v.is_empty())?;
    match parse_json(raw) {
        Some(Json::Array(items)) => Some(Json::Array(items)),
        _ => None,
    }
}

fn fields_of(entry: &Json) -> Option<&[(String, Json)]> {
    match entry {
        Json::Object(fields) => Some(fields),
        _ => None,
    }
}

fn field<'a>(fields: &'a [(String, Json)], name: &str) -> Option<&'a Json> {
    fields.iter().find(|(key, _)| key == name).map(|(_, value)| value)
}

fn text_field(fields: &[(String, Json)], name: &str) -> Option<String> {
    match field(fields, name) {
        Some(Json::String(value)) => Some(value.clone()),
        _ => None,
    }
}

/// Just enough JSON for the content props (the host's own data), the same
/// hand-rolled reader the other ports carry.
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

/// Global search-and-commands dialog in the top layer: a combobox field over grouped, fuzzy-matched results with scopes, per-item actions, fallback actions and recents. The query, the highlight and the actions sub-list reset on each open.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyCommandPalette(
    /// Shown (a modal dialog in the top layer). The element closes itself after a choice or the stepped-back Escape — removing the attribute and asking the host with `ty-close` — so a controlled host follows the attribute.
    #[props(default)]
    open: bool,
    /// JSON array of groups: `{ id, heading, scopeId?, items: [{ id, label, description?, icon?, iconPath?, keywords?, hint?, shortcut?, scopeId?, actions?: [{ id, label, icon?, iconPath?, shortcut? }] }] }`. `keywords` are matched but not shown; `icon` is a text glyph; `iconPath` is an SVG icon as 24×24 path data rendered in the standard icon frame — when both are present `iconPath` wins, and subpaths separated by " | " become one `<path>` each. Unparseable or missing: no groups.
    #[props(into)]
    groups: Option<String>,
    /// JSON array of scopes: `[{ id, label, icon? }]`; empty means no scoping (no scope column, no scope keys).
    #[props(into)]
    scopes: Option<String>,
    /// The active scope id; unset: everything. The element reflects user changes back to this attribute and reports them with `ty-scope-change`.
    #[props(into)]
    active_scope: Option<String>,
    /// Shows skeleton rows and announces the loading label instead of results.
    #[props(default)]
    loading: bool,
    /// JSON array of actions offered when the query matches nothing: `[{ id, label, icon?, iconPath?, shortcut? }]`; `{query}` in a label is replaced by the query. `iconPath` is as in `groups` (an SVG icon wins over the `icon` text glyph).
    #[props(into)]
    fallback_actions: Option<String>,
    /// Browser-storage key of the recent store; enables it. Records the chosen item id with a count and a time, tolerant of storage being unavailable.
    #[props(into)]
    recent_key: Option<String>,
    /// Recents shown when the query is empty, most chosen first (ties: most recent).
    #[props(default = 5.0f64)]
    recent_visible: f64,
    /// Most recent ids the store keeps.
    #[props(default = 12.0f64)]
    recent_keep: f64,
    /// Accessible name of the dialog and the field.
    #[props(into, default = String::from("Search and commands"))]
    label: String,
    /// Field placeholder.
    #[props(into, default = String::from("Search or type a command"))]
    placeholder: String,
    /// Shown on an empty query with nothing to list.
    #[props(into, default = String::from("Type to search records, sources and screens."))]
    empty_label: String,
    /// Shown and announced when the query matches nothing; {query} is replaced.
    #[props(into, default = String::from("Nothing matches “{query}”."))]
    no_results_label: String,
    /// Announced in the status region while `loading`.
    #[props(into, default = String::from("Loading results"))]
    loading_label: String,
    /// Accessible name of the scope chip; {scope} is replaced by the scope label.
    #[props(into, default = String::from("Remove scope {scope}"))]
    remove_scope_label: String,
    /// Heading of the actions sub-list; {label} is replaced by the item label.
    #[props(into, default = String::from("Actions for {label}"))]
    actions_for_label: String,
    /// Heading of the recent group.
    #[props(into, default = String::from("Recent"))]
    recent_label: String,
    /// Announced result count; {count} is replaced.
    #[props(into, default = String::from("{count} results"))]
    results_label: String,
    /// Accessible name of the scope column.
    #[props(into, default = String::from("Scopes"))]
    scopes_label: String,
    /// Heading of the fallback group.
    #[props(into, default = String::from("Other actions"))]
    fallback_label: String,
    /// Footer hint beside ↑↓.
    #[props(into, default = String::from("move"))]
    hint_navigate: String,
    /// Footer hint beside ↵.
    #[props(into, default = String::from("open"))]
    hint_select: String,
    /// Footer hint beside →.
    #[props(into, default = String::from("actions"))]
    hint_actions: String,
    /// Footer hint beside ←.
    #[props(into, default = String::from("back"))]
    hint_back: String,
    /// Footer hint beside esc.
    #[props(into, default = String::from("close"))]
    hint_close: String,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// A row was chosen: an item (`kind: "item"`, `id` the item id), a secondary action (`kind: "action"`, `id` the action id, `itemId` its item) or a fallback action (`kind: "fallback"`). `itemId` is empty except for actions. The palette then closes itself and asks the host with `ty-close`.
    on_select: Option<EventHandler<CommandPaletteSelect>>,
    /// The active scope changed (a scope button, the chip, Tab or Backspace); `scope` is the scope id, empty when cleared. The element reflects it to the `active-scope` attribute.
    on_scope_change: Option<EventHandler<CommandPaletteScopeChange>>,
    /// The palette asks to close (the stepped-back Escape reaching the top level, a press outside, or after a choice). The element closes itself too.
    on_close: Option<EventHandler<()>>,
) -> Element {
    let instance = use_instance_id(instance);

    let groups_data = parse_groups(groups.as_deref());
    let scopes_data = parse_scopes(scopes.as_deref());
    let fallback_data = parse_fallback_actions(fallback_actions.as_deref());

    // The search state the element kept in fields: the query, the highlight
    // and the actions sub-list, reset on each open.
    let mut query = use_signal(String::new);
    let mut cursor = use_signal(|| 0usize);
    let mut sub = use_signal(|| None::<CommandItem>);
    let mut recent = use_signal(Vec::<ChoiceStat>::new);

    // The active scope: uncontrolled with a mirrored prop — the host may move
    // `active-scope`, otherwise the chip, the scope buttons, Tab and
    // Backspace drive the state (the element's attribute-is-the-state).
    let mut scope = use_signal(|| active_scope.clone().filter(|v| !v.is_empty()));
    let mut mirrored_scope = use_signal(|| active_scope.clone());
    if active_scope != *mirrored_scope.peek() {
        mirrored_scope.set(active_scope.clone());
        scope.set(active_scope.clone().filter(|v| !v.is_empty()));
    }

    // Opening resets the search and reads the recents store, as the element's
    // `#open`; `open` itself stays controlled (the host flips it on
    // `on_close`, following the element's `ty-close`).
    let mut was_open = use_signal(|| false);
    if open != *was_open.peek() {
        was_open.set(open);
        if open {
            query.set(String::new());
            cursor.set(0);
            sub.set(None);
            let key = recent_key.clone().filter(|v| !v.is_empty());
            recent.set(match key {
                Some(key) => wasm::read_choices(&key),
                None => Vec::new(),
            });
        }
    }

    let mut mirrored_on_close = use_signal(|| on_close);
    if *mirrored_on_close.peek() != on_close {
        mirrored_on_close.set(on_close);
    }

    // The palette asks to close; the host flips `open` (the element removed
    // the attribute itself, so a controlled host followed it).
    let request_close = move || {
        if let Some(handler) = on_close {
            handler.call(());
        }
    };

    // Reflect the scope change locally and report it, as the element's
    // `#setScope` reflected it to the attribute and emitted `ty-scope-change`.
    let set_scope = {
        move |next: Option<String>| {
            scope.set(next.clone());
            if let Some(handler) = on_scope_change {
                handler.call(CommandPaletteScopeChange {
                    scope: next.unwrap_or_default(),
                });
            }
        }
    };

    let mut host = use_signal(|| None::<Rc<MountedData>>);
    let mut dialog = use_signal(|| None::<Rc<MountedData>>);
    wasm::follow_open(dialog, was_open, mirrored_on_close);

    let scope_now = scope();
    let query_now = query();
    let sub_now = sub();
    let sections = if loading {
        Vec::new()
    } else {
        build_sections(
            &groups_data,
            scope_now.as_deref(),
            &query_now,
            sub_now.as_ref(),
            &recent.read(),
            recent_visible.max(0.0) as usize,
            &fallback_data,
            &actions_for_label,
            &recent_label,
            &fallback_label,
        )
    };
    let mut rows: Vec<Row> = sections
        .iter()
        .flat_map(|section| section.rows.clone())
        .collect();
    for (index, row) in rows.iter_mut().enumerate() {
        row.index = index;
    }

    // The highlight clamps to the list, as the element's `#renderRows`.
    let at = *cursor.peek();
    if at >= rows.len() {
        let clamped = rows.len().saturating_sub(1);
        if clamped != at {
            cursor.set(clamped);
        }
    }
    let current = rows.get(*cursor.peek());
    let current_id = current.map(|row| format!("{}-{}", instance, safe(&row.key)));
    let has_rows = !rows.is_empty();

    // Scroll the highlighted row into view once the render lands.
    let mut mirrored_highlight = use_signal(|| None::<String>);
    if current_id != *mirrored_highlight.peek() {
        mirrored_highlight.set(current_id.clone());
    }
    wasm::follow_highlight(dialog, mirrored_highlight);

    // The active scope as a removable chip before the text; only a scope the
    // `scopes` JSON still names gets one, as the element's `#renderChip`.
    let chip_label = scope_now
        .as_ref()
        .and_then(|active| scopes_data.iter().find(|s| &s.id == active))
        .map(|s| s.label.clone());

    let q = query_now.trim();
    let status_text = if loading {
        loading_label.clone()
    } else if !q.is_empty() {
        if has_rows {
            results_label.replace("{count}", &rows.len().to_string())
        } else {
            no_results_label.replace("{query}", q)
        }
    } else {
        String::new()
    };
    let empty_message = if !q.is_empty() {
        no_results_label.replace("{query}", q)
    } else {
        empty_label.clone()
    };

    // Choose a row: record the choice, report it and ask to close — the
    // element's `#run`.
    let run_row = {
        let recent_key = recent_key.clone().filter(|v| !v.is_empty());
        move |row: Row| {
            if row.kind == RowKind::Item {
                if let Some(key) = &recent_key {
                    wasm::record_choice(key, &row.id, recent_keep.max(0.0) as usize);
                }
            }
            if let Some(handler) = on_select {
                handler.call(CommandPaletteSelect {
                    id: row.id.clone(),
                    kind: row.kind.as_str().to_string(),
                    item_id: row.item_id.clone(),
                });
            }
            request_close();
        }
    };

    // Activate (or clear) a scope and reset the search, focus back on the
    // field — the element's `#activateScope`. A scope button toggles.
    let activate_scope = {
        let mut set_scope = set_scope;
        move |next: Option<String>| {
            set_scope(next);
            query.set(String::new());
            sub.set(None);
            cursor.set(0);
            wasm::focus_field(dialog, true);
        }
    };

    rsx! {
        ty-command-palette {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "open": open.then_some("true"),
            "groups": groups.as_deref().filter(|v| !v.is_empty()),
            "scopes": scopes.as_deref().filter(|v| !v.is_empty()),
            "active-scope": active_scope.as_deref().filter(|v| !v.is_empty()),
            "loading": loading.then_some(""),
            "fallback-actions": fallback_actions.as_deref().filter(|v| !v.is_empty()),
            "recent-key": recent_key.as_deref().filter(|v| !v.is_empty()),
            "recent-visible": Some(recent_visible.to_string()),
            "recent-keep": Some(recent_keep.to_string()),
            "label": (!label.is_empty()).then_some(label.as_str()),
            "placeholder": (!placeholder.is_empty()).then_some(placeholder.as_str()),
            "empty-label": (!empty_label.is_empty()).then_some(empty_label.as_str()),
            "no-results-label": (!no_results_label.is_empty()).then_some(no_results_label.as_str()),
            "loading-label": (!loading_label.is_empty()).then_some(loading_label.as_str()),
            "remove-scope-label": (!remove_scope_label.is_empty()).then_some(remove_scope_label.as_str()),
            "actions-for-label": (!actions_for_label.is_empty()).then_some(actions_for_label.as_str()),
            "recent-label": (!recent_label.is_empty()).then_some(recent_label.as_str()),
            "results-label": (!results_label.is_empty()).then_some(results_label.as_str()),
            "scopes-label": (!scopes_label.is_empty()).then_some(scopes_label.as_str()),
            "fallback-label": (!fallback_label.is_empty()).then_some(fallback_label.as_str()),
            "hint-navigate": (!hint_navigate.is_empty()).then_some(hint_navigate.as_str()),
            "hint-select": (!hint_select.is_empty()).then_some(hint_select.as_str()),
            "hint-actions": (!hint_actions.is_empty()).then_some(hint_actions.as_str()),
            "hint-back": (!hint_back.is_empty()).then_some(hint_back.as_str()),
            "hint-close": (!hint_close.is_empty()).then_some(hint_close.as_str()),
            onmounted: move |event: MountedEvent| host.set(Some(event.data())),
            if open {
                dialog {
                    class: "ty-palette",
                    "aria-label": Some(label.clone()),
                    onmounted: move |event: MountedEvent| dialog.set(Some(event.data())),
                    // A press on the dialog box itself (outside the palette's
                    // content) is a press outside.
                    onclick: move |_| request_close(),
                    div {
                        class: "ty-palette__dialog",
                        onclick: move |event: MouseEvent| event.stop_propagation(),
                        div {
                            class: "ty-palette__field",
                            if let Some(scope_text) = chip_label.clone() {
                                button {
                                    class: "ty-palette__chip",
                                    "type": Some("button"),
                                    "aria-label": Some(remove_scope_label.replace("{scope}", &scope_text)),
                                    onclick: {
                                        let mut set_scope = set_scope;
                                        move |_| {
                                            set_scope(None);
                                            wasm::focus_field(dialog, false);
                                        }
                                    },
                                    {scope_text.clone()}
                                    svg {
                                        "viewBox": Some("0 0 24 24"),
                                        "fill": Some("none"),
                                        "stroke": Some("currentColor"),
                                        "stroke-width": Some("2"),
                                        "stroke-linecap": Some("round"),
                                        "stroke-linejoin": Some("round"),
                                        "aria-hidden": Some("true"),
                                        "focusable": Some("false"),
                                        path { "d": Some("M18 6 6 18") }
                                        path { "d": Some("m6 6 12 12") }
                                    }
                                }
                            }
                            svg {
                                class: "ty-palette__search-icon",
                                "viewBox": Some("0 0 24 24"),
                                "fill": Some("none"),
                                "stroke": Some("currentColor"),
                                "stroke-width": Some("2"),
                                "stroke-linecap": Some("round"),
                                "stroke-linejoin": Some("round"),
                                "aria-hidden": Some("true"),
                                "focusable": Some("false"),
                                circle { "cx": Some("11"), "cy": Some("11"), "r": Some("7") }
                                path { "d": Some("m20 20-3.5-3.5") }
                            }
                            input {
                                class: "ty-palette__input",
                                "role": Some("combobox"),
                                "aria-label": Some(label.clone()),
                                "aria-autocomplete": Some("list"),
                                "aria-expanded": Some(if has_rows { "true" } else { "false" }),
                                "aria-controls": Some(format!("{instance}-list")),
                                "aria-activedescendant": current_id.clone(),
                                "placeholder": Some(placeholder.clone()),
                                "autocomplete": Some("off"),
                                "spellcheck": Some("false"),
                                "type": Some("text"),
                                oninput: move |event: FormEvent| {
                                    query.set(event.value());
                                    cursor.set(0);
                                    sub.set(None);
                                },
                                onkeydown: {
                                    let rows = rows.clone();
                                    let scopes_data = scopes_data.clone();
                                    let mut activate_scope = activate_scope;
                                    let mut set_scope = set_scope;
                                    let run_row = run_row.clone();
                                    move |event: KeyboardEvent| {
                                        let count = rows.len();
                                        let empty = query.peek().is_empty();
                                        let scope_now = scope.peek().clone();
                                        // Inline-axis keys follow the reading
                                        // direction: "into" the sub-list is the
                                        // inline end.
                                        let key = if wasm::is_rtl(host) {
                                            match event.key() {
                                                Key::ArrowLeft => Key::ArrowRight,
                                                Key::ArrowRight => Key::ArrowLeft,
                                                key => key,
                                            }
                                        } else {
                                            event.key()
                                        };
                                        match key {
                                            Key::ArrowDown | Key::ArrowUp | Key::Home | Key::End => {
                                                event.prevent_default();
                                                if count > 0 {
                                                    let at = *cursor.peek();
                                                    let to = match key {
                                                        Key::ArrowDown => (at + 1) % count,
                                                        Key::ArrowUp => {
                                                            if at == 0 { count - 1 } else { at - 1 }
                                                        }
                                                        Key::Home => 0,
                                                        _ => count - 1,
                                                    };
                                                    cursor.set(to);
                                                }
                                            }
                                            Key::Enter => {
                                                event.prevent_default();
                                                if let Some(row) = rows.get(*cursor.peek()) {
                                                    run_row(row.clone());
                                                }
                                            }
                                            Key::ArrowRight => {
                                                let current = rows.get(*cursor.peek());
                                                let actions = current
                                                    .and_then(|row| row.item.as_ref())
                                                    .map(|item| item.actions.len())
                                                    .unwrap_or(0);
                                                if sub.peek().is_none() && actions > 0 {
                                                    event.prevent_default();
                                                    sub.set(current.and_then(|row| row.item.clone()));
                                                    cursor.set(0);
                                                } else if empty && scope_now.is_none() && !scopes_data.is_empty() {
                                                    event.prevent_default();
                                                    activate_scope(Some(scopes_data[0].id.clone()));
                                                }
                                            }
                                            Key::ArrowLeft => {
                                                if sub.peek().is_some() {
                                                    event.prevent_default();
                                                    sub.set(None);
                                                    cursor.set(0);
                                                }
                                            }
                                            Key::Tab => {
                                                if scopes_data.is_empty() || event.modifiers().shift() {
                                                    return;
                                                }
                                                let typed = query.peek().trim().to_lowercase();
                                                let target = if empty {
                                                    if scope_now.is_some() {
                                                        None
                                                    } else {
                                                        scopes_data.first()
                                                    }
                                                } else {
                                                    scopes_data.iter().find(|s| {
                                                        s.label.to_lowercase().starts_with(&typed)
                                                    })
                                                };
                                                if let Some(target) = target {
                                                    event.prevent_default();
                                                    activate_scope(Some(target.id.clone()));
                                                }
                                            }
                                            Key::Backspace => {
                                                if empty && scope_now.is_some() {
                                                    event.prevent_default();
                                                    set_scope(None);
                                                }
                                            }
                                            Key::Escape => {
                                                event.prevent_default();
                                                event.stop_propagation();
                                                if sub.peek().is_some() {
                                                    sub.set(None);
                                                    cursor.set(0);
                                                } else if scope_now.is_some() {
                                                    set_scope(None);
                                                } else {
                                                    request_close();
                                                }
                                            }
                                            _ => {}
                                        }
                                    }
                                },
                            }
                        }
                        div {
                            class: "ty-palette__main",
                            if !scopes_data.is_empty() {
                                div {
                                    class: "ty-palette__scopes",
                                    "role": Some("group"),
                                    "aria-label": Some(scopes_label.clone()),
                                    for s in &scopes_data {
                                        button {
                                            key: "{s.id}",
                                            class: "ty-palette__scope",
                                            "type": Some("button"),
                                            "aria-pressed": Some(if scope_now.as_ref() == Some(&s.id) { "true" } else { "false" }),
                                            "tabindex": Some("-1"),
                                            onclick: {
                                                let id = s.id.clone();
                                                let mut activate_scope = activate_scope;
                                                move |_| {
                                                    let next = if scope.peek().as_ref() == Some(&id) {
                                                        None
                                                    } else {
                                                        Some(id.clone())
                                                    };
                                                    activate_scope(next);
                                                }
                                            },
                                            if let Some(icon) = s.icon.clone() {
                                                span {
                                                    "aria-hidden": Some("true"),
                                                    {icon}
                                                }
                                            }
                                            {s.label.clone()}
                                        }
                                    }
                                }
                            }
                            div {
                                class: "ty-palette__results",
                                if loading {
                                    div {
                                        class: "ty-palette__loading",
                                        "aria-hidden": Some("true"),
                                        span { class: "ty-skeleton", "data-shape": Some("line") }
                                        span { class: "ty-skeleton", "data-shape": Some("line") }
                                        span { class: "ty-skeleton", "data-shape": Some("line") }
                                    }
                                }
                                div {
                                    class: "ty-palette__list",
                                    "id": Some(format!("{instance}-list")),
                                    "role": Some("listbox"),
                                    "aria-label": Some(label.clone()),
                                    for section in &sections {
                                        div {
                                            key: "{section.key}",
                                            class: "ty-palette__group",
                                            "role": Some("group"),
                                            "aria-labelledby": Some(format!("{instance}-{}", section.key)),
                                            div {
                                                class: "ty-palette__heading",
                                                "id": Some(format!("{instance}-{}", section.key)),
                                                "role": Some("presentation"),
                                                {section.heading.clone()}
                                            }
                                            for row in &section.rows {
                                                {
                                                    let index = row.index;
                                                    let choice = rows[row.index].clone();
                                                    // The icon frame: `iconPath` (one `<path>` per
                                                    // " | "-separated subpath, bound as an attribute so
                                                    // the JSON stays inert data) wins over the `icon`
                                                    // text glyph.
                                                    let icon_paths: Vec<String> = row
                                                        .icon_path
                                                        .as_deref()
                                                        .map(|path| path.split(" | ").map(str::to_string).collect())
                                                        .unwrap_or_default();
                                                    let icon_glyph = if icon_paths.is_empty() {
                                                        row.icon.clone()
                                                    } else {
                                                        None
                                                    };
                                                    rsx! {
                                                        div {
                                                            key: "{row.key}",
                                                            class: "ty-palette__option",
                                                            "id": Some(format!("{}-{}", instance, safe(&row.key))),
                                                            "role": Some("option"),
                                                            "aria-selected": Some(if current.map(|c| &c.key) == Some(&row.key) { "true" } else { "false" }),
                                                            "data-kind": Some(row.kind.as_str()),
                                                            "data-highlighted": (current.map(|c| &c.key) == Some(&row.key)).then_some(""),
                                                            onpointermove: move |_| {
                                                                if *cursor.peek() != index {
                                                                    cursor.set(index);
                                                                }
                                                            },
                                                            onmousedown: move |event: MouseEvent| event.prevent_default(),
                                                            onclick: {
                                                                let run_row = run_row.clone();
                                                                move |_| run_row(choice.clone())
                                                            },
                                                            if !icon_paths.is_empty() {
                                                                span {
                                                                    class: "ty-palette__icon",
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
                                                                        for d in &icon_paths {
                                                                            path { "d": Some(d.clone()) }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            if let Some(icon) = icon_glyph.clone() {
                                                                span {
                                                                    class: "ty-palette__icon",
                                                                    "aria-hidden": Some("true"),
                                                                    {icon}
                                                                }
                                                            }
                                                            span {
                                                                class: "ty-palette__text",
                                                                span {
                                                                    class: "ty-palette__label",
                                                                    if row.pieces.is_empty() {
                                                                        {row.label.clone()}
                                                                    } else {
                                                                        for (piece, marked) in row.pieces.clone() {
                                                                            if marked {
                                                                                mark {
                                                                                    class: "ty-palette__mark",
                                                                                    {piece}
                                                                                }
                                                                            } else {
                                                                                {piece}
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                                if let Some(description) = row.description.clone() {
                                                                    span {
                                                                        class: "ty-palette__description",
                                                                        {description}
                                                                    }
                                                                }
                                                            }
                                                            if let Some(hint) = row.hint.clone() {
                                                                span {
                                                                    class: "ty-palette__hint",
                                                                    {hint}
                                                                }
                                                            }
                                                            if let Some(shortcut) = row.shortcut.clone() {
                                                                kbd {
                                                                    class: "ty-palette__kbd",
                                                                    {shortcut}
                                                                }
                                                            }
                                                            if row.item.as_ref().is_some_and(|item| !item.actions.is_empty()) && sub_now.is_none() {
                                                                span {
                                                                    class: "ty-palette__chevron",
                                                                    "aria-hidden": Some("true"),
                                                                    onclick: {
                                                                        let item = row.item.clone();
                                                                        move |event: MouseEvent| {
                                                                            event.stop_propagation();
                                                                            if let Some(item) = item.clone() {
                                                                                sub.set(Some(item));
                                                                                cursor.set(0);
                                                                            }
                                                                        }
                                                                    },
                                                                    svg {
                                                                        class: "ty-mirror-rtl",
                                                                        "viewBox": Some("0 0 24 24"),
                                                                        "fill": Some("none"),
                                                                        "stroke": Some("currentColor"),
                                                                        "stroke-width": Some("2"),
                                                                        "stroke-linecap": Some("round"),
                                                                        "stroke-linejoin": Some("round"),
                                                                        "aria-hidden": Some("true"),
                                                                        "focusable": Some("false"),
                                                                        path { "d": Some("m9 18 6-6-6-6") }
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
                                if !loading && !has_rows {
                                    p {
                                        class: "ty-palette__empty",
                                        {empty_message.clone()}
                                    }
                                }
                            }
                        }
                        div {
                            class: "ty-palette__footer",
                            "aria-hidden": Some("true"),
                            span {
                                kbd { class: "ty-palette__kbd", "↑↓" }
                                {format!(" {hint_navigate}")}
                            }
                            span {
                                kbd { class: "ty-palette__kbd", "↵" }
                                {format!(" {hint_select}")}
                            }
                            span {
                                kbd { class: "ty-palette__kbd", "→" }
                                {format!(" {hint_actions}")}
                            }
                            span {
                                kbd { class: "ty-palette__kbd", "←" }
                                {format!(" {hint_back}")}
                            }
                            span {
                                kbd { class: "ty-palette__kbd", "esc" }
                                {format!(" {hint_close}")}
                            }
                        }
                        span {
                            class: "ty-visually-hidden",
                            "role": Some("status"),
                            {status_text.clone()}
                        }
                    }
                }
            }
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    use super::ChoiceStat;

    pub fn follow_open(
        _dialog: Signal<Option<Rc<MountedData>>>,
        _was_open: Signal<bool>,
        _on_close: Signal<Option<EventHandler<()>>>,
    ) {
    }

    pub fn follow_highlight(
        _dialog: Signal<Option<Rc<MountedData>>>,
        _highlight: Signal<Option<String>>,
    ) {
    }

    pub fn focus_field(_dialog: Signal<Option<Rc<MountedData>>>, _clear: bool) {}

    pub fn is_rtl(_host: Signal<Option<Rc<MountedData>>>) -> bool {
        false
    }

    pub fn read_choices(_key: &str) -> Vec<ChoiceStat> {
        Vec::new()
    }

    pub fn record_choice(_key: &str, _id: &str, _keep: usize) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::cell::RefCell;
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    use super::ChoiceStat;

    struct Listener {
        target: web_sys::EventTarget,
        event: &'static str,
        closure: Closure<dyn FnMut(web_sys::Event)>,
    }

    impl Drop for Listener {
        fn drop(&mut self) {
            let _ = self
                .target
                .remove_event_listener_with_callback(self.event, self.closure.as_ref().unchecked_ref());
        }
    }

    /// The modal contract, driven by the controlled `open` and the dialog's
    /// mount: on open, `showModal` puts the native `<dialog>` in the top
    /// layer (the rest of the page inert, Escape cancelling), focus moves to
    /// the field and the `cancel` event asks to close; on close or unmount,
    /// focus returns to what had it. The element's `#open` / `#close`.
    pub fn follow_open(
        dialog: Signal<Option<Rc<MountedData>>>,
        was_open: Signal<bool>,
        on_close: Signal<Option<EventHandler<()>>>,
    ) {
        struct Modal {
            return_focus: Option<web_sys::Element>,
            cancel: Option<Listener>,
            active: bool,
        }

        impl Modal {
            fn deactivate(&mut self) {
                if !self.active {
                    return;
                }
                self.active = false;
                self.cancel = None;
                let target = self.return_focus.take();
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

        impl Drop for Modal {
            fn drop(&mut self) {
                self.deactivate();
            }
        }

        let modal = use_signal(|| {
            Rc::new(RefCell::new(Modal {
                return_focus: None,
                cancel: None,
                active: false,
            }))
        });
        use_effect(move || {
            let open = was_open();
            let guard = modal.peek();
            let mut state = guard.borrow_mut();
            if !open {
                state.deactivate();
                return;
            }
            if state.active {
                return;
            }
            let Some(element) = host_element(dialog) else { return };
            state.active = true;
            // Focus returns to what had it, if that was outside the palette.
            state.return_focus = document()
                .and_then(|doc| doc.active_element())
                .filter(|active| !contains(&element, active));
            if let Some(html) = element.dyn_ref::<web_sys::HtmlDialogElement>() {
                if !html.open() && html.show_modal().is_err() {
                    let _ = element.set_attribute("open", "");
                }
            } else {
                let _ = element.set_attribute("open", "");
            }
            if let Ok(Some(input)) = element.query_selector(".ty-palette__input") {
                if let Some(html) = input.dyn_ref::<web_sys::HtmlElement>() {
                    let _ = html.focus();
                }
            }
            // Escape outside the field cancels the dialog: prevent the native
            // close and ask the host, as the element's `cancel` listener.
            let target: web_sys::EventTarget = element.into();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                event.prevent_default();
                if let Some(handler) = *on_close.peek() {
                    handler.call(());
                }
            });
            if target
                .add_event_listener_with_callback("cancel", closure.as_ref().unchecked_ref())
                .is_ok()
            {
                state.cancel = Some(Listener {
                    target,
                    event: "cancel",
                    closure,
                });
            }
        });
    }

    /// Scroll the highlighted row into view (`block: "nearest"`) once the
    /// render that moved the highlight has landed, as the element's
    /// `#renderRows` tail.
    pub fn follow_highlight(
        dialog: Signal<Option<Rc<MountedData>>>,
        highlight: Signal<Option<String>>,
    ) {
        use_effect(move || {
            let Some(id) = highlight() else { return };
            if host_element(dialog).is_none() {
                return;
            }
            let Some(target) = document().and_then(|doc| doc.get_element_by_id(&id)) else {
                return;
            };
            let options = web_sys::ScrollIntoViewOptions::new();
            options.set_block(web_sys::ScrollLogicalPosition::Nearest);
            target.scroll_into_view_with_scroll_into_view_options(&options);
        });
    }

    /// Focus the field (after clearing it, for a scope change), as the
    /// element's `#activateScope` and the chip's click.
    pub fn focus_field(dialog: Signal<Option<Rc<MountedData>>>, clear: bool) {
        let Some(element) = host_element(dialog) else { return };
        let Ok(Some(input)) = element.query_selector(".ty-palette__input") else {
            return;
        };
        if clear {
            if let Some(field) = input.dyn_ref::<web_sys::HtmlInputElement>() {
                field.set_value("");
            }
        }
        if let Some(html) = input.dyn_ref::<web_sys::HtmlElement>() {
            let _ = html.focus();
        }
    }

    /// The reading direction: the nearest `dir` attribute, else the computed
    /// style, as the element's `closest('[dir]')`.
    pub fn is_rtl(host: Signal<Option<Rc<MountedData>>>) -> bool {
        let Some(mut node) = host_element(host) else { return false };
        loop {
            if let Some(dir) = node.get_attribute("dir") {
                return dir == "rtl";
            }
            let Some(parent) = node.parent_element() else { break };
            node = parent;
        }
        web_sys::window()
            .and_then(|window| window.get_computed_style(&node).ok().flatten())
            .and_then(|style| style.get_property_value("direction").ok())
            .is_some_and(|direction| direction.trim() == "rtl")
    }

    /// Everything remembered under `key`; a missing, blocked or broken store
    /// reads as empty, as the element's `readChoices`.
    pub fn read_choices(key: &str) -> Vec<ChoiceStat> {
        let Some(text) = storage().and_then(|store| store.get_item(key).ok().flatten()) else {
            return Vec::new();
        };
        super::parse_ledger(&text)
    }

    /// Count one more choice of `id`, keep the `keep` most recent ids and
    /// persist, tolerant of storage failing — the element's `recordChoice`.
    pub fn record_choice(key: &str, id: &str, keep: usize) {
        let mut stats = read_choices(key);
        let (count, _) = stats
            .iter()
            .find(|stat| stat.id == id)
            .map(|stat| (stat.count, stat.at))
            .unwrap_or((0.0, 0.0));
        stats.retain(|stat| stat.id != id);
        stats.push(ChoiceStat {
            id: id.to_string(),
            count: count + 1.0,
            at: js_sys::Date::now(),
        });
        stats.sort_by(|x, y| y.at.total_cmp(&x.at));
        stats.truncate(keep);
        if let Some(store) = storage() {
            let _ = store.set_item(key, &super::ledger_json(&stats));
        }
    }

    fn storage() -> Option<web_sys::Storage> {
        web_sys::window().and_then(|window| window.local_storage().ok().flatten())
    }

    fn document() -> Option<web_sys::Document> {
        web_sys::window().and_then(|window| window.document())
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
