//! Native port of `<ty-section-heading>`: a heading row (decorative leading
//! icon, title at the section level — h2 by default, h3 or h4 inside a
//! sheet — and an optional subtitle line, with a `trailing` slot for the
//! section's own actions) plus an extra slot under the row. The element is
//! all presentation: not a widget, no keyboard or events — the custom
//! element only built and patched this anatomy, which Dioxus now renders
//! directly, so there is no behaviour to port (no signals, no DOM effects).

use dioxus::prelude::*;

use crate::runtime::{has_content, use_instance_id};

/// Heading level (2, 3 or 4, as its attribute spelling); level 2 uses the h2 step, 3 and 4 the h3 step (§2.2).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SectionHeadingLevel {
    #[default]
    V2,
    V3,
    V4,
}

impl SectionHeadingLevel {
    pub const ALL: [SectionHeadingLevel; 3] = [SectionHeadingLevel::V2, SectionHeadingLevel::V3, SectionHeadingLevel::V4];

    pub const fn as_str(self) -> &'static str {
        match self {
            SectionHeadingLevel::V2 => "2",
            SectionHeadingLevel::V3 => "3",
            SectionHeadingLevel::V4 => "4",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SectionHeadingLevel> {
        SectionHeadingLevel::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Heads a section inside a page or a sheet: the title at the section level (h2 by default, h3 or h4 inside a sheet), an optional subtitle line (plain meta text, not a heading), an optional decorative leading icon, and a `trailing` slot for the section's own actions, a count, a toggle or a link. The title wraps by default; `truncate` clips it to one line with the full text as a tooltip. The heading id (`heading-id`, generated otherwise) lets the enclosing section name itself with `aria-labelledby`.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TySectionHeading(
    /// Section name; the heading text, and the tooltip when `truncate` clips it.
    #[props(into)]
    title: Option<String>,
    /// Heading level (2, 3 or 4, as its attribute spelling); level 2 uses the h2 step, 3 and 4 the h3 step (§2.2).
    #[props(default)]
    level: SectionHeadingLevel,
    /// Supporting line under the title; plain meta text in reading order, not a heading.
    #[props(into)]
    subtitle: Option<String>,
    /// Clip the title to one line with an ellipsis; the full text stays accessible and becomes the tooltip. Wraps by default.
    #[props(default)]
    truncate: bool,
    /// Id of the heading element, so the enclosing section can be a region labelled by it; `<instance>-heading` when unset.
    #[props(into)]
    heading_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// A decorative leading icon (`aria-hidden`).
    icon: Option<Element>,
    /// Section actions, a count, a toggle or a link; follows the title in DOM order and wraps under it when it does not fit.
    trailing: Option<Element>,
    /// Extra content under the heading row.
    children: Element,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_icon = icon.is_some();
    let slot_trailing = trailing.is_some();
    let slot_default = has_content(&children);
    let heading_element_id = heading_id
        .as_deref()
        .filter(|v| !v.is_empty())
        .map(|v| v.to_string())
        .unwrap_or_else(|| format!("{instance}-heading"));
    rsx! {
        ty-section-heading {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "title": title.as_deref().filter(|v| !v.is_empty()),
            "level": Some(level.as_str()),
            "subtitle": subtitle.as_deref().filter(|v| !v.is_empty()),
            "truncate": truncate.then_some(""),
            "heading-id": heading_id.as_deref().filter(|v| !v.is_empty()),
            div {
                class: "ty-section-heading",
                "data-level": Some(level.as_str()),
                div {
                    class: "ty-section-heading__row",
                    if slot_icon {
                        span {
                            class: "ty-section-heading__icon",
                            "aria-hidden": Some("true"),
                            {icon.clone()}
                        }
                    }
                    div {
                        class: "ty-section-heading__text",
                        if level == SectionHeadingLevel::V2 {
                            h2 {
                                class: "ty-section-heading__title",
                                "id": Some(heading_element_id.clone()),
                                "data-truncate": (truncate).then_some(""),
                                "title": if truncate { title.as_deref().filter(|v| !v.is_empty()) } else { None },
                                {title.clone().unwrap_or_default()}
                            }
                        }
                        if level == SectionHeadingLevel::V3 {
                            h3 {
                                class: "ty-section-heading__title",
                                "id": Some(heading_element_id.clone()),
                                "data-truncate": (truncate).then_some(""),
                                "title": if truncate { title.as_deref().filter(|v| !v.is_empty()) } else { None },
                                {title.clone().unwrap_or_default()}
                            }
                        }
                        if level == SectionHeadingLevel::V4 {
                            h4 {
                                class: "ty-section-heading__title",
                                "id": Some(heading_element_id.clone()),
                                "data-truncate": (truncate).then_some(""),
                                "title": if truncate { title.as_deref().filter(|v| !v.is_empty()) } else { None },
                                {title.clone().unwrap_or_default()}
                            }
                        }
                        if subtitle.as_deref().is_some_and(|v| !v.is_empty()) {
                            p {
                                class: "ty-section-heading__subtitle",
                                {subtitle.clone().unwrap_or_default()}
                            }
                        }
                    }
                    if slot_trailing {
                        div {
                            class: "ty-section-heading__trailing",
                            {trailing.clone()}
                        }
                    }
                }
                if slot_default {
                    div {
                        class: "ty-section-heading__extra",
                        {children.clone()}
                    }
                }
            }
        }
    }
}
