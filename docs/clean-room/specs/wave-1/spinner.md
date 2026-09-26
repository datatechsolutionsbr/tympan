# Spinner

Wave 1 · feedback · Status: specified

## Purpose
Indicate indeterminate work in a small area, chiefly inside a button that is submitting (design direction §2.12: never as a loose page loader), plus a blocking overlay variant for a region that cannot be used while it saves.

## Anatomy
- **Indicator**: a rotating ring (default) or three pulsing dots.
- **Label**: optional visible text next to or below the indicator; always present as accessible text.
- **Overlay** (overlay variant): covers a region with a translucent layer and centres a small raised card holding the indicator and label.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| label | string | from I18nAdapter ("Loading") | accessible name; visible when `showLabel` |
| showLabel | boolean | false | render the label visibly |
| size | 'small' \| 'medium' \| 'large' | 'medium' | small fits inline text and buttons |
| shape | 'ring' \| 'dots' | 'ring' | indicator form |
| tone | 'inherit' \| 'accent' \| 'on-accent' \| 'neutral' | 'inherit' | inherit uses the current text colour, on-accent is for solid buttons |
| overlay | boolean | false | render as a blocking overlay for the parent region |
| visible | boolean | true | overlay only: whether it is shown |

## States
- spinning; reduced motion (static indicator plus label); overlay shown or hidden.

## Keyboard and ARIA
- APG: no widget pattern. RAC primitive: `ProgressBar` with `isIndeterminate` (gives `role="progressbar"` without a value), or a `role="status"` region when the label must be announced.
- Inline in a button: the button gets `aria-busy="true"` and keeps its name; the spinner itself is hidden from assistive tech to avoid double announcements.
- Overlay: the covered region is `aria-busy` and inert; the overlay contains a polite status with the label; it does not steal focus.

## Responsive, touch, motion, forced colours
- Rotation or pulse stops entirely with `prefers-reduced-motion`; the label (visible or via status) carries the meaning.
- Overlay layer uses the backdrop of §2.5 level 4 at reduced strength; reduced transparency makes the card opaque.
- Forced colours: the indicator uses `CanvasText`/`ButtonText` so it stays visible.
- Not interactive, no touch target.

## Acceptance tests
- Given a spinner with label "Saving", Then an element with role progressbar or status is named "Saving".
- Given reduced motion, Then no rotation or pulse animation runs.
- Given a button in submitting state, Then the button has `aria-busy="true"`, keeps its accessible name, and the spinner is not separately announced.
- Given `overlay` and `visible`, Then the covered region is `aria-busy` and its controls cannot be focused.
- Given `overlay` and `visible` false, Then nothing is rendered.
- Given `tone` inherit inside red text, Then the indicator follows the text colour.
