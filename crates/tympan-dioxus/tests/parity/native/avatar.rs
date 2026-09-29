//! SSR parity of the native port (`tympan_dioxus::elements`): every
//! example of `<ty-avatar>`, rendered by the native component, must match
//! the same reference HTML (tests/fixtures) the generated binding and the
//! TypeScript element are tested against — one anatomy, three renderers.

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn initials() {
    fn app() -> Element {
        rsx! { elements::TyAvatar { name: "Natália Mesquita", fallback_text: "NM", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-avatar/initials.html");
}

#[test]
fn image() {
    fn app() -> Element {
        rsx! { elements::TyAvatar { src: "/avatars/natalia.png", name: "Natália Mesquita", fallback_text: "NM", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-avatar/image.html");
}

#[test]
fn agent() {
    fn app() -> Element {
        rsx! { elements::TyAvatar { actor_kind: elements::AvatarActorKind::Agent, name: "stage-counter", size: elements::AvatarSize::Small, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-avatar/agent.html");
}

#[test]
fn decorative_neutral() {
    fn app() -> Element {
        rsx! { elements::TyAvatar { decorative: true, fallback_text: "NM", tint: elements::AvatarTint::Neutral, instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-avatar/decorative-neutral.html");
}

#[test]
fn pressable() {
    fn app() -> Element {
        rsx! { elements::TyAvatar { pressable: true, name: "Natália Mesquita", fallback_text: "NM", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-avatar/pressable.html");
}

#[test]
fn link() {
    fn app() -> Element {
        rsx! { elements::TyAvatar { href: "/users/natalia", name: "Natália Mesquita", src: "/avatars/natalia.png", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-avatar/link.html");
}

#[test]
fn translated_action() {
    fn app() -> Element {
        rsx! { elements::TyAvatar { pressable: true, name: "Natália Mesquita", fallback_text: "NM", action_label: "Abrir perfil de {{name}}", instance: "i", } }
    }
    common::assert_matches_fixture(app, "ty-avatar/translated-action.html");
}
