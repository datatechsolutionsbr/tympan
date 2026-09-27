//! Tympan design tokens for Rust.
//!
//! - [`Theme`]: every theme a host can select (`data-ty-theme`), the
//!   built-in presets then the print styles, with its label, whether it
//!   needs `print-themes.css`, and the font stylesheet it names.
//! - [`Mode`] and [`Density`]: `data-ty-mode` and `data-ty-density`.
//! - [`Theme::variables`] and [`BASE_VARIABLES`]: the token values.
//! - [`assets`]: the built stylesheets and the custom-element bundle,
//!   embedded, so a server serves them without copying files.
//!
//! Everything is generated from the JavaScript build's outputs
//! (`generated/`, refreshed by `tools/rust/sync.mjs`); no Node is needed to
//! build this crate. FSL-1.1-ALv2.

include!(concat!(env!("OUT_DIR"), "/themes.rs"));

/// The theme a page wears when nothing chose another (Tympan's default).
pub const DEFAULT_THEME: Theme = Theme::Tympan;

impl Theme {
    /// The theme called `name` (a `data-ty-theme` value).
    pub fn from_name(name: &str) -> Option<Theme> {
        Theme::ALL.into_iter().find(|theme| theme.name() == name)
    }

    /// The built-in presets (not the print styles).
    pub fn presets() -> impl Iterator<Item = Theme> {
        Theme::ALL.into_iter().filter(|theme| !theme.is_print())
    }

    /// The print styles.
    pub fn print_styles() -> impl Iterator<Item = Theme> {
        Theme::ALL.into_iter().filter(|theme| theme.is_print())
    }
}

impl std::fmt::Display for Theme {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.name())
    }
}

/// Light, dark, or whatever the operating system prefers (`data-ty-mode`).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Mode {
    #[default]
    System,
    Light,
    Dark,
}

impl Mode {
    pub const ALL: [Mode; 3] = [Mode::System, Mode::Light, Mode::Dark];

    pub const fn name(self) -> &'static str {
        match self {
            Mode::System => "system",
            Mode::Light => "light",
            Mode::Dark => "dark",
        }
    }

    pub fn from_name(name: &str) -> Option<Mode> {
        Mode::ALL.into_iter().find(|mode| mode.name() == name)
    }
}

/// Control heights (`data-ty-density`).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Density {
    Compact,
    #[default]
    Default,
    Comfortable,
}

impl Density {
    pub const ALL: [Density; 3] = [Density::Compact, Density::Default, Density::Comfortable];

    pub const fn name(self) -> &'static str {
        match self {
            Density::Compact => "compact",
            Density::Default => "default",
            Density::Comfortable => "comfortable",
        }
    }

    pub fn from_name(name: &str) -> Option<Density> {
        Density::ALL
            .into_iter()
            .find(|density| density.name() == name)
    }
}

/// The built stylesheets and the custom-element bundle, embedded.
pub mod assets {
    /// Components and tokens (`@datatechsolutions/tympan/styles.css`): link on every page.
    pub const STYLES_CSS: &str = include_str!("../generated/styles.css");
    /// The tokens alone (`tokens.css`), contained in [`STYLES_CSS`].
    pub const TOKENS_CSS: &str = include_str!("../generated/tokens.css");
    /// The print styles as UI themes (`print-themes.css`, about 2 MB): link while one is applied.
    pub const PRINT_THEMES_CSS: &str = include_str!("../generated/print-themes.css");
    /// Every Tympan custom element, registered on load (an ES module).
    pub const ELEMENTS_JS: &str = include_str!("../generated/elements.js");

    /// One servable file.
    #[derive(Clone, Copy, Debug, PartialEq, Eq)]
    pub struct Asset {
        /// File name under the host's mount point (`styles.css`).
        pub path: &'static str,
        pub content_type: &'static str,
        pub body: &'static str,
    }

    /// Every file, for a server to mount (e.g. under `/tympan/`).
    pub const ALL: [Asset; 4] = [
        Asset {
            path: "styles.css",
            content_type: "text/css; charset=utf-8",
            body: STYLES_CSS,
        },
        Asset {
            path: "tokens.css",
            content_type: "text/css; charset=utf-8",
            body: TOKENS_CSS,
        },
        Asset {
            path: "print-themes.css",
            content_type: "text/css; charset=utf-8",
            body: PRINT_THEMES_CSS,
        },
        Asset {
            path: "elements.js",
            content_type: "text/javascript; charset=utf-8",
            body: ELEMENTS_JS,
        },
    ];

    /// The file at `path` (a name from [`ALL`]).
    pub fn get(path: &str) -> Option<Asset> {
        ALL.into_iter().find(|asset| asset.path == path)
    }

    /// A short content hash of every file together, for cache-busting URLs.
    pub fn version() -> String {
        // FNV-1a over the embedded bytes: stable across builds of the same inputs.
        let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
        for asset in ALL {
            for byte in asset.body.bytes() {
                hash ^= u64::from(byte);
                hash = hash.wrapping_mul(0x0100_0000_01b3);
            }
        }
        format!("{hash:016x}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_theme_round_trips_and_the_catalogue_is_complete() {
        for theme in Theme::ALL {
            assert_eq!(Theme::from_name(theme.name()), Some(theme));
            assert!(!theme.label().is_empty());
        }
        assert_eq!(Theme::presets().count(), 5);
        assert_eq!(Theme::print_styles().count(), 39);
        assert_eq!(Theme::from_name("astrlabe"), Some(Theme::Astrlabe));
        assert!(Theme::PrintBauhaus.is_print());
        assert!(Theme::PrintBauhaus.fonts_url().is_some());
        assert_eq!(Theme::Astrlabe.fonts_url(), None);
    }

    #[test]
    fn presets_have_values_in_every_mode_and_print_styles_do_not() {
        for theme in Theme::presets() {
            for mode in [Mode::Light, Mode::Dark] {
                // The high-contrast preset has no separate high-contrast variant.
                let highs: &[bool] = if theme == Theme::HighContrast {
                    &[false]
                } else {
                    &[false, true]
                };
                for &high in highs {
                    let vars = theme.variables(mode, high).expect("preset values");
                    assert!(
                        vars.iter().any(|(name, _)| *name == "--ty-brand"),
                        "{theme} {mode:?} {high}"
                    );
                }
            }
        }
        let light = Theme::Astrlabe.variables(Mode::Light, false).unwrap();
        assert!(light.contains(&("--ty-brand", "#4f46e5")));
        assert_eq!(Theme::PrintSuico.variables(Mode::Light, false), None);
        assert!(BASE_VARIABLES
            .iter()
            .any(|(name, _)| *name == "--ty-space-4"));
    }

    #[test]
    fn the_embedded_files_are_the_built_ones() {
        assert!(assets::STYLES_CSS.contains(".ty-button"));
        assert!(assets::STYLES_CSS.contains("[data-ty-theme=\"astrlabe\"]"));
        assert!(assets::PRINT_THEMES_CSS.contains("[data-ty-theme=\"print-bauhaus\"]"));
        assert!(assets::ELEMENTS_JS.contains("ty-theme-palette"));
        assert_eq!(
            assets::get("elements.js").unwrap().content_type,
            "text/javascript; charset=utf-8"
        );
        assert_eq!(assets::get("nope.css"), None);
        assert_eq!(assets::version().len(), 16);
    }

    #[test]
    fn modes_and_densities_round_trip() {
        for mode in Mode::ALL {
            assert_eq!(Mode::from_name(mode.name()), Some(mode));
        }
        for density in Density::ALL {
            assert_eq!(Density::from_name(density.name()), Some(density));
        }
    }
}
