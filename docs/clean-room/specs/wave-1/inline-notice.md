# InlineNotice

Wave 1 · feedback · Status: specified

## Purpose
Shows a short message about the state of a form, section or page (error, warning, information, success) inside the flow of content.

## Anatomy
- **Root** block on a subtle tinted surface.
- **Icon** (per tone, always shown unless the host supplies another).
- **Title** (optional).
- **Message** body.
- **Actions** (optional): up to two quiet buttons or links.
- **Dismiss button** (optional).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| tone | 'danger' \| 'warning' \| 'info' \| 'success' | 'info' | Semantic tone (§2.3). |
| title | string | none | Short heading. |
| children | node | required | Message. |
| icon | node | tone default | Override icon. |
| actions | node | none | Buttons or links. |
| dismissible | boolean | false | Shows the dismiss button. |
| onDismiss | () => void | none | Fires when dismissed; the host removes the notice. |
| align | 'start' \| 'centre' | 'start' | Centred only for short single-message confirmations. |
| urgency | 'polite' \| 'assertive' \| 'none' | danger/warning: 'assertive'; info/success: 'polite' | How the notice is announced when it appears. `none` for notices present on page load. |

## States
Per tone; dismissed (removed by host). Focus-visible on actions and dismiss.

## Keyboard and ARIA
- APG pattern: **Alert** for assertive urgency; polite notices use `role="status"`.
- No RAC primitive; custom.
- The live role is applied only when the notice appears after load; notices rendered with the page use no live role (`urgency="none"`) to avoid repeated announcements.
- Dismiss button name from I18n ("Dismiss"); after dismissal focus moves to the next logical element, not the document body.
- Icon is decorative; the tone is also carried by the title or first word when no title is given (the host is responsible for wording; the component prefixes a visually hidden tone word from I18n such as "Error:").

## Responsive, touch, motion, forced colours
- Full width of its container; message width capped at the prose measure of §2.2.
- Action and dismiss targets are 44 × 44 px.
- Appears without motion; the host may fade it with the quick duration, disabled under reduced motion.
- Reduced transparency: opaque tinted surface.
- Forced colours: 1 px `CanvasText` border; icon remains visible.

## Acceptance tests
- Given `tone="danger"` rendered after a failed submit, then it has role alert and the message is announced.
- Given `tone="success"`, when it appears, then it has role status.
- Given `urgency="none"`, then no live role is set.
- Given a title, when rendered, then the title precedes the message and is not a page-level heading unless configured.
- Given `dismissible`, when the dismiss button is activated, then `onDismiss` fires.
- Given any tone, when read, then a tone word (e.g. "Warning") is announced before the message.
- Given forced colours, then the boundary and icon are visible.
