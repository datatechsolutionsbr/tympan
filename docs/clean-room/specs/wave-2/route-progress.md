Wave 2 · Feedback · Status: specified

# RouteProgress

## Purpose
A thin indeterminate bar at the top of the viewport while a client-side navigation is pending.

## Anatomy
- **Track**: invisible.
- **Bar**: accent-coloured strip that advances while pending and completes when the route settles.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| pending | boolean | from router adapter | Whether a navigation is in flight. |
| delay | number (ms) | a short token | Do not show for navigations that finish sooner. |
| label | string | from i18n | Announced text ("Loading page"). |

## States
Hidden; pending (advancing); completing (fills and fades); hidden again.

## Keyboard and ARIA
- The bar is `aria-hidden`; a visually hidden polite live region announces `label` once per navigation if it lasts longer than the delay. It never steals focus.
- RAC `ProgressBar` (indeterminate) may back it; APG "no pattern" (live region guidance).

## Responsive, touch, motion, forced colours
- Sits above the sticky top bar (§2.8) without covering focus rings.
- Reduced motion: no advancing animation; the bar appears at a fixed partial width and disappears on completion.
- Forced colours: bar uses `Highlight`.

## Acceptance tests
- Given a navigation that settles before the delay, then the bar never appears.
- Given a long navigation, then the bar appears and the live region announces once.
- Given completion, then the bar is removed and nothing remains focusable.
- Given reduced motion, then no animation runs.
