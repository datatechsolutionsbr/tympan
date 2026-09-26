# CategoryTabs

Wave 2 · navigation · Status: specified

## Purpose
A row of short, colour-marked category buttons (code plus name) of which one may be the current filter; plus a small static label that shows a category's code.

## Anatomy
- Row of category buttons. Each: colour marker (shown when selected), short code in emphasis, full name with the code removed when the name begins with it.
- Category label (static): colour marker and code, in two sizes.

## Properties and events
Row:
| Name | Type | Default | Meaning |
|---|---|---|---|
| items | { key: string; value?: string; code: string; name: string; marker: categorical token }[] | required | Categories. `value` overrides `key` as the reported selection. |
| selected | string or null | required | Current selected value. |
| onSelect | (value: string) => void | required | Called with the item's value (or key). |
| label | string | required | Name of the group. |
| allowNone | boolean | false | When true, activating the selected item reports null to clear the filter. |

Category label:
| Name | Type | Default | Meaning |
|---|---|---|---|
| code | string | required | Short code. |
| name | string | none | Full name, used as accessible name when present. |
| marker | categorical token | required | Colour marker (§2.3: small square or dot only). |
| size | "small" or "medium" | "medium" | Two density steps. |

## Behaviour
- If removing the code from the name leaves nothing, the full name is shown.
- Activation does not bubble to an enclosing clickable row (the button handles its own activation).

## States
Rest (reduced emphasis), hover, focus-visible, selected (full emphasis, marker, border), disabled.

## Keyboard and ARIA
- These filter a view rather than swap panels, so they are not tabs. APG pattern: Radio Group (single choice). Backed by RAC `ToggleButtonGroup` with single selection (or `RadioGroup`).
- Arrow keys move between categories; Space or Enter selects.
- Colour marker is decorative; the code and name are the accessible name.

## Responsive, touch, motion, forced colours
- Row scrolls horizontally on phones with a visible edge fade; buttons at least 44 × 44.
- Colour change only; none with reduced motion.
- Forced colours: selected category shows a system-highlight border.

## Acceptance tests
- Given items with code "PT" and name "PT Portugal", When rendered, Then the button shows "PT" and "Portugal".
- Given code "PT" and name "PT", When rendered, Then the full name "PT" is shown in the name slot.
- Given an item with value "pt-v" and key "pt", When activated, Then onSelect receives "pt-v"; and it is shown selected when selected is "pt-v".
- Given the row sits inside a clickable card, When a category is activated, Then the card's handler is not called.
- Given a category label of size small, When rendered, Then it shows the same content as medium.

## Open questions
- The fork named these "tabs" but they select a filter value; the spec uses group semantics, not tablist.
