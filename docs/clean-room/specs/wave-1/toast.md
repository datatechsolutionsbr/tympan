# Toast

Wave 1 · feedback · Status: specified

## Purpose
Brief, non-blocking confirmation or warning after an action ("Source saved", "Could not reach the server"), shown in a fixed region and recorded in the notification history (see NotificationCenter, wave 2).

## Anatomy
- **Toast region**: fixed area near the top end of the viewport (below the top bar), holding the visible toasts.
- **Toast**: tone icon, title, optional message, optional action button, dismiss button.
- **Provider**: owns the queue and the history; exposes a hook.
- **Hook**: returns `show(options)` plus shortcuts `success`, `error`, `warning`, `info`, and `dismiss(id)`.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| Provider.maxVisible | number | 3 | toasts shown at once; the rest wait in the queue |
| Provider.historyLimit | number | host choice | how many past toasts the history keeps (newest first) |
| Provider.placement | 'top-end' \| 'top-center' \| 'bottom-center' | 'top-end' | region position; bottom-center recommended below 640 px |
| show.tone | 'success' \| 'error' \| 'warning' \| 'info' | 'info' | icon and semantic colour, always with the title text |
| show.title | string | required | main sentence |
| show.message | string | none | detail |
| show.action | { label: string; onPress: () => void } | none | one optional action, such as "Undo" |
| show.duration | number (ms) \| 'persistent' | tone-dependent | auto-dismiss time; errors and toasts with actions default to persistent |
| show.id | string | generated | lets a later call replace the same toast |
| onDismiss | (id: string) => void | none | called on any dismissal |

## States
- entering, visible, paused (pointer over or focus inside), exiting, dismissed.
- Auto-dismiss timer pauses while hovered or focused and while the window is hidden.
- Showing a toast with an existing `id` updates it in place.

## Keyboard and ARIA
- APG: no finished pattern; follows the **Alert** guidance for errors and the status/live-region guidance for the rest. RAC primitive: `UNSTABLE_ToastRegion` + `UNSTABLE_Toast` + `UNSTABLE_ToastQueue` (or a custom region if the API is not stable).
- The region is a landmark (`region`, labelled "Notifications" from the I18nAdapter) reachable with F6 or a documented shortcut; toasts never take focus when shown.
- success/info/warning are announced politely; error is announced assertively. Live regions are not nested.
- Dismiss button named "Dismiss notification"; Escape inside a focused toast dismisses it. When the last toast closes while focused, focus returns to where it was before entering the region.
- Toasts with an action must not auto-dismiss (WCAG 2.2.1), and the action must also be reachable elsewhere or through history.

## Responsive, touch, motion, forced colours
- Below 640 px toasts span the width minus the 16 px gutter.
- Dismiss and action buttons at least 44 × 44 px.
- Surface elevation level 3 (§2.5), radius `--fk-radius-card`, semantic colours from §2.3 on the icon only.
- Enter with `--fk-dur-base` fade and short slide, exit with `--fk-ease-out`; reduced motion: fade only. Optional haptic tick on arrival (Haptics utility).
- Swipe toward the edge dismisses on touch; it is never the only way.
- Forced colours: toast border in `CanvasText`; icon plus text carry tone.

## Acceptance tests
- Given the provider, When `success("Saved")` is called, Then a toast "Saved" appears in a polite live region and is added to the history.
- Given `error("Failed")`, Then it is announced assertively and stays until dismissed.
- Given an info toast with default duration, When the time passes without hover, Then it disappears and `onDismiss` is called.
- Given a visible toast, When the pointer rests on it, Then the timer pauses; When it leaves, Then the timer resumes.
- Given four toasts and `maxVisible` 3, Then three are visible and the fourth shows after one is dismissed.
- Given a focused toast, When Escape is pressed, Then it is dismissed.
- Given the hook used outside the provider, Then it throws a descriptive error.
- Given two calls with the same id, Then only one toast is shown, with the latest content.

## Open questions
- The fork shows one expanding pill at a time and wraps an assertive alert inside a polite status region; the new component queues toasts and uses one live-region politeness per tone.
