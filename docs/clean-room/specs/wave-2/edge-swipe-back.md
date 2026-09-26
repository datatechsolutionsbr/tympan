Wave 2 · Navigation · Status: specified

# EdgeSwipeBack

## Purpose
On touch devices, lets people go back by swiping from the start edge of the screen, with a small arrow cue that follows the finger.

## Anatomy
- **Provider**: listens for touches starting in a narrow edge zone and wraps the app.
- **Cue**: a round chip with a back arrow that appears after a small drag and moves with progress.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| enabled | boolean | true | Turns the gesture on or off. |
| onBack | () => void | router adapter back | Called when the swipe completes. |
| edgeZone | number (CSS px) | a narrow token | Width of the start-edge zone. |
| commitDistance | number (CSS px) | a token | Horizontal distance needed to go back. |

## States
Idle; tracking (cue visible, progress 0–1); cancelled (vertical movement dominates, or finger lifted early); committed (haptic, `onBack`).

## Keyboard and ARIA
- Enhancement only. The app must always offer a visible back control or browser back; this component adds no focusable element.
- The cue is `aria-hidden`.
- In right-to-left layouts the start edge is the right edge and the arrow mirrors.
- No APG pattern; no RAC primitive; custom (RAC `useMove` acceptable).

## Responsive, touch, motion, forced colours
- Active only for touch input; disabled when a modal, drawer or canvas has captured the gesture (host sets `enabled=false`), so it never fights the workflow canvas.
- Does not interfere with the operating system's own edge gesture; if the platform already provides back swipe (installed app), the host disables it.
- Reduced motion: cue appears without sliding.
- Forced colours: cue has a border and `CanvasText` arrow.

## Acceptance tests
- Given a touch starting inside the edge zone that moves past the commit distance horizontally, when lifted, then `onBack` is called once.
- Given the same touch moves mostly vertically, then nothing is called.
- Given a touch starting outside the zone, then no cue appears.
- Given `enabled=false`, then no listeners are active.
- Given a right-to-left document, then only the right edge triggers.
