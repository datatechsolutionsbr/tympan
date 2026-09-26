# Link

Wave 1 · navigation · Status: specified

## Purpose
Moves the person to another location, or performs an inline text-styled action, while respecting the host router.

## Anatomy
- **Root**: an anchor rendered through the Router adapter, or a button when used for an inline action.
- **Text**: the visible link text.
- **External marker** (optional): an icon plus visually hidden text saying the link opens elsewhere.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| href | string | none | Destination. When absent, the link acts as an inline action and needs `onPress`. |
| onPress | () => void | none | Action for the inline-action mode, or a side effect on navigation. |
| emphasis | 'underlined' \| 'subtle' | 'underlined' | `subtle` removes the underline at rest; only allowed where the context makes the link obvious (e.g. navigation lists, icon + text footers). |
| external | boolean | inferred from absolute URL to another origin | Opens in a new browsing context, adds safe `rel`, shows the external marker. |
| current | boolean | false | Marks the link as the current page. |
| children | node | required | Link text. |
| replace | boolean | false | Navigates by replacing the history entry (router adapter). |

## States
Rest, hover (accent-strong per §2.3), focus-visible (§2.6), pressed, visited (not styled differently), current (`aria-current="page"`), disabled is not supported for links (use plain text instead).

## Keyboard and ARIA
- APG pattern: **Link**; inline-action mode follows **Button**.
- RAC primitive: `Link` (href mode) and `Button` (action mode).
- Enter activates; in action mode Space also activates.
- External links announce "opens in a new tab" via visually hidden text supplied by the I18n adapter.
- Never use a link without an accessible name.

## Responsive, touch, motion, forced colours
- Inline links inside prose are exempt from the 44 px rule (WCAG 2.5.8 inline exception); standalone links (lists, footers) get a 44 px tall hit area.
- Colour is the accent of §2.3 and is never the only cue: underlined emphasis keeps the underline; subtle emphasis shows the underline on hover and focus.
- No motion.
- Forced colours: uses `LinkText`, focus uses `Highlight`.

## Acceptance tests
- Given `href="/x"`, when clicked, then the router adapter's navigate is called with "/x" and no full page reload occurs.
- Given an absolute URL to another origin, when rendered, then it opens in a new context with `rel` including noopener and the external text is present.
- Given no `href` and an `onPress`, when Space is pressed, then `onPress` fires and the element has the button role.
- Given `current`, when rendered, then `aria-current="page"` is set.
- Given `emphasis="subtle"`, when focused, then an underline or focus ring is visible.
- Given a modified click (Ctrl/Cmd), when clicked, then the browser's default new-tab behaviour is preserved.
