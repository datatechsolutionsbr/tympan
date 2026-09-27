# Carousel

Wave 5 · data display · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Show a set of slides (images, cards, onboarding steps) one or a few at a time, with previous and next controls, swipe and keyboard. Never auto-advances unless the host asks, and then always with a pause control.

## Anatomy
- **Region** (named) containing:
- **Viewport** and a **track** of **slides**.
- **Previous** and **next** buttons.
- **Position indicator** (optional): PageDots or "3 of 8" text.
- **Play or pause** button (only with auto-advance).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label | string | required | Name of the carousel ("Product photos"). |
| slides | nodes, or items with a render function | required | Slides in order. |
| slideLabel | (index, total) => string | from i18n ("{n} of {total}") | Name of each slide. |
| index / defaultIndex / onIndexChange | number | 0 | Current first visible slide. |
| slidesPerView | number or 'auto' | 1 | How many are visible; `auto` lets slide widths decide. |
| slidesPerMove | number | 1 | How far one step moves. |
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | Scroll axis. |
| loop | boolean | false | Wraps from last to first. |
| align | 'start' \| 'centre' | 'start' | Snap alignment of the current slide. |
| indicator | 'none' \| 'dots' \| 'count' | 'dots' | Position indicator. |
| autoAdvance | 'off' or a named interval ('slow' \| 'regular') | 'off' | Auto-advance; stops on hover, focus inside, touch, and under reduced motion. |
| showControls | boolean | true | Previous and next buttons. |
| onApi | (api) => void | none | Gives `next`, `previous`, `goTo(index)`, `canPrevious`, `canNext`. |

## States
At start (previous disabled unless looping), middle, at end (next disabled unless looping), dragging, auto-advancing, paused.

## Keyboard and ARIA
- No RAC primitive; APG **Carousel** pattern (basic, with optional rotation control).
- Container: `section` with `aria-roledescription="carousel"` and the label. Each slide: `role="group"` with `aria-roledescription="slide"` and `slideLabel`.
- Previous and next are RAC `Button`s with names from i18n and `aria-controls` the track; disabled at the ends when not looping (they stay focusable with `aria-disabled` so focus is not lost).
- When the carousel has focus inside, Arrow Left and Right (Up and Down when vertical) move by `slidesPerMove`, following reading direction.
- Slides out of view are `inert` so Tab does not reach hidden content.
- With auto-advance, the live region is `off` while rotating and `polite` when paused or moved by the user; the play or pause button is first in the tab order.
- Indicator dots, when present, are buttons named "Go to slide {n}" with `aria-current` on the active one.

## Responsive, touch, motion, forced colours
- Horizontal swipe and trackpad scroll move slides with snapping; a small drag does not activate links inside slides.
- Controls meet `--ty-control-target`; on narrow screens they sit below the track instead of overlapping it.
- Slide movement eases with `--ty-dur-base` and `--ty-ease-out`; under reduced motion it jumps and auto-advance never starts.
- Controls use Button quiet or secondary variants; gaps between slides `--ty-space-4`.
- Forced colours: control borders in `ButtonText`; current dot in `Highlight`.

## Acceptance tests
- Given 5 slides and focus inside, when Arrow Right is pressed, then slide 2 is current and `onIndexChange(1)` fires.
- Given the first slide and no loop, then previous is `aria-disabled`; given `loop`, then previous moves to the last slide.
- Given `slidesPerView` 3, then slides beyond the third are inert.
- Given each slide, then it is announced as "{n} of 5".
- Given auto-advance, when focus enters the carousel, then rotation pauses.
- Given reduced motion and auto-advance requested, then no automatic rotation happens.
- Given right-to-left direction, when Arrow Right is pressed, then the previous slide becomes current.
- Given `onApi`, when `goTo(3)` is called, then slide 4 is current.
