# FederatedSignIn

Wave 2 · form · Status: specified

## Purpose
Offer "Continue with {provider}" buttons for external identity providers on sign-in and sign-up screens.

## Anatomy
- Stack or row of provider buttons. Each button: provider glyph (decorative) and the text "Continue with {Provider name}".
- Busy indicator inside the button of the provider in progress.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| providers | { id: string; name: string; glyph?: Icon }[] | required | Providers to offer, in order. The host supplies names and glyphs (see note). |
| onSelect | (id: string) => void | required | Called when a provider is chosen. |
| arrangement | "stack" or "row" | "stack" | Stack: full-width buttons one per line. Row: side by side. |
| busyId | string or null | null | Provider currently redirecting. |
| disabled | boolean | false | Disables every button. |
| actionLabel | (name: string) => string | host i18n "Continue with {name}" | Button text. |

## Behaviour
- While a provider is busy, its button shows a spinner and is busy, and all other buttons are disabled.
- Buttons use the secondary emphasis (§2.10); none is the primary action of the screen.

## States
Rest, hover, focus-visible, pressed, busy, disabled.

## Keyboard and ARIA
- APG pattern: Button. Backed by RAC `Button` (uses `isPending` for the busy state, which keeps focus and announces progress).
- Group of buttons named by the host's heading or an `aria-label` such as "Other ways to sign in".
- Provider glyphs are hidden from assistive technology; the text carries the name.

## Responsive, touch, motion, forced colours
- Row arrangement falls back to stack below 640. Each button at least 44 tall.
- Spinner rotation stops with reduced motion (a static busy glyph and the hidden word "loading" remain).
- Forced colours: button borders in system colours; multicolour glyphs may render in forced colours without losing meaning because the name is text.

## Acceptance tests
- Given providers A and B, When rendered, Then two buttons named "Continue with A" and "Continue with B" exist.
- Given B is activated, Then onSelect receives "b".
- Given busyId "a", Then A's button is busy and B's button is disabled.
- Given disabled true, Then all buttons are disabled.
- Given arrangement "row" at a phone width, Then buttons stack.

## Note
Provider logos are third-party trademarks. The library ships neutral glyphs only; hosts that need official marks supply them under each provider's brand guidelines.
