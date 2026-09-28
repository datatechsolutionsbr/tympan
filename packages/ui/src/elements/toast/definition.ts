import type { ElementDefinition } from '../definition.ts'

/**
 * `<ty-toast>`: the Toast's single source (spec: wave-1/toast.md).
 *
 * The element is the spec's provider and region in one: it owns the queue
 * and the history and renders the fixed region itself, so it is
 * self-rendering (like the theme palette) with no anatomy and no examples —
 * the queue is runtime data no renderer can express up front. Toasts arrive
 * through the element's imperative API, the hook's twin:
 * `show({ tone, title, message, action, duration, id })`, the shortcuts
 * `success` / `error` / `warning` / `info(title, options)`, `dismiss(id)`
 * and the `history` getter. The generated React wrapper forwards the host
 * element as its ref, so React consumers call the same API through it.
 *
 * The region is a landmark (a labelled `section`) holding two live-region
 * lists, not nested: errors in an assertive `role="alert"` list, every other
 * tone in a polite `role="status"` list. A toast never takes focus when
 * shown; F6 moves focus into the region and back out, Escape inside a
 * focused toast dismisses it, and when the last toast closes while focused,
 * focus returns to where it was. The auto-dismiss timer pauses while the
 * pointer is over the region, focus is inside it or the window is hidden.
 * Errors and toasts with an action are persistent by default (WCAG 2.2.1).
 */
export const toastDefinition = {
  tag: 'ty-toast',
  name: 'TyToast',
  kind: 'self-rendering',
  doc: 'Brief, non-blocking confirmation or warning after an action, shown in a fixed landmark region with one live-region politeness per tone (errors assertive, the rest polite). The element owns the queue and the history; toasts arrive through its imperative API (`show`, `success`/`error`/`warning`/`info`, `dismiss`, `history`), reachable through the host ref. Auto-dismiss pauses on hover, focus and a hidden window; errors and toasts with an action stay until dismissed.',
  props: {
    placement: { type: 'enum', values: ['top-end', 'top-center', 'bottom-center'], default: 'top-end', attribute: 'placement', doc: 'Region position (`data-placement`); `bottom-center` is recommended below 640 px.' },
    maxVisible: { type: 'number', default: 3, attribute: 'max-visible', doc: 'Toasts shown at once; the rest wait in the queue and appear as earlier ones dismiss.' },
    historyLimit: { type: 'number', default: 50, attribute: 'history-limit', doc: 'How many past toasts the history keeps (newest first); feeds the notification history.' },
    regionLabel: { type: 'string', default: 'Notifications', attribute: 'region-label', doc: 'Accessible name of the region landmark (the I18nAdapter\'s toast.region in React).' },
    dismissLabel: { type: 'string', default: 'Dismiss notification', attribute: 'dismiss-label', doc: 'Accessible name of each toast\'s dismiss button.' },
  },
  events: [
    { type: 'ty-toast-dismiss', kind: 'custom', detail: { id: 'string' }, reactProp: 'onDismiss', rustProp: 'on_dismiss', doc: 'A toast was dismissed — timeout, dismiss button, Escape, swipe, its action, or a `dismiss(id)` call; the detail carries its id (the spec\'s `onDismiss`).' },
    { type: 'ty-toast-action', kind: 'custom', detail: { id: 'string' }, reactProp: 'onAction', rustProp: 'on_action', doc: 'A toast\'s action was pressed; its `onPress` ran too and the toast dismissed itself. Lets hosts that cannot pass a callback still react to the action.' },
  ],
  examples: [],
} as const satisfies ElementDefinition
