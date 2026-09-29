//! SSR parity of the native port (`elements::TyCurrencyField`): every
//! example of the element, rendered by the native component, must match
//! the same reference HTML (tests/fixtures) the generated binding and the
//! TypeScript element are tested against — one anatomy, three renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn count() {
    fn app() -> Element {
        rsx! { elements::TyCurrencyField { decimals: 0.0f64, locale: "pt-BR", value: "3000", name: "seats", instance: "i", label: rsx! { "Vagas" }, } }
    }
    common::assert_matches_fixture(app, "ty-currency-field/count.html");
}

#[test]
fn brl() {
    fn app() -> Element {
        rsx! { elements::TyCurrencyField { currency: "BRL", locale: "pt-BR", value: "1500000.5", name: "price", placeholder: "0,00", instance: "i", label: rsx! { "Preço" }, hint: rsx! { "Em reais" }, } }
    }
    common::assert_matches_fixture(app, "ty-currency-field/brl.html");
}

#[test]
fn usd() {
    fn app() -> Element {
        rsx! { elements::TyCurrencyField { currency: "USD", locale: "en-US", value: "1500000.5", name: "amount", instance: "i", label: rsx! { "Amount" }, } }
    }
    common::assert_matches_fixture(app, "ty-currency-field/usd.html");
}

#[test]
fn display() {
    fn app() -> Element {
        rsx! { elements::TyCurrencyField { size: elements::CurrencyFieldSize::Display, currency: "BRL", locale: "pt-BR", value: "99.9", instance: "i", label: rsx! { "Total" }, } }
    }
    common::assert_matches_fixture(app, "ty-currency-field/display.html");
}

#[test]
fn error() {
    fn app() -> Element {
        rsx! { elements::TyCurrencyField { value: "12", required: true, instance: "i", label: rsx! { "Amount" }, error: rsx! { "Required" }, } }
    }
    common::assert_matches_fixture(app, "ty-currency-field/error.html");
}

#[test]
fn disabled_unlabelled() {
    fn app() -> Element {
        rsx! { elements::TyCurrencyField { disabled: true, accessible_label: "Amount", test_id: "amount", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-currency-field/disabled-unlabelled.html");
}
