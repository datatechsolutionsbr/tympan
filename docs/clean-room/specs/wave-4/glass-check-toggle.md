# GlassCheckToggle

Wave 4 · utility (developer only) · Status: specified

## Purpose
A developer aid that switches the page into a "glass check" mode in which the page background becomes a loud, obviously wrong test colour. Any surface meant to be translucent (§2.5 levels 1, 3 and 4) should then visibly tint towards that colour; a surface that stays neutral is secretly opaque. It is never rendered in production builds.

## Anatomy
- **Toggle button**: small icon button with a visible short word, pressed state visible.
- **Root marker**: a flag set on the document root while the mode is on; the library stylesheet reacts to it by replacing `--fk-bg` with a reserved test colour token (`--fk-debug-glass-check`) and making the body background transparent.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| enabled | boolean | the host's development flag | When false the component renders nothing and never touches the document. |
| defaultOn | boolean | false | Initial state. |
| onChange | (on: boolean) => void | none | Notification. |
| label | string | from I18nAdapter | Accessible and visible name. |

The library does not read build environment variables itself; the host passes `enabled` (for example from its own development flag). EnvironmentBanner (wave 2) may embed this toggle.

## States
Hidden (not enabled); off; on (pressed). Unmounting while on removes the root marker.

## Keyboard and ARIA
- RAC `ToggleButton` (APG Button, toggle variant) with `aria-pressed`.
- Name from `label`; the icon is decorative.

## Responsive, touch, motion, forced colours
- 44 px target.
- No animation on switching.
- Under `prefers-reduced-transparency` or forced colours the check is meaningless (surfaces are opaque by design); the toggle stays available but a tooltip says the check does not apply in this mode.

## Acceptance tests
- Given enabled false, when rendered, then nothing is output and the root has no marker.
- Given enabled true, when pressed, then the root marker is set and `aria-pressed` is true.
- Given the mode is on, when the component unmounts, then the marker is removed.
- Given a surface at level 1 over the page, when the mode is on, then its computed background differs from the one with the mode off (visual regression test).
- Given a production build of the example app, when searched, then the toggle is absent.
