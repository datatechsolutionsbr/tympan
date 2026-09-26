# ErrorState

Wave 1 · feedback · Status: specified

## Purpose
Tell the person, in plain language, that a page or a block failed to load, what kind of failure it was, and offer a retry and a way back (design direction §2.12).

## Anatomy
- **Icon**: chosen by kind; decorative.
- **Status code** (optional): shown as small metadata, not as a giant number.
- **Title**: h2 at page level.
- **Message**: the API's error sentence rewritten in common language.
- **Problem type** (optional): the problem+json `type` in monospace meta text.
- **Details disclosure** (optional): expandable technical details.
- **Actions**: "Try again" (with busy state while retrying) and a secondary action such as "Go back".

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| kind | 'generic' \| 'network' \| 'server' \| 'permission' \| 'not-found' \| 'conflict' | 'generic' | selects icon and default copy |
| title | string | from kind | heading |
| message | string | from kind | explanation |
| statusCode | number | none | HTTP status shown as metadata |
| problemType | string | none | problem+json type identifier |
| details | string | none | technical details inside a disclosure |
| onRetry | () => void \| Promise<void> | none | shows "Try again"; while a returned promise is pending the button is busy |
| secondaryAction | { label: string; onPress?: () => void; href?: string } | none | way back |
| scope | 'page' \| 'block' | 'page' | page fills the sheet; block replaces only the failed part (partial failure) |
| labels | { retry, details } | from I18nAdapter | strings |

## States
- idle, retrying (button busy and disabled), details expanded or collapsed.
- Never rendered inside a new card: it sits inside the existing sheet or block.

## Keyboard and ARIA
- APG: **Disclosure** for the details toggle; buttons follow the Button pattern. RAC: `Button`, `Disclosure` + `DisclosurePanel`.
- Page scope: container has `role="alert"` only when the error appears after the page was already shown; on first render the title receives focus instead (so screen readers read it without a double announcement).
- Block scope: container is a region labelled by the title; no alert role unless newly appeared.
- Retry keeps focus on the button while busy; after success focus goes to the reloaded content's heading (host responsibility, documented).

## Responsive, touch, motion, forced colours
- Actions at least 44 px tall; buttons stack vertically below 640 px.
- Retry is a secondary button; the danger style is not used for retry (§2.10).
- Semantic colour for the icon uses the error colour of §2.3 together with the title text; colour is not the only signal.
- No entrance animation. Forced colours: icon and text use system colours.

## Acceptance tests
- Given kind network and `onRetry`, Then the title and message describe a connection problem and a "Try again" button exists.
- Given `onRetry` returning a pending promise, When pressed, Then the button is disabled and `aria-busy` until the promise settles.
- Given `problemType` and `statusCode` 409, Then both appear as metadata text.
- Given `details`, When the details toggle is activated, Then the details become visible and the toggle has `aria-expanded=true`.
- Given scope block inside a page, Then the rest of the page remains interactive.
- Given an error appearing after data was shown, Then it is announced via an alert.
- Given no `onRetry`, Then no retry button is rendered.
