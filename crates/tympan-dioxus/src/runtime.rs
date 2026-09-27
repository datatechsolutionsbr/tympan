//! What the generated bindings share: instance ids, slot checks, and the
//! listener for the custom events an element dispatches (`ty-theme-change`).

use std::rc::Rc;
use std::sync::atomic::{AtomicU64, Ordering};

use dioxus::prelude::*;

static INSTANCES: AtomicU64 = AtomicU64::new(0);

/// The id base of one rendered instance: the given one, else a stable
/// generated one (`ty-r1`, `ty-r2`, …).
pub fn use_instance_id(given: Option<String>) -> String {
    let generated = use_hook(|| format!("ty-r{}", INSTANCES.fetch_add(1, Ordering::Relaxed) + 1));
    given.filter(|id| !id.is_empty()).unwrap_or(generated)
}

/// Whether a slot's element renders anything.
pub fn has_content(element: &Element) -> bool {
    element
        .as_ref()
        .is_ok_and(|node| node != &VNode::placeholder())
}

/// A custom event's `detail`, read field by field.
pub struct Detail {
    #[cfg(target_arch = "wasm32")]
    value: wasm_bindgen::JsValue,
}

impl Detail {
    #[cfg(target_arch = "wasm32")]
    fn field(&self, name: &str) -> wasm_bindgen::JsValue {
        js_sys::Reflect::get(&self.value, &wasm_bindgen::JsValue::from_str(name))
            .unwrap_or(wasm_bindgen::JsValue::UNDEFINED)
    }

    /// A text field (empty when missing).
    pub fn string(&self, _name: &str) -> String {
        #[cfg(target_arch = "wasm32")]
        {
            self.field(_name).as_string().unwrap_or_default()
        }
        #[cfg(not(target_arch = "wasm32"))]
        String::new()
    }

    /// A boolean field (false when missing).
    pub fn boolean(&self, _name: &str) -> bool {
        #[cfg(target_arch = "wasm32")]
        {
            self.field(_name).as_bool().unwrap_or(false)
        }
        #[cfg(not(target_arch = "wasm32"))]
        false
    }

    /// A number field (0 when missing).
    pub fn number(&self, _name: &str) -> f64 {
        #[cfg(target_arch = "wasm32")]
        {
            self.field(_name).as_f64().unwrap_or(0.0)
        }
        #[cfg(not(target_arch = "wasm32"))]
        0.0
    }
}

/// Call `handler` with `build(detail)` whenever the mounted element
/// dispatches `event`. The listener is removed when the component unmounts.
pub fn use_custom_event<T: 'static>(
    host: Signal<Option<Rc<MountedData>>>,
    event: &'static str,
    handler: Option<EventHandler<T>>,
    build: fn(Detail) -> T,
) {
    #[cfg(target_arch = "wasm32")]
    {
        use wasm_bindgen::closure::Closure;
        use wasm_bindgen::JsCast;

        struct Listener {
            target: web_sys::EventTarget,
            event: &'static str,
            closure: Closure<dyn FnMut(web_sys::Event)>,
        }
        impl Drop for Listener {
            fn drop(&mut self) {
                let _ = self.target.remove_event_listener_with_callback(
                    self.event,
                    self.closure.as_ref().unchecked_ref(),
                );
            }
        }

        let mut listener = use_signal(|| None::<Rc<Listener>>);
        let mut latest = use_signal(|| handler);
        if *latest.peek() != handler {
            latest.set(handler);
        }
        use_effect(move || {
            let Some(mounted) = host() else { return };
            let Some(element) = mounted.downcast::<web_sys::Element>().cloned() else {
                return;
            };
            let target: web_sys::EventTarget = element.into();
            let closure = Closure::<dyn FnMut(web_sys::Event)>::new(move |raw: web_sys::Event| {
                let value = raw
                    .dyn_ref::<web_sys::CustomEvent>()
                    .map(|custom| custom.detail())
                    .unwrap_or(wasm_bindgen::JsValue::UNDEFINED);
                if let Some(handler) = *latest.peek() {
                    handler.call(build(Detail { value }));
                }
            });
            if target
                .add_event_listener_with_callback(event, closure.as_ref().unchecked_ref())
                .is_ok()
            {
                listener.set(Some(Rc::new(Listener {
                    target,
                    event,
                    closure,
                })));
            }
        });
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        let _ = (host, event, handler, build);
    }
}
