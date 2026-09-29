//! Native port of `<ty-button>`: a native `<button>` inside, so focus,
//! keyboard activation and form submission are the platform's, as in the
//! custom element. The element's only script was a capture-phase guard that
//! blocked presses while `busy`; here the guard lives in the click handler —
//! while busy the default (form submission) is prevented and the press never
//! reaches `onclick`, leaving the button focusable with `aria-disabled`.

use dioxus::prelude::*;

use crate::runtime::use_instance_id;

/// Visual weight; at most one primary per view.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ButtonVariant {
    Primary,
    #[default]
    Secondary,
    Quiet,
    Danger,
}

impl ButtonVariant {
    pub const ALL: [ButtonVariant; 4] = [ButtonVariant::Primary, ButtonVariant::Secondary, ButtonVariant::Quiet, ButtonVariant::Danger];

    pub const fn as_str(self) -> &'static str {
        match self {
            ButtonVariant::Primary => "primary",
            ButtonVariant::Secondary => "secondary",
            ButtonVariant::Quiet => "quiet",
            ButtonVariant::Danger => "danger",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<ButtonVariant> {
        ButtonVariant::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Height step.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ButtonSize {
    Compact,
    #[default]
    Regular,
    Large,
}

impl ButtonSize {
    pub const ALL: [ButtonSize; 3] = [ButtonSize::Compact, ButtonSize::Regular, ButtonSize::Large];

    pub const fn as_str(self) -> &'static str {
        match self {
            ButtonSize::Compact => "compact",
            ButtonSize::Regular => "regular",
            ButtonSize::Large => "large",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<ButtonSize> {
        ButtonSize::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// `circle` only for icon-only buttons.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ButtonShape {
    #[default]
    Rounded,
    Pill,
    Circle,
}

impl ButtonShape {
    pub const ALL: [ButtonShape; 3] = [ButtonShape::Rounded, ButtonShape::Pill, ButtonShape::Circle];

    pub const fn as_str(self) -> &'static str {
        match self {
            ButtonShape::Rounded => "rounded",
            ButtonShape::Pill => "pill",
            ButtonShape::Circle => "circle",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<ButtonShape> {
        ButtonShape::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Native button type; `submit` submits the enclosing form.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum ButtonType {
    #[default]
    Button,
    Submit,
    Reset,
}

impl ButtonType {
    pub const ALL: [ButtonType; 3] = [ButtonType::Button, ButtonType::Submit, ButtonType::Reset];

    pub const fn as_str(self) -> &'static str {
        match self {
            ButtonType::Button => "button",
            ButtonType::Submit => "submit",
            ButtonType::Reset => "reset",
        }
    }

    /// The variant for an attribute value.
    pub fn parse(value: &str) -> Option<ButtonType> {
        ButtonType::ALL.into_iter().find(|v| v.as_str() == value)
    }
}

/// Triggers one action. A native <button> inside, so focus, keyboard activation and form submission are the platform's.
#[allow(clippy::too_many_arguments)]
#[component]
pub fn TyButton(
    /// Visual weight; at most one primary per view.
    #[props(default)]
    variant: ButtonVariant,
    /// Height step.
    #[props(default)]
    size: ButtonSize,
    /// `circle` only for icon-only buttons.
    #[props(default)]
    shape: ButtonShape,
    /// Hides the label; `accessibleLabel` is then required.
    #[props(default)]
    icon_only: bool,
    /// Stretches to the container width.
    #[props(default)]
    full_width: bool,
    /// Shows the busy indicator and blocks presses (`aria-busy`, `aria-disabled`).
    #[props(default)]
    busy: bool,
    /// Native disabled.
    #[props(default)]
    disabled: bool,
    /// Native button type; `submit` submits the enclosing form.
    #[props(default)]
    r#type: ButtonType,
    /// Form field name sent with a submit.
    #[props(into)]
    name: Option<String>,
    /// Form field value sent with a submit.
    #[props(into)]
    value: Option<String>,
    /// Accessible name when there is no visible label; also the tooltip of an icon-only button.
    #[props(into)]
    accessible_label: Option<String>,
    /// A toggle button's state, `true` or `false` (`aria-pressed`); left out for an ordinary button.
    #[props(into)]
    pressed: Option<String>,
    /// `true` or `false` while the button shows or hides a popup or region (`aria-expanded`).
    #[props(into)]
    expanded: Option<String>,
    /// Id of the element the button controls (`aria-controls`).
    #[props(into)]
    controls: Option<String>,
    /// The kind of popup the button opens (`aria-haspopup`: `menu`, `dialog`, `listbox`, …).
    #[props(into)]
    haspopup: Option<String>,
    /// Test hook on the native button (`data-testid`).
    #[props(into)]
    test_id: Option<String>,
    /// Base of the ids the anatomy needs; a generated one when not given.
    #[props(into)]
    instance: Option<String>,
    #[props(into)]
    id: Option<String>,
    #[props(into, default)]
    class: String,
    /// The label.
    children: Element,
    /// A leading icon (decorative).
    icon: Option<Element>,
    /// A trailing icon (decorative).
    trailing_icon: Option<Element>,
    /// The native click (not fired while busy or disabled).
    onclick: Option<EventHandler<MouseEvent>>,
) -> Element {
    let instance = use_instance_id(instance);
    let slot_icon = icon.is_some();
    let slot_trailing_icon = trailing_icon.is_some();
    rsx! {
        ty-button {
            "id": id.clone(),
            "class": (!class.is_empty()).then_some(class.clone()),
            "data-ty-instance": instance.clone(),
            "variant": Some(variant.as_str()),
            "size": Some(size.as_str()),
            "shape": Some(shape.as_str()),
            "icon-only": icon_only.then_some(""),
            "full-width": full_width.then_some(""),
            "busy": busy.then_some(""),
            "disabled": disabled.then_some("true"),
            "type": Some(r#type.as_str()),
            "name": name.as_deref().filter(|v| !v.is_empty()),
            "value": value.as_deref().filter(|v| !v.is_empty()),
            "accessible-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
            "pressed": pressed.as_deref().filter(|v| !v.is_empty()),
            "expanded": expanded.as_deref().filter(|v| !v.is_empty()),
            "controls": controls.as_deref().filter(|v| !v.is_empty()),
            "haspopup": haspopup.as_deref().filter(|v| !v.is_empty()),
            "test-id": test_id.as_deref().filter(|v| !v.is_empty()),
            button {
                class: "ty-button",
                "type": Some(r#type.as_str()),
                "name": name.as_deref().filter(|v| !v.is_empty()),
                "value": value.as_deref().filter(|v| !v.is_empty()),
                disabled: disabled,
                "aria-busy": (busy).then_some("true"),
                "aria-disabled": (busy).then_some("true"),
                "aria-label": accessible_label.as_deref().filter(|v| !v.is_empty()),
                "aria-pressed": pressed.as_deref().filter(|v| !v.is_empty()),
                "aria-expanded": expanded.as_deref().filter(|v| !v.is_empty()),
                "aria-controls": controls.as_deref().filter(|v| !v.is_empty()),
                "aria-haspopup": haspopup.as_deref().filter(|v| !v.is_empty()),
                "data-testid": test_id.as_deref().filter(|v| !v.is_empty()),
                "title": if icon_only { accessible_label.as_deref().filter(|v| !v.is_empty()) } else { None },
                "data-variant": Some(variant.as_str()),
                "data-size": Some(size.as_str()),
                "data-shape": Some(shape.as_str()),
                "data-icon-only": (icon_only).then_some(""),
                "data-full-width": (full_width).then_some(""),
                "data-busy": (busy).then_some(""),
                onclick: move |event| {
                    // The custom element's capture-phase busy guard: a press
                    // while busy must neither run the action nor submit the
                    // form (the button stays focusable, `aria-disabled`).
                    if busy {
                        event.prevent_default();
                        event.stop_propagation();
                        return;
                    }
                    if let Some(handler) = onclick { handler.call(event) }
                },
                if busy {
                    span {
                        class: "ty-button__busy",
                        "aria-hidden": Some("true"),
                    }
                }
                if !(busy) && slot_icon {
                    span {
                        class: "ty-button__icon",
                        "aria-hidden": Some("true"),
                        {icon.clone()}
                    }
                }
                if !(icon_only) {
                    span {
                        class: "ty-button__label",
                        {children.clone()}
                    }
                }
                if !(icon_only) && slot_trailing_icon {
                    span {
                        class: "ty-button__icon",
                        "aria-hidden": Some("true"),
                        {trailing_icon.clone()}
                    }
                }
            }
        }
    }
}
