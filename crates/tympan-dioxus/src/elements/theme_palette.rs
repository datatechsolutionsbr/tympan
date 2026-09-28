//! Native port of `<ty-theme-palette>`: a command palette over the Tympan
//! theme catalogue (`tympan_tokens::Theme`), the colour mode and the
//! density, in a native `<dialog>` in the top layer while open. The rows —
//! the preset and print themes (filtered by `themes`), the modes and the
//! densities, grouped under their translated headings, matched against the
//! query case- and accent-blind, with the current appearance and the
//! keyboard cursor marked — are composed declaratively from the same model
//! the element computed in `#renderRows`, so SSR carries the whole open
//! palette. The behaviour is the element's: the stored choice
//! (`storage-key`, the ThemeProvider format) is read, merged over on a
//! choice and written back; `apply` paints the appearance onto `<html>`
//! (`data-ty-theme` / `data-ty-mode` / `data-ty-density`) and links the
//! print/font stylesheets, on connect and whenever a default changes; a
//! choice applies and stores regardless of `apply`, reports
//! `on_theme_change` and closes; the combobox is navigated with the arrow
//! keys, Home, End and Enter, pointer motion moves the cursor, the first
//! Escape clears the query and the second closes, the dialog's own cancel
//! (Escape outside the field) and a press on the backdrop close — all of
//! them asking the host with `on_close`, and the element closes itself too
//! (uncontrolled with the `open` prop mirrored, as `tabs.rs`' selection).
//! The DOM-only parts — localStorage, the top-layer dialog (`showModal`,
//! initial focus, the `cancel` listener, focus return), the stylesheet
//! links and keeping the active option in view — live in the `wasm`
//! module, cfg-gated with a no-op twin.

use std::rc::Rc;

use dioxus::prelude::*;
use tympan_tokens::{Density, Mode, Theme};

use crate::runtime::use_instance_id;

/// Mode when nothing is stored.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ThemePaletteDefaultMode {
    #[default]
    System,
    Light,
    Dark,
}

impl ThemePaletteDefaultMode {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            ThemePaletteDefaultMode::System => "system",
            ThemePaletteDefaultMode::Light => "light",
            ThemePaletteDefaultMode::Dark => "dark",
        }
    }
}

/// Density when nothing is stored.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ThemePaletteDefaultDensity {
    Compact,
    #[default]
    Default,
    Comfortable,
}

impl ThemePaletteDefaultDensity {
    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            ThemePaletteDefaultDensity::Compact => "compact",
            ThemePaletteDefaultDensity::Default => "default",
            ThemePaletteDefaultDensity::Comfortable => "comfortable",
        }
    }
}

/// A row was chosen and applied; the detail is the whole appearance.
#[derive(Clone, Debug, PartialEq)]
pub struct ThemePaletteThemeChange {
    pub theme: String,
    pub mode: String,
    pub density: String,
}

/// The stored choice (the ThemeProvider format): only the fields a person
/// chose; the rest follows the defaults.
#[derive(Clone, Debug, Default)]
struct StoredChoice {
    theme: Option<String>,
    mode: Option<String>,
    density: Option<String>,
}

#[cfg(target_arch = "wasm32")]
impl StoredChoice {
    /// From the stored JSON's fields; anything not a known theme, mode or
    /// density is dropped, as `readStored` did.
    fn from_fields(fields: &[(String, String)]) -> StoredChoice {
        let mut choice = StoredChoice::default();
        for (key, value) in fields {
            match key.as_str() {
                "theme" if Theme::from_name(value).is_some() => choice.theme = Some(value.clone()),
                "mode" if Mode::from_name(value).is_some() => choice.mode = Some(value.clone()),
                "density" if Density::from_name(value).is_some() => {
                    choice.density = Some(value.clone());
                }
                _ => {}
            }
        }
        choice
    }

    /// The ThemeProvider storage format (`{"theme":…,"mode":…,"density":…}`,
    /// the chosen fields only), as `writeStored`'s `JSON.stringify` wrote it.
    fn to_json(&self) -> String {
        let mut fields = Vec::new();
        if let Some(theme) = &self.theme {
            fields.push(format!("\"theme\":\"{theme}\""));
        }
        if let Some(mode) = &self.mode {
            fields.push(format!("\"mode\":\"{mode}\""));
        }
        if let Some(density) = &self.density {
            fields.push(format!("\"density\":\"{density}\""));
        }
        format!("{{{}}}", fields.join(","))
    }
}

/// The appearance in use: the stored choice over the defaults.
#[derive(Clone, Debug, PartialEq, Eq)]
struct Appearance {
    theme: String,
    mode: String,
    density: String,
}

