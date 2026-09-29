//! Native port of `<ty-currency-field>`: a native `<input>` inside, so
//! typing, keyboard, autofill and form participation are the platform's,
//! as in the custom element. On top of that the port keeps what the
//! element added in script: the typed text parsed (digits of any script
//! and the first locale decimal mark; extra fraction digits and leading
//! zeros dropped), the display regrouped in the locale's separators and
//! digits on every edit with the caret kept after the same digit, the
//! canonical value ("1500000.5", "" when empty) reported as
//! `on_value_change`, the controlled `value` mirrored into the input as
//! grouped display text (a no-op while the user types — an echo of the
//! last reported value keeps the trailing decimal mark and the caret),
//! `default-value` applied once (the value a form reset returns to), the
//! currency symbol and the visually hidden note that names the currency,
//! and the mobile keyboard mode. While an input method composes text,
//! edits are ignored and the field is reformatted once at
//! `compositionend`. The grouped display, the symbol, the note and the
//! input mode are painted onto the DOM after mount (Intl is the
//! platform's), exactly as the element did on connect, so SSR stays the
//! rendered anatomy.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Type scale step; `display` uses the KPI numeral style.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum CurrencyFieldSize {
    Small,
    #[default]
    Medium,
    Large,
    Display,
}

impl CurrencyFieldSize {
    pub const fn as_str(self) -> &'static str {
        match self {
            CurrencyFieldSize::Small => "small",
            CurrencyFieldSize::Medium => "medium",
            CurrencyFieldSize::Large => "large",
            CurrencyFieldSize::Display => "display",
        }
    }
}

/// After every edit; `value` is the canonical number (digits, an optional dot and decimals, never grouped; "" when empty). The display text is never reported.
#[derive(Clone, Debug, PartialEq)]
pub struct CurrencyFieldValueChange {
    pub value: String,
}

/// The canonical value, the decimals and the resolved locale of the text
/// last painted onto the input — the element's draft/reported guard.
type Painted = (String, usize, String);

/// Parse, regroup, restore the caret (inside `wasm::reformat`) and report
/// the canonical value, as the element's `input` listener did.
fn reformat_and_report(
    input: Signal<Option<Rc<MountedData>>>,
    mut state: Signal<String>,
    painted: Signal<Option<Painted>>,
    decimals: f64,
    locale: &Option<String>,
    on_value_change: Option<EventHandler<CurrencyFieldValueChange>>,
) {
    let Some(canonical) = wasm::reformat(input, painted, decimals, locale) else {
        return;
    };
    state.set(canonical.clone());
    if let Some(handler) = on_value_change {
        handler.call(CurrencyFieldValueChange { value: canonical });
    }
}

