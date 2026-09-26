Wave 2 · Feedback · Status: specified

# HttpErrorPage

## Purpose
Whole-page states for "not found" (404), "bad request" (400) and "server error" (5xx) outside the normal app frame or when a route cannot render.

## Anatomy
- **Status code**: large number, Serif per §2.2 display, decorative duplication of the title.
- **Illustration**: optional, decorative; the design direction prefers a lucide icon at most (§2.12, no illustrations), so the default is an icon.
- **Title** (h1) and **message** (body-lg, ≤ 60ch).
- **Action slot**: link back home, retry.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| kind | 'not-found' or 'bad-request' or 'server-error' | required | Selects code, icon and default copy key. |
| title | string | from i18n per kind | Heading. |
| message | string | from i18n per kind | Explanation in plain language. |
| action | ReactNode | none | Buttons or links. |
| problemType | string | none | Optional problem+json type, shown in Mono meta (§2.12). |

## States
One per kind. No interactive state beyond the action slot.

## Keyboard and ARIA
- The page has a `main` landmark and one h1 (the title). The numeric code is hidden from assistive technology or included in the title ("Error 404: page not found"), never read twice.
- Focus moves to the h1 on mount after client-side navigation.
- No APG pattern; action uses Button/Link.

## Responsive, touch, motion, forced colours
- Centred single column; action targets 44 px.
- No animation.
- Forced colours: icon uses `CanvasText`.

## Acceptance tests
- Given kind not-found and no title, then the default localised title is shown as the only h1.
- Given a custom message, then it replaces the default.
- Given `problemType`, then it appears as monospace metadata.
- Given client-side navigation to the page, then focus is on the heading.
- The accent is never used as an error colour (§2.3).

## Open questions
- The fork offers a caller-chosen accent colour for the code; dropped in favour of the neutral ink.
