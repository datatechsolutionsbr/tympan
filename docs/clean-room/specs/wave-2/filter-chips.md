# FilterChips

Wave 2 · form · Status: specified

## Purpose
A row of removable chips that shows which filters are currently applied and lets the person remove any of them.

## Anatomy
- Container row, wrapping onto new lines.
- One chip per active filter: leading icon chosen by filter kind, the filter's text, and an optional remove control.
- Optional trailing "Clear all" action when two or more chips are present.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| filters | { kind: string; value: string; label: string; tone?: Tone }[] | required | Active filters. Identity is `kind` + `value`. |
| onRemove | (filter) => void | none | When present, each chip shows a remove control. |
| onClearAll | () => void | none | When present and there are two or more chips, shows "Clear all". |
| kindIcons | Record<string, Icon> | neutral filter icon | Icon per filter kind; unknown kinds use the default entry. |
| removeLabel | (label: string) => string | host i18n "Remove {label}" | Accessible name of each remove control. |
| groupLabel | string | host i18n "Active filters" | Accessible name of the chip group. |
| tone | neutral, accent, or a categorical token | neutral | Visual tint of a chip (§2.3: categorical colour only as a small marker). |

## States
- Chip rest, hover on the remove control, focus-visible on the remove control, removed (leaves the row).
- Empty: component renders nothing (the host shows its own "no filters" text if wanted).

## Keyboard and ARIA
- APG pattern: none dedicated; a labelled group of buttons. Backed by RAC `TagGroup` with `onRemove` (gives Backspace/Delete removal and arrow navigation among tags).
- Role group named by `groupLabel`. Each remove control is a button with the name from `removeLabel`.
- After a chip is removed, focus moves to the next chip, or the previous one, or to the group's following focusable element when none remain.
- Removing a chip announces "{label} removed" in a polite live region.

## Responsive, touch, motion, forced colours
- Chip visible height may be small (pill, §2.4) but each remove control has a 44 × 44 hit area.
- Enter and exit of chips: opacity only, `--fk-dur-quick`; none with reduced motion.
- Reduced transparency: chips opaque; no blur on chips (they sit inside a sheet, §2.5).
- Forced colours: chip outline in system border colour; icons use text colour.

## Acceptance tests
- Given two filters and onRemove, When rendered, Then two remove buttons exist named "Remove Brazil" and "Remove 2024".
- Given the person activates "Remove Brazil", Then onRemove receives the Brazil filter and focus moves to the "2024" chip.
- Given focus on a chip, When Delete is pressed, Then that chip's filter is passed to onRemove.
- Given no onRemove, When rendered, Then no remove controls exist.
- Given a filter of unknown kind, When rendered, Then the default icon is shown.
- Given an empty list, When rendered, Then nothing is in the document.
