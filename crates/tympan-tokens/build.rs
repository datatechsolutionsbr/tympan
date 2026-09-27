//! Generates the theme catalogue and the preset token values as Rust from
//! `generated/themes.json` and `generated/tokens.json` (copied from the
//! JavaScript build by `tools/rust/sync.mjs`; no Node at `cargo build`).

use std::fmt::Write as _;
use std::path::PathBuf;

fn pascal(name: &str) -> String {
    name.split('-')
        .map(|part| {
            let mut chars = part.chars();
            match chars.next() {
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                None => String::new(),
            }
        })
        .collect()
}

fn main() {
    let dir = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap()).join("generated");
    println!("cargo:rerun-if-changed=generated/themes.json");
    println!("cargo:rerun-if-changed=generated/tokens.json");
    let themes: serde_json::Value = serde_json::from_str(
        &std::fs::read_to_string(dir.join("themes.json")).expect("generated/themes.json"),
    )
    .expect("themes.json");
    let tokens: serde_json::Value = serde_json::from_str(
        &std::fs::read_to_string(dir.join("tokens.json")).expect("generated/tokens.json"),
    )
    .expect("tokens.json");
    let themes = themes.as_array().expect("themes.json is a list");

    let mut out = String::new();
    out.push_str(
        "/// Every Tympan theme: the built-in presets, then the print styles, in menu order.\n",
    );
    out.push_str(
        "#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]\npub enum Theme {\n",
    );
    for theme in themes {
        let name = theme["name"].as_str().unwrap();
        let label = theme["label"].as_str().unwrap();
        writeln!(out, "    /// {label} (`{name}`)\n    {},", pascal(name)).unwrap();
    }
    out.push_str("}\n\n");
    writeln!(
        out,
        "impl Theme {{\n    /// Every theme, in menu order.\n    pub const ALL: [Theme; {}] = [",
        themes.len()
    )
    .unwrap();
    for theme in themes {
        writeln!(
            out,
            "        Theme::{},",
            pascal(theme["name"].as_str().unwrap())
        )
        .unwrap();
    }
    out.push_str("    ];\n\n    /// The `data-ty-theme` value.\n    pub const fn name(self) -> &'static str {\n        match self {\n");
    for theme in themes {
        let name = theme["name"].as_str().unwrap();
        writeln!(out, "            Theme::{} => {name:?},", pascal(name)).unwrap();
    }
    out.push_str("        }\n    }\n\n    /// The theme's name in English, as Tympan labels it.\n    pub const fn label(self) -> &'static str {\n        match self {\n");
    for theme in themes {
        writeln!(
            out,
            "            Theme::{} => {:?},",
            pascal(theme["name"].as_str().unwrap()),
            theme["label"].as_str().unwrap()
        )
        .unwrap();
    }
    out.push_str("        }\n    }\n\n    /// Whether the theme needs `print-themes.css` (an opt-in print style).\n    pub const fn is_print(self) -> bool {\n        match self {\n");
    for theme in themes {
        writeln!(
            out,
            "            Theme::{} => {},",
            pascal(theme["name"].as_str().unwrap()),
            theme["kind"].as_str() == Some("print")
        )
        .unwrap();
    }
    out.push_str("        }\n    }\n\n    /// The font stylesheet the theme names (a third-party URL), if any.\n    pub const fn fonts_url(self) -> Option<&'static str> {\n        match self {\n");
    for theme in themes {
        let name = pascal(theme["name"].as_str().unwrap());
        match theme["fontsUrl"].as_str() {
            Some(url) => writeln!(out, "            Theme::{name} => Some({url:?}),").unwrap(),
            None => writeln!(out, "            Theme::{name} => None,").unwrap(),
        }
    }
    out.push_str("        }\n    }\n\n");
    out.push_str("    /// The preset's token values (`--ty-*` name, CSS value) for a mode and contrast; `None` for a print style (its values live only in `print-themes.css`) and for a high-contrast variant the preset does not have.\n");
    out.push_str("    pub fn variables(self, mode: Mode, high_contrast: bool) -> Option<&'static [(&'static str, &'static str)]> {\n        match (self, mode, high_contrast) {\n");
    let preset_tokens = tokens["themes"].as_object().expect("tokens.json themes");
    for (name, variants) in preset_tokens {
        for (key, (mode, high)) in [
            ("light", ("Mode::Light", false)),
            ("dark", ("Mode::Dark", false)),
            ("light-high", ("Mode::Light", true)),
            ("dark-high", ("Mode::Dark", true)),
        ] {
            let Some(vars) = variants[key].as_object() else {
                continue;
            };
            write!(
                out,
                "            (Theme::{}, {mode}, {high}) => Some(&[",
                pascal(name)
            )
            .unwrap();
            for (var, value) in vars {
                write!(out, "({var:?}, {:?}), ", value.as_str().unwrap_or_default()).unwrap();
            }
            out.push_str("]),\n");
        }
    }
    out.push_str("            _ => None,\n        }\n    }\n}\n\n");
    out.push_str("/// Theme-independent tokens (space, type, motion, layers, layout): `--ty-*` name, CSS value.\npub const BASE_VARIABLES: &[(&str, &str)] = &[\n");
    for (var, value) in tokens["base"].as_object().expect("tokens.json base") {
        writeln!(
            out,
            "    ({var:?}, {:?}),",
            value.as_str().unwrap_or_default()
        )
        .unwrap();
    }
    out.push_str("];\n");

    let dest = PathBuf::from(std::env::var("OUT_DIR").unwrap()).join("themes.rs");
    std::fs::write(dest, out).unwrap();
}
