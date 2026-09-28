//! Native port of `<ty-skeleton>`: a content-shaped placeholder, hidden
//! from assistive technology; with `label`, one polite status announces the
//! loading and the region is marked busy. Everything the custom element
//! composed on upgrade — the stacked lines beyond the first (widths cycled,
//! the last always short), a custom CSS `width` resolved to
//! `data-width="custom"` plus an inline size, and the presets (stats, cards,
//! section-heading, filters, analysis) repeated per `count`/`columns` — is
//! derived purely from the props, so the port renders it declaratively:
//! the same tree on the server and the client, no upgrade step, no script.

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Block form: a text line, a heading line, a circle (avatar) or a rectangle (media, a chart).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum SkeletonShape {
    #[default]
    Line,
    Heading,
    Circle,
    Rect,
}

impl SkeletonShape {
    pub const ALL: [SkeletonShape; 4] = [
        SkeletonShape::Line,
        SkeletonShape::Heading,
        SkeletonShape::Circle,
        SkeletonShape::Rect,
    ];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            SkeletonShape::Line => "line",
            SkeletonShape::Heading => "heading",
            SkeletonShape::Circle => "circle",
            SkeletonShape::Rect => "rect",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SkeletonShape> {
        SkeletonShape::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// A composed skeleton instead of blocks; the element composes it on upgrade.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum SkeletonPreset {
    Stats,
    Cards,
    SectionHeading,
    Filters,
    Analysis,
}

impl SkeletonPreset {
    pub const ALL: [SkeletonPreset; 5] = [
        SkeletonPreset::Stats,
        SkeletonPreset::Cards,
        SkeletonPreset::SectionHeading,
        SkeletonPreset::Filters,
        SkeletonPreset::Analysis,
    ];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            SkeletonPreset::Stats => "stats",
            SkeletonPreset::Cards => "cards",
            SkeletonPreset::SectionHeading => "section-heading",
            SkeletonPreset::Filters => "filters",
            SkeletonPreset::Analysis => "analysis",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<SkeletonPreset> {
        SkeletonPreset::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Widths the stylesheet knows; anything else resolves to
/// `data-width="custom"` plus an inline size.
const NAMED_WIDTHS: [&str; 4] = ["short", "medium", "long", "full"];

/// Widths of stacked lines; the last line is always short.
const LINE_CYCLE: [&str; 3] = ["long", "full", "medium"];

fn is_named_width(width: &str) -> bool {
    NAMED_WIDTHS.contains(&width)
}

/// `max(0, floor(value ?? fallback))`, as the element resolved repetitions.
fn repetitions(value: Option<f64>, fallback: usize) -> usize {
    value.map_or(fallback, |v| v.floor().max(0.0) as usize)
}

/// The width of the `i`-th of `count` stacked lines.
fn line_width(i: usize, count: usize) -> &'static str {
    if i + 1 == count {
        "short"
    } else {
        LINE_CYCLE[i % LINE_CYCLE.len()]
    }
}

/// A composed block: full width when unset, a custom length resolved to
/// `data-width="custom"` plus an inline size.
fn block(shape: &'static str, width: &'static str) -> Element {
    let named = is_named_width(width);
    rsx! {
        span {
            class: "ty-skeleton",
            "data-shape": Some(shape),
            "data-width": Some(if named { width } else { "custom" }),
            style: (!named).then(|| format!("inline-size: {width}")),
        }
    }
}

/// Stacked text lines, widths varied automatically (the last is short).
fn stacked_lines(count: usize) -> Element {
    rsx! {
        span {
            class: "ty-skeleton-lines",
            for i in 0..count {
                span {
                    class: "ty-skeleton",
                    "data-shape": Some("line"),
                    "data-width": Some(line_width(i, count)),
                }
            }
        }
    }
}

/// The preset's subtree.
fn preset_blocks(preset: SkeletonPreset, count: Option<f64>, columns: Option<f64>) -> Element {
    let columns = columns.map(|v| v.floor().max(0.0) as usize);
    match preset {
        SkeletonPreset::Stats => {
            let n = repetitions(count, 4);
            let columns = columns.unwrap_or(n);
            rsx! {
                span {
                    class: "ty-skeleton-grid",
                    "data-preset": Some("stats"),
                    style: format!("--ty-skeleton-columns: {columns}"),
                    for _ in 0..n {
                        span {
                            class: "ty-skeleton-tile",
                            "data-part": Some("stat"),
                            {block("circle", "full")}
                            {block("heading", "medium")}
                            {block("line", "short")}
                        }
                    }
                }
            }
        }
        SkeletonPreset::Cards => {
            let n = repetitions(count, 6);
            let columns = columns.unwrap_or(3);
            rsx! {
                span {
                    class: "ty-skeleton-grid",
                    "data-preset": Some("cards"),
                    style: format!("--ty-skeleton-columns: {columns}"),
                    for _ in 0..n {
                        span {
                            class: "ty-skeleton-tile",
                            "data-part": Some("card"),
                            {block("heading", "long")}
                            {stacked_lines(2)}
                            {block("line", "short")}
                        }
                    }
                }
            }
        }
        SkeletonPreset::SectionHeading => rsx! {
            span {
                class: "ty-skeleton-row",
                "data-preset": Some("section-heading"),
                {block("circle", "full")}
                span {
                    class: "ty-skeleton-lines",
                    {block("heading", "medium")}
                    {block("line", "long")}
                }
            }
        },
        SkeletonPreset::Filters => {
            let n = repetitions(count, 5);
            rsx! {
                span {
                    class: "ty-skeleton-row",
                    "data-preset": Some("filters"),
                    for _ in 0..n {
                        span {
                            class: "ty-skeleton ty-skeleton--pill",
                            "data-shape": Some("pill"),
                        }
                    }
                }
            }
        }
        SkeletonPreset::Analysis => {
            let n = repetitions(count, 3);
            rsx! {
                span {
                    class: "ty-skeleton-tile",
                    "data-preset": Some("analysis"),
                    {block("heading", "medium")}
                    for _ in 0..n {
                        span {
                            class: "ty-skeleton-row",
                            "data-part": Some("item"),
                            {block("circle", "full")}
                            {stacked_lines(2)}
                        }
                    }
                }
            }
        }
    }
}

/// Content-shaped placeholder, hidden from assistive technology; with `label`, one polite status announces the loading and the region is marked busy. Presets (stats, cards, section-heading, filters, analysis) are composed by the element on upgrade.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TySkeleton(
    /// Block form: a text line, a heading line, a circle (avatar) or a rectangle (media, a chart).
    #[props(default)]
    shape: SkeletonShape,
    /// Named width (`short`, `medium`, `long`, `full`) or any CSS length; full width when unset. A custom length resolves on upgrade (`data-width="custom"` and an inline size).
    #[props(into)]
    width: Option<String>,
    /// Stacked text lines for the `line` and `heading` shapes, widths varied automatically (the last is short).
    #[props(default = 1.0f64)]
    lines: f64,
    /// A composed skeleton instead of blocks; the element composes it on upgrade.
    #[props(default)]
    preset: Option<SkeletonPreset>,
    /// Repetitions of the preset (tiles, pills, items); the preset's default when unset.
    count: Option<f64>,
    /// Grid columns of a tiled preset (1 to 4); the preset's default when unset.
    columns: Option<f64>,
    /// Announced once in a visually-hidden status while loading, the region marked `aria-busy` (the PageLoadingState pattern); unset, the skeleton is purely decorative and the host announces.
    #[props(into)]
    label: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
) -> Element {
    let instance = use_instance_id(instance);
    let width = width.as_deref().filter(|v| !v.is_empty());
    let custom_width = width.filter(|v| !is_named_width(v));
    let label = label.as_deref().filter(|v| !v.is_empty());
    let announced = label.is_some();
    // One line keeps the prop's width; stacked lines cycle widths instead.
    let line_count = repetitions(Some(lines), 1).max(1);

    rsx! {
        ty-skeleton {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "shape": Some(shape.as_str()),
            "width": width,
            "lines": Some(lines.to_string()),
            "preset": preset.map(|v| v.as_str()),
            "count": count.map(|v| v.to_string()),
            "columns": columns.map(|v| v.to_string()),
            "label": label,
            span {
                class: "ty-skeleton-root",
                "aria-busy": announced.then_some("true"),
                span {
                    class: "ty-skeleton-content",
                    "aria-hidden": Some("true"),
                    if preset.is_none() && (shape == SkeletonShape::Line || shape == SkeletonShape::Heading) {
                        span {
                            class: "ty-skeleton-lines",
                            if line_count > 1 {
                                for i in 0..line_count {
                                    span {
                                        class: "ty-skeleton",
                                        "data-shape": Some("line"),
                                        "data-width": Some(line_width(i, line_count)),
                                    }
                                }
                            } else {
                                span {
                                    class: "ty-skeleton",
                                    "data-shape": Some(shape.as_str()),
                                    "data-width": custom_width.map(|_| "custom").or(width),
                                    style: custom_width.map(|v| format!("inline-size: {v}")),
                                }
                            }
                        }
                    }
                    if preset.is_none() && (shape == SkeletonShape::Circle || shape == SkeletonShape::Rect) {
                        span {
                            class: "ty-skeleton",
                            "data-shape": Some(shape.as_str()),
                            "data-width": custom_width.map(|_| "custom").or(width),
                            style: custom_width.map(|v| format!("inline-size: {v}")),
                        }
                    }
                    if let Some(preset) = preset {
                        span {
                            class: "ty-skeleton-preset",
                            "data-preset": Some(preset.as_str()),
                            {preset_blocks(preset, count, columns)}
                        }
                    }
                }
                if announced {
                    span {
                        class: "ty-visually-hidden",
                        "role": Some("status"),
                        {label.unwrap_or_default()}
                    }
                }
            }
        }
    }
}
