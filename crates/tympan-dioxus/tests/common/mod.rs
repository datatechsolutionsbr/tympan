//! Renders a component with dioxus-ssr and compares it with a fixture, both
//! reduced to a canonical tree: elements with their attributes sorted
//! (boolean attributes normalised to presence) and non-blank text.

use std::collections::BTreeMap;
use std::path::PathBuf;

use dioxus::prelude::*;
use scraper::{ElementRef, Html, Node};

const BOOLEAN: &[&str] = &[
    "disabled", "checked", "hidden", "open", "readonly", "required", "selected", "multiple",
];

#[derive(Debug, PartialEq)]
enum Canon {
    Element {
        tag: String,
        attrs: BTreeMap<String, String>,
        children: Vec<Canon>,
    },
    Text(String),
}

fn canon_children(element: ElementRef) -> Vec<Canon> {
    let mut out = Vec::new();
    for child in element.children() {
        match child.value() {
            Node::Element(_) => out.push(canon(ElementRef::wrap(child).unwrap())),
            Node::Text(text) => {
                let trimmed = text.trim();
                if !trimmed.is_empty() {
                    out.push(Canon::Text(trimmed.to_string()));
                }
            }
            _ => {}
        }
    }
    out
}

fn canon(element: ElementRef) -> Canon {
    let value = element.value();
    let mut attrs = BTreeMap::new();
    for (name, v) in value.attrs() {
        let normalised = if BOOLEAN.contains(&name) {
            String::new()
        } else {
            v.to_string()
        };
        // dioxus-ssr writes `false` boolean attributes as text; they mean absent.
        if BOOLEAN.contains(&name) && v == "false" {
            continue;
        }
        attrs.insert(name.to_string(), normalised);
    }
    Canon::Element {
        tag: value.name().to_string(),
        attrs,
        children: canon_children(element),
    }
}

fn parse(html: &str) -> Vec<Canon> {
    let fragment = Html::parse_fragment(html);
    canon_children(fragment.root_element())
}

pub fn render(app: fn() -> Element) -> String {
    let mut dom = VirtualDom::new(app);
    dom.rebuild_in_place();
    dioxus_ssr::render(&dom)
}

pub fn assert_matches_fixture(app: fn() -> Element, fixture: &str) {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures")
        .join(fixture);
    let expected =
        std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    let rendered = render(app);
    assert_eq!(
        parse(&rendered),
        parse(&expected),
        "\nrendered: {rendered}\nfixture:  {}",
        expected.trim()
    );
}
