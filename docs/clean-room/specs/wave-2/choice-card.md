# ChoiceCard

Wave 2 · form · Status: specified

## Purpose
A selectable card used in pickers (plan, persona, model, provider, tool) that shows an icon, a name and optionally a description, and marks itself when chosen.

## Anatomy
- Card surface.
- Icon well (optional).
- Name, with an optional trailing slot for a small tag.
- Description (only in the horizontal arrangement).
- Selected mark (check glyph).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| selected | boolean | required | Whether this option is chosen. |
| onSelect | () => void | required | Activation handler. |
| label | string | required | Name and accessible name. |
| description | string | none | Secondary line; shown in the horizontal arrangement and used as accessible description in both. |
| icon | Icon | none | Leading glyph. |
| arrangement | "stacked" or "inline" | "stacked" | Stacked: icon above a centred name. Inline: icon left, name and description right. |
| available | boolean | true | When false the option cannot be chosen (e.g. incompatible with the current provider). |
| unavailableReason | string | none | Text explaining why; shown as description and tooltip when `available` is false. |
| trailing | node | none | Small tag next to the name (e.g. "recommended"). |

## States
Rest, hover, focus-visible, pressed, selected (accent-soft fill, accent border, check mark), unavailable (reduced emphasis plus reason text; not focusable as a choice but still discoverable).

## Keyboard and ARIA
- When the cards form a single-choice set, the parent uses APG Radio Group: RAC `RadioGroup` with each card a `Radio` rendered as a card. Arrow keys move and select; Tab leaves the group.
- When used alone or in a multi-choice set, APG Button (toggle) via RAC `ToggleButton` with `aria-pressed`.
- Unavailable cards are `aria-disabled` with the reason in `aria-describedby`, so screen-reader users learn why.

## Responsive, touch, motion, forced colours
- Minimum target 44 × 44; stacked cards grow to fill grid cells; inline cards take full width below 640.
- Selection change: colour only, `--fk-dur-instant`; no scale.
- Reduced transparency: opaque surface.
- Forced colours: selected card has a system-highlight border and the check mark is always visible.

## Acceptance tests
- Given three cards in a radio group with the second selected, When the person presses ArrowDown on the second, Then the third becomes selected.
- Given a card with available=false and a reason, When focused through the group, Then it is announced as unavailable with the reason and activation does nothing.
- Given arrangement "inline" and a description, When rendered, Then the description is visible; in "stacked" it is not visible but remains the accessible description.
- Given selected=true, When rendered, Then a check mark is visible and the card is reported checked or pressed.

## Open questions
- The fork accepted per-card gradient strings for the selected icon well; dropped in favour of the single accent (§2.3).
