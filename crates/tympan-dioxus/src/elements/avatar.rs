//! Native port of `<ty-avatar>`: the frame with its picture and fallback,
//! or a link/button control around it, is rendered declaratively; what the
//! custom element added on top is ported with the wave's idioms. The
//! picture's load failure is state (`failed_for`, the src that errored — a
//! new `src` resets it, exactly as the element's `#failedFor` did) read by
//! the `rsx!`, so a failure swaps the picture for the fallback, drops
//! `data-image` and gives the static frame its `img` role back, all without
//! a DOM pass. What only a mounted element can do stays in the cfg-gated
//! `wasm` module: the control's accessible name (the `action-label` with
//! `{name}` filled in — mirrored onto the control, never server-rendered, as
//! in the element) and the one-time console warning when a non-decorative
//! avatar has no `name`.

use std::rc::Rc;

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// `person`: circle with initials. `agent`: rounded square with a bot icon and a dashed border, never initials (§2.11).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum AvatarActorKind {
    #[default]
    Person,
    Agent,
}

impl AvatarActorKind {
    pub const ALL: [AvatarActorKind; 2] = [AvatarActorKind::Person, AvatarActorKind::Agent];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            AvatarActorKind::Person => "person",
            AvatarActorKind::Agent => "agent",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<AvatarActorKind> {
        AvatarActorKind::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Size step.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum AvatarSize {
    Xsmall,
    Small,
    #[default]
    Regular,
    Large,
}

impl AvatarSize {
    pub const ALL: [AvatarSize; 4] = [AvatarSize::Xsmall, AvatarSize::Small, AvatarSize::Regular, AvatarSize::Large];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            AvatarSize::Xsmall => "xsmall",
            AvatarSize::Small => "small",
            AvatarSize::Regular => "regular",
            AvatarSize::Large => "large",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<AvatarSize> {
        AvatarSize::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Fallback background: accent-soft or neutral (§2.3).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum AvatarTint {
    #[default]
    Accent,
    Neutral,
}

impl AvatarTint {
    pub const ALL: [AvatarTint; 2] = [AvatarTint::Accent, AvatarTint::Neutral];

    /// The attribute value.
    pub const fn as_str(self) -> &'static str {
        match self {
            AvatarTint::Accent => "accent",
            AvatarTint::Neutral => "neutral",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<AvatarTint> {
        AvatarTint::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Represents a person or an agent with a picture or fallback initials, optionally as a pressable control. Static, the frame is an image role named by `name` (hidden when `decorative`); pressable, it is a link (`href`) or a button (`pressable`) named by `actionLabel`, with a 44 px hit area at every size. The fallback (initials for a person, a bot mark for an agent, a user mark otherwise) shows while there is no picture and when the picture fails to load.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyAvatar(
    /// Image URL; on load error the fallback shows.
    #[props(into)]
    src: Option<String>,
    /// One or two characters shown when there is no image (derived by the host from a name); the element keeps the first two grapheme clusters.
    #[props(into)]
    fallback_text: Option<String>,
    /// Accessible name; required unless `decorative`. Initials are never read as letters while it is set.
    #[props(into)]
    name: Option<String>,
    /// Hides the avatar from assistive tech when the name is already shown next to it.
    #[props(default)]
    decorative: bool,
    /// `person`: circle with initials. `agent`: rounded square with a bot icon and a dashed border, never initials (§2.11).
    #[props(default)]
    actor_kind: AvatarActorKind,
    /// Size step.
    #[props(default)]
    size: AvatarSize,
    /// Fallback background: accent-soft or neutral (§2.3).
    #[props(default)]
    tint: AvatarTint,
    /// The avatar is one press target (a button); set it when `onPress` is wired. Implied by `href`.
    #[props(default)]
    pressable: bool,
    /// Makes the avatar a link to this destination (wins over `pressable`).
    #[props(into)]
    href: Option<String>,
    /// Accessible name of a pressable avatar; `{name}` is filled in. Translate through this attribute.
    #[props(into, default = String::from("Open profile of {name}"))]
    action_label: String,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The native click of the pressable avatar (its link or button).
    onclick: Option<EventHandler<MouseEvent>>,
) -> Element {
    let instance = use_instance_id(instance);

    let has_src = src.as_deref().is_some_and(|v| !v.is_empty());
    let has_href = href.as_deref().is_some_and(|v| !v.is_empty());

    // The src whose picture failed to load; a different src resets, as the
    // element's `#failedFor` did. Read here so a failure re-renders the
    // anatomy with the fallback in place.
    let failed_for = use_signal(|| None::<String>);
    let failed = has_src && failed_for().as_deref() == src.as_deref();

    // Initials are one or two grapheme clusters, however long the prop —
    // code points here, a dependency-free stand-in for the element's
    // Intl.Segmenter pass.
    let initials = fallback_text
        .as_deref()
        .filter(|v| !v.is_empty())
        .map(|text| text.chars().take(2).collect::<String>());

    // The control's accessible name: the action label with `{name}` filled
    // in. The wasm pass mirrors it onto the mounted control (the SSR markup
    // carries none of it, as the element's did not).
    let control_label = action_label
        .replace("{name}", name.as_deref().unwrap_or(""))
        .trim()
        .to_string();
    let mut label = use_signal(|| control_label.clone());
    if *label.peek() != control_label {
        label.set(control_label);
    }

    let mut control = use_signal(|| None::<Rc<MountedData>>);
    wasm::apply_label(control, label);
    wasm::warn_unnamed(
        decorative,
        name.as_deref().is_some_and(|v| !v.is_empty()),
    );

    rsx! {
        ty-avatar {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "src": src.as_deref().filter(|v| !v.is_empty()),
            "fallback-text": fallback_text.as_deref().filter(|v| !v.is_empty()),
            "name": name.as_deref().filter(|v| !v.is_empty()),
            "decorative": decorative.then_some(""),
            "actor-kind": Some(actor_kind.as_str()),
            "size": Some(size.as_str()),
            "tint": Some(tint.as_str()),
            "pressable": pressable.then_some(""),
            "href": href.as_deref().filter(|v| !v.is_empty()),
            "action-label": (!action_label.is_empty()).then_some(action_label.as_str()),
            span {
                class: "ty-avatar-root",
                if !pressable && !has_href {
                    span {
                        class: "ty-avatar",
                        "data-kind": Some(actor_kind.as_str()),
                        "data-size": Some(size.as_str()),
                        "data-tint": Some(tint.as_str()),
                        "data-image": (has_src && !failed).then_some(""),
                        "aria-hidden": decorative.then_some("true"),
                        "role": (!decorative && (!has_src || failed)).then_some("img"),
                        "aria-label": if !decorative && (!has_src || failed) { name.as_deref().filter(|v| !v.is_empty()) } else { None },
                        {frame_content(src.clone(), name.clone(), initials.clone(), actor_kind, decorative, pressable, has_href, has_src, failed, failed_for)}
                    }
                }
                if has_href {
                    a {
                        class: "ty-avatar-control",
                        "href": href.as_deref().filter(|v| !v.is_empty()),
                        "data-size": Some(size.as_str()),
                        onmounted: move |event| control.set(Some(event.data())),
                        onclick: move |event| { if let Some(handler) = onclick { handler.call(event) } },
                        span {
                            class: "ty-avatar",
                            "data-kind": Some(actor_kind.as_str()),
                            "data-size": Some(size.as_str()),
                            "data-tint": Some(tint.as_str()),
                            "data-image": (has_src && !failed).then_some(""),
                            "aria-hidden": Some("true"),
                            {frame_content(src.clone(), name.clone(), initials.clone(), actor_kind, decorative, pressable, has_href, has_src, failed, failed_for)}
                        }
                    }
                }
                if !has_href && pressable {
                    button {
                        class: "ty-avatar-control",
                        "type": Some("button"),
                        "data-size": Some(size.as_str()),
                        onmounted: move |event| control.set(Some(event.data())),
                        onclick: move |event| { if let Some(handler) = onclick { handler.call(event) } },
                        span {
                            class: "ty-avatar",
                            "data-kind": Some(actor_kind.as_str()),
                            "data-size": Some(size.as_str()),
                            "data-tint": Some(tint.as_str()),
                            "data-image": (has_src && !failed).then_some(""),
                            "aria-hidden": Some("true"),
                            {frame_content(src.clone(), name.clone(), initials.clone(), actor_kind, decorative, pressable, has_href, has_src, failed, failed_for)}
                        }
                    }
                }
            }
        }
    }
}

/// The picture and the fallback it covers, shared by the static frame and
/// the two pressable controls (the definition's `content`). Both are always
/// rendered while a `src` is given; a load error hides the picture and
/// shows the fallback.
#[allow(clippy::too_many_arguments)]
fn frame_content(
    src: Option<String>,
    name: Option<String>,
    initials: Option<String>,
    actor_kind: AvatarActorKind,
    decorative: bool,
    pressable: bool,
    has_href: bool,
    has_src: bool,
    failed: bool,
    mut failed_for: Signal<Option<String>>,
) -> Element {
    // Each `onerror` closure needs its own copy of the src to record.
    let failed_named = src.clone();
    let failed_plain = src.clone();
    rsx! {
        if has_src && (decorative || pressable || has_href) {
            img {
                class: "ty-avatar__image",
                "src": src.as_deref().filter(|v| !v.is_empty()),
                "alt": Some(""),
                "hidden": failed.then_some("true"),
                onerror: move |_| failed_for.set(failed_named.clone()),
            }
        }
        if has_src && !decorative && !pressable && !has_href {
            img {
                class: "ty-avatar__image",
                "src": src.as_deref().filter(|v| !v.is_empty()),
                "alt": name.as_deref().filter(|v| !v.is_empty()),
                "hidden": failed.then_some("true"),
                onerror: move |_| failed_for.set(failed_plain.clone()),
            }
        }
        span {
            class: "ty-avatar__fallback",
            "hidden": (has_src && !failed).then_some("true"),
            if actor_kind == AvatarActorKind::Agent {
                svg {
                    class: "ty-avatar__icon",
                    "viewBox": Some("0 0 24 24"),
                    "fill": Some("none"),
                    "stroke": Some("currentColor"),
                    "stroke-width": Some("2"),
                    "stroke-linecap": Some("round"),
                    "stroke-linejoin": Some("round"),
                    "aria-hidden": Some("true"),
                    "focusable": Some("false"),
                    path {
                        class: "ty-avatar__glyph",
                        "d": Some("M12 8V4H8"),
                    }
                    rect {
                        class: "ty-avatar__glyph",
                        "width": Some("16"),
                        "height": Some("12"),
                        "x": Some("4"),
                        "y": Some("8"),
                        "rx": Some("2"),
                    }
                    path {
                        class: "ty-avatar__glyph",
                        "d": Some("M2 14h2"),
                    }
                    path {
                        class: "ty-avatar__glyph",
                        "d": Some("M20 14h2"),
                    }
                    path {
                        class: "ty-avatar__glyph",
                        "d": Some("M15 13v2"),
                    }
                    path {
                        class: "ty-avatar__glyph",
                        "d": Some("M9 13v2"),
                    }
                }
            }
            if actor_kind == AvatarActorKind::Person && initials.is_some() {
                span {
                    class: "ty-avatar__initials",
                    "aria-hidden": Some("true"),
                    {initials.clone().unwrap_or_default()}
                }
            }
            if actor_kind == AvatarActorKind::Person && initials.is_none() {
                svg {
                    class: "ty-avatar__icon",
                    "viewBox": Some("0 0 24 24"),
                    "fill": Some("none"),
                    "stroke": Some("currentColor"),
                    "stroke-width": Some("2"),
                    "stroke-linecap": Some("round"),
                    "stroke-linejoin": Some("round"),
                    "aria-hidden": Some("true"),
                    "focusable": Some("false"),
                    path {
                        class: "ty-avatar__glyph",
                        "d": Some("M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"),
                    }
                    circle {
                        class: "ty-avatar__glyph",
                        "cx": Some("12"),
                        "cy": Some("7"),
                        "r": Some("4"),
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

    pub fn apply_label(_control: Signal<Option<Rc<MountedData>>>, _label: Signal<String>) {}

    pub fn warn_unnamed(_decorative: bool, _named: bool) {}
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use std::rc::Rc;

    use dioxus::prelude::*;

    /// The control's accessible name is the action label with `{name}`
    /// filled in; set on the mounted link or button, as the element's
    /// `#applyLabel` did.
    pub fn apply_label(control: Signal<Option<Rc<MountedData>>>, label: Signal<String>) {
        use_effect(move || {
            let Some(element) = control()
                .and_then(|mounted| mounted.downcast::<web_sys::Element>().cloned())
            else {
                return;
            };
            let label = label();
            if label.is_empty() {
                let _ = element.remove_attribute("aria-label");
            } else {
                let _ = element.set_attribute("aria-label", &label);
            }
        });
    }

    /// The element warns once on connect when there is no name to give.
    pub fn warn_unnamed(decorative: bool, named: bool) {
        let mut warned = use_signal(|| false);
        use_effect(move || {
            if !decorative && !named && !*warned.peek() {
                warned.set(true);
                web_sys::console::warn_1(&wasm_bindgen::JsValue::from_str(
                    "<ty-avatar>: `name` is required unless `decorative`.",
                ));
            }
        });
    }
}
