//! SSR parity of the native port of `<ty-toast>` (`tympan_dioxus::elements`).
//! The definition has no examples — the queue is runtime data no renderer can
//! express up front — so there are no fixtures; what is asserted instead is
//! the one SSR-representable state, the empty region landmark with its two
//! live-region lists, exactly the subtree the custom element builds on
//! connect (toasts themselves only ever appear at runtime, through
//! `use_toast`).

use dioxus::prelude::*;
use tympan_dioxus::elements;

use super::common;

#[test]
fn empty_region() {
    fn app() -> Element {
        rsx! { elements::TyToast { instance: "i" } }
    }
    assert_eq!(
        common::render(app),
        "<ty-toast data-ty-instance=\"i\" placement=\"top-end\" max-visible=\"3\" history-limit=\"50\" region-label=\"Notifications\" dismiss-label=\"Dismiss notification\"><section class=\"ty-toast-region\" aria-label=\"Notifications\" data-placement=\"top-end\"><div class=\"ty-toast-region__list\" role=\"alert\" aria-live=\"assertive\" aria-atomic=\"false\"></div><div class=\"ty-toast-region__list\" role=\"status\" aria-live=\"polite\" aria-atomic=\"false\"></div></section></ty-toast>"
    );
}

#[test]
fn custom_props() {
    fn app() -> Element {
        rsx! {
            elements::TyToast {
                placement: elements::ToastPlacement::BottomCenter,
                max_visible: 5.0,
                history_limit: 10.0,
                region_label: "Avisos",
                dismiss_label: "Fechar aviso",
                instance: "i",
            }
        }
    }
    assert_eq!(
        common::render(app),
        "<ty-toast data-ty-instance=\"i\" placement=\"bottom-center\" max-visible=\"5\" history-limit=\"10\" region-label=\"Avisos\" dismiss-label=\"Fechar aviso\"><section class=\"ty-toast-region\" aria-label=\"Avisos\" data-placement=\"bottom-center\"><div class=\"ty-toast-region__list\" role=\"alert\" aria-live=\"assertive\" aria-atomic=\"false\"></div><div class=\"ty-toast-region__list\" role=\"status\" aria-live=\"polite\" aria-atomic=\"false\"></div></section></ty-toast>"
    );
}
