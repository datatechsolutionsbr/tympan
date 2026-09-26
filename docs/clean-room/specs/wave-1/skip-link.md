# SkipLink

Wave 1 · navigation · Status: specified

## Purpose
Let keyboard and screen-reader users jump past the navigation straight to the main content.

## Anatomy
- **Link**: visually hidden until it receives focus, then shown in a fixed position at the start of the top edge above all other layers.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| targetId | string | 'main-content' | id of the main content element |
| label | string | from I18nAdapter ("Skip to main content") | link text |

## States
- hidden (not focused), visible (focused), activated.

## Keyboard and ARIA
- APG: no widget pattern; implements WCAG 2.4.1 Bypass Blocks. RAC: `Link` is not needed; a native anchor to the fragment is correct.
- Must be the first focusable element in the document (AppFrame renders it first).
- On activation, focus moves to the target; if the target is not natively focusable, it receives a programmatic focus (temporary negative tabindex) so the next Tab continues from there, and the page scrolls so the target is not hidden under the sticky top bar (`scroll-padding-top` per §2.6).
- The link is never `display: none` (it must stay in the accessibility tree).

## Responsive, touch, motion, forced colours
- When visible: at least 44 px tall, raised surface, focus outline per §2.6.
- No animation when it appears; reduced motion is therefore satisfied.
- Forced colours: uses `LinkText` on `Canvas` with a visible border.

## Acceptance tests
- Given a page with the frame, When Tab is pressed once from the top, Then the skip link is focused and visible.
- Given the skip link focused, When Enter is pressed, Then focus is on the element with id `targetId`.
- Given the skip link not focused, Then it is not visible but is in the accessibility tree with its label.
- Given a sticky top bar, When the link is activated, Then the target's top is not covered by the bar.
- Given `label` "Ir para o conteúdo", Then that is the link text.
