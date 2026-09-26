Wave 2 · Utility · Status: specified

# Haptics

## Purpose
A small wrapper that plays a named vibration pattern on devices that support it, and does nothing elsewhere.

## Contract
- A hook returning `{ play(pattern), cancel(), isSupported }` and a standalone `play(pattern)` usable outside components.
- `pattern` is one of: `tap` (lightest), `impact`, `heavy`, `success`, `warning`, `error`, `selection`. Each maps to a short vibration pattern chosen by the implementer (brief, never longer than a fraction of a second).
- `play` returns `true` when the platform accepted the request, `false` otherwise; it never throws.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| pattern | HapticPattern | 'tap' | Pattern to play. |
| enabled | boolean | true unless the person turned haptics off in app preferences | Global switch provided by the host. |

## States
Supported or unsupported (server rendering, desktop, browsers without vibration).

## Keyboard and ARIA
Not applicable. Haptics never carry information on their own; every haptic is paired with a visible or announced change.

## Responsive, touch, motion, forced colours
- Honour a host "reduce haptics" preference; when reduced motion is on, only `success`, `warning` and `error` play.
- Must be callable only in response to a user gesture (browsers block otherwise); failure is silent.

## Acceptance tests
- Given no vibration support, when `play` is called, then it returns false and does not throw.
- Given support, when `play('success')` is called, then the platform vibration is requested once.
- Given `cancel`, then any running vibration is stopped.
- Given server rendering, then importing and calling it does not throw.