/// `resolve`: the stored fields win; an unknown default theme falls back to
/// `tympan`, as the model did.
fn resolve(
    stored: &StoredChoice,
    default_theme: &str,
    default_mode: ThemePaletteDefaultMode,
    default_density: ThemePaletteDefaultDensity,
) -> Appearance {
    Appearance {
        theme: stored.theme.clone().unwrap_or_else(|| {
            if Theme::from_name(default_theme).is_some() {
                default_theme.to_string()
            } else {
                String::from("tympan")
            }
        }),
        mode: stored
            .mode
            .clone()
            .unwrap_or_else(|| default_mode.as_str().to_string()),
        density: stored
            .density
            .clone()
            .unwrap_or_else(|| default_density.as_str().to_string()),
    }
}

/// What a choice or an `apply` reconciliation writes to the document
/// (`#applyToDocument`): the `data-ty-*` attributes and the print/font
/// stylesheet hrefs (`None` removes the link).
#[derive(Clone, Debug, PartialEq, Eq)]
struct ApplySpec {
    theme: String,
    mode: String,
    density: String,
    print_href: Option<String>,
    font_href: Option<String>,
}

fn spec_for(appearance: &Appearance, print_stylesheet: Option<&str>, load_fonts: bool) -> ApplySpec {
    let entry = Theme::from_name(&appearance.theme);
    ApplySpec {
        theme: appearance.theme.clone(),
        mode: appearance.mode.clone(),
        density: appearance.density.clone(),
        print_href: if entry.is_some_and(Theme::is_print) {
            print_stylesheet
                .filter(|href| !href.is_empty())
                .map(str::to_string)
        } else {
            None
        },
        font_href: if load_fonts {
            entry.and_then(|theme| theme.fonts_url()).map(str::to_string)
        } else {
            None
        },
    }
}

/// The translated names the rows need, from the label props and the
/// `theme-labels` JSON (the element's `#labels`).
struct PaletteLabels {
    group_presets: String,
    group_print: String,
    group_mode: String,
    group_density: String,
    mode_system: String,
    mode_light: String,
    mode_dark: String,
    density_compact: String,
    density_default: String,
    density_comfortable: String,
    themes: Vec<(String, String)>,
}

impl PaletteLabels {
    /// A theme's translated name, else its catalogue label.
    fn theme_label(&self, theme: Theme) -> String {
        self.themes
            .iter()
            .find(|(name, _)| name == theme.name())
            .map(|(_, label)| label.clone())
            .unwrap_or_else(|| theme.label().to_string())
    }
}

/// Which section a row belongs to (`data-kind`, the ids, the choice it sets).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum RowGroup {
    Preset,
    Print,
    Mode,
    Density,
}

impl RowGroup {
    fn as_str(self) -> &'static str {
        match self {
            RowGroup::Preset => "preset",
            RowGroup::Print => "print",
            RowGroup::Mode => "mode",
            RowGroup::Density => "density",
        }
    }
}

/// One option of the listbox (the model's `Row`, plus the flat index the
/// pointer handler moves the cursor to).
#[derive(Clone, Debug)]
struct Row {
    key: String,
    index: usize,
    group: RowGroup,
    value: String,
    label: String,
    hint: Option<String>,
    current: bool,
    /// The query's span in the label (char offsets), when it is shown marked.
    marks: Option<(usize, usize)>,
}

/// One group of the listbox (the model's `Section`).
struct Section {
    key: &'static str,
    heading: String,
    rows: Vec<Row>,
}

/// Positions of `query` in `label` (case and accent blind): `None` when it
/// is not there, `Some(None)` when it matches only through `also_in` (the
/// theme's name) so nothing is marked — the model's `match`.
fn match_row(label: &str, query: &str, also_in: &[&str]) -> Option<Option<(usize, usize)>> {
    let folded_query = fold(query.trim());
    if folded_query.is_empty() {
        return Some(None);
    }
    let folded_label = fold(label);
    if let Some(at) = folded_label.find(&folded_query) {
        let start = folded_label[..at].chars().count();
        return Some(Some((start, start + folded_query.chars().count())));
    }
    also_in
        .iter()
        .any(|extra| fold(extra).contains(&folded_query))
        .then_some(None)
}

/// Case- and accent-blind text, the model's `fold`: lowercased, with the
/// Latin letters that have a canonical decomposition (NFD) replaced by their
/// base letter, as `normalize('NFD')` plus stripping `\p{Diacritic}` did.
fn fold(text: &str) -> String {
    text.chars()
        .flat_map(char::to_lowercase)
        .map(strip_accent)
        .collect()
}

