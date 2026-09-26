Wave 2 · Utility · Status: specified

# ViewTransition

## Purpose
Wraps a state or route update in the browser's native view transition when safe, and applies it instantly otherwise.

## Contract
- `runWithTransition(update, options)` returns a handle `{ finished: Promise<void>; skip(): void }`.
- A hook returns a stable `runWithTransition` and `isSupported`.
- `supportsViewTransitions()` feature-detects and is safe during server rendering.
- Falls back to calling `update` directly (handle resolves after the update) when: no native support, reduced motion, `skipAnimation`, or no document.
- While a transition runs, the root element carries a marker naming the kind, so transition styles apply only then; the marker is removed when the transition finishes, is skipped or fails.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| update | () => void or Promise<void> | required | The change to apply. |
| options.kind | 'fade' or 'slide' | 'fade' | Style of transition (durations from §2.7). |
| options.skipAnimation | boolean | false | Force the instant path. |

## States
Idle; running (marker present); finished.

## Keyboard and ARIA
Not applicable. After a route transition, focus management remains the router's job (move focus to the new h1).

## Responsive, touch, motion, forced colours
- Reduced motion always takes the instant path.
- The slide kind mirrors in right-to-left layouts.

## Acceptance tests
- Given no native support, when called, then `update` runs once synchronously and `finished` resolves.
- Given reduced motion, then the native API is not called.
- Given support, then the root marker is set during the transition and removed after `finished`, including when `skip()` is called or the transition rejects.
- Given the hook, then the returned function identity is stable across renders.
