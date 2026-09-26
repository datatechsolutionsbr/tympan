Wave 2 · Feedback · Status: specified

# BrandLoader

## Purpose
The first-paint loading screen of an app (before the frame is ready), showing the brand mark and an optional loading phrase; also usable in a compact inline form.

## Anatomy
- **Mark**: the BrandMark icon.
- **Name**: product name.
- **Activity indicator**: a gentle, non-spinning pulse of opacity (§2.12 says no loose spinner).
- **Label**: loading phrase, optional.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| name | string | "Fakhir" from brand | Product name. |
| mark | ReactNode | brand icon | Replaces the mark. |
| label | string | none | Loading phrase, announced politely. |
| layout | 'fullscreen' or 'inline' | 'fullscreen' | Covers the viewport or sits in flow. |

## States
Loading only; the host unmounts it when ready.

## Keyboard and ARIA
- Container has role `status` with the label (or a localised "Loading" when absent) as its text; the mark and indicator are hidden from assistive technology.
- In fullscreen layout the rest of the page is not yet rendered, so no focus management is required; nothing inside is focusable.
- No APG pattern; RAC `ProgressBar` in indeterminate mode is an acceptable backing if a progress role is preferred.

## Responsive, touch, motion, forced colours
- Fullscreen layout fills the dynamic viewport height and uses `--fk-bg`.
- Pulse uses opacity only and stops under reduced motion (static mark and label).
- Forced colours: mark keeps its outline; name uses `CanvasText`.

## Acceptance tests
- Given a label, then a status element contains the label text.
- Given no label, then the status element contains the localised loading word.
- Given reduced motion, then no element has a running animation.
- Given inline layout, then the loader does not cover the viewport.

## Open questions
- Presets for other products (other gradients) are dropped; one brand only.
