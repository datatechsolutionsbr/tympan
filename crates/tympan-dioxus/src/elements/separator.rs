//! Native port of `<ty-separator>`. A static element — all presentation: the
//! component renders the anatomy (the rule, or two decorative strokes around
//! a readable caption) and the stylesheet draws it, including the
//! forced-colours fallback. Not a widget — no state, no events, no DOM
//! effects, so nothing is mirrored and there is no `wasm` module.

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Direction of the rule; vertical takes the height of its row.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SeparatorOrientation {
    #[default]
    Horizontal,
    Vertical,
}

impl SeparatorOrientation {
    pub const ALL: [SeparatorOrientation; 2] = [SeparatorOrientation::Horizontal, SeparatorOrientation::Vertical];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            SeparatorOrientation::Horizontal => "horizontal",
            SeparatorOrientation::Vertical => "vertical",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SeparatorOrientation> {
        SeparatorOrientation::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Line strength: `--ty-line` or the fainter `--ty-line-soft`.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SeparatorEmphasis {
    #[default]
    Regular,
    Soft,
}

impl SeparatorEmphasis {
    pub const ALL: [SeparatorEmphasis; 2] = [SeparatorEmphasis::Regular, SeparatorEmphasis::Soft];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            SeparatorEmphasis::Regular => "regular",
            SeparatorEmphasis::Soft => "soft",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SeparatorEmphasis> {
        SeparatorEmphasis::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Margin step from the spacing scale.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SeparatorSpacing {
    None,
    #[default]
    Regular,
    Roomy,
}

impl SeparatorSpacing {
    pub const ALL: [SeparatorSpacing; 3] = [SeparatorSpacing::None, SeparatorSpacing::Regular, SeparatorSpacing::Roomy];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            SeparatorSpacing::None => "none",
            SeparatorSpacing::Regular => "regular",
            SeparatorSpacing::Roomy => "roomy",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SeparatorSpacing> {
        SeparatorSpacing::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Thin rule between groups of content, optionally with a short caption centred on it ("or"). Decorative by default (`aria-hidden`); `semantic` exposes the non-focusable separator role. A captioned rule keeps the caption readable as plain text and the strokes decorative, so it never carries the role.
#[component]
pub fn TySeparator(
    /// Direction of the rule; vertical takes the height of its row.
    #[props(default)] orientation: SeparatorOrientation,
    /// Line strength: `--ty-line` or the fainter `--ty-line-soft`.
    #[props(default)] emphasis: SeparatorEmphasis,
    /// Exposes the separator role (with `aria-orientation`); decorative otherwise.
    #[props(default)] semantic: bool,
    /// Margin step from the spacing scale.
    #[props(default)] spacing: SeparatorSpacing,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)] instance: Option<String>,
    #[props(into)] id: Option<String>,
    #[props(into, default)] class: String,
    /// Short text centred on the rule, such as "or"; readable plain text between the two decorative strokes.
    caption: Option<Element>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_caption = caption.is_some();
    rsx! {
        ty-separator {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "orientation": Some(orientation.as_str()),
            "emphasis": Some(emphasis.as_str()),
            "semantic": semantic.then_some(""),
            "spacing": Some(spacing.as_str()),
            div {
                class: "ty-separator",
                "role": if semantic && !slot_caption { Some("separator") } else { None },
                "aria-orientation": if semantic && !slot_caption { Some(orientation.as_str()) } else { None },
                "aria-hidden": if !semantic && !slot_caption { Some("true") } else { None },
                "data-orientation": Some(orientation.as_str()),
                "data-emphasis": Some(emphasis.as_str()),
                "data-spacing": Some(spacing.as_str()),
                "data-captioned": if slot_caption { Some("") } else { None },
                if slot_caption {
                    span {
                        class: "ty-separator__line",
                        "aria-hidden": Some("true"),
                    }
                }
                if slot_caption {
                    span {
                        class: "ty-separator__caption",
                        {caption.clone()}
                    }
                }
                if slot_caption {
                    span {
                        class: "ty-separator__line",
                        "aria-hidden": Some("true"),
                    }
                }
            }
        }
    }
}
