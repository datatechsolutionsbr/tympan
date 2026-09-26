Wave 2 · Feedback · Status: specified

# PullToRefresh

## Purpose
A scroll container that refreshes its content when pulled down from the top on touch, with a progress indicator, plus a hook for custom containers.

## Anatomy
- **Container**: scrollable region wrapping content.
- **Indicator**: appears above content while pulling; two looks: a ring that fills with pull progress and becomes a spinner while refreshing, or three dots.
- **Refresh button** (non-gesture alternative): a visible or toolbar-provided "Refresh" button the host is required to supply elsewhere; the component exposes `refresh()` for it.
- **Hook**: returns pull distance, progress (0–1), whether armed, whether refreshing, a container ref, and `refresh()`.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| onRefresh | () => Promise<void> | required | Work to do; indicator stays until it settles. |
| enabled | boolean | true | Turns the gesture off. |
| threshold | number (CSS px) | a design-token distance | Pull distance that arms the refresh. |
| maxPull | number (CSS px) | larger than threshold | Resistance cap. |
| indicator | 'ring' or 'dots' or (state) => ReactNode | 'ring' | Indicator look or custom render. |
| label | string | from i18n | Announced while refreshing. |

## States
Idle; pulling (below threshold); armed (past threshold, haptic once); refreshing; settled (success or failure; failure does not throw out of the component, host shows its own notice).

## Keyboard and ARIA
- The gesture is touch-only; the host must provide a keyboard- and pointer-operable refresh control (WCAG 2.5.1), which calls the same `refresh()`.
- While refreshing, the container has `aria-busy` and a polite live region announces `label`; completion announces nothing unless the host adds a message.
- No APG pattern; indicator may be backed by RAC `ProgressBar` (determinate while pulling, indeterminate while refreshing).

## Responsive, touch, motion, forced colours
- Only activates when the container is scrolled to the very top and the drag is downward.
- Pull has diminishing resistance; refresh cannot start twice concurrently.
- Reduced motion: content does not slide; the indicator appears in place and the spinner is replaced by a static "refreshing" state.
- Forced colours: indicator drawn in `CanvasText`.

## Acceptance tests
- Given scroll position at top, when pulled past the threshold and released, then `onRefresh` is called once and the container is busy until it resolves.
- Given a pull below threshold, when released, then nothing is called and the indicator hides.
- Given the container is scrolled down, when dragging down, then no pull starts.
- Given a refresh in progress, when pulled again, then no second call happens.
- Given `onRefresh` rejects, then the busy state clears.
- Given `refresh()` is called from a button, then the same states occur without a gesture.
