//! Native port of `<ty-page-header>`: almost all presentation — the anatomy
//! (breadcrumbs, the row of icon, text and actions, the extra slot) is
//! rendered here and the stylesheet lays it out, including the below-640px
//! stacking of the actions. The one dynamic part the custom element added
//! is kept: with `editable`, the controlled `value` is mirrored into the
//! title input's value property — a no-op while the user types, so the
//! caret stays put (the live value is the input's own; typing is reported
//! as the native `input` event).

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::{has_content, use_instance_id};

/// Heading level of the title (1, 2 or 3, as its attribute spelling); exactly one level-1 heading per page, which the header provides by default.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum PageHeaderHeadingLevel {
    #[default]
    V1,
    V2,
    V3,
}

impl PageHeaderHeadingLevel {
    pub const ALL: [PageHeaderHeadingLevel; 3] = [PageHeaderHeadingLevel::V1, PageHeaderHeadingLevel::V2, PageHeaderHeadingLevel::V3];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            PageHeaderHeadingLevel::V1 => "1",
            PageHeaderHeadingLevel::V2 => "2",
            PageHeaderHeadingLevel::V3 => "3",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<PageHeaderHeadingLevel> {
        PageHeaderHeadingLevel::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// `page` uses the h1 step; `display` the display step (login, public page only); `section` the h3 step.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum PageHeaderScale {
    #[default]
    Page,
    Display,
    Section,
}

impl PageHeaderScale {
    pub const ALL: [PageHeaderScale; 3] = [PageHeaderScale::Page, PageHeaderScale::Display, PageHeaderScale::Section];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            PageHeaderScale::Page => "page",
            PageHeaderScale::Display => "display",
            PageHeaderScale::Section => "section",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<PageHeaderScale> {
        PageHeaderScale::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Typing in the editable title; `value` is the whole text.
#[derive(Clone, Debug, PartialEq)]
pub struct PageHeaderInput {
    pub value: String,
}

/// The single top-of-page block that names the page: optional breadcrumbs, eyebrow, leading icon, title, reading summary, metadata row and page actions, plus a free slot below for tags, tabs or filters. `scale` picks the type step (`page` the h1 step, `display` for login and public pages, `section` inside a section); `heading-level` the document level. With `editable` the title is an input named by `title-label` and a visually hidden heading keeps the outline. Below 640 px the actions move under the summary and span the width (stylesheet).
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyPageHeader(
    /// Page title; the heading text. Not needed with `editable` (`value` carries the text).
    #[props(into)] title: Option<String>,
    /// Heading level of the title (1, 2 or 3, as its attribute spelling); exactly one level-1 heading per page, which the header provides by default.
    #[props(default)] heading_level: PageHeaderHeadingLevel,
    /// `page` uses the h1 step; `display` the display step (login, public page only); `section` the h3 step.
    #[props(default)] scale: PageHeaderScale,
    /// Short uppercase context line above the title (the §2.2 eyebrow token).
    #[props(into)] eyebrow: Option<String>,
    /// One or two sentences (body-lg, max 60ch) saying what the screen shows.
    #[props(into)] summary: Option<String>,
    /// The title is an input that looks like the title (editorial screens); a visually hidden heading of the same level keeps the document outline.
    #[props(default)] editable: bool,
    /// The editable title's text (controlled); the element mirrors it into the input (while the user types, the live value is the input's own).
    #[props(into)] value: Option<String>,
    /// Placeholder of the editable title (the empty state); also the hidden heading's text while empty.
    #[props(into)] title_placeholder: Option<String>,
    /// Accessible name of the editable title input.
    #[props(into, default = String::from("Page title"))] title_label: String,
    /// Id of the title heading, for `aria-labelledby` of the page region; `<instance>-title` when unset.
    #[props(into)] heading_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)] instance: Option<String>,
    #[props(into)] id: Option<String>,
    #[props(into, default)] class: String,
    /// The breadcrumb navigation, rendered above the title.
    breadcrumbs: Option<Element>,
    /// A decorative leading icon, in an accent-soft container (`aria-hidden`).
    icon: Option<Element>,
    /// The metadata row: `li.ty-page-header__meta-item` items of icon plus short text (owner, date, count); icons decorative, text in reading order.
    meta: Option<Element>,
    /// Page actions, aligned to the end: at most one primary button plus secondary buttons (§2.10); below 640 px they move under the summary and span the width.
    actions: Option<Element>,
    /// Host-provided validation message under the editable title; marks it invalid and is announced.
    error: Option<Element>,
    /// Extra content below the header (tags, tabs, filters).
    children: Element,
    /// Typing in the editable title; `value` is the whole text.
    oninput: Option<EventHandler<PageHeaderInput>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_breadcrumbs = breadcrumbs.is_some();
    let slot_icon = icon.is_some();
    let slot_meta = meta.is_some();
    let slot_actions = actions.is_some();
    let slot_error = error.is_some();
    let slot_default = has_content(&children);

    // Uncontrolled with a mirrored prop: the parent may move `value`,
    // otherwise the input's own typing drives the state.
    let mut state = use_signal(|| value.clone().unwrap_or_default());
    let mut mirrored_value = use_signal(|| value.clone());
    if value != *mirrored_value.peek() {
        mirrored_value.set(value.clone());
        if let Some(text) = value.clone() {
            state.set(text);
        }
    }

    let mut input = use_signal(|| None::<Rc<MountedData>>);
    wasm::mirror_value(input, state);

    let heading_text = if value.as_deref().is_some_and(|v| !v.is_empty()) {
        value.clone().unwrap_or_default()
    } else {
        title_placeholder.clone().unwrap_or_default()
    };

    rsx! {
        ty-page-header {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "title": title.as_deref().filter(|v| !v.is_empty()),
            "heading-level": Some(heading_level.as_str()),
            "scale": Some(scale.as_str()),
            "eyebrow": eyebrow.as_deref().filter(|v| !v.is_empty()),
            "summary": summary.as_deref().filter(|v| !v.is_empty()),
            "editable": editable.then_some(""),
            "value": value.as_deref().filter(|v| !v.is_empty()),
            "title-placeholder": title_placeholder.as_deref().filter(|v| !v.is_empty()),
            "title-label": (!title_label.is_empty()).then_some(title_label.as_str()),
            "heading-id": heading_id.as_deref().filter(|v| !v.is_empty()),
            div {
                class: "ty-page-header",
                "data-scale": Some(scale.as_str()),
                if slot_breadcrumbs {
                    div {
                        class: "ty-page-header__breadcrumbs",
                        {breadcrumbs.clone()}
                    }
                }
                div {
                    class: "ty-page-header__row",
                    if slot_icon {
                        span {
                            class: "ty-page-header__icon",
                            "aria-hidden": Some("true"),
                            {icon.clone()}
                        }
                    }
                    div {
                        class: "ty-page-header__text",
                        if eyebrow.as_deref().is_some_and(|v| !v.is_empty()) {
                            p {
                                class: "ty-page-header__eyebrow",
                                {eyebrow.clone().unwrap_or_default()}
                            }
                        }
                        if !editable && heading_level == PageHeaderHeadingLevel::V1 {
                            h1 {
                                class: "ty-page-header__title",
                                "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-title"))),
                                {title.clone().unwrap_or_default()}
                            }
                        }
                        if !editable && heading_level == PageHeaderHeadingLevel::V2 {
                            h2 {
                                class: "ty-page-header__title",
                                "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-title"))),
                                {title.clone().unwrap_or_default()}
                            }
                        }
                        if !editable && heading_level == PageHeaderHeadingLevel::V3 {
                            h3 {
                                class: "ty-page-header__title",
                                "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-title"))),
                                {title.clone().unwrap_or_default()}
                            }
                        }
                        if editable && heading_level == PageHeaderHeadingLevel::V1 {
                            h1 {
                                class: "ty-heading ty-visually-hidden",
                                "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-title"))),
                                {heading_text.clone()}
                            }
                        }
                        if editable && heading_level == PageHeaderHeadingLevel::V2 {
                            h2 {
                                class: "ty-heading ty-visually-hidden",
                                "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-title"))),
                                {heading_text.clone()}
                            }
                        }
                        if editable && heading_level == PageHeaderHeadingLevel::V3 {
                            h3 {
                                class: "ty-heading ty-visually-hidden",
                                "id": heading_id.as_deref().filter(|v| !v.is_empty()).map(|v| v.to_string()).or_else(|| Some(format!("{instance}-title"))),
                                {heading_text.clone()}
                            }
                        }
                        if editable {
                            input {
                                class: "ty-page-header__title-input ty-page-header__title",
                                "aria-label": (!title_label.is_empty()).then_some(title_label.as_str()),
                                "placeholder": title_placeholder.as_deref().filter(|v| !v.is_empty()),
                                "aria-invalid": if slot_error { Some("true") } else { None },
                                "aria-describedby": { let ids: Vec<String> = [if slot_error { Some(format!("{instance}-error")) } else { None }].into_iter().flatten().collect(); (!ids.is_empty()).then_some(ids.join(" ")) },
                                "data-invalid": if slot_error { Some("") } else { None },
                                onmounted: move |event| input.set(Some(event.data())),
                                oninput: move |event: FormEvent| {
                                    let text = event.value();
                                    state.set(text.clone());
                                    if let Some(handler) = oninput {
                                        handler.call(PageHeaderInput { value: text });
                                    }
                                },
                            }
                        }
                        if editable && slot_error {
                            p {
                                class: "ty-page-header__error",
                                "id": Some(format!("{instance}-error")),
                                {error.clone()}
                            }
                        }
                        if summary.as_deref().is_some_and(|v| !v.is_empty()) {
                            p {
                                class: "ty-page-header__summary",
                                {summary.clone().unwrap_or_default()}
                            }
                        }
                        if slot_meta {
                            ul {
                                class: "ty-page-header__meta",
                                {meta.clone()}
                            }
                        }
                    }
                    if slot_actions {
                        div {
                            class: "ty-page-header__actions",
                            {actions.clone()}
                        }
                    }
                }
                if slot_default {
                    div {
                        class: "ty-page-header__extra",
                        {children.clone()}
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

    pub fn mirror_value(_input: Signal<Option<Rc<MountedData>>>, _state: Signal<String>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::JsCast;

    /// The input's text is a property, not an attribute: mirror the state
    /// in without disturbing the caret (a no-op while the user types).
    pub fn mirror_value(input: Signal<Option<Rc<MountedData>>>, state: Signal<String>) {
        use_effect(move || {
            let Some(field) = input_element(input) else { return };
            let text = state();
            if field.value() != text {
                field.set_value(&text);
            }
        });
    }

    fn input_element(input: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::HtmlInputElement> {
        input()?
            .downcast::<web_sys::Element>()
            .cloned()?
            .dyn_into::<web_sys::HtmlInputElement>()
            .ok()
    }
}