fn strip_accent(ch: char) -> char {
    match ch {
        'à' | 'á' | 'â' | 'ã' | 'ä' | 'å' | 'ā' | 'ă' | 'ą' => 'a',
        'ç' | 'ć' | 'ĉ' | 'ċ' | 'č' => 'c',
        'ď' => 'd',
        'è' | 'é' | 'ê' | 'ë' | 'ē' | 'ĕ' | 'ė' | 'ę' | 'ě' => 'e',
        'ĝ' | 'ğ' | 'ġ' | 'ģ' => 'g',
        'ĥ' => 'h',
        'ì' | 'í' | 'î' | 'ï' | 'ĩ' | 'ī' | 'ĭ' | 'į' => 'i',
        'ĵ' => 'j',
        'ķ' => 'k',
        'ĺ' | 'ļ' | 'ľ' => 'l',
        'ñ' | 'ń' | 'ņ' | 'ň' => 'n',
        'ò' | 'ó' | 'ô' | 'õ' | 'ö' | 'ō' | 'ŏ' | 'ő' => 'o',
        'ŕ' | 'ŗ' | 'ř' => 'r',
        'ś' | 'ŝ' | 'ş' | 'š' => 's',
        'ţ' | 'ť' => 't',
        'ù' | 'ú' | 'û' | 'ü' | 'ũ' | 'ū' | 'ŭ' | 'ů' | 'ű' | 'ų' => 'u',
        'ŵ' => 'w',
        'ý' | 'ÿ' | 'ŷ' => 'y',
        'ź' | 'ż' | 'ž' => 'z',
        _ => ch,
    }
}

/// The theme rows of one kind, in catalogue order (the model's `themeRows`).
fn theme_rows(
    kind: RowGroup,
    query: &str,
    current: &Appearance,
    labels: &PaletteLabels,
    offered: Option<&[String]>,
) -> Vec<Row> {
    Theme::ALL
        .into_iter()
        .filter(|theme| theme.is_print() == (kind == RowGroup::Print))
        .filter(|theme| offered.is_none_or(|names| names.iter().any(|name| name == theme.name())))
        .filter_map(|theme| {
            let label = labels.theme_label(theme);
            match_row(&label, query, &[theme.name()]).map(|marks| Row {
                key: format!("theme:{}", theme.name()),
                index: 0,
                group: kind,
                value: theme.name().to_string(),
                label,
                hint: Some(theme.name().to_string()),
                current: theme.name() == current.theme,
                marks,
            })
        })
        .collect()
}

/// The mode rows (the model's `mode` section).
fn mode_rows(query: &str, current: &Appearance, labels: &PaletteLabels) -> Vec<Row> {
    Mode::ALL
        .into_iter()
        .filter_map(|mode| {
            let label = match mode {
                Mode::System => labels.mode_system.clone(),
                Mode::Light => labels.mode_light.clone(),
                Mode::Dark => labels.mode_dark.clone(),
            };
            match_row(&label, query, &[mode.name()]).map(|marks| Row {
                key: format!("mode:{}", mode.name()),
                index: 0,
                group: RowGroup::Mode,
                value: mode.name().to_string(),
                label,
                hint: None,
                current: mode.name() == current.mode,
                marks,
            })
        })
        .collect()
}

/// The density rows (the model's `density` section).
fn density_rows(query: &str, current: &Appearance, labels: &PaletteLabels) -> Vec<Row> {
    Density::ALL
        .into_iter()
        .filter_map(|density| {
            let label = match density {
                Density::Compact => labels.density_compact.clone(),
                Density::Default => labels.density_default.clone(),
                Density::Comfortable => labels.density_comfortable.clone(),
            };
            match_row(&label, query, &[density.name()]).map(|marks| Row {
                key: format!("density:{}", density.name()),
                index: 0,
                group: RowGroup::Density,
                value: density.name().to_string(),
                label,
                hint: None,
                current: density.name() == current.density,
                marks,
            })
        })
        .collect()
}

/// The sections for `query`, in menu order; empty sections are left out
/// (the model's `sections`).
fn sections(
    query: &str,
    current: &Appearance,
    labels: &PaletteLabels,
    offered: Option<&[String]>,
) -> Vec<Section> {
    let mut out = Vec::new();
    let mut push = |key: &'static str, heading: &str, rows: Vec<Row>| {
        if !rows.is_empty() {
            out.push(Section {
                key,
                heading: heading.to_string(),
                rows,
            });
        }
    };
    push(
        RowGroup::Preset.as_str(),
        &labels.group_presets,
        theme_rows(RowGroup::Preset, query, current, labels, offered),
    );
    push(
        RowGroup::Print.as_str(),
        &labels.group_print,
        theme_rows(RowGroup::Print, query, current, labels, offered),
    );
    push(
        RowGroup::Mode.as_str(),
        &labels.group_mode,
        mode_rows(query, current, labels),
    );
    push(
        RowGroup::Density.as_str(),
        &labels.group_density,
        density_rows(query, current, labels),
    );
    out
}

/// A row key as an option id (`theme:tympan` → `i-theme-tympan`), as the
/// element's `key.replace(':', '-')`.
fn option_id(instance: &str, key: &str) -> String {
    format!("{}-{}", instance, key.replacen(':', "-", 1))
}

