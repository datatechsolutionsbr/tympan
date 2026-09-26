Wave 2 · Layout · Status: specified

# AmbientBackdrop

## Purpose
A fixed, decorative background layer of two soft glows so glass surfaces have something to show through (§2.5 "Ambient").

## Anatomy
- **Upper glow**: teal, near the top.
- **Lower glow**: sky, near the bottom.
Values (opacities per theme) come from §2.5.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| (none) | | | The component has no options; theme is read from the colour-scheme context. |

## States
Light theme; dark theme; hidden (reduced transparency, or backdrop blur unsupported).

## Keyboard and ARIA
- `aria-hidden`, not focusable, does not intercept pointer events.
- No APG pattern.

## Responsive, touch, motion, forced colours
- Fixed to the viewport, behind all content; never causes horizontal scroll.
- No animation at any time (§2.5).
- Hidden under `prefers-reduced-transparency: reduce`, when backdrop blur is unsupported, and under forced colours.

## Acceptance tests
- Given the page, then the backdrop is hidden from the accessibility tree and ignores clicks.
- Given reduced transparency, then the backdrop is not displayed.
- Given a 375 px viewport, then the document has no horizontal overflow.
- Given dark theme, then the dark-theme intensities apply.
