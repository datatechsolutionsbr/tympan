# ConnectorInsertMenu

Wave 3 · canvas · Status: specified

## Purpose
A small searchable menu that opens at the middle of a connector and lets a person pick which step kind to insert there.

## Anatomy
- **Search field** at the top, focused on open.
- **Option list**: each option shows the kind icon in its tone bubble and the kind label from NodeKindCatalog (falling back to the provided label).
- **Empty message** when no option matches.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| anchor | { x, y } | required | canvas point the menu centres on |
| options | { kind, label }[] | required | host-curated insertable kinds (start and end kinds excluded) |
| onSelect | (kind) => void | required | called with the chosen kind, then the menu closes |
| onClose | () => void | required | outside press or Esc |
| labels | { search, empty } | i18n | placeholder and empty text |

Filtering is case-insensitive substring matching on the displayed label.

## States
Open with all options; filtered; no matches; closed.

## Keyboard and ARIA
APG Combobox pattern with a listbox popup; RAC ComboBox (or RAC Autocomplete with a Menu). Arrow keys move the active option, Enter selects, Esc closes and returns focus to the connector (or its insert button). The search field has a visible or accessible label. The list announces the number of results. Outside pointer press closes the menu.

## Responsive, touch, motion, forced colours
- Options have 44 px rows. On narrow screens the menu opens as a bottom drawer.
- Reduced motion: opens without scaling. Reduced transparency: opaque level-3 surface (§2.5).
- Forced colours: active option shown with system highlight.

## Acceptance tests
- Given the menu opens, when rendered, then the search field has focus.
- Given "cod" typed, when filtering, then only options whose label contains "cod" remain.
- Given no match, when filtering, then the empty message is shown and Enter does nothing.
- Given ArrowDown then Enter, when pressed, then onSelect receives the first option's kind and the menu closes.
- Given Esc, when pressed, then onClose is called and focus returns to the invoking control.
- Given a press outside the menu, when it happens, then onClose is called.