/// A flat JSON object with string values (`{"key": "value", …}`), the shape
/// of `theme-labels` and of the stored choice; `None` when malformed or not
/// exactly such an object, as `JSON.parse` throwing dropped the whole thing.
fn parse_object_strings(input: &str) -> Option<Vec<(String, String)>> {
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

        fn expect(&mut self, byte: u8) -> Option<()> {
            if self.peek() == Some(byte) {
                self.pos += 1;
                Some(())
            } else {
                None
            }
        }

        fn string(&mut self) -> Option<String> {
            self.expect(b'"')?;
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
                                out.push(self.escape_unicode()?);
                                continue;
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

        /// `\uXXXX` (with a surrogate pair when it takes one), consumed whole.
        fn escape_unicode(&mut self) -> Option<char> {
            let first = self.hex4()?;
            let code = if (0xD800..0xDC00).contains(&first) {
                self.expect(b'\\')?;
                let second = self.hex4()?;
                if !(0xDC00..0xE000).contains(&second) {
                    return None;
                }
                0x10000 + ((first - 0xD800) << 10) + (second - 0xDC00)
            } else {
                first
            };
            char::from_u32(code)
        }

        fn hex4(&mut self) -> Option<u32> {
            self.expect(b'u')?;
            let digits = self.input.get(self.pos..self.pos + 4)?;
            if !digits.iter().all(u8::is_ascii_hexdigit) {
                return None;
            }
            let value = u32::from_str_radix(std::str::from_utf8(digits).ok()?, 16).ok()?;
            self.pos += 4;
            Some(value)
        }
    }

    let mut parser = Parser {
        input: input.as_bytes(),
        pos: 0,
    };
    let mut fields = Vec::new();
    parser.skip_ws();
    parser.expect(b'{')?;
    parser.skip_ws();
    if parser.expect(b'}').is_none() {
        loop {
            parser.skip_ws();
            let key = parser.string()?;
            parser.skip_ws();
            parser.expect(b':')?;
            parser.skip_ws();
            let value = parser.string()?;
            fields.push((key, value));
            parser.skip_ws();
            if parser.expect(b',').is_some() {
                continue;
            }
            parser.expect(b'}')?;
            break;
        }
    }
    parser.skip_ws();
    (parser.pos == input.len()).then_some(fields)
}

