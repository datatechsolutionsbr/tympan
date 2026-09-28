//! Native port of `<ty-heading>`. A static element — all presentation: the
//! component renders the anatomy (the optional eyebrow, then the heading of
//! the chosen `level` with the resolved `data-appearance` step) and the
//! stylesheet draws the type steps. Not a widget — no state, no events, no
//! DOM effects, so nothing is mirrored and there is no `wasm` module.

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Document outline level (1 to 6, as its attribute spelling); one h1 per page, no skipped levels.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum HeadingLevel {
    #[default]
    V1,
    V2,
    V3,
    V4,
    V5,
    V6,
}

impl HeadingLevel {
    pub const ALL: [HeadingLevel; 6] = [HeadingLevel::V1, HeadingLevel::V2, HeadingLevel::V3, HeadingLevel::V4, HeadingLevel::V5, HeadingLevel::V6];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            HeadingLevel::V1 => "1",
            HeadingLevel::V2 => "2",
            HeadingLevel::V3 => "3",
            HeadingLevel::V4 => "4",
            HeadingLevel::V5 => "5",
            HeadingLevel::V6 => "6",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<HeadingLevel> {
        HeadingLevel::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Visual step from the type scale of §2.2, decoupled from `level`; derived from the level when unset (1 → h1, 2 → h2, 3+ → h3).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum HeadingAppearance {
    Display,
    H1,
    H2,
    H3,
    Label,
}

impl HeadingAppearance {
    pub const ALL: [HeadingAppearance; 5] = [HeadingAppearance::Display, HeadingAppearance::H1, HeadingAppearance::H2, HeadingAppearance::H3, HeadingAppearance::Label];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            HeadingAppearance::Display => "display",
            HeadingAppearance::H1 => "h1",
            HeadingAppearance::H2 => "h2",
            HeadingAppearance::H3 => "h3",
            HeadingAppearance::Label => "label",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<HeadingAppearance> {
        HeadingAppearance::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Section title whose document level (`level`, h1 to h6) and visual step (`appearance`: display, h1, h2, h3 or label) are set independently; unset, the step derives from the level. An optional `eyebrow` labels the section above the heading, outside the heading element. The heading id (`heading-id`, generated otherwise) lets a section or dialog reference it with `aria-labelledby`. `level="2" appearance="h3"` is the Subheading.
#[component]
pub fn TyHeading(
    /// Document outline level (1 to 6, as its attribute spelling); one h1 per page, no skipped levels.
    #[props(default)] level: HeadingLevel,
    /// Visual step from the type scale of §2.2, decoupled from `level`; derived from the level when unset (1 → h1, 2 → h2, 3+ → h3).
    #[props(default)] appearance: Option<HeadingAppearance>,
    /// Small uppercase label rendered before, and outside, the heading element (the §2.2 eyebrow token); the heading text alone stays the accessible name.
    #[props(into)] eyebrow: Option<String>,
    /// Stable id of the heading element, for `aria-labelledby` of the enclosing section or dialog; `<instance>-heading` when unset.
    #[props(into)] heading_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)] instance: Option<String>,
    #[props(into)] id: Option<String>,
    #[props(into, default)] class: String,
    /// The heading text.
    children: Element,
) -> Element {
    let instance = use_instance_id(instance);
    rsx! {
        ty-heading {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "level": Some(level.as_str()),
            "appearance": appearance.map(|v| v.as_str()),
            "eyebrow": eyebrow.as_deref().filter(|v| !v.is_empty()),
            "heading-id": heading_id.as_deref().filter(|v| !v.is_empty()),
            div {
                class: "ty-heading-group",
                if eyebrow.as_deref().is_some_and(|v| !v.is_empty()) {
                    p {
                        class: "ty-heading__eyebrow",
                        {eyebrow.clone().unwrap_or_default()}
                    }
                }
                if level == HeadingLevel::V1 {
                    h1 {
                        class: "ty-heading",
                        "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-heading"))),
                        "data-appearance": match appearance { Some(HeadingAppearance::Display) => Some("display"), Some(HeadingAppearance::H1) => Some("h1"), Some(HeadingAppearance::H2) => Some("h2"), Some(HeadingAppearance::H3) => Some("h3"), Some(HeadingAppearance::Label) => Some("label"), None => match level { HeadingLevel::V1 => Some("h1"), HeadingLevel::V2 => Some("h2"), HeadingLevel::V3 => Some("h3"), HeadingLevel::V4 => Some("h3"), HeadingLevel::V5 => Some("h3"), HeadingLevel::V6 => Some("h3") } },
                        {children.clone()}
                    }
                }
                if level == HeadingLevel::V2 {
                    h2 {
                        class: "ty-heading",
                        "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-heading"))),
                        "data-appearance": match appearance { Some(HeadingAppearance::Display) => Some("display"), Some(HeadingAppearance::H1) => Some("h1"), Some(HeadingAppearance::H2) => Some("h2"), Some(HeadingAppearance::H3) => Some("h3"), Some(HeadingAppearance::Label) => Some("label"), None => match level { HeadingLevel::V1 => Some("h1"), HeadingLevel::V2 => Some("h2"), HeadingLevel::V3 => Some("h3"), HeadingLevel::V4 => Some("h3"), HeadingLevel::V5 => Some("h3"), HeadingLevel::V6 => Some("h3") } },
                        {children.clone()}
                    }
                }
                if level == HeadingLevel::V3 {
                    h3 {
                        class: "ty-heading",
                        "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-heading"))),
                        "data-appearance": match appearance { Some(HeadingAppearance::Display) => Some("display"), Some(HeadingAppearance::H1) => Some("h1"), Some(HeadingAppearance::H2) => Some("h2"), Some(HeadingAppearance::H3) => Some("h3"), Some(HeadingAppearance::Label) => Some("label"), None => match level { HeadingLevel::V1 => Some("h1"), HeadingLevel::V2 => Some("h2"), HeadingLevel::V3 => Some("h3"), HeadingLevel::V4 => Some("h3"), HeadingLevel::V5 => Some("h3"), HeadingLevel::V6 => Some("h3") } },
                        {children.clone()}
                    }
                }
                if level == HeadingLevel::V4 {
                    h4 {
                        class: "ty-heading",
                        "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-heading"))),
                        "data-appearance": match appearance { Some(HeadingAppearance::Display) => Some("display"), Some(HeadingAppearance::H1) => Some("h1"), Some(HeadingAppearance::H2) => Some("h2"), Some(HeadingAppearance::H3) => Some("h3"), Some(HeadingAppearance::Label) => Some("label"), None => match level { HeadingLevel::V1 => Some("h1"), HeadingLevel::V2 => Some("h2"), HeadingLevel::V3 => Some("h3"), HeadingLevel::V4 => Some("h3"), HeadingLevel::V5 => Some("h3"), HeadingLevel::V6 => Some("h3") } },
                        {children.clone()}
                    }
                }
                if level == HeadingLevel::V5 {
                    h5 {
                        class: "ty-heading",
                        "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-heading"))),
                        "data-appearance": match appearance { Some(HeadingAppearance::Display) => Some("display"), Some(HeadingAppearance::H1) => Some("h1"), Some(HeadingAppearance::H2) => Some("h2"), Some(HeadingAppearance::H3) => Some("h3"), Some(HeadingAppearance::Label) => Some("label"), None => match level { HeadingLevel::V1 => Some("h1"), HeadingLevel::V2 => Some("h2"), HeadingLevel::V3 => Some("h3"), HeadingLevel::V4 => Some("h3"), HeadingLevel::V5 => Some("h3"), HeadingLevel::V6 => Some("h3") } },
                        {children.clone()}
                    }
                }
                if level == HeadingLevel::V6 {
                    h6 {
                        class: "ty-heading",
                        "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-heading"))),
                        "data-appearance": match appearance { Some(HeadingAppearance::Display) => Some("display"), Some(HeadingAppearance::H1) => Some("h1"), Some(HeadingAppearance::H2) => Some("h2"), Some(HeadingAppearance::H3) => Some("h3"), Some(HeadingAppearance::Label) => Some("label"), None => match level { HeadingLevel::V1 => Some("h1"), HeadingLevel::V2 => Some("h2"), HeadingLevel::V3 => Some("h3"), HeadingLevel::V4 => Some("h3"), HeadingLevel::V5 => Some("h3"), HeadingLevel::V6 => Some("h3") } },
                        {children.clone()}
                    }
                }
            }
        }
    }
}