/// Money or count entry with live grouping in the locale's separators; reports a plain canonical number (digits, an optional dot and decimals, never grouped). A native <input> inside, so typing, keyboard, autofill and form participation are the platform's; the element regroups the display on every edit, keeps the caret after the same digit, shows the currency symbol and names the currency to assistive technology.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyCurrencyField(
    /// Canonical value: digits with an optional dot and decimals, never grouped ("1500000.5"); "" when empty. The element mirrors it into the control as grouped display text (while the user types, the live value is the control's own).
    #[props(into)]
    value: Option<String>,
    /// Initial canonical value of an uncontrolled field, applied once on connect; a form reset returns to it.
    #[props(into)]
    default_value: Option<String>,
    /// ISO 4217 code ("BRL"); the symbol is shown (visual only) and the currency name is announced as part of the description. Omit for plain counts.
    #[props(into)]
    currency: Option<String>,
    /// Maximum fraction digits; 0 means integers only (the decimal separator is ignored and the mobile keyboard is numeric).
    #[props(default = 2.0f64)]
    decimals: f64,
    /// Locale that decides the group and decimal separators ("pt-BR"); the document language, then the browser locale, when unset. Changing it changes only the display, never the canonical value.
    #[props(into)]
    locale: Option<String>,
    /// Type scale step; `display` uses the KPI numeral style.
    #[props(default)]
    size: CurrencyFieldSize,
    /// Template of the visually hidden currency note; `{currency}` is filled with the locale's currency name ("Currency: Brazilian real").
    #[props(into, default = String::from("Currency: {currency}"))]
    currency_label: String,
    /// Native required.
    #[props(default)]
    required: bool,
    /// Native disabled.
    #[props(default)]
    disabled: bool,
    /// Shown but not changeable.
    #[props(default)]
    read_only: bool,
    /// Painted and announced as invalid without an error message (a surrounding field marks it).
    #[props(default)]
    invalid: bool,
    /// Form field name.
    #[props(into)]
    name: Option<String>,
    /// Native placeholder.
    #[props(into)]
    placeholder: Option<String>,
    /// Accessible name when there is no visible label.
    #[props(into)]
    accessible_label: Option<String>,
    /// `aria-labelledby` from a surrounding field (used when there is no visible label and no `accessibleLabel`).
    #[props(into)]
    labelled_by: Option<String>,
    /// `aria-describedby` from a surrounding field, joined before the field's own parts.
    #[props(into)]
    described_by: Option<String>,
    /// Explicit id of the control (a surrounding field's control id); `<instance>-input` otherwise.
    #[props(into)]
    control_id: Option<String>,
    /// Test hook on the root (`data-testid`).
    #[props(into)]
    test_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The visible label, targeting the input.
    label: Option<Element>,
    /// Help text above the group, announced as the description.
    hint: Option<Element>,
    /// The error message; marks the field invalid and is announced.
    error: Option<Element>,
    /// After every edit; `value` is the canonical number (digits, an optional dot and decimals, never grouped; "" when empty). The display text is never reported.
    on_value_change: Option<EventHandler<CurrencyFieldValueChange>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_label = label.is_some();
    let slot_hint = hint.is_some();
    let slot_error = error.is_some();

    // Uncontrolled with a mirrored prop: the parent may move `value`,
    // otherwise the input's own edits drive the canonical state;
    // `default-value` is only the seed of an uncontrolled field.
    let mut state = use_signal(|| {
        value
            .clone()
            .or_else(|| default_value.clone())
            .unwrap_or_default()
    });
    let mut mirrored_value = use_signal(|| value.clone());
    if value != *mirrored_value.peek() {
        mirrored_value.set(value.clone());
        if let Some(text) = value.clone() {
            state.set(text);
        }
    }
    // While an input method composes text, edits are ignored and the
    // field is reformatted once at compositionend.
    let mut composing = use_signal(|| false);
    let painted = use_signal(|| None::<Painted>);

    let mut root = use_signal(|| None::<Rc<MountedData>>);
    let mut input = use_signal(|| None::<Rc<MountedData>>);
    wasm::mirror_value(
        input,
        state,
        painted,
        default_value.clone(),
        decimals,
        locale.clone(),
    );
    wasm::paint_currency(
        root,
        currency.clone(),
        locale.clone(),
        currency_label.clone(),
    );

    let locale_on_input = locale.clone();
    let locale_on_composition_end = locale.clone();

    rsx! {
        ty-currency-field {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "value": value.as_deref().filter(|v| !v.is_empty()),
            "default-value": default_value.as_deref().filter(|v| !v.is_empty()),
            "currency": currency.as_deref().filter(|v| !v.is_empty()),
            "decimals": Some(decimals.to_string()),
            "locale": locale.as_deref().filter(|v| !v.is_empty()),
            "size": Some(size.as_str()),
            "currency-label": (!currency_label.is_empty()).then_some(currency_label.as_str()),
            "required": required.then_some("true"),
            "disabled": disabled.then_some("true"),
            "read-only": read_only.then_some(""),
            "invalid": invalid.then_some(""),
            "name": name.as_deref().filter(|v| !v.is_empty()),
            "placeholder": placeholder.as_deref().filter(|v| !v.is_empty()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "labelled-by": labelled_by.as_deref().filter(|v| !v.is_empty()),
            "described-by": described_by.as_deref().filter(|v| !v.is_empty()),
            "control-id": control_id.as_deref().filter(|v| !v.is_empty()),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            onmounted: move |event: MountedEvent| root.set(Some(event.data())),
            div {
                class: "ty-currency-field",
                "data-size": Some(size.as_str()),
                "data-invalid": if invalid || slot_error { Some("") } else { None },
                "data-readonly": read_only.then_some(""),
                "data-disabled": disabled.then_some(""),
                "data-testid": test_id.as_deref().filter(|v| !v.is_empty()),
                div {
                    class: "ty-currency-field__field",
                    if slot_label {
                        label {
                            class: "ty-fb-line",
                            "data-line": Some("label"),
                            "for": control_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-input"))),
                            {label.clone()}
                        }
                    }
                    if slot_hint {
                        p {
                            class: "ty-fb-line",
                            "data-line": Some("hint"),
                            "id": Some(format!("{instance}-hint")),
                            {hint.clone()}
                        }
                    }
                    div {
                        class: "ty-currency-field__box",
                        if currency.as_deref().is_some_and(|v| !v.is_empty()) {
                            span {
                                class: "ty-currency-field__symbol",
                                "aria-hidden": Some("true"),
                            }
                        }
                        input {
                            class: "ty-currency-field__input",
                            "id": control_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-input"))),
                            "type": Some("text"),
                            "name": name.as_deref().filter(|v| !v.is_empty()),
                            "placeholder": placeholder.as_deref().filter(|v| !v.is_empty()),
                            "autocomplete": Some("off"),
                            disabled: disabled,
                            readonly: read_only,
                            required: required,
                            "aria-label": if !slot_label { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                            "aria-labelledby": if !slot_label && !(accessible_label.as_deref().is_some_and(|v| !v.is_empty())) { labelled_by.as_deref().filter(|v| !v.is_empty()) } else { None },
                            "aria-describedby": { let ids: Vec<String> = [described_by.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()), if slot_hint { Some(format!("{instance}-hint")) } else { None }, if currency.as_deref().is_some_and(|v| !v.is_empty()) { Some(format!("{instance}-currency")) } else { None }, if slot_error { Some(format!("{instance}-error")) } else { None }].into_iter().flatten().collect(); (!ids.is_empty()).then_some(ids.join(" ")) },
                            "aria-invalid": if invalid || slot_error { Some("true") } else { None },
                            onmounted: move |event: MountedEvent| input.set(Some(event.data())),
                            oninput: move |_event: FormEvent| {
                                if composing() {
                                    return;
                                }
                                reformat_and_report(input, state, painted, decimals, &locale_on_input, on_value_change);
                            },
                            oncompositionstart: move |_| {
                                composing.set(true);
                            },
                            oncompositionend: move |_| {
                                composing.set(false);
                                reformat_and_report(input, state, painted, decimals, &locale_on_composition_end, on_value_change);
                            },
                        }
                    }
                    if currency.as_deref().is_some_and(|v| !v.is_empty()) {
                        span {
                            class: "ty-visually-hidden ty-currency-field__currency",
                            "id": Some(format!("{instance}-currency")),
                        }
                    }
                    if slot_error {
                        p {
                            class: "ty-fb-line",
                            "data-line": Some("error"),
                            "id": Some(format!("{instance}-error")),
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
                                    class: "ty-currency-field__glyph",
                                    "cx": Some("12"),
                                    "cy": Some("12"),
                                    "r": Some("10"),
                                }
                                line {
                                    class: "ty-currency-field__glyph",
                                    "x1": Some("12"),
                                    "y1": Some("8"),
                                    "x2": Some("12"),
                                    "y2": Some("12"),
                                }
                                line {
                                    class: "ty-currency-field__glyph",
                                    "x1": Some("12"),
                                    "y1": Some("16"),
                                    "x2": Some("12.01"),
                                    "y2": Some("16"),
                                }
                            }
                            span {
                                class: "ty-currency-field__error-text",
                                {error.clone()}
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
    use std::rc::Rc;

    use dioxus::prelude::*;

    use super::Painted;

    pub fn mirror_value(
        _input: Signal<Option<Rc<MountedData>>>,
        _state: Signal<String>,
        _painted: Signal<Option<Painted>>,
        _default_value: Option<String>,
        _decimals: f64,
        _locale: Option<String>,
    ) {
    }

    pub fn paint_currency(
        _root: Signal<Option<Rc<MountedData>>>,
        _currency: Option<String>,
        _locale: Option<String>,
        _currency_label: String,
    ) {
    }

    pub fn reformat(
        _input: Signal<Option<Rc<MountedData>>>,
        _painted: Signal<Option<Painted>>,
        _decimals: f64,
        _locale: &Option<String>,
    ) -> Option<String> {
        None
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::{JsCast, JsValue};

    use super::Painted;

    /// The group and decimal separators and the ten digits of the resolved
    /// locale, recomputed when it changes (the element's cached format).
    struct Format {
        locale: String,
        group: String,
        decimal: String,
        digits: Vec<String>,
    }

    impl Format {
        fn of(wanted: &Option<String>) -> Format {
            let locale = resolve_locale(wanted);
            let mut group = String::from(",");
            let mut decimal = String::from(".");
            if let Some(formatter) = number_format(&locale, None) {
                for (kind, value) in parts_of(&formatter, 1234567.5) {
                    match kind.as_str() {
                        "group" => group = value,
                        "decimal" => decimal = value,
                        _ => {}
                    }
                }
            }
            let digits = locale_digits(&locale);
            Format {
                locale,
                group,
                decimal,
                digits,
            }
        }
    }

    /// Reading of typed text: integer digits, whether a decimal mark was
    /// typed, fraction digits.
    #[derive(Default)]
    struct Reading {
        whole: String,
        mark: bool,
        fraction: String,
    }

    /// The input's text is a property, not an attribute, and the grouped
    /// display is derived state: paint both after mount, as the element
    /// did on connect. An echo of the last reported value keeps the draft
    /// display — its trailing decimal mark and the caret are display state
    /// the canonical value cannot carry. `default-value` is applied once;
    /// it is what a form reset returns to.
    pub fn mirror_value(
        input: Signal<Option<Rc<MountedData>>>,
        state: Signal<String>,
        mut painted: Signal<Option<Painted>>,
        default_value: Option<String>,
        decimals: f64,
        locale: Option<String>,
    ) {
        let mut applied = use_signal(|| false);
        use_effect(move || {
            let Some(field) = input_element(input) else { return };
            let format = Format::of(&locale);
            let decimals = decimals_of(decimals);
            let canonical = state();
            if !*applied.peek() {
                applied.set(true);
                if let Some(initial) = default_value.as_deref().filter(|v| !v.is_empty()) {
                    field.set_default_value(&display(&read_canonical(initial, decimals), &format));
                }
            }
            // Numeric mobile keyboard for integers, decimal otherwise.
            let mode = if decimals == 0 { "numeric" } else { "decimal" };
            if field.get_attribute("inputmode").as_deref() != Some(mode) {
                let _ = field.set_attribute("inputmode", mode);
            }
            if painted.peek().as_ref()
                == Some(&(canonical.clone(), decimals, format.locale.clone()))
            {
                return;
            }
            let text = display(&read_canonical(&canonical, decimals), &format);
            if field.value() != text {
                field.set_value(&text);
            }
            painted.set(Some((canonical, decimals, format.locale.clone())));
        });
    }

    /// The currency symbol (visual) and the hidden note that names the
    /// currency — text content only, painted after mount as the element
    /// did, so SSR never carries them.
    pub fn paint_currency(
        root: Signal<Option<Rc<MountedData>>>,
        currency: Option<String>,
        locale: Option<String>,
        currency_label: String,
    ) {
        use_effect(move || {
            let Some(root) = root_element(root) else { return };
            let Some(currency) = currency.as_deref().filter(|v| !v.is_empty()) else {
                return;
            };
            let locale = resolve_locale(&locale);
            if let Ok(Some(symbol)) = root.query_selector(".ty-currency-field__symbol") {
                let text = symbol_of(currency, &locale);
                if symbol.text_content().as_deref() != Some(text.as_str()) {
                    symbol.set_text_content(Some(&text));
                }
            }
            if let Ok(Some(note)) = root.query_selector(".ty-currency-field__currency") {
                let text = currency_label.replace("{currency}", &currency_name(currency, &locale));
                if note.text_content().as_deref() != Some(text.as_str()) {
                    note.set_text_content(Some(&text));
                }
            }
        });
    }

    /// Parse, regroup, restore the caret after the same digit and return
    /// the canonical value — the element's `input` handling.
    pub fn reformat(
        input: Signal<Option<Rc<MountedData>>>,
        mut painted: Signal<Option<Painted>>,
        decimals: f64,
        locale: &Option<String>,
    ) -> Option<String> {
        let field = input_element(input)?;
        let format = Format::of(locale);
        let decimals = decimals_of(decimals);
        let decimal = single_char(&format.decimal);
        let raw = field.value();
        let caret_units = field
            .selection_start()
            .ok()
            .flatten()
            .unwrap_or(utf16_len(&raw) as u32) as usize;
        let caret = char_index_at_utf16(&raw, caret_units);
        let mut count = meaningful_before(&raw, caret, decimal);
        let reading = read_typed(&raw, decimal, decimals);
        // Leading zeros dropped before the caret shift it left.
        let typed_whole = raw
            .split(format.decimal.as_str())
            .next()
            .unwrap_or_default()
            .chars()
            .filter(|ch| ch.is_ascii_digit())
            .count();
        let dropped = typed_whole as isize - reading.whole.len() as isize;
        if dropped > 0 {
            count = count.saturating_sub(dropped as usize);
        }
        let canonical = canonical_of(&reading);
        let text = display(&reading, &format);
        if field.value() != text {
            field.set_value(&text);
        }
        let text = field.value();
        let at = utf16_index_of_char(&text, position_after(&text, count, decimal)) as u32;
        let start = field.selection_start().ok().flatten();
        let end = field.selection_end().ok().flatten();
        if start != Some(at) || end != Some(at) {
            let _ = field.set_selection_range(at, at);
        }
        painted.set(Some((canonical.clone(), decimals, format.locale.clone())));
        Some(canonical)
    }

    /// The prop locale, else the document language, else the browser's; a
    /// bad tag falls back to en-US.
    fn resolve_locale(wanted: &Option<String>) -> String {
        let candidate = wanted
            .as_deref()
            .filter(|v| !v.is_empty())
            .map(str::to_string)
            .or_else(document_lang)
            .or_else(navigator_language)
            .unwrap_or_else(|| String::from("en-US"));
        if number_format(&candidate, None).is_some() {
            candidate
        } else {
            String::from("en-US")
        }
    }

    fn document_lang() -> Option<String> {
        web_sys::window()?
            .document()?
            .document_element()?
            .get_attribute("lang")
            .filter(|v| !v.is_empty())
    }

    fn navigator_language() -> Option<String> {
        let window: JsValue = web_sys::window()?.into();
        let navigator = js_sys::Reflect::get(&window, &JsValue::from_str("navigator")).ok()?;
        js_sys::Reflect::get(&navigator, &JsValue::from_str("language"))
            .ok()
            .and_then(|language| language.as_string())
            .filter(|v| !v.is_empty())
    }

    /// An `Intl` constructor, resolved dynamically so a throwing call is a
    /// catchable `Err`, as the element's `try`/`catch` made it.
    fn intl_constructor(name: &str) -> Option<js_sys::Function> {
        let intl = js_sys::Reflect::get(&js_sys::global(), &JsValue::from_str("Intl")).ok()?;
        js_sys::Reflect::get(&intl, &JsValue::from_str(name))
            .ok()?
            .dyn_into::<js_sys::Function>()
            .ok()
    }

    /// `new Intl.NumberFormat(locale)` — plain, or `style: "currency"`.
    fn number_format(locale: &str, currency: Option<&str>) -> Option<JsValue> {
        let ctor = intl_constructor("NumberFormat")?;
        let options = js_sys::Object::new();
        if let Some(currency) = currency {
            let _ = js_sys::Reflect::set(
                &options,
                &JsValue::from_str("style"),
                &JsValue::from_str("currency"),
            );
            let _ = js_sys::Reflect::set(
                &options,
                &JsValue::from_str("currency"),
                &JsValue::from_str(currency),
            );
        }
        let args = js_sys::Array::new();
        args.push(&JsValue::from_str(locale));
        args.push(&options);
        js_sys::Reflect::construct(&ctor, &args).ok()
    }

    /// `formatToParts(number)` as `(type, value)` pairs.
    fn parts_of(target: &JsValue, number: f64) -> Vec<(String, String)> {
        call(target, "formatToParts", &JsValue::from_f64(number))
            .and_then(|parts| parts.dyn_into::<js_sys::Array>().ok())
            .map(|parts| {
                parts
                    .iter()
                    .map(|part| {
                        let kind = js_sys::Reflect::get(&part, &JsValue::from_str("type"))
                            .ok()
                            .and_then(|v| v.as_string())
                            .unwrap_or_default();
                        let value = js_sys::Reflect::get(&part, &JsValue::from_str("value"))
                            .ok()
                            .and_then(|v| v.as_string())
                            .unwrap_or_default();
                        (kind, value)
                    })
                    .collect()
            })
            .unwrap_or_default()
    }

    /// The locale's ten digits, in order ("0123456789", "٠١٢٣٤٥٦٧٨٩", …).
    fn locale_digits(locale: &str) -> Vec<String> {
        let formatter = intl_constructor("NumberFormat").and_then(|ctor| {
            let options = js_sys::Object::new();
            let _ = js_sys::Reflect::set(
                &options,
                &JsValue::from_str("useGrouping"),
                &JsValue::FALSE,
            );
            let args = js_sys::Array::new();
            args.push(&JsValue::from_str(locale));
            args.push(&options);
            js_sys::Reflect::construct(&ctor, &args).ok()
        });
        (0..10)
            .map(|d| {
                formatter
                    .as_ref()
                    .and_then(|nf| call_string(nf, "format", &JsValue::from_f64(d as f64)))
                    .unwrap_or_else(|| d.to_string())
            })
            .collect()
    }

    /// The currency's symbol in the locale ("R$"), or the code itself.
    fn symbol_of(currency: &str, locale: &str) -> String {
        number_format(locale, Some(currency))
            .and_then(|formatter| {
                parts_of(&formatter, 0.0)
                    .into_iter()
                    .find(|(kind, _)| kind == "currency")
                    .map(|(_, value)| value)
            })
            .unwrap_or_else(|| currency.to_string())
    }

    /// The currency's display name in the locale ("Brazilian real"), or
    /// the code itself.
    fn currency_name(currency: &str, locale: &str) -> String {
        intl_constructor("DisplayNames")
            .and_then(|ctor| {
                let options = js_sys::Object::new();
                let _ = js_sys::Reflect::set(
                    &options,
                    &JsValue::from_str("type"),
                    &JsValue::from_str("currency"),
                );
                let args = js_sys::Array::new();
                args.push(&JsValue::from_str(locale));
                args.push(&options);
                js_sys::Reflect::construct(&ctor, &args).ok()
            })
            .and_then(|names| call_string(&names, "of", &JsValue::from_str(currency)))
            .unwrap_or_else(|| currency.to_string())
    }

    fn call(target: &JsValue, method: &str, arg: &JsValue) -> Option<JsValue> {
        js_sys::Reflect::get(target, &JsValue::from_str(method))
            .ok()?
            .dyn_into::<js_sys::Function>()
            .ok()?
            .call1(target, arg)
            .ok()
    }

    fn call_string(target: &JsValue, method: &str, arg: &JsValue) -> Option<String> {
        call(target, method, arg)?.as_string()
    }

    /// Maximum fraction digits; a non-finite or negative prop means 2.
    fn decimals_of(raw: f64) -> usize {
        if raw.is_finite() && raw >= 0.0 {
            raw.floor() as usize
        } else {
            2
        }
    }

    /// The decimal mark as one char; a multi-char mark never matches a
    /// single typed char, exactly as the element's `ch === decimal`.
    fn single_char(text: &str) -> Option<char> {
        let mut chars = text.chars();
        match (chars.next(), chars.next()) {
            (Some(ch), None) => Some(ch),
            _ => None,
        }
    }

    /// Keeps digits and the first locale decimal mark; drops extra
    /// fraction digits and leading zeros.
    fn read_typed(raw: &str, decimal: Option<char>, decimals: usize) -> Reading {
        let mut out = Reading::default();
        for ch in ascii_digits(raw).chars() {
            if ch.is_ascii_digit() {
                if !out.mark {
                    out.whole.push(ch);
                } else if out.fraction.len() < decimals {
                    out.fraction.push(ch);
                }
            } else if Some(ch) == decimal && decimals > 0 && !out.mark {
                out.mark = true;
            }
        }
        let stripped = out.whole.trim_start_matches('0');
        out.whole = if stripped.is_empty() && !out.whole.is_empty() {
            String::from("0")
        } else {
            stripped.to_string()
        };
        if out.mark && out.whole.is_empty() {
            out.whole = String::from("0");
        }
        out
    }

    /// Canonical, machine-readable form of a reading ("1500000.5").
    fn canonical_of(reading: &Reading) -> String {
        if reading.whole.is_empty() && !reading.mark {
            String::new()
        } else if !reading.fraction.is_empty() {
            format!("{}.{}", reading.whole, reading.fraction)
        } else {
            reading.whole.clone()
        }
    }

    /// Parses a canonical value back into a reading.
    fn read_canonical(value: &str, decimals: usize) -> Reading {
        let mut parts = value.splitn(2, '.');
        let whole = parts.next().unwrap_or_default();
        let fraction = parts.next().unwrap_or_default();
        Reading {
            whole: whole.chars().filter(|ch| ch.is_ascii_digit()).collect(),
            mark: value.contains('.') && decimals > 0,
            fraction: fraction
                .chars()
                .filter(|ch| ch.is_ascii_digit())
                .take(decimals)
                .collect(),
        }
    }

    /// Groups the integer part with the locale separator and shows the
    /// locale's digits.
    fn display(reading: &Reading, format: &Format) -> String {
        let mut text = String::new();
        let digits = reading.whole.len();
        for (i, ch) in reading.whole.chars().enumerate() {
            if i > 0 && (digits - i) % 3 == 0 {
                text.push_str(&format.group);
            }
            text.push(ch);
        }
        if reading.mark {
            text.push_str(&format.decimal);
            text.push_str(&reading.fraction);
        }
        with_locale_digits(&text, &format.digits)
    }

    /// Count of meaningful characters (digits and the decimal mark)
    /// before the `end` char index.
    fn meaningful_before(text: &str, end: usize, decimal: Option<char>) -> usize {
        text.chars()
            .take(end)
            .filter(|&ch| is_digit(ch) || Some(ch) == decimal)
            .count()
    }

    /// Char index just after the `count`-th meaningful character.
    fn position_after(text: &str, count: usize, decimal: Option<char>) -> usize {
        if count == 0 {
            return 0;
        }
        let mut seen = 0;
        for (i, ch) in text.chars().enumerate() {
            if is_digit(ch) || Some(ch) == decimal {
                seen += 1;
            }
            if seen == count {
                return i + 1;
            }
        }
        text.chars().count()
    }

    thread_local! {
        /// `/^\p{Nd}$/u`: a decimal digit of any script.
        static DECIMAL_DIGIT: js_sys::RegExp = js_sys::RegExp::new("^\\p{Nd}$", "u");
    }

    fn is_digit(ch: char) -> bool {
        let mut buf = [0u8; 4];
        DECIMAL_DIGIT.with(|re| re.test(ch.encode_utf8(&mut buf)))
    }

    /// Numeric value (0–9) of one decimal digit of any script, or None.
    fn digit_value(ch: char) -> Option<u32> {
        if !is_digit(ch) {
            return None;
        }
        let cp = ch as u32;
        // Decimal digits come in contiguous runs starting at zero; walk
        // back to the run's start.
        let mut zero = cp;
        while zero > 0 && char::from_u32(zero - 1).is_some_and(is_digit) {
            zero -= 1;
        }
        Some((cp - zero) % 10)
    }

    /// Replaces every decimal digit, whatever its script, by its ASCII
    /// digit.
    fn ascii_digits(text: &str) -> String {
        text.chars()
            .map(|ch| match digit_value(ch).and_then(|d| char::from_digit(d, 10)) {
                Some(ascii) => ascii,
                None => ch,
            })
            .collect()
    }

    /// Rewrites ASCII digits with the locale's digits.
    fn with_locale_digits(text: &str, digits: &[String]) -> String {
        let mut out = String::with_capacity(text.len());
        for ch in text.chars() {
            if ch.is_ascii_digit() {
                out.push_str(&digits[ch as usize - '0' as usize]);
            } else {
                out.push(ch);
            }
        }
        out
    }

    /// Selection APIs count UTF-16 code units; the helpers above count
    /// chars. Convert at the boundary.
    fn utf16_len(text: &str) -> usize {
        text.chars().map(char::len_utf16).sum()
    }

    fn char_index_at_utf16(text: &str, pos: usize) -> usize {
        let mut units = 0;
        for (i, ch) in text.chars().enumerate() {
            if units >= pos {
                return i;
            }
            units += ch.len_utf16();
        }
        text.chars().count()
    }

    fn utf16_index_of_char(text: &str, char_index: usize) -> usize {
        text.chars().take(char_index).map(char::len_utf16).sum()
    }

    fn input_element(input: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::HtmlInputElement> {
        input()?
            .downcast::<web_sys::Element>()
            .cloned()?
            .dyn_into::<web_sys::HtmlInputElement>()
            .ok()
    }

    fn root_element(root: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        root()?.downcast::<web_sys::Element>().cloned()
    }
}