/// Theme, mode and density picker in the command palette's look; a native <dialog> in the top layer while open.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyThemePalette(
    /// Shown (a modal dialog in the top layer).
    #[props(default)]
    open: bool,
    /// Apply the stored choice (or the defaults) to the document as soon as the element connects, and again when a default changes.
    #[props(default)]
    apply: bool,
    /// localStorage key of the choice ({ theme, mode, density } JSON, as ThemeProvider stores it).
    #[props(into, default = String::from("ty-theme"))]
    storage_key: String,
    /// Theme when nothing is stored (a host passes its organization default here).
    #[props(into, default = String::from("tympan"))]
    default_theme: String,
    /// Mode when nothing is stored.
    #[props(default)]
    default_mode: ThemePaletteDefaultMode,
    /// Density when nothing is stored.
    #[props(default)]
    default_density: ThemePaletteDefaultDensity,
    /// Comma-separated theme names to offer; all of them when empty.
    #[props(into)]
    themes: Option<String>,
    /// URL of print-themes.css, linked while a print theme is applied.
    #[props(into)]
    print_stylesheet: Option<String>,
    /// Link the font stylesheet a theme names (off: no request to a font host).
    #[props(default)]
    load_fonts: bool,
    /// JSON object of translated theme names, by theme name.
    #[props(into)]
    theme_labels: Option<String>,
    /// Accessible name of the dialog and the field.
    #[props(into, default = String::from("Appearance"))]
    label: String,
    /// Field placeholder.
    #[props(into, default = String::from("Search themes, modes and densities"))]
    placeholder: String,
    /// Shown when nothing matches.
    #[props(into, default = String::from("No matches"))]
    empty_label: String,
    /// Announced result count; {count} is replaced.
    #[props(into, default = String::from("{count} results"))]
    results_label: String,
    /// Heading of the built-in themes.
    #[props(into, default = String::from("Themes"))]
    group_presets: String,
    /// Heading of the print themes.
    #[props(into, default = String::from("Print styles"))]
    group_print: String,
    /// Heading of the colour modes.
    #[props(into, default = String::from("Mode"))]
    group_mode: String,
    /// Heading of the densities.
    #[props(into, default = String::from("Density"))]
    group_density: String,
    /// Label of the system colour mode.
    #[props(into, default = String::from("System"))]
    mode_system: String,
    /// Label of the light mode.
    #[props(into, default = String::from("Light"))]
    mode_light: String,
    /// Label of the dark mode.
    #[props(into, default = String::from("Dark"))]
    mode_dark: String,
    /// Label of the compact density.
    #[props(into, default = String::from("Compact"))]
    density_compact: String,
    /// Label of the default density.
    #[props(into, default = String::from("Default"))]
    density_default: String,
    /// Label of the comfortable density.
    #[props(into, default = String::from("Comfortable"))]
    density_comfortable: String,
    /// Marks the row in use.
    #[props(into, default = String::from("Current"))]
    current_label: String,
    /// Footer hint beside ↑↓.
    #[props(into, default = String::from("move"))]
    hint_navigate: String,
    /// Footer hint beside ↵.
    #[props(into, default = String::from("choose"))]
    hint_select: String,
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
    /// A row was chosen and applied; the detail is the whole appearance.
    on_theme_change: Option<EventHandler<ThemePaletteThemeChange>>,
    /// The palette asks to close (Escape, a press outside, or after a choice). The element closes itself too.
    on_close: Option<EventHandler<()>>,
) -> Element {
    let instance = use_instance_id(instance);

    // The search state the element kept in fields: the query and the cursor.
    let mut query = use_signal(String::new);
    let mut cursor = use_signal(|| 0usize);

    // The stored choice, read under `storage-key`; re-read when the key
    // moves, as the element read it through its `appearance` getter.
    let mut stored = use_signal(|| wasm::read_stored(&storage_key));
    let mut mirrored_key = use_signal(|| storage_key.clone());
    if storage_key != *mirrored_key.peek() {
        mirrored_key.set(storage_key.clone());
        stored.set(wasm::read_stored(&storage_key));
    }

    // Uncontrolled with a mirrored prop: the host may move `open`, otherwise
    // the element's own closes drive the state — it closes itself too
    // (Escape, a press outside, a choice), asking the host with `on_close`.
    let mut is_open = use_signal(|| open);
    let mut mirrored_open = use_signal(|| open);
    if open != *mirrored_open.peek() {
        mirrored_open.set(open);
        is_open.set(open);
        if open {
            // `#open` starts a fresh session: no query, cursor on the first row.
            query.set(String::new());
            cursor.set(0);
        }
    }

    let mut dialog = use_signal(|| None::<Rc<MountedData>>);
    let mut input = use_signal(|| None::<Rc<MountedData>>);
    let mut mirrored_on_close = use_signal(|| on_close);
    if *mirrored_on_close.peek() != on_close {
        mirrored_on_close.set(on_close);
    }

    // The appearance in use and what `apply` paints; re-applied when it
    // changes, as the element's `#reconcile`.
    let appearance = resolve(&stored(), &default_theme, default_mode, default_density);
    let spec = apply.then(|| spec_for(&appearance, print_stylesheet.as_deref(), load_fonts));
    let mut mirrored_spec = use_signal(|| spec.clone());
    if *mirrored_spec.peek() != spec {
        mirrored_spec.set(spec.clone());
    }
    wasm::follow_apply(mirrored_spec);
    wasm::follow_open(dialog, is_open, mirrored_on_close);

    // The palette asks to close and closes itself too.
    let mut request_close = move || {
        is_open.set(false);
        if let Some(handler) = on_close {
            handler.call(());
        }
    };

    // Choose a row: store the one field over what is stored, apply the whole
    // appearance (a choice applies regardless of `apply`), report it and
    // close — the element's `select` and `#run`.
    let run_row = {
        let storage_key = storage_key.clone();
        let default_theme = default_theme.clone();
        let print_stylesheet = print_stylesheet.clone();
        move |row: Row| {
            let mut next = stored();
            match row.group {
                RowGroup::Preset | RowGroup::Print => next.theme = Some(row.value.clone()),
                RowGroup::Mode => next.mode = Some(row.value.clone()),
                RowGroup::Density => next.density = Some(row.value.clone()),
            }
            stored.set(next.clone());
            wasm::write_stored(&storage_key, &next);
            let appearance = resolve(&next, &default_theme, default_mode, default_density);
            wasm::apply_now(&spec_for(&appearance, print_stylesheet.as_deref(), load_fonts));
            if let Some(handler) = on_theme_change {
                handler.call(ThemePaletteThemeChange {
                    theme: appearance.theme,
                    mode: appearance.mode,
                    density: appearance.density,
                });
            }
            request_close();
        }
    };

    // The rows, composed while open (the element's `#renderRows`).
    let shown = is_open();
    let offered: Option<Vec<String>> = {
        let names: Vec<String> = themes
            .as_deref()
            .unwrap_or_default()
            .split(',')
            .map(str::trim)
            .filter(|name| !name.is_empty())
            .map(str::to_string)
            .collect();
        (!names.is_empty()).then_some(names)
    };
    let mut found = Vec::new();
    let mut rows: Vec<Row> = Vec::new();
    if shown {
        let labels = PaletteLabels {
            group_presets: group_presets.clone(),
            group_print: group_print.clone(),
            group_mode: group_mode.clone(),
            group_density: group_density.clone(),
            mode_system: mode_system.clone(),
            mode_light: mode_light.clone(),
            mode_dark: mode_dark.clone(),
            density_compact: density_compact.clone(),
            density_default: density_default.clone(),
            density_comfortable: density_comfortable.clone(),
            themes: theme_labels
                .as_deref()
                .and_then(parse_object_strings)
                .unwrap_or_default(),
        };
        found = sections(&query(), &appearance, &labels, offered.as_deref());
        let mut index = 0;
        for section in &mut found {
            for row in &mut section.rows {
                row.index = index;
                index += 1;
            }
        }
        rows = found.iter().flat_map(|section| section.rows.clone()).collect();
    }

    // The cursor clamps onto the (possibly shrunk) rows, as `#renderRows`.
    let at = *cursor.peek();
    if at >= rows.len() {
        let clamped = rows.len().saturating_sub(1);
        if clamped != at {
            cursor.set(clamped);
        }
    }
    let current = rows.get(*cursor.peek());
    let current_id = current.map(|row| option_id(&instance, &row.key));
    let has_rows = !rows.is_empty();

    // Scroll the highlighted row into view once the render lands.
    let mut mirrored_highlight = use_signal(|| None::<String>);
    if current_id != *mirrored_highlight.peek() {
        mirrored_highlight.set(current_id.clone());
    }
    wasm::follow_highlight(dialog, mirrored_highlight);

    let status_text = if shown && !query().trim().is_empty() {
        results_label.replace("{count}", &rows.len().to_string())
    } else {
        String::new()
    };

    rsx! {
        ty-theme-palette {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "open": is_open().then_some("true"),
            "apply": apply.then_some(""),
            "storage-key": (!storage_key.is_empty()).then_some(storage_key.as_str()),
            "default-theme": (!default_theme.is_empty()).then_some(default_theme.as_str()),
            "default-mode": Some(default_mode.as_str()),
            "default-density": Some(default_density.as_str()),
            "themes": themes.as_deref().filter(|v| !v.is_empty()),
            "print-stylesheet": print_stylesheet.as_deref().filter(|v| !v.is_empty()),
            "load-fonts": load_fonts.then_some(""),
            "theme-labels": theme_labels.as_deref().filter(|v| !v.is_empty()),
            "label": (!label.is_empty()).then_some(label.as_str()),
            "placeholder": (!placeholder.is_empty()).then_some(placeholder.as_str()),
            "empty-label": (!empty_label.is_empty()).then_some(empty_label.as_str()),
            "results-label": (!results_label.is_empty()).then_some(results_label.as_str()),
            "group-presets": (!group_presets.is_empty()).then_some(group_presets.as_str()),
            "group-print": (!group_print.is_empty()).then_some(group_print.as_str()),
            "group-mode": (!group_mode.is_empty()).then_some(group_mode.as_str()),
            "group-density": (!group_density.is_empty()).then_some(group_density.as_str()),
            "mode-system": (!mode_system.is_empty()).then_some(mode_system.as_str()),
            "mode-light": (!mode_light.is_empty()).then_some(mode_light.as_str()),
            "mode-dark": (!mode_dark.is_empty()).then_some(mode_dark.as_str()),
            "density-compact": (!density_compact.is_empty()).then_some(density_compact.as_str()),
            "density-default": (!density_default.is_empty()).then_some(density_default.as_str()),
            "density-comfortable": (!density_comfortable.is_empty()).then_some(density_comfortable.as_str()),
            "current-label": (!current_label.is_empty()).then_some(current_label.as_str()),
            "hint-navigate": (!hint_navigate.is_empty()).then_some(hint_navigate.as_str()),
            "hint-select": (!hint_select.is_empty()).then_some(hint_select.as_str()),
            "hint-close": (!hint_close.is_empty()).then_some(hint_close.as_str()),
            if shown {
                dialog {
                    class: "ty-palette",
                    "aria-label": Some(label.clone()),
                    "data-ty-palette": Some(""),
                    onmounted: move |event: MountedEvent| dialog.set(Some(event.data())),
                    // A press on the dialog box itself (outside the palette's
                    // content) is a press outside.
                    onclick: move |_| request_close(),
                    div {
                        class: "ty-palette__dialog",
                        onclick: move |event: MouseEvent| event.stop_propagation(),
                        div {
                            class: "ty-palette__field",
                            svg {
                                class: "ty-palette__search-icon",
                                "viewBox": Some("0 0 24 24"),
                                "fill": Some("none"),
                                "stroke": Some("currentColor"),
                                "stroke-width": Some("2"),
                                "aria-hidden": Some("true"),
                                circle { "cx": Some("11"), "cy": Some("11"), "r": Some("7") }
                                path { "d": Some("m20 20-3.5-3.5") }
                            }
                            input {
                                class: "ty-palette__input",
                                "role": Some("combobox"),
                                "aria-label": Some(label.clone()),
                                "aria-autocomplete": Some("list"),
                                "aria-controls": Some(format!("{instance}-list")),
                                "placeholder": Some(placeholder.clone()),
                                "autocomplete": Some("off"),
                                "spellcheck": Some("false"),
                                "type": Some("text"),
                                "aria-expanded": Some(if has_rows { "true" } else { "false" }),
                                "aria-activedescendant": current_id.clone(),
                                onmounted: move |event: MountedEvent| input.set(Some(event.data())),
                                oninput: move |event: FormEvent| {
                                    query.set(event.value());
                                    cursor.set(0);
                                },
                                onkeydown: {
                                    let rows = rows.clone();
                                    let mut run_row = run_row.clone();
                                    move |event: KeyboardEvent| {
                                        let count = rows.len();
                                        match event.key() {
                                            Key::ArrowDown | Key::ArrowUp | Key::Home | Key::End => {
                                                event.prevent_default();
                                                if count > 0 {
                                                    let at = *cursor.peek();
                                                    let to = match event.key() {
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
                                            Key::Escape => {
                                                event.prevent_default();
                                                event.stop_propagation();
                                                if !query.peek().is_empty() {
                                                    query.set(String::new());
                                                    cursor.set(0);
                                                    wasm::clear_field(input);
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
                            div {
                                class: "ty-palette__results",
                                div {
                                    class: "ty-palette__list",
                                    "id": Some(format!("{instance}-list")),
                                    "role": Some("listbox"),
                                    "aria-label": Some(label.clone()),
                                    for section in &found {
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
                                                    let choice = row.clone();
                                                    let on = current.map(|c| &c.key) == Some(&row.key);
                                                    rsx! {
                                                        div {
                                                            key: "{row.key}",
                                                            class: "ty-palette__option",
                                                            "id": Some(option_id(&instance, &row.key)),
                                                            "role": Some("option"),
                                                            "aria-selected": Some(if on { "true" } else { "false" }),
                                                            "data-kind": Some(row.group.as_str()),
                                                            "data-highlighted": on.then_some(""),
                                                            "data-current": row.current.then_some(""),
                                                            onpointermove: move |_| {
                                                                if *cursor.peek() != index {
                                                                    cursor.set(index);
                                                                }
                                                            },
                                                            onmousedown: move |event: MouseEvent| event.prevent_default(),
                                                            onclick: {
                                                                let mut run_row = run_row.clone();
                                                                move |_| run_row(choice.clone())
                                                            },
                                                            span {
                                                                class: "ty-palette__icon",
                                                                "aria-hidden": Some("true"),
                                                                span {
                                                                    class: "ty-palette__swatch",
                                                                    "data-ty-theme": if matches!(row.group, RowGroup::Preset | RowGroup::Print) { Some(row.value.clone()) } else { None },
                                                                    "data-ty-mode": if row.group == RowGroup::Mode && row.value != "system" { Some(row.value.clone()) } else { None },
                                                                    "data-density-swatch": if row.group == RowGroup::Density { Some(row.value.clone()) } else { None },
                                                                }
                                                            }
                                                            span {
                                                                class: "ty-palette__text",
                                                                span {
                                                                    class: "ty-palette__label",
                                                                    if let Some((first, last)) = row.marks {
                                                                        {row.label.chars().take(first).collect::<String>()}
                                                                        mark {
                                                                            class: "ty-palette__mark",
                                                                            {row.label.chars().skip(first).take(last - first).collect::<String>()}
                                                                        }
                                                                        {row.label.chars().skip(last).collect::<String>()}
                                                                    } else {
                                                                        {row.label.clone()}
                                                                    }
                                                                }
                                                            }
                                                            if row.current {
                                                                span {
                                                                    class: "ty-palette__hint",
                                                                    {current_label.clone()}
                                                                }
                                                            } else if let Some(hint) = row.hint.clone().filter(|hint| *hint != row.label) {
                                                                span {
                                                                    class: "ty-palette__hint",
                                                                    {hint}
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                p {
                                    class: "ty-palette__empty",
                                    "hidden": if has_rows { Some("true") } else { None },
                                    {empty_label.clone()}
                                }
                            }
                        }
                        div {
                            class: "ty-palette__footer",
                            "aria-hidden": Some("true"),
                            span {
                                kbd { class: "ty-palette__kbd", "↑↓" }
                                " {hint_navigate}"
                            }
                            span {
                                kbd { class: "ty-palette__kbd", "↵" }
                                " {hint_select}"
                            }
                            span {
                                kbd { class: "ty-palette__kbd", "esc" }
                                " {hint_close}"
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

    use super::{ApplySpec, StoredChoice};

    pub fn read_stored(_key: &str) -> StoredChoice {
        StoredChoice::default()
    }

    pub fn write_stored(_key: &str, _choice: &StoredChoice) {}

    pub fn apply_now(_spec: &ApplySpec) {}

    pub fn follow_apply(_spec: Signal<Option<ApplySpec>>) {}

    pub fn follow_open(
        _dialog: Signal<Option<Rc<MountedData>>>,
        _open: Signal<bool>,
        _on_close: Signal<Option<EventHandler<()>>>,
    ) {
    }

    pub fn follow_highlight(
        _dialog: Signal<Option<Rc<MountedData>>>,
        _highlight: Signal<Option<String>>,
    ) {
    }

    pub fn clear_field(_input: Signal<Option<Rc<MountedData>>>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::cell::RefCell;
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    use super::{parse_object_strings, ApplySpec, StoredChoice};

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

    /// The stored choice from localStorage; a missing, blocked or broken
    /// store reads as empty, as the element's `readStored`.
    pub fn read_stored(key: &str) -> StoredChoice {
        storage()
            .and_then(|store| store.get_item(key).ok().flatten())
            .and_then(|raw| parse_object_strings(&raw))
            .map(|fields| StoredChoice::from_fields(&fields))
            .unwrap_or_default()
    }

    /// Persist the choice, tolerant of storage failing — the element's
    /// `writeStored` (the choice still applies for this page).
    pub fn write_stored(key: &str, choice: &StoredChoice) {
        if let Some(store) = storage() {
            let _ = store.set_item(key, &choice.to_json());
        }
    }

    /// `#applyToDocument`: the `data-ty-*` attributes on `<html>` and the
    /// print/font stylesheet links.
    pub fn apply_now(spec: &ApplySpec) {
        let Some(document) = document() else { return };
        if let Some(root) = document.document_element() {
            let _ = root.set_attribute("data-ty-theme", &spec.theme);
            let _ = root.set_attribute("data-ty-mode", &spec.mode);
            let _ = root.set_attribute("data-ty-density", &spec.density);
        }
        sync_link(&document, "ty-print-themes", spec.print_href.as_deref());
        sync_link(&document, "ty-theme-fonts", spec.font_href.as_deref());
    }

    /// `apply` follows the defaults: re-apply whenever the resolved
    /// appearance (or the stylesheet props) changes, as the element's
    /// `#reconcile` did on connect and on attribute changes.
    pub fn follow_apply(spec: Signal<Option<ApplySpec>>) {
        use_effect(move || {
            if let Some(spec) = spec() {
                apply_now(&spec);
            }
        });
    }

    /// The modal contract, driven by `open` and the dialog's mount: on open,
    /// `showModal` puts the native `<dialog>` in the top layer (the rest of
    /// the page inert, Escape cancelling), focus moves to the field and the
    /// `cancel` event closes; on close or unmount, focus returns to what had
    /// it. The element's `#open` / `#close` / `disconnected`.
    pub fn follow_open(
        dialog: Signal<Option<Rc<MountedData>>>,
        mut open: Signal<bool>,
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
            let shown = open();
            let guard = modal.peek();
            let mut state = guard.borrow_mut();
            if !shown {
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
            // close and close like the field's Escape, as the element's
            // `cancel` listener.
            let target: web_sys::EventTarget = element.into();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |event: web_sys::Event| {
                event.prevent_default();
                open.set(false);
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

    /// Empty the field (Escape with a query), as the element's `#onKey`.
    pub fn clear_field(input: Signal<Option<Rc<MountedData>>>) {
        if let Some(field) = input_element(input) {
            field.set_value("");
        }
    }

    /// `#link`: one stylesheet link by id; `None` removes it.
    fn sync_link(document: &web_sys::Document, id: &str, href: Option<&str>) {
        let existing = document.get_element_by_id(id);
        let Some(href) = href else {
            if let Some(existing) = existing {
                existing.remove();
            }
            return;
        };
        if let Some(existing) = existing {
            if existing.get_attribute("href").as_deref() != Some(href) {
                let _ = existing.set_attribute("href", href);
            }
            return;
        }
        let Ok(link) = document.create_element("link") else {
            return;
        };
        let _ = link.set_attribute("id", id);
        let _ = link.set_attribute("rel", "stylesheet");
        let _ = link.set_attribute("href", href);
        if let Ok(Some(head)) = document.query_selector("head") {
            let _ = head.append_child(&link);
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

    fn input_element(input: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::HtmlInputElement> {
        input()?
            .downcast::<web_sys::Element>()
            .cloned()?
            .dyn_into::<web_sys::HtmlInputElement>()
            .ok()
    }
}
