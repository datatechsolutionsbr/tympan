//! Native port of `<ty-inline-notice>`. The notice is painted by the
//! stylesheet from `tone`; what the custom element added on top was
//! dismissal, and the port keeps it: a press of the dismiss button reports
//! `on_dismiss` (the element's `ty-dismiss`; removing the notice stays the
//! host's) and moves focus to the next logical element, not the document
//! body — the DOM walk lives in the `wasm` module. The element has no
//! state of its own (no prop changes after render), so there are no
//! signals to mirror.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Semantic tone; colours the surface and picks the default icon and tone word.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum InlineNoticeTone {
    Danger,
    Warning,
    #[default]
    Info,
    Success,
}

impl InlineNoticeTone {
    pub const ALL: [InlineNoticeTone; 4] = [InlineNoticeTone::Danger, InlineNoticeTone::Warning, InlineNoticeTone::Info, InlineNoticeTone::Success];

    pub const fn as_str(self) -> &'static str {
        match self {
            InlineNoticeTone::Danger => "danger",
            InlineNoticeTone::Warning => "warning",
            InlineNoticeTone::Info => "info",
            InlineNoticeTone::Success => "success",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<InlineNoticeTone> {
        InlineNoticeTone::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// `centre` only for short single-message confirmations.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum InlineNoticeAlign {
    #[default]
    Start,
    Centre,
}

impl InlineNoticeAlign {
    pub const ALL: [InlineNoticeAlign; 2] = [InlineNoticeAlign::Start, InlineNoticeAlign::Centre];

    pub const fn as_str(self) -> &'static str {
        match self {
            InlineNoticeAlign::Start => "start",
            InlineNoticeAlign::Centre => "centre",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<InlineNoticeAlign> {
        InlineNoticeAlign::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// How the notice is announced when it appears; unset: assertive for danger and warning, polite otherwise. `none` (no live role) for notices present on page load.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum InlineNoticeUrgency {
    Polite,
    Assertive,
    None,
}

impl InlineNoticeUrgency {
    pub const ALL: [InlineNoticeUrgency; 3] = [InlineNoticeUrgency::Polite, InlineNoticeUrgency::Assertive, InlineNoticeUrgency::None];

    pub const fn as_str(self) -> &'static str {
        match self {
            InlineNoticeUrgency::Polite => "polite",
            InlineNoticeUrgency::Assertive => "assertive",
            InlineNoticeUrgency::None => "none",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<InlineNoticeUrgency> {
        InlineNoticeUrgency::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Element for the title; a plain strong paragraph unless configured.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum InlineNoticeTitleAs {
    #[default]
    P,
    H2,
    H3,
    H4,
}

impl InlineNoticeTitleAs {
    pub const ALL: [InlineNoticeTitleAs; 4] = [InlineNoticeTitleAs::P, InlineNoticeTitleAs::H2, InlineNoticeTitleAs::H3, InlineNoticeTitleAs::H4];

    pub const fn as_str(self) -> &'static str {
        match self {
            InlineNoticeTitleAs::P => "p",
            InlineNoticeTitleAs::H2 => "h2",
            InlineNoticeTitleAs::H3 => "h3",
            InlineNoticeTitleAs::H4 => "h4",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<InlineNoticeTitleAs> {
        InlineNoticeTitleAs::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Short message about the state of a form, section or page. Assertive tones (danger and warning unless `urgency` says otherwise) are `role="alert"`, polite ones `role="status"`; a visually hidden tone word precedes the message. Dismissal is the host's: the element emits `ty-dismiss` and moves focus to the next logical element.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyInlineNotice(
    /// Semantic tone; colours the surface and picks the default icon and tone word.
    #[props(default)]
    tone: InlineNoticeTone,
    /// `centre` only for short single-message confirmations.
    #[props(default)]
    align: InlineNoticeAlign,
    /// How the notice is announced when it appears; unset: assertive for danger and warning, polite otherwise. `none` (no live role) for notices present on page load.
    #[props(default)]
    urgency: Option<InlineNoticeUrgency>,
    /// Element for the title; a plain strong paragraph unless configured.
    #[props(default)]
    title_as: InlineNoticeTitleAs,
    /// Shows the dismiss button; the host removes the notice on `ty-dismiss`.
    #[props(default)]
    dismissible: bool,
    /// Accessible name of the dismiss button.
    #[props(into, default = String::from("Dismiss"))]
    dismiss_label: String,
    /// Visually hidden word announced before a danger notice.
    #[props(into, default = String::from("Error: "))]
    tone_word_danger: String,
    /// Visually hidden word announced before a warning notice.
    #[props(into, default = String::from("Warning: "))]
    tone_word_warning: String,
    /// Visually hidden word announced before an info notice.
    #[props(into, default = String::from("Information: "))]
    tone_word_info: String,
    /// Visually hidden word announced before a success notice.
    #[props(into, default = String::from("Success: "))]
    tone_word_success: String,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The message body.
    children: Element,
    /// Short heading above the message.
    title: Option<Element>,
    /// Overrides the tone's icon (decorative).
    icon: Option<Element>,
    /// Buttons or links below the message (up to two).
    actions: Option<Element>,
    /// The dismiss button was pressed; the host removes the notice. Focus has moved to the next logical element.
    on_dismiss: Option<EventHandler<()>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_title = title.is_some();
    let slot_icon = icon.is_some();
    let slot_actions = actions.is_some();

    let mut host = use_signal(|| None::<Rc<MountedData>>);

    rsx! {
        ty-inline-notice {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "tone": Some(tone.as_str()),
            "align": Some(align.as_str()),
            "urgency": urgency.map(|v| v.as_str()),
            "title-as": Some(title_as.as_str()),
            "dismissible": dismissible.then_some(""),
            "dismiss-label": (!dismiss_label.is_empty()).then_some(dismiss_label.as_str()),
            "tone-word-danger": (!tone_word_danger.is_empty()).then_some(tone_word_danger.as_str()),
            "tone-word-warning": (!tone_word_warning.is_empty()).then_some(tone_word_warning.as_str()),
            "tone-word-info": (!tone_word_info.is_empty()).then_some(tone_word_info.as_str()),
            "tone-word-success": (!tone_word_success.is_empty()).then_some(tone_word_success.as_str()),
            onmounted: move |event: MountedEvent| host.set(Some(event.data())),
            div {
                class: "ty-notice",
                "role": match urgency { Some(InlineNoticeUrgency::Assertive) => Some("alert"), Some(InlineNoticeUrgency::Polite) => Some("status"), Some(_) => None, None => match tone { InlineNoticeTone::Danger => Some("alert"), InlineNoticeTone::Warning => Some("alert"), InlineNoticeTone::Info => Some("status"), InlineNoticeTone::Success => Some("status") } },
                "data-tone": Some(tone.as_str()),
                "data-align": Some(align.as_str()),
                span {
                    class: "ty-notice__icon",
                    "aria-hidden": Some("true"),
                    if !(slot_icon) && tone == InlineNoticeTone::Danger {
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
                                class: "ty-notice__glyph",
                                "cx": Some("12"),
                                "cy": Some("12"),
                                "r": Some("10"),
                            }
                            line {
                                class: "ty-notice__glyph",
                                "x1": Some("12"),
                                "x2": Some("12"),
                                "y1": Some("8"),
                                "y2": Some("12"),
                            }
                            line {
                                class: "ty-notice__glyph",
                                "x1": Some("12"),
                                "x2": Some("12.01"),
                                "y1": Some("16"),
                                "y2": Some("16"),
                            }
                        }
                    }
                    if !(slot_icon) && tone == InlineNoticeTone::Warning {
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
                            path {
                                class: "ty-notice__glyph",
                                "d": Some("m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"),
                            }
                            path {
                                class: "ty-notice__glyph",
                                "d": Some("M12 9v4"),
                            }
                            path {
                                class: "ty-notice__glyph",
                                "d": Some("M12 17h.01"),
                            }
                        }
                    }
                    if !(slot_icon) && tone == InlineNoticeTone::Info {
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
                                class: "ty-notice__glyph",
                                "cx": Some("12"),
                                "cy": Some("12"),
                                "r": Some("10"),
                            }
                            path {
                                class: "ty-notice__glyph",
                                "d": Some("M12 16v-4"),
                            }
                            path {
                                class: "ty-notice__glyph",
                                "d": Some("M12 8h.01"),
                            }
                        }
                    }
                    if !(slot_icon) && tone == InlineNoticeTone::Success {
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
                                class: "ty-notice__glyph",
                                "cx": Some("12"),
                                "cy": Some("12"),
                                "r": Some("10"),
                            }
                            path {
                                class: "ty-notice__glyph",
                                "d": Some("m16 9-5.5 5.5L8 12"),
                            }
                        }
                    }
                    if slot_icon {
                        {icon.clone()}
                    }
                }
                div {
                    class: "ty-notice__body",
                    if slot_title && title_as == InlineNoticeTitleAs::P {
                        p {
                            class: "ty-notice__title",
                            if tone == InlineNoticeTone::Danger {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_danger.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Warning {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_warning.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Info {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_info.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Success {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_success.clone()}
                                }
                            }
                            {title.clone()}
                        }
                    }
                    if slot_title && title_as == InlineNoticeTitleAs::H2 {
                        h2 {
                            class: "ty-notice__title",
                            if tone == InlineNoticeTone::Danger {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_danger.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Warning {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_warning.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Info {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_info.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Success {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_success.clone()}
                                }
                            }
                            {title.clone()}
                        }
                    }
                    if slot_title && title_as == InlineNoticeTitleAs::H3 {
                        h3 {
                            class: "ty-notice__title",
                            if tone == InlineNoticeTone::Danger {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_danger.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Warning {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_warning.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Info {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_info.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Success {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_success.clone()}
                                }
                            }
                            {title.clone()}
                        }
                    }
                    if slot_title && title_as == InlineNoticeTitleAs::H4 {
                        h4 {
                            class: "ty-notice__title",
                            if tone == InlineNoticeTone::Danger {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_danger.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Warning {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_warning.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Info {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_info.clone()}
                                }
                            }
                            if tone == InlineNoticeTone::Success {
                                span {
                                    class: "ty-visually-hidden",
                                    {tone_word_success.clone()}
                                }
                            }
                            {title.clone()}
                        }
                    }
                    div {
                        class: "ty-notice__message",
                        if !(slot_title) && tone == InlineNoticeTone::Danger {
                            span {
                                class: "ty-visually-hidden",
                                {tone_word_danger.clone()}
                            }
                        }
                        if !(slot_title) && tone == InlineNoticeTone::Warning {
                            span {
                                class: "ty-visually-hidden",
                                {tone_word_warning.clone()}
                            }
                        }
                        if !(slot_title) && tone == InlineNoticeTone::Info {
                            span {
                                class: "ty-visually-hidden",
                                {tone_word_info.clone()}
                            }
                        }
                        if !(slot_title) && tone == InlineNoticeTone::Success {
                            span {
                                class: "ty-visually-hidden",
                                {tone_word_success.clone()}
                            }
                        }
                        {children.clone()}
                    }
                    if slot_actions {
                        div {
                            class: "ty-notice__actions",
                            {actions.clone()}
                        }
                    }
                }
                if dismissible {
                    button {
                        class: "ty-button ty-notice__dismiss",
                        "type": Some("button"),
                        "data-variant": Some("quiet"),
                        "data-size": Some("compact"),
                        "data-icon-only": Some(""),
                        "aria-label": (!dismiss_label.is_empty()).then_some(dismiss_label.as_str()),
                        onclick: move |_event: MouseEvent| {
                            if let Some(handler) = on_dismiss {
                                handler.call(());
                            }
                            wasm::focus_next(host);
                        },
                        span {
                            class: "ty-button__icon",
                            "aria-hidden": Some("true"),
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
                                path {
                                    class: "ty-notice__glyph",
                                    "d": Some("M18 6 6 18"),
                                }
                                path {
                                    class: "ty-notice__glyph",
                                    "d": Some("m6 6 12 12"),
                                }
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

    pub fn focus_next(_host: Signal<Option<Rc<MountedData>>>) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;
    use wasm_bindgen::closure::Closure;
    use wasm_bindgen::JsCast;

    const FOCUSABLE: &str = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

    /// Focus moves to the next logical element, not the document body: the
    /// first focusable after the notice, else the last focusable before it,
    /// focused after the task that removes the notice, as the element did.
    pub fn focus_next(host: Signal<Option<Rc<MountedData>>>) {
        let Some(host) = host_element(host) else { return };
        let Some(window) = web_sys::window() else { return };
        let Some(document) = window.document() else { return };
        let Ok(all) = document.query_selector_all(FOCUSABLE) else { return };
        let mut next: Option<web_sys::HtmlElement> = None;
        let mut fallback: Option<web_sys::HtmlElement> = None;
        for index in 0..all.length() {
            let Some(node) = all.item(index) else { continue };
            let Ok(element) = node.dyn_into::<web_sys::HtmlElement>() else { continue };
            if host.contains(Some(&element)) {
                continue;
            }
            fallback = Some(element.clone());
            if next.is_none()
                && host.compare_document_position(&element)
                    & web_sys::Node::DOCUMENT_POSITION_FOLLOWING
                    != 0
            {
                next = Some(element);
            }
        }
        let Some(target) = next.or(fallback) else { return };
        let tick = Closure::<dyn FnMut()>::new(move || {
            if target.is_connected() {
                let _ = target.focus();
            }
        });
        let _ = window.set_timeout_with_callback_and_timeout_and_arguments_0(
            tick.as_ref().unchecked_ref(),
            0,
        );
        tick.forget();
    }

    fn host_element(host: Signal<Option<Rc<MountedData>>>) -> Option<web_sys::Element> {
        host()?.downcast::<web_sys::Element>().cloned()
    }
}
