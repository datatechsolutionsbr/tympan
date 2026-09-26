# ThemeSwitcher

Wave 2 · form · Status: specified

## Purpose
Switch the interface between light and dark appearance, as a labelled switch with sun and moon glyphs or as a compact icon button.

## Anatomy
- Full variant: sun glyph, switch, moon glyph, visible text label.
- Compact variant: icon button showing the glyph of the mode it will switch to.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| mode | "light" or "dark" | required | Current appearance. |
| onModeChange | (mode) => void | required | Requests the other mode. |
| variant | "full" or "compact" | "full" | Presentation. |
| label | string | host i18n "Dark mode" | Stable name of the switch (full variant). |
| toLightLabel, toDarkLabel | string | host i18n "Switch to light mode" / "Switch to dark mode" | Names of the compact button. |

## Behaviour
- Full variant: the switch is on when the mode is dark. The glyph of the active mode is emphasised; the other is de-emphasised.
- Compact variant: the button names the action it will perform.
- The component does not persist or apply the theme; the host does (and should honour the system preference until the person chooses).

## States
Off (light), on (dark), hover, focus-visible, disabled.

## Keyboard and ARIA
- Full variant: APG Switch. Backed by RAC `Switch`; Space toggles. Its accessible name is constant ("Dark mode"); the state is conveyed by checked, not by changing the name.
- Compact variant: APG Button. Backed by RAC `Button`; name describes the action.
- Glyphs are decorative.

## Responsive, touch, motion, forced colours
- Hit area at least 44 × 44 for both variants.
- Glyph emphasis and the switch thumb move with `--fk-dur-quick`; no rotation or spring (§2.7); instant with reduced motion.
- Forced colours: switch track outline and thumb in system colours; on state indicated by thumb position and a check mark inside the thumb.

## Acceptance tests
- Given mode light and variant full, When rendered, Then a switch named "Dark mode" is unchecked.
- Given the switch is toggled, Then onModeChange receives "dark".
- Given mode dark and variant compact, When rendered, Then a button named "Switch to light mode" exists; When activated, onModeChange receives "light".
- Given reduced motion, When toggled, Then no animation runs.

## Open questions
- The fork changed the switch's accessible name with its state; this spec keeps a stable name and uses the checked state instead.
